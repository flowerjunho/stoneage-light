import { useState } from 'react';
import FilterBottomSheet from './FilterBottomSheet';
import type { ElementFilterItem } from './ElementFilter';
import type { GradeType } from './GradeFilter';
import type { StatFilterItem } from '@/shared/components/filters/StatFilter';

interface FloatingFilterButtonProps {
  elementFilters: ElementFilterItem[];
  gradeFilters: GradeType[];
  statFilters: StatFilterItem[];
  showFavoritesOnly: boolean;
  onElementFilterChange: (filters: ElementFilterItem[]) => void;
  onGradeFilterChange: (filters: GradeType[]) => void;
  onStatFilterChange: (filters: StatFilterItem[]) => void;
  onFavoriteFilterChange: (favoritesOnly: boolean) => void;
}

const FloatingFilterButton = ({
  elementFilters,
  gradeFilters,
  statFilters,
  showFavoritesOnly,
  onElementFilterChange,
  onGradeFilterChange,
  onStatFilterChange,
  onFavoriteFilterChange,
}: FloatingFilterButtonProps) => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // 활성 필터 개수 계산
  const activeFilterCount =
    elementFilters.length +
    gradeFilters.length +
    statFilters.filter(f => f.enabled).length +
    (showFavoritesOnly ? 1 : 0);

  return (
    <>
      {/* 플로팅 필터 버튼 */}
      <button
        onClick={() => setIsBottomSheetOpen(true)}
        className="fixed bottom-20 z-40 w-12 h-12 bg-accent hover:bg-accent/90
                   text-white rounded-full shadow-lg hover:shadow-xl
                   flex items-center justify-center transition-all duration-300
                   hover:scale-110 active:scale-95
                   left-6 lg:left-[calc(50%-32rem-60px)] xl:left-[calc(50%-30rem-60px)]
                   iphone16:bottom-16 iphone16:left-4 iphone16:w-10 iphone16:h-10"
        aria-label="필터 설정"
      >
        {/* 필터 아이콘 */}
        <svg
          className="w-6 h-6 iphone16:w-5 iphone16:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>

        {/* 활성 필터 개수 배지 */}
        {activeFilterCount > 0 && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white
                         text-xs font-bold rounded-full flex items-center justify-center
                         iphone16:w-4 iphone16:h-4 iphone16:text-xs"
          >
            {activeFilterCount > 9 ? '9+' : activeFilterCount}
          </div>
        )}
      </button>

      {/* 바텀시트 */}
      <FilterBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        elementFilters={elementFilters}
        gradeFilters={gradeFilters}
        statFilters={statFilters}
        showFavoritesOnly={showFavoritesOnly}
        onElementFilterChange={onElementFilterChange}
        onGradeFilterChange={onGradeFilterChange}
        onStatFilterChange={onStatFilterChange}
        onFavoriteFilterChange={onFavoriteFilterChange}
      />
    </>
  );
};

export default FloatingFilterButton;
