import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": "http://127.0.0.1:3000" },
  },
  build: {
    // Mantem o bundle compativel com navegadores e WebViews anteriores ao
    // alvo padrao do Vite, sem depender de sintaxe JavaScript muito recente.
    target: "es2018",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
