import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import TipEditor from './TipEditor';
import type { TipPost } from '../services/tipBoardService';
import {
  getTipPosts,
  getTipPost,
  createTipPost,
  deleteTipPost,
  forceDeleteTipPost,
} from '../services/tipBoardService';

type ViewMode = 'list' | 'detail' | 'create';

const MyTipBoard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 상태 관리
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [error, setError] = useState<string | null>(null);

  // 선택된 게시글 ID
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  // 게시글 작성 폼
  const [formAuthor, setFormAuthor] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  // 삭제 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePostId, setDeletePostId] = useState<number | null>(null);

  // 검색
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // 관리자 모드 (localStorage의 ADMIN_ID_STONE 키 확인)
  const isAdminMode = localStorage.getItem('ADMIN_ID_STONE') !== null;

  // 무한 스크롤
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 검색창 ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 게시글 목록 조회 (Infinite Query)
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPosts,
  } = useInfiniteQuery({
    queryKey: ['tipPosts', activeSearch],
    queryFn: ({ pageParam = 1 }) => getTipPosts(pageParam, 30, activeSearch || undefined),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // 게시글 상세 조회 (캐싱)
  const { data: selectedPost, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['tipPost', selectedPostId],
    queryFn: () => getTipPost(selectedPostId!),
    enabled: !!selectedPostId && viewMode === 'detail',
    staleTime: 1000 * 60 * 5, // 5분간 캐시
  });

  // 게시글 작성 Mutation
  const createMutation = useMutation({
    mutationFn: (data: { author: string; password: string; title: string; content: string }) =>
      createTipPost(data.author, data.password, data.title, data.content),
    onSuccess: () => {
      // 폼 초기화
      setFormAuthor('');
      setFormPassword('');
      setFormTitle('');
      setFormContent('');
      setViewMode('list');
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['tipPosts'] });
    },
    onError: () => {
      setError('게시글 작성에 실패했습니다.');
    },
  });

  // 게시글 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: number) => {
      if (isAdminMode) {
        return forceDeleteTipPost(postId);
      }
      return deleteTipPost(postId, deletePassword);
    },
    onSuccess: () => {
      setShowDeleteModal(false);
      setDeletePassword('');
      setDeletePostId(null);

      if (viewMode === 'detail') {
        setViewMode('list');
        setSelectedPostId(null);
      }

      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['tipPosts'] });
      // 상세 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['tipPost'] });
    },
    onError: () => {
      setError(isAdminMode ? '삭제에 실패했습니다.' : '비밀번호가 일치하지 않거나 삭제에 실패했습니다.');
    },
  });

  // 모든 페이지의 게시글을 하나의 배열로 합치기
  const posts = postsData?.pages.flatMap(page => page.posts) ?? [];
  const pagination = postsData?.pages[postsData.pages.length - 1]?.pagination;

  // 무한 스크롤 옵저버 설정
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const view = searchParams.get('view') as ViewMode | null;
    const postId = searchParams.get('postId');

    if (view === 'detail' && postId) {
      setSelectedPostId(Number(postId));
      setViewMode('detail');
    } else if (view === 'create') {
      setViewMode('create');
    } else {
      setViewMode('list');
      setSelectedPostId(null);
    }
  }, [searchParams]);

  // 게시글 상세 조회 (URL 히스토리 추가)
  const handleViewPost = (postId: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', 'detail');
    newParams.set('postId', String(postId));
    navigate(`?${newParams.toString()}`);
  };

  // 게시글 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formAuthor.trim() || !formPassword.trim() || !formTitle.trim() || !formContent.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setError(null);
    createMutation.mutate({
      author: formAuthor,
      password: formPassword,
      title: formTitle,
      content: formContent,
    });
  };

  // 디바운스된 검색 (0.5초)
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  // 슬래시(/) 키로 검색창 포커스
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 중일 때는 무시
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.key === '/' && viewMode === 'list') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // 삭제 모달 열기
  const handleOpenDeleteModal = (postId: number) => {
    setDeletePostId(postId);
    setDeletePassword('');
    setShowDeleteModal(true);
  };

  // 게시글 삭제
  const handleDelete = () => {
    if (!deletePostId) return;
    if (!isAdminMode && !deletePassword.trim()) return;

    setError(null);
    deleteMutation.mutate(deletePostId);
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPostId(null);
    navigate('?tab=mytip');
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 목록 뷰
  const renderListView = () => (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">나만의 팁</h3>
        <button
          onClick={() => setViewMode('create')}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          글쓰기
        </button>
      </div>

      {/* 검색 바 */}
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="제목, 내용, 작성자 검색..."
          className="w-full px-4 py-2.5 pl-10 pr-16 bg-bg-secondary border border-border rounded-lg
                     text-text-primary placeholder-text-muted
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                     transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery ? (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded border border-border">
            /
          </span>
        )}
      </div>

      {/* 검색 결과 안내 */}
      {activeSearch && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>"{activeSearch}" 검색 결과</span>
          {pagination && <span className="text-text-muted">({pagination.totalCount}개)</span>}
          <button
            onClick={handleClearSearch}
            className="text-accent hover:underline"
          >
            전체 보기
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* 로딩 */}
      {isLoadingPosts && posts.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      )}

      {/* 게시글 목록 */}
      {!isLoadingPosts && posts.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <svg className="w-16 h-16 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>아직 등록된 게시글이 없습니다.</p>
          <p className="text-sm mt-2">첫 번째 팁을 작성해보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: TipPost) => (
            <div
              key={post.id}
              onClick={() => handleViewPost(post.id)}
              className="bg-bg-secondary border border-border rounded-xl p-4 cursor-pointer
                         hover:border-accent/50 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.views}
                    </span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 더 보기 로딩 */}
      <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-text-muted text-sm">모든 게시글을 불러왔습니다.</p>
        )}
      </div>
    </div>
  );

  // 상세 뷰
  const renderDetailView = () => {
    if (isLoadingDetail) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      );
    }

    if (!selectedPost) return null;

    return (
      <div className="space-y-4">
        {/* 뒤로가기 */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>

        {/* 게시글 내용 */}
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
          {/* 헤더 */}
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary mb-3">{selectedPost.title}</h2>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {selectedPost.author}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  조회 {selectedPost.views}
                </span>
                <span>{formatDate(selectedPost.createdAt)}</span>
              </div>
              <button
                onClick={() => handleOpenDeleteModal(selectedPost.id)}
                className="px-3 py-1.5 text-sm text-red-500 border border-red-500/30 rounded-lg
                           hover:bg-red-500/10 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div
            className="p-4 prose prose-sm dark:prose-invert max-w-none
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2
              [&_p]:mb-3 [&_p]:text-text-primary
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
              [&_li]:mb-1
              [&_blockquote]:border-l-4 [&_blockquote]:border-accent
              [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary
              [&_pre]:bg-bg-tertiary [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto
              [&_code]:bg-bg-tertiary [&_code]:px-1 [&_code]:rounded [&_code]:text-sm
              [&_hr]:border-border [&_hr]:my-4
              [&_mark]:bg-yellow-300 [&_mark]:dark:bg-yellow-500/50"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(selectedPost.content),
            }}
          />
        </div>
      </div>
    );
  };

  // 작성 뷰
  const renderCreateView = () => (
    <div className="space-y-4">
      {/* 뒤로가기 */}
      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        목록으로
      </button>

      <h3 className="text-lg font-bold text-text-primary">새 글 작성</h3>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 작성자 & 비밀번호 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">작성자</label>
            <input
              type="text"
              value={formAuthor}
              onChange={e => setFormAuthor(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg
                         text-text-primary placeholder-text-muted
                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                         transition-colors"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">비밀번호</label>
            <input
              type="password"
              value={formPassword}
              onChange={e => setFormPassword(e.target.value)}
              placeholder="삭제 시 필요한 비밀번호"
              className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg
                         text-text-primary placeholder-text-muted
                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                         transition-colors"
            />
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">제목</label>
          <input
            type="text"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg
                       text-text-primary placeholder-text-muted
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                       transition-colors"
            maxLength={100}
          />
        </div>

        {/* 에디터 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">내용</label>
          <TipEditor
            content={formContent}
            onChange={setFormContent}
            placeholder="팁을 공유해주세요..."
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleBackToList}
            className="px-6 py-2.5 text-text-secondary border border-border rounded-lg
                       hover:bg-bg-secondary transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2.5 bg-accent text-white rounded-lg
                       hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {createMutation.isPending && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            등록하기
          </button>
        </div>
      </form>
    </div>
  );

  // 삭제 모달
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-bg-primary border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
          <h3 className="text-lg font-bold text-text-primary mb-4">게시글 삭제</h3>

          {isAdminMode ? (
            <p className="text-red-500 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              관리자 모드: 비밀번호 없이 즉시 삭제됩니다.
            </p>
          ) : (
            <p className="text-text-secondary mb-4">
              게시글을 삭제하시려면 비밀번호를 입력해주세요.
            </p>
          )}

          {error && (
            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {!isAdminMode && (
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-4 py-2.5 mb-4 bg-bg-secondary border border-border rounded-lg
                         text-text-primary placeholder-text-muted
                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                         transition-colors"
            />
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword('');
                setError(null);
              }}
              className="px-4 py-2 text-text-secondary border border-border rounded-lg
                         hover:bg-bg-secondary transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending || (!isAdminMode && !deletePassword.trim())}
              className="px-4 py-2 bg-red-500 text-white rounded-lg
                         hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {deleteMutation.isPending && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isAdminMode ? '강제 삭제' : '삭제'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {viewMode === 'create' && renderCreateView()}
      {renderDeleteModal()}
    </div>
  );
};

export default MyTipBoard;
