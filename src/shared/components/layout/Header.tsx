import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/shared/components/layout/ThemeToggle';

const Header: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTimeoutId, setTooltipTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 마우스 추적 (히어로 섹션 효과)
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleInfoClick = () => {
    if (tooltipTimeoutId) {
      clearTimeout(tooltipTimeoutId);
    }
    setShowTooltip(true);
    const timeoutId = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);
    setTooltipTimeoutId(timeoutId);
  };

  useEffect(() => {
    return () => {
      if (tooltipTimeoutId) {
        clearTimeout(tooltipTimeoutId);
      }
    };
  }, [tooltipTimeoutId]);

  return (
    <>
      {/* Floating Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'py-2' : 'py-3'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div
            className={`
              relative overflow-hidden rounded-2xl transition-all duration-500
              ${
                isScrolled
                  ? 'bg-bg-primary/80 backdrop-blur-xl shadow-2xl border border-border'
                  : 'bg-transparent'
              }
            `}
          >
            {/* Animated gradient border on scroll */}
            {isScrolled && (
              <div
                className="absolute inset-0 rounded-2xl opacity-50"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, var(--accent-glow), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s ease infinite',
                }}
              />
            )}

            <div className="relative flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
              {/* Logo */}
              <Link
                to="/"
                className="group flex items-center gap-3 transition-transform duration-300 hover:scale-105"
              >
                {/* Animated Logo Mark */}
                <div className="relative">
                  {/* Glow ring */}
                  <div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent via-amber-400 to-accent
                                opacity-0 group-hover:opacity-70 blur-lg transition-opacity duration-500
                                animate-pulse-glow"
                  />
                  <div
                    className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl
                                bg-gradient-to-br from-accent via-amber-500 to-accent-hover
                                flex items-center justify-center
                                shadow-lg group-hover:shadow-[0_0_30px_var(--accent-glow)]
                                transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  >
                    {/* Shine effect */}
                    <div
                      className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/30 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <svg
                      viewBox="0 0 24 24"
                      className="relative w-6 h-6 md:w-7 md:h-7 text-bg-primary"
                      fill="currentColor"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" opacity="0.7" />
                      <path d="M2 12l10 5 10-5" opacity="0.5" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <div className="flex flex-col">
                  <span
                    className="font-display text-base md:text-xl font-black tracking-widest
                               bg-gradient-to-r from-accent via-amber-400 to-accent bg-clip-text text-transparent
                               group-hover:text-glow-strong transition-all duration-300"
                  >
                    STONEAGE
                  </span>
                  <span className="text-[10px] md:text-xs text-text-muted font-medium tracking-[0.2em] uppercase">
                    Light Guide
                  </span>
                </div>
              </Link>

              {/* Right Section */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* Live indicator */}
                <div
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full
                              bg-accent/10 border border-accent/30
                              hover:bg-accent/20 hover:border-accent/50
                              transition-all duration-300 cursor-default"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-tertiary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-tertiary" />
                  </span>
                  <span className="text-xs font-semibold text-text-primary">환수강림 라이트</span>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Immersive */}
      <header
        className="relative w-full pt-20 md:pt-24 overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-bg-secondary">
          {/* Gradient Mesh */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `
                radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, var(--accent-glow) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 40%)
              `,
              transition: 'background 0.3s ease',
            }}
          />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(var(--border) 1px, transparent 1px),
                linear-gradient(90deg, var(--border) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-accent/20 animate-float"
                style={{
                  width: `${20 + i * 10}px`,
                  height: `${20 + i * 10}px`,
                  left: `${10 + i * 15}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${4 + i}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Hero Card */}
          <div
            className="relative rounded-3xl overflow-hidden
                        bg-gradient-to-br from-bg-tertiary/50 to-bg-primary/80
                        border border-border backdrop-blur-sm
                        shadow-2xl"
          >
            {/* Image with overlay */}
            <div className="relative h-72 md:h-96 lg:h-[28rem]">
              <img
                src={`${import.meta.env.BASE_URL}sa.jpg`}
                alt="StoneAge Light"
                className="w-full h-full object-cover"
              />

              {/* Multi-layer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/50 via-transparent to-bg-primary/50" />

              {/* Scan line effect */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--text-primary) 2px, var(--text-primary) 4px)',
                }}
              />

              {/* Vignette */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 0%, var(--bg-primary) 100%)',
                  opacity: 0.4,
                }}
              />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <span
                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-full
                             text-[10px] md:text-xs font-bold uppercase tracking-wider
                             bg-gradient-to-r from-accent to-amber-500 text-bg-primary
                             shadow-lg shadow-accent/30"
                >
                  Official Guide
                </span>
                <span
                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-full
                             text-[10px] md:text-xs font-medium
                             bg-bg-elevated/60 backdrop-blur-sm text-text-secondary
                             border border-border"
                >
                  by 형명가
                </span>
              </div>

              {/* Title */}
              <h1 className="mb-4 md:mb-6">
                <span
                  className="block font-display text-4xl md:text-6xl lg:text-7xl font-black tracking-tight
                             bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent
                             [text-shadow:0_0_60px_var(--accent-glow)]
                             animate-gradient bg-[length:200%_auto]"
                >
                  STONEAGE
                </span>
                <span
                  className="block font-display text-3xl md:text-5xl lg:text-6xl font-black tracking-tight
                             text-accent [text-shadow:0_0_40px_var(--accent-glow)]"
                >
                  LIGHT
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm md:text-lg text-text-secondary max-w-xl leading-relaxed mb-6 md:mb-8">
                환수강림 라이트 <span className="text-accent font-semibold">페트</span>,{' '}
                <span className="text-neon-blue font-semibold">아이템</span>,{' '}
                <span className="text-accent-tertiary font-semibold">퀘스트</span> 정보를 한눈에
              </p>

              {/* Contact & Actions */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {/* Contact Button */}
                <button
                  onClick={handleInfoClick}
                  className="group relative flex items-center gap-3 px-4 py-2.5 md:px-5 md:py-3
                             rounded-xl overflow-hidden
                             bg-bg-elevated/60 backdrop-blur-sm
                             border border-border hover:border-accent/50
                             transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        'radial-gradient(circle at center, var(--accent-soft) 0%, transparent 70%)',
                    }}
                  />

                  <img
                    src={`${import.meta.env.BASE_URL}images/pet.png`}
                    alt="왕/킹"
                    className="relative w-7 h-7 md:w-8 md:h-8 rounded-full
                               ring-2 ring-accent/40 group-hover:ring-accent
                               transition-all duration-300"
                  />
                  <span className="relative text-sm md:text-base text-text-primary font-medium">
                    문의: <span className="text-accent">왕/킹</span>
                  </span>
                  <svg
                    className="relative w-4 h-4 text-accent opacity-0 -translate-x-2
                               group-hover:opacity-100 group-hover:translate-x-0
                               transition-all duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Tooltip */}
                {showTooltip && (
                  <div
                    className="animate-scale-in px-4 py-3 rounded-xl
                                bg-bg-primary/95 backdrop-blur-lg
                                border border-accent/30 shadow-xl shadow-accent/10
                                text-sm text-text-secondary max-w-xs"
                  >
                    <span className="text-accent font-semibold">📌 안내:</span> 정보는 공홈 기준으로
                    작성되었으며, 실제 게임과 차이가 있을 수 있습니다.
                  </div>
                )}
              </div>
            </div>

            {/* Decorative corner accents */}
            <div className="absolute top-4 right-4 w-20 h-20 md:w-32 md:h-32">
              <div className="absolute inset-0 rounded-full bg-accent/20 blur-3xl animate-glow" />
            </div>
            <div className="absolute top-1/2 left-4 w-12 h-12 md:w-20 md:h-20">
              <div
                className="absolute inset-0 rounded-full bg-neon-blue/20 blur-2xl animate-float"
                style={{ animationDelay: '1s' }}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
