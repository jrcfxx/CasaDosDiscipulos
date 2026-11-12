/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build com Vite (substitui o Create React App, descontinuado).
// - Saída em build/ (o Dockerfile copia daqui para o Nginx)
// - Variáveis REACT_APP_* continuam valendo (import.meta.env.REACT_APP_API_URL)
// - Dev na porta 3000, como antes (CORS do backend e scripts de e2e esperam essa porta)
export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
