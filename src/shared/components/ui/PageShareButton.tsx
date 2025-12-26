import { useState, useEffect, useCallback } from 'react';

const PageShareButton = () => {
  const [isScrollToTopVisible, setIsScrollToTopVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 스크롤 위치에 따라 상단으로 가기 버튼 표시 여부만 확인
  useEffect(() => {
    const toggleVisibility = () => {
      const scrollTop = window.pageYOffset;
      const shouldShow = scrollTop > 300;
      
      setIsScrollToTopVisible(shouldShow);
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // 페이지 링크 복사 핸들러
  const handlePageShare = useCallback(async () => {
    const currentUrl = window.location.href;
    
    try {
      await navigator.clipboard.writeText(currentUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
      // 폴백: URL을 선택 가능한 input으로 표시
      const input = document.createElement('input');
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  }, []);

  return (
    <>
      <button
        onClick={handlePageShare}
        className={`fixed z-[60] w-12 h-12 bg-blue-500 hover:bg-blue-600
                   text-white rounded-full shadow-lg hover:shadow-xl
                   flex items-center justify-center transition-all duration-300
                   hover:scale-110 active:scale-95
                   right-6 lg:right-[calc(50%-32rem-60px)] xl:right-[calc(50%-30rem-60px)]
                   iphone16:right-4 iphone16:w-10 iphone16:h-10 ${
                     isScrollToTopVisible
                       ? 'bottom-20 iphone16:bottom-16'
                       : 'bottom-6 iphone16:bottom-4'
                   }`}
        aria-label="페이지 링크 복사"
      >
        <svg
          className="w-6 h-6 iphone16:w-5 iphone16:h-5"
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
        <div className="fixed bottom-24 right-6 lg:right-[calc(50%-32rem-60px)] xl:right-[calc(50%-30rem-60px)] iphone16:bottom-20 iphone16:right-4 z-[60]">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in-up">
            페이지 링크가 복사되었습니다!
          </div>
        </div>
      )}
    </>
  );
};

export default PageShareButton;