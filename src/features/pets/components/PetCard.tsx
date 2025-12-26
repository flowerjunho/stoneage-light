import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [toastMessage, setToastMessage] = useState('링크가 복사되었습니다');
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const handleShareClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowShareMenu(true);
    },
    []
  );

  const handleLinkShare = useCallback(
    async () => {
      setShowShareMenu(false);
      const shareUrl = `${window.location.origin}/stoneage-light/#/pets?pet=${pet.id}&share=true`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToastMessage('링크가 복사되었습니다');
      } catch {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToastMessage('링크가 복사되었습니다');
      }
    },
    [pet.id, showToastMessage]
  );

  const handleCloseShareMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(false);
  }, []);

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

  // Canvas API를 직접 사용한 고퀄리티 이미지 생성
  const drawPetCard = useCallback(async (ctx: CanvasRenderingContext2D, scale: number = 2) => {
    const w = 400 * scale;
    const h = 580 * scale;
    const p = 24 * scale; // padding
    const elements = Object.entries(elementConfig).filter(([, config]) => config.value > 0);

    // Helper functions
    const s = (v: number) => v * scale;
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number, fill?: string, stroke?: string, lineWidth = 1) => {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth * scale; ctx.stroke(); }
    };

    // Background
    drawRoundedRect(0, 0, w, h, s(24), '#1a1a2e');
    drawRoundedRect(s(2), s(2), w - s(4), h - s(4), s(22), '#1e1e2f', '#3a3a4d', 2);

    // === HEADER SECTION ===
    let y = p;

    // Pet Image Box
    const imgSize = s(130);
    const imgX = p;
    const imgY = y;
    drawRoundedRect(imgX, imgY, imgSize, imgSize, s(18), '#2a2a3d', '#3a3a4d');

    // Load and draw pet image - multiple fallback methods for CORS
    if (pet.imageLink) {
      let imageLoaded = false;

      // 방법 1: CORS 프록시 사용
      const corsProxies = [
        `https://corsproxy.io/?${encodeURIComponent(pet.imageLink)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(pet.imageLink)}`,
      ];

      for (const proxyUrl of corsProxies) {
        if (imageLoaded) break;
        try {
          const response = await fetch(proxyUrl);
          if (!response.ok) continue;
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = base64;
          });

          const padding = s(14);
          const drawSize = imgSize - padding * 2;
          const aspectRatio = img.width / img.height;
          let drawW = drawSize, drawH = drawSize;
          if (aspectRatio > 1) { drawH = drawSize / aspectRatio; }
          else { drawW = drawSize * aspectRatio; }
          const drawX = imgX + padding + (drawSize - drawW) / 2;
          const drawY = imgY + padding + (drawSize - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          imageLoaded = true;
        } catch {
          // 다음 프록시 시도
        }
      }

      // 방법 2: 직접 이미지 로드 (same-origin이면 성공)
      if (!imageLoaded) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = pet.imageLink!;
          });

          const padding = s(14);
          const drawSize = imgSize - padding * 2;
          const aspectRatio = img.width / img.height;
          let drawW = drawSize, drawH = drawSize;
          if (aspectRatio > 1) { drawH = drawSize / aspectRatio; }
          else { drawW = drawSize * aspectRatio; }
          const drawX = imgX + padding + (drawSize - drawW) / 2;
          const drawY = imgY + padding + (drawSize - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          imageLoaded = true;
        } catch {
          // 실패
        }
      }

      // 모두 실패시 플레이스홀더
      if (!imageLoaded) {
        ctx.fillStyle = '#6b6b7b';
        ctx.font = `${s(12)}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('이미지 없음', imgX + imgSize / 2, imgY + imgSize / 2 + s(4));
      }
    }

    // Grade badge
    const gradeBg = pet.grade === '영웅' ? '#f59e0b' : pet.grade === '희귀' ? '#a855f7' : '#4a4a5d';
    const gradeColor = pet.grade === '영웅' ? '#1a1a2e' : '#fff';
    ctx.font = `bold ${s(11)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    const gradeWidth = ctx.measureText(pet.grade).width + s(20);
    const gradeX = imgX + imgSize - gradeWidth + s(8);
    const gradeY = imgY + imgSize - s(8);
    drawRoundedRect(gradeX, gradeY, gradeWidth, s(26), s(10), gradeBg);
    ctx.fillStyle = gradeColor;
    ctx.textAlign = 'center';
    ctx.fillText(pet.grade, gradeX + gradeWidth / 2, gradeY + s(17));

    // Right side info
    const infoX = imgX + imgSize + s(16);
    const infoWidth = w - infoX - p;

    // Pet name
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${s(22)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(pet.name, infoX, y + s(28));

    // Element badges
    let badgeY = y + s(46);
    let badgeX = infoX;
    elements.forEach(([, config]) => {
      const text = `${config.label} ${config.value}`;
      ctx.font = `bold ${s(12)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      const badgeW = ctx.measureText(text).width + s(16);
      if (badgeX + badgeW > w - p) { badgeX = infoX; badgeY += s(28); }
      drawRoundedRect(badgeX, badgeY, badgeW, s(24), s(8), config.color + '22', config.color + '66');
      ctx.fillStyle = config.color;
      ctx.fillText(text, badgeX + s(8), badgeY + s(16));
      badgeX += badgeW + s(8);
    });

    // Element bars
    let barY = badgeY + s(36);
    elements.forEach(([, config]) => {
      const barWidth = (infoWidth - s(30)) / 10;
      for (let i = 0; i < 10; i++) {
        const barX = infoX + i * (barWidth + s(2));
        drawRoundedRect(barX, barY, barWidth, s(10), s(3), i < config.value ? config.color : '#2a2a3d');
      }
      ctx.fillStyle = config.color;
      ctx.font = `bold ${s(11)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(config.label, infoX + infoWidth, barY + s(9));
      barY += s(18);
    });

    // === BASE STATS SECTION ===
    y = imgY + imgSize + s(24);

    // Section header
    ctx.fillStyle = '#6b6b7b';
    ctx.font = `bold ${s(10)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('초기치', p, y);
    ctx.strokeStyle = '#3a3a4d';
    ctx.lineWidth = s(1);
    ctx.beginPath();
    ctx.moveTo(p + s(40), y - s(4));
    ctx.lineTo(w - p, y - s(4));
    ctx.stroke();

    // Stats grid
    y += s(12);
    const statW = (w - p * 2 - s(24)) / 4;
    const baseStats = [
      { label: '공격', value: pet.baseStats.attack },
      { label: '방어', value: pet.baseStats.defense },
      { label: '순발', value: pet.baseStats.agility },
      { label: '내구', value: pet.baseStats.vitality },
    ];
    baseStats.forEach((stat, i) => {
      const x = p + i * (statW + s(8));
      drawRoundedRect(x, y, statW, s(54), s(12), '#2a2a3d', '#3a3a4d');
      ctx.fillStyle = '#6b6b7b';
      ctx.font = `${s(10)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(stat.label, x + statW / 2, y + s(18));
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${s(16)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(String(stat.value), x + statW / 2, y + s(42));
    });

    // === GROWTH STATS SECTION ===
    y += s(70);

    // Section header
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold ${s(10)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('성장률', p, y);
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.lineWidth = s(1);
    ctx.beginPath();
    ctx.moveTo(p + s(40), y - s(4));
    ctx.lineTo(w - p, y - s(4));
    ctx.stroke();

    // Growth stats grid
    y += s(12);
    const growthStats = [
      { label: '공격', value: pet.growthStats.attack },
      { label: '방어', value: pet.growthStats.defense },
      { label: '순발', value: pet.growthStats.agility },
      { label: '내구', value: pet.growthStats.vitality },
    ];
    growthStats.forEach((stat, i) => {
      const x = p + i * (statW + s(8));
      drawRoundedRect(x, y, statW, s(54), s(12), 'rgba(245,158,11,0.08)', 'rgba(245,158,11,0.3)');
      ctx.fillStyle = '#6b6b7b';
      ctx.font = `${s(10)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(stat.label, x + statW / 2, y + s(18));
      ctx.fillStyle = '#f59e0b';
      ctx.font = `bold ${s(16)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(String(stat.value), x + statW / 2, y + s(42));
    });

    // Total growth box
    y += s(66);
    drawRoundedRect(p, y, w - p * 2, s(52), s(14), 'rgba(245,158,11,0.12)', 'rgba(245,158,11,0.3)');
    ctx.fillStyle = '#a0a0b0';
    ctx.font = `bold ${s(12)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('총성장률', p + s(16), y + s(32));
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold ${s(28)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(String(pet.totalGrowth), w - p - s(16), y + s(36));

    // === FOOTER SECTION ===
    y += s(68);
    ctx.strokeStyle = '#3a3a4d';
    ctx.lineWidth = s(1);
    ctx.beginPath();
    ctx.moveTo(p, y);
    ctx.lineTo(w - p, y);
    ctx.stroke();

    y += s(16);

    // Rideable
    ctx.fillStyle = '#6b6b7b';
    ctx.font = `${s(14)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('탑승', p, y + s(14));

    const rideText = pet.rideable === '탑승가능' ? '✓ 가능' : '✗ 불가';
    const rideBg = pet.rideable === '탑승가능' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
    const rideBorder = pet.rideable === '탑승가능' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)';
    const rideColor = pet.rideable === '탑승가능' ? '#4ade80' : '#f87171';
    ctx.font = `bold ${s(12)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    const rideW = ctx.measureText(rideText).width + s(20);
    const rideX = w - p - rideW;
    drawRoundedRect(rideX, y, rideW, s(28), s(8), rideBg, rideBorder);
    ctx.fillStyle = rideColor;
    ctx.textAlign = 'center';
    ctx.fillText(rideText, rideX + rideW / 2, y + s(18));

    // Source
    y += s(38);
    ctx.fillStyle = '#6b6b7b';
    ctx.font = `${s(14)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('획득처', p, y + s(14));
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    // Handle long source text
    const maxSourceWidth = w - p * 2 - s(80);
    let sourceText = pet.source;
    while (ctx.measureText(sourceText).width > maxSourceWidth && sourceText.length > 3) {
      sourceText = sourceText.slice(0, -4) + '...';
    }
    ctx.fillText(sourceText, w - p, y + s(14));

    // Watermark
    y = h - s(24);
    ctx.fillStyle = '#4a4a5d';
    ctx.font = `${s(10)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('환수강림 라이트 - stoneage-light', w / 2, y);
  }, [pet, elementConfig]);

  const handleImageShare = useCallback(async () => {
    setShowShareMenu(false);
    setIsCapturing(true);

    try {
      const scale = 2; // 2x for high quality
      const canvas = document.createElement('canvas');
      canvas.width = 400 * scale;
      canvas.height = 580 * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      await drawPetCard(ctx, scale);

      // Canvas를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/png',
          1.0
        );
      });

      // iOS Safari 체크
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS || !navigator.clipboard?.write) {
        // iOS나 클립보드 API 미지원: 이미지 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pet.name}_펫정보.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToastMessage('이미지가 다운로드되었습니다');
      } else {
        // 클립보드에 이미지 복사
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToastMessage('이미지가 클립보드에 복사되었습니다');
      }
    } catch (error) {
      console.error('Image capture failed:', error);
      showToastMessage('이미지 캡처에 실패했습니다');
    } finally {
      setIsCapturing(false);
    }
  }, [pet.name, showToastMessage, drawPetCard]);

  return (
    <>
      <div
        ref={cardRef}
        data-capture="true"
        style={{
          ...(activeElements.length > 1 ? gradientBorderStyle : {}),
          ...(isCapturing ? { backgroundColor: '#1e1e2f' } : {}),
        }}
        onClick={handlePetClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        className={`cursor-pointer transform transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 active:scale-[0.98] ${isCapturing ? '!scale-100 !translate-y-0' : ''}`}
      >
        <div
          className={`
            relative overflow-hidden
            rounded-[22px] p-4 md:p-5 h-full
            border-2 ${activeElements.length === 1 ? singleElementBorder : activeElements.length > 1 ? 'border-transparent' : 'border-border/50'}
            ${gradeConfig.cardClass}
            transition-all duration-500
          `}
          style={{
            backgroundColor: isCapturing ? '#1e1e2f' : undefined,
            backgroundImage: isCapturing ? 'none' : 'linear-gradient(to bottom right, var(--bg-secondary), var(--bg-secondary), var(--bg-tertiary))',
            boxShadow: isHovered && !isCapturing
              ? `0 20px 40px -10px ${primaryElementGlow}, 0 0 60px -20px ${primaryElementGlow}`
              : undefined,
          }}
        >
          {/* Spotlight effect on hover */}
          {isHovered && !isCapturing && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${primaryElementGlow} 0%, transparent 50%)`,
                opacity: 0.3,
              }}
            />
          )}

          {/* Shimmer effect on hover */}
          {!isCapturing && (
            <div
              className={`
                absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                transform -skew-x-12 transition-transform duration-700
                ${isHovered ? 'translate-x-full' : '-translate-x-full'}
              `}
            />
          )}

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

      {/* Share Menu Modal - Portal to body */}
      {showShareMenu &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleCloseShareMenu}
          >
            <div
              className="bg-bg-secondary rounded-3xl p-6 mx-4 max-w-sm w-full border border-border shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-text-primary mb-1">공유하기</h3>
                <p className="text-sm text-text-muted">{pet.name} 정보를 공유하세요</p>
              </div>

              <div className="space-y-3">
                {/* 링크 공유 */}
                <button
                  onClick={handleLinkShare}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30
                           hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-text-primary group-hover:text-blue-400 transition-colors">링크 공유</p>
                    <p className="text-xs text-text-muted">URL을 클립보드에 복사합니다</p>
                  </div>
                  <svg className="w-5 h-5 text-text-muted group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* 이미지 공유 */}
                <button
                  onClick={handleImageShare}
                  disabled={isCapturing}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30
                           hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    {isCapturing ? (
                      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-text-primary group-hover:text-purple-400 transition-colors">
                      {isCapturing ? '캡처 중...' : '이미지 공유'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {/iPad|iPhone|iPod/.test(navigator.userAgent)
                        ? '펫 카드를 이미지로 다운로드합니다'
                        : '펫 카드를 이미지로 클립보드에 복사합니다'}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-text-muted group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={handleCloseShareMenu}
                className="w-full mt-4 py-3 rounded-xl bg-bg-tertiary text-text-secondary font-medium
                         hover:bg-bg-primary hover:text-text-primary transition-all duration-300"
              >
                닫기
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Toast - Portal to body */}
      {showToast &&
        createPortal(
          <div className="fixed bottom-24 inset-x-0 z-[300] flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-500 text-white text-sm font-semibold whitespace-nowrap shadow-2xl animate-scale-in pointer-events-auto">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {toastMessage}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

PetCard.displayName = 'PetCard';

export default React.memo(PetCard);
