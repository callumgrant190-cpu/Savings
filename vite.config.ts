import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative asset URLs so the build works on GitHub Pages under /<repo-name>/
// whatever the repo's casing, and from any other static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
