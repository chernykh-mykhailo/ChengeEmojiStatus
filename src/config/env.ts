import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  WEBAPP_URL: z.string().url('WEBAPP_URL must be a valid URL'),
  PORT: z.coerce.number().default(3000),
  DB_PATH: z.string().default('./data/bot.db'),
  APP_TIMEZONE: z.string().default('Europe/Kyiv'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    process.exit(1);
  }
  return {
    ...result.data,
    DB_PATH: path.resolve(process.cwd(), result.data.DB_PATH),
  };
}

export const env = loadEnv();
