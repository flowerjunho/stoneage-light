import { useState, useEffect } from 'react';

interface ChartColors {
  accent: string;
  accentSecondary: string;
  accentTertiary: string;
  neonBlue: string;
  neonPurple: string;
  neonPink: string;
  neonCyan: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  bgSecondary: string;
  bgTertiary: string;
  border: string;
}

function getColors(): ChartColors {
  const style = getComputedStyle(document.documentElement);
  const get = (v: string) => style.getPropertyValue(v).trim();
  return {
    accent: get('--accent') || '#fbbf24',
    accentSecondary: get('--accent-secondary') || '#f43f5e',
    accentTertiary: get('--accent-tertiary') || '#10b981',
    neonBlue: get('--neon-blue') || '#3b82f6',
    neonPurple: get('--neon-purple') || '#a855f7',
    neonPink: get('--neon-pink') || '#ec4899',
    neonCyan: get('--neon-cyan') || '#06b6d4',
    textPrimary: get('--text-primary') || '#ffffff',
    textSecondary: get('--text-secondary') || '#9ca3af',
    textMuted: get('--text-muted') || '#6b7280',
    bgSecondary: get('--bg-secondary') || '#0d0d15',
    bgTertiary: get('--bg-tertiary') || '#16161f',
    border: get('--border') || 'rgba(255,255,255,0.08)',
  };
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(getColors);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setColors(getColors());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}

export const CHART_PALETTE = [
  '#fbbf24', '#3b82f6', '#a855f7', '#10b981',
  '#f43f5e', '#06b6d4', '#ec4899', '#f97316',
  '#8b5cf6', '#14b8a6', '#eab308', '#6366f1',
];
