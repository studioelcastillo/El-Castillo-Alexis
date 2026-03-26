import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { resolve } from 'path';

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

  /**
   * Spawns the Playwright worker process for the given site.
   * Credentials are passed as arguments and are NEVER stored.
   * The process runs in the background and updates the DB directly.
   */
  async runScraper(dto: RunScraperDto): Promise<ScraperResult> {
    const { site, date, username, password, std_id } = dto;

    // Resolve the worker path relative to the repo root
    const workerPath = resolve(
      __dirname,
      '../../../../../scripts/scrapers/streamate/streamate-worker.mjs',
    );

    this.logger.log(`[Scraping] Spawning worker for site=${site} date=${date}`);

    const args = [
      workerPath,
      '--date', date,
      '--username', username,
      '--password', password,
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
        status: 'started',
        message: `Extracción iniciada (PID: ${pid}). Los resultados se guardarán en la base de datos.`,
        pid,
      };
    } catch (err: any) {
      this.logger.error(`[Scraping] Failed to spawn worker: ${err?.message}`);
      return {
        status: 'error',
        message: `Error al iniciar el worker: ${err?.message}`,
      };
    }
  }
}
