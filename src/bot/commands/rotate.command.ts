import type { CommandContext, Context } from 'grammy';
import type { EmojiService } from '../../services/emoji.service.js';

export function registerRotateCommand(emojiService: EmojiService) {
  return async (ctx: CommandContext<Context>) => {
    if (!ctx.from) return;

    await ctx.reply('⏳ Змінюю ваш емодзі-статус зараз...');
    const result = await emojiService.rotateUserEmoji(ctx.from.id);

    if (result.success) {
      await ctx.reply(`✅ Емодзі-статус успішно оновлено! (ID: <code>${result.customEmojiId}</code>)`, {
        parse_mode: 'HTML',
      });
    } else {
      await ctx.reply(`❌ Не вдалося оновити статус:\n<i>${result.error}</i>\n\nПеревірте, чи надано дозвіл у додатку (/start).`, {
        parse_mode: 'HTML',
      });
    }
  };
}
