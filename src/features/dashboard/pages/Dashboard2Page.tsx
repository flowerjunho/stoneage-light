import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/shared/hooks/useTheme';

interface GalleryImage {
  id: string;
  filename: string;
  url: string;
  folder: string;
  uploadedAt: string;
}

const Dashboard2Page: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);

  // 서버 URL
  const serverUrl = 'https://printable-convinced-execute-prix.trycloudflare.com';

  // 상태
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  // 모달 상태
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 드래그 앤 드롭 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 파일 입력 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 인증 및 테마 확인
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

    const authKey = localStorage.getItem('DASHBOARD_AUTH');
    if (authKey === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  // 폴더 목록 불러오기
  const fetchFolders = async () => {
    try {
      const response = await fetch(`${serverUrl}/folders`);
      if (!response.ok) throw new Error('폴더 목록 가져오기 실패');
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  // 폴더 이미지 불러오기
  const loadFolderImages = async (folderName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/images?folder=${folderName}`);
      if (!response.ok) throw new Error('이미지 목록 가져오기 실패');
      const data = await response.json();
      const serverImages = data.images || [];

      const galleryImages: GalleryImage[] = serverImages.map(
        (img: { filename: string; url: string; uploadedAt?: string }, index: number) => ({
          id: `img-${Date.now()}-${index}`,
          filename: img.filename,
          url: img.url,
          folder: folderName,
          uploadedAt: img.uploadedAt || new Date().toISOString(),
        })
      );

      setImages(galleryImages);
    } catch (err) {
      console.error('Error loading images:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchFolders();
      const lastFolder = localStorage.getItem('lastSelectedFolder');
      if (lastFolder) {
        setSelectedFolder(lastFolder);
        loadFolderImages(lastFolder);
      }
    }
  }, [isAuthenticated]);

  // 폴더 선택
  const handleFolderSelect = (folderName: string) => {
    setSelectedFolder(folderName);
    localStorage.setItem('lastSelectedFolder', folderName);
    loadFolderImages(folderName);
  };

  // 폴더 생성
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      alert('폴더 이름을 입력하세요.');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: newFolderName.trim() }),
      });

      if (!response.ok) throw new Error('폴더 생성 실패');

      await fetchFolders();
      setNewFolderName('');
      setShowFolderInput(false);
    } catch (err) {
      console.error('Error creating folder:', err);
      alert('폴더 생성에 실패했습니다.');
    }
  };

  // 이미지 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedFolder) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${serverUrl}/upload?folder=${selectedFolder}`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('업로드 실패');
      }

      // 업로드 후 이미지 목록 새로고침
      await loadFolderImages(selectedFolder);
    } catch (err) {
      console.error('Error uploading:', err);
      alert('업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // 이미지 삭제
  const handleDeleteImage = async (image: GalleryImage) => {
    if (!confirm('이미지를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${serverUrl}/images/${image.folder}/${image.filename}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('삭제 실패');

      setImages(prev => prev.filter(img => img.id !== image.id));
      setShowModal(false);
      setSelectedImage(null);
    } catch (err) {
      console.error('Error deleting:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  // URL 복사
  const copyImageUrl = (url: string) => {
    const encodedUrl = encodeURI(decodeURI(url));
    navigator.clipboard.writeText(encodedUrl);
    alert('URL이 클립보드에 복사되었습니다!');
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // 드래그 시 투명도 조절을 위한 클래스 추가
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 이미지 순서 변경
    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    setImages(newImages);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 비밀번호 검증
  const handlePasswordSubmit = () => {
    if (password === '2580') {
      localStorage.setItem('DASHBOARD_AUTH', 'authenticated');
      setIsAuthenticated(true);
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePasswordSubmit();
  };

  // 모달 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showModal || !selectedImage) return;

      const currentIndex = images.findIndex(img => img.id === selectedImage.id);

      if (e.key === 'Escape') {
        setShowModal(false);
        setSelectedImage(null);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSelectedImage(images[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setSelectedImage(images[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, selectedImage, images]);

  // 비밀번호 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="bg-bg-secondary rounded-2xl p-8 w-full max-w-md border border-border shadow-xl">
          <h1 className="text-2xl font-bold text-text-primary text-center mb-6">
            🖼️ 이미지 갤러리
          </h1>
          <p className="text-text-secondary text-center mb-6">비밀번호를 입력하세요</p>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="비밀번호"
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent mb-4"
            autoFocus
          />

          {showPasswordError && (
            <p className="text-red-500 text-sm text-center mb-4">비밀번호가 올바르지 않습니다.</p>
          )}

          <button
            onClick={handlePasswordSubmit}
            className="w-full py-3 bg-accent hover:bg-accent/80 text-white font-semibold rounded-xl transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-bg-secondary/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              title="홈으로"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold">이미지 갤러리</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 bg-bg-tertiary hover:bg-bg-primary border border-border rounded-lg transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <svg
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-slate-700"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 폴더 선택 영역 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-sm text-text-secondary font-medium">폴더:</span>
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => handleFolderSelect(folder)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFolder === folder
                    ? 'bg-accent text-white shadow-lg'
                    : 'bg-bg-secondary hover:bg-bg-tertiary border border-border'
                }`}
              >
                {folder}
              </button>
            ))}

            {showFolderInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && createFolder()}
                  placeholder="폴더명"
                  className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
                <button
                  onClick={createFolder}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                >
                  생성
                </button>
                <button
                  onClick={() => {
                    setShowFolderInput(false);
                    setNewFolderName('');
                  }}
                  className="px-3 py-2 bg-bg-tertiary hover:bg-bg-secondary border border-border rounded-lg text-sm"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowFolderInput(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-secondary hover:bg-bg-tertiary border border-dashed border-border transition-all"
              >
                + 새 폴더
              </button>
            )}
          </div>
        </div>

        {/* 업로드 영역 */}
        {selectedFolder && (
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`w-full py-4 border-2 border-dashed rounded-xl transition-all ${
                uploading
                  ? 'border-accent/50 bg-accent/10 cursor-wait'
                  : 'border-border hover:border-accent hover:bg-accent/5 cursor-pointer'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-text-secondary">업로드 중...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-text-secondary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>클릭하여 이미지 업로드 (여러 개 선택 가능)</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* 이미지 갤러리 */}
        {selectedFolder ? (
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p>이미지가 없습니다</p>
              <p className="text-sm mt-1">위 버튼을 클릭하여 이미지를 업로드하세요</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-secondary mb-3 text-center">
                💡 이미지를 드래그하여 순서를 변경할 수 있습니다
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, index)}
                    onClick={() => {
                      if (draggedIndex === null) {
                        setSelectedImage(image);
                        setShowModal(true);
                      }
                    }}
                    className={`group relative aspect-square bg-bg-secondary rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                      dragOverIndex === index
                        ? 'border-accent border-dashed scale-105 bg-accent/10'
                        : draggedIndex === index
                          ? 'border-accent/50 opacity-50'
                          : 'border-border hover:border-accent hover:scale-[1.02]'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover pointer-events-none"
                      loading="lazy"
                      draggable={false}
                    />
                    {/* 드래그 핸들 표시 */}
                    <div className="absolute top-2 left-2 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    </div>
                    {/* 순서 번호 */}
                    <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end pointer-events-none">
                      <div className="w-full p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm truncate">{image.filename}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        ) : (
          <div className="text-center py-20 text-text-secondary">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p>폴더를 선택하세요</p>
          </div>
        )}
      </div>

      {/* 이미지 상세보기 모달 */}
      {showModal && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => {
            setShowModal(false);
            setSelectedImage(null);
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => {
              setShowModal(false);
              setSelectedImage(null);
            }}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* 이전 버튼 */}
          {images.findIndex(img => img.id === selectedImage.id) > 0 && (
            <button
              onClick={e => {
                e.stopPropagation();
                const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                setSelectedImage(images[currentIndex - 1]);
              }}
              className="absolute left-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* 다음 버튼 */}
          {images.findIndex(img => img.id === selectedImage.id) < images.length - 1 && (
            <button
              onClick={e => {
                e.stopPropagation();
                const currentIndex = images.findIndex(img => img.id === selectedImage.id);
                setSelectedImage(images[currentIndex + 1]);
              }}
              className="absolute right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* 이미지 컨테이너 */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.filename}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />

            {/* 하단 정보 및 액션 */}
            <div className="mt-4 flex items-center justify-between bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="text-white">
                <p className="font-medium truncate max-w-md">{selectedImage.filename}</p>
                <p className="text-sm text-white/60">
                  {images.findIndex(img => img.id === selectedImage.id) + 1} / {images.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyImageUrl(selectedImage.url)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
                >
                  URL 복사
                </button>
                <button
                  onClick={() => handleDeleteImage(selectedImage)}
                  className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>

          {/* 키보드 힌트 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-sm">
            ← → 이동 | ESC 닫기
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard2Page;
