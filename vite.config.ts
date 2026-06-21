import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => ({
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  plugins: [
    react(),
    ...(mode === 'lib' ? [dts({ include: ['src'], insertTypesEntry: true })] : []),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: mode === 'lib' ? {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SkuseUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `skuse-ui.${format}.js`,
    },
    outDir: 'dist',
    cssCodeSplit: false,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        assetFileNames: (info) => {
          if (info.names?.some(n => n.endsWith('.css'))) return 'style.css';
          return info.names?.[0] ?? 'asset';
        },
      },
    },
  } : {
    outDir: 'dist-app',
  },
}));
