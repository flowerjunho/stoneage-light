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

// 1번부터 10번까지의 기본 BGM 순서 배열
const PLAYLIST = [
  getTrackUrl('stone1.mp3'),
  getTrackUrl('stone2.mp3'),
  getTrackUrl('stone3.mp3'),
  getTrackUrl('stone4.mp3'),
  getTrackUrl('stone5.mp3'),
  getTrackUrl('stone6.mp3'),
  getTrackUrl('stone7.mp3'),
  getTrackUrl('stone8.mp3'),
  getTrackUrl('stone9.mp3'),
  getTrackUrl('stone10.mp3'),
];

// 메인(/) 루트 페이지 전용 BGM
const LOGIN_BGM = getTrackUrl('stone_login.mp3');

const BGM_STATE_KEY = 'BGM_AUTOPLAY_STATE'; // 'PLAYING' | 'PAUSED'
const BGM_INDEX_KEY = 'BGM_CURRENT_INDEX';

const MusicFloatingPlayer: React.FC = () => {
  const location = useLocation();

  // 저장된 트랙 인덱스 불러오기 (기본값: 0)
  const [playlistIndex, setPlaylistIndex] = useState<number>(() => {
    const saved = localStorage.getItem(BGM_INDEX_KEY);
    const parsed = saved ? parseInt(saved, 10) : 0;
    return isNaN(parsed) || parsed < 0 || parsed >= PLAYLIST.length ? 0 : parsed;
  });

  // 현재 재생할 음원 파일 경로 (기본값: 루트 여부에 따라 분기)
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    return location.pathname === '/' ? LOGIN_BGM : PLAYLIST[playlistIndex];
  });

  // 로컬스토리지 재생 상태 불러오기 (기본값: 'PLAYING')
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    const savedState = localStorage.getItem(BGM_STATE_KEY);
    return savedState !== 'PAUSED';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasFilterButton, setHasFilterButton] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const lastPathRef = useRef<string>(location.pathname);

  // isPlayingRef 동기화
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // 1. 일반 트랙 인덱스 변경 시 로컬스토리지 저장
  useEffect(() => {
    if (currentSrc !== LOGIN_BGM) {
      localStorage.setItem(BGM_INDEX_KEY, playlistIndex.toString());
    }
  }, [playlistIndex, currentSrc]);

  // 2. 메인 페이지(/) 진입 감지: 루트 진입 시 무조건 stone_login.mp3로 다시 시작
  useEffect(() => {
    const isRoot = location.pathname === '/';
    const pathChanged = lastPathRef.current !== location.pathname;
    lastPathRef.current = location.pathname;

    if (isRoot && pathChanged) {
      setCurrentSrc(LOGIN_BGM);
      const audio = audioRef.current;
      if (audio) {
        audio.src = LOGIN_BGM;
        audio.currentTime = 0;

        const savedState = localStorage.getItem(BGM_STATE_KEY);
        if (savedState !== 'PAUSED') {
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    }
  }, [location.pathname]);

  // 3. 초고속 오디오 강제 가동 함수 (Web Audio Context + HTML5 Audio)
  const forceStartAudio = useCallback(() => {
    const savedState = localStorage.getItem(BGM_STATE_KEY);
    if (savedState === 'PAUSED') return;

    // Web Audio Context 활성화
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
          // 브라우저 거부 시 무시
        });
    }
  }, []);

  // 4. 진입 시 100ms 간격 자동 재생 시도
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
  }, [currentSrc, forceStartAudio]);

  // 5. 한 곡이 종료되었을 때 다음 트랙 처리
  const handleTrackEnded = useCallback(() => {
    if (currentSrc === LOGIN_BGM) {
      // stone_login.mp3가 끝나면 1번 곡(stone1.mp3)으로 전환되어 계속 순환
      setCurrentSrc(PLAYLIST[0]);
      setPlaylistIndex(0);
    } else {
      // 일반 트랙인 경우 다음 번호 트랙으로 (10번 후에는 1번으로 순환)
      const nextIndex = (playlistIndex + 1) % PLAYLIST.length;
      setPlaylistIndex(nextIndex);
      setCurrentSrc(PLAYLIST[nextIndex]);
    }
  }, [currentSrc, playlistIndex]);

  // 6. currentSrc 변경 시 음서 로드 및 계속 재생
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const savedState = localStorage.getItem(BGM_STATE_KEY);
    if (savedState === 'PAUSED') return;

    audio.src = currentSrc;
    audio.muted = false;
    audio.volume = 1.0;
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {});
  }, [currentSrc]);

  // 7. Non-blocking 전역 캡처 리스너: touchstart, scroll, wheel, click 등 모든 반응에 즉각 반응
  useEffect(() => {
    const handleNonBlockingInteraction = () => {
      forceStartAudio();
    };

    const events = [
      'touchstart', // 손가락 닿는 0.01초 순간
      'touchmove',
      'touchend',
      'scroll',     // 화면 스크롤
      'wheel',      // 마우스 휠
      'click',
      'mousedown',
      'mousemove',
      'pointerdown',
      'keydown',
    ];

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

  // 8. 화면에 필터 버튼 존재 여부 감지 (위치 동적 조절)
  useEffect(() => {
    const checkFilterPresence = () => {
      const filterElement = document.querySelector('[aria-label="필터 설정"]');
      setHasFilterButton(!!filterElement);
    };

    checkFilterPresence();
    const timer = setInterval(checkFilterPresence, 500);

    return () => clearInterval(timer);
  }, [location.pathname]);

  // 9. 메인 재생 / 정지 토글 버튼 (로컬스토리지 상태 연동)
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
        src={currentSrc}
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
          title={
            isPlaying
              ? `음악 정지 (현재 ${currentSrc === LOGIN_BGM ? '로그인 BGM' : `${playlistIndex + 1}번 트랙`} 재생 중)`
              : '음악 재생'
          }
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
