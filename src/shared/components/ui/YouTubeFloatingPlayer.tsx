import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Play, Pause, Music, Settings, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const DEFAULT_YOUTUBE_URL = 'https://www.youtube.com/watch?v=SHqYbTC0fck&list=PLtOiwyZKJg8NFaCD2c5yp6EAwjEctBx2u';
const STORAGE_KEY = 'YOUTUBE_MUSIC_FLOATING_URL';

/**
 * YouTube / YouTube Music URL에서 Video ID 및 Playlist ID 추출
 */
function parseYouTubeUrl(url: string): { videoId: string | null; playlistId: string | null } {
  if (!url) return { videoId: null, playlistId: null };

  let videoId: string | null = null;
  let playlistId: string | null = null;

  const videoMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (videoMatch && videoMatch[1]) {
    videoId = videoMatch[1];
  }

  const listMatch = url.match(/[?&]list=([^#&?]+)/);
  if (listMatch && listMatch[1]) {
    playlistId = listMatch[1];
  }

  return { videoId, playlistId };
}

const YouTubeFloatingPlayer: React.FC = () => {
  const location = useLocation();
  const [youtubeUrl, setYoutubeUrl] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_YOUTUBE_URL;
  });

  const [inputUrl, setInputUrl] = useState(youtubeUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsPlayerReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasFilterButton, setHasFilterButton] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerId = 'youtube-only-floating-player-iframe';

  // 1. 화면에 필터 버튼 존재 여부 감지
  useEffect(() => {
    const checkFilterPresence = () => {
      const filterElement = document.querySelector('[aria-label="필터 설정"]');
      setHasFilterButton(!!filterElement);
    };

    checkFilterPresence();
    const timer = setInterval(checkFilterPresence, 500);

    return () => clearInterval(timer);
  }, [location.pathname]);

  // 2. 오직 유튜브만 재생하는 유튜브 플레이어 초기화
  const initPlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player) return;

    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.warn('기존 유튜브 플레이어 정리 오류:', e);
      }
      playerRef.current = null;
    }

    setIsPlayerReady(false);
    setIsLoading(true);

    const { videoId, playlistId } = parseYouTubeUrl(youtubeUrl);

    const playerVars: Record<string, any> = {
      autoplay: 1,
      mute: 0, // 바로 소리 켜고 오토플레이 시도
      enablejsapi: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      loop: 1,
    };

    const playerOptions: Record<string, any> = {
      height: '200',
      width: '200',
      playerVars,
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true);
          setIsLoading(false);

          try {
            const iframe = event.target.getIframe();
            if (iframe) {
              iframe.setAttribute('allow', 'autoplay; encrypted-media');
            }
          } catch (e) {
            console.warn('iframe allow 속성 설정 오류:', e);
          }

          // 진입 직후, 0.3초 뒤, 1초(1000ms) 뒤, 2초(2000ms) 뒤 지연 자동 재생 트리거
          const forcePlay = () => {
            try {
              if (event.target && typeof event.target.unMute === 'function') {
                event.target.unMute();
                event.target.setVolume(100);
                event.target.playVideo();
              }
            } catch (e) {
              console.warn('playVideo 강제 실행:', e);
            }
          };

          forcePlay();
          setTimeout(forcePlay, 300);
          setTimeout(forcePlay, 1000); // 1초 뒤 재생
          setTimeout(forcePlay, 2000); // 2초 뒤 재생
        },
        onStateChange: (event: any) => {
          // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
          if (event.data === 1) {
            setIsPlaying(true);
            setIsLoading(false);
            // 재생 시작 즉시 음소거 완전히 풀기 및 볼륨 100% 지정
            try {
              event.target.unMute();
              event.target.setVolume(100);
            } catch (e) {
              console.warn('onStateChange unMute 오류:', e);
            }
          } else if (event.data === 2 || event.data === 0) {
            setIsPlaying(false);
            setIsLoading(false);
          } else if (event.data === 3) {
            setIsLoading(true);
          }
        },
        onError: (err: any) => {
          console.error('YouTube Player 전용 에러:', err);
          setIsLoading(false);
          setIsPlaying(false);
        },
      },
    };

    if (playlistId) {
      playerVars.listType = 'playlist';
      playerVars.list = playlistId;
    } else if (videoId) {
      playerOptions.videoId = videoId;
    }

    try {
      playerRef.current = new window.YT.Player(playerContainerId, playerOptions);
    } catch (err) {
      console.error('YT.Player 생성 예외:', err);
    }
  }, [youtubeUrl]);

  // 3. YouTube IFrame API 스크립트 로드 및 Polling 보장 (타이밍 에러 100% 방지)
  useEffect(() => {
    let checkInterval: any = null;

    const loadIframeApi = () => {
      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };

      // 스크립트 준비 상태 100ms 폴링 점검
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          initPlayer();
          clearInterval(checkInterval);
        }
      }, 100);
    };

    loadIframeApi();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [initPlayer]);

  // 4. 스크롤, 터치, 마우스 이동 등 어떠한 행동이든 포착되거나 진입 1초 후 지연 자동 오디오 언락
  useEffect(() => {
    const unlockYouTubeAudio = () => {
      if (!playerRef.current) return;

      try {
        if (typeof playerRef.current.unMute === 'function') {
          playerRef.current.unMute();
          playerRef.current.setVolume(100);
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {
        console.warn('유튜브 음소거 해제 시도:', e);
      }
    };

    // 진입 1초 뒤 및 2초 뒤 자동으로 소리 켜기 재생 시도
    const timer1 = setTimeout(unlockYouTubeAudio, 1000);
    const timer2 = setTimeout(unlockYouTubeAudio, 2000);

    const events = [
      'scroll',
      'wheel',
      'click',
      'touchstart',
      'touchmove',
      'touchend',
      'mousedown',
      'mousemove',
      'pointerdown',
      'pointermove',
      'keydown',
    ];

    // window 및 document 양쪽 레벨에 touchstart, pointerdown, click 등 전방위 이벤트 바인딩
    events.forEach(event => {
      window.addEventListener(event, unlockYouTubeAudio, { passive: true });
      document.addEventListener(event, unlockYouTubeAudio, { passive: true });
    });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      events.forEach(event => {
        window.removeEventListener(event, unlockYouTubeAudio);
        document.removeEventListener(event, unlockYouTubeAudio);
      });
    };
  }, []);

  // 5. 토글 재생/정지
  const togglePlay = () => {
    if (!playerRef.current) {
      initPlayer();
      return;
    }

    try {
      playerRef.current.unMute();
      playerRef.current.setVolume(100);

      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('유튜브 재생 토글 실패:', e);
    }
  };

  // 6. 새로운 URL 저장
  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    const { videoId, playlistId } = parseYouTubeUrl(trimmed);
    if (!videoId && !playlistId) {
      alert('유효한 유튜브 / 유튜브 뮤직 링크를 입력해주세요.');
      return;
    }

    setYoutubeUrl(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);
    setShowSettings(false);
  };

  return (
    <>
      {/* 가시적인 오프스크린 Iframe 컨테이너 */}
      <div
        className="fixed -top-[9999px] -left-[9999px] w-[200px] h-[200px] opacity-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div id={playerContainerId} />
      </div>

      {/* 플로팅 음악 토글 버튼 */}
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
        {/* 메인 재생/정지 토글 버튼 */}
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
          title={isPlaying ? '음악 정지' : '음악 재생'}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 iphone16:w-4 iphone16:h-4 text-white" />
          ) : (
            <Play className="w-5 h-5 ml-0.5 iphone16:w-4 iphone16:h-4 text-white" />
          )}
        </Button>

        {/* 링크 설정 버튼 (미노출 처리) */}
        <Button
          onClick={() => setShowSettings(prev => !prev)}
          variant="outline"
          size="icon"
          className={cn(
            'hidden',
            'w-8 h-8 rounded-full bg-bg-secondary/80 backdrop-blur border-white/20',
            'hover:bg-bg-tertiary text-text-muted hover:text-text-primary shadow',
            'transition-all duration-200 opacity-80 hover:opacity-100'
          )}
          aria-label="유튜브 링크 설정"
          title="유튜브 뮤직 링크 변경"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* 링크 입력 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-secondary border border-white/10 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-text-primary">YouTube Music 링크 설정</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUrl} className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1 font-medium">
                  유튜브 또는 유튜브 뮤직 URL 입력
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 bg-bg-tertiary text-text-primary border border-white/10 rounded-xl text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="text-xs text-text-muted space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="font-semibold text-text-primary">💡 안내</p>
                <p>• YouTube Music 및 일반 유튜브 곡/재생목록 링크가 지원됩니다.</p>
                <p>• 재생 버튼 하나로 언제든지 음악을 재생/정지할 수 있습니다.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowSettings(false)}
                  className="text-sm"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  적용하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default YouTubeFloatingPlayer;
