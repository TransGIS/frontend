import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // hero-section.jpeg ada di root repo (di luar folder frontend), izinkan dev server membacanya
  server: { fs: { allow: ['..'] } },
})
