import { defineConfig } from 'vite';
import { 
  handleChatRoute, 
  handleModelsRoute, 
  handleSendVerificationEmailRoute, 
  handleTermuxExecRoute,
  handleTermuxFileRoute,
  handleBugAnalysisRoute,
  handleImageGenerateRoute,
  handleImageProxyRoute,
  handleFeedbackRoute,
  handleGetFeedbackRoute,
  handleMarkFeedbackReadRoute,
  handleDeleteFeedbackRoute
} from './api.js';

function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/') && !url.startsWith('/health') && !url.startsWith('/ping')) {
          return next();
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          return res.end();
        }

        if (url === '/health' || url === '/ping' || url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
        }

        const handleRequestWithBody = async (bodyObj) => {
          req.body = bodyObj || {};
          try {
            if (url.startsWith('/api/models')) {
              await handleModelsRoute(req, res);
            } else if (url.startsWith('/api/chat')) {
              await handleChatRoute(req, res);
            } else if (url.startsWith('/api/termux/file')) {
              await handleTermuxFileRoute(req, res);
            } else if (url.startsWith('/api/bug-analysis')) {
              await handleBugAnalysisRoute(req, res);
            } else if (url.startsWith('/api/image/generate') || url.startsWith('/api/generate-image') || url === '/api/image' || url.startsWith('/api/image?')) {
              await handleImageGenerateRoute(req, res);
            } else if (url.startsWith('/api/image-proxy')) {
              await handleImageProxyRoute(req, res);
            } else if (url.startsWith('/api/termux/exec') || url.startsWith('/api/exec')) {
              await handleTermuxExecRoute(req, res);
            } else if (url.startsWith('/api/auth/send-verification') || url.startsWith('/api/send-email')) {
              await handleSendVerificationEmailRoute(req, res);
            } else if (url === '/api/feedback/read') {
              await handleMarkFeedbackReadRoute(req, res);
            } else if (url === '/api/feedback/delete' || url.startsWith('/api/feedback/')) {
              await handleDeleteFeedbackRoute(req, res);
            } else if (url === '/api/feedback' || url.startsWith('/api/feedback?')) {
              if (req.method === 'GET') {
                await handleGetFeedbackRoute(req, res);
              } else {
                await handleFeedbackRoute(req, res);
              }
            } else {
              next();
            }
          } catch (err) {
            console.error('[API Middleware Error]:', err);
            if (!res.writableEnded) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
            }
          }
        };

        if (req.method === 'GET') {
          return handleRequestWithBody({});
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          let parsed = {};
          if (body) {
            try {
              parsed = JSON.parse(body);
            } catch (e) {
              parsed = {};
            }
          }
          handleRequestWithBody(parsed);
        });

        req.on('error', (err) => {
          console.error('[Request Stream Error]:', err);
          next(err);
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [expressApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true
  }
});
