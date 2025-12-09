import type { mGBAEmulator } from '@thenick775/mgba-wasm';
import mGBA from '@thenick775/mgba-wasm';
import { createContext, useEffect, useRef, useState } from 'react';


let instance: mGBAEmulator | null = null;
export const GBAContext = createContext<{ canvas: HTMLCanvasElement | null, emulator: mGBAEmulator | null }>({ canvas: null, emulator: null });

async function initialize(canvas: HTMLCanvasElement) {
  instance = await mGBA({
    canvas
  }).then(async (mod) => {
    await mod.FSInit();
    instance = mod;
    return mod;
  })
  return instance
}

export function getEmulator(canvas: HTMLCanvasElement): Promise<mGBAEmulator | null> {
  if (instance) return Promise.resolve(instance);
  return initialize(canvas)
}

export const EmulatorContext = ({ children }: { children: React.ReactNode }) => {
  const [emulator, setEmulator] = useState<mGBAEmulator | null>(null);
  const canvasRef = useRef(document.createElement('canvas'));

  useEffect(() => {
    if (!canvasRef.current) return;
    getEmulator(canvasRef.current).then(setEmulator);
  }, [canvasRef.current]);

  return (<GBAContext value={{ canvas: canvasRef.current, emulator }
  } >
    {children}
  </GBAContext>)
    ;
};
