import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Pet } from '../types';
import { isFavorite, toggleFavorite, addFavoriteChangeListener } from '../utils/favorites';

interface PetCardProps {
  pet: Pet;
}

const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const [isFav, setIsFav] = useState(() => isFavorite(pet));
  const [isAnimating, setIsAnimating] = useState(false);

  // 즐겨찾기 상태 변화 감지
  useEffect(() => {
    const updateFavoriteState = () => {
      setIsFav(isFavorite(pet));
    };

    // 즐겨찾기 변경 이벤트 리스너 등록
    const removeListener = addFavoriteChangeListener(updateFavoriteState);

    // 컴포넌트 언마운트 시 리스너 제거
    return removeListener;
  }, [pet]);

  const handleFavoriteToggle = useCallback(() => {
    setIsAnimating(true);
    const newState = toggleFavorite(pet);
    setIsFav(newState);

    // 애니메이션 완료 후 상태 리셋
    setTimeout(() => setIsAnimating(false), 300);
  }, [pet]);

  // 속성 비율에 따른 그라데이션 보더 생성 - 메모이제이션
  const getElementalBorder = useMemo(() => {
    const elements = [
      { name: 'earth', value: pet.elementStats.earth, color: 'rgb(34, 197, 94)' }, // green-500
      { name: 'water', value: pet.elementStats.water, color: 'rgb(59, 130, 246)' }, // blue-500
      { name: 'fire', value: pet.elementStats.fire, color: 'rgb(239, 68, 68)' }, // red-500
      { name: 'wind', value: pet.elementStats.wind, color: 'rgb(245, 158, 11)' }, // amber-500
    ];

    // 0이 아닌 속성들만 필터링
    const activeElements = elements.filter(el => el.value > 0);

    if (activeElements.length === 0) {
      return 'border-border';
    }

    // 단일 속성인 경우
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
          return 'border-border';
      }
    }

    // 여러 속성인 경우 그라데이션 생성

    return `border-transparent`;
  }, [pet.elementStats.earth, pet.elementStats.water, pet.elementStats.fire, pet.elementStats.wind]);

  // CSS 변수를 사용한 최적화된 스타일 계산
  const elementalStyle = useMemo((): React.CSSProperties => {
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

    // CSS 변수로 색상 값 설정
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

    // 동적 그라데이션 생성
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
  }, [pet.elementStats.earth, pet.elementStats.water, pet.elementStats.fire, pet.elementStats.wind]);

  const gradeClasses = useMemo(() => {
    const baseClasses = 'bg-bg-secondary rounded-lg p-4 h-full iphone16:p-3 flex flex-col';

    // 등급별 클래스 매핑 (성능 최적화)
    const gradeClassMap = {
      '일반등급': baseClasses,
      '일반페트': baseClasses,
      '일반': baseClasses,
      '희귀': `${baseClasses} shadow-lg shadow-purple-500/20`,
      '영웅': `${baseClasses} shadow-lg shadow-yellow-400/30`,
    } as const;

    return gradeClassMap[pet.grade as keyof typeof gradeClassMap] || baseClasses;
  }, [pet.grade]);

  const gradeBadgeClasses = useMemo(() => {
    const baseClasses = 'text-xs font-semibold px-3 py-1 rounded-xl uppercase tracking-wide';

    // 등급별 배지 클래스 매핑 (성능 최적화)
    const badgeClassMap = {
      '일반등급': `${baseClasses} bg-bg-tertiary text-text-secondary`,
      '일반페트': `${baseClasses} bg-bg-tertiary text-text-secondary`,
      '일반': `${baseClasses} bg-bg-tertiary text-text-secondary`,
      '희귀': `${baseClasses} bg-gradient-to-r from-purple-500 to-purple-400 text-white`,
      '영웅': `${baseClasses} bg-gradient-to-r from-yellow-400 to-yellow-300 text-black`,
    } as const;

    return badgeClassMap[pet.grade as keyof typeof badgeClassMap] || badgeClassMap['일반등급'];
  }, [pet.grade]);

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
        className={`text-sm px-2 py-1 rounded border ${elementClasses[element as keyof typeof elementClasses]}`}
      >
        {icons[element as keyof typeof icons]} {value}
      </span>
    );
  };

  const elementalBorderStyle = elementalStyle;
  const borderClass = getElementalBorder;

  return (
    <div style={elementalBorderStyle}>
      <div className={`${gradeClasses} border-2 ${borderClass}`}>
        {/* Top Section - Image and Info */}
        <div className="flex gap-3 mb-4 pb-3 border-b border-border">
          {/* Pet Image */}
          <div className="flex-shrink-0">
            {pet.imageLink ? (
              <div className="w-40 h-40 bg-bg-tertiary rounded-lg overflow-hidden border border-border">
                <img
                  src={pet.imageLink}
                  alt={pet.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    // 이미지 로드 실패 시 빈 영역으로 처리
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-40 h-40 bg-bg-tertiary rounded-lg border border-border flex items-center justify-center">
                <span className="text-text-secondary text-xs">이미지 없음</span>
              </div>
            )}
          </div>

          {/* Pet Info */}
          <div className="flex-1 flex flex-col justify-between text-right">
            {/* 상단 그룹: 이름과 속성 */}
            <div>
              {/* Name and Favorite */}
              <div className="flex items-start justify-end gap-2">
                <h3 className="text-xl font-bold text-text-primary iphone16:text-lg leading-tight text-right">{pet.name}</h3>
                <button
                  onClick={handleFavoriteToggle}
                  className="group p-0.5 rounded-md hover:bg-bg-tertiary transition-all duration-200 active:scale-95 flex-shrink-0"
                  aria-label={isFav ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className={`transition-all duration-300 transform hover:scale-110 ${
                      isAnimating ? 'rotate-180' : ''
                    } ${
                      isFav
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-none text-text-secondary group-hover:text-yellow-400 group-hover:rotate-12'
                    }`}
                  >
                    <path
                      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Elements - 펫 이름 바로 밑에 위치 */}
              <div className="flex gap-1.5 flex-wrap mt-1 justify-end">
                {getElementIcon('earth', pet.elementStats.earth)}
                {getElementIcon('water', pet.elementStats.water)}
                {getElementIcon('fire', pet.elementStats.fire)}
                {getElementIcon('wind', pet.elementStats.wind)}
              </div>
            </div>

            {/* Grade - 맨 밑에 위치 */}
            <div className="flex justify-end">
              <span className={gradeBadgeClasses}>{pet.grade}</span>
            </div>
          </div>
        </div>

        {/* Basic Stats - 두줄 컴팩트 디자인 */}
        <div className="mb-2">
          <h4 className="text-xs font-medium text-text-secondary mb-1.5">초기치</h4>
          <div className="bg-bg-tertiary rounded-md p-2 border border-border">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">공격력</span>
                <span className="font-bold text-text-primary font-mono">{pet.baseStats.attack}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">방어력</span>
                <span className="font-bold text-text-primary font-mono">{pet.baseStats.defense}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">순발력</span>
                <span className="font-bold text-text-primary font-mono">{pet.baseStats.agility}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">내구력</span>
                <span className="font-bold text-text-primary font-mono">{pet.baseStats.vitality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Section - 두줄 컴팩트 디자인 */}
        <div className="mb-2">
          <h4 className="text-xs font-medium text-text-secondary mb-1.5">성장률</h4>
          <div className="bg-bg-primary rounded-md p-2 border border-border space-y-1.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">공격력</span>
                <span className="font-semibold text-text-primary font-mono">
                  {pet.growthStats.attack}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">방어력</span>
                <span className="font-semibold text-text-primary font-mono">
                  {pet.growthStats.defense}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">순발력</span>
                <span className="font-semibold text-text-primary font-mono">
                  {pet.growthStats.agility}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">내구력</span>
                <span className="font-semibold text-text-primary font-mono">
                  {pet.growthStats.vitality}
                </span>
              </div>
            </div>
            <div className="text-center pt-1 border-t border-border bg-accent/5 rounded">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs text-text-secondary font-medium">총성장률</span>
                <span className="text-sm font-bold text-accent font-mono">{pet.totalGrowth}</span>
              </div>
            </div>
          </div>
        </div>


        {/* Info Section - 컴팩트 디자인 */}
        <div className="pt-1.5 border-t border-border mt-auto">
          <div className="bg-bg-tertiary rounded-md p-1.5 space-y-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">탑승:</span>
              <span
                className={`font-medium text-xs px-1.5 py-0.5 rounded ${
                  pet.rideable === '탑승가능' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {pet.rideable === '탑승가능' ? '가능' : '불가'}
              </span>
            </div>
            <div className="flex justify-between items-start text-xs">
              <span className="text-text-secondary shrink-0">획득처:</span>
              <span className="text-text-primary text-right leading-tight ml-2 text-xs">
                {pet.source}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PetCard.displayName = 'PetCard';

export default React.memo(PetCard);
