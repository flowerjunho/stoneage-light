import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ShareButton = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // 스크롤 위치에 따라 위치 조정
  useEffect(() => {
    const togglePosition = () => {
      if (window.pageYOffset > 300) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', togglePosition);

    return () => {
      window.removeEventListener('scroll', togglePosition);
    };
  }, []);

  // 현재 페이지 공유하는 함수
  const shareCurrentPage = async () => {
    const shareUrl = `https://flowerjunho.github.io${location.pathname}`;
    
    try {
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 클립보드에 복사되었습니다!');
    } catch (error) {
      // 클립보드 API 실패 시 fallback 방법
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        alert('링크가 클립보드에 복사되었습니다!');
      } catch (err) {
        alert('클립보드 복사에 실패했습니다. 브라우저에서 복사 기능을 지원하지 않습니다.');
      }
      
      document.body.removeChild(textArea);
    }
  };

  return (
    <button
      onClick={shareCurrentPage}
      className={`fixed right-6 z-50 w-12 h-12 bg-blue-500 hover:bg-blue-600
                 text-white rounded-full shadow-lg hover:shadow-xl
                 flex items-center justify-center transition-all duration-300
                 hover:scale-110 active:scale-95
                 iphone16:right-4 iphone16:w-10 iphone16:h-10
                 ${isScrolled 
                   ? 'bottom-20 iphone16:bottom-16' 
                   : 'bottom-6 iphone16:bottom-4'
                 }`}
      aria-label="현재 페이지 공유하기"
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
  );
};

export default ShareButton;