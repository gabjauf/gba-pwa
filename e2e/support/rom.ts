import { fileURLToPath } from 'node:url';

/** The tiny generated GBA ROM used to exercise the play flow. */
export const ROM_PATH = fileURLToPath(new URL('../fixtures/test.gba', import.meta.url));
