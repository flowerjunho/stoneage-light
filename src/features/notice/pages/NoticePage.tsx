import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import patchnotesData from '@/data/patchnotes.json';
import noticesData from '@/data/notices.json';
import { matchesConsonantSearch } from '@/shared/utils/searchUtils';
import SearchBar from '@/shared/components/ui/SearchBar';

interface NoticeItem {
  id: number;
  title: string;
  link: string;
  date: string;
  contentHtml: string;
}

type NoticeTab = 'announcement' | 'patchnotes';

const NoticePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [patchnotes, setPatchnotes] = useState<NoticeItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [activeTab, setActiveTab] = useState<NoticeTab>(() => {
    return (searchParams.get('tab') as NoticeTab) || 'announcement';
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('search') || '';
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setPatchnotes(patchnotesData as NoticeItem[]);
      setNotices(noticesData as NoticeItem[]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // 검색 필터링
  const filteredPatchnotes = patchnotes.filter(note => {
    if (!searchTerm.trim()) {
      return true;
    }
    return matchesConsonantSearch(searchTerm, note.title);
  });

  const filteredNotices = notices.filter(notice => {
    if (!searchTerm.trim()) {
      return true;
    }
    return matchesConsonantSearch(searchTerm, notice.title);
  });

  const handleTabChange = (tab: NoticeTab) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  };

  const handleItemClick = (itemId: number, type: 'announcement' | 'patchnotes') => {
    const currentSearch = searchParams.get('search');
    let url = `/notice/${type}/${itemId}`;
    if (currentSearch) {
      url += `?search=${encodeURIComponent(currentSearch)}`;
    }
    navigate(url);
  };

  const tabInfo = {
    announcement: {
      name: '공지',
      description: '환수강림 라이트 공지사항',
      source: '환수강림 라이트 공식홈페이지'
    },
    patchnotes: {
      name: '패치노트',
      description: '환수강림 라이트 패치노트',
      source: '환수강림 라이트 공식홈페이지'
    }
  };

  const currentTabInfo = tabInfo[activeTab];

  // 현재 탭에 따른 데이터 결정
  const currentData = activeTab === 'patchnotes' ? filteredPatchnotes : filteredNotices;
  const currentCount = activeTab === 'patchnotes' ? patchnotes.length : notices.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
                공지사항은 <span className="font-medium text-text-primary">{currentTabInfo.source}</span>의 정보입니다.
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
              left: activeTab === 'announcement' ? '6px' : 'calc(50% + 2px)',
              width: 'calc(50% - 8px)',
            }}
          />
          <button
            onClick={() => handleTabChange('announcement')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                       text-sm font-medium transition-colors duration-300 ${
                         activeTab === 'announcement' ? 'text-text-inverse' : 'text-text-secondary hover:text-text-primary'
                       }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            공지
          </button>
          <button
            onClick={() => handleTabChange('patchnotes')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                       text-sm font-medium transition-colors duration-300 ${
                         activeTab === 'patchnotes' ? 'text-text-inverse' : 'text-text-secondary hover:text-text-primary'
                       }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            패치노트
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
        placeholder={activeTab === 'patchnotes' ? '패치노트를 초성으로 검색하세요.' : '공지사항을 초성으로 검색하세요.'}
      />

      {/* 통계 정보 */}
      <div className="mb-6">
        <div className="bg-bg-secondary rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <span className="text-lg">{activeTab === 'patchnotes' ? '📢' : '📣'}</span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">{currentTabInfo.name}</p>
                <p className="text-lg font-bold text-text-primary tabular-nums">
                  {currentCount.toLocaleString()}
                  <span className="text-sm font-normal text-text-muted ml-1">개</span>
                </p>
              </div>
            </div>
            {searchTerm && (
              <div className="text-right">
                <p className="text-xs text-text-muted">검색 결과</p>
                <p className="text-lg font-bold text-accent tabular-nums">{currentData.length}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 공지 탭 콘텐츠 */}
      {activeTab === 'announcement' && (
        <>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                            flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-text-secondary">공지사항 목록을 불러오는 중...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                            flex items-center justify-center">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">준비 중입니다</h3>
              <p className="text-text-secondary">공지사항 데이터를 준비하고 있습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotices.length > 0 ? (
                filteredNotices.map(notice => {
                  return (
                    <div
                      key={notice.id}
                      onClick={() => handleItemClick(notice.id, 'announcement')}
                      className="group bg-bg-secondary hover:bg-bg-tertiary border border-border
                               hover:border-accent/50 rounded-2xl p-4 cursor-pointer
                               transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-text-primary font-semibold group-hover:text-accent transition-colors duration-200 line-clamp-2 mb-2">
                            {notice.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-text-muted">
                            <div className="flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {notice.date}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              상세 보기
                            </div>
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
        </>
      )}

      {/* 패치노트 목록 */}
      {activeTab === 'patchnotes' && (
        <>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                            flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-text-secondary">패치노트 목록을 불러오는 중...</p>
            </div>
          ) : patchnotes.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                            flex items-center justify-center">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">준비 중입니다</h3>
              <p className="text-text-secondary">패치노트 데이터를 준비하고 있습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatchnotes.length > 0 ? (
                filteredPatchnotes.map(note => {
                  return (
                    <div
                      key={note.id}
                      onClick={() => handleItemClick(note.id, 'patchnotes')}
                      className="group bg-bg-secondary hover:bg-bg-tertiary border border-border
                               hover:border-accent/50 rounded-2xl p-4 cursor-pointer
                               transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-text-primary font-semibold group-hover:text-accent transition-colors duration-200 line-clamp-2 mb-2">
                            {note.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-text-muted">
                            <div className="flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {note.date}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              상세 보기
                            </div>
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
        </>
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
              <span>패치노트는 정기적으로 업데이트됩니다</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>각 패치노트를 클릭하면 상세 내용을 확인할 수 있습니다</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>문의사항은 게시판을 이용해 주세요</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticePage;
