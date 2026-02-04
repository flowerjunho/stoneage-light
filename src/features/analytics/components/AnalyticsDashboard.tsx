import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import ThemeToggle from '@/shared/components/layout/ThemeToggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useBotStats } from '../hooks/useBotStats';
import { getSeoulDateString, addDays, formatDisplayDate, getWeekKey, formatWeekDisplay, addWeeks } from '../utils/dateUtils';
import type { ViewMode } from '../types';
import SummaryCards from './SummaryCards';
import TrendLineChart from './TrendLineChart';
import HourlyBarChart from './HourlyBarChart';
import WeekdayBarChart from './WeekdayBarChart';
import RangeDailyBarChart from './RangeDailyBarChart';
import CommandPieChart from './CommandPieChart';
import TopKeywordsChart from './TopKeywordsChart';
import CategoryPieChart from './CategoryPieChart';
import UserRankingTable from './UserRankingTable';
import UserDetailModal from './UserDetailModal';
import ServerUsageTable from './ServerUsageTable';
import CommandKeywordsSection from './CommandKeywordsSection';
import KeywordSearch from './KeywordSearch';

const today = getSeoulDateString();
const currentWeek = getWeekKey(new Date());

const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [rangeStart, setRangeStart] = useState(addDays(today, -6));
  const [rangeEnd, setRangeEnd] = useState(today);
  const [rangeTriggered, setRangeTriggered] = useState(false);

  const dateKey = tab === 'daily' ? selectedDate : tab === 'weekly' ? selectedWeek : '';
  const { data, loading, error } = useBotStats(
    tab,
    dateKey,
    tab === 'range' && rangeTriggered ? rangeStart : undefined,
    tab === 'range' && rangeTriggered ? rangeEnd : undefined,
  );

  const [modalUserId, setModalUserId] = useState<string | null>(null);

  const handleDateClick = useCallback((date: string) => {
    setTab('daily');
    setSelectedDate(date);
  }, []);

  const handleRangeQuery = () => {
    setRangeTriggered(false);
    setTimeout(() => setRangeTriggered(true), 0);
  };

  const selected = data.selected;
  const weeklyTotal = tab === 'daily' ? data.daily.reduce((s, d) => s + d.totalCalls, 0) : null;

  const modalUser = modalUserId && selected?.users?.[modalUserId] ? selected.users[modalUserId] : null;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-accent/10 transition-colors"
              title="홈으로"
            >
              <Home className="w-5 h-5 text-text-secondary hover:text-accent transition-colors" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              <h1 className="text-lg font-bold text-text-primary">Analytics</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6 pb-20">
        {/* Tabs */}
        <div className="mb-6">
          <Tabs value={tab} onValueChange={v => { setTab(v as ViewMode); if (v === 'range') setRangeTriggered(false); }}>
            <TabsList variant="pills" className="mb-4">
              <TabsTrigger value="daily" variant="pills">일별</TabsTrigger>
              <TabsTrigger value="weekly" variant="pills">주간</TabsTrigger>
              <TabsTrigger value="range" variant="pills">구간</TabsTrigger>
            </TabsList>

            {/* Daily Tab Controls */}
            <TabsContent value="daily" animated={false} className="mt-0">
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                    className="p-2 rounded-xl bg-bg-tertiary/50 hover:bg-accent/10 border border-border/30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-text-secondary" />
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    max={today}
                    className="input-base py-2 px-3 text-sm w-auto"
                  />
                  <button
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    disabled={selectedDate >= today}
                    className="p-2 rounded-xl bg-bg-tertiary/50 hover:bg-accent/10 border border-border/30 transition-colors disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  </button>
                  <button
                    onClick={() => setSelectedDate(today)}
                    className="px-3 py-2 text-xs font-medium rounded-xl bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors"
                  >
                    오늘
                  </button>
                </div>
                <span className="text-sm text-text-muted">
                  {formatDisplayDate(selectedDate)}
                </span>
              </div>
            </TabsContent>

            {/* Weekly Tab Controls */}
            <TabsContent value="weekly" animated={false} className="mt-0">
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
                  className="p-2 rounded-xl bg-bg-tertiary/50 hover:bg-accent/10 border border-border/30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-text-secondary" />
                </button>
                <span className="text-sm font-medium text-text-primary px-3 py-2 bg-bg-tertiary/50 rounded-xl border border-border/30">
                  {selectedWeek}
                </span>
                <button
                  onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
                  disabled={selectedWeek >= currentWeek}
                  className="p-2 rounded-xl bg-bg-tertiary/50 hover:bg-accent/10 border border-border/30 transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                </button>
                <button
                  onClick={() => setSelectedWeek(currentWeek)}
                  className="px-3 py-2 text-xs font-medium rounded-xl bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors"
                >
                  이번 주
                </button>
                <span className="text-sm text-text-muted ml-2 hidden md:inline">
                  {formatWeekDisplay(selectedWeek)}
                </span>
              </div>
            </TabsContent>

            {/* Range Tab Controls */}
            <TabsContent value="range" animated={false} className="mt-0">
              <div className="flex items-center gap-2 mb-6">
                <input
                  type="date"
                  value={rangeStart}
                  onChange={e => setRangeStart(e.target.value)}
                  max={rangeEnd}
                  className="input-base py-2 px-3 text-sm w-auto"
                />
                <span className="text-text-muted text-sm">~</span>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={e => setRangeEnd(e.target.value)}
                  min={rangeStart}
                  max={today}
                  className="input-base py-2 px-3 text-sm w-auto"
                />
                <button
                  onClick={handleRangeQuery}
                  className="btn-base btn-primary px-4 py-2 text-sm"
                >
                  조회
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center gap-2 py-20 text-accent-secondary">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* No Data */}
        {!loading && !error && !selected && (tab !== 'range' || rangeTriggered) && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">해당 기간의 데이터가 없습니다</p>
          </div>
        )}

        {/* Range not yet queried */}
        {!loading && !error && tab === 'range' && !rangeTriggered && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">날짜를 선택하고 조회 버튼을 눌러주세요</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && selected && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <SummaryCards
              data={selected}
              weeklyTotal={weeklyTotal}
              showWeekly={tab === 'daily'}
            />

            {/* Tab-specific charts */}
            {tab === 'daily' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrendLineChart data={data.daily} selectedDate={selectedDate} onDateClick={handleDateClick} />
                <HourlyBarChart hourly={selected.hourly || {}} />
              </div>
            )}

            {tab === 'weekly' && (
              <WeekdayBarChart data={data.daily} onDateClick={handleDateClick} />
            )}

            {tab === 'range' && data.rangeDays.length > 0 && (
              <RangeDailyBarChart data={data.rangeDays} onDateClick={handleDateClick} />
            )}

            {/* Common charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selected.commands && Object.keys(selected.commands).length > 0 && (
                <CommandPieChart commands={selected.commands} />
              )}
              {selected.categories && (
                <CategoryPieChart categories={selected.categories} />
              )}
            </div>

            {selected.keywords && Object.keys(selected.keywords).length > 0 && (
              <TopKeywordsChart keywords={selected.keywords} />
            )}

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selected.users && Object.keys(selected.users).length > 0 && (
                <UserRankingTable users={selected.users} onUserClick={setModalUserId} />
              )}
              {selected.guilds && Object.keys(selected.guilds).length > 0 && (
                <ServerUsageTable guilds={selected.guilds} />
              )}
            </div>

            {selected.commandKeywords && Object.keys(selected.commandKeywords).length > 0 && (
              <CommandKeywordsSection commandKeywords={selected.commandKeywords} />
            )}

            {selected.keywords && Object.keys(selected.keywords).length > 0 && (
              <KeywordSearch keywords={selected.keywords} />
            )}
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      <UserDetailModal
        open={!!modalUserId}
        onClose={() => setModalUserId(null)}
        userId={modalUserId || ''}
        user={modalUser}
      />
    </div>
  );
};

export default AnalyticsDashboard;
