import fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { HhError } from './hh/errors.js';
import { createVacancyService, type VacancyService } from './hh/service.js';
import { createFrontendPlugin, type FrontendMode } from './plugins/frontend.js';
import { healthRoutes } from './routes/health.js';
import { createVacancyRoutes } from './routes/vacancies.js';

type BuildAppOptions = {
  frontend?: FrontendMode;
  logger?: boolean | FastifyBaseLogger;
  vacancyService?: VacancyService;
};

export const buildApp = (options: BuildAppOptions = {}): FastifyInstance => {
  const app = fastify({ logger: options.logger ?? true });
  const vacancyService = options.vacancyService ?? createVacancyService();

  app.register(healthRoutes, { prefix: '/api' });
  app.register(createVacancyRoutes(vacancyService), { prefix: '/api' });
  app.register(createFrontendPlugin(options.frontend ?? false));

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: 'INVALID_QUERY',
        message: error.issues[0]?.message ?? 'Некорректные параметры запроса',
      });
    }
    if (error instanceof RangeError) {
      return reply.status(400).send({ code: 'INVALID_QUERY', message: error.message });
    }
    if (error instanceof HhError) {
      if (error.retryAfter) reply.header('Retry-After', error.retryAfter);
      return reply.status(error.status ?? 502).send({ code: error.code, message: error.message });
    }

    request.log.error({ err: error }, 'Request failed');
    return reply.status(500).send({ code: 'INTERNAL', message: 'Не удалось загрузить вакансии' });
  });

  app.setNotFoundHandler((request, reply) => {
    if (options.frontend === 'production' && !request.url.startsWith('/api/')) {
      return reply.sendFile('index.html');
    }
    return reply.status(404).send({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.addHook('onClose', async () => {
    vacancyService.clearCache();
  });

  return app;
};
