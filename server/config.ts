const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
};

export type ServerEnv = {
  host: string;
  port: number;
  mode: 'development' | 'production';
};

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): ServerEnv => ({
  host: source.HOST?.trim() || '0.0.0.0',
  port: parsePort(source.PORT),
  mode: source.NODE_ENV === 'production' ? 'production' : 'development',
});
