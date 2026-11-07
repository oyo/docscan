import { defineConfig } from 'vite-plus'

export default defineConfig({
  base: '/docscan/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {},
  lint: {},
})
