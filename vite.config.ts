import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // CRUCIAL para GitHub Pages e deploys estáticos
    plugins: [react()],
    define: {
      'process.env': env
    }
  };
});