import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EventTracker } from '@/shared/utils/eventTracker';
import { X, Search, Activity, MousePointerClick, AppWindow, MonitorSmartphone, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminEventStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDateStr?: string;
}

interface StatCategoryCardProps {
  title: string;
  icon: React.ReactNode;
  headerColorClass: string;
  items: [string, number][];
  renderItem: (item: [string, number]) => React.ReactNode;
}

const StatCategoryCard: React.FC<StatCategoryCardProps> = ({
  title,
  icon,
  headerColorClass,
  items,
  renderItem,
}) => {
  return (
    <div className="bg-bg-tertiary rounded-lg border border-border p-3 md:p-4 flex flex-col h-full shadow-sm">
      <h3 className={cn("font-bold flex items-center justify-between border-b border-border pb-2 mb-3 text-xs md:text-sm", headerColorClass)}>
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          {title}
        </span>
        <span className="text-[11px] font-normal text-text-muted shrink-0 ml-1">
          (총 {items.length}개)
        </span>
      </h3>

      {/* 모바일 및 PC 대응 카드 고정 높이 및 부드러운 내부 터치 스크롤 */}
      <div className="space-y-2 flex-1 max-h-56 md:max-h-72 overflow-y-auto pr-1 text-xs md:text-sm touch-pan-y overscroll-contain">
        {items.length > 0 ? (
          items.map(item => renderItem(item))
        ) : (
          <div className="text-xs text-text-muted text-center py-6">데이터 없음</div>
        )}
      </div>
    </div>
  );
};

