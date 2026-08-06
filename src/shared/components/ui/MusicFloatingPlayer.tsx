import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// public/bgm/ 경로의 정적 MP3 음원 리스트 안전 생성
function getTrackUrl(filename: string): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}bgm/${filename}`;
}

const PLAYLIST = [
  getTrackUrl('stone1.mp3'),
  getTrackUrl('stone2.mp3'),
  getTrackUrl('stone3.mp3'),
  getTrackUrl('stone4.mp3'),
  getTrackUrl('stone5.mp3'),
  getTrackUrl('stone6.mp3'),
  getTrackUrl('stone7.mp3'),
  getTrackUrl('stone8.mp3'),
];

const BGM_STATE_KEY = 'BGM_AUTOPLAY_STATE'; // 'PLAYING' | 'PAUSED'
const BGM_INDEX_KEY = 'BGM_CURRENT_INDEX';

const MusicFloatingPlayer: React.FC = () => {
  const location = useLocation();

  // 저장된 트랙 인덱스 불러오기 (기본값: 0)
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const saved = localStorage.getItem(BGM_INDEX_KEY);
    const parsed = saved ? parseInt(saved, 10) : 0;
    return isNaN(parsed) || parsed < 0 || parsed >= PLAYLIST.length ? 0 : parsed;
  });

  // 로컬스토리지 재생 상태 불러오기 (기본값: 'PLAYING')
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    const savedState = localStorage.getItem(BGM_STATE_KEY);
    return savedState !== 'PAUSED';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasFilterButton, setHasFilterButton] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. 트랙 인덱스 변경 시 로컬스토리지 저장
  useEffect(() => {
    localStorage.setItem(BGM_INDEX_KEY, currentIndex.toString());
  }, [currentIndex]);

  // 2. 초고속 오디오 언락 & 재생 가동 함수 (Web Audio Context + HTML5 Audio)
  const forceStartAudio = useCallback(() => {
    const savedState = localStorage.getItem(BGM_STATE_KEY);
    if (savedState === 'PAUSED') return;

    // Web Audio Context 오디오 파이프라인 가상 언락 시도
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
    } catch {
      // 무시
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = false;
    audio.volume = 1.0;

    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // 차단 시 브라우저 기본 상태 유지
        });
    }
  }, []);

  // 3. 진입 시 100ms 간격 자동 재생 시도
  useEffect(() => {
    const savedState = localStorage.getItem(BGM_STATE_KEY);
    if (savedState === 'PAUSED') {
      setIsPlaying(false);
      return;
    }

    forceStartAudio();

    const interval = setInterval(() => {
      const state = localStorage.getItem(BGM_STATE_KEY);
      if (state === 'PAUSED') {
        clearInterval(interval);
        return;
      }
      forceStartAudio();
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, forceStartAudio]);

  // 4. 곡 종료 시 다음 곡으로 무한 순환 (8번 곡 종료 시 다시 1번 곡으로)
  const handleTrackEnded = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % PLAYLIST.length);
  }, []);

  // 5. 트랙 변경 시 계속 재생
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const savedState = localStorage.getItem(BGM_STATE_KEY);
    if (savedState === 'PAUSED') return;

    audio.src = PLAYLIST[currentIndex];
    audio.muted = false;
    audio.volume = 1.0;
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {});
  }, [currentIndex]);

  // 6. Non-blocking 전역 캡처 리스너: touchstart, scroll, wheel, click 등 모든 반응에 0.01초 만에 즉시 반응!
  useEffect(() => {
    const handleNonBlockingInteraction = () => {
      forceStartAudio();
    };

    const events = [
      'touchstart', // 손가락이 화면에 닿는 0.01초 그 순간!
      'touchmove',
      'touchend',
      'scroll',     // 화면 스크롤!
      'wheel',      // 마우스 휠!
      'click',
      'mousedown',
      'mousemove',
      'pointerdown',
      'keydown',
    ];

    // passive: true, capture: true 옵션으로 기존 탭 버튼 클릭 및 화면 터치가 100% 정상 작동함을 보장!
    events.forEach(event => {
      window.addEventListener(event, handleNonBlockingInteraction, { passive: true, capture: true });
      document.addEventListener(event, handleNonBlockingInteraction, { passive: true, capture: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleNonBlockingInteraction, { capture: true });
        document.removeEventListener(event, handleNonBlockingInteraction, { capture: true });
      });
    };
  }, [forceStartAudio]);

  // 7. 화면에 필터 버튼 존재 여부 감지 (위치 동적 조절)
  useEffect(() => {
    const checkFilterPresence = () => {
      const filterElement = document.querySelector('[aria-label="필터 설정"]');
      setHasFilterButton(!!filterElement);
    };

    checkFilterPresence();
    const timer = setInterval(checkFilterPresence, 500);

    return () => clearInterval(timer);
  }, [location.pathname]);

  // 8. 메인 재생 / 정지 토글 버튼 (로컬스토리지 상태 연동)
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
      localStorage.setItem(BGM_STATE_KEY, 'PAUSED');
    } else {
      localStorage.setItem(BGM_STATE_KEY, 'PLAYING');
      forceStartAudio();
    }
  };

  return (
    <>
      {/* HTML5 Static Asset MP3 Audio Engine */}
      <audio
        ref={audioRef}
        src={PLAYLIST[currentIndex]}
        autoPlay={isPlaying}
        onEnded={handleTrackEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        className="hidden"
      />

      <div
        className={cn(
          'fixed z-50 flex items-center gap-1.5 transition-all duration-300',
          'left-6 lg:left-[calc(50%-32rem-60px)] xl:left-[calc(50%-30rem-60px)]',
          'iphone16:left-4',
          hasFilterButton
            ? 'bottom-36 iphone16:bottom-32' // 필터 버튼 바로 위
            : 'bottom-20 iphone16:bottom-16' // 필터 버튼 원래 자리
        )}
      >
        <Button
          onClick={togglePlay}
          size="icon"
          className={cn(
            'w-12 h-12 rounded-full shadow-lg transition-all duration-300',
            'hover:scale-110 active:scale-95',
            'iphone16:w-10 iphone16:h-10',
            isPlaying
              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/30 animate-pulse'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/30'
          )}
          aria-label={isPlaying ? '음악 정지' : '음악 재생'}
          title={isPlaying ? `음악 정지 (현재 ${currentIndex + 1}번 트랙 재생 중)` : '음악 재생'}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 iphone16:w-4 iphone16:h-4 text-white" />
          ) : (
            <Play className="w-5 h-5 ml-0.5 iphone16:w-4 iphone16:h-4 text-white" />
          )}
        </Button>
      </div>
    </>
  );
};

export default MusicFloatingPlayer;
