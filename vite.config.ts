import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sql.js ships CommonJS, so it has to be pre-bundled for the module worker.
  optimizeDeps: { include: ['sql.js'] },
  worker: { format: 'es' },
  server: { port: Number(process.env.PORT) || 5173 },
})
