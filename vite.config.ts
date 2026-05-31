import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function apiPlugin(): Plugin {
  return {
    name: 'zooseek-dev-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        if (!req.url) return next();

        const url = new URL(req.url, 'http://localhost');
        const route = `/api${url.pathname}`;

        const modules: Record<string, () => Promise<{ default: (req: any, res: any) => Promise<void> }>> = {
          '/api/market/indices': () => import('./api/market/indices'),
          '/api/market/top-movers': () => import('./api/market/top-movers'),
          '/api/dart/disclosures': () => import('./api/dart/disclosures'),
          '/api/ai/disclosure-summary': () => import('./api/ai/disclosure-summary')
        };

        const load = modules[route];
        if (!load) return next();

        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk;
        });
        req.on('end', async () => {
          const apiReq = {
            ...req,
            query: Object.fromEntries(url.searchParams.entries()),
            body: rawBody ? JSON.parse(rawBody) : undefined
          };
          const apiRes = {
            status(code: number) {
              res.statusCode = code;
              return this;
            },
            json(data: unknown) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(data));
            }
          };

          try {
            const mod = await load();
            await mod.default(apiReq, apiRes);
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'unknown error' }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.DART_API_KEY = env.DART_API_KEY;
  process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  process.env.OPENAI_MODEL = env.OPENAI_MODEL;

  return {
    plugins: [react(), apiPlugin()],
    server: {
      host: '0.0.0.0',
      port: 5173
    }
  };
});
