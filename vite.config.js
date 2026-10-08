import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/tene-omarim-rain/',
  build: { outDir: 'docs' },
});
