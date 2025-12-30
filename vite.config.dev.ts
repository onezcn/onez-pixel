import { defineConfig } from 'vite';
import { resolve } from 'path';

// 开发服务器配置 - 用于预览 index.html
export default defineConfig({
  server: {
    port: 5173,
    open: true,
    host: true,
  },
  publicDir: 'public',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});

