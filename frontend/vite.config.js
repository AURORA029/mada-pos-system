import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement basées sur le mode (development/production)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Sécurisation avec valeurs par défaut (Zero Trust sur l'environnement)
  const backendHost = env.VITE_BACKEND_HOST || 'localhost';
  const backendPort = env.VITE_BACKEND_PORT || '5000';
  const backendUrl = `http://${backendHost}:${backendPort}`;

  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})