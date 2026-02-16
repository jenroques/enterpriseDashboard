import type { Role } from './types';

type JwtPayload = {
  sub?: string;
  roles?: Role[];
  exp?: number;
};

export function parseJwt(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid JWT format');
  }

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const json = atob(padded);
  return JSON.parse(json) as JwtPayload;
}

export function hasRequiredRole(userRoles: Role[], requiredRoles: Role[]): boolean {
  if (requiredRoles.length === 0) {
    return true;
  }
  return requiredRoles.some((role) => userRoles.includes(role));
}
