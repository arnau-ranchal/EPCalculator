import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],

  test: {
    // Include only src tests
    include: ['src/**/*.{test,spec}.{js,ts}'],

    // Exclude node_modules and emsdk
    exclude: [
      'node_modules/**',
      'emsdk/**',
      'dist/**',
      'public/**'
    ],

    // Environment
    environment: 'node',

    // Globals
    globals: true,

    // Coverage (optional)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/**/*.test.{js,ts}', 'src/**/*.spec.{js,ts}']
    }
  },

  // Path resolution (same as vite.config.ts)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/frontend'),
      '@/components': path.resolve(__dirname, 'src/frontend/components'),
      '@/stores': path.resolve(__dirname, 'src/frontend/stores'),
      '@/utils': path.resolve(__dirname, 'src/frontend/utils'),
      '@/types': path.resolve(__dirname, 'src/frontend/types')
    }
  }
})
