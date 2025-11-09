import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

const StatCard = ({ icon: Icon, label, value, trend, trendValue, prefix = '', suffix = '', isDark }) => {
  return (
    <div className={`p-8 border ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 ${isDark ? 'bg-slate-700 border border-slate-600' : 'bg-slate-100 border border-slate-200'}`}>
          <Icon size={22} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-3 py-1 text-xs uppercase tracking-wider ${
            trend === 'up'
              ? isDark ? 'text-emerald-400 bg-emerald-900/30 border border-emerald-800' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              : isDark ? 'text-red-400 bg-red-900/30 border border-red-800' : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      <div>
        <p className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          {label}
        </p>
        <p className={`text-3xl font-light ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={prefix === '$' ? 2 : 0} />
        </p>
      </div>
    </div>
  );
};

export default StatCard;

