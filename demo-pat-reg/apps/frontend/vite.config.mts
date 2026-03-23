/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { join } from 'path';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../node_modules/.vite/apps',
  resolve: {
    alias: {
      '@': join(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 4200,
    host: process.env.HOST ?? 'localhost',
  },
  preview: {
    port: Number(process.env.PORT ?? 4200),
    host: process.env.HOST ?? 'localhost',
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'src/components/ui/**',
        'src/lib/shadcn/**',
        'src/hooks/shadcn/**',
        'src/lib/utils.ts',
        'src/hooks/use-mobile.ts',
        'src/hooks/use-keyboard-shortcut.ts',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
