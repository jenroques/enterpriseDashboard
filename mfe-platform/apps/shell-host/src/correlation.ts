export function createId(prefix: string): string {
  const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomPart}`;
}

export function createSessionId(): string {
  return createId('session');
}

export function createRequestId(): string {
  return createId('request');
}
