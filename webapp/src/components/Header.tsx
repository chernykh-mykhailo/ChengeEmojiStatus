import React from 'react';
import { Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  user: User;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
          {user.firstName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-tight">
              {user.firstName}
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3 h-3 mr-0.5" />
              Premium
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {user.username ? `@${user.username}` : `ID: ${user.telegramId}`}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1.5">
        {user.accessGranted ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Дозвіл є
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            Потрібен дозвіл
          </span>
        )}
      </div>
    </header>
  );
};
