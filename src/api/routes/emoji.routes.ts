import { Hono } from 'hono';
import { z } from 'zod';
import fs from 'node:fs';
import type { UserService } from '../../services/user.service.js';
import type { EmojiService } from '../../services/emoji.service.js';
import type { EmojiImageService } from '../../services/emoji-image.service.js';
import type { AppEnv, WebAppUser } from '../../types/index.js';

const addEmojiSchema = z.object({
  customEmojiId: z.string().min(1, 'customEmojiId is required'),
  label: z.string().optional(),
});

const reorderSchema = z.object({
  emojiIds: z.array(z.number()),
});

export function createEmojiRoutes(
  userService: UserService,
  emojiService: EmojiService,
  emojiImageService: EmojiImageService
) {
  const router = new Hono<AppEnv>();

  // Public endpoint for serving custom emoji preview images (no auth required)
  router.get('/image/:id', async (c) => {
    const emojiId = c.req.param('id');
    const imageInfo = await emojiImageService.getEmojiImagePath(emojiId);

    if (!imageInfo) {
      return c.text('Emoji image not found', 404);
    }

    const buffer = fs.readFileSync(imageInfo.path);
    return c.body(buffer, 200, {
      'Content-Type': imageInfo.contentType,
      'Cache-Control': 'public, max-age=604800, immutable',
    });
  });

  router.get('/', (c) => {
    const user = c.get('telegramUser') as WebAppUser;
    const emojis = userService.getUserEmojis(user.id);
    return c.json({ emojis });
  });

  router.post('/', async (c) => {
    const user = c.get('telegramUser') as WebAppUser;
    const body = await c.req.json();
    const parsed = addEmojiSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid emoji payload', details: parsed.error.issues }, 400);
    }

    try {
      const item = userService.addEmoji(user.id, parsed.data.customEmojiId, parsed.data.label);
      // Pre-warm cache for the image
      emojiImageService.getEmojiImagePath(parsed.data.customEmojiId).catch(() => {});
      return c.json({ success: true, item }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: msg }, 400);
    }
  });

  router.delete('/:id', (c) => {
    const user = c.get('telegramUser') as WebAppUser;
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ error: 'Invalid emoji ID' }, 400);
    }

    const deleted = userService.removeEmoji(user.id, id);
    return c.json({ success: deleted });
  });

  router.post('/reorder', async (c) => {
    const user = c.get('telegramUser') as WebAppUser;
    const body = await c.req.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid reorder payload' }, 400);
    }

    userService.reorderEmojis(user.id, parsed.data.emojiIds);
    return c.json({ success: true });
  });

  router.post('/rotate', async (c) => {
    const user = c.get('telegramUser') as WebAppUser;
    const result = await emojiService.rotateUserEmoji(user.id);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({ success: true, customEmojiId: result.customEmojiId });
  });

  return router;
}
