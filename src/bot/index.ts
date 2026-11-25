import { Bot } from 'grammy';
import { env } from '../config/env.js';
import type { UserService } from '../services/user.service.js';
import type { EmojiService } from '../services/emoji.service.js';
import { registerStartCommand } from './commands/start.command.js';
import { registerStatusCommand } from './commands/status.command.js';
import { registerRotateCommand } from './commands/rotate.command.js';
import { createEmojiCaptureHandler } from './handlers/emoji.handler.js';

export function createBot(userService: UserService, emojiService: EmojiService): Bot {
  const bot = new Bot(env.BOT_TOKEN);

  // Command handlers
  bot.command('start', registerStartCommand(userService));
  bot.command('status', registerStatusCommand(userService));
  bot.command('rotate', registerRotateCommand(emojiService));

  // Capture incoming custom emojis in any chat message
  bot.use(createEmojiCaptureHandler(userService));

  // Error handling
  bot.catch((err) => {
    console.error('[Bot Error]:', err);
  });

  return bot;
}
