import { buildApp } from './app.js';
import { loadEnv } from './config.js';

const env = loadEnv();
const app = buildApp({ frontend: env.mode });
let closing = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'Shutting down');
  try {
    await app.close();
  } catch (error) {
    app.log.error({ err: error }, 'Graceful shutdown failed');
    process.exitCode = 1;
  }
};

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ host: env.host, port: env.port });
} catch (error) {
  app.log.fatal({ err: error }, 'Server failed to start');
  process.exitCode = 1;
  await app.close();
}
