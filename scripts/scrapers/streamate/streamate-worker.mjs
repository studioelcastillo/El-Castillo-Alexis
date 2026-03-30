/**
 * streamate-worker.mjs
 * Main Playwright worker for extracting studio earnings from Streamate.
 *
 * SECURITY: Credentials are NEVER stored in the database.
 * They are passed as CLI arguments or env vars and discarded after use.
 *
 * Usage:
 *   node streamate-worker.mjs --date 2026-03-25 --username USER --password PASS [--std_id 1]
 *
 * Requires: playwright, @supabase/supabase-js, dotenv
 *   npm install playwright @supabase/supabase-js dotenv
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { classifyError, ERROR_TYPE } from './error-classifier.mjs';
import { backoffSleep, createRateLimiter } from './rate-limiter.mjs';

dotenv.config({ path: '../../../.env' });

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SCRAPING_DEBUG_BUCKET = process.env.SCRAPING_DEBUG_BUCKET || 'scraping-debug';
const PLAYWRIGHT_EXECUTABLE_PATH = process.env.PLAYWRIGHT_EXECUTABLE_PATH || null;
const MAX_RETRIES   = 4;
const RATE_LIMIT_MS = 2500; // min ms between major actions
const JITTER_MS     = 1500;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// ─── PARSE CLI ARGS ───────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get  = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
  const date     = get('--date');
  const username = get('--username');
  const password = get('--password');
  const jobId    = get('--job_id');
  const stdId    = get('--std_id') ? Number(get('--std_id')) : null;
  if (!date || !username || !password) {
    console.error('Usage: node streamate-worker.mjs --date YYYY-MM-DD --username U --password P [--std_id N] [--job_id UUID]');
    process.exit(1);
  }
  return { date, username, password, stdId, jobId };
}

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
function buildSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase credentials in .env');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ─── DB HELPERS ────────────────────────────────────────────────────────────────
async function createJob(supabase, { date, stdId }) {
  const { data, error } = await supabase
    .from('scraping_jobs')
    .insert({ site: 'streamate', mode: 'master', target_date: date, status: 'RUNNING', std_id: stdId, started_at: new Date().toISOString() })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to create job: ${error.message}`);
  return data.id;
}

async function updateJob(supabase, jobId, fields) {
  await supabase.from('scraping_jobs').update(fields).eq('id', jobId);
}

async function logAttempt(supabase, jobId, attemptData) {
  const { data, error } = await supabase
    .from('scraping_attempts')
    .insert({ job_id: jobId, ...attemptData })
    .select('id')
    .single();

  if (error) {
    console.error('[DB] Attempt insert error:', error.message);
    return null;
  }

  return data?.id || null;
}

async function updateAttempt(supabase, attemptId, fields) {
  if (!attemptId) return;
  const { error } = await supabase.from('scraping_attempts').update(fields).eq('id', attemptId);
  if (error) {
    console.error('[DB] Attempt update error:', error.message);
  }
}

async function saveRows(supabase, rows) {
  if (!rows?.length) return;
  const { error } = await supabase.from('scraping_streamate').insert(rows);
  if (error) console.error('[DB] Insert error:', error.message);
}

let bucketReady = false;

async function ensureDebugBucket(supabase) {
  if (bucketReady) return;

  const { data } = await supabase.storage.getBucket(SCRAPING_DEBUG_BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(SCRAPING_DEBUG_BUCKET, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/png'],
    });

    if (error && !String(error.message || '').toLowerCase().includes('already exists')) {
      throw error;
    }
  }

  bucketReady = true;
}

async function captureStageScreenshot(supabase, page, { jobId, attemptNumber, stage }) {
  if (!page) return null;

  try {
    await ensureDebugBucket(supabase);
    const screenshot = await page.screenshot({ fullPage: true, type: 'png' });
    const safeStage = String(stage || 'unknown').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const path = `streamate/${jobId}/attempt-${attemptNumber}/${Date.now()}-${safeStage}.png`;
    const { error } = await supabase.storage
      .from(SCRAPING_DEBUG_BUCKET)
      .upload(path, screenshot, { contentType: 'image/png', upsert: true });

    if (error) {
      console.error('[Storage] Screenshot upload error:', error.message);
      return null;
    }

    return path;
  } catch (error) {
    console.error('[Storage] Could not capture screenshot:', error?.message || error);
    return null;
  }
}

// ─── PARSERS ──────────────────────────────────────────────────────────────────
/** Converts "HH:MM:SS" or "MM:SS" duration string to total seconds */
function parseDuration(str) {
  if (!str) return null;
  const parts = str.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

/** Strips "$" and "," from a price string and parses as float */
function parsePrice(str) {
  if (!str) return null;
  return parseFloat(str.replace(/[$,]/g, '').trim()) || null;
}

/** Parses the transaction date cell. Expected format varies; tries multiple approaches. */
function parseTransactionDate(rawDate) {
  if (!rawDate) return null;
  try {
    return new Date(rawDate).toISOString();
  } catch {
    return null;
  }
}

// ─── SCRAPER CORE ─────────────────────────────────────────────────────────────
async function loginToStreamate(page, username, password) {
  console.log('[Login] Navigating to login page...');
  await page.goto('https://www.streamatemodels.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Fill credentials
  await page.fill('input[name="username"], input[type="email"], #username, #email', username);
  await page.fill('input[name="password"], input[type="password"], #password', password);

  // Submit
  await page.click('button[type="submit"], input[type="submit"], .login-btn, .btn-login');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Check for captcha
  const bodyText = (await page.textContent('body')).toLowerCase();
  if (bodyText.includes('captcha') || bodyText.includes('verify you are human') || bodyText.includes('challenge')) {
    throw new Error('CAPTCHA detected on login page');
  }

  // Check for login failure
  const errorEl = await page.$('.error, .alert-danger, .login-error, [class*="error"]');
  if (errorEl) {
    const errText = await errorEl.textContent();
    throw new Error(`Login failed: ${errText.trim()}`);
  }

  console.log('[Login] Login successful. Current URL:', page.url());
}

async function navigateToReport(page, date, rateLimiter) {
  await rateLimiter();
  console.log(`[Nav] Navigating to studio earnings report for date ${date}...`);
  await page.goto('https://www.streamatemodels.com/reports/studio-earnings', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await rateLimiter();

  // Select "Single Day" from date type selector
  await page.selectOption('select[name="dateType"], #dateType, select[id*="date-type"], select[id*="dateType"]', { label: 'Single Day' }).catch(async () => {
    // Try clicking a radio or toggle
    const singleDayRadio = await page.$('input[value="single"], label:has-text("Single Day"), [data-value="single"]');
    if (singleDayRadio) await singleDayRadio.click();
  });

  await rateLimiter();

  // Format date as MM/DD/YYYY for Streamate's date picker
  const [year, month, day] = date.split('-');
  const formattedDate = `${month}/${day}/${year}`;

  // Fill date input
  const dateInput = await page.$('input[name="date"], input[type="date"], #reportDate, input[placeholder*="date"], input[placeholder*="Date"]');
  if (dateInput) {
    await dateInput.fill('');
    await dateInput.type(formattedDate, { delay: 80 });
  }

  await rateLimiter();

  // Ensure "All Studios" is selected
  const allStudiosSelect = await page.$('select[name="studio"], #studioFilter, select[id*="studio"]');
  if (allStudiosSelect) {
    await allStudiosSelect.selectOption({ label: 'All Studios' }).catch(() =>
      allStudiosSelect.selectOption({ value: '0' }).catch(() =>
        allStudiosSelect.selectOption({ index: 0 })
      )
    );
  }

  // Click "Get Report"
  await page.click('button:has-text("Get Report"), input[value="Get Report"], .get-report-btn, [type="submit"]');
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Safety check for captcha
  const bodyText = (await page.textContent('body')).toLowerCase();
  if (bodyText.includes('captcha') || bodyText.includes('challenge')) {
    throw new Error('CAPTCHA detected after Get Report');
  }

  console.log('[Nav] Report loaded.');
}

/**
 * Extract all rows from a model's earnings table.
 * @param {import('playwright').Page} page
 * @param {string} modelName
 * @param {string} jobId
 * @param {number|null} stdId
 */
async function extractModelTransactions(page, modelSection, modelName, jobId, stdId) {
  const rows = [];

  // The date link to expand transactions is typically inside the section
  // Click the date row/link to expand
  const expandLink = await modelSection.$('a[href*="detail"], a[href*="earning"], td a, .expand-link');
  if (expandLink) {
    await expandLink.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  // Find the transaction table rows within this section
  // Streamate typically uses a table with headers: Date/Time, Customer, Type, Site, Duration, Price, Earnings
  const tableRows = await modelSection.$$('table tbody tr, .earnings-table tr:not(:first-child), .transaction-row');

  for (const row of tableRows) {
    const cells = await row.$$eval('td', tds => tds.map(td => td.textContent?.trim() || ''));
    if (cells.length < 5) continue; // Skip header-like rows

    // Map based on expected column order: Date/Time | Customer (user + ID) | Type | Site | Duration | Price | Earnings
    const [rawDate, customerRaw, tipType, site, durationRaw, priceRaw, earningsRaw] = cells;

    // Parse customer: often "username (ID123)" or "username\n123"
    const customerMatch = customerRaw.match(/^(.+?)\s*[\(\n](\w+)\)?/);
    const customerUsername = customerMatch ? customerMatch[1].trim() : customerRaw.trim();
    const customerId       = customerMatch ? customerMatch[2].trim() : '';

    rows.push({
      job_id:             jobId,
      model_name:         modelName,
      transaction_date:   parseTransactionDate(rawDate),
      customer_username:  customerUsername || customerRaw,
      customer_id:        customerId,
      tip_type:           tipType?.trim() || null,
      site:               (site?.trim() || 'streamate').toLowerCase(),
      duration_seconds:   parseDuration(durationRaw),
      price_usd:          parsePrice(priceRaw),
      earnings_usd:       parsePrice(earningsRaw),
      std_id:             stdId,
    });
  }

  console.log(`[Extract] "${modelName}": ${rows.length} transactions found.`);
  return rows;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const { date, username, password, stdId, jobId: providedJobId } = parseArgs();
  const supabase = buildSupabase();
  const rateLimiter = createRateLimiter(RATE_LIMIT_MS, JITTER_MS);

  let jobId = providedJobId || null;
  let attemptNumber = 0;
  let lastError = null;

  // Create or use existing job record
  if (jobId) {
    console.log(`[Main] Using existing Job ID: ${jobId}`);
  } else {
    jobId = await createJob(supabase, { date, stdId });
    console.log(`[Main] Job created: ${jobId} for date ${date}`);
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    attemptNumber = attempt + 1;
    const attemptStartedAt = new Date();
    let currentAttemptId = null;
    let currentStage = 'LOGIN';
    let stageStartedAt = new Date();
    let browser = null;
    let context = null;
    let page = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        ...(PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: PLAYWRIGHT_EXECUTABLE_PATH } : {}),
      });

      context = await browser.newContext({
        userAgent: USER_AGENT,
        locale: 'en-US',
        timezoneId: 'America/New_York',
        viewportSize: { width: 1280, height: 900 },
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      page = await context.newPage();

      // LOGIN
      currentStage = 'LOGIN';
      stageStartedAt = new Date();
      currentAttemptId = await logAttempt(supabase, jobId, { attempt_number: attemptNumber, stage: currentStage, started_at: stageStartedAt.toISOString() });
      await loginToStreamate(page, username, password);
      await updateAttempt(supabase, currentAttemptId, {
        ended_at: new Date().toISOString(),
        duration_ms: Date.now() - stageStartedAt.getTime(),
        current_url: page.url(),
        screenshot_path: await captureStageScreenshot(supabase, page, { jobId, attemptNumber, stage: currentStage }),
      });
      await rateLimiter();

      // NAVIGATION
      currentStage = 'NAVIGATION';
      stageStartedAt = new Date();
      currentAttemptId = await logAttempt(supabase, jobId, { attempt_number: attemptNumber, stage: currentStage, started_at: stageStartedAt.toISOString() });
      await navigateToReport(page, date, rateLimiter);
      await updateAttempt(supabase, currentAttemptId, {
        ended_at: new Date().toISOString(),
        duration_ms: Date.now() - stageStartedAt.getTime(),
        current_url: page.url(),
        screenshot_path: await captureStageScreenshot(supabase, page, { jobId, attemptNumber, stage: currentStage }),
      });

      // EXTRACTION — find all "Earnings for [MODEL]" sections
      currentStage = 'EXTRACTION';
      stageStartedAt = new Date();
      currentAttemptId = await logAttempt(supabase, jobId, { attempt_number: attemptNumber, stage: currentStage, started_at: stageStartedAt.toISOString() });

      // Streamate shows sections headed by "Earnings for ModelName"
      // We look for heading elements (h3/h4/div) that contain "Earnings for"
      const modelSections = await page.$$('.earnings-section, [id*="earnings"], h3:has-text("Earnings for"), h4:has-text("Earnings for")');

      if (!modelSections.length) {
        // Try alternative: look for the section container that wraps the header + table
        console.warn('[Extract] No model sections found with primary selector. Trying fallback...');
      }

      // Fallback: parse directly from page content if no structured sections
      const headings = await page.$$eval(
        'h3, h4, .model-header, [class*="earnings-header"]',
        els => els
          .map(el => ({ text: el.textContent?.trim(), id: el.id || el.className }))
          .filter(el => el.text?.toLowerCase().includes('earnings for'))
      );

      console.log(`[Extract] Found ${headings.length} model(s): ${headings.map(h => h.text).join(', ')}`);

      let allRows = [];

      for (const heading of headings) {
        const modelName = heading.text.replace(/^earnings for\s*/i, '').trim();
        await rateLimiter();

        // Navigate to model detail if Streamate requires clicking date link
        // Find the section container
        const section = await page.$(`[id*="${modelName.replace(/\s+/g, '')}"], .earnings-section:has-text("${modelName}")`).catch(() => null) || page;
        const rows = await extractModelTransactions(page, section, modelName, jobId, stdId);
        allRows = allRows.concat(rows);
      }

      await updateAttempt(supabase, currentAttemptId, {
        ended_at: new Date().toISOString(),
        duration_ms: Date.now() - stageStartedAt.getTime(),
        current_url: page.url(),
        screenshot_path: await captureStageScreenshot(supabase, page, { jobId, attemptNumber, stage: currentStage }),
      });

      // PARSING / SAVE
      currentStage = 'PARSING';
      stageStartedAt = new Date();
      currentAttemptId = await logAttempt(supabase, jobId, { attempt_number: attemptNumber, stage: currentStage, started_at: stageStartedAt.toISOString() });
      await saveRows(supabase, allRows);
      await updateAttempt(supabase, currentAttemptId, {
        ended_at: new Date().toISOString(),
        duration_ms: Date.now() - stageStartedAt.getTime(),
        current_url: page.url(),
        screenshot_path: await captureStageScreenshot(supabase, page, { jobId, attemptNumber, stage: currentStage }),
      });

      await browser.close();

      // Mark job DONE
      const durationMs = Date.now() - attemptStartedAt.getTime();
      await updateJob(supabase, jobId, {
        status: 'DONE',
        attempts_count: attemptNumber,
        finished_at: new Date().toISOString(),
      });

      console.log(`[Main] ✅ Job ${jobId} completed. ${allRows.length} rows saved. Duration: ${durationMs}ms`);
      process.exit(0);

    } catch (err) {
      const classification = classifyError(err, null, 'EXTRACTION');
      lastError = classification;
      const durationMs = Date.now() - attemptStartedAt.getTime();

      console.error(`[Main] ❌ Attempt ${attemptNumber} failed [${classification.type}]: ${err.message}`);

      await updateAttempt(supabase, currentAttemptId, {
        ended_at:       new Date().toISOString(),
        duration_ms:    durationMs,
        error_type:     classification.type,
        error_code:     classification.code,
        error_message:  classification.message,
        current_url:    page?.url?.() || null,
        screenshot_path: await captureStageScreenshot(supabase, page, { jobId, attemptNumber, stage: `${currentStage}-error` }),
      });

      if (browser) {
        await browser.close().catch(() => undefined);
      }

      if (classification.type === ERROR_TYPE.PERMANENT) {
        await updateJob(supabase, jobId, {
          status:           'FAILED_PERMANENT',
          attempts_count:   attemptNumber,
          last_error:       classification.message,
          last_error_type:  classification.type,
          finished_at:      new Date().toISOString(),
        });
        console.error('[Main] Permanent error — stopping retries.');
        process.exit(2);
      }

      if (classification.type === ERROR_TYPE.MANUAL) {
        await updateJob(supabase, jobId, {
          status:           'MANUAL_REQUIRED',
          attempts_count:   attemptNumber,
          last_error:       classification.message,
          last_error_type:  classification.type,
          finished_at:      new Date().toISOString(),
        });
        console.error('[Main] Manual intervention required — please resolve CAPTCHA or challenge and retry.');
        process.exit(3);
      }

      // TEMPORARY — apply backoff and retry
      if (attempt < MAX_RETRIES - 1) {
        await backoffSleep(attempt);
        await updateJob(supabase, jobId, {
          status:           'FAILED_TEMPORARY',
          attempts_count:   attemptNumber,
          last_error:       classification.message,
          last_error_type:  classification.type,
        });
      }
    }
  }

  // All retries exhausted
  await updateJob(supabase, jobId, {
    status:          'FAILED_PERMANENT',
    attempts_count:  attemptNumber,
    last_error:      lastError?.message,
    last_error_type: lastError?.type,
    finished_at:     new Date().toISOString(),
  });
  console.error('[Main] All retries exhausted. Job marked FAILED_PERMANENT.');
  process.exit(2);
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
