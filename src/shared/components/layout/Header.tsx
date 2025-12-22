import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTimeoutId, setTooltipTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleInfoClick = () => {
    // 기존 timeout이 있다면 제거
    if (tooltipTimeoutId) {
      clearTimeout(tooltipTimeoutId);
    }

    // 툴팁 표시
    setShowTooltip(true);

    // 3초 후 툴팁 숨기기
    const timeoutId = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);

    setTooltipTimeoutId(timeoutId);
  };

  // 컴포넌트 언마운트 시 timeout 정리
  useEffect(() => {
    return () => {
      if (tooltipTimeoutId) {
        clearTimeout(tooltipTimeoutId);
      }
    };
  }, [tooltipTimeoutId]);

  return (
    <header className="w-full bg-bg-secondary border-b border-border mb-8">
      <div className="max-w-6xl mx-auto p-4 relative iphone16:p-3">
        <div className="w-full h-80 rounded-xl overflow-hidden relative iphone16:h-60 iphone16:rounded-lg">
          <img
            src={`${import.meta.env.BASE_URL}sa.jpg`}
            alt="StoneAge Light - Pet Collection"
            className="w-full h-full object-cover brightness-75"
          />
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center text-white z-10 w-full px-4 pb-4">
          <h1 className="text-4xl font-bold mb-2 drop-shadow-2xl iphone16:text-2xl xs:text-xl leading-tight">
            스톤에이지 환수강림 라이트 by.형명가
          </h1>
          <div className="flex justify-end pr-1 relative">
            <div className="flex items-center gap-1">
              <p className="text-sm text-white/80 drop-shadow-lg iphone16:text-xs flex items-center">
                버그 수정, 피드백 및 추가 기능 문의는{' '}
                <img
                  src="https://cdn.discordapp.com/avatars/749657866155065475/6720e8ea311b141c4c5d1599e328baab.webp?size=128"
                  alt="왕/킹 아바타"
                  className="w-[1em] h-[1em] rounded-full mx-1 inline-block"
                />
                왕/킹에게 DM 주세요.
              </p>
              <button
                onClick={handleInfoClick}
                className="w-4 h-4 rounded-full bg-blue-500 hover:bg-blue-400 text-white border border-blue-400 hover:border-blue-300 transition-colors flex items-center justify-center text-xs font-bold shadow-sm"
                aria-label="정보 보기"
              >
                i
              </button>
            </div>

            {/* 툴팁 메시지 - 버튼 근처에 위치 */}
            {showTooltip && (
              <div className="absolute -top-16 right-0 max-w-xs z-50 pointer-events-none">
                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-3 py-2 rounded-lg shadow-lg break-words">
                  정보는 공홈 기준으로 작성되었으며, 실제 게임과 차이가 있을 수 있습니다.
                  <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
