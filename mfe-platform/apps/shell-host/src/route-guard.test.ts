import { describe, expect, it } from 'vitest';
import { hasRequiredRole } from './auth';

describe('hasRequiredRole', () => {
  it('allows route with no required roles', () => {
    expect(hasRequiredRole(['USER'], [])).toBe(true);
  });

  it('denies route when no required role is present', () => {
    expect(hasRequiredRole(['USER'], ['ADMIN'])).toBe(false);
  });

  it('allows route when at least one required role is present', () => {
    expect(hasRequiredRole(['USER', 'ADMIN'], ['ADMIN'])).toBe(true);
    expect(hasRequiredRole(['USER'], ['ADMIN', 'USER'])).toBe(true);
  });
});
