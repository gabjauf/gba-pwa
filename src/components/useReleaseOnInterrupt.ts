import { useEffect } from 'react';

/**
 * Releases held inputs when the browser can swallow the matching pointerup —
 * the tab goes to the background or the window loses focus mid-press. Without
 * it, a button counted as "down" never gets its onUnpress and the core keeps
 * the key held: the character keeps moving.
 */
export function useReleaseOnInterrupt(release: () => void) {
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') release();
    };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [release]);
}
