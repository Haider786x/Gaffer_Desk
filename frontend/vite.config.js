import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiTarget = process.env.VITE_PROXY_API_TARGET || "http://127.0.0.1:3000";
const aiTarget = process.env.VITE_PROXY_AI_TARGET || "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // More specific paths first — AI service on :5000
      "/api/ai": {
        target: aiTarget,
        changeOrigin: true,
      },
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/uploads": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
