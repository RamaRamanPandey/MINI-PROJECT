import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    base: './', // Ensures assets are loaded correctly on GitHub Pages sub-directories
    define: {
      // Polyfill process.env for the Gemini Service
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});