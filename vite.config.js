import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path' // <-- PASO 1: AÑADIR ESTA LÍNEA

export default defineConfig({
  // --- PASO 2: AÑADIR ESTA SECCIÓN 'resolve' COMPLETA ---
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ----------------------------------------------------------
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Poker Replayer Interactivo',
        short_name: 'Poker Replayer',
        description: 'Una herramienta para configurar, registrar y reproducir manos de poker para su estudio.',
        theme_color: '#1a202c',
        background_color: '#1a202c',
        start_url: '.',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})