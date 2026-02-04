import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import { useChartColors } from '../hooks/useChartColors';
import type { CategoryStats } from '../types';

interface CategoryPieChartProps {
  categories: CategoryStats;
}

const CATEGORY_LABELS: Record<string, string> = {
  pet: '펫',
  quest: '퀘스트',
  item: '아이템',
  map: '맵',
};

const CATEGORY_COLORS = ['#fbbf24', '#a855f7', '#3b82f6', '#10b981'];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ categories }) => {
  const colors = useChartColors();

  const chartData = Object.entries(categories)
    .map(([key, count]) => ({ name: CATEGORY_LABELS[key] || key, count }))
    .filter(d => d.count > 0);

  if (chartData.length === 0) return null;

  const total = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">검색 카테고리 분포</h3>
      </div>
      <div className="h-[260px] md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius="45%"
              outerRadius="70%"
              dataKey="count"
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
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
              formatter={(value, name) => {
                const v = Number(value ?? 0);
                return [`${v.toLocaleString()} (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: colors.textSecondary, fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default CategoryPieChart;
