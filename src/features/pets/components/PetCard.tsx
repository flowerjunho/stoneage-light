import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Pet } from '@/shared/types';
import { isFavorite, toggleFavorite, addFavoriteChangeListener } from '@/shared/utils/favorites';
import PetBoardingModal from '@/features/boarding/components/PetBoardingModal';

interface PetCardProps {
  pet: Pet;
}

const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const [isFav, setIsFav] = useState(() => isFavorite(pet));
  const [isAnimating, setIsAnimating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

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

  // 펫 클릭 핸들러
  const handlePetClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // 모달 닫기 핸들러
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // 공유 버튼 핸들러 - 항상 클립보드 복사
  const handleShareClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/stoneage-light/#/pets?pet=${pet.id}&share=true`;
    
    try {
      // 모든 환경에서 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
      // 폴백: URL을 선택 가능한 input으로 표시
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  }, [pet.id]);

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
  }, [
    pet.elementStats.earth,
    pet.elementStats.water,
    pet.elementStats.fire,
    pet.elementStats.wind,
  ]);

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
  }, [
    pet.elementStats.earth,
    pet.elementStats.water,
    pet.elementStats.fire,
    pet.elementStats.wind,
  ]);

  const gradeClasses = useMemo(() => {
    const baseClasses = 'bg-bg-secondary rounded-lg p-4 h-full iphone16:p-3 flex flex-col';

    // 등급별 클래스 매핑 (성능 최적화)
    const gradeClassMap = {
      일반등급: baseClasses,
      일반페트: baseClasses,
      일반: baseClasses,
      희귀: `${baseClasses} shadow-lg shadow-purple-500/20`,
      영웅: `${baseClasses} shadow-lg shadow-yellow-400/30`,
    } as const;

    return gradeClassMap[pet.grade as keyof typeof gradeClassMap] || baseClasses;
  }, [pet.grade]);

  const gradeBadgeClasses = useMemo(() => {
    const baseClasses = 'text-xs font-semibold px-3 py-1 rounded-xl uppercase tracking-wide';

    // 등급별 배지 클래스 매핑 (성능 최적화)
    const badgeClassMap = {
      일반등급: `${baseClasses} bg-bg-tertiary text-text-secondary`,
      일반페트: `${baseClasses} bg-bg-tertiary text-text-secondary`,
      일반: `${baseClasses} bg-bg-tertiary text-text-secondary`,
      '1등급': `${baseClasses} bg-gradient-to-r from-purple-500 to-purple-400 text-white`,
      '2등급': `${baseClasses} bg-gradient-to-r from-blue-500 to-blue-400 text-white`,
      희귀: `${baseClasses} bg-gradient-to-r from-green-500 to-green-400 text-white`,
      영웅: `${baseClasses} bg-gradient-to-r from-yellow-400 to-yellow-300 text-black`,
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
    <>
      <div 
        style={elementalBorderStyle}
        onClick={handlePetClick}
        className="cursor-pointer transform transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className={`${gradeClasses} border-2 ${borderClass}`}>
        {/* Top Section - Image and Info */}
        <div className="flex gap-4 mb-4 pb-3 border-b border-border">
          {/* Pet Image */}
          <div className="flex-shrink-0">
            {pet.imageLink ? (
              <div className="w-36 h-36 bg-bg-tertiary rounded-lg overflow-hidden border border-border">
                <img
                  src={pet.imageLink}
                  alt={pet.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={e => {
                    // 이미지 로드 실패 시 빈 영역으로 처리
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-36 h-36 bg-bg-tertiary rounded-lg border border-border flex items-center justify-center">
                <span className="text-text-secondary text-xs">이미지 없음</span>
              </div>
            )}
          </div>

          {/* Pet Info */}
          <div className="flex-1 flex flex-col justify-between text-right">
            {/* 상단 그룹: 이름과 속성 */}
            <div>
              {/* Name, Favorite and Share */}
              <div className="flex items-start justify-end gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-text-primary iphone16:text-lg leading-tight text-right break-words">{pet.name}</h3>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <div className="relative">
                    <button
                      onClick={handleShareClick}
                      className="w-6 h-6 p-1 rounded-full border-2 border-blue-500 hover:bg-blue-500/10 text-blue-500 transition-colors duration-200 flex items-center justify-center"
                      title="공유하기"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </button>
                    
                    {/* 토스트 메시지 */}
                    {showToast && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                          링크가 복사되었습니다!
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle();
                    }}
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
              </div>

              {/* Elements - 펫 이름 바로 밑에 위치 */}
              <div className="mt-2">
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {getElementIcon('earth', pet.elementStats.earth)}
                  {getElementIcon('water', pet.elementStats.water)}
                  {getElementIcon('fire', pet.elementStats.fire)}
                  {getElementIcon('wind', pet.elementStats.wind)}
                </div>

                {/* Element Progress Bars */}
                <div className="mt-2 space-y-1">
                  {pet.elementStats.earth > 0 && (
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={`earth-${i}`}
                            className={`h-1.5 w-2 rounded-sm ${
                              i < pet.elementStats.earth ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-green-400 w-4">地</span>
                    </div>
                  )}
                  {pet.elementStats.water > 0 && (
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={`water-${i}`}
                            className={`h-1.5 w-2 rounded-sm ${
                              i < pet.elementStats.water ? 'bg-blue-500' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-blue-400 w-4">水</span>
                    </div>
                  )}
                  {pet.elementStats.fire > 0 && (
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={`fire-${i}`}
                            className={`h-1.5 w-2 rounded-sm ${
                              i < pet.elementStats.fire ? 'bg-red-500' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-red-400 w-4">火</span>
                    </div>
                  )}
                  {pet.elementStats.wind > 0 && (
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={`wind-${i}`}
                            className={`h-1.5 w-2 rounded-sm ${
                              i < pet.elementStats.wind ? 'bg-amber-500' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-amber-400 w-4">風</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 하단: Grade */}
            <div className="flex justify-end mt-3">
              <span className={gradeBadgeClasses}>{pet.grade}</span>
            </div>
          </div>
        </div>

        {/* Basic Stats - 세로 정렬 디자인 */}
        <div className="mb-2">
          <h4 className="text-sm font-medium text-text-secondary mb-1.5">초기치</h4>
          <div className="bg-bg-tertiary rounded-md p-2 border border-border">
            <div className="grid grid-cols-4 gap-1 text-center text-sm">
              <div>
                <div className="text-text-secondary text-xs mb-1">공격력</div>
                <div className="font-bold text-text-primary font-mono">{pet.baseStats.attack}</div>
              </div>
              <div>
                <div className="text-text-secondary text-xs mb-1">방어력</div>
                <div className="font-bold text-text-primary font-mono">{pet.baseStats.defense}</div>
              </div>
              <div>
                <div className="text-text-secondary text-xs mb-1">순발력</div>
                <div className="font-bold text-text-primary font-mono">{pet.baseStats.agility}</div>
              </div>
              <div>
                <div className="text-text-secondary text-xs mb-1">내구력</div>
                <div className="font-bold text-text-primary font-mono">{pet.baseStats.vitality}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Stats - 세로 정렬 디자인 */}
        <div className="mb-2">
          <h4 className="text-sm font-medium text-text-secondary mb-1.5">성장률</h4>
          <div className="bg-bg-primary rounded-md p-2 border border-border space-y-2">
            <div className="grid grid-cols-4 gap-1 text-center text-sm">
              <div>
                <div className="text-text-secondary text-xs mb-1">공격력</div>
                <div className="font-bold text-accent font-mono">{pet.growthStats.attack}</div>
              </div>
              <div>
                <div className="text-text-secondary text-xs mb-1">방어력</div>
                <div className="font-bold text-accent font-mono">{pet.growthStats.defense}</div>
              </div>
              <div>
                <div className="text-text-secondary text-xs mb-1">순발력</div>
                <div className="font-bold text-accent font-mono">{pet.growthStats.agility}</div>
              </div>
              <div>
                <div className="text-text-secondary text-xs mb-1">내구력</div>
                <div className="font-bold text-accent font-mono">{pet.growthStats.vitality}</div>
              </div>
            </div>
            <div className="text-center pt-1 border-t border-border bg-accent/5 rounded">
              <div className="flex justify-between items-center px-2">
                <span className="text-sm text-text-secondary font-medium">총성장률</span>
                <span className="text-base font-bold text-accent font-mono">{pet.totalGrowth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section - 컴팩트 디자인 */}
        <div className="pt-1.5 border-t border-border mt-auto">
          <div className="bg-bg-tertiary rounded-md p-1.5 space-y-0.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">탑승:</span>
              <span
                className={`font-medium text-sm px-1.5 py-0.5 rounded ${
                  pet.rideable === '탑승가능'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {pet.rideable === '탑승가능' ? '가능' : '불가'}
              </span>
            </div>
            <div className="flex justify-between items-start text-sm">
              <span className="text-text-secondary shrink-0">획득처:</span>
              <span className="text-text-primary text-right leading-tight ml-2 text-sm">
                {pet.source}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Pet Boarding Modal */}
      <PetBoardingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        pet={pet}
      />
    </>
  );
};

PetCard.displayName = 'PetCard';

export default React.memo(PetCard);
