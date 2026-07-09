import { useEffect, useRef, useState } from 'react';

type Line = { type: string; target: string; x: number; y: number; ts: number };

/**
 * TEMPORARY on-device diagnostic overlay. Renders only in dev builds.
 * Shows the last few pointer events (incl. pointercancel) with target + coords
 * so we can confirm whether iOS is eating/cancelling touches on the controls.
 * Remove once the landscape touch fix is verified on the iPhone.
 */
const PointerDebug = () => {
  const [lines, setLines] = useState<Line[]>([]);
  const bufRef = useRef<Line[]>([]);

  useEffect(() => {
    const record = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const el = e.target as HTMLElement | null;
      const target = el ? `${el.tagName.toLowerCase()}.${el.className || ''}`.slice(0, 28) : '—';
      bufRef.current = [
        { type: e.type.replace('pointer', ''), target, x: Math.round(e.clientX), y: Math.round(e.clientY), ts: Date.now() },
        ...bufRef.current,
      ].slice(0, 6);
      setLines(bufRef.current);
    };
    const types = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];
    // Capture phase so we see events even if a child stops propagation.
    types.forEach((t) => window.addEventListener(t, record as EventListener, { capture: true }));
    return () =>
      types.forEach((t) => window.removeEventListener(t, record as EventListener, { capture: true }));
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 4,
        left: 4,
        zIndex: 9999,
        pointerEvents: 'none',
        font: '10px/1.3 monospace',
        color: '#9ef2c7',
        background: 'rgba(0,0,0,0.6)',
        padding: '4px 6px',
        borderRadius: 6,
        maxWidth: '52vw',
      }}
    >
      {lines.map((l) => (
        <div key={l.ts}>
          {l.type} {l.x},{l.y} → {l.target}
        </div>
      ))}
    </div>
  );
};

export default PointerDebug;
