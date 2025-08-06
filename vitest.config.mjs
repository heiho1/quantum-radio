import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['public/**/*.test.js', 'tests/frontend/**/*.test.js'],
    exclude: ['node_modules/**', 'tests/backend/**'],
    globals: true,
    setupFiles: ['tests/frontend-setup.js']
  },
  resolve: {
    alias: {
      '@': '/public'
    }
  }
});