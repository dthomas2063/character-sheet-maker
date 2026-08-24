import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Character Sheet Maker',
        short_name: 'Character Sheets',
        description: 'Create and manage tabletop RPG character sheets.',
        theme_color: '#1d2927',
        background_color: '#101417',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//]
      }
    })
  ]
  ,server: {
    proxy: {
      // forward /api/* -> http://localhost:4000/*
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
