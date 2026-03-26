import {
  Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger, BadRequestException,
} from '@nestjs/common';
import { ScrapingService } from './scraping.service';

class RunStreamateDto {
  date!: string;
  username!: string;
  password!: string;
  std_id?: number;
}

@Controller('scraping')
export class ScrapingController {
  private readonly logger = new Logger(ScrapingController.name);

  constructor(private readonly scrapingService: ScrapingService) {}

  /**
   * POST /api/scraping/streamate/run
   * Triggers a Playwright worker to extract Streamate studio earnings for a given date.
   *
   * SECURITY:
   * - Credentials are passed ONLY to the child process args and are NEVER logged or persisted.
   * - The API never stores username/password.
   */
  @Post('streamate/run')
  @HttpCode(HttpStatus.ACCEPTED)
  async runStreamate(@Body() body: RunStreamateDto) {
    const { date, username, password, std_id } = body;

    if (!date || !username || !password) {
      throw new BadRequestException('Se requieren: date, username, password.');
    }

    // Basic date format validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('El formato de fecha debe ser YYYY-MM-DD.');
    }

    this.logger.log(`[Scraping] Run requested for date=${date} – credentials NOT logged`);

    const result = await this.scrapingService.runScraper({
      site: 'streamate',
      date,
      username,
      password,
      std_id,
    });

    return {
      ok: result.status === 'started',
      message: result.message,
      pid: result.pid,
      jobId: result.jobId,
    };
  }
}
