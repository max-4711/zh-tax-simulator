import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/zh-tax-simulator/',
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
