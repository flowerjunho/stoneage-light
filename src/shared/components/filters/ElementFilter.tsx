import React, { useState, useEffect } from 'react';

export type ElementType = 'earth' | 'water' | 'fire' | 'wind';

export interface ElementFilterItem {
  element: ElementType;
  exactValue?: number; // 정확한 값 매칭 (optional)
}

interface ElementFilterProps {
  onFilterChange: (filters: ElementFilterItem[]) => void;
  initialFilters?: ElementFilterItem[];
  onClearAllFilters?: () => void;
  hasFiltersActive?: boolean;
  hideLabel?: boolean;
}

const ElementFilter = React.memo(
  ({
    onFilterChange,
    initialFilters = [],
    onClearAllFilters,
    hasFiltersActive = false,
    hideLabel = false,
  }: ElementFilterProps) => {
    const [activeFilters, setActiveFilters] = useState<ElementFilterItem[]>(initialFilters);

    // 초기값이 변경될 때 상태 동기화
    useEffect(() => {
      setActiveFilters(initialFilters);
    }, [initialFilters]);

    const elements = [
      {
        key: 'earth' as ElementType,
        label: '지',
        activeColor: 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30',
        inactiveColor: 'border-2 border-green-500/50 text-green-400 hover:bg-green-500/10',
      },
      {
        key: 'water' as ElementType,
        label: '수',
        activeColor: 'bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30',
        inactiveColor: 'border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10',
      },
      {
        key: 'fire' as ElementType,
        label: '화',
        activeColor: 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30',
        inactiveColor: 'border-2 border-red-500/50 text-red-400 hover:bg-red-500/10',
      },
      {
        key: 'wind' as ElementType,
        label: '풍',
        activeColor: 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30',
        inactiveColor: 'border-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10',
      },
    ];

    const handleFilterClick = (element: ElementType) => {
      let newFilters: ElementFilterItem[];
      const existingFilter = activeFilters.find(f => f.element === element);

      if (existingFilter) {
        // 이미 활성화된 필터면 제거
        newFilters = activeFilters.filter(f => f.element !== element);
      } else {
        // 새로운 필터 추가
        newFilters = [...activeFilters, { element }];
      }

      setActiveFilters(newFilters);
      onFilterChange(newFilters);
    };

    const handleExactValueChange = (element: ElementType, value: string) => {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      if (numValue !== undefined && (isNaN(numValue) || numValue < 0)) return;

      const newFilters = activeFilters.map(filter => 
        filter.element === element 
          ? { ...filter, exactValue: numValue }
          : filter
      );

      setActiveFilters(newFilters);
      onFilterChange(newFilters);
    };

    const clearFilters = () => {
      setActiveFilters([]);
      onFilterChange([]);
    };

    return (
      <div className={hideLabel ? 'mb-6' : 'px-4 mb-6'}>
        <div className="flex flex-wrap gap-3 items-center justify-between iphone16:flex-col iphone16:items-start iphone16:gap-4">
          <div className="flex flex-wrap gap-3 items-center">
            {!hideLabel && (
              <span className="text-text-secondary text-sm font-medium">속성 필터:</span>
            )}

            {elements.map(element => {
              const activeFilter = activeFilters.find(f => f.element === element.key);
              const isActive = !!activeFilter;
              return (
                <div key={element.key} className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterClick(element.key)}
                    className={`
                    px-4 py-2 rounded-lg font-semibold text-sm
                    transition-all duration-200 transform hover:scale-105
                    ${isActive ? element.inactiveColor + ' opacity-70' : element.activeColor}
                    active:scale-95
                  `}
                  >
                    {element.label}
                    {isActive && <span className="ml-1">✓</span>}
                  </button>
                  
                  {isActive && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-text-secondary">=</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={activeFilter?.exactValue || ''}
                        onChange={(e) => handleExactValueChange(element.key, e.target.value)}
                        placeholder="개수"
                        className="w-16 px-2 py-1 text-xs border border-border rounded
                                 bg-bg-secondary text-text-primary placeholder-text-muted
                                 focus:outline-none focus:border-accent"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary 
                       border border-border-primary rounded-lg hover:bg-bg-secondary
                       transition-all duration-200"
              >
                속성 초기화
              </button>
            )}
          </div>

          {onClearAllFilters && hasFiltersActive && (
            <button
              onClick={onClearAllFilters}
              className="px-3 py-2 text-xs text-white bg-red-500 hover:bg-red-600 
                     rounded-lg transition-all duration-200 font-medium iphone16:self-end"
            >
              전체 초기화
            </button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 text-xs text-text-secondary">
            {activeFilters.length}개 속성이 선택됨:{' '}
            {activeFilters.map(f => {
              const element = elements.find(e => e.key === f.element);
              return f.exactValue ? `${element?.label}=${f.exactValue}` : element?.label;
            }).join(', ')}
          </div>
        )}
      </div>
    );
  }
);

export default ElementFilter;
