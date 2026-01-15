import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Map, Info, Eye, ChevronRight, Search } from 'lucide-react';
import mapsData from '@/data/pooyasMaps.json';
import { matchesConsonantSearch } from '@/shared/utils/searchUtils';
import SearchBar from '@/shared/components/ui/SearchBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MapData {
  idx: number;
  category: string;
  title: string;
  content: string;
}

const MapsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('search') || '';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return searchParams.get('category') || '';
  });

  // 지도 데이터
  const maps = mapsData as MapData[];

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    maps.forEach(map => {
      if (map.category) {
        categorySet.add(map.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [maps]);

  // 필터링된 지도 목록
  const filteredMaps = useMemo(() => {
    return maps.filter(map => {
      // 카테고리 필터
      if (selectedCategory && map.category !== selectedCategory) {
        return false;
      }
      // 검색어 필터
      if (searchTerm.trim()) {
        return matchesConsonantSearch(searchTerm, map.title) ||
               matchesConsonantSearch(searchTerm, map.category);
      }
      return true;
    });
  }, [maps, selectedCategory, searchTerm]);

  const handleMapClick = (mapIdx: number) => {
    const currentSearch = searchParams.get('search');
    const currentCategory = searchParams.get('category');
    let mapUrl = `/maps/${mapIdx}`;
    const params = new URLSearchParams();
    if (currentSearch) params.set('search', currentSearch);
    if (currentCategory) params.set('category', currentCategory);
    if (params.toString()) mapUrl += `?${params.toString()}`;
    navigate(mapUrl);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (category) {
        newParams.set('category', category);
      } else {
        newParams.delete('category');
      }
      return newParams;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Map className="w-4 h-4" />
            스톤에이지 지역별 지도 모음
          </Badge>

          {/* 정보성 알림 박스 */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-text-secondary text-left">
                지도 정보는 <span className="font-medium text-text-primary">뿌야의 스톤에이지</span>의 정보입니다.
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 text-left">
                지도를 클릭하면 상세 이미지를 확인할 수 있습니다.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange('')}
            className={cn(
              "rounded-full",
              !selectedCategory && "shadow-glow"
            )}
          >
            전체
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(category)}
              className={cn(
                "rounded-full",
                selectedCategory === category && "shadow-glow"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* 검색 바 */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value.trim()) {
              newParams.set('search', value);
            } else {
              newParams.delete('search');
            }
            return newParams;
          });
        }}
        placeholder="지도를 초성으로 검색하세요."
      />

      {/* 통계 정보 */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Map className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">전체 지도</p>
                <p className="text-lg font-bold text-text-primary tabular-nums">
                  {maps.length.toLocaleString()}
                  <span className="text-sm font-normal text-text-muted ml-1">개</span>
                </p>
              </div>
            </div>
            {(searchTerm || selectedCategory) && (
              <div className="text-right">
                <p className="text-xs text-text-muted">검색 결과</p>
                <p className="text-lg font-bold text-accent tabular-nums">{filteredMaps.length}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 지도 목록 */}
      <div className="space-y-3">
        {filteredMaps.length > 0 ? (
          filteredMaps.map(map => (
            <Card
              key={map.idx}
              onClick={() => handleMapClick(map.idx)}
              className="group p-4 cursor-pointer transition-all duration-300
                       hover:border-accent/50 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2 text-xs bg-accent/5 text-accent border-accent/20">
                    {map.category}
                  </Badge>
                  <h3 className="text-text-primary font-semibold group-hover:text-accent transition-colors duration-200 line-clamp-2 mb-2">
                    {map.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Eye className="h-3.5 w-3.5" />
                    상세 지도 보기
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="w-10 h-10 bg-accent/10 group-hover:bg-accent group-hover:shadow-glow
                                rounded-xl flex items-center justify-center transition-all duration-300">
                    <ChevronRight className="h-4 w-4 text-accent group-hover:text-text-inverse transition-colors" />
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                          flex items-center justify-center">
              <Search className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">검색 결과가 없습니다</h3>
            <p className="text-text-secondary">다른 키워드로 검색해보세요</p>
          </div>
        )}
      </div>

      {/* 푸터 정보 */}
      <div className="mt-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">이용 안내</h3>
          </div>
          <div className="space-y-2.5 text-sm text-text-secondary">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>지도 정보는 뿌야의 스톤에이지에서 제공됩니다</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>각 지도를 클릭하면 상세 지도를 확인할 수 있습니다</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>카테고리별로 지도를 필터링할 수 있습니다</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MapsPage;
