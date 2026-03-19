import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "my-first-app",
  scheme: "intoss",
  web: {
    port: 5173,
    commands: {
      dev: "npx vite",
      build: "npx vite build",
    },
    outdir: "./dist",
  },
});
