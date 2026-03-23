import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Set VITE_BASE_PATH in your environment / GitHub Secret to match your repo name.
  // e.g. if your repo is github.com/yourname/rabidvault, set VITE_BASE_PATH=/rabidvault/
  // Leave unset (or set to /) for custom domain or root deployments.
  base: process.env.VITE_BASE_PATH || '/rabidvault/',
  plugins: [react()],
  build: {
    outDir:        'dist',
    emptyOutDir:   true,
    sourcemap:     false,
    rollupOptions: {
      output: {
        manualChunks: {
          react:    ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          charts:   ['chart.js'],
        },
      },
    },
  },
})
