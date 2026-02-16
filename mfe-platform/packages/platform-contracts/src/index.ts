export type PlatformEventMap = {
  NAVIGATE_TO_ACCOUNT: {
    accountId: string;
    route?: string;
  };
  SHOW_TOAST: {
    message: string;
    severity?: 'success' | 'info' | 'warning' | 'error';
  };
  TRACK_EVENT: {
    name: string;
    properties?: Record<string, string | number | boolean>;
  };
};

export type PlatformEventType = keyof PlatformEventMap;

export type PlatformEvent = {
  [Type in PlatformEventType]: {
    type: Type;
    payload: PlatformEventMap[Type];
  };
}[PlatformEventType];

export type PlatformEventSubscriber<Type extends PlatformEventType> = (
  payload: PlatformEventMap[Type]
) => void;

export interface PlatformEventBus {
  publish<Type extends PlatformEventType>(type: Type, payload: PlatformEventMap[Type]): void;
  subscribe<Type extends PlatformEventType>(type: Type, subscriber: PlatformEventSubscriber<Type>): () => void;
}

export function createPlatformEventBus(): PlatformEventBus {
  const subscribers: { [Type in PlatformEventType]: Set<PlatformEventSubscriber<Type>> } = {
    NAVIGATE_TO_ACCOUNT: new Set(),
    SHOW_TOAST: new Set(),
    TRACK_EVENT: new Set()
  };

  return {
    publish<Type extends PlatformEventType>(type: Type, payload: PlatformEventMap[Type]) {
      const handlers = subscribers[type] as Set<PlatformEventSubscriber<Type>>;
      handlers.forEach((handler) => handler(payload));
    },
    subscribe<Type extends PlatformEventType>(type: Type, subscriber: PlatformEventSubscriber<Type>) {
      const handlers = subscribers[type] as Set<PlatformEventSubscriber<Type>>;
      handlers.add(subscriber);
      return () => {
        handlers.delete(subscriber);
      };
    }
  };
}

const GLOBAL_BUS_KEY = '__MFE_PLATFORM_EVENT_BUS__';

declare global {
  interface Window {
    __MFE_PLATFORM_EVENT_BUS__?: PlatformEventBus;
  }
}

export function registerPlatformEventBus(bus: PlatformEventBus): void {
  window[GLOBAL_BUS_KEY] = bus;
}

export function unregisterPlatformEventBus(): void {
  delete window[GLOBAL_BUS_KEY];
}

export function getPlatformEventBus(): PlatformEventBus | undefined {
  return window[GLOBAL_BUS_KEY];
}

export function publishPlatformEvent<Type extends PlatformEventType>(
  type: Type,
  payload: PlatformEventMap[Type]
): void {
  getPlatformEventBus()?.publish(type, payload);
}
