# GBA Studio — mGBA PWA

A React + Vite progressive web app that wraps the `@thenick775/mgba-wasm` core with a bold interface, offline caching, quick saves, and touch controls. Runs as a standalone installable PWA with proper COOP/COEP headers for WebAssembly threads.

## Quick start

```bash
npm install
npm run dev   # start the dev server (HTTPS if certs exist)
npm run build # type-check + production build
npm run preview
```

## iOS testing over LAN (HTTPS)

iOS Safari requires a secure context for COOP/COEP + threads. When testing from your phone over the local network, use HTTPS:

```bash
# 1) Create a local trusted CA (once)
mkcert -install

# 2) Generate a cert that includes your Mac IP (replace the IP)
mkdir -p certs
mkcert -key-file certs/dev-key.pem -cert-file certs/dev.pem localhost 127.0.0.1 ::1 192.168.0.11

# 3) Run Vite over HTTPS and bind to LAN
npm run dev:https
```

Then open `https://192.168.0.11:5173` on your iPhone.

Note: once `certs/dev.pem` + `certs/dev-key.pem` exist, `npm run dev` will automatically use HTTPS.

If iOS still rejects the cert, install the mkcert root CA on the phone and enable it in:
`Settings → General → About → Certificate Trust Settings`.

## Features

- Drag-and-drop or browse to import `.gba/.gbc/.gb/.zip/.7z` ROMs; they persist in IndexedDB.
- Auto-resume the last ROM and restore autosaves (45s interval) stored in `/autosave`.
- Quick save/load slot (slot 0), manual auto-save trigger, and soft reset.
- On-screen gamepad for touch plus keyboard bindings (arrows, Z/X, A/S, Shift=Select, Enter/Space=Start).
- PWA manifest + Workbox runtime caching to keep the emulator binaries, icons, and UI assets offline.
- Volume + speed controls, toggle for the on-screen gamepad, and live status indicators.

## Hosting notes

The mGBA core uses threads and SharedArrayBuffer; you must serve with:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

`vite.config.ts` already sets these headers for `dev` and `preview`. Mirror them in production (e.g., via reverse proxy or static host headers).

## Project layout

- `src/App.tsx` — Emulator wiring, controls, state/persistence.
- `vite.config.ts` — PWA manifest, Workbox caching, COOP/COEP headers.
- `public/icons/*` — Generated PWA icons used in the manifest.

Enjoy the handheld vibes! Install to your home screen and keep playing offline. 
