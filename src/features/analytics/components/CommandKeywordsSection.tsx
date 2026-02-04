import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface CommandKeywordsSectionProps {
  commandKeywords: Record<string, Record<string, number>>;
}

const CommandKeywordsSection: React.FC<CommandKeywordsSectionProps> = ({ commandKeywords }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const commands = Object.entries(commandKeywords)
    .map(([cmd, kws]) => {
      const sorted = Object.entries(kws)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
      return { cmd, keywords: sorted, total: Object.values(kws).reduce((s, c) => s + c, 0) };
    })
    .filter(c => c.keywords.length > 0)
    .sort((a, b) => b.total - a.total);

  if (commands.length === 0) return null;

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">커맨드별 검색어</h3>
      </div>
      <div className="space-y-3">
        {commands.map(({ cmd, keywords }) => {
          const isOpen = expanded[cmd] !== false; // default open
          return (
            <div key={cmd} className="border border-border/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(p => ({ ...p, [cmd]: !isOpen }))}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/5 transition-colors"
              >
                <span className="text-sm font-semibold text-text-primary">{cmd}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {keywords.map(([kw, count]) => (
                    <span key={kw} className="tag text-xs">
                      {kw}
                      <span className="ml-1 text-accent font-semibold">{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default CommandKeywordsSection;
