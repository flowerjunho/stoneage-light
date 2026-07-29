import React, { useState, useEffect } from 'react';
import { EventTracker } from '@/shared/utils/eventTracker';
import { X, Search, Activity, MousePointerClick, AppWindow } from 'lucide-react';

interface AdminEventStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDateStr?: string;
}

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
  };

  stats.forEach(dayStat => {
    ['PAGE_VIEW', 'TAB_CLICK', 'BUTTON_CLICK'].forEach(type => {
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

  const sortStats = (obj: Record<string, number>) => {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-bg-secondary w-full max-w-4xl h-[85vh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        {/* Mobile handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-bg-tertiary shrink-0">
          <div className="w-12 h-1.5 bg-border rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-bg-tertiary shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            상세 이벤트 통계
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-bg-primary transition-colors text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker Area */}
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 bg-bg-primary/50 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">시작일:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-bg-secondary border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">종료일:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="bg-bg-secondary border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <button 
            onClick={() => fetchStats(startDate, endDate)}
            className="flex items-center gap-1 bg-accent text-white px-3 py-1.5 rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            <Search className="w-4 h-4" /> 조회
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center text-text-secondary py-12">
              해당 기간의 데이터가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PAGE VIEWS */}
              <div className="bg-bg-tertiary rounded-lg border border-border p-4">
                <h3 className="font-bold flex items-center gap-2 border-b border-border pb-2 mb-3 text-blue-400">
                  <AppWindow className="w-4 h-4" /> 페이지 뷰
                </h3>
                <div className="space-y-2">
                  {sortStats(aggregated.PAGE_VIEW).length > 0 ? (
                    sortStats(aggregated.PAGE_VIEW).map(([path, count]) => (
                      <div key={path} className="flex justify-between items-center text-sm">
                        <span className="truncate pr-2 text-text-secondary" title={path}>{path}</span>
                        <span className="font-mono text-accent">{count.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-text-muted text-center py-2">데이터 없음</div>
                  )}
                </div>
              </div>

              {/* TAB CLICKS */}
              <div className="bg-bg-tertiary rounded-lg border border-border p-4">
                <h3 className="font-bold flex items-center gap-2 border-b border-border pb-2 mb-3 text-green-400">
                  <MousePointerClick className="w-4 h-4" /> 탭 클릭
                </h3>
                <div className="space-y-2">
                  {sortStats(aggregated.TAB_CLICK).length > 0 ? (
                    sortStats(aggregated.TAB_CLICK).map(([key, count]) => {
                      const [path, action] = key.split('::');
                      return (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <div className="flex flex-col truncate pr-2">
                            <span className="text-text-primary truncate" title={action}>{action || '알수없음'}</span>
                            <span className="text-[10px] text-text-muted truncate">{path}</span>
                          </div>
                          <span className="font-mono text-accent">{count.toLocaleString()}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-xs text-text-muted text-center py-2">데이터 없음</div>
                  )}
                </div>
              </div>

              {/* BUTTON CLICKS */}
              <div className="bg-bg-tertiary rounded-lg border border-border p-4">
                <h3 className="font-bold flex items-center gap-2 border-b border-border pb-2 mb-3 text-purple-400">
                  <MousePointerClick className="w-4 h-4" /> 버튼 클릭
                </h3>
                <div className="space-y-2">
                  {sortStats(aggregated.BUTTON_CLICK).length > 0 ? (
                    sortStats(aggregated.BUTTON_CLICK).map(([key, count]) => {
                      const [path, action] = key.split('::');
                      return (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <div className="flex flex-col truncate pr-2">
                            <span className="text-text-primary truncate" title={action}>{action || '알수없음'}</span>
                            <span className="text-[10px] text-text-muted truncate">{path}</span>
                          </div>
                          <span className="font-mono text-accent">{count.toLocaleString()}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-xs text-text-muted text-center py-2">데이터 없음</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEventStatsModal;
