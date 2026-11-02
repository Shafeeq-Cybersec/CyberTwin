import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration — dev server proxies /api to the FastAPI backend
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
