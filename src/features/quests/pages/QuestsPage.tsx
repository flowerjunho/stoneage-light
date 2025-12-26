import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import questWithContentData from '@/data/questWithContent.json';
import { matchesConsonantSearch } from '@/shared/utils/searchUtils';
import SearchBar from '@/shared/components/ui/SearchBar';

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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm font-medium text-accent">{currentTabInfo.description}</span>
          </div>

          {/* 정보성 알림 박스 */}
          <div className="bg-bg-secondary rounded-2xl p-4 border border-border space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary text-left">
                퀘스트 정보는 <span className="font-medium text-text-primary">{currentTabInfo.source}</span>의 정보입니다.
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 text-left">
                어두운 테마에서 내용이 잘 보이지 않으면 밝은 테마로 변경해 주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 선택 */}
      <div className="mb-6 px-4 md:px-0">
        <div className="relative flex bg-bg-secondary rounded-2xl p-1.5 border border-border">
          {/* 슬라이딩 배경 인디케이터 */}
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-accent shadow-glow
                       transition-all duration-300 ease-out-expo pointer-events-none"
            style={{
              left: activeTab === 'hwansoo' ? '6px' : 'calc(50% + 2px)',
              width: 'calc(50% - 8px)',
            }}
          />
          <button
            onClick={() => handleTabChange('hwansoo')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                       text-sm font-medium transition-colors duration-300 ${
                         activeTab === 'hwansoo' ? 'text-text-inverse' : 'text-text-secondary hover:text-text-primary'
                       }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            환수강림
          </button>
          <button
            onClick={() => handleTabChange('pooyas')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                       text-sm font-medium transition-colors duration-300 ${
                         activeTab === 'pooyas' ? 'text-text-inverse' : 'text-text-secondary hover:text-text-primary'
                       }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            뿌야
          </button>
        </div>
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
        <div className="bg-bg-secondary rounded-2xl p-4 border border-border">
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
        </div>
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
            <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">준비 중입니다</h3>
          <p className="text-text-secondary">{currentTabInfo.name} 퀘스트 데이터를 준비하고 있습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuests.length > 0 ? (
            filteredQuests.map(quest => {
              return (
                <div
                  key={quest.idx}
                  onClick={() => handleQuestClick(quest.idx)}
                  className="group bg-bg-secondary hover:bg-bg-tertiary border border-border
                           hover:border-accent/50 rounded-2xl p-4 cursor-pointer
                           transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-text-primary font-semibold group-hover:text-accent transition-colors duration-200 line-clamp-2 mb-2">
                        {quest.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        상세 가이드 보기
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-10 h-10 bg-accent/10 group-hover:bg-accent group-hover:shadow-glow
                                    rounded-xl flex items-center justify-center transition-all duration-300">
                        <svg
                          className="h-4 w-4 text-accent group-hover:text-text-inverse transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                            flex items-center justify-center">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">검색 결과가 없습니다</h3>
              <p className="text-text-secondary">다른 키워드로 검색해보세요</p>
            </div>
          )}
        </div>
      )}

      {/* 푸터 정보 */}
      <div className="mt-8">
        <div className="bg-bg-secondary rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
        </div>
      </div>
    </div>
  );
};

export default QuestsPage;
