import type { Context, MiddlewareFn } from 'grammy';
import type { UserService } from '../../services/user.service.js';

export function createEmojiCaptureHandler(userService: UserService): MiddlewareFn<Context> {
  return async (ctx, next) => {
    const message = ctx.message;
    if (!message || !ctx.from) {
      return next();
    }

    const entities = message.entities ?? message.caption_entities ?? [];
    const customEmojiEntities = entities.filter(
      (e): e is typeof e & { custom_emoji_id: string } =>
        e.type === 'custom_emoji' && Boolean(e.custom_emoji_id)
    );

    if (customEmojiEntities.length === 0) {
      return next();
    }

    // Ensure user exists
    userService.getOrCreateUser({
      telegramId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
    });

    let addedCount = 0;
    const addedIds: string[] = [];

    for (const entity of customEmojiEntities) {
      try {
        userService.addEmoji(ctx.from.id, entity.custom_emoji_id);
        addedCount++;
        addedIds.push(entity.custom_emoji_id);
      } catch {
        // Already exists or invalid, ignore duplicate
      }
    }

    if (addedCount > 0) {
      await ctx.reply(
        `✨ Додано <b>${addedCount}</b> нових емодзі до вашого списку ротації!\n\n` +
        `<i>ID: ${addedIds.map(id => `<code>${id}</code>`).join(', ')}</i>\n\n` +
        `Натисніть /status щоб переглянути стан або відкрийте Mini App для налаштувань.`,
        { parse_mode: 'HTML' }
      );
    }

    return next();
  };
}
