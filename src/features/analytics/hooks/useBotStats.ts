import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BotStatsDocument, DailyTrend, StatsData, ViewMode } from '../types';
import { addDays, getDateRange, getWeekKey, getWeekDates } from '../utils/dateUtils';
import { mergeStats } from '../utils/statsAggregator';

async function fetchDoc(docId: string): Promise<BotStatsDocument | null> {
  try {
    const snap = await getDoc(doc(db, 'bot-stats', docId));
    if (snap.exists()) return snap.data() as BotStatsDocument;
    return null;
  } catch {
    return null;
  }
}

export function useBotStats(mode: ViewMode, dateKey: string, rangeStart?: string, rangeEnd?: string) {
  const [data, setData] = useState<StatsData>({
    selected: null,
    daily: [],
    weekly: null,
    rangeDays: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'daily') {
        // Fetch selected day + last 7 days trend in parallel
        const trendDates = Array.from({ length: 7 }, (_, i) => addDays(dateKey, -(6 - i)));
        const weekKey = getWeekKey(new Date(dateKey + 'T00:00:00'));

        const [selectedDoc, weeklyDoc, ...trendDocs] = await Promise.all([
          fetchDoc(`daily-${dateKey}`),
          fetchDoc(`weekly-${weekKey}`),
          ...trendDates.map(d => fetchDoc(`daily-${d}`)),
        ]);

        const daily: DailyTrend[] = trendDates.map((date, i) => ({
          date,
          totalCalls: trendDocs[i]?.totalCalls || 0,
        }));

        setData({ selected: selectedDoc, daily, weekly: weeklyDoc, rangeDays: [] });
      } else if (mode === 'weekly') {
        // Fetch weekly doc + daily docs for day-of-week breakdown
        const weekDates = getWeekDates(dateKey);

        const [weeklyDoc, ...dailyDocs] = await Promise.all([
          fetchDoc(`weekly-${dateKey}`),
          ...weekDates.map(d => fetchDoc(`daily-${d}`)),
        ]);

        const daily: DailyTrend[] = weekDates.map((date, i) => ({
          date,
          totalCalls: dailyDocs[i]?.totalCalls || 0,
        }));

        setData({ selected: weeklyDoc, daily, weekly: weeklyDoc, rangeDays: [] });
      } else if (mode === 'range' && rangeStart && rangeEnd) {
        const rangeDates = getDateRange(rangeStart, rangeEnd);
        if (rangeDates.length > 90) {
          setError('최대 90일까지 조회 가능합니다.');
          setLoading(false);
          return;
        }

        const docs = await Promise.all(rangeDates.map(d => fetchDoc(`daily-${d}`)));
        const validDocs = docs.filter((d): d is BotStatsDocument => d !== null);
        const merged = validDocs.length > 0 ? mergeStats(validDocs) : null;
        const rangeDays: DailyTrend[] = rangeDates.map((date, i) => ({
          date,
          totalCalls: docs[i]?.totalCalls || 0,
        }));

        setData({ selected: merged, daily: [], weekly: null, rangeDays });
      }
    } catch (e) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [mode, dateKey, rangeStart, rangeEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
