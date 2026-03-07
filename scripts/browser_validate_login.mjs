import { chromium } from 'playwright';

const [url, username, password, label] = process.argv.slice(2);
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/ElCastillo/AppData/Local/ms-playwright/chromium-1178/chrome-win/chrome.exe';

if (!url || !username || !password || !label) {
  throw new Error('Usage: node browser_validate_login.mjs <url> <username> <password> <label>');
}

const browser = await chromium.launch({
  executablePath,
  headless: true,
  timeout: 0,
  args: ['--disable-gpu'],
});
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[placeholder="Ingresa tu usuario"]', { timeout: 120000 });

  await page.fill('input[placeholder="Ingresa tu usuario"]', username);
  await page.fill('input[type="password"]', password);
  await page.check('#policy-check');

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => null),
  ]);

  await page.waitForTimeout(5000);

  const bodyText = await page.locator('body').innerText();
  const loggedIn = !bodyText.includes('Iniciar Sesion') && !bodyText.includes('Credenciales invalidas');

  if (!loggedIn) {
    throw new Error(`Login no confirmado para ${label}. URL final: ${page.url()}`);
  }

  console.log(JSON.stringify({
    label,
    ok: true,
    finalUrl: page.url(),
    title: await page.title(),
    hasSidebar: bodyText.includes('EL CASTILLO') || bodyText.includes('Inicio'),
  }));
} catch (error) {
  await page.screenshot({ path: `browser-validate-${label}.png`, fullPage: true }).catch(() => null);
  console.error(JSON.stringify({
    label,
    ok: false,
    finalUrl: page.url(),
    error: error instanceof Error ? error.message : String(error),
  }));
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
