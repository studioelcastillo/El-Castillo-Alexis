import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RunScraperDto {
  site: string;
  date: string;
  username: string;
  password: string;
  std_id?: number;
}

export interface ScraperResult {
  jobId?: string;
  status: 'started' | 'error';
  message: string;
  pid?: number;
}

export interface ScrapingScreenshotRecord {
  id: string;
  attemptNumber: number;
  stage: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  errorType: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  currentUrl: string | null;
  screenshotPath: string | null;
  screenshotUrl: string | null;
}

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly supabase: SupabaseClient;
  private readonly screenshotBucket: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.screenshotBucket = this.configService.get<string>('SCRAPING_DEBUG_BUCKET') || 'scraping-debug';
  }

  async getJobScreenshots(jobId: string): Promise<ScrapingScreenshotRecord[]> {
    const { data, error } = await this.supabase
      .from('scraping_attempts')
      .select('id, attempt_number, stage, started_at, ended_at, duration_ms, error_type, error_code, error_message, current_url, screenshot_path')
      .eq('job_id', jobId)
      .order('started_at', { ascending: false });

    if (error) {
      this.logger.error(`[Scraping] Failed to list screenshots for ${jobId}: ${error.message}`);
      return [];
    }

    const attempts = data || [];
    const signedUrls = await Promise.all(
      attempts.map(async (attempt: any) => {
        if (!attempt.screenshot_path) return null;

        const signed = await this.supabase.storage
          .from(this.screenshotBucket)
          .createSignedUrl(attempt.screenshot_path, 60 * 60);

        if (signed.error) {
          this.logger.warn(`[Scraping] Could not sign screenshot ${attempt.screenshot_path}: ${signed.error.message}`);
          return null;
        }

        return signed.data.signedUrl;
      }),
    );

    return attempts.map((attempt: any, index: number) => ({
      id: attempt.id,
      attemptNumber: attempt.attempt_number,
      stage: attempt.stage,
      startedAt: attempt.started_at,
      endedAt: attempt.ended_at,
      durationMs: attempt.duration_ms,
      errorType: attempt.error_type,
      errorCode: attempt.error_code,
      errorMessage: attempt.error_message,
      currentUrl: attempt.current_url,
      screenshotPath: attempt.screenshot_path,
      screenshotUrl: signedUrls[index],
    }));
  }

  /**
   * Spawns the Playwright worker process for the given site.
   * Credentials are passed as arguments and are NEVER stored.
   * The process runs in the background and updates the DB directly via REST calls.
   */
  async runScraper(dto: RunScraperDto): Promise<ScraperResult> {
    const { site, date, username, password, std_id } = dto;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuración de Supabase incompleta (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).');
    }

    // 1. Create the job record in the API before spawning
    let jobId: string | undefined;
    try {
      this.logger.log(`[Scraping] Creating job record for site=${site}...`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/scraping_jobs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          site,
          mode: 'master',
          target_date: date,
          status: 'RUNNING',
          std_id: std_id,
          started_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[Scraping] REST insert error: ${response.status} ${errorText}`);
        throw new Error(`REST Error: ${response.status}`);
      }

      const jobs = await response.json();
      jobId = jobs[0]?.id;
      
      if (!jobId) {
        throw new Error('No Job ID returned from REST call');
      }

      this.logger.log(`[Scraping] Created job record: ${jobId}`);
    } catch (err: any) {
      this.logger.error(`[Scraping] Exception during job creation: ${err?.message || err}`);
      return {
        status: 'error',
        message: `Error al crear el registro del trabajo: ${err?.message || 'Error desconocido'}`,
      };
    }

    // 2. Spawn the worker process
    const siteConfigs = {
      streamate: {
        script: resolve(process.cwd(), '../../scripts/scrapers/streamate/streamate-worker.mjs'),
      }
    };

    const config = siteConfigs[site as keyof typeof siteConfigs];
    if (!config) {
      return { status: 'error', message: `Site ${site} not supported` };
    }

    try {
      this.logger.log(`[Scraping] Spawning worker for jobId=${jobId}...`);
      const spawnArgs = [
        config.script,
        '--date', date,
        '--username', username,
        '--password', password,
        '--job_id', jobId!
      ];
      if (std_id) spawnArgs.push('--std_id', String(std_id));

      const child = spawn('node', spawnArgs, {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env },
      });

      const pid = child.pid;
      child.unref();

      this.logger.log(`[Scraping] Worker spawned (PID: ${pid})`);

      return {
        status: 'started',
        pid,
        jobId,
        message: `Extracción iniciada (PID: ${pid}). ID del trabajo: ${jobId}`,
      };
    } catch (err: any) {
      this.logger.error(`[Scraping] Failed to spawn worker: ${err?.message}`);
      
      // Update job status to FAILED if we couldn't spawn the worker
      if (jobId) {
        await fetch(`${supabaseUrl}/rest/v1/scraping_jobs?id=eq.${jobId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'FAILED_PERMANENT',
            last_error: `Failed to spawn worker: ${err?.message}`,
            finished_at: new Date().toISOString()
          })
        }).catch(e => this.logger.error(`[Scraping] Failed to update job status via REST: ${e.message}`));
      }

      return {
        status: 'error',
        message: `Error al iniciar el worker: ${err?.message}`,
      };
    }
  }
}
