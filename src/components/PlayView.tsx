import { useContext, useEffect, useRef, type RefObject } from 'react';
import type { mGBAEmulator } from '@thenick775/mgba-wasm';
import { GBAContext } from '../emulator/useEmulator';

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
  status,
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

  useEffect(() => {
    if (!containerRef.current || !canvas) return;

    // 1. Append the singleton canvas to this component's DOM
    containerRef.current?.appendChild(canvas);

    // 2. IMPORTANT: Ensure canvas style fits container
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Cleanup: When this component unmounts...
    return () => {
      // Option A: Leave it (React will remove the container, detaching the canvas)
      // Option B: Move canvas back to a hidden 'storage' div if needed
      // DO NOT destroy the canvas element itself
    };
  }, [canvas]);

  console.log(emulator);

  return (
    <section
      className="panel stage play-panel"
      style={{ display: showCanvas ? 'block' : 'none' }}
      aria-hidden={!showCanvas}
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">Emulator</p>
          <h2>{activeRom ?? 'Awaiting ROM'}</h2>
          <p className="muted small">{status.message}</p>
        </div>
        <div className="muted small">
          Keyboard: arrows, Z/X, A/S, Shift (Select), Enter/Space (Start)
        </div>
      </div>

      <div className="canvas-shell full">
        <div ref={containerRef} style={{ background: '#000' }} />
        <div className="overlay top">
          <span className="badge ghost">{activeRom ?? 'No ROM loaded'}</span>
          <div className="inline-actions">
            <button
              type="button"
              className="ghost"
              disabled={!emulator || !activeRom}
              onClick={onPauseToggle}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              className="ghost"
              disabled={!emulator || !activeRom}
              onClick={onReset}
            >
              Reset
            </button>
            <button
              type="button"
              className="ghost"
              disabled={!emulator || !activeRom}
              onClick={onQuit}
            >
              Quit
            </button>
          </div>
        </div>
        <div className="overlay bottom">
          <div className="inline-actions">
            <button
              type="button"
              className="accent"
              onClick={onSaveState}
              disabled={!emulator || !activeRom}
            >
              Quick save
            </button>
            <button
              type="button"
              onClick={onLoadState}
              disabled={!emulator || !activeRom}
            >
              Quick load
            </button>
            <button
              type="button"
              onClick={onAutoSave}
              disabled={!emulator || !activeRom}
            >
              Force auto-save
            </button>
          </div>
          <div className="muted small">Auto-save interval: 45s • Files live in IndexedDB</div>
        </div>
      </div>

      {showGamepad && (
        <div className="gamepad">
          <div className="dpad">
            <button
              type="button"
              onPointerDown={() => emulator?.buttonPress('up')}
              onPointerUp={() => emulator?.buttonUnpress('up')}
            >
              ▲
            </button>
            <div className="middle">
              <button
                type="button"
                onPointerDown={() => emulator?.buttonPress('left')}
                onPointerUp={() => emulator?.buttonUnpress('left')}
              >
                ◀
              </button>
              <button
                type="button"
                onPointerDown={() => emulator?.buttonPress('right')}
                onPointerUp={() => emulator?.buttonUnpress('right')}
              >
                ▶
              </button>
            </div>
            <button
              type="button"
              onPointerDown={() => emulator?.buttonPress('down')}
              onPointerUp={() => emulator?.buttonUnpress('down')}
            >
              ▼
            </button>
          </div>
          <div className="actions">
            <button
              type="button"
              className="accent"
              onPointerDown={() => emulator?.buttonPress('b')}
              onPointerUp={() => emulator?.buttonUnpress('b')}
            >
              B
            </button>
            <button
              type="button"
              className="accent"
              onPointerDown={() => emulator?.buttonPress('a')}
              onPointerUp={() => emulator?.buttonUnpress('a')}
            >
              A
            </button>
          </div>
          <div className="meta">
            <button
              type="button"
              onPointerDown={() => emulator?.buttonPress('l')}
              onPointerUp={() => emulator?.buttonUnpress('l')}
            >
              L
            </button>
            <button
              type="button"
              onPointerDown={() => emulator?.buttonPress('r')}
              onPointerUp={() => emulator?.buttonUnpress('r')}
            >
              R
            </button>
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
      )}
    </section>
  );
};

export default PlayView;
