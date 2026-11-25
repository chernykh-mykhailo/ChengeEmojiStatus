import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from './api';
import type { UserProfileResponse, User, EmojiItem } from './types';
import { Header } from './components/Header';
import { PermissionCard } from './components/PermissionCard';
import { SettingsCard } from './components/SettingsCard';
import { EmojiListCard } from './components/EmojiListCard';
import { LogsCard } from './components/LogsCard';

export const App: React.FC = () => {
  const [data, setData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProfile();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося завантажити дані';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
    loadData();
  }, [loadData]);

  const handleAccessUpdated = (granted: boolean) => {
    if (data) {
      setData({
        ...data,
        user: { ...data.user, accessGranted: granted },
      });
    }
  };

  const handleSettingsUpdated = (updatedUser: User) => {
    if (data) {
      setData({ ...data, user: updatedUser });
    }
  };

  const handleEmojiAdded = (item: EmojiItem) => {
    if (data) {
      setData({
        ...data,
        emojis: [...data.emojis, item],
      });
    }
  };

  const handleEmojiDeleted = (id: number) => {
    if (data) {
      setData({
        ...data,
        emojis: data.emojis.filter((e) => e.id !== id),
      });
    }
  };

  const handleEmojisReordered = (reorderedEmojis: EmojiItem[]) => {
    if (data) {
      setData({
        ...data,
        emojis: reorderedEmojis,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-zinc-500 mt-2 font-medium">Завантаження...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Помилка завантаження
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
          {error || 'Відкрийте додаток через офіційного бота в Telegram.'}
        </p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-12">
      <Header user={data.user} onRefresh={loadData} />
      <PermissionCard
        accessGranted={data.user.accessGranted}
        onAccessUpdated={handleAccessUpdated}
      />
      <SettingsCard user={data.user} onSettingsUpdated={handleSettingsUpdated} />
      <EmojiListCard
        emojis={data.emojis}
        currentEmojiIndex={data.user.currentEmojiIndex}
        onEmojiAdded={handleEmojiAdded}
        onEmojiDeleted={handleEmojiDeleted}
        onEmojisReordered={handleEmojisReordered}
      />
      <LogsCard logs={data.recentLogs} />
    </div>
  );
};
