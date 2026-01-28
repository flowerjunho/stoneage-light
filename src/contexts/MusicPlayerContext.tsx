import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Track } from '@/services/musicApi';
import { getStreamUrl, getCoverUrl, incrementPlayCount, getTracks } from '@/services/musicApi';

// ============================================
// Types
// ============================================

type RepeatMode = 'none' | 'all' | 'one';

const PLAYLIST_ORDER_KEY = 'MUSIC_PLAYLIST_ORDER';

interface MusicPlayerContextType {
  // State
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isPlayerVisible: boolean;

  // Actions
  play: (track?: Track) => Promise<void>;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  loadPlaylist: (tracks: Track[], startIndex?: number) => void;
  clearPlaylist: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  showPlayer: () => void;
  hidePlayer: () => void;
  reorderPlaylist: (fromIndex: number, toIndex: number) => void;
}

// ============================================
// Context
// ============================================

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

// ============================================
// Provider
// ============================================

interface MusicPlayerProviderProps {
  children: React.ReactNode;
}

export const MusicPlayerProvider: React.FC<MusicPlayerProviderProps> = ({
  children,
}) => {
  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [originalPlaylist, setOriginalPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('MUSIC_PLAYER_VOLUME');
    return saved ? parseFloat(saved) : 0.7;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffled, setIsShuffled] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  // Refs for callbacks to avoid stale closures
  const repeatModeRef = useRef(repeatMode);
  const playlistRef = useRef(playlist);
  const currentTrackRef = useRef(currentTrack);
  const nextRef = useRef<() => void>(() => {});
  const previousRef = useRef<() => void>(() => {});
  const toggleRef = useRef<() => void>(() => {});

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // MediaSession 핸들러 설정 (iOS 잠금화면 이전/다음 버튼 노출)
  // 주의: iOS에서 seekbackward/seekforward를 등록하면 이전/다음 버튼이
  // seek 버튼으로 대체되므로 등록하지 않음
  const setupMediaSessionHandlers = useCallback(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => toggleRef.current());
      navigator.mediaSession.setActionHandler('pause', () => toggleRef.current());
      navigator.mediaSession.setActionHandler('previoustrack', () => previousRef.current());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextRef.current());
    } catch (e) {
      console.warn('MediaSession 핸들러 등록 실패:', e);
    }
  }, []);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.preload = 'metadata';

    const audio = audioRef.current;

    // Event listeners
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      // iOS Safari: play 이벤트 시점에 MediaSession 핸들러를 (재)등록해야
      // 잠금화면/컨트롤센터에 이전/다음 버튼이 노출됨
      setupMediaSessionHandlers();
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      console.error('오디오 로딩 실패');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save volume to localStorage
  useEffect(() => {
    localStorage.setItem('MUSIC_PLAYER_VOLUME', String(volume));
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 앱 시작 시 트랙 목록 불러오기 (react-query 사용)
  const { data: tracksData } = useQuery({
    queryKey: ['music', 'tracks'],
    queryFn: () => getTracks({ limit: 100 }),
  });

  // 트랙 데이터가 로드되면 플레이리스트 설정 (로컬스토리지 순서 적용)
  useEffect(() => {
    if (tracksData?.items && tracksData.items.length > 0 && playlist.length === 0) {
      const tracks = tracksData.items;

      // 로컬스토리지에서 저장된 순서 불러오기
      const savedOrder = localStorage.getItem(PLAYLIST_ORDER_KEY);
      let orderedTracks = tracks;

      if (savedOrder) {
        try {
          const orderIds: string[] = JSON.parse(savedOrder);
          // 저장된 순서대로 정렬, 새로운 트랙은 끝에 추가
          const orderedById = new Map(orderIds.map((id, index) => [id, index]));
          orderedTracks = [...tracks].sort((a, b) => {
            const aOrder = orderedById.get(a.id) ?? Infinity;
            const bOrder = orderedById.get(b.id) ?? Infinity;
            return aOrder - bOrder;
          });
        } catch {
          // 파싱 실패 시 원본 순서 사용
          orderedTracks = tracks;
        }
      }

      setPlaylist(orderedTracks);
      setOriginalPlaylist(orderedTracks);
      setCurrentTrack(orderedTracks[0]);
      setIsPlayerVisible(true);
    }
  }, [tracksData, playlist.length]);

  // ============================================
  // Actions
  // ============================================

  const play = useCallback(async (track?: Track) => {
    if (!audioRef.current) return;

    const targetTrack = track || currentTrack;
    if (!targetTrack) return;

    // src가 없거나 다른 트랙이면 새로 설정
    const needsNewSource = !audioRef.current.src || (track && track.id !== currentTrack?.id);

    if (needsNewSource) {
      setIsLoading(true);
      setCurrentTrack(targetTrack);
      const streamUrl = getStreamUrl(targetTrack.id);
      console.log('스트림 URL:', streamUrl);
      audioRef.current.src = streamUrl;
      audioRef.current.load(); // 명시적으로 로드

      // 재생 횟수 증가 (비동기, 실패해도 무시)
      incrementPlayCount(targetTrack.id);

      // 플레이어 표시
      setIsPlayerVisible(true);
    }

    try {
      console.log('재생 시도... src:', audioRef.current.src);
      await audioRef.current.play();
      console.log('재생 성공');
    } catch (error) {
      console.error('재생 실패:', error);
      setIsLoading(false);
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (currentTrack) {
      // src가 설정되지 않았으면 현재 트랙으로 설정
      if (!audioRef.current?.src) {
        play(currentTrack);
      } else {
        play();
      }
    }
  }, [isPlaying, pause, play, currentTrack]);

  const next = useCallback(() => {
    if (playlist.length === 0 || !currentTrack) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    let nextIndex: number;

    if (currentIndex === playlist.length - 1) {
      // 마지막 곡
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return;
      }
    } else {
      nextIndex = currentIndex + 1;
    }

    play(playlist[nextIndex]);
  }, [playlist, currentTrack, repeatMode, play]);

  const previous = useCallback(() => {
    if (!audioRef.current) return;

    // 3초 이상 재생했으면 처음으로
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (playlist.length === 0 || !currentTrack) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    let prevIndex: number;

    if (currentIndex === 0) {
      if (repeatMode === 'all') {
        prevIndex = playlist.length - 1;
      } else {
        audioRef.current.currentTime = 0;
        return;
      }
    } else {
      prevIndex = currentIndex - 1;
    }

    play(playlist[prevIndex]);
  }, [playlist, currentTrack, repeatMode, play]);

  // Handle track ended - must be after next is defined
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatModeRef.current === 'all' || playlistRef.current.length > 1) {
        next();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [next]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // Refs 갱신 - MediaSession 핸들러가 항상 최신 함수를 참조하도록
  useEffect(() => { nextRef.current = next; }, [next]);
  useEffect(() => { previousRef.current = previous; }, [previous]);
  useEffect(() => { toggleRef.current = toggle; }, [toggle]);

  // MediaSession 메타데이터 업데이트 (트랙 변경 시)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist || '알 수 없는 아티스트',
      album: 'StoneAge Light',
      artwork: currentTrack.coverUrl
        ? [{ src: getCoverUrl(currentTrack.coverUrl), sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });

    // 트랙 변경 시에도 핸들러 재설정 (iOS 안정성)
    setupMediaSessionHandlers();
  }, [currentTrack, setupMediaSessionHandlers]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const loadPlaylist = useCallback((tracks: Track[], startIndex = 0) => {
    setOriginalPlaylist(tracks);
    setPlaylist(tracks);
    setIsShuffled(false);

    if (tracks.length > 0) {
      play(tracks[startIndex]);
    }
  }, [play]);

  const clearPlaylist = useCallback(() => {
    pause();
    setPlaylist([]);
    setOriginalPlaylist([]);
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
  }, [pause]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      if (!prev) {
        // 셔플 켜기
        const shuffled = [...playlist].sort(() => Math.random() - 0.5);
        // 현재 곡을 맨 앞으로
        if (currentTrack) {
          const currentIndex = shuffled.findIndex((t) => t.id === currentTrack.id);
          if (currentIndex > 0) {
            shuffled.splice(currentIndex, 1);
            shuffled.unshift(currentTrack);
          }
        }
        setPlaylist(shuffled);
      } else {
        // 셔플 끄기 - 원본 순서로 복원
        setPlaylist(originalPlaylist);
      }
      return !prev;
    });
  }, [playlist, currentTrack, originalPlaylist]);

  const showPlayer = useCallback(() => {
    setIsPlayerVisible(true);
  }, []);

  const hidePlayer = useCallback(() => {
    setIsPlayerVisible(false);
  }, []);

  const reorderPlaylist = useCallback((fromIndex: number, toIndex: number) => {
    setPlaylist((prev) => {
      const newPlaylist = [...prev];
      const [removed] = newPlaylist.splice(fromIndex, 1);
      newPlaylist.splice(toIndex, 0, removed);

      // 로컬스토리지에 순서 저장
      const orderIds = newPlaylist.map((track) => track.id);
      localStorage.setItem(PLAYLIST_ORDER_KEY, JSON.stringify(orderIds));

      return newPlaylist;
    });

    // originalPlaylist도 업데이트 (셔플 해제 시 적용되도록)
    setOriginalPlaylist((prev) => {
      const newPlaylist = [...prev];
      const [removed] = newPlaylist.splice(fromIndex, 1);
      newPlaylist.splice(toIndex, 0, removed);
      return newPlaylist;
    });
  }, []);

  // ============================================
  // Context Value
  // ============================================

  const value: MusicPlayerContextType = {
    currentTrack,
    playlist,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isLoading,
    repeatMode,
    isShuffled,
    isPlayerVisible,
    play,
    pause,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    loadPlaylist,
    clearPlaylist,
    toggleRepeat,
    toggleShuffle,
    showPlayer,
    hidePlayer,
    reorderPlaylist,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useMusicPlayer = (): MusicPlayerContextType => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
};
