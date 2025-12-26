import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import patchnotesData from '@/data/patchnotes.json';
import noticesData from '@/data/notices.json';
import '@/styles/quest-content.css';

interface NoticeItem {
  id: number;
  title: string;
  link: string;
  date: string;
  contentHtml: string;
}

type NoticeType = 'announcement' | 'patchnotes';

const PatchNoteDetailPage: React.FC = () => {
  const { type, noteId } = useParams<{ type: NoticeType; noteId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [noticeItem, setNoticeItem] = useState<NoticeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const noticeType: NoticeType = type === 'announcement' ? 'announcement' : 'patchnotes';

  const typeInfo = {
    announcement: {
      name: '공지',
      listName: '공지사항 목록',
      loadingText: '공지사항 상세 정보를 불러오는 중...',
      notFoundTitle: '공지사항을 찾을 수 없습니다',
      notFoundDesc: '요청하신 공지사항이 존재하지 않습니다',
      backButtonText: '공지사항 목록으로 돌아가기'
    },
    patchnotes: {
      name: '패치노트',
      listName: '패치노트 목록',
      loadingText: '패치노트 상세 정보를 불러오는 중...',
      notFoundTitle: '패치노트를 찾을 수 없습니다',
      notFoundDesc: '요청하신 패치노트가 존재하지 않습니다',
      backButtonText: '패치노트 목록으로 돌아가기'
    }
  };

  const currentTypeInfo = typeInfo[noticeType];

  useEffect(() => {
    const loadItem = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (noteId) {
        const noteIdx = parseInt(noteId, 10);
        const dataSource = noticeType === 'announcement' ? noticesData : patchnotesData;
        const foundItem = (dataSource as NoticeItem[]).find(item => item.id === noteIdx);
        if (foundItem) {
          setNoticeItem(foundItem);
        }
      }

      setIsLoading(false);
    };

    loadItem();
  }, [noteId, noticeType]);

  const handleGoBack = () => {
    const currentSearch = searchParams.get('search');
    let noticeUrl = `/notice?tab=${noticeType}`;
    if (currentSearch) {
      noticeUrl += `&search=${encodeURIComponent(currentSearch)}`;
    }
    navigate(noticeUrl);
  };

  const handleOpenOriginal = () => {
    if (noticeItem?.link) {
      window.open(noticeItem.link, '_blank', 'noopener,noreferrer');
    }
  };

  // HTML 콘텐츠를 그대로 렌더링하는 함수
  const renderHtmlContent = (htmlContent: string) => {
    // 이미지 src에 도메인이 없을 경우 https://www.hwansoo.top 추가
    const processedContent = htmlContent.replace(
      /(<img[^>]+src=")(?!https?:\/\/)([^"]+)(")/gi,
      '$1https://www.hwansoo.top$2$3'
    );

    return (
      <div
        className="quest-content"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 iphone16:px-3">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="mt-4 text-text-secondary">{currentTypeInfo.loadingText}</p>
        </div>
      </div>
    );
  }

  if (!noticeItem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 iphone16:px-3">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            {currentTypeInfo.notFoundTitle}
          </h3>
          <p className="text-text-secondary mb-6">
            {currentTypeInfo.notFoundDesc}
          </p>
          <button
            onClick={handleGoBack}
            className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
          >
            {currentTypeInfo.backButtonText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors duration-200 group"
          >
            <svg
              className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">{currentTypeInfo.listName}</span>
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
          {noticeItem.title}
        </h1>

        {/* 날짜 정보 */}
        <div className="flex items-center gap-2 text-text-secondary mb-4">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">{noticeItem.date}</span>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleOpenOriginal}
            className="flex items-center gap-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-xl px-4 py-2 text-sm font-medium text-text-primary transition-colors duration-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            원본 페이지 열기
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="bg-bg-secondary rounded-xl border border-border">
        <div className="p-6">
          <div className="quest-content">
            {renderHtmlContent(noticeItem.contentHtml)}
          </div>
        </div>
      </div>

      {/* 푸터 정보 */}
      <div className="mt-8 text-center">
        <div className="bg-bg-secondary rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-4">이용 안내</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>• 원본 페이지에서 더 많은 정보를 확인할 수 있습니다</p>
            <p>• 문의사항은 게시판을 이용해 주세요</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatchNoteDetailPage;
