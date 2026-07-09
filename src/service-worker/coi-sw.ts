/* eslint-disable -- vendored external */
// @ts-nocheck

import { addPlugins, cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { setDefaultHandler } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

/**
 * Used for non-production deploys only.
 *
 * This service worker is meant to operate in places like github pages that
 * do not have the ability to add headers to make the page cross origin isolated.
 *
 * To include this in a build, build with the mode `with-coi-serviceworker`.
 */

export type {};
declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string }>;
};

declare global {
  interface Window {
    coi: {
      shouldRegister?: () => boolean;
      shouldDeregister?: () => boolean;
      coepCredentialless?: () => boolean;
      coepDegrade?: () => boolean;
      doReload?: () => void;
      onUpdate?: () => void;
      quiet?: boolean;
    };
  }
}

/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coepCredentialless = false;

const withCoiHeaders = (response: Response) => {
  if (response.status === 0) {
    return response;
  }

  const newHeaders = new Headers(response.headers);
  newHeaders.set(
    'Cross-Origin-Embedder-Policy',
    coepCredentialless ? 'credentialless' : 'require-corp'
  );
  if (!coepCredentialless) {
    newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

const coiHeadersPlugin = {
  requestWillFetch: async ({ request }: { request: Request }) => {
    if (coepCredentialless && request.mode === 'no-cors') {
      return new Request(request, { credentials: 'omit' });
    }
    return request;
  },
  fetchDidSucceed: async ({ response }: { response: Response }) =>
    withCoiHeaders(response),
  cachedResponseWillBeUsed: async ({
    cachedResponse,
  }: {
    cachedResponse?: Response;
    request?: Request;
  }) =>
    // The document must keep its COOP/COEP headers too — without them the
    // offline/cached page is no longer cross-origin isolated, so
    // SharedArrayBuffer disappears and the mGBA core can't boot.
    cachedResponse ? withCoiHeaders(cachedResponse) : cachedResponse,
};

if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) =>
    event.waitUntil(self.clients.claim())
  );

  self.addEventListener('message', (ev) => {
    if (!ev.data) {
      return;
    } else if (ev.data.type === 'deregister') {
      self.registration
        .unregister()
        .then(() => {
          return self.clients.matchAll();
        })
        .then((clients) => {
          clients.forEach((client) =>
            (client as WindowClient).navigate(client.url)
          );
        });
    } else if (ev.data.type === 'coepCredentialless') {
      coepCredentialless = ev.data.value;
    }
  });

  addPlugins([coiHeadersPlugin]);
  precacheAndRoute(self.__WB_MANIFEST);
  cleanupOutdatedCaches();

  setDefaultHandler(
    new NetworkOnly({
      plugins: [coiHeadersPlugin],
    })
  );
}
