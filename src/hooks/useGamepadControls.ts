import type { mGBAEmulator } from '@thenick775/mgba-wasm';
import { useEffect, useRef } from 'react';
import { type EmulatorButton, pickPreferredGamepadFromList, readEmulatorButtonsFromGamepad } from '../gamepad';

export type UseGamepadControlsOptions = {
  enabled: boolean;
  emulator: mGBAEmulator | null;
  deadzone?: number;
  threshold?: number;
  fastForwardMultiplier?: number;
};

export function useGamepadControls({
  enabled,
  emulator,
  deadzone,
  threshold,
  fastForwardMultiplier = 3,
}: UseGamepadControlsOptions) {
  const rafIdRef = useRef<number | null>(null);
  const prevButtonsRef = useRef<Record<EmulatorButton, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    l: false,
    r: false,
    select: false,
    start: false,
  });
  const prevFastForwardRef = useRef(false);
  const prevRewindRef = useRef(false);
  const prevMultiplierRef = useRef<number | null>(null);

  useEffect(() => {
    if (!emulator || !enabled) return;

    const stopAll = () => {
      for (const key of Object.keys(prevButtonsRef.current) as EmulatorButton[]) {
        if (prevButtonsRef.current[key]) {
          emulator.buttonUnpress(key);
          prevButtonsRef.current[key] = false;
        }
      }

      if (prevFastForwardRef.current) {
        const prev = prevMultiplierRef.current ?? emulator.getFastForwardMultiplier();
        emulator.setFastForwardMultiplier(Math.max(1, prev));
        prevMultiplierRef.current = null;
        prevFastForwardRef.current = false;
      }

      if (prevRewindRef.current) {
        emulator.toggleRewind(false);
        prevRewindRef.current = false;
      }
    };

    const tick = () => {
      const pad = pickPreferredGamepadFromList(navigator.getGamepads?.() ?? []);
      if (!pad) {
        stopAll();
        rafIdRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const { buttons: next, fastForward: nextFastForward, rewind: nextRewind } =
        readEmulatorButtonsFromGamepad(pad, { deadzone, threshold });

      let resumedAudio = false;
      for (const key of Object.keys(next) as EmulatorButton[]) {
        const was = prevButtonsRef.current[key];
        const now = next[key];
        if (now && !was) {
          emulator.buttonPress(key);
          if (!resumedAudio) {
            emulator.resumeAudio();
            resumedAudio = true;
          }
        } else if (!now && was) {
          emulator.buttonUnpress(key);
        }
        prevButtonsRef.current[key] = now;
      }

      if (nextFastForward && !prevFastForwardRef.current) {
        if (prevMultiplierRef.current === null) {
          prevMultiplierRef.current = emulator.getFastForwardMultiplier();
        }
        emulator.setFastForwardMultiplier(fastForwardMultiplier);
        prevFastForwardRef.current = true;
      } else if (!nextFastForward && prevFastForwardRef.current) {
        const prev = prevMultiplierRef.current ?? 1;
        emulator.setFastForwardMultiplier(Math.max(1, prev));
        prevMultiplierRef.current = null;
        prevFastForwardRef.current = false;
      }

      if (nextRewind && !prevRewindRef.current) {
        emulator.toggleRewind(true);
        prevRewindRef.current = true;
      } else if (!nextRewind && prevRewindRef.current) {
        emulator.toggleRewind(false);
        prevRewindRef.current = false;
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') stopAll();
    };

    window.addEventListener('gamepaddisconnected', stopAll);
    document.addEventListener('visibilitychange', handleVisibility);

    rafIdRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('gamepaddisconnected', stopAll);
      document.removeEventListener('visibilitychange', handleVisibility);
      stopAll();
    };
  }, [deadzone, emulator, enabled, fastForwardMultiplier, threshold]);
}

