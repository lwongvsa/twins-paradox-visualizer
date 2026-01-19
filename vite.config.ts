import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // For GitHub Pages, if your repo is at username.github.io/repo-name, set base to '/repo-name/'
    // If it's at username.github.io (root), set base to '/'
    const base = process.env.GITHUB_PAGES_BASE || '/';
    
    return {
      base: base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Vite automatically exposes VITE_ prefixed env vars to client
      // No need to manually define them here
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
      }
    };
});
