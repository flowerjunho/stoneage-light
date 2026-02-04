import React from 'react';
import { Activity, Users, Hash, Terminal, Server, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { BotStatsDocument } from '../types';

interface SummaryCardsProps {
  data: BotStatsDocument | null;
  weeklyTotal?: number | null;
  showWeekly?: boolean;
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  show: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data, weeklyTotal, showWeekly = false }) => {
  const cards: StatCard[] = [
    {
      label: '총 호출',
      value: data?.totalCalls || 0,
      icon: <Activity className="w-4 h-4" />,
      show: true,
    },
    {
      label: '주간 누적',
      value: weeklyTotal || 0,
      icon: <TrendingUp className="w-4 h-4" />,
      show: showWeekly,
    },
    {
      label: '활성 유저',
      value: data?.users ? Object.keys(data.users).length : 0,
      icon: <Users className="w-4 h-4" />,
      show: true,
    },
    {
      label: '검색 키워드',
      value: data?.keywords ? Object.keys(data.keywords).length : 0,
      icon: <Hash className="w-4 h-4" />,
      show: true,
    },
    {
      label: '커맨드',
      value: data?.commands ? Object.keys(data.commands).length : 0,
      icon: <Terminal className="w-4 h-4" />,
      show: true,
    },
    {
      label: '활성 서버',
      value: data?.guilds ? Object.keys(data.guilds).length : 0,
      icon: <Server className="w-4 h-4" />,
      show: true,
    },
  ];

  const visibleCards = cards.filter(c => c.show);

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 ${visibleCards.length > 5 ? 'lg:grid-cols-6' : `lg:grid-cols-${visibleCards.length}`} gap-3`}>
      {visibleCards.map((card, i) => (
        <Card
          key={card.label}
          variant="glass"
          className="p-4 animate-slide-up opacity-0"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-accent">{card.icon}</span>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {card.label}
            </span>
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">
            {card.value.toLocaleString()}
          </p>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;
