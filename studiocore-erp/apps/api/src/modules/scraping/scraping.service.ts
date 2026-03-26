import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
  }

  /**
   * Spawns the Playwright worker process for the given site.
   * Credentials are passed as arguments and are NEVER stored.
   * The process runs in the background and updates the DB directly.
   */
  async runScraper(dto: RunScraperDto): Promise<ScraperResult> {
    const { site, date, username, password, std_id } = dto;

    // 1. Create the job record in the API before spawning
    let jobId: string | undefined;
    try {
      this.logger.log(`[Scraping] Attempting to create job record for site=${site}...`);
      const { data, error } = await this.supabase
        .from('scraping_jobs')
        .insert({
          site,
          mode: 'master',
          target_date: date,
          status: 'RUNNING',
          std_id: std_id,
          started_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        this.logger.error(`[Scraping] Supabase insert error: ${JSON.stringify(error)}`);
        throw error;
      }
      jobId = data.id;
      this.logger.log(`[Scraping] Created job record: ${jobId}`);
    } catch (err: any) {
      this.logger.error(`[Scraping] Exception during job record creation: ${err?.message || err}`);
      return {
        status: 'error',
        message: `Error al crear el registro del trabajo: ${err?.message || 'Error desconocido'}`,
      };
    }

    // Resolve the worker path relative to the repo root
    const workerPath = resolve(
      __dirname,
      '../../../../../scripts/scrapers/streamate/streamate-worker.mjs',
    );

    this.logger.log(`[Scraping] Spawning worker for site=${site} date=${date} jobId=${jobId}`);

    const args = [
      workerPath,
      '--date', date,
      '--username', username,
      '--password', password,
      '--job_id', jobId!, // Pass the existing Job ID
    ];
    if (std_id) args.push('--std_id', String(std_id));

    try {
      const child = spawn('node', args, {
        detached: true,   // runs independently of the API process
        stdio: 'ignore',  // don't pipe credentials through stdout
        env: { ...process.env },
      });

      // Allow the API process to exit independently
      child.unref();

      const pid = child.pid;
      this.logger.log(`[Scraping] Worker started with PID=${pid}`);

      return {
        jobId,
        status: 'started',
        message: `Extracción iniciada (PID: ${pid}). ID del trabajo: ${jobId}`,
        pid,
      };
    } catch (err: any) {
      this.logger.error(`[Scraping] Failed to spawn worker: ${err?.message}`);
      
      // Update job status to FAILED if we couldn't spawn the worker
      if (jobId) {
        await this.supabase.from('scraping_jobs').update({
          status: 'FAILED_PERMANENT',
          last_error: `Failed to spawn worker: ${err?.message}`,
          finished_at: new Date().toISOString()
        }).eq('id', jobId);
      }

      return {
        status: 'error',
        message: `Error al iniciar el worker: ${err?.message}`,
      };
    }
  }
}
