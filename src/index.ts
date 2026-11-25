import { serve } from '@hono/node-server';
import { env } from './config/env.js';
import { UserRepository } from './database/repositories/user.repository.js';
import { EmojiRepository } from './database/repositories/emoji.repository.js';
import { LogRepository } from './database/repositories/log.repository.js';
import { UserService } from './services/user.service.js';
import { EmojiService } from './services/emoji.service.js';
import { EmojiImageService } from './services/emoji-image.service.js';
import { SchedulerService } from './services/scheduler.service.js';
import { createBot } from './bot/index.js';
import { createApiServer } from './api/index.js';

async function bootstrap() {
  console.log('🚀 Initializing Telegram Emoji Status Rotator...');

  // 1. Initialize Repositories
  const userRepo = new UserRepository();
  const emojiRepo = new EmojiRepository();
  const logRepo = new LogRepository();

  // 2. Initialize Core Services
  const userService = new UserService(userRepo, emojiRepo, logRepo);

  // 3. Initialize Telegram Bot
  const dummyEmojiService = {} as EmojiService;
  const bot = createBot(userService, dummyEmojiService);

  const emojiService = new EmojiService(bot.api, userRepo, emojiRepo, logRepo);
  const emojiImageService = new EmojiImageService(bot.api);

  // Re-inject emojiService into bot
  const configuredBot = createBot(userService, emojiService);

  // 4. Initialize Scheduler
  const scheduler = new SchedulerService(emojiService, userRepo);
  scheduler.start();

  // 5. Initialize Web API Server
  const app = createApiServer(userService, emojiService, emojiImageService);

  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`🌐 HTTP Web API server listening on http://localhost:${info.port}`);
    }
  );

  // 6. Start Telegram Bot Long Polling
  configuredBot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Telegram Bot @${botInfo.username} started successfully!`);
    },
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Gracefully shutting down...');
    scheduler.stop();
    configuredBot.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
