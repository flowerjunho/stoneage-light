import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from '@/shared/components/layout/ThemeToggle';

interface CanvasImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  aspectRatio?: number; // 이미지의 가로/세로 비율 (width/height)
}

interface CanvasText {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  fontSize: number;
  color: string;
}

interface ServerImage {
  filename: string;
  folder: string | null;
  url: string;
  size: number;
  uploadedAt: string;
}

const DashboardPage: React.FC = () => {
  const [uploading, setUploading] = useState(false);

  // Cloudflare Tunnel을 통한 HTTPS 접근 (모든 환경에서 사용)
  const serverUrl = 'https://invoice-finder-deferred-static.trycloudflare.com';
  const [error, setError] = useState<string | null>(null);
  const [showMixedContentWarning, setShowMixedContentWarning] = useState(false); // Cloudflare 사용으로 경고 불필요

  // 폴더 관련 상태
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  // 캔버스 관련 상태
  const [canvasImages, setCanvasImages] = useState<CanvasImage[]>([]);
  const [canvasTexts, setCanvasTexts] = useState<CanvasText[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 캔버스 줌 상태
  const [canvasZoom, setCanvasZoom] = useState(1);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 클립보드 상태 (복사된 이미지 정보)
  const [copiedImageUrl, setCopiedImageUrl] = useState<string | null>(null);

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
        body: JSON.stringify({ name: newFolderName }),
      });

      if (!response.ok) throw new Error('폴더 생성 실패');

      await fetchFolders();
      setNewFolderName('');
      setShowFolderInput(false);
    } catch (err) {
      alert('폴더 생성 중 오류가 발생했습니다.');
      console.error('Error creating folder:', err);
    }
  };

  // 폴더 삭제
  const deleteFolder = async (folderName: string) => {
    if (!confirm(`"${folderName}" 폴더를 삭제하시겠습니까?\n(폴더 내 모든 이미지가 삭제됩니다)`)) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/folders/${folderName}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('폴더 삭제 실패');

      if (selectedFolder === folderName) {
        setSelectedFolder(null);
        setCanvasImages([]);
      }
      await fetchFolders();
    } catch (err) {
      alert('폴더 삭제 중 오류가 발생했습니다.');
      console.error('Error deleting folder:', err);
    }
  };

  // 이미지 업로드
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedFolder) {
      alert('폴더를 먼저 선택해주세요.');
      e.target.value = '';
      return;
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // 선택된 폴더로 업로드
      const response = await fetch(`${serverUrl}/upload?folder=${selectedFolder}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('업로드 실패');

      const data = await response.json();
      console.log('Upload success:', data);

      // 업로드된 이미지를 바로 캔버스에 추가
      if (data.data && data.data.url) {
        addImageToCanvas(data.data.url);
      }
    } catch (err) {
      setError('이미지 업로드 중 오류가 발생했습니다.');
      console.error('Error uploading:', err);
    } finally {
      setUploading(false);
      // 파일 input 초기화
      e.target.value = '';
    }
  };

  // 서버에서 폴더 내 모든 이미지 목록과 위치 정보 불러오기
  const loadFolderImages = async (folderName: string) => {
    try {
      // 1. 서버에서 해당 폴더의 이미지 목록 가져오기
      const imagesResponse = await fetch(`${serverUrl}/images?folder=${folderName}`);
      if (!imagesResponse.ok) throw new Error('이미지 목록 가져오기 실패');
      const imagesData = await imagesResponse.json();
      const serverImages = imagesData.images || [];

      // 2. 서버에서 위치 정보 가져오기
      const posResponse = await fetch(`${serverUrl}/positions`);
      const posData = await posResponse.json();
      const positions = posData.positions || {};

      // 3. 서버 이미지 목록 기반으로 캔버스 이미지 생성 (비동기로 비율 계산)
      const folderImagesPromises = serverImages.map(async (img: ServerImage, index: number) => {
        const posKey = `${folderName}/${img.filename}`;
        const savedPosition = positions[posKey] as
          | { x: number; y: number; width: number; height: number }
          | undefined;

        // 이미지 비율 계산
        return new Promise<CanvasImage>(resolve => {
          const image = new Image();
          image.onload = () => {
            const aspectRatio = image.naturalWidth / image.naturalHeight;

            // 저장된 크기가 있으면 사용, 없으면 기본값 + 비율 적용
            const width = savedPosition?.width ?? 200;
            const height = savedPosition?.height ?? width / aspectRatio;

            resolve({
              id: `img-${Date.now()}-${Math.random()}-${img.filename}`,
              url: img.url,
              x: savedPosition?.x ?? 100 + index * 20,
              y: savedPosition?.y ?? 100 + index * 20,
              width,
              height,
              zIndex: index,
              aspectRatio,
            });
          };
          image.onerror = () => {
            // 이미지 로드 실패 시 기본값
            resolve({
              id: `img-${Date.now()}-${Math.random()}-${img.filename}`,
              url: img.url,
              x: savedPosition?.x ?? 100 + index * 20,
              y: savedPosition?.y ?? 100 + index * 20,
              width: savedPosition?.width ?? 200,
              height: savedPosition?.height ?? 200,
              zIndex: index,
            });
          };
          image.src = img.url;
        });
      });

      const folderImages = await Promise.all(folderImagesPromises);
      setCanvasImages(folderImages);
      console.log(`Loaded ${folderImages.length} images from folder "${folderName}"`);

      // 4. 텍스트 데이터 로드
      const textsResponse = await fetch(`${serverUrl}/texts?folder=${folderName}`);
      if (textsResponse.ok) {
        const textsData = await textsResponse.json();
        const textsObj = textsData.texts || {};

        // Object를 array로 변환
        const folderTexts = (
          Object.values(textsObj) as Array<{
            id?: string;
            content?: string;
            x?: number;
            y?: number;
            width?: number;
            height?: number;
          }>
        ).map((t, index) => ({
          id: t.id || `text-${Date.now()}-${index}`,
          text: t.content || '',
          x: t.x ?? 100,
          y: t.y ?? 100,
          width: t.width ?? 200,
          height: t.height ?? 100,
          zIndex: folderImages.length + index,
          fontSize: 16,
          color: '#000000',
        }));
        setCanvasTexts(folderTexts);
        console.log(`Loaded ${folderTexts.length} texts from folder "${folderName}"`);
      } else {
        setCanvasTexts([]);
      }
    } catch (err) {
      console.error('Error loading folder images:', err);
      setCanvasImages([]);
      setCanvasTexts([]);
    }
  };

  // 서버에 이미지 위치 저장
  const saveImagePosition = async (image: CanvasImage) => {
    if (!selectedFolder) return;

    try {
      // URL에서 파일명 추출
      const filename = image.url.split('/').pop();
      if (!filename) return;

      const response = await fetch(`${serverUrl}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: selectedFolder,
          filename: filename,
          x: image.x,
          y: image.y,
          width: image.width,
          height: image.height,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save position:', await response.text());
      }

      console.log('Position saved:', filename);
    } catch (err) {
      console.error('Error saving position:', err);
    }
  };

  // 줌 컨트롤 함수
  const handleZoomIn = () => {
    setCanvasZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setCanvasZoom(prev => Math.max(prev - 0.2, 0.3));
  };

  const handleZoomReset = () => {
    setCanvasZoom(1);
  };

  // 휠 줌 (PC)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setCanvasZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
    }
  };

  // 텍스트 박스 추가 (POST로 생성)
  const addTextToCanvas = async () => {
    if (!selectedFolder) {
      console.log('No folder selected');
      return;
    }

    const textData = {
      folder: selectedFolder,
      content: '텍스트를 입력하세요',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    };

    console.log('Creating text:', textData);

    try {
      const response = await fetch(`${serverUrl}/texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create text:', errorText);
        alert(`텍스트 생성 실패: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log('Server response:', result);
      const createdText = result.text;

      const newText: CanvasText = {
        id: createdText.id,
        text: createdText.content,
        x: createdText.x,
        y: createdText.y,
        width: createdText.width,
        height: createdText.height,
        zIndex: canvasImages.length + canvasTexts.length,
        fontSize: 16,
        color: '#000000',
      };

      setCanvasTexts([...canvasTexts, newText]);
      setSelectedTextId(newText.id);
      setEditingTextId(newText.id);
      console.log('Text created successfully:', newText.id);
    } catch (err) {
      console.error('Error creating text:', err);
      alert(`텍스트 생성 중 오류 발생: ${err}`);
    }
  };

  // 텍스트 위치/크기 저장 (POST로 업데이트)
  const saveTextPosition = async (text: CanvasText) => {
    if (!selectedFolder) return;

    const textData = {
      folder: selectedFolder,
      content: text.text,
      x: text.x,
      y: text.y,
      width: text.width,
      height: text.height,
    };

    try {
      const response = await fetch(`${serverUrl}/texts/update/${text.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textData),
      });

      if (!response.ok) {
        console.error('Failed to save text:', await response.text());
      }

      console.log('Text saved:', text.id);
    } catch (err) {
      console.error('Error saving text:', err);
    }
  };

  // 텍스트 삭제
  const removeText = async (textId: string) => {
    if (!selectedFolder) return;

    try {
      await fetch(`${serverUrl}/texts/${textId}?folder=${selectedFolder}`, {
        method: 'DELETE',
      });

      setCanvasTexts(canvasTexts.filter(t => t.id !== textId));
      setSelectedTextId(null);
      setMenuOpenId(null);
    } catch (err) {
      console.error('Error removing text:', err);
    }
  };

  // 캔버스에 이미지 추가 (새로 업로드된 이미지)
  const addImageToCanvas = (imageUrl: string) => {
    // 이미지를 로드하여 실제 비율 계산
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const defaultWidth = 200;
      const defaultHeight = defaultWidth / aspectRatio;

      const newImage: CanvasImage = {
        id: `img-${Date.now()}-${Math.random()}`,
        url: imageUrl,
        x: 100,
        y: 100,
        width: defaultWidth,
        height: defaultHeight,
        zIndex: canvasImages.length,
        aspectRatio: aspectRatio,
      };
      setCanvasImages([...canvasImages, newImage]);

      // 새 이미지 위치 즉시 저장
      saveImagePosition(newImage);
    };
    img.src = imageUrl;
  };

  // 마우스/터치에서 좌표 추출 헬퍼 함수
  const getClientPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  // 이미지 드래그 시작 (마우스)
  const handleMouseDown = (e: React.MouseEvent, imageId: string) => {
    const image = canvasImages.find(img => img.id === imageId);
    if (!image) return;

    const { x, y } = getClientPosition(e);
    setSelectedImageId(imageId);
    setSelectedTextId(null);
    setDragging(true);
    setDragOffset({
      x: x - image.x,
      y: y - image.y,
    });
    // 드래그 시작 위치 저장
    setDragStartPos({ x: image.x, y: image.y });
  };

  // 텍스트 드래그 시작 (마우스)
  const handleTextMouseDown = (e: React.MouseEvent, textId: string) => {
    if (editingTextId === textId) return; // 편집 중이면 드래그 안됨

    const text = canvasTexts.find(t => t.id === textId);
    if (!text) return;

    const { x, y } = getClientPosition(e);
    setSelectedTextId(textId);
    setSelectedImageId(null);
    setDragging(true);
    setDragOffset({
      x: x - text.x,
      y: y - text.y,
    });
    setDragStartPos({ x: text.x, y: text.y });
  };

  // 이미지 드래그 시작 (터치)
  const handleTouchStart = (e: React.TouchEvent, imageId: string) => {
    e.preventDefault(); // 스크롤 방지
    const image = canvasImages.find(img => img.id === imageId);
    if (!image) return;

    const { x, y } = getClientPosition(e);
    setSelectedImageId(imageId);
    setDragging(true);
    setDragOffset({
      x: x - image.x,
      y: y - image.y,
    });
    // 드래그 시작 위치 저장
    setDragStartPos({ x: image.x, y: image.y });
  };

  // 리사이즈 시작 (마우스)
  const handleResizeStart = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    const image = canvasImages.find(img => img.id === imageId);
    if (!image) return;

    const { x, y } = getClientPosition(e);
    setSelectedImageId(imageId);
    setResizing(true);
    setResizeStart({
      x,
      y,
      width: image.width,
      height: image.height,
    });
  };

  // 리사이즈 시작 (터치)
  const handleResizeTouchStart = (e: React.TouchEvent, imageId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const image = canvasImages.find(img => img.id === imageId);
    if (!image) return;

    const { x, y } = getClientPosition(e);
    setSelectedImageId(imageId);
    setResizing(true);
    setResizeStart({
      x,
      y,
      width: image.width,
      height: image.height,
    });
  };

  // 텍스트 리사이즈 시작
  const handleTextResizeStart = (e: React.MouseEvent, textId: string) => {
    e.stopPropagation();
    const text = canvasTexts.find(t => t.id === textId);
    if (!text) return;

    const { x, y } = getClientPosition(e);
    setSelectedTextId(textId);
    setResizing(true);
    setResizeStart({
      x,
      y,
      width: text.width,
      height: text.height,
    });
  };

  // 이미지/텍스트 드래그 중 또는 리사이즈 중 (마우스)
  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getClientPosition(e);

    if (resizing && selectedImageId) {
      // 이미지 리사이즈 중
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const delta = Math.max(deltaX, deltaY);

      setCanvasImages(
        canvasImages.map(img => {
          if (img.id === selectedImageId) {
            const newWidth = Math.max(50, resizeStart.width + delta);
            const newHeight = img.aspectRatio
              ? newWidth / img.aspectRatio
              : Math.max(50, resizeStart.height + delta);

            return {
              ...img,
              width: newWidth,
              height: newHeight,
            };
          }
          return img;
        })
      );
    } else if (resizing && selectedTextId) {
      // 텍스트 리사이즈 중
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const delta = Math.max(deltaX, deltaY);

      setCanvasTexts(
        canvasTexts.map(text => {
          if (text.id === selectedTextId) {
            return {
              ...text,
              width: Math.max(100, resizeStart.width + delta),
              height: Math.max(50, resizeStart.height + delta),
            };
          }
          return text;
        })
      );
    } else if (dragging && selectedImageId) {
      // 이미지 드래그 중
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      setCanvasImages(
        canvasImages.map(img => (img.id === selectedImageId ? { ...img, x: newX, y: newY } : img))
      );
    } else if (dragging && selectedTextId) {
      // 텍스트 드래그 중
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      setCanvasTexts(
        canvasTexts.map(text => (text.id === selectedTextId ? { ...text, x: newX, y: newY } : text))
      );
    }
  };

  // 이미지 드래그 중 또는 리사이즈 중 (터치)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging && !resizing) return;
    e.preventDefault(); // 스크롤 방지

    const { x, y } = getClientPosition(e);

    if (resizing && selectedImageId) {
      // 리사이즈 중
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      const delta = Math.max(deltaX, deltaY);

      setCanvasImages(
        canvasImages.map(img => {
          if (img.id === selectedImageId) {
            const newWidth = Math.max(50, resizeStart.width + delta);
            // aspectRatio가 있으면 비율을 유지하면서 높이 계산
            const newHeight = img.aspectRatio
              ? newWidth / img.aspectRatio
              : Math.max(50, resizeStart.height + delta);

            return {
              ...img,
              width: newWidth,
              height: newHeight,
            };
          }
          return img;
        })
      );
    } else if (dragging && selectedImageId) {
      // 드래그 중
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      setCanvasImages(
        canvasImages.map(img => (img.id === selectedImageId ? { ...img, x: newX, y: newY } : img))
      );
    }
  };

  // 드래그/리사이즈 종료
  const handleMouseUp = () => {
    if (selectedImageId) {
      const image = canvasImages.find(img => img.id === selectedImageId);
      if (image) {
        let shouldSave = false;

        if (resizing) {
          shouldSave = true;
        } else if (dragging && dragStartPos) {
          const deltaX = Math.abs(image.x - dragStartPos.x);
          const deltaY = Math.abs(image.y - dragStartPos.y);
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance >= 5) {
            shouldSave = true;
          }
        }

        if (shouldSave) {
          saveImagePosition(image);
        }
      }
    } else if (selectedTextId) {
      const text = canvasTexts.find(t => t.id === selectedTextId);
      if (text) {
        let shouldSave = false;

        if (resizing) {
          shouldSave = true;
        } else if (dragging && dragStartPos) {
          const deltaX = Math.abs(text.x - dragStartPos.x);
          const deltaY = Math.abs(text.y - dragStartPos.y);
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance >= 5) {
            shouldSave = true;
          }
        }

        if (shouldSave) {
          saveTextPosition(text);
        }
      }
    }

    setDragging(false);
    setResizing(false);
    setDragStartPos(null);
  };

  // 터치 종료
  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // 캔버스 클릭 (빈 영역)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedImageId(null);
      setSelectedTextId(null);
      setEditingTextId(null);
      setMenuOpenId(null);
    }
  };

  // 캔버스에서 이미지 삭제
  const removeFromCanvas = async (imageId: string) => {
    const image = canvasImages.find(img => img.id === imageId);
    if (!image) return;

    // 확인 대화상자
    if (!confirm('이 이미지를 삭제하시겠습니까?')) {
      setMenuOpenId(null);
      return;
    }

    try {
      // URL에서 파일명 추출
      const filename = image.url.split('/').pop();
      if (!filename || !selectedFolder) {
        alert('파일명 또는 폴더 정보가 없습니다.');
        return;
      }

      // 서버에서 이미지 파일 삭제 (폴더 경로 포함)
      const deleteUrl = `${serverUrl}/images/${selectedFolder}/${filename}`;
      console.log('Deleting image:', { folder: selectedFolder, filename, url: deleteUrl });

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '서버에서 이미지 삭제 실패');
      }

      const result = await response.json();
      console.log('Delete response:', result);

      // 캔버스에서 제거
      setCanvasImages(canvasImages.filter(img => img.id !== imageId));
      if (selectedImageId === imageId) {
        setSelectedImageId(null);
      }
      setMenuOpenId(null);

      console.log('Image deleted successfully:', { folder: selectedFolder, filename });
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(
        `이미지 삭제 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
      );
    }
  };

  // 이미지 URL 복사
  const copyImageUrl = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl);
    alert('URL이 클립보드에 복사되었습니다!');
    setMenuOpenId(null);
  };

  // 이미지 복사 (다른 폴더로 복사하기 위한 기능)
  const copyImageForPaste = (imageUrl: string) => {
    setCopiedImageUrl(imageUrl);
    alert('이미지가 복사되었습니다! 다른 폴더에서 붙여넣기하세요.');
    setMenuOpenId(null);
  };

  // 이미지 붙여넣기 (복사한 이미지를 현재 폴더에 업로드)
  const pasteImage = async () => {
    if (!copiedImageUrl || !selectedFolder) return;

    try {
      // 복사된 이미지 URL에서 이미지를 다운로드
      const response = await fetch(copiedImageUrl);
      const blob = await response.blob();

      // 파일명 추출 및 고유한 이름 생성
      const originalFilename = copiedImageUrl.split('/').pop() || 'image.jpg';
      const extension = originalFilename.split('.').pop();
      const nameWithoutExt = originalFilename.replace(`.${extension}`, '');
      const timestamp = Date.now();
      const newFilename = `${nameWithoutExt}_${timestamp}.${extension}`;

      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, newFilename);

      // 현재 폴더에 업로드
      const uploadResponse = await fetch(`${serverUrl}/upload?folder=${selectedFolder}`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('이미지 업로드 실패');
      }

      const data = await uploadResponse.json();

      // 업로드된 이미지를 캔버스에 추가
      addImageToCanvas(data.data.url);

      alert('이미지가 붙여넣기되었습니다!');
      setCopiedImageUrl(null); // 붙여넣기 후 클립보드 초기화
    } catch (err) {
      console.error('Error pasting image:', err);
      alert('이미지 붙여넣기 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 토글
  const toggleMenu = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === imageId ? null : imageId);
  };

  // 컴포넌트 마운트 시 폴더 불러오기
  useEffect(() => {
    fetchFolders();
  }, []);

  // 폴더 목록이 로드되면 마지막 선택한 폴더 복원 (없으면 첫 번째 폴더)
  useEffect(() => {
    if (folders.length > 0 && !selectedFolder) {
      // localStorage에서 마지막 선택한 폴더 가져오기
      const lastSelectedFolder = localStorage.getItem('lastSelectedFolder');

      // 마지막 선택한 폴더가 현재 폴더 목록에 존재하는지 확인
      if (lastSelectedFolder && folders.includes(lastSelectedFolder)) {
        setSelectedFolder(lastSelectedFolder);
      } else {
        // 없으면 첫 번째 폴더 선택
        setSelectedFolder(folders[0]);
      }
    }
  }, [folders]);

  // 폴더 선택 시 서버에서 이미지 불러오기 및 localStorage에 저장
  useEffect(() => {
    if (selectedFolder) {
      // localStorage에 마지막 선택한 폴더 저장
      localStorage.setItem('lastSelectedFolder', selectedFolder);

      // 서버에서 이미지 불러오기
      loadFolderImages(selectedFolder);
    }
  }, [selectedFolder]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <ThemeToggle />

      {/* 상단 헤더 + 폴더 영역 */}
      <div className="p-8 pb-4">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">명가 듀얼 이미지 대시보드</h1>

            {/* 이미지 업로드 & 텍스트 추가 & 붙여넣기 버튼 (오른쪽 정렬) */}
            <div className="flex justify-end gap-2">
              {/* 이미지 붙여넣기 버튼 (복사된 이미지가 있을 때만 표시) */}
              {copiedImageUrl && (
                <button
                  onClick={pasteImage}
                  disabled={!selectedFolder}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    !selectedFolder
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 hover:scale-110'
                  }`}
                  title="이미지 붙여넣기"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </button>
              )}

              {/* 텍스트 추가 버튼 */}
              <button
                onClick={addTextToCanvas}
                disabled={!selectedFolder}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  !selectedFolder
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 hover:scale-110'
                }`}
                title="텍스트 추가"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>

              {/* 이미지 업로드 버튼 */}
              <label className="relative cursor-pointer group">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    uploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
                  }`}
                >
                  {uploading ? (
                    <svg
                      className="animate-spin w-5 h-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                {!uploading && (
                  <div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-text-secondary whitespace-nowrap">
                    이미지 업로드
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Mixed Content 경고 (GitHub Pages 환경) */}
          {showMixedContentWarning && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-yellow-600 dark:text-yellow-400 font-semibold mb-2">
                    ⚠️ 브라우저 설정 필요
                  </h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                    이 페이지는 HTTPS이지만 이미지 서버는 HTTP입니다. 브라우저가 Mixed Content를
                    차단할 수 있습니다.
                  </p>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    <strong>해결 방법:</strong>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Chrome: 주소창 오른쪽 방패 아이콘 → "안전하지 않은 콘텐츠 로드" 클릭</li>
                      <li>Firefox: 주소창 자물쇠 아이콘 → "연결 안전하지 않음" → "보호 끄기"</li>
                      <li>Safari: 설정 → 고급 → "안전하지 않은 콘텐츠 표시" 활성화</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => setShowMixedContentWarning(false)}
                  className="ml-4 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-500">
              {error}
            </div>
          )}

          {/* 폴더 관리 섹션 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">폴더 ({folders.length}개)</h2>
              <div className="flex gap-2">
                {showFolderInput ? (
                  <>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && createFolder()}
                      placeholder="폴더 이름"
                      className="px-3 py-2 bg-bg-primary border border-border-primary rounded text-text-primary"
                      autoFocus
                    />
                    <button
                      onClick={createFolder}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      생성
                    </button>
                    <button
                      onClick={() => {
                        setShowFolderInput(false);
                        setNewFolderName('');
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowFolderInput(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    + 폴더 추가
                  </button>
                )}
              </div>
            </div>

            {/* 폴더 리스트 */}
            <div className="flex gap-2 flex-wrap">
              {folders.map(folder => (
                <div
                  key={folder}
                  className={`group relative px-4 py-2 rounded cursor-pointer transition-colors ${
                    selectedFolder === folder
                      ? 'bg-blue-600 text-white'
                      : 'bg-bg-secondary hover:bg-bg-tertiary border border-border-primary'
                  }`}
                  onClick={() => setSelectedFolder(folder)}
                >
                  <span>{folder}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteFolder(folder);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {folders.length === 0 && (
                <p className="text-text-secondary text-sm">폴더가 없습니다. 폴더를 추가해주세요.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 캔버스 섹션 - 스크롤 가능 */}
      <div className="relative px-8">
        {/* 줌 컨트롤 버튼 */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50 bg-bg-primary border border-border-primary rounded-lg p-2 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
            title="확대 (Ctrl + 휠)"
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className="w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center text-xs transition-colors"
            title="초기화"
          >
            {Math.round(canvasZoom * 100)}%
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center text-xl font-bold transition-colors"
            title="축소 (Ctrl + 휠)"
          >
            −
          </button>
        </div>

        <div ref={canvasContainerRef} className="overflow-auto" onWheel={handleWheel}>
          <div
            style={{
              width: '2000px',
              height: '2000px',
              transform: `scale(${canvasZoom})`,
              transformOrigin: '0 0',
              transition: 'transform 0.1s ease-out',
            }}
          >
            {/* 캔버스 영역 */}
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative bg-bg-secondary border-2 border-border-primary rounded-lg"
              style={{
                cursor: dragging ? 'grabbing' : resizing ? 'nwse-resize' : 'default',
                width: '2000px',
                height: '2000px',
              }}
            >
              {!selectedFolder ? (
                <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
                  폴더를 선택해주세요
                </div>
              ) : canvasImages.length === 0 && canvasTexts.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
                  이미지를 업로드하거나 텍스트를 추가하세요
                </div>
              ) : (
                <>
                  {/* 이미지 렌더링 */}
                  {canvasImages.map(img => (
                    <div
                      key={img.id}
                      onMouseDown={e => handleMouseDown(e, img.id)}
                      onTouchStart={e => handleTouchStart(e, img.id)}
                      className={`absolute cursor-grab ${
                        selectedImageId === img.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        left: `${img.x}px`,
                        top: `${img.y}px`,
                        width: `${img.width}px`,
                        height: `${img.height}px`,
                        zIndex: img.zIndex,
                        touchAction: 'none',
                      }}
                    >
                      <img
                        src={img.url}
                        alt="canvas-img"
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />

                      {/* ... 메뉴 버튼 (이미지 중앙, 선택된 경우에만 표시) */}
                      {selectedImageId === img.id && (
                        <>
                          <button
                            onClick={e => toggleMenu(e, img.id)}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gray-700/90 hover:bg-gray-600 text-white rounded-full flex items-center justify-center shadow-lg z-10"
                          >
                            ⋮
                          </button>

                          {/* 드롭다운 메뉴 */}
                          {menuOpenId === img.id && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-6 bg-bg-primary border border-border-primary rounded shadow-lg overflow-hidden z-20">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  copyImageUrl(img.url);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-bg-secondary transition-colors text-sm whitespace-nowrap"
                              >
                                URL 복사
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  copyImageForPaste(img.url);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-bg-secondary transition-colors text-sm whitespace-nowrap"
                              >
                                이미지 복사
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  removeFromCanvas(img.id);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-bg-secondary transition-colors text-sm text-red-500"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* 리사이즈 핸들 (오른쪽 하단) */}
                      {selectedImageId === img.id && (
                        <div
                          onMouseDown={e => handleResizeStart(e, img.id)}
                          onTouchStart={e => handleResizeTouchStart(e, img.id)}
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full cursor-nwse-resize hover:bg-blue-400 shadow-lg z-10"
                          style={{ cursor: 'nwse-resize', touchAction: 'none' }}
                        />
                      )}
                    </div>
                  ))}

                  {/* 텍스트 렌더링 */}
                  {canvasTexts.map(text => (
                    <div
                      key={text.id}
                      onMouseDown={e => handleTextMouseDown(e, text.id)}
                      className={`absolute cursor-move ${
                        selectedTextId === text.id ? 'ring-2 ring-green-500' : ''
                      }`}
                      style={{
                        left: `${text.x}px`,
                        top: `${text.y}px`,
                        width: `${text.width}px`,
                        height: `${text.height}px`,
                        zIndex: text.zIndex,
                      }}
                    >
                      {editingTextId === text.id ? (
                        <textarea
                          autoFocus
                          value={text.text}
                          onChange={e => {
                            const newText = e.target.value;
                            setCanvasTexts(
                              canvasTexts.map(t => (t.id === text.id ? { ...t, text: newText } : t))
                            );
                          }}
                          onBlur={() => {
                            setEditingTextId(null);
                            saveTextPosition(text);
                          }}
                          className="w-full h-full p-2 bg-white border-2 border-green-500 rounded resize-none focus:outline-none"
                          style={{
                            fontSize: `${text.fontSize}px`,
                            color: text.color,
                          }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => setEditingTextId(text.id)}
                          className="w-full h-full p-2 bg-white/90 border border-gray-300 rounded overflow-auto whitespace-pre-wrap break-words"
                          style={{
                            fontSize: `${text.fontSize}px`,
                            color: text.color,
                          }}
                        >
                          {text.text}
                        </div>
                      )}

                      {/* ... 메뉴 버튼 (텍스트 중앙, 선택된 경우에만 표시) */}
                      {selectedTextId === text.id && !editingTextId && (
                        <>
                          <button
                            onClick={e => toggleMenu(e, text.id)}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gray-700/90 hover:bg-gray-600 text-white rounded-full flex items-center justify-center shadow-lg z-10"
                          >
                            ⋮
                          </button>

                          {menuOpenId === text.id && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-6 bg-bg-primary border border-border-primary rounded shadow-lg overflow-hidden z-20">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingTextId(text.id);
                                  setMenuOpenId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-bg-secondary transition-colors text-sm whitespace-nowrap"
                              >
                                편집
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  removeText(text.id);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-bg-secondary transition-colors text-sm text-red-500"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* 리사이즈 핸들 (오른쪽 하단) */}
                      {selectedTextId === text.id && !editingTextId && (
                        <div
                          onMouseDown={e => handleTextResizeStart(e, text.id)}
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full cursor-nwse-resize hover:bg-green-400 shadow-lg z-10"
                          style={{ cursor: 'nwse-resize' }}
                        />
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2 mb-4 text-xs text-text-secondary">
          💡 이미지를 클릭하고 드래그하여 이동 | 오른쪽 하단 핸들로 크기 조절 | ... 버튼으로 URL
          복사/삭제 | Ctrl+휠로 확대/축소
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
