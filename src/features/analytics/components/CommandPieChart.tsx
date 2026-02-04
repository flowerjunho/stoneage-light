import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import { useChartColors, CHART_PALETTE } from '../hooks/useChartColors';

interface CommandPieChartProps {
  commands: Record<string, number>;
}

const CommandPieChart: React.FC<CommandPieChartProps> = ({ commands }) => {
  const colors = useChartColors();

  const sorted = Object.entries(commands)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) return null;

  const top = sorted.slice(0, 8);
  const othersCount = sorted.slice(8).reduce((sum, c) => sum + c.count, 0);
  const chartData = othersCount > 0 ? [...top, { name: '기타', count: othersCount }] : top;
  const total = chartData.reduce((s, c) => s + c.count, 0);

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">커맨드 비율</h3>
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
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
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

export default CommandPieChart;
