import { useContext, useEffect, useRef } from 'react';
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
  const isGbcRom = !!activeRom && /\.(gbc|gb)$/i.test(activeRom);

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
              {isPaused ? '▶' : '⏸'}
            </button>
            <button
              type="button"
              className="ghost icon"
              disabled={!emulator || !activeRom}
              onClick={onReset}
              title="Reset"
              aria-label="Reset"
            >
              ↻
            </button>
            <button
              type="button"
              className="ghost icon"
              disabled={!emulator || !activeRom}
              onClick={onQuit}
              title="Quit"
              aria-label="Quit"
            >
              ⏹
            </button>
            <button
              type="button"
              className="ghost icon"
              onClick={onSaveState}
              disabled={!emulator || !activeRom}
              title="Quick save"
              aria-label="Quick save"
            >
              💾
            </button>
            <button
              type="button"
              className="ghost icon"
              onClick={onLoadState}
              disabled={!emulator || !activeRom}
              title="Quick load"
              aria-label="Quick load"
            >
              📂
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
            className="ghost controls-hint"
            title="Controls: D‑pad, A/B, L/R shoulders, Select/Start bottom. Keyboard: arrows, Z/X, A/S, Shift (Select), Enter/Space (Start)."
            aria-label="Controls help"
          >
            🎮
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
