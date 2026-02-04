import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  linkTo: string;
  linkLabel?: string;
  accentColor?: string;
}

const SectionHeader = ({
  title,
  icon,
  linkTo,
  linkLabel = '더보기',
  accentColor = 'text-accent',
}: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className={cn('flex-shrink-0', accentColor)}>{icon}</span>
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      </div>
      <Link
        to={linkTo}
        className={cn(
          'group flex items-center gap-1 text-sm font-medium text-text-muted',
          'hover:text-accent transition-colors duration-200'
        )}
      >
        <span>{linkLabel}</span>
        <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
};

export default SectionHeader;
