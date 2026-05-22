import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  base: "./",
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      "/cursbnr": {
        target: "https://www.cursbnr.ro",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/cursbnr/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
            proxyReq.removeHeader("cookie");
            proxyReq.setHeader(
              "User-Agent",
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );
            proxyReq.setHeader("Accept", "text/html,*/*");
            proxyReq.setHeader("Accept-Language", "ro-RO,ro;q=0.9,en;q=0.8");
          });
        },
      },
      "/anaf": {
        target: "https://webservicesp.anaf.ro",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/anaf/, ""),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      },
    },
  },
});
