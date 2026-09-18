import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {handleFlatsApi} from './src/services/apiMiddleware';

function flatsApiVitePlugin(): Plugin {
  return {
    name: 'flats-api-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleFlatsApi(req, res, next);
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), flatsApiVitePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
