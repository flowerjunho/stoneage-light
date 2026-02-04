import NoticeSection from '../components/NoticeSection';
import PetSection from '../components/PetSection';
import ItemSection from '../components/ItemSection';
import CalculatorSection from '../components/CalculatorSection';
import QuestSection from '../components/QuestSection';
import MapSection from '../components/MapSection';

const leftSections = [
  { key: 'notice', Component: NoticeSection },
  { key: 'pets', Component: PetSection },
  { key: 'items', Component: ItemSection },
];

const rightSections = [
  { key: 'calculator', Component: CalculatorSection },
  { key: 'quests', Component: QuestSection },
  { key: 'maps', Component: MapSection },
];

const HomePage = () => {
  return (
    <div className="max-w-6xl mx-auto px-3 md:px-4 pt-4 md:pt-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {leftSections.map(({ key, Component }, index) => (
            <div
              key={key}
              className="animate-slide-up opacity-0"
              style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'forwards',
              }}
            >
              <Component />
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {rightSections.map(({ key, Component }, index) => (
            <div
              key={key}
              className="animate-slide-up opacity-0"
              style={{
                animationDelay: `${(index + leftSections.length) * 80}ms`,
                animationFillMode: 'forwards',
              }}
            >
              <Component />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
