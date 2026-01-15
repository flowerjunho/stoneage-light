/**
 * 음악 API 서비스
 * 백엔드 API와 통신하는 함수들을 제공합니다.
 */

// API 기본 URL (환경변수에서 가져오거나 기본값 사용)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// ============================================
// Types
// ============================================

export interface Track {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  coverUrl: string | null;
  streamUrl: string;
  isPublic: boolean;
  playCount: number;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  trackCount: number;
  totalDuration: number;
  tracks?: Track[];
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// API Functions
// ============================================

/**
 * 트랙 목록 조회
 */
export async function getTracks(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<PaginatedData<Track>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.sort) searchParams.set('sort', params.sort);
  if (params?.order) searchParams.set('order', params.order);

  const response = await fetch(`${API_BASE_URL}/api/music/tracks?${searchParams}`);
  const result: ApiResponse<PaginatedData<Track>> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || '트랙 목록을 불러올 수 없습니다.');
  }

  return result.data;
}

/**
 * 트랙 상세 조회
 */
export async function getTrack(trackId: string): Promise<Track> {
  const response = await fetch(`${API_BASE_URL}/api/music/tracks/${trackId}`);
  const result: ApiResponse<Track> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || '트랙을 찾을 수 없습니다.');
  }

  return result.data;
}

/**
 * 스트리밍 URL 생성
 */
export function getStreamUrl(trackId: string): string {
  return `${API_BASE_URL}/api/music/stream/${trackId}`;
}

/**
 * 커버 이미지 URL 생성
 */
export function getCoverUrl(coverPath: string | null): string {
  if (!coverPath) return '';
  if (coverPath.startsWith('http')) return coverPath;
  return `${API_BASE_URL}${coverPath}`;
}

/**
 * 플레이리스트 목록 조회
 */
export async function getPlaylists(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedData<Playlist>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const response = await fetch(`${API_BASE_URL}/api/music/playlists?${searchParams}`);
  const result: ApiResponse<PaginatedData<Playlist>> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || '플레이리스트를 불러올 수 없습니다.');
  }

  return result.data;
}

/**
 * 플레이리스트 상세 조회 (트랙 포함)
 */
export async function getPlaylist(playlistId: string): Promise<Playlist> {
  const response = await fetch(`${API_BASE_URL}/api/music/playlists/${playlistId}`);
  const result: ApiResponse<Playlist> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || '플레이리스트를 찾을 수 없습니다.');
  }

  return result.data;
}

/**
 * 재생 횟수 증가
 */
export async function incrementPlayCount(trackId: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/music/tracks/${trackId}/play`, {
      method: 'POST',
    });
    const result: ApiResponse<{ playCount: number }> = await response.json();

    if (result.success && result.data) {
      return result.data.playCount;
    }
    return 0;
  } catch {
    // 재생 횟수 증가 실패해도 음악은 계속 재생
    console.warn('재생 횟수 업데이트 실패');
    return 0;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * 초를 MM:SS 형식으로 변환
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 총 재생 시간을 "X시간 Y분" 형식으로 변환
 */
export function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
}
