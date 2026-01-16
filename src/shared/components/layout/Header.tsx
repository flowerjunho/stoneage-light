import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/shared/components/layout/ThemeToggle';

const Header: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTimeoutId, setTooltipTimeoutId] = useState<NodeJS.Timeout | null>(null);

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
      {/* Minimal Navigation Bar - 스크롤 시 탭에 덮임 */}
      <nav
        className="py-4 bg-transparent"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Minimal Logo */}
            <Link
              to="/"
              className="group flex items-center gap-2.5 transition-all duration-300"
            >
              {/* 고인돌 아이콘 */}
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-lg bg-accent/40 blur-lg opacity-0
                             group-hover:opacity-100 transition-opacity duration-500"
                />
                <div
                  className={cn(
                    'relative w-8 h-8 flex items-center justify-center',
                    'transition-all duration-300 group-hover:scale-110'
                  )}
                >
                  {/* 고인돌 SVG */}
                  <svg
                    viewBox="0 0 32 32"
                    className="w-8 h-8"
                    fill="none"
                  >
                    {/* 받침돌 2개 */}
                    <path
                      d="M6 28 L10 18 L12 28 Z"
                      className="fill-text-muted group-hover:fill-amber-600 transition-colors duration-300"
                    />
                    <path
                      d="M20 28 L22 18 L26 28 Z"
                      className="fill-text-muted group-hover:fill-amber-600 transition-colors duration-300"
                    />
                    {/* 윗돌 */}
                    <path
                      d="M4 19 C4 16 8 14 16 14 C24 14 28 16 28 19 C28 21 24 22 16 22 C8 22 4 21 4 19 Z"
                      className="fill-accent group-hover:fill-amber-400 transition-colors duration-300"
                    />
                    {/* 윗돌 하이라이트 */}
                    <path
                      d="M8 17 C10 16 14 15.5 16 15.5 C18 15.5 20 16 20 16.5"
                      className="stroke-white/30 stroke-[1.5]"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* 타이틀 */}
              <span
                className={cn(
                  'text-sm font-bold',
                  'text-text-primary transition-all duration-300',
                  'group-hover:text-accent'
                )}
              >
                스톤에이지 환수강림 라이트
              </span>
            </Link>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>


      {/* Hero Section - Clean & Modern */}
      <header className="relative w-full overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-morph-blob" />
          <div
            className="absolute bottom-0 right-1/4 w-80 h-80 bg-neon-purple/20 rounded-full blur-[100px] animate-morph-blob"
            style={{ animationDelay: '-4s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
                       bg-gradient-to-r from-accent/10 via-neon-blue/10 to-neon-purple/10
                       rounded-full blur-[120px] animate-breathe"
          />

          {/* Subtle Grid */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(var(--accent) 1px, transparent 1px),
                linear-gradient(90deg, var(--accent) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            {/* Left: Text Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* 서브 타이틀 */}
              <div
                className="inline-flex items-center gap-2 mb-3 animate-slide-down opacity-0"
                style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
              >
                <span className="text-xs font-medium text-text-muted tracking-wider">
                  환수강림 라이트
                </span>
              </div>

              {/* Title */}
              <h1 className="mb-4">
                <span
                  className="block text-3xl md:text-5xl lg:text-6xl font-black tracking-tight
                             animate-slide-up opacity-0"
                  style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
                >
                  <span className="text-text-primary">STONE</span>
                  <span className="text-accent">AGE</span>
                </span>
                <span
                  className="block text-xl md:text-3xl lg:text-4xl font-bold text-text-secondary mt-1
                             animate-slide-up opacity-0"
                  style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
                >
                  LIGHT
                </span>
              </h1>

              {/* Description */}
              <p
                className="text-sm md:text-base text-text-secondary max-w-md mx-auto lg:mx-0 mb-6
                           animate-slide-up opacity-0"
                style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
              >
                <span className="text-accent font-semibold">페트</span>,{' '}
                <span className="text-neon-blue font-semibold">아이템</span>,{' '}
                <span className="text-emerald-400 font-semibold">퀘스트</span>,{' '}
                <span className="text-purple-400 font-semibold">계산기</span> 등 모든 정보를 한눈에
              </p>

              {/* CTA Section */}
              <div
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4
                           animate-slide-up opacity-0"
                style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
              >
                <Button
                  variant="glass"
                  onClick={handleInfoClick}
                  className="group gap-3 px-5 py-3 rounded-2xl"
                >
                  <img
                    src={`${import.meta.env.BASE_URL}images/pet.png`}
                    alt="왕/킹"
                    className="w-8 h-8 rounded-full ring-2 ring-accent/30
                               transition-all duration-300 group-hover:ring-accent group-hover:scale-110"
                  />
                  <span className="text-sm">
                    문의: <span className="text-accent font-semibold">왕/킹</span>
                  </span>
                  <ChevronRight
                    className="w-4 h-4 text-accent opacity-0 -translate-x-2
                               group-hover:opacity-100 group-hover:translate-x-0
                               transition-all duration-300"
                  />
                </Button>

                {/* Tooltip */}
                {showTooltip && (
                  <div
                    className="animate-elastic-in px-4 py-3 rounded-xl
                               bg-bg-secondary/90 backdrop-blur-xl border border-accent/20
                               shadow-xl shadow-accent/10 text-sm text-text-secondary max-w-xs"
                  >
                    <span className="text-accent font-semibold">안내:</span> 정보는 공홈 기준으로
                    작성되었으며, 실제 게임과 차이가 있을 수 있습니다.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Image with effects */}
            <div
              className="relative flex-1 max-w-xs lg:max-w-sm animate-slide-left opacity-0"
              style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
            >
              {/* Glow behind image */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-accent/30 to-neon-purple/30
                           rounded-2xl blur-2xl opacity-50 animate-breathe"
              />

              {/* Main Image Container */}
              <div
                className="relative rounded-2xl overflow-hidden border border-white/10
                           shadow-xl shadow-black/30 transition-transform duration-500 hover:scale-[1.02]"
              >
                <img
                  src={`${import.meta.env.BASE_URL}sa_1.png`}
                  alt="StoneAge Light"
                  className="w-full h-auto"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg-primary to-transparent" />
      </header>
    </>
  );
};

export default Header;
