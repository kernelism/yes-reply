import React from 'react';

const LineChart = ({ data, color = '#10b981', height = 200, showDots = true, isDark }) => {
  if (!data || data.length === 0) return null;

  const padding = 20;
  const width = 800;
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => ({
    x: padding + (i * (width - 2 * padding)) / (data.length - 1 || 1),
    y: height - padding - ((d.value - minValue) / range) * (height - 2 * padding)
  }));

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <line
        x1={padding}
        y1={padding}
        x2={width - padding}
        y2={padding}
        stroke={isDark ? '#334155' : '#e2e8f0'}
        strokeWidth="1"
      />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke={isDark ? '#334155' : '#e2e8f0'}
        strokeWidth="1"
      />
      
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      
      {showDots && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={color}
        />
      ))}
    </svg>
  );
};

export default LineChart;

