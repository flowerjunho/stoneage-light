import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useChartColors } from '../hooks/useChartColors';
import { getDayOfWeekLabel } from '../utils/dateUtils';
import type { DailyTrend } from '../types';

interface WeekdayBarChartProps {
  data: DailyTrend[];
  onDateClick?: (date: string) => void;
}

const WeekdayBarChart: React.FC<WeekdayBarChartProps> = ({ data, onDateClick }) => {
  const colors = useChartColors();

  const chartData = data.map(d => ({
    ...d,
    label: getDayOfWeekLabel(d.date),
    isWeekend: new Date(d.date + 'T00:00:00').getDay() === 0 || new Date(d.date + 'T00:00:00').getDay() === 6,
  }));

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">요일별 호출량</h3>
      </div>
      <div className="h-[220px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} onClick={(e: unknown) => {
            const ev = e as { activePayload?: Array<{ payload?: { date?: string } }> } | null;
            if (ev?.activePayload?.[0]?.payload?.date && onDateClick) {
              onDateClick(ev.activePayload[0].payload.date);
            }
          }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.bgTertiary} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: colors.textMuted, fontSize: 12 }}
              axisLine={{ stroke: colors.bgTertiary }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: colors.textMuted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
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
            />
            <Bar dataKey="totalCalls" radius={[6, 6, 0, 0]} maxBarSize={40} cursor="pointer">
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.isWeekend ? colors.neonCyan : colors.accent}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default WeekdayBarChart;
