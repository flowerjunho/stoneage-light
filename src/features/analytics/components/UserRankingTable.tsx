import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Medal, Award, Users, ChevronLeft, Terminal, Hash, User } from 'lucide-react';
import type { UserStats } from '../types';

interface UserRankingTableProps {
  users: Record<string, UserStats>;
  onUserClick: (userId: string) => void;
}

const getRankIcon = (rank: number) => {
  if (rank === 0) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (rank === 1) return <Medal className="w-4 h-4 text-gray-300" />;
  if (rank === 2) return <Award className="w-4 h-4 text-amber-600" />;
  return <span className="text-xs text-text-muted w-4 text-center">{rank + 1}</span>;
};

const UserRankingTable: React.FC<UserRankingTableProps> = ({ users, onUserClick }) => {
  const [showFullModal, setShowFullModal] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);

  const handleUserSelect = useCallback((id: string) => {
    if (scrollRef.current) {
      savedScrollTop.current = scrollRef.current.scrollTop;
    }
    setDetailUserId(id);
  }, []);

  const handleBack = useCallback(() => {
    setDetailUserId(null);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = savedScrollTop.current;
      }
    });
  }, []);

  const sorted = Object.entries(users)
    .map(([id, u]) => ({ id, ...u }))
    .sort((a, b) => b.count - a.count);

  const preview = sorted.slice(0, 10);
  const detailUser = detailUserId ? users[detailUserId] : null;

  if (sorted.length === 0) return null;

  const renderRow = (
    user: (typeof sorted)[0],
    idx: number,
    clickHandler: (id: string) => void,
  ) => (
    <tr
      key={user.id}
      onClick={() => clickHandler(user.id)}
      className="border-b border-border/10 hover:bg-accent/5 cursor-pointer transition-colors"
    >
      <td className="py-2.5 px-2">{getRankIcon(idx)}</td>
      <td className="py-2.5 px-2">
        <span className="text-sm font-medium text-text-primary hover:text-accent transition-colors">
          {user.username}
        </span>
      </td>
      <td className="py-2.5 px-2 text-right">
        <span className="text-sm font-semibold text-accent tabular-nums">
          {user.count.toLocaleString()}
        </span>
      </td>
    </tr>
  );

  const handleModalClose = () => {
    setShowFullModal(false);
    setDetailUserId(null);
  };

  const renderDetailView = () => {
    if (!detailUser) return null;
    const sortedCommands = Object.entries(detailUser.commands || {}).sort(([, a], [, b]) => b - a);
    const sortedKeywords = Object.entries(detailUser.keywords || {}).sort(([, a], [, b]) => b - a);
    const maxCmd = sortedCommands.length > 0 ? sortedCommands[0][1] : 1;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-text-secondary">총 호출 수</span>
          <span className="text-lg font-bold text-accent tabular-nums">
            {detailUser.count.toLocaleString()}
          </span>
        </div>

        {sortedCommands.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Terminal className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">사용 커맨드</span>
            </div>
            <div className="space-y-2">
              {sortedCommands.map(([cmd, count]) => (
                <div key={cmd} className="flex items-center gap-3">
                  <span className="text-sm text-text-primary w-16 flex-shrink-0 truncate">{cmd}</span>
                  <div className="flex-1 h-5 bg-bg-tertiary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxCmd) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-text-secondary tabular-nums w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Hash className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">검색 키워드</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sortedKeywords.map(([kw, count]) => (
                <span key={kw} className="tag text-xs">
                  {kw}
                  <span className="ml-1 text-accent font-semibold">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card variant="glass" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">유저 랭킹</h3>
          </div>
          <span className="text-xs text-text-muted">{sorted.length}명</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-xs font-medium text-text-muted py-2 px-2 w-10">#</th>
                <th className="text-left text-xs font-medium text-text-muted py-2 px-2">닉네임</th>
                <th className="text-right text-xs font-medium text-text-muted py-2 px-2">호출</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((user, idx) => renderRow(user, idx, onUserClick))}
            </tbody>
          </table>
        </div>
        {sorted.length > 10 && (
          <button
            onClick={() => setShowFullModal(true)}
            className="mt-3 w-full text-sm text-text-muted hover:text-accent transition-colors py-2 rounded-xl hover:bg-accent/5"
          >
            전체 보기 ({sorted.length}명)
          </button>
        )}
      </Card>

      <Dialog open={showFullModal} onOpenChange={v => { if (!v) handleModalClose(); }}>
        <DialogContent className="max-w-lg max-h-[80vh] bg-bg-secondary border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-text-primary">
              {detailUserId ? (
                <>
                  <button
                    onClick={handleBack}
                    className="p-1 -ml-1 rounded-lg hover:bg-accent/10 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-text-secondary hover:text-accent" />
                  </button>
                  <User className="w-5 h-5 text-accent" />
                  {detailUser?.username}
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-accent" />
                  유저 랭킹 ({sorted.length}명)
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div ref={scrollRef} className="overflow-y-auto max-h-[60vh] -mx-1 px-1">
            {detailUserId ? (
              renderDetailView()
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-bg-secondary z-10">
                  <tr className="border-b border-border/30">
                    <th className="text-left text-xs font-medium text-text-muted py-2 px-2 w-10">#</th>
                    <th className="text-left text-xs font-medium text-text-muted py-2 px-2">닉네임</th>
                    <th className="text-right text-xs font-medium text-text-muted py-2 px-2">호출</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((user, idx) =>
                    renderRow(user, idx, handleUserSelect),
                  )}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserRankingTable;
