export function hashToPercentage(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % 100;
}

export function isInCanaryRollout(userId: string, routeId: string, canaryPercentage: number): boolean {
  const clamped = Math.max(0, Math.min(100, canaryPercentage));
  const bucket = hashToPercentage(`${userId}:${routeId}`);
  return bucket < clamped;
}
