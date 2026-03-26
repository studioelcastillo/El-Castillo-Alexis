/**
 * error-classifier.mjs
 * Classifies scraping errors as TEMPORARY, PERMANENT, or MANUAL_REQUIRED.
 */

export const ERROR_TYPE = {
  TEMPORARY: 'TEMPORARY',
  PERMANENT: 'PERMANENT',
  MANUAL:    'MANUAL_REQUIRED',
};

/**
 * Classify a given error/status into TEMPORARY, PERMANENT, or MANUAL_REQUIRED.
 * @param {Error|string} error
 * @param {number|null} httpStatus
 * @param {string} stage - LOGIN | NAVIGATION | EXTRACTION | PARSING
 * @returns {{ type: string, code: string, message: string }}
 */
export function classifyError(error, httpStatus = null, stage = '') {
  const msg = (typeof error === 'string' ? error : error?.message || '').toLowerCase();

  // --- MANUAL / captcha / 2FA ---
  const manualKeywords = ['captcha', 'recaptcha', 'hcaptcha', 'challenge', '2fa', 'two-factor',
    'verification required', 'security check', 'please verify', 'are you human',
    'bot detection', 'access denied by cloudflare', 'selector not found'];
  if (manualKeywords.some((kw) => msg.includes(kw))) {
    return { type: ERROR_TYPE.MANUAL, code: 'CAPTCHA_OR_CHALLENGE', message: String(error) };
  }

  // --- PERMANENT ---
  const permanentKeywords = ['invalid credentials', 'incorrect password', 'wrong password',
    'user not found', 'account not found', 'login failed', 'invalid login',
    'forbidden', 'unauthorized', 'your account is suspended', 'account disabled'];
  if (permanentKeywords.some((kw) => msg.includes(kw))) {
    return { type: ERROR_TYPE.PERMANENT, code: 'AUTH_FAILED', message: String(error) };
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return { type: ERROR_TYPE.PERMANENT, code: `HTTP_${httpStatus}`, message: String(error) };
  }

  // --- TEMPORARY ---
  const temporaryKeywords = ['timeout', 'etimedout', 'econnreset', 'enotfound', 'socket hang up',
    'network', 'getaddrinfo', 'navigation timeout', 'target closed'];
  if (temporaryKeywords.some((kw) => msg.includes(kw))) {
    return { type: ERROR_TYPE.TEMPORARY, code: 'NETWORK_ERROR', message: String(error) };
  }
  if (httpStatus === 429 || (httpStatus >= 500 && httpStatus < 600)) {
    return { type: ERROR_TYPE.TEMPORARY, code: `HTTP_${httpStatus}`, message: String(error) };
  }

  // --- DEFAULT: treat as TEMPORARY to allow retry ---
  return { type: ERROR_TYPE.TEMPORARY, code: 'UNKNOWN', message: String(error) };
}
