import React, { useState } from 'react';
import { Plus, Trash2, SmilePlus, HelpCircle, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import type { EmojiItem } from '../types';
import { api } from '../api';

interface EmojiListCardProps {
  emojis: EmojiItem[];
  currentEmojiIndex: number;
  onEmojiAdded: (item: EmojiItem) => void;
  onEmojiDeleted: (id: number) => void;
  onEmojisReordered: (items: EmojiItem[]) => void;
}

export const EmojiListCard: React.FC<EmojiListCardProps> = ({
  emojis,
  currentEmojiIndex,
  onEmojiAdded,
  onEmojiDeleted,
  onEmojisReordered,
}) => {
  const [customEmojiIdInput, setCustomEmojiIdInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = customEmojiIdInput.trim();
    if (!id) return;

    setIsAdding(true);
    try {
      const res = await api.addEmoji(id, labelInput.trim() || undefined);
      onEmojiAdded(res.item);
      setCustomEmojiIdInput('');
      setLabelInput('');
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка додавання';
      alert(msg);
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (id: number) => {
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('medium');
    onEmojiDeleted(id);
    api.deleteEmoji(id).catch((err) => {
      console.error('Failed to delete emoji:', err);
    });
  };

  const moveEmoji = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= emojis.length || fromIndex === toIndex) return;

    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light');
    const updated = [...emojis];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Instant optimistic update
    onEmojisReordered(updated);

    // Background sync to DB
    api.reorderEmojis(updated.map((item) => item.id)).catch((err) => {
      console.error('Failed to sync reorder:', err);
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveEmoji(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/80 dark:border-zinc-800 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SmilePlus className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Список емодзі ({emojis.length})
          </h2>
        </div>
        <button
          onClick={() => setShowHelper(!showHelper)}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs flex items-center space-x-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Як отримати ID?</span>
        </button>
      </div>

      {showHelper && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/50 rounded-xl p-3 text-xs text-blue-900 dark:text-blue-300 space-y-1">
          <p className="font-semibold">💡 Найпростіший спосіб додати емодзі:</p>
          <p>
            Просто <b>надішліть будь-яке повідомлення з преміум-емодзі в чат з ботом</b>! Бот автоматично розпізнає їх та додасть до вашого списку.
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Порядок можна змінювати перетягуванням або стрілочками вгору/вниз.
          </p>
        </div>
      )}

      {emojis.length === 0 ? (
        <div className="text-center py-6 px-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            У вас поки немає доданих емодзі для ротації.
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Надішліть емодзі в чат або введіть ID вручну нижче.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {emojis.map((emoji, index) => {
            const isCurrent = index === currentEmojiIndex;
            const isDragging = draggedIndex === index;

            return (
              <div
                key={emoji.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all select-none ${
                  isDragging ? 'opacity-40 scale-95 border-blue-500 bg-blue-50/50' : ''
                } ${
                  isCurrent
                    ? 'border-blue-400/80 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-center space-x-2 overflow-hidden flex-1">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Order Badge */}
                  <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Real Telegram custom emoji image preview */}
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs">
                    <img
                      src={`/api/emojis/image/${emoji.customEmojiId}`}
                      alt="emoji"
                      className="w-5 h-5 object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="truncate flex-1">
                    <p className="font-mono text-zinc-800 dark:text-zinc-200 text-xs truncate">
                      {emoji.customEmojiId}
                    </p>
                    {emoji.label && (
                      <p className="text-[10px] text-zinc-500 truncate">{emoji.label}</p>
                    )}
                  </div>

                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-md flex-shrink-0">
                      Активний
                    </span>
                  )}
                </div>

                {/* Actions: Move Up/Down + Delete */}
                <div className="flex items-center space-x-0.5 flex-shrink-0 ml-1">
                  <button
                    onClick={() => moveEmoji(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-20 transition-all cursor-pointer"
                    title="Підняти вгору"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveEmoji(index, index + 1)}
                    disabled={index === emojis.length - 1}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-20 transition-all cursor-pointer"
                    title="Опустити вниз"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(emoji.id)}
                    className="p-1 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                    title="Видалити"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Form */}
      <form onSubmit={handleAdd} className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={customEmojiIdInput}
            onChange={(e) => setCustomEmojiIdInput(e.target.value)}
            placeholder="Custom Emoji ID (число)"
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="submit"
            disabled={isAdding || !customEmojiIdInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
