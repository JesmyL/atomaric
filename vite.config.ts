import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
      lib: {
        entry: resolve(__dirname, 'src/index.js'),
        name: 'atomaric',
        fileName: 'atomaric',
      },
      rollupOptions: {
        external: ['react'],
      },
    },
    plugins: [react()],
  };
});
