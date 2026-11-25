import { Hono } from 'hono';
import { z } from 'zod';
import type { UserService } from '../../services/user.service.js';
import type { AppEnv, WebAppUser } from '../../types/index.js';

const settingsSchema = z.object({
  isRotationEnabled: z.boolean().optional(),
  rotationMode: z.enum(['sequential', 'random']).optional(),
  frequency: z.enum(['daily', 'interval', 'custom_days', 'weekly']).optional(),
  intervalHours: z.number().int().min(1).max(24).optional(),
  targetDays: z.array(z.number().int().min(1).max(7)).optional(),
  rotateHour: z.number().int().min(0).max(23).optional(),
});

const accessSchema = z.object({
  granted: z.boolean(),
});

export function createUserRoutes(userService: UserService) {
  const router = new Hono<AppEnv>();

  router.get('/me', (c) => {
    const user = c.get('telegramUser') as WebAppUser;
    const dbUser = userService.getOrCreateUser({
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
    });

    const emojis = userService.getUserEmojis(user.id);
    const logs = userService.getLogs(user.id, 10);

    return c.json({
      user: dbUser,
      emojis,
      recentLogs: logs,
    });
  });

  router.post('/access', async (c) => {
    const user = c.get('telegramUser') as WebAppUser;
    const body = await c.req.json();
    const parsed = accessSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid access payload', details: parsed.error.issues }, 400);
    }

    userService.updateAccess(user.id, parsed.data.granted);
    return c.json({ success: true, accessGranted: parsed.data.granted });
  });

  router.patch('/settings', async (c) => {
    const user = c.get('telegramUser') as WebAppUser;
    const body = await c.req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid settings payload', details: parsed.error.issues }, 400);
    }

    const updated = userService.updateSettings(user.id, parsed.data);
    return c.json({ success: true, user: updated });
  });

  return router;
}
