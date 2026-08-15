import { defineConfig } from 'vite';
import { handleChatRoute, handleModelsRoute } from './api.js';

function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          return res.end();
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch (e) {
            req.body = {};
          }

          try {
            if (req.url.startsWith('/api/models')) {
              await handleModelsRoute(req, res);
            } else if (req.url.startsWith('/api/chat')) {
              await handleChatRoute(req, res);
            } else {
              next();
            }
          } catch (err) {
            next(err);
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [expressApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
