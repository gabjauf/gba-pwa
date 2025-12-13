import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { createHtmlPlugin } from 'vite-plugin-html';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const coopCoepHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  // 'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Embedder-Policy': 'credentialless',
};

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const resolveFromRoot = (maybeRelativePath: string) =>
  path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(projectRoot, maybeRelativePath);

const loadHttpsConfig = () => {
  const certFile = resolveFromRoot(process.env.VITE_SSL_CERT ?? 'certs/dev.pem');
  const keyFile = resolveFromRoot(process.env.VITE_SSL_KEY ?? 'certs/dev-key.pem');
  const hasCerts = fs.existsSync(certFile) && fs.existsSync(keyFile);
  if (!hasCerts) return undefined;
  return {
    cert: fs.readFileSync(certFile),
    key: fs.readFileSync(keyFile),
  };
};

export default defineConfig(() => {
  const explicitHttps = process.env.VITE_HTTPS === '1' || process.env.HTTPS === 'true';
  const httpsConfig = explicitHttps ? loadHttpsConfig() : undefined;

  if (explicitHttps && !httpsConfig && explicitHttps) {
    const certFile = resolveFromRoot(process.env.VITE_SSL_CERT ?? 'certs/dev.pem');
    const keyFile = resolveFromRoot(process.env.VITE_SSL_KEY ?? 'certs/dev-key.pem');
    throw new Error(
      [
        'HTTPS is enabled (VITE_HTTPS=1) but certificate files were not found.',
        `Expected cert: ${certFile}`,
        `Expected key:  ${keyFile}`,
        'Generate them with mkcert (see README) or set VITE_SSL_CERT/VITE_SSL_KEY.',
      ].join('\n'),
    );
  }

  return ({
  base: process.env.NODE_ENV === 'production' ? '/gba-pwa/' : '/',
  plugins: [
    react(),
    createHtmlPlugin({
      inject: {
        tags: [
          {
            tag: 'script',
            attrs: { src: 'coi-sw.js' },
            injectTo: 'head-prepend'
          }
        ]
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      minify: false,
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable.png',
      ],
      manifest: {
        name: 'GBA Studio (mGBA PWA)',
        short_name: 'GBA Studio',
        description:
          'A polished offline-ready wrapper around the mGBA core with touch controls and quick saves.',
        theme_color: '#0c1021',
        background_color: '#050712',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/gba-pwa/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm}'],
        navigateFallbackDenylist: [/^\/admin/]
      },
      injectRegister: null,
      strategies: 'injectManifest',
      srcDir: 'src/service-worker',
      filename: 'coi-sw.ts',
      injectManifest: {
        injectionPoint: undefined
        // globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
      },
    }),
  ],
  server: {
    headers: coopCoepHeaders,
    host: true,
    https: httpsConfig,
  },
  optimizeDeps: {
    exclude: ['@thenick775/mgba-wasm']
  },
  preview: {
    headers: coopCoepHeaders,
  },
});
});
