import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Voz das Mulheres',
          short_name: 'VozMulheres',
          description: 'Pesquisa Voz das Mulheres - Dra. Fernanda Sarelli',
          theme_color: '#e91e63',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: 'https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp',
              sizes: '192x192',
              type: 'image/webp',
            },
            {
              src: 'https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp',
              sizes: '512x512',
              type: 'image/webp',
            },
            {
              src: 'https://rede.deputadasarelli.com.br/assets/logo-sarelli-Cg7sc1zQ.webp',
              sizes: '512x512',
              type: 'image/webp',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
  },
});