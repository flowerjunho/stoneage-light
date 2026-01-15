import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  ListMusic,
  X,
  Loader2,
} from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { getCoverUrl } from '@/services/musicApi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MusicPlayer: React.FC = () => {
  const {
    currentTrack,
    playlist,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    isPlayerVisible,
    toggle,
    next,
    previous,
    seek,
    play,
    hidePlayer,
  } = useMusicPlayer();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const playlistRef = useRef<HTMLDivElement>(null);

  // Progress bar 클릭/드래그 처리
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * duration);
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          if (currentTrack) {
            e.preventDefault();
            toggle();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey && currentTrack) {
            e.preventDefault();
            seek(Math.max(0, currentTime - 10));
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey && currentTrack) {
            e.preventDefault();
            seek(Math.min(duration, currentTime + 10));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, toggle, seek, currentTime, duration]);

  // 플레이리스트 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (playlistRef.current && !playlistRef.current.contains(e.target as Node)) {
        setShowPlaylist(false);
      }
    };

    if (showPlaylist) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPlaylist]);

  if (!isPlayerVisible || !currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Main Player */}
      <div className="fixed left-0 right-0 bottom-0 z-50">
        <div className="bg-bg-secondary/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.3)]">
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="absolute top-0 left-0 right-0 h-1 bg-white/10 cursor-pointer group"
            onClick={handleProgressClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={handleProgressDrag}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div
              className="h-full bg-gradient-to-r from-accent to-amber-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full shadow-lg
                         opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* Content */}
          <div className="p-2 md:p-3">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Album Art */}
              <div className="relative flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-bg-tertiary">
                {currentTrack.coverUrl ? (
                  <img
                    src={getCoverUrl(currentTrack.coverUrl)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-purple-500/20">
                    <Music className="w-5 h-5 text-accent" />
                  </div>
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {currentTrack.artist || '알 수 없는 아티스트'}
                </p>
              </div>

              {/* Controls - 항상 보이게 */}
              <div className="flex items-center gap-1">
                {/* Previous */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previous}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                {/* Play/Pause */}
                <Button
                  variant="default"
                  size="icon"
                  onClick={toggle}
                  disabled={isLoading}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-accent hover:bg-accent-hover"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>

                {/* Next */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={next}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                {/* Playlist toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className={cn(
                    'w-8 h-8 rounded-full',
                    showPlaylist && 'bg-accent/20 text-accent'
                  )}
                >
                  <ListMusic className="w-4 h-4" />
                </Button>

                {/* Close */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={hidePlayer}
                  className="w-8 h-8 rounded-full text-text-muted hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Popup */}
        {showPlaylist && (
          <div
            ref={playlistRef}
            className="absolute bottom-full right-2 md:right-4 mb-2 w-64 max-h-64
                       bg-bg-secondary/95 backdrop-blur-2xl border border-white/10
                       rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/10">
              <h4 className="text-xs font-semibold text-text-primary">
                재생목록 ({playlist.length}곡)
              </h4>
            </div>
            <div className="overflow-y-auto max-h-52">
              {playlist.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => {
                    play(track);
                    setShowPlaylist(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-left',
                    'transition-colors hover:bg-white/5',
                    track.id === currentTrack?.id && 'bg-accent/10'
                  )}
                >
                  <span className="w-4 text-center text-[10px] text-text-muted">
                    {track.id === currentTrack?.id && isPlaying ? (
                      <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <p
                    className={cn(
                      'flex-1 text-xs truncate',
                      track.id === currentTrack?.id
                        ? 'text-accent font-semibold'
                        : 'text-text-primary'
                    )}
                  >
                    {track.title}{track.artist ? ` - ${track.artist}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MusicPlayer;
