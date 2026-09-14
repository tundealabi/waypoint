import { useSyncExternalStore } from 'react';

import { getState, subscribe } from './store';
import type { StoreState } from './types';

export function useWaypoint(): StoreState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export * from './store';
export * from './templates';
export * from './types';
