import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import mapsData from '@/data/pooyasMaps.json';
import { matchesConsonantSearch } from '@/shared/utils/searchUtils';
import SearchBar from '@/shared/components/ui/SearchBar';

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
    <div className="max-w-6xl mx-auto px-4 py-8 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center text-text-secondary space-y-4">
          <p className="text-base md:text-lg">스톤에이지 지역별 지도 모음</p>

          {/* 정보성 알림 박스 */}
          <div className="bg-bg-secondary border-l-4 border-accent rounded-r-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-accent text-lg flex-shrink-0">🗺️</div>
              <p className="text-sm font-medium text-text-primary text-left">
                지도 정보는 뿌야의 스톤에이지의 정보 입니다.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-yellow-500 text-lg flex-shrink-0">💡</div>
              <p className="text-sm text-text-secondary text-left">
                지도를 클릭하면 상세 이미지를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
              !selectedCategory
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-border'
            }`}
          >
            전체
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedCategory === category
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-border'
              }`}
            >
              {category}
            </button>
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
        <div className="bg-bg-secondary rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              총 <span className="font-bold text-accent">{maps.length}</span>개의 지도
            </span>
            {(searchTerm || selectedCategory) && (
              <span className="text-text-secondary">
                검색 결과: <span className="font-bold text-accent">{filteredMaps.length}</span>개
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 지도 목록 */}
      <div className="space-y-3">
        {filteredMaps.length > 0 ? (
          filteredMaps.map(map => (
            <div
              key={map.idx}
              onClick={() => handleMapClick(map.idx)}
              className="group bg-bg-secondary hover:bg-bg-tertiary border border-border hover:border-accent rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                      {map.category}
                    </span>
                  </div>
                  <h3 className="text-text-primary font-medium group-hover:text-accent transition-colors duration-200 line-clamp-2">
                    {map.title}
                  </h3>
                  <div className="mt-2 flex items-center text-xs text-text-secondary">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    상세 지도 보기
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="w-8 h-8 bg-accent/10 group-hover:bg-accent/20 rounded-full flex items-center justify-center transition-colors duration-200">
                    <svg
                      className="h-4 w-4 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">검색 결과가 없습니다</h3>
            <p className="text-text-secondary">다른 키워드로 검색해보세요</p>
          </div>
        )}
      </div>

      {/* 푸터 정보 */}
      <div className="mt-8 text-center">
        <div className="bg-bg-secondary rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-4">📌 이용 안내</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>• 지도 정보는 뿌야의 스톤에이지에서 제공됩니다</p>
            <p>• 각 지도를 클릭하면 상세 지도를 확인할 수 있습니다</p>
            <p>• 카테고리별로 지도를 필터링할 수 있습니다</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapsPage;
