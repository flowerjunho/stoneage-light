import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ThemeToggle from '@/shared/components/layout/ThemeToggle';

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Types
interface Applicant {
  name: string;
  message?: string;
  appliedAt: string;
}

interface ShareItem {
  id: number;
  title: string;
  category: string;
  tradeType: '나눔' | '판매';
  price: number | null;
  currency: '스톤' | '금화' | null;
  content: string;
  images: string[];
  author: string;
  completed: boolean;
  receiver: string | null;
  applicants: Applicant[];
  applicantCount?: number;
  views: number;
  likes: number;
  liked?: boolean;
  createdAt: string;
  updatedAt: string;
}


type Category = '아이템' | '페트' | '재화' | '기타';
type TradeType = '나눔' | '판매';
type Currency = '스톤' | '금화';
type TradeFilter = '' | '나눔' | '판매';
type ViewMode = 'list' | 'detail' | 'create' | 'edit';

const CATEGORIES: Category[] = ['아이템', '페트', '재화', '기타'];
const TRADE_TYPES: TradeType[] = ['판매', '나눔'];
const CURRENCIES: Currency[] = ['스톤', '금화'];

// API Base URL
const serverUrl = import.meta.env.VITE_API_URL;

// Helper function to get full image URL
const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${serverUrl}${url}`;
};

// Category badge color
const getCategoryColor = (category: string) => {
  switch (category) {
    case '페트':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case '아이템':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case '재화':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Trade type badge color
const getTradeTypeColor = (tradeType: string) => {
  return tradeType === '판매'
    ? 'bg-green-500 text-white'
    : 'bg-pink-500 text-white';
};

// Item Card Component with hover image preview
const ItemCard: React.FC<{
  item: ShareItem;
  onClick: () => void;
  onLike: (e: React.MouseEvent) => void;
  isLiking?: boolean;
}> = ({ item, onClick, onLike, isLiking }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!item.images || item.images.length <= 1) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const imageCount = item.images.length;
    const newIndex = Math.min(Math.floor(percentage * imageCount), imageCount - 1);

    if (newIndex !== currentImageIndex) {
      setCurrentImageIndex(newIndex);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  // 판매/나눔에 따른 테두리 색상
  const borderColor = item.tradeType === '판매'
    ? 'border-green-500/50 hover:border-green-400'
    : 'border-pink-500/50 hover:border-pink-400';

  return (
    <div
      onClick={onClick}
      className={`bg-bg-secondary rounded-xl border-2 ${borderColor} overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
        item.completed ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      <div
        ref={imageContainerRef}
        className="aspect-square bg-bg-tertiary relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {item.images && item.images.length > 0 ? (
          <img
            src={getImageUrl(item.images[currentImageIndex])}
            alt={item.title}
            className="w-full h-full object-cover transition-opacity duration-150"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-text-muted">
            {item.category === '페트' ? '🐾' : item.category === '재화' ? '💎' : '📦'}
          </div>
        )}
        {item.completed && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">완료</span>
          </div>
        )}
        {/* Trade type badge */}
        {item.tradeType && (
          <div className="absolute top-2 left-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTradeTypeColor(item.tradeType)}`}>
              {item.tradeType === '판매' ? '💰 판매' : '🎁 나눔'}
            </span>
          </div>
        )}
        {/* Image indicators */}
        {item.images && item.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {item.images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(item.category)}`}
          >
            {item.category}
          </span>
          {item.completed && item.receiver && (
            <span className="text-xs text-green-500 truncate">→ {item.receiver}</span>
          )}
        </div>
        <h3 className="font-medium text-text-primary truncate mb-1">{item.title}</h3>

        {/* Price display for 판매 */}
        {item.tradeType === '판매' && item.price != null && item.currency && (
          <p className={`text-sm font-bold mb-1 ${item.currency === '금화' ? 'text-yellow-400' : 'text-gray-200'}`}>
            {item.currency === '금화' ? '💰 금화: ' : '💵 스톤: '}
            {item.price.toLocaleString()}
          </p>
        )}
        {item.tradeType === '나눔' && (
          <p className="text-sm font-bold text-pink-400 mb-1">🎁 무료 나눔</p>
        )}

        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>{item.author}</span>
          <span className="flex items-center gap-2">
            <span>👁 {item.views}</span>
            <button
              onClick={onLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                item.liked
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'hover:bg-blue-500/10 text-text-secondary hover:text-blue-400'
              } disabled:opacity-50`}
            >
              <span className="text-base">{item.liked ? '👍' : '👍🏻'}</span>
              <span>{item.likes ?? 0}</span>
            </button>
            <span>🙋 {item.applicantCount ?? 0}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// API Functions
