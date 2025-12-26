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
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const updateFavoriteState = () => {
      setIsFav(isFavorite(pet));
    };
    const removeListener = addFavoriteChangeListener(updateFavoriteState);
    return removeListener;
  }, [pet]);

  const handleFavoriteToggle = useCallback(() => {
    setIsAnimating(true);
    const newState = toggleFavorite(pet);
    setIsFav(newState);
    setTimeout(() => setIsAnimating(false), 300);
  }, [pet]);

  const handlePetClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleShareClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const shareUrl = `${window.location.origin}/stoneage-light/#/pets?pet=${pet.id}&share=true`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    },
    [pet.id]
  );

  // Element styling with enhanced colors
  const elementConfig = useMemo(
    () => ({
      earth: {
        value: pet.elementStats.earth,
        label: '地',
        color: '#22c55e',
        glow: 'rgba(34, 197, 94, 0.5)',
        bgClass: 'bg-green-500/15',
        textClass: 'text-green-400',
        borderClass: 'border-green-500',
      },
      water: {
        value: pet.elementStats.water,
        label: '水',
        color: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.5)',
        bgClass: 'bg-blue-500/15',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-500',
      },
      fire: {
        value: pet.elementStats.fire,
        label: '火',
        color: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.5)',
        bgClass: 'bg-red-500/15',
        textClass: 'text-red-400',
        borderClass: 'border-red-500',
      },
      wind: {
        value: pet.elementStats.wind,
        label: '風',
        color: '#eab308',
        glow: 'rgba(234, 179, 8, 0.5)',
        bgClass: 'bg-amber-500/15',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-500',
      },
    }),
    [pet.elementStats]
  );

  const activeElements = useMemo(
    () => Object.entries(elementConfig).filter(([, config]) => config.value > 0),
    [elementConfig]
  );

  // Gradient border for multi-element pets
  const gradientBorderStyle = useMemo(() => {
    if (activeElements.length <= 1) return {};

    const total = activeElements.reduce((sum, [, config]) => sum + config.value, 0);
    let currentPercent = 0;

    const gradientStops = activeElements
      .map(([, config]) => {
        const percent = (config.value / total) * 100;
        const start = currentPercent;
        const end = currentPercent + percent;
        currentPercent = end;
        return `${config.color} ${start}%, ${config.color} ${end}%`;
      })
      .join(', ');

    return {
      background: `linear-gradient(135deg, ${gradientStops})`,
      padding: '2px',
      borderRadius: '24px',
    };
  }, [activeElements]);

  // Get primary element color for glow effects
  const primaryElementColor = useMemo(() => {
    if (activeElements.length === 0) return '#fbbf24';
    const [, config] = activeElements.reduce((a, b) => (a[1].value > b[1].value ? a : b));
    return config.color;
  }, [activeElements]);

  const primaryElementGlow = useMemo(() => {
    if (activeElements.length === 0) return 'rgba(251, 191, 36, 0.5)';
    const [, config] = activeElements.reduce((a, b) => (a[1].value > b[1].value ? a : b));
    return config.glow;
  }, [activeElements]);

  // Grade styling with enhanced effects
  const gradeConfig = useMemo(() => {
    const configs: Record<string, { cardClass: string; badgeClass: string; glowColor: string }> = {
      영웅: {
        cardClass: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
        badgeClass:
          'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 text-stone-900 font-black animate-pulse-glow',
        glowColor: 'rgba(251, 191, 36, 0.6)',
      },
      희귀: {
        cardClass: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
        badgeClass: 'bg-gradient-to-r from-purple-500 via-violet-400 to-purple-500 text-white font-bold',
        glowColor: 'rgba(168, 85, 247, 0.5)',
      },
      default: {
        cardClass: '',
        badgeClass: 'bg-bg-tertiary text-text-muted',
        glowColor: 'transparent',
      },
    };
    return configs[pet.grade] || configs.default;
  }, [pet.grade]);

  const singleElementBorder = useMemo(() => {
    if (activeElements.length !== 1) return '';
    const [elementName] = activeElements[0];
    const borderMap: Record<string, string> = {
      earth: 'border-green-500/50',
      water: 'border-blue-500/50',
      fire: 'border-red-500/50',
      wind: 'border-amber-500/50',
    };
    return borderMap[elementName] || 'border-border';
  }, [activeElements]);

  return (
    <>
      <div
        style={activeElements.length > 1 ? gradientBorderStyle : {}}
        onClick={handlePetClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        className="cursor-pointer transform transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 active:scale-[0.98]"
      >
        <div
          className={`
            relative overflow-hidden
            bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-tertiary
            rounded-[22px] p-4 md:p-5 h-full
            border-2 ${activeElements.length === 1 ? singleElementBorder : activeElements.length > 1 ? 'border-transparent' : 'border-border/50'}
            ${gradeConfig.cardClass}
            transition-all duration-500
          `}
          style={{
            boxShadow: isHovered
              ? `0 20px 40px -10px ${primaryElementGlow}, 0 0 60px -20px ${primaryElementGlow}`
              : undefined,
          }}
        >
          {/* Spotlight effect on hover */}
          {isHovered && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${primaryElementGlow} 0%, transparent 50%)`,
                opacity: 0.3,
              }}
            />
          )}

          {/* Shimmer effect on hover */}
          <div
            className={`
              absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
              transform -skew-x-12 transition-transform duration-700
              ${isHovered ? 'translate-x-full' : '-translate-x-full'}
            `}
          />

          {/* Header: Image & Info */}
          <div className="relative flex gap-4 md:gap-5 mb-4">
            {/* Pet Image Container */}
            <div className="flex-shrink-0 relative group/image">
              {/* Animated ring on hover */}
              <div
                className={`
                  absolute -inset-1 rounded-2xl opacity-0 group-hover/image:opacity-100
                  transition-opacity duration-500 blur-sm
                `}
                style={{
                  background: `linear-gradient(135deg, ${primaryElementColor}, transparent, ${primaryElementColor})`,
                }}
              />

              <div
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden
                           bg-gradient-to-br from-bg-tertiary to-bg-primary
                           border border-border/50
                           transition-transform duration-500 group-hover/image:scale-105"
              >
                {pet.imageLink ? (
                  <img
                    src={pet.imageLink}
                    alt={pet.name}
                    className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover/image:scale-110"
                    loading="lazy"
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                    이미지 없음
                  </div>
                )}

                {/* Inner glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${primaryElementGlow} 0%, transparent 60%)`,
                    opacity: 0.2,
                  }}
                />
              </div>

              {/* Grade badge with glow */}
              <div className="absolute -bottom-2 -right-2 z-10">
                <span
                  className={`
                    inline-block px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold
                    uppercase tracking-wider shadow-xl
                    ${gradeConfig.badgeClass}
                  `}
                  style={{
                    boxShadow: `0 4px 20px ${gradeConfig.glowColor}`,
                  }}
                >
                  {pet.grade}
                </span>
              </div>
            </div>

            {/* Pet Info */}
            <div className="flex-1 flex flex-col min-w-0 pt-1">
              {/* Name & Actions */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3
                  className="text-lg md:text-xl font-bold text-text-primary leading-tight break-words"
                  style={{
                    textShadow: isHovered ? `0 0 20px ${primaryElementGlow}` : 'none',
                  }}
                >
                  {pet.name}
                </h3>
                <div className="flex gap-2 flex-shrink-0">
                  {/* Share Button */}
                  <div className="relative">
                    <button
                      onClick={handleShareClick}
                      className="group/btn w-8 h-8 rounded-xl
                               bg-blue-500/10 border border-blue-500/30
                               flex items-center justify-center
                               text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50
                               hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
                               transition-all duration-300 active:scale-90"
                      title="공유하기"
                    >
                      <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </button>
                    {/* Toast */}
                    {showToast && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
                        <div className="px-4 py-2 rounded-xl bg-bg-primary/95 backdrop-blur-lg text-text-primary text-xs font-medium whitespace-nowrap shadow-xl border border-accent/30">
                          ✓ 링크 복사됨!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleFavoriteToggle();
                    }}
                    className={`
                      group/btn w-8 h-8 rounded-xl
                      flex items-center justify-center
                      transition-all duration-300 active:scale-90
                      ${
                        isFav
                          ? 'bg-yellow-400/20 border border-yellow-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                          : 'bg-bg-tertiary/50 border border-border hover:border-yellow-400/30 hover:bg-yellow-400/10'
                      }
                    `}
                    aria-label={isFav ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
                  >
                    <svg
                      className={`w-4 h-4 transition-all duration-300 ${
                        isAnimating ? 'scale-150' : 'group-hover/btn:scale-110'
                      } ${isFav ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-text-muted group-hover/btn:text-yellow-400'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinejoin="round"
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Element Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {activeElements.map(([key, config]) => (
                  <span
                    key={key}
                    className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1
                      rounded-lg text-xs font-bold
                      ${config.bgClass} ${config.textClass}
                      border ${config.borderClass}/40
                      transition-all duration-300
                    `}
                    style={{
                      boxShadow: isHovered ? `0 0 15px ${config.glow}` : 'none',
                    }}
                  >
                    <span className="opacity-80">{config.label}</span>
                    <span className="font-black">{config.value}</span>
                  </span>
                ))}
              </div>

              {/* Element Bars - Visual Progress */}
              <div className="space-y-1.5 mt-auto">
                {activeElements.map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex gap-0.5 flex-1">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className="h-2 flex-1 rounded-sm transition-all duration-300"
                          style={{
                            backgroundColor: i < config.value ? config.color : 'var(--bg-tertiary)',
                            boxShadow: i < config.value && isHovered ? `0 0 8px ${config.glow}` : 'none',
                            transform: i < config.value && isHovered ? 'scaleY(1.2)' : 'scaleY(1)',
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[10px] w-4 font-bold ${config.textClass}`}
                      style={{ textShadow: isHovered ? `0 0 10px ${config.glow}` : 'none' }}
                    >
                      {config.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="relative space-y-4">
            {/* Base Stats */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">초기치</span>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '공격', value: pet.baseStats.attack },
                  { label: '방어', value: pet.baseStats.defense },
                  { label: '순발', value: pet.baseStats.agility },
                  { label: '내구', value: pet.baseStats.vitality },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="relative text-center py-2.5 px-1 bg-bg-tertiary/50 rounded-xl border border-border/30
                               hover:border-border hover:bg-bg-tertiary transition-all duration-300"
                  >
                    <div className="text-[10px] text-text-muted mb-1">{stat.label}</div>
                    <div className="text-sm font-black text-text-primary tabular-nums">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Stats */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">성장률</span>
                <div className="flex-1 h-px bg-gradient-to-r from-accent/30 via-accent/10 to-transparent" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '공격', value: pet.growthStats.attack },
                  { label: '방어', value: pet.growthStats.defense },
                  { label: '순발', value: pet.growthStats.agility },
                  { label: '내구', value: pet.growthStats.vitality },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="text-center py-2.5 px-1 rounded-xl
                               bg-accent/5 border border-accent/20
                               hover:bg-accent/10 hover:border-accent/40
                               transition-all duration-300"
                  >
                    <div className="text-[10px] text-text-muted mb-1">{stat.label}</div>
                    <div
                      className="text-sm font-black text-accent tabular-nums"
                      style={{ textShadow: '0 0 10px var(--accent-glow)' }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Growth - Hero Section */}
              <div
                className="mt-3 flex items-center justify-between px-4 py-3
                           bg-gradient-to-r from-accent/10 via-accent/15 to-accent/10
                           rounded-xl border border-accent/30
                           hover:border-accent/50 transition-all duration-300"
                style={{
                  boxShadow: isHovered ? '0 0 30px var(--accent-soft)' : 'none',
                }}
              >
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">총성장률</span>
                <span
                  className="text-2xl font-black text-accent tabular-nums"
                  style={{ textShadow: '0 0 20px var(--accent-glow)' }}
                >
                  {pet.totalGrowth}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="relative mt-4 pt-4 border-t border-border/30 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted font-medium">탑승</span>
              <span
                className={`
                  px-3 py-1 rounded-lg text-xs font-bold
                  ${
                    pet.rideable === '탑승가능'
                      ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }
                `}
                style={{
                  boxShadow:
                    pet.rideable === '탑승가능'
                      ? '0 0 15px rgba(34, 197, 94, 0.2)'
                      : '0 0 15px rgba(239, 68, 68, 0.2)',
                }}
              >
                {pet.rideable === '탑승가능' ? '✓ 가능' : '✗ 불가'}
              </span>
            </div>
            <div className="flex items-start justify-between text-sm">
              <span className="text-text-muted font-medium flex-shrink-0">획득처</span>
              <span className="text-text-primary text-right ml-3 leading-tight font-medium">{pet.source}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pet Boarding Modal */}
      <PetBoardingModal isOpen={isModalOpen} onClose={handleModalClose} pet={pet} />
    </>
  );
};

PetCard.displayName = 'PetCard';

export default React.memo(PetCard);
