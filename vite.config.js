import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/dashboard-municipal/",
  plugins: [react()],
  build: {
    target: "esnext",
    minify: false,
    sourcemap: false,
  },
});
