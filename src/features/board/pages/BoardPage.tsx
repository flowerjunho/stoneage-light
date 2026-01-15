import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Flame, Github, CheckCircle2, XCircle, Info } from 'lucide-react';
import FirebaseComments from '@/shared/components/feedback/FirebaseComments';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const BoardPage: React.FC = () => {
  const giscusRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'firebase' | 'giscus'>('firebase');

  // URL 쿼리에서 탭 상태 초기화
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'giscus' || tabParam === 'firebase') {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab: 'firebase' | 'giscus') => {
    setActiveTab(tab);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tab);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  // 다크모드 상태 감지
  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(darkMode);
    };

    // 초기 다크모드 상태 확인
    checkDarkMode();

    // 다크모드 변경 감지를 위한 MutationObserver
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Giscus 탭이 선택되었을 때만 로드
    if (activeTab !== 'giscus') return;

    // Giscus 스크립트가 이미 로드되어 있다면 제거
    const existingScript = document.querySelector('script[src="https://giscus.app/client.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Giscus 컨테이너 내용 초기화
    if (giscusRef.current) {
      giscusRef.current.innerHTML = '';
    }

    // 테마에 따른 Giscus 테마 선택
    const giscusTheme = isDarkMode ? 'preferred_color_scheme' : 'catppuccin_latte';

    // 새로운 Giscus 스크립트 추가
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'flowerjunho/stoneage-light');
    script.setAttribute('data-repo-id', 'R_kgDOPwD-mg');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOPwD-ms4CviEa');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', giscusTheme);
    script.setAttribute('data-lang', 'ko');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    if (giscusRef.current) {
      giscusRef.current.appendChild(script);
    }

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      const scriptToRemove = document.querySelector('script[src="https://giscus.app/client.js"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [isDarkMode, activeTab]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <MessageCircle className="w-4 h-4" />
            스톤에이지 <span onClick={() => navigate('/trade')}>게시판</span>
          </Badge>

          <p className="text-base md:text-lg text-text-secondary">
            스톤에이지 환수강림 라이트에 관한 자유로운 소통 공간
            <button
              onClick={() => navigate('/radonta')}
              className="text-text-secondary hover:text-text-secondary transition-colors cursor-default"
              title="라돈타 공략 바로가기"
            >
              입니다
            </button>
          </p>

          {activeTab === 'giscus' && (
            <Card className="p-3 border-blue-500/30 bg-blue-500/5 max-w-lg mx-auto">
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <Github className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">GitHub 계정으로 로그인하여 댓글을 남겨보세요!</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 댓글 시스템 선택 탭 */}
      <div className="mb-6 px-4 md:px-0">
        <Card className="relative p-1.5">
          {/* 슬라이딩 배경 인디케이터 */}
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-accent shadow-glow
                       transition-all duration-300 ease-out-expo pointer-events-none"
            style={{
              left: activeTab === 'firebase' ? '6px' : 'calc(50% + 2px)',
              width: 'calc(50% - 8px)',
            }}
          />
          <Button
            variant="ghost"
            onClick={() => handleTabChange('firebase')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300 flex-col h-auto py-3",
              activeTab === 'firebase' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Flame className="w-4 h-4" />
            <span className="text-xs">간편 댓글 (로그인 불필요)</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleTabChange('giscus')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300 flex-col h-auto py-3",
              activeTab === 'giscus' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Github className="w-4 h-4" />
            <span className="text-xs">GitHub 댓글 (계정 필요)</span>
          </Button>
        </Card>
      </div>

      {/* 사용 안내 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">게시판 이용 안내</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">페트 정보 공유:</span> 새로운 페트 정보나 팁을 공유해
              <button
                onClick={() => navigate('/battle')}
                className="text-text-secondary hover:text-text-secondary transition-colors cursor-default"
              >
                주세요
              </button>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">버그 신고:</span> 계산기나 사이트에서 발견한 버그를 알려
              <button
                onClick={() => navigate('/dashboard')}
                className="text-text-secondary hover:text-text-secondary transition-colors cursor-default"
              >
                주세요
              </button>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">기능 요청:</span> 추가했으면 하는 기능이나 개선사항을 제안해주세요
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/20">
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">스팸/도배 금지:</span> 게임과 관련 없는 내용이나 반복적인 글은 삭제될 수 있습니다
            </div>
          </div>
        </div>
      </Card>

      {/* 댓글 시스템 컨텐츠 */}
      {activeTab === 'firebase' && (
        <Card className="p-6">
          <FirebaseComments />
        </Card>
      )}

      {activeTab === 'giscus' && (
        <Card className="p-6">
          <div ref={giscusRef} className="min-h-[400px]">
            {/* Giscus가 여기에 로드됩니다 */}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BoardPage;
