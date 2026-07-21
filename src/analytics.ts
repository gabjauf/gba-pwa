const UMAMI_SRC = 'https://cloud.umami.is/script.js';
const UMAMI_WEBSITE_ID = 'b1af973e-e0e1-406b-9c05-6d60d813237a';

/**
 * Loads the Umami analytics tag — but only while online. The installed PWA
 * boots from a cached shell whose service worker answers unmatched requests
 * with NetworkOnly, so a static cross-origin <script> in index.html fails to
 * fetch on an offline launch: pure console noise sitting on the boot path.
 * Gating on connectivity keeps analytics off the offline path entirely.
 */
export function loadAnalytics() {
  if (!navigator.onLine) return;
  const tag = document.createElement('script');
  tag.defer = true;
  tag.src = UMAMI_SRC;
  tag.dataset.websiteId = UMAMI_WEBSITE_ID;
  document.head.append(tag);
}
