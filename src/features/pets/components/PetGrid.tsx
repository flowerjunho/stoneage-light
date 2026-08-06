import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import type { Pet } from '@/shared/types';
import type { ElementFilterItem } from '@/shared/components/filters/ElementFilter';
import type { GradeType } from '@/shared/components/filters/GradeFilter';
import type { StatFilterItem } from '@/shared/components/filters/StatFilter';
import type { SortOption } from '@/shared/components/ui/SortDropdown';
import SortDropdown from '@/shared/components/ui/SortDropdown';
import PetCard from './PetCard';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { matchesConsonantSearch } from '@/shared/utils/korean';
import { isFavorite } from '@/shared/utils/favorites';
import { sortPets } from '@/features/pets/utils/petSorting';

interface PetGridProps {
  pets: Pet[];
  searchTerm: string;
  elementFilters: ElementFilterItem[];
  gradeFilters: GradeType[];
  statFilters: StatFilterItem[];
  showFavoritesOnly: boolean;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  scrollToId?: string;
}

const PetGrid: React.FC<PetGridProps> = React.memo(
  ({ pets, searchTerm, elementFilters, gradeFilters, statFilters, showFavoritesOnly, sortOption, onSortChange, scrollToId }) => {
    // 1. 디바운싱된 검색어
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // 2. 반응형 컬럼 수 감지 (모바일: 1, 태블릿: 2, 데스크톱: 3)
    const [columnCount, setColumnCount] = useState<number>(() => {
      if (typeof window === 'undefined') return 3;
      if (window.innerWidth < 768) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    });

    useEffect(() => {
      const updateColumnCount = () => {
        const width = window.innerWidth;
        if (width < 768) {
          setColumnCount(1);
        } else if (width < 1024) {
          setColumnCount(2);
        } else {
          setColumnCount(3);
        }
      };

      updateColumnCount();
      window.addEventListener('resize', updateColumnCount);
      return () => window.removeEventListener('resize', updateColumnCount);
    }, []);

    // 3. 검색 및 필터링 적용
    const filteredPets = useMemo(() => {
      let result = pets;

      // 즐겨찾기 필터링
      if (showFavoritesOnly) {
        result = result.filter(pet => isFavorite(pet));
      }

      // 텍스트 검색 필터링
      if (debouncedSearchTerm) {
        result = result.filter(pet => matchesConsonantSearch(pet.name, debouncedSearchTerm));
      }

      // 속성 필터링
      if (elementFilters.length > 0) {
        result = result.filter(pet => {
          return elementFilters.some(filter => {
            let petValue: number;
            
            switch (filter.element) {
              case 'earth':
                petValue = pet.elementStats.earth;
                break;
              case 'water':
                petValue = pet.elementStats.water;
                break;
              case 'fire':
                petValue = pet.elementStats.fire;
                break;
              case 'wind':
                petValue = pet.elementStats.wind;
                break;
              default:
                return false;
            }
            
            if (filter.exactValue !== undefined) {
              return petValue === filter.exactValue;
            } else {
              return petValue > 0;
            }
          });
        });
      }

      // 등급 필터링
      if (gradeFilters.length > 0) {
        result = result.filter(pet => {
          if (gradeFilters.includes('일반') && pet.grade.includes('일반')) {
            return true;
          }
          return gradeFilters.includes(pet.grade as GradeType);
        });
      }

      // 스탯 필터링
      if (statFilters.length > 0) {
        const activeFilters = statFilters.filter(filter => filter.enabled);
        if (activeFilters.length > 0) {
          result = result.filter(pet => {
            return activeFilters.every(filter => {
              const getNestedValue = (obj: unknown, path: string): number => {
                const keys = path.split('.');
                let value: unknown = obj;
                for (const key of keys) {
                  if (value && typeof value === 'object' && key in value) {
                    value = (value as Record<string, unknown>)[key];
                  } else {
                    return 0;
                  }
                }
                return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
              };

              const petValue = getNestedValue(pet, filter.stat);
              return petValue >= filter.value;
            });
          });
        }
      }

      // 정렬 적용
      result = sortPets(result, sortOption);

      return result;
    }, [pets, debouncedSearchTerm, elementFilters, gradeFilters, statFilters, showFavoritesOnly, sortOption]);

    // 4. 컬럼 수에 맞춰 가상화 로우 배열 생성
    const rows = useMemo(() => {
      const result: Pet[][] = [];
      for (let i = 0; i < filteredPets.length; i += columnCount) {
        result.push(filteredPets.slice(i, i + columnCount));
      }
      return result;
    }, [filteredPets, columnCount]);

    // 5. React 19 전용 100% 호환 순수 Window Scroll 가상화 엔진
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(800);

    const updateScrollState = useCallback(() => {
      if (typeof window === 'undefined') return;
      
      const currentScrollY = window.scrollY;
      const currentHeight = window.innerHeight;
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const containerTop = currentScrollY + rect.top;
        const relativeScroll = Math.max(0, currentScrollY - containerTop);
        setScrollTop(relativeScroll);
      } else {
        setScrollTop(currentScrollY);
      }
      setViewportHeight(currentHeight);
    }, []);

    useEffect(() => {
      updateScrollState();
      
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateScrollState();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }, [updateScrollState]);

    // 가상화 로우 높이 추정 (px)
    const ESTIMATED_ROW_HEIGHT = 480;
    const OVERSCAN_ROWS = 3; // 화면 위아래로 예비 3개 로우만 프리렌더링

    const startIndex = Math.max(0, Math.floor(scrollTop / ESTIMATED_ROW_HEIGHT) - OVERSCAN_ROWS);
    const endIndex = Math.min(
      rows.length,
      Math.ceil((scrollTop + viewportHeight) / ESTIMATED_ROW_HEIGHT) + OVERSCAN_ROWS
    );

    const visibleRows = rows.slice(startIndex, endIndex);

    const paddingTop = startIndex * ESTIMATED_ROW_HEIGHT;
    const paddingBottom = Math.max(0, (rows.length - endIndex) * ESTIMATED_ROW_HEIGHT);

    // 6. 특정 펫 이동 (scrollToId)
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    useEffect(() => {
      if (!scrollToId) return;

      const petIndex = filteredPets.findIndex(p => p.id === scrollToId);
      if (petIndex === -1) return;

      const rowIndex = Math.floor(petIndex / columnCount);
      const targetY = rowIndex * ESTIMATED_ROW_HEIGHT;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const absoluteY = window.scrollY + rect.top + targetY;
        window.scrollTo({ top: absoluteY, behavior: 'smooth' });
      }

      setHighlightedId(scrollToId);
      const timer = setTimeout(() => setHighlightedId(null), 2000);
      return () => clearTimeout(timer);
    }, [scrollToId, filteredPets, columnCount]);

    const isTyping = searchTerm !== debouncedSearchTerm;

    // 검색 타이핑 중 표시
    if (isTyping && searchTerm.trim()) {
      return (
        <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
          <div className="mb-6 iphone16:mb-4">
            <span className="text-text-secondary text-sm font-medium">Searching...</span>
          </div>
          <div className="flex justify-center items-center min-h-80 p-8 iphone16:min-h-48 iphone16:p-6">
            <div className="text-center text-text-secondary">
              <div className="w-16 h-16 mx-auto mb-4 iphone16:w-12 iphone16:h-12">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full animate-spin text-accent"
                >
                  <path
                    d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                  />
                  <path
                    d="M21 21L16.514 16.506"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-base text-text-secondary iphone16:text-sm animate-pulse">
                Searching for pets...
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 결과 없음 표시
    if (filteredPets.length === 0) {
      return (
        <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
          <div className="mb-6 iphone16:mb-4">
            <span className="text-text-secondary text-sm font-medium">0 pets found</span>
          </div>
          <div className="flex justify-center items-center min-h-80 p-8 iphone16:min-h-48 iphone16:p-6">
            <div className="text-center text-text-muted">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-text-muted iphone16:w-12 iphone16:h-12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="text-xl mb-2 text-text-secondary iphone16:text-lg">No pets found</h3>
              <p className="text-base m-0 iphone16:text-sm">
                {(() => {
                  const hasSearch = !!debouncedSearchTerm;
                  const hasElementFilters = elementFilters.length > 0;
                  const hasGradeFilters = gradeFilters.length > 0;
                  const hasStatFilters = statFilters.filter(f => f.enabled).length > 0;
                  const hasFavoriteFilter = showFavoritesOnly;
                  const hasAnyFilters =
                    hasElementFilters || hasGradeFilters || hasStatFilters || hasFavoriteFilter;

                  if (
                    hasFavoriteFilter &&
                    !hasSearch &&
                    !hasElementFilters &&
                    !hasGradeFilters &&
                    !hasStatFilters
                  ) {
                    return '즐겨찾기에 추가된 펫이 없습니다. 펫 카드의 별 아이콘을 클릭하여 즐겨찾기에 추가하세요.';
                  } else if (hasSearch && hasAnyFilters) {
                    return `No pets match "${debouncedSearchTerm}" with current filters. Try different search terms or filters.`;
                  } else if (hasSearch) {
                    return `No pets match "${debouncedSearchTerm}". Try different search terms.`;
                  } else if (hasAnyFilters) {
                    return 'No pets match the current filters. Try adjusting your filters.';
                  } else {
                    return 'Try adjusting your search terms';
                  }
                })()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        {/* 상단 총 펫 개수 표시 및 정렬 드롭다운 */}
        <div className="mb-6 px-2 iphone16:mb-4 flex items-center justify-between">
          <span className="text-text-secondary text-sm font-medium">
            Total <span className="text-accent font-bold">{filteredPets.length}</span> pets
          </span>
          <SortDropdown currentSort={sortOption} onSortChange={onSortChange} />
        </div>

        {/* React 19 Pure Virtualized Grid Container */}
        <div ref={containerRef} className="w-full">
          <div
            style={{
              paddingTop: `${paddingTop}px`,
              paddingBottom: `${paddingBottom}px`,
            }}
          >
            {visibleRows.map((rowPets, rowIndexOffset) => {
              const rowIndex = startIndex + rowIndexOffset;

              return (
                <div
                  key={`row-${rowIndex}`}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-4 iphone16:gap-4 pb-6"
                >
                  {rowPets.map((pet, index) => (
                    <div
                      key={`${pet.id || pet.name}-${index}`}
                      id={`pet-${pet.id}`}
                      className={
                        highlightedId === pet.id
                          ? 'rounded-[24px] ring-2 ring-accent ring-offset-2 ring-offset-bg-primary shadow-glow transition-all duration-300'
                          : undefined
                      }
                    >
                      <PetCard pet={pet} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

PetGrid.displayName = 'PetGrid';

export default PetGrid;
