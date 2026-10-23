import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildId = Date.now().toString();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-version-json',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/version.json')) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.end(JSON.stringify({ version: buildId, builtAt: new Date().toISOString() }));
            return;
          }
          next();
        });
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: buildId, builtAt: new Date().toISOString() })
        });
      }
    }
  ],
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId)
  }
})

