import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // IMPORTANT: Change 'rabidvault' to match your GitHub repo name exactly
  base: '/rabidvault/',
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
