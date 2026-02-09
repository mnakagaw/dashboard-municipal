import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/dashboard-municipal/",
  plugins: [react()],
  esbuild: {
    // Force esbuild to use the wasm version
    implementation: require("esbuild-wasm"),
  },
  build: {
    target: "esnext",
    minify: false,
  },
});
