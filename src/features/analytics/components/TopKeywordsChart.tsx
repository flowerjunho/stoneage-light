import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useChartColors } from '../hooks/useChartColors';

interface TopKeywordsChartProps {
  keywords: Record<string, number>;
}

const TopKeywordsChart: React.FC<TopKeywordsChartProps> = ({ keywords }) => {
  const colors = useChartColors();

  const sorted = Object.entries(keywords)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  if (sorted.length === 0) return null;

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">인기 검색어 TOP {sorted.length}</h3>
      </div>
      <div style={{ height: Math.max(200, sorted.length * 32) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis
              type="number"
              tick={{ fill: colors.textMuted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="keyword"
              type="category"
              tick={{ fill: colors.textSecondary, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: colors.bgSecondary,
                border: `1px solid ${colors.bgTertiary}`,
                borderRadius: '12px',
                color: colors.textPrimary,
                fontSize: 13,
              }}
              itemStyle={{ color: colors.textPrimary }}
              labelStyle={{ color: colors.textSecondary }}
              formatter={(value) => [(value ?? 0).toLocaleString(), '검색']}
            />
            <Bar
              dataKey="count"
              fill={colors.neonBlue}
              radius={[0, 6, 6, 0]}
              maxBarSize={24}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TopKeywordsChart;
