import { z } from 'zod';

export const apiSchema = z.object({
  apiKey: z.string().min(1, 'API key обязателен'),
  model: z.string().min(1, 'Модель обязательна'),
});
