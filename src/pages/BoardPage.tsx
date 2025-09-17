import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FirebaseComments from '../components/FirebaseComments';

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
    <div className="max-w-6xl mx-auto px-4 py-8 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4 text-center">
          💬 스톤에이지 게시판
        </h1>
        <div className="text-center text-text-secondary space-y-2">
          <p className="text-base md:text-lg">
            스톤에이지 환수강림 라이트에 관한 자유로운 소통 공간입니다
          </p>
          {activeTab === 'giscus' && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 <span className="font-semibold">GitHub 계정으로 로그인하여 댓글을 남겨보세요!</span>
            </p>
          )}
        </div>
      </div>

      {/* 댓글 시스템 선택 탭 */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="flex">
            <button
              onClick={() => handleTabChange('firebase')}
              className={`flex-1 py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'firebase'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-muted'
              }`}
            >
              🔥 간편 댓글 (로그인 불필요)
            </button>
            <button
              onClick={() => handleTabChange('giscus')}
              className={`flex-1 py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'giscus'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-muted'
              }`}
            >
              💬 GitHub 댓글
              <br />
              (GitHub 계정 필요)
            </button>
          </nav>
        </div>
      </div>

      {/* 사용 안내 */}
      <div className="bg-bg-secondary rounded-xl p-6 mb-8 border border-border">
        <h2 className="text-xl font-bold text-text-primary mb-4">📋 게시판 이용 안내</h2>
        <div className="space-y-3 text-text-secondary">
          <div className="flex items-start space-x-3">
            <span className="text-green-500 mt-1">✅</span>
            <div>
              <span className="font-medium">페트 정보 공유:</span> 새로운 페트 정보나 팁을
              공유해주세요
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-500 mt-1">✅</span>
            <div>
              <span className="font-medium">버그 신고:</span> 계산기나 사이트에서 발견한 버그를
              알려주세요
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-500 mt-1">✅</span>
            <div>
              <span className="font-medium">기능 요청:</span> 추가했으면 하는 기능이나 개선사항을
              제안해주세요
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-red-500 mt-1">❌</span>
            <div>
              <span className="font-medium">스팸/도배 금지:</span> 게임과 관련 없는 내용이나
              반복적인 글은 삭제될 수 있습니다
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 시스템 컨텐츠 */}
      {activeTab === 'firebase' && (
        <div className="bg-bg-secondary rounded-xl p-6 border border-border">
          <FirebaseComments />
        </div>
      )}

      {activeTab === 'giscus' && (
        <div className="bg-bg-secondary rounded-xl p-6 border border-border">
          <div ref={giscusRef} className="min-h-[400px]">
            {/* Giscus가 여기에 로드됩니다 */}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPage;
