import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/test-claude/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'GymOS — Tu Sistema de Entrenamiento',
        short_name: 'GymOS',
        description: 'Registra, analiza y optimiza tus entrenamientos de fuerza con IA',
        theme_color: '#060606',
        background_color: '#060606',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/test-claude/',
        scope: '/test-claude/',
        id: '/test-claude/',
        icons: [
          { src: '/test-claude/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: '/test-claude/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: '/test-claude/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/test-claude/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: '/test-claude/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: '/test-claude/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/test-claude/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: '/test-claude/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/test-claude/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'tanstack': ['@tanstack/react-router', '@tanstack/react-query'],
          'charts': ['recharts'],
          'ai': ['@google/generative-ai'],
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-progress',
            '@radix-ui/react-slider'
          ]
        }
      }
    }
  }
})
