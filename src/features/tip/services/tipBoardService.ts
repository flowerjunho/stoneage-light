// 팁 게시글 타입 정의
export interface TipPost {
  id: number;
  author: string;
  title: string;
  content: string; // HTML content from Tiptap
  images: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

// 페이지네이션 정보
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

// 게시글 목록 조회 결과
export interface TipPostListResult {
  posts: TipPost[];
  pagination: Pagination;
}

// API 서버 URL
const API_URL = import.meta.env.VITE_API_URL;

// 게시글 목록 조회 (페이지네이션 + 검색)
export async function getTipPosts(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<TipPostListResult> {
  try {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search && search.trim()) {
      params.set('search', search.trim());
    }

    const response = await fetch(`${API_URL}/board/posts?${params.toString()}`);

    if (!response.ok) {
      throw new Error('게시글 목록 조회 실패');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '게시글 목록 조회 실패');
    }

    return {
      posts: data.data.posts || [],
      pagination: data.data.pagination,
    };
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error);
    throw error;
  }
}

// 게시글 상세 조회
export async function getTipPost(postId: number): Promise<TipPost | null> {
  try {
    const response = await fetch(`${API_URL}/board/posts/${postId}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('게시글 조회 실패');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '게시글 조회 실패');
    }

    return data.data;
  } catch (error) {
    console.error('게시글 조회 실패:', error);
    throw error;
  }
}

// 게시글 등록
export async function createTipPost(
  author: string,
  password: string,
  title: string,
  content: string,
  images: string[] = []
): Promise<TipPost> {
  try {
    const response = await fetch(`${API_URL}/board/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author,
        password,
        title,
        content,
        images,
      }),
    });

    if (!response.ok) {
      throw new Error('게시글 등록 실패');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '게시글 등록 실패');
    }

    return data.data;
  } catch (error) {
    console.error('게시글 등록 실패:', error);
    throw error;
  }
}

// 비밀번호 확인
export async function verifyPassword(
  postId: number,
  password: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/board/posts/${postId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('비밀번호 확인 실패:', error);
    return false;
  }
}

// 게시글 삭제 (비밀번호 확인)
export async function deleteTipPost(
  postId: number,
  password: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/board/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '게시글 삭제 실패');
    }

    return true;
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    throw error;
  }
}

// 에디터 이미지 업로드
export async function uploadImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/board/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('이미지 업로드 실패');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '이미지 업로드 실패');
    }

    // 전체 URL 반환
    return `${API_URL}${data.data.path}`;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
}

// 이미지 URL을 전체 경로로 변환
export function getImageUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${API_URL}${path}`;
}

// 관리자 강제 삭제 (비밀번호 불필요)
export async function forceDeleteTipPost(postId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/board/posts/${postId}/force`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '게시글 삭제 실패');
    }

    return true;
  } catch (error) {
    console.error('게시글 강제 삭제 실패:', error);
    throw error;
  }
}
