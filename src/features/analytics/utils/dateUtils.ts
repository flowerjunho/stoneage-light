export function getSeoulDateString(date?: Date): string {
  return (date || new Date()).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  while (cur <= endDate) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function getWeekDates(weekKey: string): string[] {
  // weekKey format: "YYYY-W##"
  const [yearStr, weekPart] = weekKey.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekPart);

  // ISO 8601: week 1 contains January 4th
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function formatWeekDisplay(weekKey: string): string {
  const dates = getWeekDates(weekKey);
  const start = dates[0];
  const end = dates[6];
  const sD = new Date(start + 'T00:00:00');
  const eD = new Date(end + 'T00:00:00');
  return `${sD.getFullYear()}년 ${sD.getMonth() + 1}/${sD.getDate()} ~ ${eD.getMonth() + 1}/${eD.getDate()}`;
}

export function addWeeks(weekKey: string, weeks: number): string {
  const dates = getWeekDates(weekKey);
  const monday = new Date(dates[0] + 'T00:00:00');
  monday.setDate(monday.getDate() + weeks * 7);
  return getWeekKey(monday);
}

export function getDayOfWeekLabel(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}
