/**
 * rate-limiter.mjs
 * Provides rate limiting with random jitter and exponential backoff.
 */

/**
 * Sleep for ms milliseconds with optional random jitter.
 * @param {number} baseMs - Base delay in ms
 * @param {number} jitterMs - Max random jitter to add (default 1000ms)
 */
export function sleep(baseMs, jitterMs = 1000) {
  const delay = baseMs + Math.floor(Math.random() * jitterMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Returns the delay for a given retry attempt using exponential backoff.
 * Factor: 2^attempt * baseMs, capped at maxMs.
 * @param {number} attempt - Attempt number (0-indexed)
 * @param {number} baseMs - Base delay (default 3000ms)
 * @param {number} maxMs  - Max delay cap (default 30000ms)
 */
export function exponentialBackoffMs(attempt, baseMs = 3000, maxMs = 30000) {
  return Math.min(baseMs * Math.pow(2, attempt), maxMs);
}

/**
 * Sleep with exponential backoff + jitter.
 */
export async function backoffSleep(attempt, baseMs = 3000, maxMs = 30000) {
  const delay = exponentialBackoffMs(attempt, baseMs, maxMs);
  console.log(`[RateLimit] Backing off for ${delay}ms (attempt ${attempt})...`);
  await sleep(delay, 1500);
}

/**
 * Rate limiter: ensures at least minMs between calls.
 * Usage: const limiter = createRateLimiter(2000, 1000);
 *        await limiter(); // waits if needed before proceeding
 */
export function createRateLimiter(minMs = 2000, jitterMs = 1000) {
  let lastCallAt = 0;
  return async function applyLimit() {
    const now = Date.now();
    const elapsed = now - lastCallAt;
    const jitter = Math.floor(Math.random() * jitterMs);
    const wait = Math.max(0, minMs + jitter - elapsed);
    if (wait > 0) {
      await sleep(wait, 0);
    }
    lastCallAt = Date.now();
  };
}
