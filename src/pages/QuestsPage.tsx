import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import questWithContentData from '../data/questWithContent.json';

interface QuestWithContent {
  idx: number;
  title: string;
  link: string;
  content: string;
}

const QuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [quests, setQuests] = useState<QuestWithContent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 데이터 로딩 시뮬레이션
    const loadQuests = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setQuests(questWithContentData);
      setIsLoading(false);
    };

    loadQuests();
  }, []);

  // 검색 필터링
  const filteredQuests = quests.filter(quest =>
    quest.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuestClick = (questIdx: number) => {
    navigate(`/quests/${questIdx}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="text-center text-text-secondary space-y-4">
          <p className="text-base md:text-lg">스톤에이지 환수강림 라이트 퀘스트 정보</p>
          
          {/* 정보성 알림 박스 */}
          <div className="bg-bg-secondary border-l-4 border-accent rounded-r-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="text-accent text-lg flex-shrink-0">📋</div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">
                  퀘스트 정보는 환수강림 라이트 공식홈페이지의 정보 입니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-yellow-500 text-lg flex-shrink-0">💡</div>
              <div className="text-left">
                <p className="text-sm text-text-secondary">
                  어두운 테마에서 퀘스트 내용이 잘 보이지 않는다면 밝은 테마로 변경해 주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="퀘스트 검색..."
            className="w-full px-4 py-3 pl-12 bg-bg-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="mb-6">
        <div className="bg-bg-secondary rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              총 <span className="font-bold text-accent">{quests.length}</span>개의 퀘스트
            </span>
            {searchTerm && (
              <span className="text-text-secondary">
                검색 결과: <span className="font-bold text-accent">{filteredQuests.length}</span>개
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 퀘스트 목록 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="mt-4 text-text-secondary">퀘스트 목록을 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuests.length > 0 ? (
            filteredQuests.map((quest) => {
              return (
                <div
                  key={quest.idx}
                  onClick={() => handleQuestClick(quest.idx)}
                  className="group bg-bg-secondary hover:bg-bg-tertiary border border-border hover:border-accent rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-text-primary font-medium group-hover:text-accent transition-colors duration-200 line-clamp-2">
                        {quest.title}
                      </h3>
                      <div className="mt-2 flex items-center text-xs text-text-secondary">
                        <svg
                          className="h-3 w-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        상세 가이드 보기
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-8 h-8 bg-accent/10 group-hover:bg-accent/20 rounded-full flex items-center justify-center transition-colors duration-200">
                        <svg
                          className="h-4 w-4 text-accent"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">검색 결과가 없습니다</h3>
              <p className="text-text-secondary">다른 키워드로 검색해보세요</p>
            </div>
          )}
        </div>
      )}

      {/* 푸터 정보 */}
      <div className="mt-8 text-center">
        <div className="bg-bg-secondary rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-4">📌 이용 안내</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>• 퀘스트 정보는 정기적으로 업데이트됩니다</p>
            <p>• 각 퀘스트를 클릭하면 상세 가이드를 확인할 수 있습니다</p>
            <p>• 퀘스트 진행 중 궁금한 점은 게시판을 이용해 주세요</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestsPage;
