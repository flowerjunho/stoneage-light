import React, { useState } from 'react';
import {
  saveData,
  loadData,
  getSavedDataList,
  deleteData,
  formatTimestamp,
  type SavedData,
} from '../utils/storage';
import { useRebirthCalculation, type StatInput } from '../hooks/useRebirthCalculation';
import RebirthCard from '../components/RebirthCard';
import SaveModal from '../components/SaveModal';
import LoadModal from '../components/LoadModal';

const CalculatorPage: React.FC = () => {
  // Excel에서 추출한 보너스 값들 (C26, E26, G26, I26, K26)
  const BONUSES = [10, 20, 30, 40, 50];

  // Excel 분석에 따른 정확한 초기값 - 5환까지
  const [userInputs, setUserInputs] = useState({
    // 레벨 입력 (C6, E6, G6, I6, K6)
    levels: [140, 140, 140, 140, 140],
    // 체,완,건만 사용자 입력 (C9,C10,C11 / E9,E10,E11 / G9,G10,G11 / I9,I10,I11 / K9,K10,K11)
    stats: [
      { con: 437, wis: 0, dex: 0 }, // 1환 (C9,C10,C11)
      { con: 482, wis: 0, dex: 0 }, // 2환 (E9,E10,E11)
      { con: 514, wis: 0, dex: 0 }, // 3환 (G9,G10,G11)
      { con: 546, wis: 0, dex: 0 }, // 4환 (I9,I10,I11)
      { con: 577, wis: 0, dex: 0 }, // 5환 (K9,K10,K11)
    ],
  });

  // 저장/불러오기 관련 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [savedDataList, setSavedDataList] = useState<SavedData[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string>(''); // 현재 불러온 데이터의 타이틀

  // 계산 로직을 custom hook으로 분리
  const calculatedData = useRebirthCalculation(userInputs);

  // 입력 처리
  const handleStatChange = (
    rebirthIndex: number,
    stat: 'con' | 'wis' | 'dex' | 'agi',
    value: string
  ) => {
    const numValue = parseInt(value) || 0;

    setUserInputs(prev => {
      const newStats = [...prev.stats];
      const level = prev.levels[rebirthIndex];

      // 사용 가능한 포인트 계산 (Excel 공식 기반)
      let availablePoints: number;
      if (rebirthIndex === 0) {
        // 1환: 20 + 3 * (레벨 - 1)
        availablePoints = 20 + 3 * (level - 1);
      } else {
        // 2환 이후: 이전 환의 실제환포 + 3 * (레벨 - 1)
        // calculatedData가 있다면 실제 값 사용, 없다면 기본 계산
        let previousRebirth = 0;
        if (calculatedData.length > rebirthIndex - 1) {
          previousRebirth = calculatedData[rebirthIndex - 1].finalRebirthValue;
        } else {
          // calculatedData가 없는 경우 대략적 계산
          for (let i = 0; i < rebirthIndex; i++) {
            previousRebirth += BONUSES[i] + 10; // 보너스 + 환포적용 추정치
          }
        }
        availablePoints = previousRebirth + 3 * (level - 1);
      }

      if (stat === 'con') {
        // 체력 직접 변경 - 최대값 제한
        const otherStats = newStats[rebirthIndex].wis + newStats[rebirthIndex].dex;
        const maxCon = availablePoints - otherStats;
        newStats[rebirthIndex] = {
          ...newStats[rebirthIndex],
          [stat]: Math.min(Math.max(0, numValue), maxCon),
        };
      } else {
        // 완/건 변경 시 체력 자동 조정
        const currentStat = newStats[rebirthIndex];
        const otherStatValue = stat === 'wis' ? currentStat.dex : currentStat.wis;

        // 입력된 스탯이 너무 클 경우 제한
        const maxThisStat = availablePoints - otherStatValue;
        const adjustedValue = Math.min(Math.max(0, numValue), maxThisStat);

        // 체력 자동 조정
        const remainingForCon = availablePoints - adjustedValue - otherStatValue;

        newStats[rebirthIndex] = {
          ...currentStat,
          [stat]: adjustedValue,
          con: Math.max(0, remainingForCon),
        };
      }

      return {
        ...prev,
        stats: newStats,
      };
    });
  };

  const handleLevelChange = (rebirthIndex: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setUserInputs(prev => ({
      ...prev,
      levels: prev.levels.map((level, i) => (i === rebirthIndex ? numValue : level)),
    }));
  };

  // 저장/불러오기 관련 함수들
  const handleSave = () => {
    if (saveTitle.trim()) {
      const success = saveData(saveTitle.trim(), userInputs.levels, userInputs.stats);
      if (success) {
        setCurrentTitle(saveTitle.trim()); // 저장 후 현재 타이틀 설정
        setSaveTitle('');
        setShowSaveModal(false);
        loadSavedList();
        alert('저장되었습니다.');
      } else {
        alert('저장에 실패했습니다.');
      }
    }
  };

  const handleLoad = (id: string) => {
    const data = loadData(id);
    if (data) {
      setUserInputs({
        levels: data.levels,
        stats: data.stats,
      });
      setCurrentTitle(data.title); // 현재 타이틀 설정
      setShowLoadModal(false);
      alert(`${data.title} 데이터를 불러왔습니다.`);
    } else {
      alert('데이터를 불러오는데 실패했습니다.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const success = deleteData(id);
      if (success) {
        loadSavedList();
        alert('삭제되었습니다.');
      } else {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const loadSavedList = () => {
    setSavedDataList(getSavedDataList());
  };

  // 컴포넌트 마운트 시 저장된 데이터 목록 로드
  React.useEffect(() => {
    loadSavedList();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="mb-6">
          {/* 저장/불러오기 버튼 */}
          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              저장
            </button>
            <button
              onClick={() => {
                loadSavedList();
                setShowLoadModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
            >
              불러오기
            </button>
          </div>

          {/* 현재 불러온 데이터 타이틀 표시 */}
          {currentTitle && (
            <div className="text-center py-2 mb-4">
              <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-700">
                <span className="font-semibold text-sm">현재 데이터: {currentTitle}</span>
              </div>
            </div>
          )}

          {/* 설명 텍스트 */}
          <div className="text-center text-text-secondary space-y-2">
            <p className="text-base md:text-lg">
              💡 <span className="font-semibold">입력 가능 항목</span>: 레벨, 체력, 완력, 건강
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              ⚠️{' '}
              <span className="font-semibold">
                환포 계산기는 환생 포인트 퀘스트를 모두 완료 했다고 가정하고 20개로 계산 됩니다
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 환생별 카드 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {calculatedData.map((data, index) => (
          <RebirthCard
            key={`rebirth-${index}`}
            rebirthIndex={index}
            data={data}
            userInputs={userInputs}
            onLevelChange={handleLevelChange}
            onStatChange={handleStatChange}
          />
        ))}
      </div>

      {/* 환포적용 상세 정보 */}
      <div className="rounded-xl shadow-lg p-6 bg-bg-secondary border border-border">
        <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">
          📈 환포적용 상세 정보
        </h2>

        {/* 모바일 뷰 */}
        <div className="block lg:hidden">
          <div className="space-y-4">
            {[
              { key: 'con', label: '체력 환포적용' },
              { key: 'wis', label: '완력 환포적용' },
              { key: 'dex', label: '건강 환포적용' },
              { key: 'agi', label: '순발 환포적용' },
            ].map(({ key, label }) => (
              <div key={key} className="bg-bg-tertiary rounded-lg p-3 border border-border">
                <h4 className="font-medium text-text-primary mb-2 text-sm">{label}</h4>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {calculatedData.map((data, i) => (
                    <div key={i} className="text-center">
                      <div className="text-text-secondary mb-1">{i + 1}환</div>
                      <div className="space-y-1">
                        <div className="inline-block px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-green-500 text-white">
                          {data.appliedRebirth[key as keyof StatInput]}
                        </div>
                        <div className="inline-block px-1.5 py-0.5 rounded text-xs font-mono bg-bg-primary text-text-secondary">
                          {data.appliedRebirthDecimal[key as keyof StatInput].toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 환포 총합 모바일 뷰 */}
            <div className="bg-bg-secondary rounded-lg p-3 border border-border">
              <h4 className="font-semibold text-text-primary mb-2 text-sm">환포 총합 + 보너스</h4>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {calculatedData.map((data, i) => (
                  <div key={i} className="text-center">
                    <div className="text-text-secondary mb-1">{i + 1}환</div>
                    <div className="space-y-1">
                      <div className="inline-block px-1.5 py-1 rounded text-xs font-mono font-bold bg-blue-500 text-white">
                        {data.appliedRebirth.con +
                          data.appliedRebirth.wis +
                          data.appliedRebirth.dex +
                          data.appliedRebirth.agi +
                          data.bonus}
                      </div>
                      <div className="inline-block px-1.5 py-0.5 rounded text-xs font-mono bg-gray-600 text-white">
                        {(
                          data.appliedRebirthDecimal.con +
                          data.appliedRebirthDecimal.wis +
                          data.appliedRebirthDecimal.dex +
                          data.appliedRebirthDecimal.agi +
                          data.bonus
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 데스크톱 뷰 */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm text-text-secondary">
            <thead>
              <tr className="bg-bg-tertiary">
                <th className="px-4 py-3 text-left font-semibold" rowSpan={2}>
                  스탯
                </th>
                {calculatedData.map((_, i) => (
                  <th
                    key={i}
                    className="px-2 py-2 text-center font-semibold border-l border-border"
                    colSpan={2}
                  >
                    {i + 1}환
                  </th>
                ))}
              </tr>
              <tr className="bg-bg-tertiary border-t border-border">
                {calculatedData.map((_, i) => (
                  <>
                    <th
                      key={`${i}-applied`}
                      className="px-2 py-2 text-center font-semibold text-xs bg-bg-tertiary text-text-secondary"
                    >
                      적용
                    </th>
                    <th
                      key={`${i}-actual`}
                      className="px-2 py-2 text-center font-semibold text-xs bg-bg-tertiary text-text-secondary"
                    >
                      실제
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'con', label: '체력 환포적용' },
                { key: 'wis', label: '완력 환포적용' },
                { key: 'dex', label: '건강 환포적용' },
                { key: 'agi', label: '순발 환포적용' },
              ].map(({ key, label }) => (
                <tr key={key} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{label}</td>
                  {calculatedData.map((data, i) => (
                    <>
                      <td key={`${i}-applied`} className="px-2 py-3 text-center">
                        <span className="inline-block px-2 py-1 rounded text-xs font-mono font-bold bg-green-500 text-white">
                          {data.appliedRebirth[key as keyof StatInput]}
                        </span>
                      </td>
                      <td key={`${i}-actual`} className="px-2 py-3 text-center">
                        <span className="inline-block px-2 py-1 rounded text-xs font-mono bg-bg-tertiary text-text-primary">
                          {data.appliedRebirthDecimal[key as keyof StatInput].toFixed(2)}
                        </span>
                      </td>
                    </>
                  ))}
                </tr>
              ))}
              <tr className="border-t font-semibold border-border bg-bg-tertiary">
                <td className="px-4 py-3">환포 총합 + 보너스</td>
                {calculatedData.map((data, i) => (
                  <>
                    <td key={`${i}-total-applied`} className="px-2 py-3 text-center">
                      <span className="inline-block px-3 py-2 rounded text-sm font-mono font-bold bg-blue-500 text-white shadow-lg">
                        {data.appliedRebirth.con +
                          data.appliedRebirth.wis +
                          data.appliedRebirth.dex +
                          data.appliedRebirth.agi +
                          data.bonus}
                      </span>
                    </td>
                    <td key={`${i}-total-actual`} className="px-2 py-3 text-center">
                      <span className="inline-block px-2 py-1 rounded text-xs font-mono bg-gray-600 text-white">
                        {(
                          data.appliedRebirthDecimal.con +
                          data.appliedRebirthDecimal.wis +
                          data.appliedRebirthDecimal.dex +
                          data.appliedRebirthDecimal.agi +
                          data.bonus
                        ).toFixed(2)}
                      </span>
                    </td>
                  </>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MAX 환포 정보 */}
      <div className="mt-6 rounded-xl shadow-lg p-6 bg-bg-secondary border border-border">
        <h2 className="text-2xl font-bold mb-4 text-center text-text-primary">🏆 MAX 환포</h2>

        <div className="grid grid-cols-5 gap-4">
          {[66, 98, 130, 161, 192].map((max, i) => (
            <div key={i} className="text-center">
              <div className="text-sm font-medium mb-2 text-text-secondary">{i + 1}환</div>
              <div className="px-4 py-2 rounded-lg font-bold text-lg bg-red-500 text-white">
                {max}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 저장 모달 */}
      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        saveTitle={saveTitle}
        setSaveTitle={setSaveTitle}
        onSave={handleSave}
      />

      {/* 불러오기 모달 */}
      <LoadModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        savedDataList={savedDataList}
        onLoad={handleLoad}
        onDelete={handleDelete}
        formatTimestamp={formatTimestamp}
      />
    </div>
  );
};

export default CalculatorPage;
