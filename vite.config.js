import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Galavot Adventure - Passeios de Quadriciclo",
        short_name: "Galavot",
        description:
          "Reserve online seu passeio guiado de quadriciclo off-road em Guarapari - ES. Trilhas, cachoeira e mirantes com total segurança.",
        theme_color: "#151311",
        background_color: "#151311",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/?source=pwa",
        scope: "/",
        lang: "pt-BR",
        dir: "ltr",
        categories: ["travel", "sports", "lifestyle"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
