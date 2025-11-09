import React from 'react';
import { Plus, Inbox, Star, Send, Trash2, BarChart3, Wallet, Trophy } from 'lucide-react';

const Sidebar = ({ 
  isDark, 
  activeView, 
  setActiveView, 
  setSelectedThread, 
  setShowCompose,
  inboxEmails,
  achievements
}) => {
  return (
    <div
      className={`w-64 border-r ${
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      } flex flex-col`}
    >
      <div className="p-4">
        <button
          onClick={() => setShowCompose(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 font-medium text-white transition-all bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={20} />
          Compose
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        <button
          onClick={() => {
            setActiveView('inbox');
            setSelectedThread(null);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
            activeView === 'inbox'
              ? isDark
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox size={18} />
          <span className="font-medium">Inbox</span>
          {inboxEmails.filter(e => !e.is_read).length > 0 && (
            <span
              className={`ml-auto text-xs px-2 py-0.5 font-mono ${
                activeView === 'inbox'
                  ? isDark
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {inboxEmails.filter(e => !e.is_read).length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveView('starred');
            setSelectedThread(null);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
            activeView === 'starred'
              ? isDark
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star size={18} />
          <span className="font-medium">Starred</span>
        </button>

        <button
          onClick={() => {
            setActiveView('sent');
            setSelectedThread(null);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
            activeView === 'sent'
              ? isDark
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send size={18} />
          <span className="font-medium">Sent</span>
        </button>

        <button
          onClick={() => {
            setActiveView('deleted');
            setSelectedThread(null);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
            activeView === 'deleted'
              ? isDark
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trash2 size={18} />
          <span className="font-medium">Deleted</span>
        </button>

        <div className={`my-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />

        <button
          onClick={() => {
            setActiveView('analytics');
            setSelectedThread(null);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
            activeView === 'analytics'
              ? isDark
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={18} />
          <span className="font-medium">Analytics</span>
        </button>

        <button
          onClick={() => {
            setActiveView('payments');
            setSelectedThread(null);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
            activeView === 'payments'
              ? isDark
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet size={18} />
          <span className="font-medium">Wallet</span>
        </button>

        <button
          onClick={() => {
            setActiveView('achievements');
            setSelectedThread(null);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-sm uppercase tracking-wider ${
            activeView === 'achievements'
              ? isDark
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                : 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
              : isDark
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy size={18} />
          <span className="font-medium">Achievements</span>
          {achievements.filter(a => a.unlocked).length > 0 && (
            <span className={`ml-auto text-xs px-2 py-0.5 font-mono ${
              isDark 
                ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {achievements.filter(a => a.unlocked).length}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;

