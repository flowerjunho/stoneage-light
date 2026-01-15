import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ClipboardCheck, AlertCircle, Loader2, Info } from 'lucide-react';
import questWithContentData from '@/data/questWithContent.json';
import '@/styles/quest-content.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QuestWithContent {
  idx: number;
  title: string;
  link: string;
  content: string;
}

type QuestTab = 'hwansoo' | 'pooyas';

const QuestDetailPage: React.FC = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quest, setQuest] = useState<QuestWithContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeTab = (searchParams.get('tab') as QuestTab) || 'hwansoo';

  useEffect(() => {
    const loadQuest = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (questId) {
        const questIdx = parseInt(questId, 10);

        if (activeTab === 'pooyas') {
          // 뿌야 퀘스트 데이터 로드
          try {
            const pooyasData = await import('@/data/pooyasQuests.json');
            const foundQuest = (pooyasData.default || []).find((q: QuestWithContent) => q.idx === questIdx);
            if (foundQuest) {
              setQuest(foundQuest);
            }
          } catch {
            setQuest(null);
          }
        } else {
          // 환수강림 퀘스트 데이터
          const foundQuest = questWithContentData.find(quest => quest.idx === questIdx);
          if (foundQuest) {
            setQuest(foundQuest);
          }
        }
      }

      setIsLoading(false);
    };

    loadQuest();
  }, [questId, activeTab]);

  const handleGoBack = () => {
    const currentSearch = searchParams.get('search');
    let questsUrl = `/quests?tab=${activeTab}`;
    if (currentSearch) {
      questsUrl += `&search=${encodeURIComponent(currentSearch)}`;
    }
    navigate(questsUrl);
  };

  const handleOpenOriginal = () => {
    if (quest?.link) {
      window.open(quest.link, '_blank', 'noopener,noreferrer');
    }
  };

  // HTML 콘텐츠를 그대로 렌더링하는 함수
  const renderHtmlContent = (htmlContent: string) => {
    let processedContent = htmlContent;

    if (activeTab === 'hwansoo') {
      // 환수강림: 이미지 src에 도메인이 없을 경우 https://www.hwansoo.top 추가
      processedContent = htmlContent.replace(
        /(<img[^>]+src=")(?!https?:\/\/)([^"]+)(")/gi,
        '$1https://www.hwansoo.top$2$3'
      );
    } else {
      // 뿌야: 이미지 src에 도메인이 없을 경우 https://pooyas.com 추가
      processedContent = htmlContent.replace(
        /(<img[^>]+src=")(?!https?:\/\/)([^"]+)(")/gi,
        '$1https://pooyas.com$2$3'
      );
    }

    return (
      <div
        className="quest-content"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  };

  const tabInfo = {
    hwansoo: { name: '환수강림' },
    pooyas: { name: '뿌야' }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 iphone16:px-3">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <p className="text-text-secondary">퀘스트 상세 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 iphone16:px-3">
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            퀘스트를 찾을 수 없습니다
          </h3>
          <p className="text-text-secondary mb-6">
            요청하신 퀘스트가 존재하지 않습니다
          </p>
          <Button onClick={handleGoBack} className="shadow-glow">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            퀘스트 목록으로 돌아가기
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
          {tabInfo[activeTab].name} 퀘스트 목록
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
          {quest.title}
        </h1>

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
            {renderHtmlContent(quest.content)}
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
              <span>원본 페이지에서 더 많은 스크린샷과 상세 정보를 확인할 수 있습니다</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>퀘스트 진행 중 궁금한 점은 게시판을 이용해 주세요</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuestDetailPage;
