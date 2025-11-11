import React, { useState, useRef, useEffect } from 'react';

export type SortOption =
  | 'default'
  | 'attack-asc'
  | 'attack-desc'
  | 'defense-asc'
  | 'defense-desc'
  | 'agility-asc'
  | 'agility-desc'
  | 'vitality-asc'
  | 'vitality-desc'
  | 'attackGrowth-asc'
  | 'attackGrowth-desc'
  | 'defenseGrowth-asc'
  | 'defenseGrowth-desc'
  | 'agilityGrowth-asc'
  | 'agilityGrowth-desc'
  | 'vitalityGrowth-asc'
  | 'vitalityGrowth-desc'
  | 'totalGrowth-asc'
  | 'totalGrowth-desc';

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

type CategoryType = 'base' | 'growth' | 'totalGrowth';
type StatType = 'attack' | 'defense' | 'agility' | 'vitality';
type OrderType = 'asc' | 'desc';

const SortDropdown: React.FC<SortDropdownProps> = ({ currentSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 정렬 옵션에서 카테고리, 스탯, 순서 파싱
  useEffect(() => {
    if (currentSort === 'default') {
      setSelectedCategory(null);
      setSelectedStat(null);
      setSelectedOrder(null);
      return;
    }

    const [statPart, order] = currentSort.split('-') as [string, OrderType];

    if (statPart === 'totalGrowth') {
      setSelectedCategory('totalGrowth');
      setSelectedStat(null); // totalGrowth는 스탯 선택 불필요
      setSelectedOrder(order);
    } else if (statPart.endsWith('Growth')) {
      setSelectedCategory('growth');
      setSelectedStat(statPart.replace('Growth', '') as StatType);
      setSelectedOrder(order);
    } else {
      setSelectedCategory('base');
      setSelectedStat(statPart as StatType);
      setSelectedOrder(order);
    }
  }, [currentSort]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 현재 선택 레이블 생성
  const getCurrentLabel = () => {
    if (currentSort === 'default' || !selectedCategory || !selectedOrder) return '정렬';

    const categoryLabels = { base: '초기치', growth: '성장률', totalGrowth: '총성장률' };
    const statLabels = { attack: '공격력', defense: '방어력', agility: '순발력', vitality: '내구력' };
    const orderIcon = selectedOrder === 'asc' ? '↑' : '↓';

    if (selectedCategory === 'totalGrowth') {
      return `${orderIcon} ${categoryLabels[selectedCategory]}`;
    }

    if (!selectedStat) return '정렬';

    return `${orderIcon} ${categoryLabels[selectedCategory]} ${statLabels[selectedStat]}`;
  };

  // 선택 적용
  const handleApply = () => {
    // 필수 값이 선택되지 않은 경우 리턴
    if (!selectedCategory || !selectedOrder) return;
    if (selectedCategory !== 'totalGrowth' && !selectedStat) return;

    let sortValue: SortOption;

    if (selectedCategory === 'totalGrowth') {
      sortValue = `totalGrowth-${selectedOrder}` as SortOption;
    } else if (selectedCategory === 'growth') {
      sortValue = `${selectedStat}Growth-${selectedOrder}` as SortOption;
    } else {
      sortValue = `${selectedStat}-${selectedOrder}` as SortOption;
    }

    onSortChange(sortValue);
    setIsOpen(false);
  };

  // 초기화
  const handleReset = () => {
    onSortChange('default');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 정렬 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary border border-border rounded-lg
                   text-text-primary text-sm font-medium hover:bg-bg-tertiary transition-colors
                   focus:outline-none focus:ring-2 focus:ring-accent/50"
      >
        <svg
          className="w-4 h-4 text-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        <span className="whitespace-nowrap">{getCurrentLabel()}</span>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-bg-secondary border border-border rounded-lg shadow-xl z-50 p-4"
        >
          {/* Step 1: 카테고리 선택 */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              1. 카테고리
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedCategory('base')}
                className={`px-3 py-2 text-sm rounded-md transition-all ${
                  selectedCategory === 'base'
                    ? 'bg-accent text-white font-medium shadow-sm'
                    : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                }`}
              >
                초기치
              </button>
              <button
                onClick={() => setSelectedCategory('growth')}
                className={`px-3 py-2 text-sm rounded-md transition-all ${
                  selectedCategory === 'growth'
                    ? 'bg-accent text-white font-medium shadow-sm'
                    : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                }`}
              >
                성장률
              </button>
              <button
                onClick={() => setSelectedCategory('totalGrowth')}
                className={`px-3 py-2 text-sm rounded-md transition-all ${
                  selectedCategory === 'totalGrowth'
                    ? 'bg-accent text-white font-medium shadow-sm'
                    : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                }`}
              >
                총성장률
              </button>
            </div>
          </div>

          {/* Step 2: 스탯 선택 (총성장률이 아닐 때만) */}
          {selectedCategory !== 'totalGrowth' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                2. 능력치
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedStat('attack')}
                  className={`px-3 py-2 text-sm rounded-md transition-all ${
                    selectedStat === 'attack'
                      ? 'bg-accent text-white font-medium shadow-sm'
                      : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                  }`}
                >
                  공격력
                </button>
                <button
                  onClick={() => setSelectedStat('defense')}
                  className={`px-3 py-2 text-sm rounded-md transition-all ${
                    selectedStat === 'defense'
                      ? 'bg-accent text-white font-medium shadow-sm'
                      : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                  }`}
                >
                  방어력
                </button>
                <button
                  onClick={() => setSelectedStat('agility')}
                  className={`px-3 py-2 text-sm rounded-md transition-all ${
                    selectedStat === 'agility'
                      ? 'bg-accent text-white font-medium shadow-sm'
                      : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                  }`}
                >
                  순발력
                </button>
                <button
                  onClick={() => setSelectedStat('vitality')}
                  className={`px-3 py-2 text-sm rounded-md transition-all ${
                    selectedStat === 'vitality'
                      ? 'bg-accent text-white font-medium shadow-sm'
                      : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                  }`}
                >
                  내구력
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 정렬 순서 */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              {selectedCategory === 'totalGrowth' ? '2. 정렬 순서' : '3. 정렬 순서'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedOrder('asc')}
                className={`px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center gap-2 ${
                  selectedOrder === 'asc'
                    ? 'bg-accent text-white font-medium shadow-sm'
                    : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                오름차순
              </button>
              <button
                onClick={() => setSelectedOrder('desc')}
                className={`px-3 py-2 text-sm rounded-md transition-all flex items-center justify-center gap-2 ${
                  selectedOrder === 'desc'
                    ? 'bg-accent text-white font-medium shadow-sm'
                    : 'bg-bg-tertiary text-text-primary hover:bg-bg-tertiary/70'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                내림차순
              </button>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-2 pt-3 border-t border-border">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 text-sm bg-bg-tertiary text-text-secondary rounded-md
                       hover:bg-bg-tertiary/70 transition-colors font-medium"
            >
              초기화
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 text-sm bg-accent text-white rounded-md
                       hover:bg-accent/90 transition-colors font-medium shadow-sm"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
