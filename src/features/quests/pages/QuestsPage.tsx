import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EventTracker } from '@/shared/utils/eventTracker';
import { ClipboardCheck, Info, Sparkles, Archive, Eye, ChevronRight, Search, AlertTriangle, Sun } from 'lucide-react';
import questWithContentData from '@/data/questWithContent.json';
import { matchesConsonantSearch } from '@/shared/utils/searchUtils';
import SearchBar from '@/shared/components/ui/SearchBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuestWithContent {
  idx: number;
  title: string;
  link: string;
  content: string;
}

type QuestTab = 'hwansoo' | 'pooyas';

const QuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quests, setQuests] = useState<QuestWithContent[]>([]);
  const [pooyasQuests, setPooyasQuests] = useState<QuestWithContent[]>([]);
  const [activeTab, setActiveTab] = useState<QuestTab>(() => {
    return (searchParams.get('tab') as QuestTab) || 'hwansoo';
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('search') || '';
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuests = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setQuests(questWithContentData);

      // 뿌야 퀘스트 데이터 로드 시도
      try {
        const pooyasData = await import('@/data/pooyasQuests.json');
        setPooyasQuests(pooyasData.default || []);
      } catch {
        setPooyasQuests([]);
      }

      setIsLoading(false);
    };

    loadQuests();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        EventTracker.trackEvent('SEARCH', '퀘스트', searchTerm.trim());
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 현재 탭에 따른 퀘스트 목록
  const currentQuests = activeTab === 'hwansoo' ? quests : pooyasQuests;

  // 검색 필터링
  const filteredQuests = currentQuests.filter(quest => {
    if (!searchTerm.trim()) {
      return true;
    }
    return matchesConsonantSearch(searchTerm, quest.title);
  });

  const handleTabChange = (tab: QuestTab) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  };

  const handleQuestClick = (questIdx: number) => {
    const currentSearch = searchParams.get('search');
    const tab = activeTab;
    let questUrl = `/quests/${questIdx}?tab=${tab}`;
    if (currentSearch) {
      questUrl += `&search=${encodeURIComponent(currentSearch)}`;
    }
    navigate(questUrl);
  };

  const tabInfo = {
    hwansoo: {
      name: '환수강림',
      description: '스톤에이지 환수강림 라이트 퀘스트 정보',
      source: '환수강림 라이트 공식홈페이지'
    },
    pooyas: {
      name: '뿌야',
      description: '뿌야의 스톤에이지 퀘스트 정보',
      source: '뿌야의 스톤에이지'
    }
  };

  const currentTabInfo = tabInfo[activeTab];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <ClipboardCheck className="w-4 h-4" />
            {currentTabInfo.description}
          </Badge>

          {/* 정보성 알림 박스 */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-text-secondary text-left">
                퀘스트 정보는 <span className="font-medium text-text-primary">{currentTabInfo.source}</span>의 정보입니다.
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 text-left">
                어두운 테마에서 내용이 잘 보이지 않으면 밝은 테마로 변경해 주세요.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 탭 선택 */}
      <div className="mb-6 px-4 md:px-0">
        <Card className="relative p-1.5 overflow-hidden">
          {/* 슬라이딩 배경 인디케이터 - GPU 가속 사용 */}
          <div
            className={cn(
              "absolute top-1.5 left-1.5 h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-xl",
              "bg-accent shadow-glow pointer-events-none",
              "transition-transform duration-300 ease-out will-change-transform",
              activeTab === 'pooyas' && "translate-x-[calc(100%+6px)]"
            )}
          />
          <Button
            variant="ghost"
            onClick={() => handleTabChange('hwansoo')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-200",
              activeTab === 'hwansoo' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Sparkles className="w-4 h-4" />
            환수강림
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleTabChange('pooyas')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-200",
              activeTab === 'pooyas' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Archive className="w-4 h-4" />
            뿌야
          </Button>
        </Card>
      </div>

      {/* 검색 바 */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value.trim()) {
              newParams.set('search', value);
            } else {
              newParams.delete('search');
            }
            return newParams;
          });
        }}
        placeholder="퀘스트를 초성으로 검색하세요."
      />

      {/* 통계 정보 */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">{currentTabInfo.name}</p>
                <p className="text-lg font-bold text-text-primary tabular-nums">
                  {currentQuests.length.toLocaleString()}
                  <span className="text-sm font-normal text-text-muted ml-1">퀘스트</span>
                </p>
              </div>
            </div>
            {searchTerm && (
              <div className="text-right">
                <p className="text-xs text-text-muted">검색 결과</p>
                <p className="text-lg font-bold text-accent tabular-nums">{filteredQuests.length}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 퀘스트 목록 */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-text-secondary">퀘스트 목록을 불러오는 중...</p>
        </div>
      ) : currentQuests.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">준비 중입니다</h3>
          <p className="text-text-secondary">{currentTabInfo.name} 퀘스트 데이터를 준비하고 있습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuests.length > 0 ? (
            filteredQuests.map(quest => (
              <Card
                key={quest.idx}
                onClick={() => handleQuestClick(quest.idx)}
                className="group p-4 cursor-pointer transition-all duration-300
                         hover:border-accent/50 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-text-primary font-semibold group-hover:text-accent transition-colors duration-200 line-clamp-2 mb-2">
                      {quest.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Eye className="h-3.5 w-3.5" />
                      상세 가이드 보기
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-10 h-10 bg-accent/10 group-hover:bg-accent group-hover:shadow-glow
                                  rounded-xl flex items-center justify-center transition-all duration-300">
                      <ChevronRight className="h-4 w-4 text-accent group-hover:text-text-inverse transition-colors" />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                            flex items-center justify-center">
                <Search className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">검색 결과가 없습니다</h3>
              <p className="text-text-secondary">다른 키워드로 검색해보세요</p>
            </div>
          )}
        </div>
      )}

      {/* 푸터 정보 */}
      <div className="mt-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">이용 안내</h3>
          </div>
          <div className="space-y-2.5 text-sm text-text-secondary">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>퀘스트 정보는 정기적으로 업데이트됩니다</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>각 퀘스트를 클릭하면 상세 가이드를 확인할 수 있습니다</span>
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

export default QuestsPage;
