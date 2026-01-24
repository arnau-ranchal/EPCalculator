import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte()],

  // Static assets directory (served at /)
  publicDir: 'public',

  // Build configuration
  build: {
    outDir: 'public',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          vendor: ['svelte'],
          plot: ['@observablehq/plot', 'd3'],
          utils: ['d3-scale', 'd3-array']
        }
      }
    },
    // Optimize for university server constraints
    chunkSizeWarningLimit: 1000, // 1MB chunks
    assetsInlineLimit: 4096 // 4KB inline limit
  },

  // Development server
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/api-docs': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/docs': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/frontend'),
      '@/components': path.resolve(__dirname, 'src/frontend/components'),
      '@/stores': path.resolve(__dirname, 'src/frontend/stores'),
      '@/utils': path.resolve(__dirname, 'src/frontend/utils'),
      '@/types': path.resolve(__dirname, 'src/frontend/types')
    }
  },

  // Optimization for university servers
  optimizeDeps: {
    include: ['svelte', '@observablehq/plot', 'd3'],
    exclude: ['@vite/client', '@vite/env']
  },

  // Asset handling
  assetsInclude: ['**/*.wasm'],

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify('2.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },

  // CSS preprocessing
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          $primary-color: #C8102E;
          $secondary-color: #000000;
          $background-color: #FFFFFF;
          $text-color: #222222;
        `
      }
    }
  }
})