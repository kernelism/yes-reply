import React from 'react';

const AchievementBadge = ({ title, description, unlocked, isDark, progress, total }) => {
  const percentage = total ? (progress / total) * 100 : 0;
  
  return (
    <div className={`p-6 border ${
      unlocked
        ? isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        : isDark ? 'bg-slate-800/50 border-slate-700/50 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`font-medium text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h4>
            {unlocked ? (
              <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Complete
              </span>
            ) : (
              <span className={`text-xs uppercase tracking-wider px-2 py-1 ${
                isDark ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                Locked
              </span>
            )}
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {description}
          </p>
          {!unlocked && (
            <div className="mt-4">
              {total ? (
                <>
                  <div className={`h-1 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div 
                      className={`h-full ${isDark ? 'bg-blue-500' : 'bg-blue-600'} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-2 font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {progress} / {total}
                  </p>
                </>
              ) : (
                <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Not yet achieved
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementBadge;

