import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface KeywordSearchProps {
  keywords: Record<string, number>;
}

const KeywordSearch: React.FC<KeywordSearchProps> = ({ keywords }) => {
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () =>
      Object.entries(keywords)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count),
    [keywords]
  );

  const filtered = useMemo(() => {
    if (!query) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(k => k.keyword.toLowerCase().includes(q));
  }, [sorted, query]);

  if (sorted.length === 0) return null;

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">키워드 검색</h3>
        <span className="text-xs text-text-muted ml-auto">{sorted.length}개</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="키워드 검색..."
          className="input-base pl-9 py-2.5 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto">
        {filtered.map(({ keyword, count }) => (
          <span key={keyword} className="tag text-xs">
            {keyword}
            <span className="ml-1 text-accent font-semibold">{count}</span>
          </span>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-text-muted py-4 w-full text-center">검색 결과가 없습니다</p>
        )}
      </div>
    </Card>
  );
};

export default KeywordSearch;
