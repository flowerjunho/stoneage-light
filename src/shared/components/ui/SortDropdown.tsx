import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
      setSelectedStat(null);
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

  const handleApply = () => {
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

  const handleReset = () => {
    onSortChange('default');
    setIsOpen(false);
  };

  const OptionButton = ({
    isSelected,
    onClick,
    children,
    className,
  }: {
    isSelected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <Button
      variant={isSelected ? 'default' : 'secondary'}
      size="sm"
      onClick={onClick}
      className={cn(
        "transition-all",
        isSelected && "shadow-sm",
        className
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5"
      >
        <ArrowUpDown className="w-4 h-4 text-text-secondary" />
        <span className="whitespace-nowrap">{getCurrentLabel()}</span>
      </Button>

      {isOpen && (
        <Card
          variant="elevated"
          className="absolute right-0 mt-2 w-72 z-50 p-4"
        >
          {/* Step 1: Category */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              1. 카테고리
            </label>
            <div className="grid grid-cols-3 gap-2">
              <OptionButton
                isSelected={selectedCategory === 'base'}
                onClick={() => setSelectedCategory('base')}
              >
                초기치
              </OptionButton>
              <OptionButton
                isSelected={selectedCategory === 'growth'}
                onClick={() => setSelectedCategory('growth')}
              >
                성장률
              </OptionButton>
              <OptionButton
                isSelected={selectedCategory === 'totalGrowth'}
                onClick={() => setSelectedCategory('totalGrowth')}
              >
                총성장률
              </OptionButton>
            </div>
          </div>

          {/* Step 2: Stats (not for totalGrowth) */}
          {selectedCategory !== 'totalGrowth' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                2. 능력치
              </label>
              <div className="grid grid-cols-2 gap-2">
                <OptionButton
                  isSelected={selectedStat === 'attack'}
                  onClick={() => setSelectedStat('attack')}
                >
                  공격력
                </OptionButton>
                <OptionButton
                  isSelected={selectedStat === 'defense'}
                  onClick={() => setSelectedStat('defense')}
                >
                  방어력
                </OptionButton>
                <OptionButton
                  isSelected={selectedStat === 'agility'}
                  onClick={() => setSelectedStat('agility')}
                >
                  순발력
                </OptionButton>
                <OptionButton
                  isSelected={selectedStat === 'vitality'}
                  onClick={() => setSelectedStat('vitality')}
                >
                  내구력
                </OptionButton>
              </div>
            </div>
          )}

          {/* Step 3: Sort Order */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              {selectedCategory === 'totalGrowth' ? '2. 정렬 순서' : '3. 정렬 순서'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <OptionButton
                isSelected={selectedOrder === 'asc'}
                onClick={() => setSelectedOrder('asc')}
                className="gap-2"
              >
                <ChevronUp className="w-4 h-4" />
                오름차순
              </OptionButton>
              <OptionButton
                isSelected={selectedOrder === 'desc'}
                onClick={() => setSelectedOrder('desc')}
                className="gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                내림차순
              </OptionButton>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Button Group */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="flex-1 gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              초기화
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1"
            >
              적용
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SortDropdown;