const fetchItemsApi = async (params: {
  page: number;
  limit: number;
  category?: string;
  tradeType?: string;
  status?: string;
  search?: string;
}) => {
  const searchParams = new URLSearchParams();
  searchParams.append('page', params.page.toString());
  searchParams.append('limit', params.limit.toString());
  if (params.category) searchParams.append('category', params.category);
  if (params.tradeType) searchParams.append('tradeType', params.tradeType);
  if (params.status) searchParams.append('status', params.status);
  if (params.search) searchParams.append('search', params.search);

  const response = await fetch(`${serverUrl}/share/items?${searchParams}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch items');

  // API 응답 구조 변환 (shares -> items, totalCount -> totalItems, hasNext/hasPrev 계산)
  const apiData = data.data as { shares: ShareItem[]; pagination: { currentPage: number; totalPages: number; totalCount: number; limit: number } };
  return {
    items: apiData.shares,
    pagination: {
      currentPage: apiData.pagination.currentPage,
      totalPages: apiData.pagination.totalPages,
      totalItems: apiData.pagination.totalCount,
      limit: apiData.pagination.limit,
      hasNext: apiData.pagination.currentPage < apiData.pagination.totalPages,
      hasPrev: apiData.pagination.currentPage > 1,
    },
  };
};

const fetchItemApi = async (id: number, clientId: string) => {
  const response = await fetch(`${serverUrl}/share/items/${id}?clientId=${clientId}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch item');
  return data.data as ShareItem;
};

const createItemApi = async (body: Record<string, unknown>) => {
  const response = await fetch(`${serverUrl}/share/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to create item');
  return data.data;
};

const updateItemApi = async (id: number, body: Record<string, unknown>) => {
  const response = await fetch(`${serverUrl}/share/items/${id}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to update item');
  return data.data;
};

const uploadImageApi = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch(`${serverUrl}/share/upload-image`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to upload image');
  return data.data.url as string;
};

const applyItemApi = async (id: number, body: { name: string; message?: string }) => {
  const response = await fetch(`${serverUrl}/share/items/${id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to apply');
  return data.data;
};

const completeItemApi = async (id: number, receiver: string) => {
  const response = await fetch(`${serverUrl}/share/items/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to complete');
  return data.data;
};

const uncompleteItemApi = async (id: number) => {
  const response = await fetch(`${serverUrl}/share/items/${id}/uncomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to uncomplete');
  return data.data;
};

const drawItemApi = async (id: number) => {
  const response = await fetch(`${serverUrl}/share/items/${id}/draw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to draw');
  return data.data;
};

const deleteItemApi = async (id: number, options: { adminDelete?: boolean; password?: string }) => {
  const response = await fetch(`${serverUrl}/share/items/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete');
  return data.data;
};

const deleteImageApi = async (imageUrl: string) => {
  // URL에서 파일명만 추출 (예: /uploads/share/1234567890-abc123.png -> 1234567890-abc123.png)
  const filename = imageUrl.split('/').pop();
  if (!filename) throw new Error('Invalid image URL');

  const response = await fetch(`${serverUrl}/share/delete-image`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete image');
  return data.data;
};

const verifyPasswordApi = async (id: number, password: string) => {
  const response = await fetch(`${serverUrl}/share/items/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Password verification failed');
  return data.data;
};

const likeItemApi = async (id: number, clientId: string) => {
  const response = await fetch(`${serverUrl}/share/items/${id}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
    },
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Failed to like item');
  return data.data as { likes: number; liked: boolean };
};

const SharePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);

  // URL에서 item 파라미터 읽기
  const itemIdFromUrl = searchParams.get('item');

  // View state - URL 파라미터에 따라 초기값 설정
  const [viewMode, setViewMode] = useState<ViewMode>(() => itemIdFromUrl ? 'detail' : 'list');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(() => itemIdFromUrl ? parseInt(itemIdFromUrl, 10) : null);

  // List filters
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterTradeType, setFilterTradeType] = useState<TradeFilter>('');
  const [filterStatus, setFilterStatus] = useState<string>('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Create/Edit form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('아이템');
  const [formTradeType, setFormTradeType] = useState<TradeType>('판매');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<Currency>('스톤');
  const [formContent, setFormContent] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formAuthor, setFormAuthor] = useState('');
  const [formPassword, setFormPassword] = useState('');

  // Apply form state (나눔 전용)
  const [applyName, setApplyName] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Complete form state
  const [manualReceiver, setManualReceiver] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  // Draw animation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingName, setDrawingName] = useState('');
  const [drawWinner, setDrawWinner] = useState<string | null>(null);

  // Edit state
  const [showEditPasswordForm, setShowEditPasswordForm] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordError, setEditPasswordError] = useState(false);

  // Delete state
  const [showDeletePasswordForm, setShowDeletePasswordForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState(false);

  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Admin check
  const isAdmin = localStorage.getItem('ADMIN_ID_STONE') === 'flowerjunho';

  // Client ID for view count
  const [clientId] = useState(() => {
    let id = localStorage.getItem('SHARE_CLIENT_ID');
    if (!id) {
      id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('SHARE_CLIENT_ID', id);
    }
    return id;
  });

  // Keyboard shortcut for search (/ key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '/' && viewMode === 'list' && isAuthenticated) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isAuthenticated]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // React Query - Items List (uses debounced search query)
  const {
    data: itemsData,
    isLoading,
    isFetching,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['share-items', currentPage, filterCategory, filterTradeType, filterStatus, debouncedSearchQuery],
    queryFn: () =>
      fetchItemsApi({
        page: currentPage,
        limit: 30,
        category: filterCategory || undefined,
        tradeType: filterTradeType || undefined,
        status: filterStatus || undefined,
        search: debouncedSearchQuery || undefined,
      }),
    enabled: isAuthenticated && viewMode === 'list',
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  const items = itemsData?.items ?? [];
  const pagination = itemsData?.pagination ?? null;

  // React Query - Single Item
  const { data: selectedItem } = useQuery({
    queryKey: ['share-item', selectedItemId],
    queryFn: () => fetchItemApi(selectedItemId!, clientId),
    enabled: !!selectedItemId && viewMode === 'detail',
    staleTime: 1000 * 60 * 2, // 2분 캐시
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-items'] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: uploadImageApi,
  });

  const applyMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name: string; message?: string } }) =>
      applyItemApi(id, body),
    onSuccess: () => {
      if (selectedItemId) {
        queryClient.invalidateQueries({ queryKey: ['share-item', selectedItemId] });
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, receiver }: { id: number; receiver: string }) => completeItemApi(id, receiver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-items'] });
      if (selectedItemId) {
        queryClient.invalidateQueries({ queryKey: ['share-item', selectedItemId] });
      }
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: uncompleteItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-items'] });
      if (selectedItemId) {
        queryClient.invalidateQueries({ queryKey: ['share-item', selectedItemId] });
      }
    },
  });

  const drawMutation = useMutation({
    mutationFn: drawItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-items'] });
      if (selectedItemId) {
        queryClient.invalidateQueries({ queryKey: ['share-item', selectedItemId] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, options }: { id: number; options: { adminDelete?: boolean; password?: string } }) =>
      deleteItemApi(id, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-items'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => updateItemApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-items'] });
      if (selectedItemId) {
        queryClient.invalidateQueries({ queryKey: ['share-item', selectedItemId] });
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) => likeItemApi(id, clientId),
    onSuccess: (data, itemId) => {
      // 목록 캐시 업데이트
      queryClient.setQueryData(['share-items', currentPage, filterCategory, filterTradeType, filterStatus, debouncedSearchQuery], (oldData: { items: ShareItem[]; pagination: unknown } | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map(item =>
            item.id === itemId ? { ...item, likes: data.likes, liked: data.liked } : item
          ),
        };
      });
      // 상세 캐시 업데이트
      queryClient.setQueryData(['share-item', itemId], (oldData: ShareItem | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, likes: data.likes, liked: data.liked };
      });
    },
  });

  // Derived loading states from mutations
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const uploadingImage = uploadImageMutation.isPending;
  const isApplying = applyMutation.isPending;
  const isCompleting = completeMutation.isPending || uncompleteMutation.isPending || drawMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // Auth check on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('THEME_TOGGLE_STATE');
    const root = document.documentElement;

    if (savedTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    const authKey = localStorage.getItem('SHARE_AUTH');
    if (authKey === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (viewMode === 'detail' || viewMode === 'edit') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewMode]);

  // Password validation
  const handlePasswordSubmit = () => {
    const correctPassword = '6974';
    if (password === correctPassword) {
      localStorage.setItem('SHARE_AUTH', 'authenticated');
      setIsAuthenticated(true);
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit();
    }
  };

  // View item detail (with query param)
  const handleViewItem = (id: number) => {
    setSelectedItemId(id);
    setViewMode('detail');
    setSearchParams({ item: String(id) });
  };

  // Go back to list
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItemId(null);
    setShowApplyForm(false);
    setShowCompleteForm(false);
    setShowEditPasswordForm(false);
    setEditPassword('');
    setEditPasswordError(false);
    setSearchParams({});
  };

  // Handle edit button click
  const handleEditClick = () => {
    if (isAdmin) {
      // 관리자는 바로 수정 모드로 진입
      enterEditMode();
    } else {
      // 일반 사용자는 비밀번호 확인 필요
      setShowEditPasswordForm(true);
      setEditPassword('');
      setEditPasswordError(false);
    }
  };

  // Verify password and enter edit mode
  const handleEditPasswordSubmit = async () => {
    if (!selectedItem || !editPassword.trim()) {
      setEditPasswordError(true);
      return;
    }

    try {
      // 비밀번호 검증 API 호출
      await verifyPasswordApi(selectedItem.id, editPassword);
      // 비밀번호가 맞으면 수정 모드 진입
      enterEditMode();
    } catch {
      // 비밀번호가 틀리면 에러 표시
      setEditPasswordError(true);
    }
  };

  // Enter edit mode - populate form with current item data
  const enterEditMode = () => {
    if (!selectedItem) return;

    setFormTitle(selectedItem.title);
    setFormCategory(selectedItem.category as Category);
    setFormTradeType(selectedItem.tradeType);
    setFormPrice(selectedItem.price ?? 0);
    setFormCurrency(selectedItem.currency ?? '스톤');
    setFormContent(selectedItem.content);
    setFormImages(selectedItem.images ?? []);
    setFormAuthor(selectedItem.author);
    setFormPassword(editPassword); // 입력한 비밀번호 사용
    setShowEditPasswordForm(false);
    setViewMode('edit');
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      // URL에서 item 파라미터 확인
      const params = new URLSearchParams(window.location.search);
      const itemId = params.get('item');

      if (itemId) {
        // 상세보기로 이동
        setSelectedItemId(parseInt(itemId, 10));
        setViewMode('detail');
      } else {
        // 목록으로 돌아감
        setViewMode('list');
        setSelectedItemId(null);
        setShowApplyForm(false);
        setShowCompleteForm(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Create item
  const handleCreateSubmit = async () => {
    if (!formTitle.trim() || !formAuthor.trim() || !formPassword.trim()) {
      alert('제목, 작성자, 비밀번호는 필수입니다.');
      return;
    }

    if (formTradeType === '판매' && formPrice <= 0) {
      alert('판매 금액을 입력해주세요.');
      return;
    }

    const body: Record<string, unknown> = {
      title: formTitle,
      category: formCategory,
      tradeType: formTradeType,
      content: formContent || '',
      images: formImages,
      author: formAuthor,
      password: formPassword,
    };

    // 판매인 경우에만 가격과 화폐 추가
    if (formTradeType === '판매') {
      body.price = formPrice;
      body.currency = formCurrency;
    }

    createMutation.mutate(body, {
      onSuccess: () => {
        alert(formTradeType === '나눔' ? '나눔이 등록되었습니다!' : '판매가 등록되었습니다!');
        resetForm();
        setViewMode('list');
      },
      onError: (error) => {
        alert(error.message || '등록에 실패했습니다.');
      },
    });
  };

  // Edit submit (비밀번호는 이미 verify로 검증됨)
  const handleEditSubmit = async () => {
    if (!selectedItemId || !selectedItem) return;

    if (!formTitle.trim()) {
      alert('제목은 필수입니다.');
      return;
    }

    // 판매인 경우 가격 검증
    if (selectedItem.tradeType === '판매' && formPrice <= 0) {
      alert('판매 금액을 입력해주세요.');
      return;
    }

    // API 문서에 따라 수정 가능한 필드만 전송 (tradeType은 수정 불가)
    // 비밀번호는 미리 verify로 검증되었으므로 editPassword 사용
    const body: Record<string, unknown> = {
      title: formTitle,
      category: formCategory,
      content: formContent || '',
      images: formImages,
    };

    // 관리자가 아닌 경우에만 비밀번호 전송 (이미 verify로 검증된 비밀번호)
    if (!isAdmin) {
      body.password = editPassword;
    }

    // 판매인 경우에만 가격과 화폐 추가
    if (selectedItem.tradeType === '판매') {
      body.price = formPrice;
      body.currency = formCurrency;
    }

    updateMutation.mutate({ id: selectedItemId, body }, {
      onSuccess: () => {
        alert('수정이 완료되었습니다!');
        resetForm();
        setEditPassword('');
        setViewMode('detail');
      },
      onError: (error) => {
        if (error.message.includes('비밀번호') || error.message.includes('password')) {
          setEditPasswordError(true);
          alert('비밀번호가 일치하지 않습니다.');
        } else {
          alert(error.message || '수정에 실패했습니다.');
        }
      },
    });
  };

  // Upload image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    uploadImageMutation.mutate(file, {
      onSuccess: (url) => {
        setFormImages([...formImages, url]);
      },
      onError: (error) => {
        alert(error.message || '이미지 업로드에 실패했습니다.');
      },
      onSettled: () => {
        e.target.value = '';
      },
    });
  };

  // Remove image (서버에서도 삭제)
  const handleRemoveImage = async (index: number) => {
    const imageUrl = formImages[index];

    try {
      // 서버에서 이미지 삭제
      await deleteImageApi(imageUrl);
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      // 서버 삭제 실패해도 UI에서는 제거 (이미 업로드된 이미지가 아닐 수 있음)
    }

    // UI에서 이미지 제거
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  // Apply for share (나눔 전용)
  const handleApply = () => {
    if (!applyName.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (!selectedItemId) return;

    applyMutation.mutate(
      { id: selectedItemId, body: { name: applyName, message: applyMessage || undefined } },
      {
        onSuccess: () => {
          alert('신청이 완료되었습니다!');
          setApplyName('');
          setApplyMessage('');
          setShowApplyForm(false);
        },
        onError: (error) => {
          alert(error.message || '신청에 실패했습니다.');
        },
      }
    );
  };

  // Complete share/sale (no password required)
  const handleComplete = () => {
    if (!manualReceiver.trim()) {
      alert('받는 사람을 입력해주세요.');
      return;
    }

    if (!selectedItemId || !selectedItem) return;

    const tradeType = selectedItem.tradeType;
    const receiver = manualReceiver;

    completeMutation.mutate(
      { id: selectedItemId, receiver },
      {
        onSuccess: () => {
          const message = tradeType === '판매'
            ? `${receiver}님에게 판매 완료되었습니다!`
            : `${receiver}님에게 나눔 완료되었습니다!`;
          alert(message);
          setManualReceiver('');
          setShowCompleteForm(false);
        },
        onError: (error) => {
          alert(error.message || '완료 처리에 실패했습니다.');
        },
      }
    );
  };

  // Uncomplete (toggle back to in-progress)
  const handleUncomplete = () => {
    if (!selectedItemId) return;

    if (!confirm('미완료 상태로 되돌리시겠습니까?')) return;

    uncompleteMutation.mutate(selectedItemId, {
      onSuccess: () => {
        alert('미완료 상태로 변경되었습니다.');
      },
      onError: (error) => {
        alert(error.message || '상태 변경에 실패했습니다.');
      },
    });
  };

  // Random draw with animation (나눔 전용, no password required)
  const handleDraw = () => {
    if (!selectedItemId || !selectedItem?.applicants?.length) return;

    if (!confirm('랜덤 추첨을 진행하시겠습니까?')) return;

    const applicants = selectedItem.applicants;
    setIsDrawing(true);
    setDrawWinner(null);

    // 애니메이션: 이름을 빠르게 돌림
    let count = 0;
    const totalSpins = 20 + Math.floor(Math.random() * 10); // 20~30회 돌림
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * applicants.length);
      setDrawingName(applicants[randomIndex].name);
      count++;

      if (count >= totalSpins) {
        clearInterval(interval);

        // 실제 API 호출
        drawMutation.mutate(selectedItemId, {
          onSuccess: (data) => {
            // API 응답에서 당첨자 정보 추출
            const winnerName = data?.winner?.name || data?.receiver || '알 수 없음';

            // 최종 당첨자 표시
            setDrawingName(winnerName);
            setDrawWinner(winnerName);

            // 3초 후 모달 닫기
            setTimeout(() => {
              setIsDrawing(false);
              setDrawWinner(null);
              setDrawingName('');
              setShowCompleteForm(false);
            }, 3000);
          },
          onError: (error) => {
            console.error('Draw API error:', error);
            setIsDrawing(false);
            setDrawingName('');
            alert(error.message || '추첨에 실패했습니다.');
          },
        });
      }
    }, 80); // 80ms 간격으로 이름 변경
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    if (isAdmin) {
      // 관리자는 바로 삭제
      executeDelete({ adminDelete: true });
    } else {
      // 일반 사용자는 비밀번호 확인 필요
      setShowDeletePasswordForm(true);
      setDeletePassword('');
      setDeletePasswordError(false);
    }
  };

  // Verify password and delete
  const handleDeletePasswordSubmit = async () => {
    if (!selectedItem || !deletePassword.trim()) {
      setDeletePasswordError(true);
      return;
    }

    try {
      // 비밀번호 검증 API 호출
      await verifyPasswordApi(selectedItem.id, deletePassword);
      // 비밀번호가 맞으면 삭제 실행
      executeDelete({ password: deletePassword });
    } catch {
      // 비밀번호가 틀리면 에러 표시
      setDeletePasswordError(true);
    }
  };

  // Execute delete
  const executeDelete = (options: { adminDelete?: boolean; password?: string }) => {
    if (!selectedItemId) return;

    if (!confirm('정말 삭제하시겠습니까?')) return;

    deleteMutation.mutate({ id: selectedItemId, options }, {
      onSuccess: () => {
        alert('삭제되었습니다.');
        setShowDeletePasswordForm(false);
        setDeletePassword('');
        setSelectedItemId(null);
        setViewMode('list');
      },
      onError: (error) => {
        alert(error.message || '삭제에 실패했습니다.');
      },
    });
  };

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormCategory('아이템');
    setFormTradeType('판매');
    setFormPrice(0);
    setFormCurrency('스톤');
    setFormContent('');
    setFormImages([]);
    setFormAuthor('');
    setFormPassword('');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format price
  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`;
  };

  // Category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '페트':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case '아이템':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case '재화':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Trade type badge color
  const getTradeTypeColor = (tradeType: string) => {
    return tradeType === '판매'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-pink-500/20 text-pink-400 border-pink-500/30';
  };

  // Password screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-4">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate('/pets')}
            className="flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg transition-colors"
            aria-label="홈으로 가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>
        </div>
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="bg-bg-secondary rounded-2xl p-8 shadow-2xl border border-border max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">형명가 거래소</h1>
            <p className="text-text-secondary">비밀번호를 입력해주세요</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            />
            {showPasswordError && (
              <p className="text-red-500 text-sm">비밀번호가 올바르지 않습니다.</p>
            )}
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-3 bg-accent hover:bg-accent/80 text-white font-bold rounded-lg transition-colors"
            >
              입장하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  const renderListView = () => (
    <div className="space-y-6">
      {/* Sticky Filter Container */}
      <div className="sticky top-0 z-40 bg-bg-primary pb-2 md:pb-4 -mx-4 px-4 pt-2 -mt-2 space-y-2 md:space-y-4">
        {/* Trade Type Filter Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 md:gap-2">
            {[
              { value: '' as TradeFilter, label: '전체' },
              { value: '판매' as TradeFilter, label: '💰 판매' },
              { value: '나눔' as TradeFilter, label: '🎁 나눔' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setFilterTradeType(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all ${
                  filterTradeType === tab.value
                    ? 'bg-accent text-white shadow-lg'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary border border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Refresh Button */}
          <button
            onClick={() => refetchItems()}
            disabled={isFetching}
            className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg transition-colors disabled:opacity-50"
            aria-label="새로고침"
            title="새로고침"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 md:h-5 md:w-5 ${isFetching ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-bg-secondary rounded-lg md:rounded-xl p-2.5 md:p-4 border border-border">
          <div className="flex flex-wrap gap-2 md:gap-3 items-center">
          {/* Category Select */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-2 pr-6 py-1.5 md:pl-3 md:pr-8 md:py-2.5 bg-bg-tertiary border border-border rounded-lg md:rounded-xl text-text-primary text-xs md:text-sm font-medium cursor-pointer hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            >
              <option value="">전체 분류</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[10px] md:text-xs">▼</span>
          </div>

          {/* Status Select */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-2 pr-6 py-1.5 md:pl-3 md:pr-8 md:py-2.5 bg-bg-tertiary border border-border rounded-lg md:rounded-xl text-text-primary text-xs md:text-sm font-medium cursor-pointer hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            >
              <option value="">전체 상태</option>
              <option value="ongoing">진행중</option>
              <option value="completed">완료</option>
            </select>
            <span className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[10px] md:text-xs">▼</span>
          </div>

          {/* Search Input with / shortcut hint */}
          <div className="flex-1 min-w-[120px] md:min-w-[200px] relative">
            <span className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-sm">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="검색..."
              className="w-full pl-7 pr-8 py-1.5 md:pl-9 md:pr-12 md:py-2.5 bg-bg-tertiary border border-border rounded-lg md:rounded-xl text-text-primary text-xs md:text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
            <span className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-xs text-text-muted bg-bg-secondary px-1 md:px-1.5 py-0.5 rounded border border-border hidden md:block">/</span>
          </div>

          {/* Reset Filter Button */}
          <button
            onClick={() => {
              setFilterTradeType('');
              setFilterCategory('');
              setFilterStatus('ongoing');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 md:px-3 md:py-2.5 bg-bg-tertiary hover:bg-bg-primary border border-border text-text-secondary hover:text-text-primary rounded-lg md:rounded-xl text-xs md:text-sm transition-colors"
            title="필터 초기화"
          >
            ↺
          </button>

          <button
            onClick={() => setViewMode('create')}
            className="px-2.5 py-1.5 md:px-4 md:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1"
          >
            <span>+</span>
            <span className="hidden sm:inline">물품 등록</span>
          </button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          <p className="text-6xl mb-4">📭</p>
          <p className="mb-4">등록된 물품이 없습니다.</p>
          <button
            onClick={() => setViewMode('create')}
            className="px-6 py-3 bg-accent hover:bg-accent/80 text-white font-bold rounded-lg transition-colors"
          >
            🏪 첫 물품 등록하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => handleViewItem(item.id)}
              onLike={(e) => {
                e.stopPropagation();
                likeMutation.mutate(item.id);
              }}
              isLiking={likeMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 bg-bg-secondary border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors"
          >
            ←
          </button>
          <span className="px-4 py-2 text-text-secondary">
            {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-2 bg-bg-secondary border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );

  // Detail view
  const renderDetailView = () => {
    if (!selectedItem) return null;

    const isShare = selectedItem.tradeType === '나눔';

    return (
      <div className="space-y-6">
        {/* Main content */}
        <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
          {/* Images */}
          {selectedItem.images && selectedItem.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-bg-tertiary">
              {selectedItem.images.map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img)}
                  alt={`${selectedItem.title} ${idx + 1}`}
                  className="w-full rounded-lg object-contain max-h-[400px]"
                />
              ))}
            </div>
          )}

          {/* Info */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full border text-sm font-medium ${getTradeTypeColor(
                  selectedItem.tradeType
                )}`}
              >
                {selectedItem.tradeType}
              </span>
              <span
                className={`px-3 py-1 rounded-full border text-sm ${getCategoryColor(
                  selectedItem.category
                )}`}
              >
                {selectedItem.category}
              </span>
              {selectedItem.completed ? (
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-sm">
                  {isShare ? '나눔완료' : '판매완료'} → {selectedItem.receiver}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm">
                  진행중
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">{selectedItem.title}</h1>

            {/* Price Display */}
            {selectedItem.tradeType === '판매' && selectedItem.price !== null && selectedItem.currency && (
              <p className="text-3xl font-bold text-green-400 mb-4">
                {formatPrice(selectedItem.price, selectedItem.currency)}
              </p>
            )}
            {selectedItem.tradeType === '나눔' && (
              <p className="text-3xl font-bold text-pink-400 mb-4">무료 나눔</p>
            )}

            <div className="flex items-center gap-4 text-sm text-text-secondary mb-6 flex-wrap">
              <span>작성자: {selectedItem.author}</span>
              <span>👁 {selectedItem.views}</span>
              <button
                onClick={() => likeMutation.mutate(selectedItem.id)}
                disabled={likeMutation.isPending}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-medium transition-all ${
                  selectedItem.liked
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-bg-tertiary hover:bg-blue-500/10 text-text-secondary hover:text-blue-400 border border-border'
                } disabled:opacity-50`}
              >
                <span className="text-xl">{selectedItem.liked ? '👍' : '👍🏻'}</span>
                <span>{selectedItem.likes ?? 0}</span>
              </button>
              {isShare && (
                <span>🙋 {selectedItem.applicantCount ?? selectedItem.applicants?.length ?? 0}명 신청</span>
              )}
              <span>{formatDate(selectedItem.createdAt)}</span>
            </div>

            {selectedItem.content && (
              <div
                className="prose prose-invert max-w-none mb-6"
                dangerouslySetInnerHTML={{ __html: selectedItem.content }}
              />
            )}

            {/* Actions */}
            {!selectedItem.completed && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                {/* 나눔인 경우에만 신청 버튼 */}
                {isShare && (
                  <button
                    onClick={() => setShowApplyForm(!showApplyForm)}
                    className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg transition-colors"
                  >
                    🙋 나눔 신청하기
                  </button>
                )}
                <button
                  onClick={() => setShowCompleteForm(!showCompleteForm)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                >
                  🎯 {isShare ? '나눔 완료' : '판매 완료'}
                </button>
                {/* 수정 버튼 */}
                <button
                  onClick={handleEditClick}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  ✏️ 수정
                </button>
                {/* 삭제 버튼 */}
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors ml-auto disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '🗑️ 삭제'}
                </button>
              </div>
            )}

            {selectedItem.completed && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                {/* 미완료로 되돌리기 버튼 */}
                <button
                  onClick={handleUncomplete}
                  disabled={isCompleting}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isCompleting ? '처리 중...' : '↩️ 미완료로 되돌리기'}
                </button>
                {/* 수정 버튼 */}
                <button
                  onClick={handleEditClick}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  ✏️ 수정
                </button>
                {/* 삭제 버튼 */}
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors ml-auto disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '🗑️ 삭제'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Password Form */}
        {showEditPasswordForm && (
          <div className="bg-bg-secondary rounded-xl border border-blue-500 p-6">
            <h3 className="text-lg font-bold mb-4 text-blue-400">🔒 비밀번호 확인</h3>
            <p className="text-sm text-text-secondary mb-4">
              수정하려면 등록 시 입력한 비밀번호를 입력해주세요.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => {
                    setEditPassword(e.target.value);
                    setEditPasswordError(false);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditPasswordSubmit()}
                  placeholder="비밀번호 입력"
                  className={`w-full px-4 py-2 bg-bg-tertiary border rounded-lg text-text-primary ${
                    editPasswordError ? 'border-red-500' : 'border-border'
                  }`}
                />
                {editPasswordError && (
                  <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEditPasswordSubmit}
                  disabled={!editPassword.trim()}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  확인
                </button>
                <button
                  onClick={() => {
                    setShowEditPasswordForm(false);
                    setEditPassword('');
                    setEditPasswordError(false);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Password Form */}
        {showDeletePasswordForm && (
          <div className="bg-bg-secondary rounded-xl border border-red-500 p-6">
            <h3 className="text-lg font-bold mb-4 text-red-400">🗑️ 삭제 확인</h3>
            <p className="text-sm text-text-secondary mb-4">
              삭제하려면 등록 시 입력한 비밀번호를 입력해주세요.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError(false);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleDeletePasswordSubmit()}
                  placeholder="비밀번호 입력"
                  className={`w-full px-4 py-2 bg-bg-tertiary border rounded-lg text-text-primary ${
                    deletePasswordError ? 'border-red-500' : 'border-border'
                  }`}
                />
                {deletePasswordError && (
                  <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeletePasswordSubmit}
                  disabled={!deletePassword.trim()}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  삭제
                </button>
                <button
                  onClick={() => {
                    setShowDeletePasswordForm(false);
                    setDeletePassword('');
                    setDeletePasswordError(false);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Apply Form (나눔 전용) */}
        {showApplyForm && !selectedItem.completed && isShare && (
          <div className="bg-bg-secondary rounded-xl border border-pink-500 p-6">
            <h3 className="text-lg font-bold mb-4 text-pink-400">🙋 나눔 신청</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  닉네임 *
                </label>
                <input
                  type="text"
                  value={applyName}
                  onChange={(e) => setApplyName(e.target.value)}
                  placeholder="게임 닉네임 입력"
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  메시지 (선택)
                </label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="하고 싶은 말이 있다면..."
                  rows={2}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary resize-none"
                />
              </div>
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isApplying ? '신청 중...' : '신청하기'}
              </button>
            </div>
          </div>
        )}

        {/* Complete Form */}
        {showCompleteForm && !selectedItem.completed && (
          <div className="bg-bg-secondary rounded-xl border border-purple-500 p-6">
            <h3 className="text-lg font-bold mb-4 text-purple-400">
              🎯 {isShare ? '나눔' : '판매'} 완료 처리
            </h3>
            <div className="space-y-4">
              {/* Applicants list (나눔 전용) */}
              {isShare && selectedItem.applicants && selectedItem.applicants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    신청자 목록 ({selectedItem.applicants.length}명) - 클릭하여 선택
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-bg-tertiary rounded-lg p-3 space-y-2">
                    {selectedItem.applicants.map((app, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          manualReceiver === app.name
                            ? 'bg-accent/20 border border-accent'
                            : 'bg-bg-secondary hover:bg-bg-primary'
                        }`}
                        onClick={() => setManualReceiver(app.name)}
                      >
                        <div>
                          <span className="font-medium text-text-primary">{app.name}</span>
                          {app.message && (
                            <p className="text-xs text-text-secondary mt-1">{app.message}</p>
                          )}
                        </div>
                        <span className="text-xs text-text-muted">
                          {new Date(app.appliedAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {isShare ? '받는 사람' : '구매자'} *
                </label>
                <input
                  type="text"
                  value={manualReceiver}
                  onChange={(e) => setManualReceiver(e.target.value)}
                  placeholder={isShare ? '직접 입력하거나 위 목록에서 선택' : '구매자 닉네임 입력'}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isCompleting ? '처리 중...' : `${isShare ? '나눔' : '판매'} 완료`}
                </button>
                {/* 랜덤 추첨 버튼 (나눔 + 신청자 있을 때만) */}
                {isShare && selectedItem.applicants && selectedItem.applicants.length > 0 && (
                  <button
                    onClick={handleDraw}
                    disabled={isCompleting}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isCompleting ? '추첨 중...' : '🎲 랜덤 추첨'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Draw Animation Overlay */}
        {isDrawing && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-bg-secondary rounded-2xl p-8 max-w-md w-full mx-4 text-center">
              <div className="text-6xl mb-6 animate-bounce">🎲</div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {drawWinner ? '🎉 당첨자 발표!' : '추첨 중...'}
              </h2>
              <div
                className={`text-3xl font-bold py-6 px-4 rounded-xl mb-4 transition-all ${
                  drawWinner
                    ? 'bg-gradient-to-r from-pink-500 to-yellow-500 text-white scale-110'
                    : 'bg-bg-tertiary text-text-primary'
                }`}
              >
                {drawingName || '...'}
              </div>
              {drawWinner && (
                <p className="text-lg text-green-400 animate-pulse">
                  🎊 축하합니다! 🎊
                </p>
              )}
              {!drawWinner && (
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applicants Display (나눔 + 완료 폼 닫혀있을 때만) */}
        {!showCompleteForm && isShare && selectedItem.applicants && selectedItem.applicants.length > 0 && (
          <div className="bg-bg-secondary rounded-xl border border-border p-6">
            <h3 className="text-lg font-bold mb-4 text-text-primary">
              🙋 신청자 ({selectedItem.applicants.length}명)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedItem.applicants.map((app, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-bg-tertiary rounded-lg text-center"
                >
                  <span className="font-medium text-text-primary">{app.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Create view
  const renderCreateView = () => (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => {
          setViewMode('list');
          resetForm();
        }}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <span>←</span>
        <span>목록으로</span>
      </button>

      <div className="bg-bg-secondary rounded-xl border border-border p-6">
        <h2 className="text-2xl font-bold mb-6 text-text-primary">🏪 물품 등록</h2>

        <div className="space-y-5">
          {/* Trade Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              거래 유형 *
            </label>
            <div className="flex gap-3">
              {TRADE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setFormTradeType(type)}
                  className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${
                    formTradeType === type
                      ? type === '판매'
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : 'bg-pink-500/20 border-pink-500 text-pink-400'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent'
                  }`}
                >
                  {type === '판매' ? '💰 판매' : '🎁 나눔'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              제목 (물품명) *
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={formTradeType === '판매' ? '판매할 물품 이름' : '나눔할 물품 이름'}
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              분류 *
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormCategory(cat)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formCategory === cat
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg-tertiary text-text-secondary border-border hover:border-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price (판매인 경우에만) */}
          {formTradeType === '판매' && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-4">
              <h3 className="font-bold text-green-400">💰 판매 가격 설정</h3>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  화폐 단위 *
                </label>
                <div className="flex gap-2">
                  {CURRENCIES.map((cur) => (
                    <button
                      key={cur}
                      onClick={() => setFormCurrency(cur)}
                      className={`flex-1 py-2 rounded-lg border transition-colors ${
                        formCurrency === cur
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-bg-tertiary text-text-secondary border-border hover:border-green-500'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  금액 *
                </label>
                <input
                  type="number"
                  value={formPrice || ''}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  placeholder="금액 입력"
                  min="0"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                />
              </div>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              이미지
            </label>
            <div className="space-y-3">
              {formImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img
                        src={getImageUrl(img)}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <span className="inline-block px-4 py-2 bg-bg-tertiary border border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
                  {uploadingImage ? '업로드 중...' : '📷 이미지 추가'}
                </span>
              </label>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              설명 (선택)
            </label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="추가 설명이 있다면 입력하세요"
              rows={4}
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary resize-none"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              작성자 (닉네임) *
            </label>
            <input
              type="text"
              value={formAuthor}
              onChange={(e) => setFormAuthor(e.target.value)}
              placeholder="게임 닉네임"
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              비밀번호 * (수정 시 필요)
            </label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="4자리 이상"
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleCreateSubmit}
            disabled={isSubmitting}
            className={`w-full py-4 font-bold rounded-lg transition-colors disabled:opacity-50 text-lg text-white ${
              formTradeType === '판매'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-pink-500 hover:bg-pink-600'
            }`}
          >
            {isSubmitting
              ? '등록 중...'
              : formTradeType === '판매'
              ? '💰 판매 등록하기'
              : '🎁 나눔 등록하기'}
          </button>
        </div>
      </div>
    </div>
  );

  // Edit view (similar to create but for editing)
  const renderEditView = () => {
    if (!selectedItem) return null;

    return (
    <div>
      <div className="bg-bg-secondary rounded-xl border border-blue-500 p-6">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">✏️ 물품 수정</h2>

        <div className="space-y-5">
          {/* Trade Type - 수정 불가 (읽기 전용) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              거래 유형 (수정 불가)
            </label>
            <div className={`py-3 px-4 rounded-lg border-2 font-bold text-center ${
              selectedItem.tradeType === '판매'
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'bg-pink-500/20 border-pink-500 text-pink-400'
            }`}>
              {selectedItem.tradeType === '판매' ? '💰 판매' : '🎁 나눔'}
            </div>
            <p className="text-xs text-text-muted mt-1">거래 유형은 변경할 수 없습니다.</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              제목 (물품명) *
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={formTradeType === '판매' ? '판매할 물품 이름' : '나눔할 물품 이름'}
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              분류 *
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormCategory(cat)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formCategory === cat
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg-tertiary text-text-secondary border-border hover:border-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price (판매일 경우만) */}
          {formTradeType === '판매' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  가격 *
                </label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  placeholder="가격 입력"
                  min={0}
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  화폐 *
                </label>
                <div className="flex gap-2">
                  {CURRENCIES.map((cur) => (
                    <button
                      key={cur}
                      onClick={() => setFormCurrency(cur)}
                      className={`flex-1 py-3 rounded-lg border transition-colors ${
                        formCurrency === cur
                          ? cur === '금화'
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                            : 'bg-gray-500/20 border-gray-400 text-gray-300'
                          : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent'
                      }`}
                    >
                      {cur === '금화' ? '💰 금화' : '💵 스톤'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              이미지 (최대 5장)
            </label>
            <div className="flex flex-wrap gap-3">
              {formImages.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24">
                  <img
                    src={getImageUrl(img)}
                    alt={`이미지 ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formImages.length < 5 && (
                <label className="w-24 h-24 flex items-center justify-center bg-bg-tertiary border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
                  ) : (
                    <span className="text-3xl text-text-muted">+</span>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              상세 설명
            </label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="추가 설명이 있다면 입력하세요"
              rows={4}
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary resize-none"
            />
          </div>

          {/* Author - 수정 불가 (읽기 전용) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              작성자 (수정 불가)
            </label>
            <div className="w-full px-4 py-3 bg-bg-tertiary/50 border border-border rounded-lg text-text-muted">
              {selectedItem.author}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleEditSubmit}
            disabled={isSubmitting}
            className="w-full py-4 font-bold rounded-lg transition-colors disabled:opacity-50 text-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? '수정 중...' : '✏️ 수정 완료'}
          </button>
        </div>
      </div>
    </div>
  );
  };

  // Main authenticated view
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      {viewMode !== 'create' && (
        <header className="bg-bg-secondary border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pets')}
                className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary hover:bg-bg-primary border border-border rounded-lg transition-colors"
                aria-label="홈으로 가기"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold">형명가 거래소</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderListView()}
        {viewMode === 'create' && renderCreateView()}
      </main>

      {/* Detail View - Full Screen Overlay */}
      {viewMode === 'detail' && (
        <div className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {renderDetailView()}
          </div>
          {/* Floating Back Button */}
          <button
            onClick={handleBackToList}
            className="fixed bottom-6 left-6 w-12 h-12 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full shadow-lg flex items-center justify-center transition-all z-[60]"
            aria-label="목록으로 돌아가기"
          >
            ←
          </button>
        </div>
      )}

      {/* Edit View - Full Screen Overlay */}
      {viewMode === 'edit' && (
        <div className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {renderEditView()}
          </div>
          {/* Floating Back Button */}
          <button
            onClick={() => {
              setViewMode('detail');
              resetForm();
              setEditPassword('');
            }}
            className="fixed bottom-6 left-6 w-12 h-12 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full shadow-lg flex items-center justify-center transition-all z-[60]"
            aria-label="상세보기로 돌아가기"
          >
            ←
          </button>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-accent hover:bg-accent/80 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
          aria-label="상단으로 이동"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default SharePage;
