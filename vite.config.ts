import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fix: Expõe a API_KEY para o código do lado do cliente para alinhar com as diretrizes do SDK @google/genai.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
})
