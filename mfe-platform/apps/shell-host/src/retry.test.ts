import { describe, expect, it } from 'vitest';
import { createRetrySchedule, getBackoffDelayMs } from './retry';

describe('retry backoff', () => {
  it('computes exponential delays with cap', () => {
    expect(getBackoffDelayMs(0, 500, 4_000)).toBe(500);
    expect(getBackoffDelayMs(1, 500, 4_000)).toBe(1_000);
    expect(getBackoffDelayMs(2, 500, 4_000)).toBe(2_000);
    expect(getBackoffDelayMs(3, 500, 4_000)).toBe(4_000);
    expect(getBackoffDelayMs(4, 500, 4_000)).toBe(4_000);
  });

  it('creates retry schedule for configured retry count', () => {
    const schedule = createRetrySchedule(3, 500, 4_000);
    expect(schedule).toEqual([500, 1_000, 2_000]);
  });
});
