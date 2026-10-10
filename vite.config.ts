import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local hosting configuration.
// `host: 0.0.0.0` exposes the dev server on your machine's network so you can
// also test the PWA on a phone over Wi-Fi. `allowedHosts: true` lets requests
// through for any Host header (localhost, 127.0.0.1 and your LAN IP).
//
// Multi-page build: the customer storefront (index.html) and the admin panel
// (admin.html) are built together into dist/ and deploy to the same Cloudflare
// Pages project. Admin lives at /admin.html (see public/_redirects for /admin).
// Entry paths are relative to the project root; Vite resolves them.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
});


