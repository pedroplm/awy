import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * To support static / server rendering and prevent hydration mismatch on web,
 * this hook provides a safe snapshot between SSR and client.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === 'undefined') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    () => 'light'
  );
}
