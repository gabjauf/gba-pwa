import { useCallback, useMemo, useRef } from 'react';

export type DPadDirection = 'up' | 'down' | 'left' | 'right';

export type DPadProps = {
  onPress: (dir: DPadDirection) => void;
  onUnpress: (dir: DPadDirection) => void;
  disabled?: boolean;
  className?: string;
};

const OCTANT_DIRS: DPadDirection[][] = [
  ['right'],
  ['down', 'right'],
  ['down'],
  ['down', 'left'],
  ['left'],
  ['up', 'left'],
  ['up'],
  ['up', 'right'],
];

function dirsFromPoint(clientX: number, clientY: number, rect: DOMRect): DPadDirection[] {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const dist = Math.hypot(dx, dy);
  const deadzone = Math.min(rect.width, rect.height) * 0.18;
  if (dist < deadzone) return [];

  const angle = Math.atan2(dy, dx);
  const octant = Math.round(angle / (Math.PI / 4));
  const index = (octant + 8) % 8;
  return OCTANT_DIRS[index] ?? [];
}

const DPad = ({ onPress, onUnpress, disabled, className }: DPadProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerDirsRef = useRef<Map<number, DPadDirection[]>>(new Map());
  const countsRef = useRef<Record<DPadDirection, number>>({
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  });

  const applyDirs = useCallback(
    (pointerId: number, nextDirs: DPadDirection[]) => {
      const prevDirs = pointerDirsRef.current.get(pointerId) ?? [];
      const prevSet = new Set(prevDirs);
      const nextSet = new Set(nextDirs);

      for (const dir of prevSet) {
        if (!nextSet.has(dir)) {
          countsRef.current[dir] = Math.max(0, countsRef.current[dir] - 1);
          if (countsRef.current[dir] === 0) onUnpress(dir);
        }
      }

      for (const dir of nextSet) {
        if (!prevSet.has(dir)) {
          countsRef.current[dir] += 1;
          if (countsRef.current[dir] === 1) onPress(dir);
        }
      }

      if (nextDirs.length === 0) {
        pointerDirsRef.current.delete(pointerId);
      } else {
        pointerDirsRef.current.set(pointerId, nextDirs);
      }
    },
    [onPress, onUnpress],
  );

  const clearPointer = useCallback(
    (pointerId: number) => {
      const prevDirs = pointerDirsRef.current.get(pointerId);
      if (!prevDirs) return;
      applyDirs(pointerId, []);
    },
    [applyDirs],
  );

  const handlePointerEvent = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const nextDirs = dirsFromPoint(event.clientX, event.clientY, rect);
      applyDirs(event.pointerId, nextDirs);
    },
    [applyDirs, disabled],
  );

  const handlers = useMemo(
    () => ({
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        event.preventDefault();
        if (typeof rootRef.current?.setPointerCapture === 'function') {
          rootRef.current.setPointerCapture(event.pointerId);
        }
        handlePointerEvent(event);
      },
      onPointerMove: handlePointerEvent,
      onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
        clearPointer(event.pointerId);
        if (typeof rootRef.current?.releasePointerCapture === 'function') {
          rootRef.current.releasePointerCapture(event.pointerId);
        }
      },
      onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => {
        clearPointer(event.pointerId);
      },
      onPointerLeave: (event: React.PointerEvent<HTMLDivElement>) => {
        clearPointer(event.pointerId);
      },
    }),
    [clearPointer, disabled, handlePointerEvent],
  );

  return (
    <div
      ref={rootRef}
      className={`dpad ${className ?? ''}`.trim()}
      aria-label="D-pad"
      {...handlers}
    >
      <button type="button" className="up" aria-hidden="true" tabIndex={-1}>
        ▲
      </button>
      <button type="button" className="left" aria-hidden="true" tabIndex={-1}>
        ◀
      </button>
      <div className="center" aria-hidden="true" />
      <button type="button" className="right" aria-hidden="true" tabIndex={-1}>
        ▶
      </button>
      <button type="button" className="down" aria-hidden="true" tabIndex={-1}>
        ▼
      </button>
    </div>
  );
};

export default DPad;
