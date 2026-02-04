import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SectionHeader from './SectionHeader';
import pooyasMaps from '@/data/pooyasMaps.json';

const MapSection = () => {
  const latestMaps = pooyasMaps.slice(-5).reverse();

  return (
    <section>
      <SectionHeader
        title="지도"
        icon={<Map className="w-5 h-5" />}
        linkTo="/maps"
        accentColor="text-emerald-500"
      />

      <Card variant="glass" className="divide-y divide-white/5">
        {latestMaps.map((map, index) => (
          <Link
            key={map.idx}
            to={`/maps/${map.idx}`}
            className={cn(
              'flex items-center gap-3 px-4 py-3',
              'hover:bg-white/5 transition-colors duration-200 group',
              index === 0 && 'rounded-t-2xl',
              index === latestMaps.length - 1 && 'rounded-b-2xl'
            )}
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center justify-center">
              {map.idx}
            </span>
            <span className="text-sm text-text-secondary truncate flex-1 group-hover:text-emerald-400 transition-colors duration-200">
              {map.title}
            </span>
            {map.category && (
              <Badge variant="earth" size="sm" className="flex-shrink-0">
                {map.category}
              </Badge>
            )}
          </Link>
        ))}

        {latestMaps.length === 0 && (
          <div className="text-center py-6 text-text-muted text-sm">
            등록된 지도가 없습니다.
          </div>
        )}
      </Card>
    </section>
  );
};

export default MapSection;
