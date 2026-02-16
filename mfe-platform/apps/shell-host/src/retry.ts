export function getBackoffDelayMs(attempt: number, baseDelayMs = 500, maxDelayMs = 8000): number {
  const exponent = Math.max(0, attempt);
  return Math.min(baseDelayMs * Math.pow(2, exponent), maxDelayMs);
}

export function createRetrySchedule(maxRetries: number, baseDelayMs = 500, maxDelayMs = 8000): number[] {
  return Array.from({ length: Math.max(0, maxRetries) }, (_, index) =>
    getBackoffDelayMs(index, baseDelayMs, maxDelayMs)
  );
}
