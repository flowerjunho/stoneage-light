import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Terminal, Hash } from 'lucide-react';
import type { UserStats } from '../types';

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  user: UserStats | null;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ open, onClose, user }) => {
  if (!user) return null;

  const sortedCommands = Object.entries(user.commands || {})
    .sort(([, a], [, b]) => b - a);

  const sortedKeywords = Object.entries(user.keywords || {})
    .sort(([, a], [, b]) => b - a);

  const maxCmd = sortedCommands.length > 0 ? sortedCommands[0][1] : 1;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-bg-secondary border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-primary">
            <User className="w-5 h-5 text-accent" />
            {user.username}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Total */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-text-secondary">총 호출 수</span>
            <span className="text-lg font-bold text-accent tabular-nums">
              {user.count.toLocaleString()}
            </span>
          </div>

          {/* Commands */}
          {sortedCommands.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Terminal className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  사용 커맨드
                </span>
              </div>
              <div className="space-y-2">
                {sortedCommands.map(([cmd, count]) => (
                  <div key={cmd} className="flex items-center gap-3">
                    <span className="text-sm text-text-primary w-16 flex-shrink-0 truncate">
                      {cmd}
                    </span>
                    <div className="flex-1 h-5 bg-bg-tertiary/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxCmd) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-text-secondary tabular-nums w-8 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {sortedKeywords.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Hash className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  검색 키워드
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sortedKeywords.map(([kw, count]) => (
                  <span
                    key={kw}
                    className="tag text-xs"
                  >
                    {kw}
                    <span className="ml-1 text-accent font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
