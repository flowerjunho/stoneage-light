import { useState, useEffect, useCallback } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PageShareButton = () => {
  const [isScrollToTopVisible, setIsScrollToTopVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);

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

  const handlePageShare = useCallback(async () => {
    const currentUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(currentUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch {
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
      <Button
        onClick={handlePageShare}
        size="icon"
        className={cn(
          "fixed z-[60] w-12 h-12 rounded-full",
          "bg-gradient-to-r from-blue-500 to-blue-600",
          "shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50",
          "hover:scale-110 active:scale-95 transition-all duration-300",
          "right-6 lg:right-[calc(50%-32rem-60px)] xl:right-[calc(50%-30rem-60px)]",
          "iphone16:right-4 iphone16:w-10 iphone16:h-10",
          isScrollToTopVisible
            ? "bottom-36 iphone16:bottom-32"
            : "bottom-20 iphone16:bottom-16"
        )}
        aria-label="페이지 링크 복사"
      >
        <Share2 className="w-6 h-6 iphone16:w-5 iphone16:h-5 text-white" />
      </Button>

      {/* Toast Message */}
      {showToast && (
        <div className={cn(
          "fixed z-[60] animate-fade-in-up",
          "right-6 lg:right-[calc(50%-32rem-60px)] xl:right-[calc(50%-30rem-60px)]",
          "iphone16:right-4",
          "bottom-40 iphone16:bottom-36"
        )}>
          <Card
            variant="glass"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 border-green-400"
          >
            <Check className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              페이지 링크가 복사되었습니다!
            </span>
          </Card>
        </div>
      )}
    </>
  );
};

export default PageShareButton;
