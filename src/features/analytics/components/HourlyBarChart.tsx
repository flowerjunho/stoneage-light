import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useChartColors } from '../hooks/useChartColors';

interface HourlyBarChartProps {
  hourly: Record<string, number>;
}

const HourlyBarChart: React.FC<HourlyBarChartProps> = ({ hourly }) => {
  const colors = useChartColors();

  const chartData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}`,
    count: hourly[`h${i}`] || 0,
    isActive: i >= 9 && i <= 23,
  }));

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">시간대별 분포 (KST)</h3>
      </div>
      <div className="h-[220px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.bgTertiary} vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: colors.textMuted, fontSize: 11 }}
              axisLine={{ stroke: colors.bgTertiary }}
              tickLine={false}
              interval={2}
              tickFormatter={v => `${v}시`}
            />
            <YAxis
              tick={{ fill: colors.textMuted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={35}
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
              formatter={(value) => [(value ?? 0).toLocaleString(), '호출']}
              labelFormatter={l => `${l}시`}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.isActive ? colors.accent : colors.textMuted}
                  opacity={entry.isActive ? 0.85 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default HourlyBarChart;
