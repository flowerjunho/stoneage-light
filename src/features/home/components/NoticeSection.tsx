import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, FileText, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SectionHeader from './SectionHeader';
import patchnotes from '@/data/patchnotes.json';
import notices from '@/data/notices.json';

type TabType = 'patchnotes' | 'announcement';

const NoticeSection = () => {
  const [activeTab, setActiveTab] = useState<TabType>('patchnotes');

  const patchnoteItems = patchnotes.slice(0, 5);
  const noticeItems = notices.slice(0, 5);
  const items = activeTab === 'patchnotes' ? patchnoteItems : noticeItems;

  return (
    <section>
      <SectionHeader
        title="공지사항"
        icon={<Bell className="w-5 h-5" />}
        linkTo="/notice"
        accentColor="text-amber-400"
      />

      <Card variant="glass" className="p-4">
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('patchnotes')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              activeTab === 'patchnotes'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-text-muted hover:text-text-secondary border border-transparent'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            패치노트
          </button>
          <button
            onClick={() => setActiveTab('announcement')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              activeTab === 'announcement'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-text-muted hover:text-text-secondary border border-transparent'
            )}
          >
            <Bell className="w-3.5 h-3.5" />
            공지
          </button>
        </div>

        {/* List */}
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={item.id}>
              <Link
                to={`/notice/${activeTab}/${item.id}`}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl',
                  'hover:bg-white/5 transition-colors duration-200 group'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {index === 0 && (
                    <Badge variant="warning" size="sm" className="flex-shrink-0">
                      NEW
                    </Badge>
                  )}
                  <span
                    className={cn(
                      'text-sm truncate',
                      index === 0 ? 'text-text-primary font-medium' : 'text-text-secondary'
                    )}
                  >
                    {item.title}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {items.length === 0 && (
          <div className="text-center py-6 text-text-muted text-sm">
            등록된 {activeTab === 'patchnotes' ? '패치노트' : '공지사항'}이 없습니다.
          </div>
        )}
      </Card>
    </section>
  );
};

export default NoticeSection;
