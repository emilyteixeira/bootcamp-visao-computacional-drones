import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLE=1 gera um único index.html autocontido (JS/CSS embutidos) para publicar como link.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(process.env.SINGLE === '1' ? [viteSingleFile()] : [])],
  base: './',
  build: { outDir: process.env.SINGLE === '1' ? 'dist-link' : 'dist', chunkSizeWarningLimit: 3000 },
}));
