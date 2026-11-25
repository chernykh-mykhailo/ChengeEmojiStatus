import crypto from 'node:crypto';
import type { Context, Next } from 'hono';
import { env } from '../../config/env.js';
import type { WebAppUser } from '../../types/index.js';

export interface TelegramAuthContext {
  telegramUser: WebAppUser;
}

export function validateInitData(initDataString: string, botToken: string): WebAppUser | null {
  try {
    const urlParams = new URLSearchParams(initDataString);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');

    const items: string[] = [];
    urlParams.forEach((val, key) => {
      items.push(`${key}=${val}`);
    });
    items.sort();
    const dataCheckString = items.join('\n');

    // Secret key = HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculated hash = HMAC_SHA256(dataCheckString, secretKey)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return null;
    }

    const userJson = urlParams.get('user');
    if (!userJson) return null;

    const user = JSON.parse(userJson) as WebAppUser;
    return user;
  } catch (err) {
    console.error('[Auth] Failed to validate Telegram initData:', err);
    return null;
  }
}

export async function telegramAuthMiddleware(c: Context, next: Next) {
  // Allow public access to emoji image thumbnails without auth
  if (c.req.path.includes('/emojis/image/')) {
    return next();
  }

  const initData = c.req.header('x-telegram-init-data');

  if (!initData) {
    // In local development mode, allow mock user if opened directly in browser
    if (process.env.NODE_ENV !== 'production') {
      const mockUser: WebAppUser = {
        id: 999999999,
        first_name: 'Dev Local User',
        username: 'dev_user',
        is_premium: true,
      };
      c.set('telegramUser', mockUser);
      return next();
    }
    return c.json({ error: 'Missing x-telegram-init-data header' }, 401);
  }

  const user = validateInitData(initData, env.BOT_TOKEN);
  if (!user) {
    if (process.env.NODE_ENV !== 'production') {
      // Fallback for dev testing
      const mockUser: WebAppUser = {
        id: 999999999,
        first_name: 'Dev Local User',
        username: 'dev_user',
        is_premium: true,
      };
      c.set('telegramUser', mockUser);
      return next();
    }
    return c.json({ error: 'Invalid or forged Telegram initData' }, 403);
  }

  c.set('telegramUser', user);
  await next();
}
