import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import SectionHeader from './SectionHeader';

interface QuestItem {
  idx: number;
  title: string;
  link: string;
  content: string;
}

const QuestSection = () => {
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    import('@/data/questWithContent.json')
      .then((module) => {
        if (cancelled) return;
        const data = module.default as QuestItem[];
        const latest = data.slice(-5).reverse();
        setQuests(latest);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <SectionHeader
        title="퀘스트"
        icon={<ClipboardCheck className="w-5 h-5" />}
        linkTo="/quests"
        accentColor="text-emerald-400"
      />

      <Card variant="glass" className="divide-y divide-white/5">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-white/5" />
                <div className="h-4 bg-white/5 rounded flex-1" />
              </div>
            ))}
          </div>
        ) : (
          quests.map((quest, index) => (
            <Link
              key={quest.idx}
              to={`/quests/${quest.idx}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                'hover:bg-white/5 transition-colors duration-200 group',
                index === 0 && 'rounded-t-2xl',
                index === quests.length - 1 && 'rounded-b-2xl'
              )}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center">
                {quest.idx}
              </span>
              <span className="text-sm text-text-secondary truncate group-hover:text-emerald-400 transition-colors duration-200">
                {quest.title}
              </span>
            </Link>
          ))
        )}

        {!loading && quests.length === 0 && (
          <div className="text-center py-6 text-text-muted text-sm">
            등록된 퀘스트가 없습니다.
          </div>
        )}
      </Card>
    </section>
  );
};

export default QuestSection;
