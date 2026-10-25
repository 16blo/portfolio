import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), {
    name: "portfolio-security-policy",
    transformIndexHtml: {
      order: "post",
      handler(_html, context) {
        // Vite's development HMR needs inline bootstrap code. Production does not.
        if (context.server) return;
        return [
          { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'none'; worker-src 'none'" }, injectTo: "head-prepend" },
          { tag: "meta", attrs: { name: "referrer", content: "no-referrer" }, injectTo: "head-prepend" }
        ];
      }
    }
  }],
  // Works for both username.github.io and username.github.io/portfolio/.
  base: "./",
  build: {
    outDir: "docs",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        portfolio: fileURLToPath(new URL("./index.html", import.meta.url)),
        editor: fileURLToPath(new URL("./editeur.html", import.meta.url))
      }
    }
  }
});
