import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const CountdownTimer = ({ deadline, isDark, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, percentage: 100 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(deadline);
      const diff = end - now;
      const totalTime = 48 * 60 * 60 * 1000;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const percentage = (diff / totalTime) * 100;

        setTimeLeft({ hours, minutes, seconds, percentage: Math.min(percentage, 100) });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, percentage: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const getColorClass = () => {
    if (timeLeft.percentage > 50) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (timeLeft.percentage > 25) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${getColorClass()}`}>
        <Timer size={14} />
        <span className="text-xs font-mono tabular-nums">
          {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 border ${
      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
    }`}>
      <Timer size={16} className={getColorClass()} />
      <div className="flex items-center gap-1 text-sm font-mono tabular-nums">
        <span className={getColorClass()}>{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>:</span>
        <span className={getColorClass()}>{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>:</span>
        <span className={getColorClass()}>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
      <div className="ml-2">
        <div className={`w-20 h-1 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div 
            className={`h-full transition-all duration-1000 ${
              timeLeft.percentage > 50 
                ? 'bg-emerald-500' 
                : timeLeft.percentage > 25 
                  ? 'bg-amber-500' 
                  : 'bg-red-500'
            }`}
            style={{ width: `${timeLeft.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

