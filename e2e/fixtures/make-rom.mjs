// Generates a minimal, licence-free GBA ROM used only by the e2e tests.
// mGBA loads a GBA image without validating the Nintendo logo/checksum, so all
// we need is a valid ARM entry instruction and some padding. The entry is
// `b .` (0xEAFFFFFE) — an infinite branch — so the "game" simply idles once the
// wrapper hands it to the core. No third-party content.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SIZE = 1024;
const rom = Buffer.alloc(SIZE); // zero-filled
rom.writeUInt32LE(0xeafffffe, 0); // ARM: b . (loop forever)

const out = fileURLToPath(new URL('./test.gba', import.meta.url));
writeFileSync(out, rom);
console.log(`wrote ${out} (${SIZE} bytes)`);
