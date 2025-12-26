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
  }) => (cachedResponse ? withCoiHeaders(cachedResponse) : cachedResponse),
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
} else {
  (() => {
    const reloadedBySelf = window.sessionStorage.getItem('coiReloadedBySelf');
    window.sessionStorage.removeItem('coiReloadedBySelf');
    const coepDegrading = reloadedBySelf == 'coepdegrade';

    // You can customize the behavior of this script through a global `coi` variable.
    const coi = {
      shouldRegister: () => !reloadedBySelf,
      shouldDeregister: () => false,
      coepCredentialless: () => true,
      coepDegrade: () => true,
      doReload: () => window.location.reload(),
      quiet: false,
      ...window.coi
    };
    const notifyUpdate = () => {
      window.dispatchEvent(new CustomEvent('pwa-update-available'));
      if (coi.onUpdate) {
        coi.onUpdate();
      }
    };

    const n = navigator;
    const controlling = n.serviceWorker && n.serviceWorker.controller;

    // Record the failure if the page is served by serviceWorker.
    if (controlling && !window.crossOriginIsolated) {
      window.sessionStorage.setItem('coiCoepHasFailed', 'true');
    }
    const coepHasFailed = window.sessionStorage.getItem('coiCoepHasFailed');

    if (controlling) {
      // Reload only on the first failure.
      const reloadToDegrade =
        coi.coepDegrade() && !(coepDegrading || window.crossOriginIsolated);
      n.serviceWorker.controller.postMessage({
        type: 'coepCredentialless',
        value:
          reloadToDegrade || (coepHasFailed && coi.coepDegrade())
            ? false
            : coi.coepCredentialless()
      });
      if (reloadToDegrade) {
        if (!coi.quiet) console.log('Reloading page to degrade COEP.');
        window.sessionStorage.setItem('coiReloadedBySelf', 'coepdegrade');
        coi.doReload();
      }

      if (coi.shouldDeregister()) {
        n.serviceWorker.controller.postMessage({ type: 'deregister' });
      }
    }

    if (!coi.shouldRegister()) return;

    if (!window.isSecureContext) {
      if (!coi.quiet)
        console.log(
          'COOP/COEP Service Worker not registered, a secure context is required.'
        );
      return;
    }

    // In some environments (e.g. Firefox private mode) this won't be available
    if (!n.serviceWorker) {
      if (!coi.quiet)
        console.error(
          'COOP/COEP Service Worker not registered, perhaps due to private mode.'
        );
      return;
    }

    n.serviceWorker
      .register((window.document.currentScript as HTMLScriptElement)?.src)
      .then(
        (registration) => {
          if (!coi.quiet)
            console.log(
              'COOP/COEP Service Worker registered',
              registration.scope
            );

          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && registration.active) {
                if (!coi.quiet) console.log('Update available for the PWA.');
                notifyUpdate();
              }
            });
          });

          // If the registration is active, but it's not controlling the page
          if (registration.active && !n.serviceWorker.controller) {
            if (!coi.quiet)
              console.log(
                'Reloading page to make use of COOP/COEP Service Worker.'
              );
            window.sessionStorage.setItem(
              'coiReloadedBySelf',
              'notcontrolling'
            );
            coi.doReload();
          }
        },
        (err) => {
          if (!coi.quiet)
            console.error('COOP/COEP Service Worker failed to register:', err);
        }
      );
  })();
}
