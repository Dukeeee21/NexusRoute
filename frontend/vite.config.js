import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Inside Docker the backend is reachable as http://backend:8000;
// for local `npm run dev` it falls back to localhost.
const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:8000";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Docker on Windows/macOS doesn't forward filesystem events through
    // the bind mount, so Vite's HMR needs polling to detect changes.
    watch: {
      usePolling: true,
      interval: 300,
    },
    // Proxy API calls to the Django backend during development.
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
