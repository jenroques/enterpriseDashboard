import { createContext, useContext } from 'react';
import type { RegistryRoute, RemoteRuntimeStatus } from './types';

export type RegistryContextValue = {
  routes: RegistryRoute[];
  statuses: Record<string, RemoteRuntimeStatus>;
  updateRemoteStatus: (scope: string, status: Partial<RemoteRuntimeStatus>) => void;
};

export const RegistryContext = createContext<RegistryContextValue | null>(null);

export function useRegistryContext(): RegistryContextValue {
  const context = useContext(RegistryContext);
  if (!context) {
    throw new Error('useRegistryContext must be used within RegistryContext.Provider');
  }

  return context;
}
