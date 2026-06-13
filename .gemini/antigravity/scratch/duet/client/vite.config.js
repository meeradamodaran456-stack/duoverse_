import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',           // Required for Capacitor — assets use relative paths
  build: {
    outDir: 'dist',     // Capacitor reads from dist/
  },
})
