import { useState, useEffect } from 'react';

export type GradeType = '1등급' | '2등급' | '일반등급';

interface GradeFilterProps {
  onFilterChange: (filters: GradeType[]) => void;
  initialFilters?: GradeType[];
  hideLabel?: boolean;
}

const GradeFilter = ({
  onFilterChange,
  initialFilters = [],
  hideLabel = false,
}: GradeFilterProps) => {
  const [activeFilters, setActiveFilters] = useState<GradeType[]>(initialFilters);

  // 초기값이 변경될 때 상태 동기화
  useEffect(() => {
    setActiveFilters(initialFilters);
  }, [initialFilters]);

  const grades = [
    {
      key: '1등급' as GradeType,
      label: '1등급',
      activeColor: 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-black',
      inactiveColor: 'border-2 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10',
    },
    {
      key: '2등급' as GradeType,
      label: '2등급',
      activeColor: 'bg-gradient-to-r from-blue-500 to-blue-400 text-white',
      inactiveColor: 'border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10',
    },
    {
      key: '일반등급' as GradeType,
      label: '일반등급',
      activeColor: 'bg-bg-tertiary text-text-secondary border border-border-primary',
      inactiveColor: 'border-2 border-border-primary text-text-secondary hover:bg-bg-secondary',
    },
  ];

  const handleFilterClick = (grade: GradeType) => {
    let newFilters: GradeType[];

    if (activeFilters.includes(grade)) {
      // 이미 활성화된 필터면 제거
      newFilters = activeFilters.filter(f => f !== grade);
    } else {
      // 새로운 필터 추가
      newFilters = [...activeFilters, grade];
    }

    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    onFilterChange([]);
  };

  return (
    <div className={hideLabel ? 'mb-6' : 'px-4 mb-6'}>
      <div className="flex flex-wrap gap-3 items-center">
        {!hideLabel && <span className="text-text-secondary text-sm font-medium">판매 등급:</span>}

        {grades.map(grade => {
          const isActive = activeFilters.includes(grade.key);
          return (
            <button
              key={grade.key}
              onClick={() => handleFilterClick(grade.key)}
              className={`
                px-4 py-2 rounded-lg font-semibold text-sm
                transition-all duration-200 transform hover:scale-105
                ${isActive ? grade.inactiveColor + ' opacity-70' : grade.activeColor}
                active:scale-95
              `}
            >
              {grade.label}
              {isActive && <span className="ml-1">✓</span>}
            </button>
          );
        })}

        {activeFilters.length > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary 
                     border border-border-primary rounded-lg hover:bg-bg-secondary
                     transition-all duration-200"
          >
            판매 등급 초기화
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-3 text-xs text-text-secondary">
          {activeFilters.length}개 판매 등급이 선택됨: {activeFilters.join(', ')}
        </div>
      )}
    </div>
  );
};

export default GradeFilter;
