import { useEffect } from 'react';
import ElementFilter, { type ElementType } from './ElementFilter';
import GradeFilter, { type GradeType } from './GradeFilter';
import StatFilter, { type StatFilterItem } from './StatFilter';
import FavoriteFilter from './FavoriteFilter';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  elementFilters: ElementType[];
  gradeFilters: GradeType[];
  statFilters: StatFilterItem[];
  showFavoritesOnly: boolean;
  onElementFilterChange: (filters: ElementType[]) => void;
  onGradeFilterChange: (filters: GradeType[]) => void;
  onStatFilterChange: (filters: StatFilterItem[]) => void;
  onFavoriteFilterChange: (favoritesOnly: boolean) => void;
}

const FilterBottomSheet = ({
  isOpen,
  onClose,
  elementFilters,
  gradeFilters,
  statFilters,
  showFavoritesOnly,
  onElementFilterChange,
  onGradeFilterChange,
  onStatFilterChange,
  onFavoriteFilterChange,
}: FilterBottomSheetProps) => {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 바디 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleResetFilters = () => {
    onElementFilterChange([]);
    onGradeFilterChange([]);
    onStatFilterChange([]);
    onFavoriteFilterChange(false);
    // onClose() 제거 - 바텀시트를 닫지 않음
  };

  // 필터가 활성화되어 있는지 확인 (현재 사용하지 않음)
  // const hasActiveFilters = elementFilters.length > 0 || gradeFilters.length > 0 || statFilters.filter(f => f.enabled).length > 0 || showFavoritesOnly

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 바텀시트 */}
      <div
        className={`
        relative w-full max-w-4xl bg-bg-primary
        rounded-t-2xl shadow-2xl transform transition-all duration-300 ease-out
        max-h-[85vh] overflow-hidden flex flex-col
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center py-3 bg-bg-primary">
          <div className="w-12 h-1 bg-text-secondary/30 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary">필터</h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg
                     text-text-secondary hover:text-text-primary hover:bg-bg-secondary
                     transition-all duration-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 스크롤 가능한 콘텐츠 */}
        <div className="flex-1 overflow-y-auto bg-bg-primary py-2">
          {/* 즐겨찾기 필터 */}
          <div className="border-b border-border-primary pb-4 mb-4">
            <FavoriteFilter
              onFilterChange={onFavoriteFilterChange}
              initialValue={showFavoritesOnly}
            />
          </div>

          {/* 속성 필터 */}
          <div className="border-b border-border-primary pb-4 mb-4">
            <div className="mb-4 px-4">
              <span className="text-text-secondary text-sm font-medium">속성 필터:</span>
            </div>
            <div className="px-4">
              <ElementFilter
                onFilterChange={onElementFilterChange}
                initialFilters={elementFilters}
                hideLabel={true}
              />
            </div>
          </div>

          {/* 등급 필터 */}
          <div className="border-b border-border-primary pb-4 mb-4">
            <div className="mb-4 px-4">
              <span className="text-text-secondary text-sm font-medium">페트 등급:</span>
            </div>
            <div className="px-4">
              <GradeFilter
                onFilterChange={onGradeFilterChange}
                initialFilters={gradeFilters}
                hideLabel={true}
              />
            </div>
          </div>

          {/* 스탯 필터 */}
          <div className="pb-4">
            <StatFilter onFilterChange={onStatFilterChange} initialFilters={statFilters} />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 p-4 border-t border-border-primary bg-bg-primary">
          <button
            onClick={handleResetFilters}
            className="flex-1 py-3 px-4 bg-bg-secondary text-text-secondary rounded-lg
                     hover:bg-bg-tertiary hover:text-text-primary border border-border-primary
                     transition-all duration-200 font-medium"
          >
            전체 초기화
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-accent text-white rounded-lg
                     hover:bg-accent/90 transition-all duration-200 font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBottomSheet;
