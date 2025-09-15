import React from 'react';
import type { Pet } from '../types';

interface PetCardProps {
  pet: Pet;
}

const PetCard: React.FC<PetCardProps> = React.memo(({ pet }) => {
  // 속성 비율에 따른 그라데이션 보더 생성
  const getElementalBorder = (pet: Pet) => {
    const elements = [
      { name: 'earth', value: pet.earth, color: 'rgb(34, 197, 94)' }, // green-500
      { name: 'water', value: pet.water, color: 'rgb(59, 130, 246)' }, // blue-500
      { name: 'fire', value: pet.fire, color: 'rgb(239, 68, 68)' }, // red-500
      { name: 'wind', value: pet.wind, color: 'rgb(245, 158, 11)' } // amber-500
    ];

    // 0이 아닌 속성들만 필터링
    const activeElements = elements.filter(el => el.value > 0);
    
    if (activeElements.length === 0) {
      return 'border-border';
    }

    
    // 단일 속성인 경우
    if (activeElements.length === 1) {
      const element = activeElements[0];
      switch (element.name) {
        case 'earth': return 'border-green-500';
        case 'water': return 'border-blue-500';
        case 'fire': return 'border-red-500';
        case 'wind': return 'border-amber-500';
        default: return 'border-border';
      }
    }

    // 여러 속성인 경우 그라데이션 생성

    return `border-transparent`;
  };

  const getElementalBorderStyle = (pet: Pet): React.CSSProperties => {
    const elements = [
      { name: 'earth', value: pet.earth, color: 'rgb(34, 197, 94)' },
      { name: 'water', value: pet.water, color: 'rgb(59, 130, 246)' },
      { name: 'fire', value: pet.fire, color: 'rgb(239, 68, 68)' },
      { name: 'wind', value: pet.wind, color: 'rgb(245, 158, 11)' }
    ];

    const activeElements = elements.filter(el => el.value > 0);
    
    if (activeElements.length <= 1) {
      return {};
    }

    const total = activeElements.reduce((sum, el) => sum + el.value, 0);
    
    let currentPercent = 0;
    const gradientStops = activeElements.map(element => {
      const percent = (element.value / total) * 100;
      const start = currentPercent;
      const end = currentPercent + percent;
      currentPercent = end;
      
      return `${element.color} ${start}%, ${element.color} ${end}%`;
    }).join(', ');

    return {
      background: `linear-gradient(90deg, ${gradientStops})`,
      padding: '2px',
      borderRadius: '0.75rem'
    };
  };

  const getGradeClasses = (grade: string) => {
    const baseClasses = "bg-bg-secondary rounded-xl p-6 transition-all duration-200 h-full hover:-translate-y-1 iphone16:p-5 flex flex-col";
    
    switch (grade) {
      case '전설등급': 
        return `${baseClasses} shadow-lg shadow-yellow-400/30 hover:shadow-xl hover:shadow-yellow-400/40`;
      case '희귀등급': 
        return `${baseClasses} shadow-lg shadow-purple-600/20 hover:shadow-xl hover:shadow-purple-600/30`;
      case '일반등급': 
      default: 
        return `${baseClasses} hover:shadow-xl hover:shadow-shadow`;
    }
  };

  const getGradeBadgeClasses = (grade: string) => {
    const baseClasses = "text-xs font-semibold px-3 py-1 rounded-xl uppercase tracking-wide";
    
    switch (grade) {
      case '전설등급': 
        return `${baseClasses} bg-gradient-to-r from-yellow-400 to-yellow-300 text-black`;
      case '희귀등급': 
        return `${baseClasses} bg-gradient-to-r from-purple-600 to-purple-400 text-white`;
      case '일반등급': 
      default: 
        return `${baseClasses} bg-bg-tertiary text-text-secondary`;
    }
  };

  const getElementIcon = (element: string, value: number) => {
    if (value === 0) return null;
    
    const icons = {
      earth: '地',
      water: '水',
      fire: '火',
      wind: '風'
    };
    
    const elementClasses = {
      earth: 'bg-green-500/10 border-green-500/30 text-green-400',
      water: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      fire: 'bg-red-500/10 border-red-500/30 text-red-400',
      wind: 'bg-amber-500/10 border-amber-500/30 text-amber-400'
    };
    
    return (
      <span className={`text-sm px-2 py-1 rounded border ${elementClasses[element as keyof typeof elementClasses]}`}>
        {icons[element as keyof typeof icons]} {value}
      </span>
    );
  };

  const elementalBorderStyle = getElementalBorderStyle(pet);
  const borderClass = getElementalBorder(pet);
  
  return (
    <div style={elementalBorderStyle}>
      <div className={`${getGradeClasses(pet.grade)} border-2 ${borderClass}`}>
        {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-border iphone16:flex-col iphone16:items-start iphone16:gap-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-text-primary mb-2 iphone16:text-xl">
            {pet.name}
          </h3>
          <span className={getGradeBadgeClasses(pet.grade)}>
            {pet.grade}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {getElementIcon('earth', pet.earth)}
          {getElementIcon('water', pet.water)}
          {getElementIcon('fire', pet.fire)}
          {getElementIcon('wind', pet.wind)}
        </div>
      </div>
      
      {/* Basic Stats */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3 iphone16:grid-cols-1">
          <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg border border-border">
            <span className="font-semibold text-text-secondary text-sm">공격</span>
            <span className="font-bold text-text-primary font-mono">{pet.attack}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg border border-border">
            <span className="font-semibold text-text-secondary text-sm">방어</span>
            <span className="font-bold text-text-primary font-mono">{pet.defense}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg border border-border">
            <span className="font-semibold text-text-secondary text-sm">순발</span>
            <span className="font-bold text-text-primary font-mono">{pet.agility}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg border border-border">
            <span className="font-semibold text-text-secondary text-sm">체력</span>
            <span className="font-bold text-text-primary font-mono">{pet.vitality}</span>
          </div>
        </div>
      </div>

      {/* Growth Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border iphone16:text-base">
          성장률
        </h4>
        <div className="grid grid-cols-2 gap-2 iphone16:grid-cols-1">
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <span className="font-medium text-text-secondary text-xs">공성장</span>
            <span className="font-semibold text-text-primary text-sm font-mono">{pet.attackGrowth}</span>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <span className="font-medium text-text-secondary text-xs">방성장</span>
            <span className="font-semibold text-text-primary text-sm font-mono">{pet.defenseGrowth}</span>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <span className="font-medium text-text-secondary text-xs">순성장</span>
            <span className="font-semibold text-text-primary text-sm font-mono">{pet.agilityGrowth}</span>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <span className="font-medium text-text-secondary text-xs">체성장</span>
            <span className="font-semibold text-text-primary text-sm font-mono">{pet.vitalityGrowth}</span>
          </div>
          <div className="col-span-2 flex justify-between items-center p-2 px-3 bg-blue-500/10 rounded border border-blue-500/30 iphone16:col-span-1">
            <span className="font-medium text-text-secondary text-xs">총성장</span>
            <span className="font-bold text-accent text-sm font-mono">{pet.totalGrowth}</span>
          </div>
        </div>
      </div>

      {/* Combat Section */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border iphone16:text-base">
          전투력 계산
        </h4>
        <div className="grid grid-cols-2 gap-2 iphone16:grid-cols-1">
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <span className="font-medium text-text-secondary text-xs">공+방</span>
            <span className="font-semibold text-text-primary text-sm font-mono">{pet.attackPlusDefense}</span>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <span className="font-medium text-text-secondary text-xs">공+순</span>
            <span className="font-semibold text-text-primary text-sm font-mono">{pet.attackPlusAgility}</span>
          </div>
          <div className="flex justify-between items-center p-2 px-3 bg-bg-primary rounded border border-border">
            <span className="font-medium text-text-secondary text-xs">체1/4+방</span>
            <span className="font-semibold text-text-primary text-sm font-mono">{pet.vitalityQuarterPlusDefense}</span>
          </div>
          <div className="col-span-2 flex justify-between items-center p-2 px-3 bg-green-500/10 rounded border border-green-500/30 iphone16:col-span-1">
            <span className="font-medium text-text-secondary text-xs">성장전투력</span>
            <span className="font-bold text-green-400 text-sm font-mono">{pet.growthCombatPower}</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-4 border-t border-border mt-auto">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-text-secondary text-sm">탑승:</span>
          <span className={`font-medium text-sm ${pet.rideable ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}`}>
            {pet.rideable ? '가능' : '불가능'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-text-secondary text-sm">획득처:</span>
          <span className="font-medium text-text-primary text-sm text-right max-w-[50%]">{pet.source}</span>
        </div>
      </div>
      </div>
    </div>
  );
});

PetCard.displayName = 'PetCard';

export default PetCard;