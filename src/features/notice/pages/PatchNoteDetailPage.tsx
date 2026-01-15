import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, AlertCircle, Loader2, Info } from 'lucide-react';
import patchnotesData from '@/data/patchnotes.json';
import noticesData from '@/data/notices.json';
import '@/styles/quest-content.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
      <div className="max-w-4xl mx-auto px-4 py-6 iphone16:px-3">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <p className="text-text-secondary">{currentTypeInfo.loadingText}</p>
        </div>
      </div>
    );
  }

  if (!noticeItem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 iphone16:px-3">
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            {currentTypeInfo.notFoundTitle}
          </h3>
          <p className="text-text-secondary mb-6">
            {currentTypeInfo.notFoundDesc}
          </p>
          <Button onClick={handleGoBack} className="shadow-glow">
            {currentTypeInfo.backButtonText}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="mb-4 gap-2 text-text-secondary hover:text-accent group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {currentTypeInfo.listName}
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
          {noticeItem.title}
        </h1>

        {/* 날짜 정보 */}
        <div className="flex items-center gap-2 text-text-secondary mb-4">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{noticeItem.date}</span>
        </div>

        {/* 액션 버튼 */}
        <Button
          variant="outline"
          onClick={handleOpenOriginal}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          원본 페이지 열기
        </Button>
      </div>

      {/* 컨텐츠 */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="quest-content">
            {renderHtmlContent(noticeItem.contentHtml)}
          </div>
        </div>
      </Card>

      {/* 푸터 정보 */}
      <div className="mt-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">도움말</h3>
          </div>
          <div className="space-y-2.5 text-sm text-text-secondary">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>원본 페이지에서 더 많은 정보를 확인할 수 있습니다</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>문의사항은 게시판을 이용해 주세요</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PatchNoteDetailPage;
