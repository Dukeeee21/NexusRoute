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
  build: {
    rollupOptions: {
      output: {
        // Leaflet and Chart.js are only used by the admin Routes/Reports
        // pages, not the driver view or login — splitting them out of
        // the main bundle means those two heavy libraries only download
        // when a page that actually needs them is visited, instead of
        // bloating every route's initial load.
        manualChunks: {
          leaflet: ["leaflet"],
          charts: ["chart.js", "react-chartjs-2"],
          vendor: ["react", "react-dom", "react-router-dom", "react-redux", "@reduxjs/toolkit"],
        },
      },
    },
  },
});
