import React from 'react';
import type { RebirthData, StatInput } from '@/shared/hooks/useRebirthCalculation';

interface RebirthCardProps {
  rebirthIndex: number;
  data: RebirthData;
  userInputs: {
    levels: number[];
    stats: Array<{
      con: number;
      wis: number;
      dex: number;
    }>;
  };
  onLevelChange: (index: number, value: string) => void;
  onStatChange: (rebirthIndex: number, stat: 'con' | 'wis' | 'dex' | 'agi', value: string) => void;
}

const RebirthCard: React.FC<RebirthCardProps> = ({
  rebirthIndex,
  data,
  userInputs,
  onLevelChange,
  onStatChange,
}) => {
  const level = userInputs.levels[rebirthIndex];

  return (
    <div className="rounded-xl shadow-lg bg-bg-secondary border border-border">
      {/* 카드 헤더 */}
      <div className="px-6 py-4 rounded-t-xl bg-gradient-to-r from-blue-500 to-purple-500">
        <h3 className="text-xl font-bold text-white text-center">{rebirthIndex + 1}환</h3>
      </div>

      {/* 카드 내용 */}
      <div className="p-6">
        {/* 기본 설정 */}
        <div className="mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-secondary">레벨</label>
            <input
              type="number"
              value={level}
              onChange={e => onLevelChange(rebirthIndex, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
          </div>
        </div>

        {/* 스탯 입력 */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-text-primary">📊 스탯 설정</h4>

          <div className="space-y-3">
            {[
              { key: 'con', label: '체', editable: true },
              { key: 'wis', label: '완', editable: true },
              { key: 'dex', label: '건', editable: true },
              { key: 'agi', label: '순', editable: false },
            ].map(({ key, label, editable }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium text-text-secondary">{label}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={
                      editable && key !== 'agi'
                        ? userInputs.stats[rebirthIndex][key as keyof (typeof userInputs.stats)[0]]
                        : data.displayStats[key as keyof StatInput]
                    }
                    onChange={
                      editable
                        ? e =>
                            onStatChange(rebirthIndex, key as 'con' | 'wis' | 'dex', e.target.value)
                        : undefined
                    }
                    disabled={!editable}
                    className={`w-20 px-2 py-1 rounded text-center border-2 font-semibold ${
                      editable
                        ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  />
                  <span className="inline-block px-2 py-1 rounded text-xs font-mono bg-bg-tertiary border border-border text-text-secondary">
                    {Math.round(data.realStats[key as keyof StatInput])}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 총합 및 남은 포인트 */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-text-primary">총합</span>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-500 text-white">
                  {data.totalDisplay}
                </span>
                <span className="inline-block px-2 py-1 rounded text-xs font-mono bg-bg-tertiary border border-border text-text-secondary">
                  {Math.round(data.totalReal)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-primary">남은 포인트</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  data.remainingPoints > 0 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                }`}
              >
                {data.remainingPoints}
              </span>
            </div>
          </div>
        </div>

        {/* 환포 정보 */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-text-primary">🎯 환포 정보</h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">환포계수</span>
              <span className="px-2 py-1 rounded text-sm font-bold bg-blue-500 text-white">
                {data.rebirthCoeff}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">보너스</span>
              <span className="px-2 py-1 rounded text-sm font-bold bg-purple-500 text-white">
                {data.bonus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-primary">실제환포</span>
              <span className="px-3 py-2 rounded-lg text-lg font-bold bg-green-500 text-white">
                {data.finalRebirthValue}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-primary">최종스탯</span>
              <span className="px-3 py-2 rounded-lg text-lg font-bold bg-accent text-white">
                {data.finalStats}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebirthCard;