const AdminEventStatsModal: React.FC<AdminEventStatsModalProps> = ({ isOpen, onClose, initialDateStr }) => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const [startDate, setStartDate] = useState(initialDateStr || today);
  const [endDate, setEndDate] = useState(initialDateStr || today);
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialDateStr) {
        setStartDate(initialDateStr);
        setEndDate(initialDateStr);
      }
      fetchStats(initialDateStr || today, initialDateStr || today);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, initialDateStr]);

  const fetchStats = async (start: string, end: string) => {
    setIsLoading(true);
    const data = await EventTracker.getEventStats(start, end);
    setStats(data);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  // Aggregate stats
  const aggregated = {
    PAGE_VIEW: {} as Record<string, number>,
    TAB_CLICK: {} as Record<string, number>,
    BUTTON_CLICK: {} as Record<string, number>,
    DEVICE_INFO: {} as Record<string, number>,
    IMPRESSION: {} as Record<string, number>,
    SEARCH: {} as Record<string, number>,
  };

  stats.forEach(dayStat => {
    ['PAGE_VIEW', 'TAB_CLICK', 'BUTTON_CLICK', 'DEVICE_INFO', 'IMPRESSION', 'SEARCH'].forEach(type => {
      if (dayStat[type]) {
        for (const [key, count] of Object.entries(dayStat[type] as Record<string, number>)) {
          const decodedKey = EventTracker.decodeKey(key);
          if (!aggregated[type as keyof typeof aggregated][decodedKey]) {
            aggregated[type as keyof typeof aggregated][decodedKey] = 0;
          }
          aggregated[type as keyof typeof aggregated][decodedKey] += count;
        }
      }
    });
  });

  const sortStats = (obj: Record<string, number>): [string, number][] => {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-bg-secondary w-full max-w-5xl h-[88vh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-bg-tertiary shrink-0">
          <div className="w-12 h-1.5 bg-border rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 md:p-4 border-b border-border bg-bg-tertiary shrink-0">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            상세 이벤트 통계
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-bg-primary transition-colors text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker Area */}
        <div className="p-3 md:p-4 border-b border-border flex flex-wrap items-center gap-2 md:gap-3 bg-bg-primary/50 shrink-0 text-xs md:text-sm">
          <div className="flex items-center gap-1.5">
            <label className="font-medium shrink-0">시작일:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-bg-secondary border border-border rounded px-2 py-1 focus:outline-none focus:border-accent text-xs md:text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="font-medium shrink-0">종료일:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="bg-bg-secondary border border-border rounded px-2 py-1 focus:outline-none focus:border-accent text-xs md:text-sm"
            />
          </div>
          <button 
            onClick={() => fetchStats(startDate, endDate)}
            className="flex items-center gap-1 bg-accent text-white px-3 py-1 rounded-md hover:bg-accent/90 transition-colors font-medium shrink-0 ml-auto md:ml-0"
          >
            <Search className="w-3.5 h-3.5 md:w-4 md:h-4" /> 조회
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 touch-pan-y">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center text-text-secondary py-12 text-xs md:text-sm">
              해당 기간의 데이터가 없습니다.
            </div>
          ) : (
            <>
              {/* 기기 통계 (PC vs Mobile) */}
              {(() => {
                const pcCount = aggregated.DEVICE_INFO?.['device::PC'] || 0;
                const mobileCount = aggregated.DEVICE_INFO?.['device::MOBILE'] || 0;
                const totalDevice = pcCount + mobileCount;
                const pcRatio = totalDevice > 0 ? Math.round((pcCount / totalDevice) * 100) : 0;
                const mobileRatio = totalDevice > 0 ? Math.round((mobileCount / totalDevice) * 100) : 0;
                
                const androidCount = aggregated.DEVICE_INFO?.['os::Android'] || 0;
                const iosCount = aggregated.DEVICE_INFO?.['os::iOS'] || 0;
                const winCount = aggregated.DEVICE_INFO?.['os::Windows'] || 0;
                const macCount = aggregated.DEVICE_INFO?.['os::macOS'] || 0;
                const totalOs = androidCount + iosCount + winCount + macCount;

                if (totalDevice === 0 && totalOs === 0) return null;

                return (
                  <div className="bg-bg-tertiary rounded-lg border border-border p-3 md:p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 shadow-sm">
                    {/* Device Form Factor */}
                    <div>
                      <h3 className="font-bold flex items-center gap-1.5 border-b border-border pb-2 mb-2.5 text-orange-400 text-xs md:text-sm">
                        <MonitorSmartphone className="w-4 h-4" /> 기기 접속 현황 (비율)
                      </h3>
                      <div className="flex flex-col items-start gap-2.5">
                        <div className="w-full bg-bg-secondary rounded-full h-4 md:h-5 overflow-hidden flex ring-1 ring-border">
                          {pcCount > 0 && (
                            <div 
                              className="bg-blue-500 h-full flex items-center justify-center text-[10px] md:text-[11px] text-white font-bold transition-all duration-500" 
                              style={{ width: `${pcRatio}%` }}
                              title={`PC: ${pcCount}명`}
                            >
                              {pcRatio > 10 ? `PC ${pcRatio}%` : ''}
                            </div>
                          )}
                          {mobileCount > 0 && (
                            <div 
                              className="bg-green-500 h-full flex items-center justify-center text-[10px] md:text-[11px] text-white font-bold transition-all duration-500" 
                              style={{ width: `${mobileRatio}%` }}
                              title={`Mobile: ${mobileCount}명`}
                            >
                              {mobileRatio > 10 ? `Mobile ${mobileRatio}%` : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs md:text-sm whitespace-nowrap w-full justify-start">
                          <div className="flex items-center gap-1.5 font-medium">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div> 
                            PC: <span className="font-mono text-accent">{pcCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div> 
                            모바일: <span className="font-mono text-accent">{mobileCount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed OS */}
                    <div>
                      <h3 className="font-bold flex items-center gap-1.5 border-b border-border pb-2 mb-2.5 text-pink-400 text-xs md:text-sm">
                        <MonitorSmartphone className="w-4 h-4" /> OS 및 상세 기기
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        <div className="flex gap-3 md:gap-4 text-xs md:text-sm flex-wrap items-center bg-bg-secondary p-2.5 md:p-3 rounded-md border border-border/50">
                          <div className="flex flex-col gap-1.5 min-w-[100px] md:min-w-[120px]">
                            <span className="text-[10px] md:text-xs text-text-muted">모바일 OS</span>
                            {androidCount > 0 && <div className="flex justify-between items-center gap-2"><span className="text-green-500">Android:</span> <span className="font-mono">{androidCount}</span></div>}
                            {iosCount > 0 && <div className="flex justify-between items-center gap-2"><span className="text-gray-300">iOS:</span> <span className="font-mono">{iosCount}</span></div>}
                            {androidCount === 0 && iosCount === 0 && <span className="text-xs text-text-secondary">-</span>}
                          </div>
                          <div className="w-px h-10 bg-border/50 hidden sm:block"></div>
                          <div className="flex flex-col gap-1.5 min-w-[100px] md:min-w-[120px]">
                            <span className="text-[10px] md:text-xs text-text-muted">데스크톱 OS</span>
                            {winCount > 0 && <div className="flex justify-between items-center gap-2"><span className="text-blue-400">Windows:</span> <span className="font-mono">{winCount}</span></div>}
                            {macCount > 0 && <div className="flex justify-between items-center gap-2"><span className="text-gray-300">macOS:</span> <span className="font-mono">{macCount}</span></div>}
                            {winCount === 0 && macCount === 0 && <span className="text-xs text-text-secondary">-</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {/* PAGE VIEWS */}
                <StatCategoryCard
                  title="페이지 뷰"
                  icon={<AppWindow className="w-4 h-4" />}
                  headerColorClass="text-blue-400"
                  items={sortStats(aggregated.PAGE_VIEW)}
                  renderItem={([path, count]) => (
                    <div key={path} className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-border/30 last:border-none">
                      <span className="truncate pr-2 text-text-secondary" title={path}>{path}</span>
                      <span className="font-mono text-accent shrink-0 font-medium">{count.toLocaleString()}</span>
                    </div>
                  )}
                />

                {/* TAB CLICKS */}
                <StatCategoryCard
                  title="탭 클릭"
                  icon={<MousePointerClick className="w-4 h-4" />}
                  headerColorClass="text-green-400"
                  items={sortStats(aggregated.TAB_CLICK)}
                  renderItem={([key, count]) => {
                    const [path, action] = key.split('::');
                    return (
                      <div key={key} className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-border/30 last:border-none">
                        <div className="flex flex-col truncate pr-2">
                          <span className="text-text-primary truncate font-medium" title={action}>{action || '알수없음'}</span>
                          <span className="text-[10px] text-text-muted truncate">{path}</span>
                        </div>
                        <span className="font-mono text-accent shrink-0 font-medium">{count.toLocaleString()}</span>
                      </div>
                    );
                  }}
                />

                {/* BUTTON CLICKS */}
                <StatCategoryCard
                  title="버튼 클릭"
                  icon={<MousePointerClick className="w-4 h-4" />}
                  headerColorClass="text-purple-400"
                  items={sortStats(aggregated.BUTTON_CLICK)}
                  renderItem={([key, count]) => {
                    const [path, action] = key.split('::');
                    return (
                      <div key={key} className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-border/30 last:border-none">
                        <div className="flex flex-col truncate pr-2">
                          <span className="text-text-primary truncate font-medium" title={action}>{action || '알수없음'}</span>
                          <span className="text-[10px] text-text-muted truncate">{path}</span>
                        </div>
                        <span className="font-mono text-accent shrink-0 font-medium">{count.toLocaleString()}</span>
                      </div>
                    );
                  }}
                />

                {/* IMPRESSIONS */}
                <StatCategoryCard
                  title="임프레션 (5초 이상)"
                  icon={<Eye className="w-4 h-4" />}
                  headerColorClass="text-yellow-400"
                  items={sortStats(aggregated.IMPRESSION)}
                  renderItem={([key, count]) => {
                    const [path, action] = key.split('::');
                    return (
                      <div key={key} className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-border/30 last:border-none">
                        <div className="flex flex-col truncate pr-2">
                          <span className="text-text-primary truncate font-medium" title={action}>{action || '알수없음'}</span>
                          <span className="text-[10px] text-text-muted truncate">{path}</span>
                        </div>
                        <span className="font-mono text-accent shrink-0 font-medium">{count.toLocaleString()}</span>
                      </div>
                    );
                  }}
                />

                {/* SEARCH */}
                <StatCategoryCard
                  title="검색어"
                  icon={<Search className="w-4 h-4" />}
                  headerColorClass="text-red-400"
                  items={sortStats(aggregated.SEARCH)}
                  renderItem={([key, count]) => {
                    const [path, action] = key.split('::');
                    return (
                      <div key={key} className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-border/30 last:border-none">
                        <div className="flex flex-col truncate pr-2">
                          <span className="text-text-primary truncate font-medium" title={action}>{action || '알수없음'}</span>
                          <span className="text-[10px] text-text-muted truncate">{path}</span>
                        </div>
                        <span className="font-mono text-accent shrink-0 font-medium">{count.toLocaleString()}</span>
                      </div>
                    );
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AdminEventStatsModal;
