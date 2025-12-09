import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { createHtmlPlugin } from 'vite-plugin-html';

const coopCoepHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  // 'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Embedder-Policy': 'credentialless',
};

export default defineConfig({
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
      // strategies: 'injectManifest',
      // srcDir: 'src',
      // filename: 'sw.ts',
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
        start_url: '/',
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
  },
  optimizeDeps: {
    exclude: ['@thenick775/mgba-wasm']
  },
  preview: {
    headers: coopCoepHeaders,
  },
});
