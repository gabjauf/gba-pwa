import { useCallback, useMemo, useRef } from 'react';

export type ActionButton = 'a' | 'b';

export type ActionPadProps = {
  onPress: (button: ActionButton) => void;
  onUnpress: (button: ActionButton) => void;
  disabled?: boolean;
  className?: string;
};

function buttonsFromPoint(
  clientX: number,
  clientY: number,
  rectA: DOMRect,
  rectB: DOMRect,
): ActionButton[] {
  const centerA = {
    x: rectA.left + rectA.width / 2,
    y: rectA.top + rectA.height / 2,
  };
  const centerB = {
    x: rectB.left + rectB.width / 2,
    y: rectB.top + rectB.height / 2,
  };
  const distA = Math.hypot(clientX - centerA.x, clientY - centerA.y);
  const distB = Math.hypot(clientX - centerB.x, clientY - centerB.y);
  const radiusA = Math.min(rectA.width, rectA.height) / 2;
  const radiusB = Math.min(rectB.width, rectB.height) / 2;

  const withinBoth =
    distA <= radiusA * 1.5 &&
    distB <= radiusB * 1.5 &&
    Math.abs(distA - distB) <= Math.min(radiusA, radiusB) * 0.5;
  if (withinBoth) return ['a', 'b'];

  const withinA = distA <= radiusA * 1.25;
  const withinB = distB <= radiusB * 1.25;
  if (withinA) return ['a'];
  if (withinB) return ['b'];

  const nearest: ActionButton = distA < distB ? 'a' : 'b';
  const nearestDist = Math.min(distA, distB);
  const nearestRadius = nearest === 'a' ? radiusA : radiusB;
  if (nearestDist <= nearestRadius * 1.8) return [nearest];
  return [];
}

const ActionPad = ({ onPress, onUnpress, disabled, className }: ActionPadProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const aRef = useRef<HTMLButtonElement | null>(null);
  const bRef = useRef<HTMLButtonElement | null>(null);
  const pointerButtonsRef = useRef<Map<number, ActionButton[]>>(new Map());
  const countsRef = useRef<Record<ActionButton, number>>({ a: 0, b: 0 });

  const applyButtons = useCallback(
    (pointerId: number, nextButtons: ActionButton[]) => {
      const prevButtons = pointerButtonsRef.current.get(pointerId) ?? [];
      const prevSet = new Set(prevButtons);
      const nextSet = new Set(nextButtons);

      for (const button of prevSet) {
        if (!nextSet.has(button)) {
          countsRef.current[button] = Math.max(0, countsRef.current[button] - 1);
          if (countsRef.current[button] === 0) onUnpress(button);
        }
      }

      for (const button of nextSet) {
        if (!prevSet.has(button)) {
          countsRef.current[button] += 1;
          if (countsRef.current[button] === 1) onPress(button);
        }
      }

      if (nextButtons.length === 0) {
        pointerButtonsRef.current.delete(pointerId);
      } else {
        pointerButtonsRef.current.set(pointerId, nextButtons);
      }
    },
    [onPress, onUnpress],
  );

  const clearPointer = useCallback(
    (pointerId: number) => {
      if (!pointerButtonsRef.current.has(pointerId)) return;
      applyButtons(pointerId, []);
    },
    [applyButtons],
  );

  const handlePointerEvent = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!aRef.current || !bRef.current) return;
      const rectA = aRef.current.getBoundingClientRect();
      const rectB = bRef.current.getBoundingClientRect();
      const nextButtons = buttonsFromPoint(event.clientX, event.clientY, rectA, rectB);
      applyButtons(event.pointerId, nextButtons);
    },
    [applyButtons, disabled],
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
      className={`actions actions-pad ${className ?? ''}`.trim()}
      aria-label="Action buttons"
      {...handlers}
    >
      <button ref={bRef} type="button" className="accent action b" aria-hidden="true" tabIndex={-1}>
        B
      </button>
      <button ref={aRef} type="button" className="accent action a" aria-hidden="true" tabIndex={-1}>
        A
      </button>
    </div>
  );
};

export default ActionPad;

