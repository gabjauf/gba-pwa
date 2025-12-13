import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { GBAContext } from '../emulator/useEmulator';
import DPad from './DPad';
import ActionPad from './ActionPad';
import {
  IconFastForward,
  IconFolderOpen,
  IconGamepad,
  IconPause,
  IconPlay,
  IconRewind,
  IconRotateCcw,
  IconSave,
  IconStop,
} from './Icons';

export type Status = {
  message: string;
  tone?: 'info' | 'success' | 'warn';
};

export type PlayViewProps = {
  activeRom: string | null;
  isPaused: boolean;
  status: Status;
  showGamepad: boolean;
  onPauseToggle: () => void;
  onReset: () => void;
  onQuit: () => void;
  onSaveState: () => void;
  onLoadState: () => void;
  onAutoSave: () => void;
  showCanvas: boolean;
};

const PlayView = ({
  activeRom,
  isPaused,
  showGamepad,
  onPauseToggle,
  onReset,
  onQuit,
  onSaveState,
  onLoadState,
  onAutoSave,
  showCanvas,
}: PlayViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { canvas, emulator } = useContext(GBAContext);
  const fastForwardPrevMultiplierRef = useRef<number | null>(null);
  const romNameForMode = (emulator?.gameName || activeRom || '').replace(/\.zip$/i, '');
  const isGbcRom = /\.(gbc|gb)$/i.test(romNameForMode);
  const canUseSpeedControls = Boolean(emulator && activeRom);

  const useHoldPointer = (enabled: boolean, onStart: () => void, onStop: () => void) => {
    const activePointerIdRef = useRef<number | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const stop = useCallback(() => {
      if (activePointerIdRef.current === null) return;
      activePointerIdRef.current = null;
      cleanupRef.current?.();
      cleanupRef.current = null;
      onStop();
    }, [onStop]);

    useEffect(() => {
      if (enabled) return;
      stop();
    }, [enabled, stop]);

    useEffect(() => () => stop(), [stop]);

    const onPointerDown = useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!enabled) return;
        if (activePointerIdRef.current !== null) return;

        event.preventDefault();
        activePointerIdRef.current = event.pointerId;
        onStart();

        try {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        } catch {
          // Ignore: not all browsers support pointer capture consistently
        }

        const handleUp = (e: PointerEvent) => {
          if (e.pointerId !== activePointerIdRef.current) return;
          stop();
        };

        const handleBlur = () => stop();

        const handleVisibility = () => {
          if (document.visibilityState !== 'visible') stop();
        };

        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibility);

        cleanupRef.current = () => {
          window.removeEventListener('pointerup', handleUp);
          window.removeEventListener('pointercancel', handleUp);
          window.removeEventListener('blur', handleBlur);
          document.removeEventListener('visibilitychange', handleVisibility);
        };
      },
      [enabled, onStart, stop],
    );

    const onPointerUp = useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (event.pointerId !== activePointerIdRef.current) return;
        stop();
        try {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        } catch {
          // ignore
        }
      },
      [stop],
    );

    const onPointerCancel = useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (event.pointerId !== activePointerIdRef.current) return;
        stop();
      },
      [stop],
    );

    const onLostPointerCapture = useCallback(() => stop(), [stop]);

    return useMemo(
      () => ({ onPointerDown, onPointerUp, onPointerCancel, onLostPointerCapture }),
      [onPointerCancel, onPointerDown, onPointerUp, onLostPointerCapture],
    );
  };

  const startFastForward = useCallback(() => {
    if (!emulator) return;
    if (fastForwardPrevMultiplierRef.current === null) {
      fastForwardPrevMultiplierRef.current = emulator.getFastForwardMultiplier();
    }
    emulator.setFastForwardMultiplier(3);
  }, [emulator]);

  const stopFastForward = useCallback(() => {
    if (!emulator) return;
    const prev = fastForwardPrevMultiplierRef.current ?? 1;
    emulator.setFastForwardMultiplier(Math.max(1, prev));
    fastForwardPrevMultiplierRef.current = null;
  }, [emulator]);

  const startRewind = useCallback(() => {
    if (!emulator) return;
    emulator.toggleRewind(true);
  }, [emulator]);

  const stopRewind = useCallback(() => {
    if (!emulator) return;
    emulator.toggleRewind(false);
  }, [emulator]);

  useEffect(() => {
    fastForwardPrevMultiplierRef.current = null;
  }, [emulator]);

  const fastForwardHold = useHoldPointer(canUseSpeedControls, startFastForward, stopFastForward);
  const rewindHold = useHoldPointer(canUseSpeedControls, startRewind, stopRewind);

  useEffect(() => {
    if (!containerRef.current || !canvas) return;

    // 1. Append the singleton canvas to this component's DOM
    containerRef.current?.appendChild(canvas);

    // 2. IMPORTANT: Ensure canvas style fits container
    canvas.classList.add('emulator-canvas', 'full');
    canvas.style.display = 'block';
    canvas.style.width = '';
    canvas.style.height = '';

    // Cleanup: When this component unmounts...
    return () => {
      // Option A: Leave it (React will remove the container, detaching the canvas)
      // Option B: Move canvas back to a hidden 'storage' div if needed
      // DO NOT destroy the canvas element itself
    };
  }, [canvas]);

  return (
    <section
      className={`panel stage play-panel gameboy-view ${isGbcRom ? 'mode-gbc' : 'mode-gba'}`}
      style={{ display: showCanvas ? 'block' : 'none' }}
      aria-hidden={!showCanvas}
    >
      {/* <div className="panel-head">
        <div className="muted small">
          Keyboard: arrows, Z/X, A/S, Shift (Select), Enter/Space (Start)
        </div>
      </div> */}

      <div className="gameboy-shell">
        <div className="gameboy-screen">
          <div className="canvas-shell full">
            <div className="canvas-container" ref={containerRef} style={{ background: '#000' }} />
          </div>
        </div>

        <div className="gameboy-toolbar">
          <div className="toolbar-actions">
            <button
              type="button"
              className="ghost icon"
              disabled={!emulator || !activeRom}
              onClick={onPauseToggle}
              title={isPaused ? 'Resume' : 'Pause'}
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <IconPlay /> : <IconPause />}
            </button>
            <button
              type="button"
              className="ghost icon"
              disabled={!emulator || !activeRom}
              onClick={onReset}
              title="Reset"
              aria-label="Reset"
            >
              <IconRotateCcw />
            </button>
            <button
              type="button"
              className="ghost icon"
              disabled={!emulator || !activeRom}
              onClick={onQuit}
              title="Quit"
              aria-label="Quit"
            >
              <IconStop />
            </button>
            <button
              type="button"
              className="ghost icon"
              onClick={onSaveState}
              disabled={!emulator || !activeRom}
              title="Quick save"
              aria-label="Quick save"
            >
              <IconSave />
            </button>
            <button
              type="button"
              className="ghost icon"
              onClick={onLoadState}
              disabled={!emulator || !activeRom}
              title="Quick load"
              aria-label="Quick load"
            >
              <IconFolderOpen />
            </button>
            <button
              type="button"
              className="ghost"
              onClick={onAutoSave}
              disabled={!emulator || !activeRom}
              title="Force auto-save"
            >
              Auto
            </button>
          </div>
          <button
            type="button"
            className="ghost controls-hint icon"
            title="Controls: D‑pad, A/B, L/R shoulders, Select/Start bottom. Keyboard: arrows, Z/X, A/S, Shift (Select), Enter/Space (Start)."
            aria-label="Controls help"
          >
            <IconGamepad />
          </button>
        </div>

        {showGamepad && (
          <div className="gameboy-controls">
            <div className="gamepad">
              <button
                type="button"
                className="shoulder left"
                onPointerDown={() => emulator?.buttonPress('l')}
                onPointerUp={() => emulator?.buttonUnpress('l')}
              >
                L
              </button>
              <button
                type="button"
                className="shoulder right"
                onPointerDown={() => emulator?.buttonPress('r')}
                onPointerUp={() => emulator?.buttonUnpress('r')}
              >
                R
              </button> 
              <button
                type="button"
                className="shoulder icon fast-forward"
                disabled={!canUseSpeedControls}
                title="Hold to fast forward"
                aria-label="Fast forward"
                {...fastForwardHold}
              >
                <IconFastForward />
              </button>
              <button
                type="button"
                className="shoulder icon rewind"
                disabled={!canUseSpeedControls}
                title="Hold to rewind"
                aria-label="Rewind"
                {...rewindHold}
              >
                <IconRewind />
              </button>
              <DPad
                onPress={(dir) => emulator?.buttonPress(dir)}
                onUnpress={(dir) => emulator?.buttonUnpress(dir)}
                disabled={!emulator}
              />
              <ActionPad
                onPress={(btn) => emulator?.buttonPress(btn)}
                onUnpress={(btn) => emulator?.buttonUnpress(btn)}
                disabled={!emulator}
              />
              <div className="meta">
                <button
                  type="button"
                  onPointerDown={() => emulator?.buttonPress('select')}
                  onPointerUp={() => emulator?.buttonUnpress('select')}
                >
                  Select
                </button>
                <button
                  type="button"
                  onPointerDown={() => emulator?.buttonPress('start')}
                  onPointerUp={() => emulator?.buttonUnpress('start')}
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PlayView;
