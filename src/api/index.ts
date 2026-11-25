import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'node:path';
import fs from 'node:fs';
import type { UserService } from '../services/user.service.js';
import type { EmojiService } from '../services/emoji.service.js';
import type { EmojiImageService } from '../services/emoji-image.service.js';
import type { AppEnv } from '../types/index.js';
import { telegramAuthMiddleware } from './middleware/auth.js';
import { createUserRoutes } from './routes/user.routes.js';
import { createEmojiRoutes } from './routes/emoji.routes.js';

export function createApiServer(
  userService: UserService,
  emojiService: EmojiService,
  emojiImageService: EmojiImageService
) {
  const app = new Hono<AppEnv>();

  // Enable CORS for development & webapp
  app.use(
    '*',
    cors({
      origin: '*',
      allowHeaders: ['Content-Type', 'Authorization', 'x-telegram-init-data'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  // Health check endpoint
  app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Protected API routes under /api
  const api = new Hono<AppEnv>();
  api.use('*', telegramAuthMiddleware);
  api.route('/users', createUserRoutes(userService));
  api.route('/emojis', createEmojiRoutes(userService, emojiService, emojiImageService));

  app.route('/api', api);

  // Serve static webapp build if exists
  const webappDist = path.resolve(process.cwd(), 'webapp/dist');
  if (fs.existsSync(webappDist)) {
    app.use('/*', serveStatic({ root: './webapp/dist' }));
    // SPA fallback
    app.get('*', (c) => {
      const htmlPath = path.join(webappDist, 'index.html');
      if (fs.existsSync(htmlPath)) {
        return c.html(fs.readFileSync(htmlPath, 'utf-8'));
      }
      return c.text('Not found', 404);
    });
  }

  return app;
}
