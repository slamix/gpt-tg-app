import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// ENV knobs:
//   PUBLIC_HOST=app.cryptofintech.ai
//   PUBLIC_HTTPS=true
// When unset, it falls back to localhost dev.

const PUBLIC_HOST = process.env.PUBLIC_HOST || 'localhost';
const PUBLIC_HTTPS = (process.env.PUBLIC_HTTPS || 'false').toLowerCase() === 'true';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: { api: 'modern' },
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),
    // mkcert removed — TLS is terminated by Nginx
  ],
  build: {
    target: 'esnext',
  },
  publicDir: './public',
  server: {
    host: true,           // 0.0.0.0
    port: 5173,
    strictPort: true,

    // Let Vite know which hosts can reach it (HMR handshake)
    allowedHosts: [PUBLIC_HOST],

    // The public origin Vite uses when constructing HMR URLs
    // (important when sitting behind HTTPS reverse proxy)
    origin: `${PUBLIC_HTTPS ? 'https' : 'http'}://${PUBLIC_HOST}`,

    // Make HMR work through Nginx+TLS
    hmr: {
      host: PUBLIC_HOST,                 // e.g. app.cryptofintech.ai
      protocol: PUBLIC_HTTPS ? 'wss' : 'ws',
      clientPort: PUBLIC_HTTPS ? 443 : 5173,
      // optional: path: '/hmr', (only if you custom-route WS in Nginx)
    },

    // (Optional) Dev-time API proxy so you can call `/api/v1` same-origin
    // If your API is served on n8n.cryptofintech.ai, you can proxy it here
    // to avoid CORS during local/dev:
    // proxy: {
    //   '/api/v1': {
    //     target: 'https://n8n.cryptofintech.ai',
    //     changeOrigin: true,
    //     secure: true,
    //     // If you need to forward Telegram headers while testing:
    //     // headers: {
    //     //   'X-Telegram-Init-Data': '...'
    //     // }
    //   },
    // },
  },
});
