import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import SectionHeader from './SectionHeader';
import rightItems from '@/data/right_items.json';

const ItemSection = () => {
  const latestItems = rightItems.slice(0, 5);

  return (
    <section>
      <SectionHeader
        title="환수강림 아이템"
        icon={<Package className="w-5 h-5" />}
        linkTo="/items"
        accentColor="text-neon-blue"
      />

      <Card variant="glass" className="divide-y divide-white/5">
        {latestItems.map((item, index) => (
          <Link
            key={item.id}
            to="/items"
            className={cn(
              'flex items-center gap-3 px-4 py-3',
              'hover:bg-white/5 transition-colors duration-200 group',
              index === 0 && 'rounded-t-2xl',
              index === latestItems.length - 1 && 'rounded-b-2xl'
            )}
          >
            {/* Item Image */}
            {item.imageUrl && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-bg-tertiary/50 flex-shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
            )}

            {/* Item Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate group-hover:text-neon-blue transition-colors duration-200">
                {item.name}
              </p>
              {item.description && (
                <p className="text-xs text-text-muted truncate mt-0.5">
                  {item.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </Card>
    </section>
  );
};

export default ItemSection;
