import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        "fixed bottom-6 z-50 w-12 h-12 rounded-full",
        "bg-gradient-to-r from-accent to-accent-hover",
        "shadow-lg shadow-accent-glow/30 hover:shadow-xl hover:shadow-accent-glow/50",
        "hover:scale-110 active:scale-95 transition-all duration-300",
        "right-6 lg:right-[calc(50%-32rem-60px)] xl:right-[calc(50%-30rem-60px)]",
        "iphone16:bottom-4 iphone16:right-4 iphone16:w-10 iphone16:h-10"
      )}
      aria-label="최상단으로 이동"
    >
      <ArrowUp className="w-6 h-6 iphone16:w-5 iphone16:h-5 text-text-inverse" />
    </Button>
  );
};

export default ScrollToTopButton;
