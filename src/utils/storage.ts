export interface SavedData {
  id: string;
  title: string;
  timestamp: number;
  levels: number[];
  stats: Array<{
    con: number;
    wis: number;
    dex: number;
  }>;
}

const STORAGE_KEY = 'stoneage_calculator_saves';
const MAX_SAVES = 5;

export const getSavedDataList = (): SavedData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load saved data:', error);
    return [];
  }
};

export const saveData = (
  title: string,
  levels: number[],
  stats: Array<{ con: number; wis: number; dex: number }>
): boolean => {
  try {
    const existingSaves = getSavedDataList();

    // 최대 저장 개수 체크
    if (existingSaves.length >= MAX_SAVES) {
      // 가장 오래된 것 삭제
      existingSaves.sort((a, b) => a.timestamp - b.timestamp);
      existingSaves.shift();
    }

    const newSave: SavedData = {
      id: Date.now().toString(),
      title: title.trim() || `저장 ${Date.now()}`,
      timestamp: Date.now(),
      levels,
      stats,
    };

    existingSaves.push(newSave);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSaves));
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
};

export const loadData = (id: string): SavedData | null => {
  try {
    const existingSaves = getSavedDataList();
    return existingSaves.find(save => save.id === id) || null;
  } catch (error) {
    console.error('Failed to load data:', error);
    return null;
  }
};

export const deleteData = (id: string): boolean => {
  try {
    const existingSaves = getSavedDataList();
    const filteredSaves = existingSaves.filter(save => save.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSaves));
    return true;
  } catch (error) {
    console.error('Failed to delete data:', error);
    return false;
  }
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
