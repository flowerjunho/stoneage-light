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
import { getStreamUrl, incrementPlayCount, getTracks } from '@/services/musicApi';

// ============================================
// Types
// ============================================

type RepeatMode = 'none' | 'all' | 'one';

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

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

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
    const handlePlay = () => setIsPlaying(true);
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

  // 트랙 데이터가 로드되면 플레이리스트 설정
  useEffect(() => {
    if (tracksData?.items && tracksData.items.length > 0 && playlist.length === 0) {
      setPlaylist(tracksData.items);
      setOriginalPlaylist(tracksData.items);
      setCurrentTrack(tracksData.items[0]);
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
