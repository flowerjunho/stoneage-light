import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useChartColors } from '../hooks/useChartColors';
import { formatShortDate } from '../utils/dateUtils';
import type { DailyTrend } from '../types';

interface TrendLineChartProps {
  data: DailyTrend[];
  selectedDate: string;
  onDateClick?: (date: string) => void;
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({ data, selectedDate, onDateClick }) => {
  const colors = useChartColors();

  const chartData = data.map(d => ({
    ...d,
    label: formatShortDate(d.date),
    isSelected: d.date === selectedDate,
  }));

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">최근 7일 호출 추이</h3>
      </div>
      <div className="h-[220px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} onClick={(e: unknown) => {
            const ev = e as { activePayload?: Array<{ payload?: { date?: string } }> } | null;
            if (ev?.activePayload?.[0]?.payload?.date && onDateClick) {
              onDateClick(ev.activePayload[0].payload.date);
            }
          }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.bgTertiary} />
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
              cursor={{ stroke: colors.accent, strokeDasharray: '5 5' }}
            />
            <Line
              type="monotone"
              dataKey="totalCalls"
              stroke={colors.accent}
              strokeWidth={2.5}
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: { isSelected: boolean } };
                const isSelected = payload?.isSelected;
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? colors.accent : colors.bgSecondary}
                    stroke={colors.accent}
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                  />
                );
              }}
              activeDot={{ r: 7, fill: colors.accent, stroke: colors.bgSecondary, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TrendLineChart;
