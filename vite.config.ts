/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['branding/clikarage-logo.png'],
      manifest: {
        name: 'Clikarage',
        short_name: 'Clikarage',
        description: 'Clikarage Pro & Client — gestion de garage et réservation.',
        theme_color: '#0f766e',
        background_color: '#0b1220',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'branding/clikarage-logo.png', sizes: '1450x1118', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api/], cleanupOutdatedCaches: true },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 4174 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    exclude: ['node_modules', 'dist', 'scripts'],
  },
})
