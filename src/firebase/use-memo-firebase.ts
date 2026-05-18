'use client';

import { useMemo, DependencyList } from 'react';

/**
 * A custom hook that memoizes a value, but only on the client.
 * This is useful for Firebase queries or other objects that shouldn't be created on the server.
 * @param factory A function that creates the value.
 * @param deps An array of dependencies for the useMemo hook.
 * @returns The memoized value.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // By using a regular useMemo, we ensure that the factory is only called when the dependencies change.
  // The 'use client' directive at the top of the file ensures this code only runs on the client.
  return useMemo(factory, deps);
}
