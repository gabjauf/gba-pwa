/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import {
  precacheAndRoute,
  createHandlerBoundToURL,
  cleanupOutdatedCaches,
} from 'workbox-precaching';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<import('workbox-precaching').PrecacheEntry | string>;
};

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  /.*\.(?:js|mjs|wasm)$/i,
  new CacheFirst({
    cacheName: 'emulator-binaries',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

registerRoute(
  /.*\.(?:css|png|jpg|jpeg|svg|woff2?)$/i,
  new StaleWhileRevalidate({
    cacheName: 'ui-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

registerRoute(
  /\/[^.]*$/i,
  new NetworkFirst({
    cacheName: 'html-cache',
    networkTimeoutSeconds: 3,
  })
);

const navigationRoute = new NavigationRoute(
  createHandlerBoundToURL('/index.html'),
  { denylist: [/^\/api\//] }
);

registerRoute(navigationRoute);
