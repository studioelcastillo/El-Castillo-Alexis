import {
  Controller, Post, Body, HttpCode, HttpStatus, Logger, BadRequestException, Get, Param,
} from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

class RunStreamateDto {
  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsNumber()
  std_id?: number;
}

@Controller('scraping')
export class ScrapingController {
  private readonly logger = new Logger(ScrapingController.name);

  constructor(private readonly scrapingService: ScrapingService) {}

  @Get('jobs/:jobId/screenshots')
  async getJobScreenshots(@Param('jobId') jobId: string) {
    return {
      ok: true,
      data: await this.scrapingService.getJobScreenshots(jobId),
    };
  }

  /**
   * POST /api/v1/scraping/streamate/run
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

    // Basic date format validation (additional to Class-Validator)
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
