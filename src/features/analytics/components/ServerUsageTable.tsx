import React from 'react';
import { Card } from '@/components/ui/card';
import { Server } from 'lucide-react';

interface ServerUsageTableProps {
  guilds: Record<string, number>;
}

const ServerUsageTable: React.FC<ServerUsageTableProps> = ({ guilds }) => {
  const sorted = Object.entries(guilds)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) return null;

  const total = sorted.reduce((s, g) => s + g.count, 0);

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">서버별 사용량</h3>
        </div>
        <span className="text-xs text-text-muted">{sorted.length}개</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left text-xs font-medium text-text-muted py-2 px-2">서버</th>
              <th className="text-right text-xs font-medium text-text-muted py-2 px-2">호출</th>
              <th className="text-right text-xs font-medium text-text-muted py-2 px-2 w-16">비율</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(guild => (
              <tr key={guild.name} className="border-b border-border/10">
                <td className="py-2.5 px-2 text-sm text-text-primary">{guild.name}</td>
                <td className="py-2.5 px-2 text-right text-sm font-semibold text-accent tabular-nums">
                  {guild.count.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 text-right text-xs text-text-muted tabular-nums">
                  {total > 0 ? ((guild.count / total) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ServerUsageTable;
