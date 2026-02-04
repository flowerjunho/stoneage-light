import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SectionHeader from './SectionHeader';
import petData from '@/data/petData.json';

const gradeVariant = (grade: string) => {
  switch (grade) {
    case 'S':
      return 'hero';
    case 'A':
      return 'rare';
    case 'B':
      return 'accent';
    default:
      return 'secondary';
  }
};

const PetSection = () => {
  const latestPets = petData.pets
    .filter((pet) => pet.imageLink && pet.imageLink.trim() !== '')
    .slice(0, 5);

  return (
    <section>
      <SectionHeader
        title="페트"
        icon={<Heart className="w-5 h-5" />}
        linkTo="/pets"
        accentColor="text-amber-400"
      />

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-5 md:overflow-x-visible">
        {latestPets.map((pet) => (
          <Link
            key={pet.id}
            to={`/pets?search=${encodeURIComponent(pet.name)}`}
            className="flex-shrink-0 w-[140px] md:w-auto"
          >
            <Card
              variant="glass"
              hover
              className="p-3 h-full flex flex-col items-center gap-2 group"
            >
              {/* Pet Image */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-bg-tertiary/50 flex-shrink-0">
                <img
                  src={pet.imageLink}
                  alt={pet.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              </div>

              {/* Pet Info */}
              <div className="text-center w-full">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {pet.name}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Badge variant={gradeVariant(pet.grade)} size="sm">
                    {pet.grade}
                  </Badge>
                  {pet.rideable === 'O' && (
                    <Badge variant="info" size="sm">
                      탑승
                    </Badge>
                  )}
                </div>
              </div>

              {/* Growth Stats */}
              <div
                className={cn(
                  'w-full text-center text-[10px] text-text-muted',
                  'border-t border-white/5 pt-1.5 mt-auto'
                )}
              >
                성장 {pet.totalGrowth}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PetSection;
