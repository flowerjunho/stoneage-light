import { Link } from 'react-router-dom';
import { Calculator, BarChart3, Filter, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import SectionHeader from './SectionHeader';

const features = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: '환생 포인트',
    description: '환생 포인트를 계산합니다',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    linkTo: '/calculator?tab=rebirth',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: '성장치 비교',
    description: '펫 성장치를 비교해보세요',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    linkTo: '/calculator?tab=petgrowth',
  },
  {
    icon: <Filter className="w-5 h-5" />,
    title: '속성 계산기',
    description: '속성별 펫 계산기',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    linkTo: '/calculator?tab=element',
  },
];

const CalculatorSection = () => {
  return (
    <section>
      <SectionHeader
        title="계산기"
        icon={<Calculator className="w-5 h-5" />}
        linkTo="/calculator"
        accentColor="text-purple-400"
      />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-2.5">
        {features.map((feature) => (
          <Link key={feature.title} to={feature.linkTo}>
            <Card
              variant="glass"
              hover
              className={cn(
                'p-4 sm:p-3.5 flex items-center gap-3 group h-full',
                'border', feature.borderColor
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center',
                  feature.bgColor,
                  feature.color,
                  'transition-transform duration-300 group-hover:scale-110'
                )}
              >
                {feature.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', feature.color)}>
                  {feature.title}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {feature.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CalculatorSection;
