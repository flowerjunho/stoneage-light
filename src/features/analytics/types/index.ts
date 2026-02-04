export interface BotStatsDocument {
  totalCalls: number;
  commands: Record<string, number>;
  users: Record<string, UserStats>;
  keywords: Record<string, number>;
  hourly: Record<string, number>;
  guilds: Record<string, number>;
  categories: CategoryStats;
  commandKeywords: Record<string, Record<string, number>>;
  date?: string;
  week?: string;
  lastUpdated?: string;
}

export interface UserStats {
  username: string;
  count: number;
  commands: Record<string, number>;
  keywords: Record<string, number>;
}

export interface CategoryStats {
  pet: number;
  quest: number;
  item: number;
  map: number;
}

export interface DailyTrend {
  date: string;
  totalCalls: number;
}

export interface StatsData {
  selected: BotStatsDocument | null;
  daily: DailyTrend[];
  weekly: BotStatsDocument | null;
  rangeDays: DailyTrend[];
}

export type ViewMode = 'daily' | 'weekly' | 'range';
