import React from 'react';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import type { RotationLog } from '../types';

interface LogsCardProps {
  logs: RotationLog[];
}

export const LogsCard: React.FC<LogsCardProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/80 dark:border-zinc-800 space-y-3">
      <div className="flex items-center space-x-2">
        <History className="w-4 h-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Історія змін
        </h2>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {logs.map((log) => {
          const isSuccess = log.status === 'success';
          return (
            <div
              key={log.id}
              className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs"
            >
              <div className="flex items-center space-x-2 truncate">
                {isSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                )}
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                  {log.customEmojiId}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 flex-shrink-0">
                {new Date(log.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
