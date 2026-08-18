import React, { useState } from 'react';
import { Terminal, Trash2, X, AlertTriangle, AlertCircle, Info, Check, Copy } from 'lucide-react';
import { ConsoleMessage } from '../types';

interface ConsoleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ConsoleMessage[];
  onClear: () => void;
}

export const ConsoleDrawer: React.FC<ConsoleDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onClear,
}) => {
  const [filter, setFilter] = useState<'all' | 'log' | 'info' | 'warn' | 'error'>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredMessages = messages.filter((m) => {
    if (filter === 'all') return true;
    return m.type === filter;
  });

  const handleCopyLogs = async () => {
    const text = messages.map((m) => `[${m.timestamp}] [${m.type.toUpperCase()}] ${m.message}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'warn':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'info':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="h-48 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 font-mono text-xs z-20">
      {/* Console Header */}
      <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sandbox Console ({messages.length})</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filter === 'all' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('log')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filter === 'log' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Logs
            </button>
            <button
              onClick={() => setFilter('warn')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filter === 'warn' ? 'bg-amber-950/60 text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Warnings
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filter === 'error' ? 'bg-rose-950/60 text-rose-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Errors
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            disabled={messages.length === 0}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-40"
            title="Copy all logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Close console"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-2 overflow-y-auto space-y-1 font-mono text-[11px]">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs">
            No console output recorded from live HTML sandbox yet.
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-1.5 rounded flex items-start gap-2 border leading-relaxed ${getBadgeStyle(msg.type)}`}
            >
              <span className="text-slate-500 shrink-0 select-none">[{msg.timestamp}]</span>
              <span className="uppercase text-[10px] font-bold px-1 rounded bg-black/30 shrink-0">
                {msg.type}
              </span>
              <span className="flex-1 whitespace-pre-wrap break-all">{msg.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
