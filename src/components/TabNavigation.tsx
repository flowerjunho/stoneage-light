import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TabNavigation: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { path: '/pets', label: '페트', name: 'pets' },
    { path: '/boarding', label: '캐릭터/탑승', name: 'boarding' },
    { path: '/items', label: '아이템', name: 'items' },
    { path: '/quests', label: '퀘스트', name: 'quests' },
    { path: '/calculator', label: '계산기', name: 'calculator' },
    { path: '/board', label: '게시판', name: 'board' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
      <div className="border-b border-border-primary mb-4 iphone16:mb-3">
        <nav className="grid grid-cols-6 gap-0">
          {tabs.map(tab => {
            const isActive =
              location.pathname === tab.path ||
              (location.pathname === '/' && tab.path === '/pets');

            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 text-center iphone16:text-xs ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-muted'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;
