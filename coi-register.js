/*! coi-serviceworker client-side registration - adapted from coi-serviceworker v0.1.7 */
(() => {
  const reloadedBySelf = window.sessionStorage.getItem('coiReloadedBySelf');
  window.sessionStorage.removeItem('coiReloadedBySelf');
  const coepDegrading = reloadedBySelf == 'coepdegrade';

  const coi = {
    shouldRegister: () => !reloadedBySelf,
    shouldDeregister: () => false,
    coepCredentialless: () => true,
    coepDegrade: () => true,
    doReload: () => window.location.reload(),
    quiet: false,
    ...window.coi,
  };

  const notifyUpdate = () => {
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
    if (coi.onUpdate) coi.onUpdate();
  };

  const n = navigator;
  const controlling = n.serviceWorker && n.serviceWorker.controller;

  if (controlling && !window.crossOriginIsolated) {
    window.sessionStorage.setItem('coiCoepHasFailed', 'true');
  }
  const coepHasFailed = window.sessionStorage.getItem('coiCoepHasFailed');

  if (controlling) {
    const reloadToDegrade =
      coi.coepDegrade() && !(coepDegrading || window.crossOriginIsolated);
    n.serviceWorker.controller.postMessage({
      type: 'coepCredentialless',
      value:
        reloadToDegrade || (coepHasFailed && coi.coepDegrade())
          ? false
          : coi.coepCredentialless(),
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
      console.log('COOP/COEP Service Worker not registered, a secure context is required.');
    return;
  }

  if (!n.serviceWorker) {
    if (!coi.quiet)
      console.error('COOP/COEP Service Worker not registered, perhaps due to private mode.');
    return;
  }

  // Use a path relative to the current page so it works under any base URL.
  const swUrl = new URL('./coi-sw.js', window.location.href).href;

  n.serviceWorker.register(swUrl).then(
    (registration) => {
      if (!coi.quiet)
        console.log('COOP/COEP Service Worker registered', registration.scope);

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

      // SW is active but not yet controlling — reload so it takes over.
      if (registration.active && !n.serviceWorker.controller) {
        if (!coi.quiet)
          console.log('Reloading page to make use of COOP/COEP Service Worker.');
        window.sessionStorage.setItem('coiReloadedBySelf', 'notcontrolling');
        coi.doReload();
      }
    },
    (err) => {
      if (!coi.quiet)
        console.error('COOP/COEP Service Worker failed to register:', err);
    },
  );
})();
