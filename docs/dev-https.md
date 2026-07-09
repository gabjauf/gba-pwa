# On-device testing over HTTPS (why, and how to make it painless)

The mGBA core needs `SharedArrayBuffer`, which browsers only expose in a
**cross-origin-isolated secure context**. In practice that means the dev server
must be served over HTTPS with a certificate the device **trusts** — and on iOS
(Safari, Chrome, Brave… all use WebKit) an untrusted/self-signed cert does *not*
count, so `crossOriginIsolated` stays `false` and the core silently fails to boot.

## The IP problem

DHCP hands your Mac a new `192.168.x.x` regularly, and a TLS cert is pinned to
the exact names/IPs it was generated for. A cert made for `192.168.1.66` breaks
the moment you become `192.168.68.62`.

**Fix: don't use the IP. Use your Mac's Bonjour `.local` hostname**, which iOS
resolves over mDNS on the same Wi-Fi and which never changes with the IP.

## One-time setup

1. Install mkcert and its root CA (creates a local CA and trusts it on the Mac):
   ```sh
   brew install mkcert nss
   mkcert -install
   ```
2. Generate the dev cert for this machine's hostname (+ loopback + `*.local`):
   ```sh
   npm run certs
   ```
   It prints the URL to open, e.g. `https://macbook-pro-de-gabriel-2.local:5173`.
3. **Trust the mkcert root CA on the phone (once).** AirDrop
   `"$(mkcert -CAROOT)/rootCA.pem"` to the device, install the profile
   (Settings → Profile Downloaded → Install), then enable it under
   Settings → General → About → Certificate Trust Settings. This CA is stable —
   you never redo this, even when the leaf cert or IP changes.

## Everyday use

```sh
npm run dev:https      # HTTPS + --host
```
Open `https://<your-mac>.local:5173` on the device. `crossOriginIsolated` is
`true`, the core boots. If your hostname changed, re-run `npm run certs`.

## Sanity checks

- Console shows `mGBA core failed to initialise: … crossOriginIsolated=false`
  → the context isn't isolated: untrusted cert, wrong hostname, or a stale COI
  service worker. Clear site data / unregister the SW and hard-reload.
- `COOP/COEP Service Worker failed to register … coi-sw.js load failed` on the
  **dev** server is expected — Vite serves HTML there, so isolation comes from
  the dev server's response headers, not the service worker. (The service worker
  only matters for the deployed/offline build.)
