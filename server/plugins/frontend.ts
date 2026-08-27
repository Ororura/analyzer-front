import middie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import type { FastifyPluginAsync } from 'fastify';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type FrontendMode = 'development' | 'production' | false;

const publicRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../dist');

export const createFrontendPlugin = (mode: FrontendMode): FastifyPluginAsync => async (app) => {
  if (mode === false) return;

  if (mode === 'production') {
    await app.register(fastifyStatic, { root: publicRoot, wildcard: false });
    return;
  }

  await app.register(middie);
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use((request, response, next) => {
    if (request.url?.startsWith('/api/')) {
      next();
      return;
    }
    vite.middlewares(request, response, next);
  });
  app.get('/*', async (_request, reply) => reply.callNotFound());
  app.addHook('onClose', async () => vite.close());
};
