import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, Info, Megaphone, FileText, Calendar, Eye, ChevronRight, Search, AlertTriangle } from 'lucide-react';
import patchnotesData from '@/data/patchnotes.json';
import noticesData from '@/data/notices.json';
import { matchesConsonantSearch } from '@/shared/utils/searchUtils';
import SearchBar from '@/shared/components/ui/SearchBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

  const renderNoticeList = (items: NoticeItem[], type: 'announcement' | 'patchnotes') => (
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map(item => (
          <Card
            key={item.id}
            onClick={() => handleItemClick(item.id, type)}
            className="group p-4 cursor-pointer transition-all duration-300
                     hover:border-accent/50 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-text-primary font-semibold group-hover:text-accent transition-colors duration-200 line-clamp-2 mb-2">
                  {item.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {item.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    상세 보기
                  </div>
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
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Bell className="w-4 h-4" />
            {currentTabInfo.description}
          </Badge>

          {/* 정보성 알림 박스 */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-text-secondary text-left">
                공지사항은 <span className="font-medium text-text-primary">{currentTabInfo.source}</span>의 정보입니다.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 탭 선택 */}
      <div className="mb-6 px-4 md:px-0">
        <Card className="relative p-1.5">
          {/* 슬라이딩 배경 인디케이터 */}
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-accent shadow-glow
                       transition-all duration-300 ease-out-expo pointer-events-none"
            style={{
              left: activeTab === 'announcement' ? '6px' : 'calc(50% + 2px)',
              width: 'calc(50% - 8px)',
            }}
          />
          <Button
            variant="ghost"
            onClick={() => handleTabChange('announcement')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300",
              activeTab === 'announcement' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Megaphone className="w-4 h-4" />
            공지
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleTabChange('patchnotes')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300",
              activeTab === 'patchnotes' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <FileText className="w-4 h-4" />
            패치노트
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
        placeholder={activeTab === 'patchnotes' ? '패치노트를 초성으로 검색하세요.' : '공지사항을 초성으로 검색하세요.'}
      />

      {/* 통계 정보 */}
      <div className="mb-6">
        <Card className="p-4">
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
        </Card>
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
                <AlertTriangle className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">준비 중입니다</h3>
              <p className="text-text-secondary">공지사항 데이터를 준비하고 있습니다.</p>
            </div>
          ) : (
            renderNoticeList(filteredNotices, 'announcement')
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
                <AlertTriangle className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">준비 중입니다</h3>
              <p className="text-text-secondary">패치노트 데이터를 준비하고 있습니다.</p>
            </div>
          ) : (
            renderNoticeList(filteredPatchnotes, 'patchnotes')
          )}
        </>
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
        </Card>
      </div>
    </div>
  );
};

export default NoticePage;
