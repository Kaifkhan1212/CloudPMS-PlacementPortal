import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Rewrite cookie domain so the browser sees the cookie
        // as belonging to localhost:5173 (Vite), not localhost:5000
        // This is required for the httpOnly refreshToken cookie to
        // be stored and re-sent correctly through the dev proxy.
        cookieDomainRewrite: 'localhost',
      },
    },
  },
});
