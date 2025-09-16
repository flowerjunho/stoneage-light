import React, { useState } from 'react';

interface ShareButtonProps {
  shareUrl: string;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  shareUrl, 
  title, 
  size = 'sm',
  showText = false 
}) => {
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share && /Android|iPhone/i.test(navigator.userAgent)) {
        // 모바일 네이티브 공유
        await navigator.share({
          title: title,
          url: shareUrl
        });
      } else {
        // 데스크톱 클립보드 복사
        await navigator.clipboard.writeText(shareUrl);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch (error) {
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
  };

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className={`${sizeClasses[size]} rounded-full bg-accent/10 hover:bg-accent/20 text-accent transition-colors duration-200 flex items-center justify-center ${
          showText ? 'px-3 w-auto space-x-2' : ''
        }`}
        title="공유하기"
      >
        <svg
          className={iconSizes[size]}
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
        {showText && (
          <span className="text-sm font-medium">공유</span>
        )}
      </button>

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            링크가 복사되었습니다!
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;