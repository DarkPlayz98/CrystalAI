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
  handleDeleteFeedbackRoute,
  handleEmailImageRoute
} from './api.js';

function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0];

        if (!pathname.startsWith('/api/') && pathname !== '/health' && pathname !== '/ping' && !pathname.startsWith('/health/')) {
          return next();
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          return res.end();
        }

        if (pathname === '/health' || pathname === '/ping' || pathname === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
        }

        const handleRequestWithBody = async (bodyObj) => {
          req.body = bodyObj || {};
          try {
            if (pathname.startsWith('/api/models')) {
              await handleModelsRoute(req, res);
            } else if (
              pathname.startsWith('/api/chat') || 
              pathname.startsWith('/api/generate') || 
              pathname.startsWith('/api/conversation') || 
              pathname.startsWith('/api/message') ||
              pathname.startsWith('/api/v1/chat')
            ) {
              await handleChatRoute(req, res);
            } else if (pathname.startsWith('/api/termux/file')) {
              await handleTermuxFileRoute(req, res);
            } else if (pathname.startsWith('/api/bug-analysis')) {
              await handleBugAnalysisRoute(req, res);
            } else if (
              pathname.startsWith('/api/image/generate') || 
              pathname.startsWith('/api/generate-image') || 
              pathname === '/api/image' || 
              pathname.startsWith('/api/image')
            ) {
              await handleImageGenerateRoute(req, res);
            } else if (pathname.startsWith('/api/image-proxy')) {
              await handleImageProxyRoute(req, res);
            } else if (pathname.startsWith('/api/termux/exec') || pathname.startsWith('/api/exec')) {
              await handleTermuxExecRoute(req, res);
            } else if (pathname.startsWith('/api/auth/send-verification') || pathname.startsWith('/api/send-email')) {
              await handleSendVerificationEmailRoute(req, res);
            } else if (pathname === '/api/email-image') {
              await handleEmailImageRoute(req, res);
            } else if (pathname === '/api/feedback/read') {
              await handleMarkFeedbackReadRoute(req, res);
            } else if (pathname === '/api/feedback/delete' || pathname.startsWith('/api/feedback/')) {
              await handleDeleteFeedbackRoute(req, res);
            } else if (pathname === '/api/feedback') {
              if (req.method === 'GET') {
                await handleGetFeedbackRoute(req, res);
              } else {
                await handleFeedbackRoute(req, res);
              }
            } else {
              // Unrecognized /api/* route: respond with JSON 404, never fallback to index.html
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `API endpoint not found: ${pathname}`, status: 404 }));
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

        if (req.method === 'GET' || req.method === 'HEAD') {
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
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Stream Error' }));
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
    host: '0.0.0.0',
    strictPort: true
  }
});
