import React, { useMemo, useEffect } from 'react';
import type { Pet } from '../types';

interface PetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
  ridingImageUrl?: string;
}

const PetDetailModal: React.FC<PetDetailModalProps> = ({ isOpen, onClose, pet, ridingImageUrl }) => {

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  // 속성별 아이콘과 색상 설정
  const getElementIcon = (element: string, value: number) => {
    if (value === 0) return null;

    const icons = {
      earth: '地',
      water: '水',
      fire: '火',
      wind: '風',
    };

    const elementClasses = {
      earth: 'bg-green-500/10 border-green-500/30 text-green-400',
      water: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      fire: 'bg-red-500/10 border-red-500/30 text-red-400',
      wind: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    };

    return (
      <span
        className={`text-base px-2 py-1 rounded border ${elementClasses[element as keyof typeof elementClasses]}`}
      >
        {icons[element as keyof typeof icons]} {value}
      </span>
    );
  };

  // 등급별 배지 클래스
  const gradeBadgeClasses = useMemo(() => {
    if (!pet) return '';
    
    const baseClasses = 'text-xs font-semibold px-3 py-1 rounded-xl uppercase tracking-wide';

    const badgeClassMap = {
      일반등급: `${baseClasses} bg-bg-tertiary text-text-secondary`,
      일반페트: `${baseClasses} bg-bg-tertiary text-text-secondary`,
      일반: `${baseClasses} bg-bg-tertiary text-text-secondary`,
      희귀: `${baseClasses} bg-gradient-to-r from-purple-500 to-purple-400 text-white`,
      영웅: `${baseClasses} bg-gradient-to-r from-yellow-400 to-yellow-300 text-black`,
    } as const;

    return badgeClassMap[pet.grade as keyof typeof badgeClassMap] || badgeClassMap['일반등급'];
  }, [pet]);

  // 속성 비율에 따른 그라데이션 보더 생성
  const elementalBorderStyle = useMemo((): React.CSSProperties => {
    if (!pet) return {};
    
    const elements = [
      { name: 'earth', value: pet.elementStats.earth, color: '34, 197, 94' },
      { name: 'water', value: pet.elementStats.water, color: '59, 130, 246' },
      { name: 'fire', value: pet.elementStats.fire, color: '239, 68, 68' },
      { name: 'wind', value: pet.elementStats.wind, color: '245, 158, 11' },
    ];

    const activeElements = elements.filter(el => el.value > 0);

    if (activeElements.length <= 1) {
      return {};
    }

    const total = activeElements.reduce((sum, el) => sum + el.value, 0);

    const cssVars: Record<string, string> = {};
    let currentPercent = 0;

    activeElements.forEach((element, index) => {
      const percent = (element.value / total) * 100;
      const start = currentPercent;
      const end = currentPercent + percent;
      currentPercent = end;

      cssVars[`--color-${index}`] = `rgb(${element.color})`;
      cssVars[`--start-${index}`] = `${start}%`;
      cssVars[`--end-${index}`] = `${end}%`;
    });

    const gradientStops = activeElements
      .map(
        (_, index) =>
          `var(--color-${index}) var(--start-${index}), var(--color-${index}) var(--end-${index})`
      )
      .join(', ');

    return {
      ...cssVars,
      background: `linear-gradient(90deg, ${gradientStops})`,
      padding: '2px',
      borderRadius: '0.75rem',
    };
  }, [pet]);

  const getElementalBorder = useMemo(() => {
    if (!pet) return 'border-border-primary';
    
    const elements = [
      { name: 'earth', value: pet.elementStats.earth },
      { name: 'water', value: pet.elementStats.water },
      { name: 'fire', value: pet.elementStats.fire },
      { name: 'wind', value: pet.elementStats.wind },
    ];

    const activeElements = elements.filter(el => el.value > 0);

    if (activeElements.length === 0) {
      return 'border-border-primary';
    }

    if (activeElements.length === 1) {
      const element = activeElements[0];
      switch (element.name) {
        case 'earth':
          return 'border-green-500';
        case 'water':
          return 'border-blue-500';
        case 'fire':
          return 'border-red-500';
        case 'wind':
          return 'border-amber-500';
        default:
          return 'border-border-primary';
      }
    }

    return 'border-transparent';
  }, [pet]);

  if (!isOpen || !pet) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-bg-primary rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden border-2 border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-border-primary">
          <h2 className="text-lg font-bold text-text-primary">
            페트 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-md transition-colors"
            aria-label="모달 닫기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-secondary hover:text-text-primary"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
          <div style={elementalBorderStyle}>
            <div className={`border-2 rounded-lg bg-bg-secondary ${getElementalBorder}`}>
              <div className="p-4">
                
                {/* 페트 이미지와 기본 정보 */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex-shrink-0 ${ridingImageUrl && ridingImageUrl.trim() !== '' ? 'space-y-2' : ''}`}>
                    {/* 기본 이미지는 항상 표시 */}
                    {pet.imageLink && (
                      <div>
                        <div className="text-xs text-text-secondary mb-1">기본</div>
                        <img
                          src={pet.imageLink}
                          alt={pet.name}
                          className="w-16 h-16 object-contain rounded bg-bg-tertiary p-1"
                          loading="lazy"
                          onError={(e) => {
                            const parentDiv = e.currentTarget.closest('div');
                            if (parentDiv) {
                              parentDiv.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    )}
                    {/* 탑승 이미지는 있을 때만 표시 */}
                    {ridingImageUrl && ridingImageUrl.trim() !== '' && (
                      <div>
                        <div className="text-xs text-text-secondary mb-1">탑승</div>
                        <img
                          src={ridingImageUrl}
                          alt={`${pet.name} 탑승`}
                          className="w-16 h-16 object-contain rounded bg-bg-tertiary p-1"
                          loading="lazy"
                          onError={(e) => {
                            const parentDiv = e.currentTarget.closest('div');
                            if (parentDiv) {
                              parentDiv.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-text-primary">
                        {pet.name}
                      </h3>
                      <span className={gradeBadgeClasses}>
                        {pet.grade}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-text-secondary text-base">획득:</span>
                        <span className="ml-1 text-text-primary text-base">{pet.source}</span>
                      </div>
                      
                      <div>
                        <span className="text-text-secondary text-base">탑승:</span>
                        <span className={`ml-1 font-medium text-base ${pet.rideable === '탑승가능' ? 'text-green-400' : 'text-red-400'}`}>
                          {pet.rideable}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 속성 정보 */}
                <div className="mb-4">
                  <h4 className="font-semibold text-text-primary mb-2 border-b border-border-primary pb-1">속성</h4>
                  <div className="flex flex-wrap gap-2">
                    {getElementIcon('earth', pet.elementStats.earth)}
                    {getElementIcon('water', pet.elementStats.water)}
                    {getElementIcon('fire', pet.elementStats.fire)}
                    {getElementIcon('wind', pet.elementStats.wind)}
                  </div>
                </div>

                {/* 기본 스탯 정보 */}
                <div className="mb-4">
                  <h4 className="font-semibold text-text-primary mb-2 border-b border-border-primary pb-1">기본 스탯</h4>
                  <div className="grid grid-cols-2 gap-3 text-base">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">공격력:</span>
                        <span className="font-bold text-text-primary">{pet.baseStats.attack}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">방어력:</span>
                        <span className="font-bold text-text-primary">{pet.baseStats.defense}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">순발력:</span>
                        <span className="font-bold text-text-primary">{pet.baseStats.agility}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">내구력:</span>
                        <span className="font-bold text-text-primary">{pet.baseStats.vitality}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 성장률 정보 */}
                <div className="mb-4">
                  <h4 className="font-semibold text-text-primary mb-2 border-b border-border-primary pb-1">성장률</h4>
                  <div className="grid grid-cols-2 gap-3 text-base">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">공격력:</span>
                        <span className="font-bold text-accent">{pet.growthStats.attack}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">방어력:</span>
                        <span className="font-bold text-accent">{pet.growthStats.defense}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">순발력:</span>
                        <span className="font-bold text-accent">{pet.growthStats.agility}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">내구력:</span>
                        <span className="font-bold text-accent">{pet.growthStats.vitality}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 총 성장률 - 가장 중요한 정보 */}
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
                  <div className="text-text-secondary text-base mb-1">총 성장률</div>
                  <div className="text-2xl font-bold text-accent">{pet.totalGrowth}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetailModal;