import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import questWithContentData from '@/data/questWithContent.json';
import '@/styles/quest-content.css';

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
      <div className="max-w-4xl mx-auto px-4 py-8 iphone16:px-3">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="mt-4 text-text-secondary">퀘스트 상세 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 iphone16:px-3">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            퀘스트를 찾을 수 없습니다
          </h3>
          <p className="text-text-secondary mb-6">
            요청하신 퀘스트가 존재하지 않습니다
          </p>
          <button
            onClick={handleGoBack}
            className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
          >
            퀘스트 목록으로 돌아가기
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
            <span className="font-medium">{tabInfo[activeTab].name} 퀘스트 목록</span>
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
          {quest.title}
        </h1>

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
            {renderHtmlContent(quest.content)}
          </div>
        </div>
      </div>

      {/* 푸터 정보 */}
      <div className="mt-8 text-center">
        <div className="bg-bg-secondary rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-4">💡 도움말</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>• 원본 페이지에서 더 많은 스크린샷과 상세 정보를 확인할 수 있습니다</p>
            <p>• 퀘스트 진행 중 궁금한 점은 게시판을 이용해 주세요</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestDetailPage;
