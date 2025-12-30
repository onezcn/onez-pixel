import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// CDN 版本的 Vite 配置 - 打包为单个 JS 文件
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/onezgame.ts'),
      name: 'OnezGame',
      fileName: () => 'onezgame.min.js',
      formats: ['iife'], // 立即执行函数格式，适合 CDN
    },
    rollupOptions: {
      // 不外部化任何依赖，全部打包
      external: [],
      output: {
        // 确保所有依赖都打包进单个文件
        inlineDynamicImports: true,
        // 压缩输出
        compact: true,
        // 全局变量名
        globals: {},
        // 内联所有资源
        assetFileNames: 'onezgame.[ext]',
      },
    },
    // 输出目录
    outDir: 'dist/cdn',
    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留 console，方便调试
        drop_debugger: true,
      },
    },
    // 生成 sourcemap（可选，生产环境可以关闭）
    sourcemap: false,
    // 清空输出目录
    emptyOutDir: true,
    // CSS 代码分割 - 关闭，内联到 JS
    cssCodeSplit: false,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // 确保 CSS 被正确处理
  css: {
    modules: false,
  },
});

