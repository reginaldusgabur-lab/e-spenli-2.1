'use client';

import { useState, useEffect } from 'react';

// REPAIRED: Initialize with null to prevent SSR/hydration mismatch flicker.
// Now, components using this hook can know if the query has been evaluated on the client yet.
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    // The check for `window` is redundant due to `useEffect` only running on the client,
    // but it's kept for clarity.
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set the initial state on the client
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      
      // Listen for changes in screen size
      const listener = () => {
        setMatches(media.matches);
      };
      media.addEventListener('change', listener);
      
      // Cleanup the listener when the component unmounts
      return () => media.removeEventListener('change', listener);
    }
  }, [query]); // The dependency array was simplified for correctness.

  return matches;
}
