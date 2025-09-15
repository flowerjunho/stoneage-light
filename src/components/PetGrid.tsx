import React, { useMemo, useCallback } from 'react';
import type { Pet } from '../types';
import type { ElementType } from './ElementFilter';
import type { StatFilterItem } from './StatFilter';
import PetCard from './PetCard';
import PetCardSkeleton from './PetCardSkeleton';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useDebounce } from '../hooks/useDebounce';

interface PetGridProps {
  pets: Pet[];
  searchTerm: string;
  elementFilters: ElementType[];
  statFilters: StatFilterItem[];
}

const PetGrid: React.FC<PetGridProps> = React.memo(({ pets, searchTerm, elementFilters, statFilters }) => {
  // 디바운싱된 검색어
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 검색 및 속성 필터링을 메모이제이션
  const filteredPets = useMemo(() => {
    let result = pets;

    // 텍스트 검색 필터링
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(pet => 
        pet.name.toLowerCase().includes(searchLower) ||
        pet.grade.toLowerCase().includes(searchLower) ||
        pet.source.toLowerCase().includes(searchLower) ||
        String(pet.attack).includes(searchLower) ||
        String(pet.defense).includes(searchLower) ||
        String(pet.agility).includes(searchLower) ||
        String(pet.vitality).includes(searchLower) ||
        String(pet.earth).includes(searchLower) ||
        String(pet.water).includes(searchLower) ||
        String(pet.fire).includes(searchLower) ||
        String(pet.wind).includes(searchLower)
      );
    }

    // 속성 필터링 (선택된 속성 중 하나라도 0보다 큰 값을 가져야 함)
    if (elementFilters.length > 0) {
      result = result.filter(pet => {
        return elementFilters.some(element => {
          switch (element) {
            case 'earth': return pet.earth > 0;
            case 'water': return pet.water > 0;
            case 'fire': return pet.fire > 0;
            case 'wind': return pet.wind > 0;
            default: return false;
          }
        });
      });
    }

    // 스탯 필터링 (모든 활성화된 조건을 만족해야 함)
    if (statFilters.length > 0) {
      const activeFilters = statFilters.filter(filter => filter.enabled);
      if (activeFilters.length > 0) {
        result = result.filter(pet => {
          return activeFilters.every(filter => {
            const petValue = pet[filter.stat];
            if (typeof petValue === 'number') {
              return petValue >= filter.value;
            }
            return false;
          });
        });
      }
    }

    return result;
  }, [pets, debouncedSearchTerm, elementFilters, statFilters]);

  // 실시간 타이핑 중인지 확인
  const isTyping = searchTerm !== debouncedSearchTerm;

  const {
    displayedItems,
    hasMore,
    isLoading,
    isInitialLoading,
    loadMore
  } = useInfiniteScroll({
    items: filteredPets,
    itemsPerPage: 60
  });

  // loadMore 함수를 메모이제이션
  const memoizedLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  const loadTriggerRef = useIntersectionObserver({
    onIntersect: memoizedLoadMore,
    enabled: hasMore && !isLoading && !isInitialLoading && !isTyping,
    rootMargin: '200px'
  });

  // 타이핑 중일 때 검색 인디케이터 표시
  if (isTyping && searchTerm.trim()) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        <div className="mb-6 px-2 iphone16:mb-4">
          <span className="text-text-secondary text-sm font-medium">Searching...</span>
        </div>
        <div className="flex justify-center items-center min-h-80 p-8 iphone16:min-h-48 iphone16:p-6">
          <div className="text-center text-text-secondary">
            <div className="w-16 h-16 mx-auto mb-4 iphone16:w-12 iphone16:h-12">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-spin">
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
            <p className="text-base text-text-secondary iphone16:text-sm animate-pulse">Searching for pets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredPets.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        <div className="mb-6 px-2 iphone16:mb-4">
          <span className="text-text-secondary text-sm font-medium">0 pets found</span>
        </div>
        <div className="flex justify-center items-center min-h-80 p-8 iphone16:min-h-48 iphone16:p-6">
          <div className="text-center text-text-muted">
            <svg className="w-16 h-16 mx-auto mb-4 text-text-muted iphone16:w-12 iphone16:h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                const hasStatFilters = statFilters.filter(f => f.enabled).length > 0;
                const hasAnyFilters = hasElementFilters || hasStatFilters;

                if (hasSearch && hasAnyFilters) {
                  return `No pets match "${debouncedSearchTerm}" with current filters. Try different search terms or filters.`;
                } else if (hasSearch) {
                  return `No pets match "${debouncedSearchTerm}". Try different search terms.`;
                } else if (hasAnyFilters) {
                  return "No pets match the current filters. Try adjusting your filters.";
                } else {
                  return "Try adjusting your search terms";
                }
              })()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 초기 로딩 중일 때 스켈레톤 표시
  if (isInitialLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        <div className="mb-6 px-2 iphone16:mb-4">
          <div className="h-5 bg-bg-tertiary rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 md:gap-4 iphone16:gap-4 iphone16:mb-6">
          {Array.from({ length: 12 }, (_, index) => (
            <PetCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
      <div className="mb-6 px-2 iphone16:mb-4">
        <span className="text-text-secondary text-sm font-medium">
          {displayedItems.length} of {filteredPets.length} pets shown
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 md:gap-4 iphone16:gap-4 iphone16:mb-6">
        {displayedItems.map((pet, index) => (
          <PetCard key={`${pet.name}-${pet.attack}-${pet.defense}-${index}`} pet={pet} />
        ))}
      </div>
      
      {/* Load Trigger & Loading Indicator */}
      {hasMore && (
        <div ref={loadTriggerRef} className="flex justify-center items-center py-8">
          {isLoading ? (
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Loading more pets...</span>
            </div>
          ) : (
            <button
              onClick={memoizedLoadMore}
              className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              Load More Pets
            </button>
          )}
        </div>
      )}
      
      {/* End Message */}
      {!hasMore && displayedItems.length > 60 && (
        <div className="flex justify-center py-8">
          <span className="text-text-secondary text-sm">
            All {filteredPets.length} pets loaded
          </span>
        </div>
      )}
    </div>
  );
});

PetGrid.displayName = 'PetGrid';

export default PetGrid;