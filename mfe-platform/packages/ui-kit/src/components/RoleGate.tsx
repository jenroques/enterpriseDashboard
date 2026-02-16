import type { ReactNode } from 'react';

type RoleGateProps = {
  userRoles: string[];
  requiredRoles: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function RoleGate({ userRoles, requiredRoles, fallback = null, children }: RoleGateProps) {
  if (requiredRoles.length === 0) {
    return <>{children}</>;
  }

  const authorized = requiredRoles.some((role) => userRoles.includes(role));
  if (!authorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
