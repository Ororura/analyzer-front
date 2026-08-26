import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './api.js';
import { createVacancyService } from './hh/service.js';

const app = express();
const port = Number(process.env.PORT || 5173);
app.disable('x-powered-by');
app.use('/api', createApiRouter(createVacancyService()));

if (process.env.NODE_ENV === 'production') {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
  app.use(express.static(root));
  app.get('*', (_request, response) => response.sendFile(path.join(root, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, () => console.log(`PDF Analyzer listening on http://localhost:${port}`));
