import React, { useState, useMemo } from 'react';
import { saveData, loadData, getSavedDataList, deleteData, formatTimestamp, type SavedData } from '../utils/storage';

// Excel 분석에 따른 정확한 데이터 구조
interface StatInput {
  con: number; // 체력 (C9, E9, G9, I9, K9)
  wis: number; // 완력 (C10, E10, G10, I10, K10)
  dex: number; // 건첩 (C11, E11, G11, I11, K11)
  agi: number; // 순발 (C12, E12, G12, I12, K12 - 계산됨)
}

interface RebirthData {
  // 기본 설정 (Excel 행 6, 7)
  level: number;    // C6, E6, G6, I6, K6 = 140
  quest: number;    // C7, E7, G7, I7, K7 = 20
  
  // 스탯 데이터 (Excel 행 9-12)
  displayStats: StatInput; // 표시스탯 (흰색 칸 입력)
  realStats: StatInput;    // 실스탯 (D9-D12, F9-F12, ...)
  totalDisplay: number;    // 표시스탯 합계 (C13, E13, G13, I13, K13)
  totalReal: number;       // 실스탯 합계 (D13, F13, H13, J13, L13)
  remainingPoints: number; // 남은포인트 (C14, E14, G14, I14, K14)
  
  // 누적 데이터 (Excel 행 18, 19)
  cumulativeQuests: number; // 누적환포수 (C18, E18, G18, I18, K18)
  cumulativeLevels: number; // 누적레벨수 (C19, E19, G19, I19, K19)
  
  // 환포 계산 (Excel 행 20, 22-25, 26, 27)
  rebirthCoeff: number;           // 환포계수 (C20, E20, G20, I20, K20)
  appliedRebirth: StatInput;      // 환포적용 정수 (C22-C25, E22-E25, ...)
  appliedRebirthDecimal: StatInput; // 환포적용 소수점 (D22-D25, F22-F25, ...)
  bonus: number;                  // 보너스 (C26, E26, G26, I26, K26)
  finalRebirthValue: number;      // 실제환포 (C27, E27, G27, I27, K27)
  finalStats: number;             // 최종스탯 (C32, E32, G32, I32, K32)
}

const CalculatorPage: React.FC = () => {
  
  // Excel 분석에 따른 정확한 초기값 - 5환까지
  const [userInputs, setUserInputs] = useState({
    // 레벨 입력 (C6, E6, G6, I6, K6)
    levels: [140, 140, 140, 140, 140],
    // 체,완,건만 사용자 입력 (C9,C10,C11 / E9,E10,E11 / G9,G10,G11 / I9,I10,I11 / K9,K10,K11)
    stats: [
      { con: 437, wis: 0, dex: 0 },   // 1환 (C9,C10,C11)
      { con: 482, wis: 0, dex: 0 },   // 2환 (E9,E10,E11)
      { con: 514, wis: 0, dex: 0 },   // 3환 (G9,G10,G11)
      { con: 546, wis: 0, dex: 0 },   // 4환 (I9,I10,I11)
      { con: 577, wis: 0, dex: 0 }    // 5환 (K9,K10,K11)
    ]
  });

  // 저장/불러오기 관련 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [savedDataList, setSavedDataList] = useState<SavedData[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string>(''); // 현재 불러온 데이터의 타이틀

  // Excel에서 추출한 정확한 상수값들 - 성능 최적화를 위한 memoization
  const FIXED_QUESTS = useMemo(() => [20, 20, 20, 20, 20], []);       // C7, E7, G7, I7, K7
  const BONUSES = useMemo(() => [10, 20, 30, 40, 50], []);            // C26, E26, G26, I26, K26
  
  // Excel TRUNC 함수 정확한 구현
  const TRUNC = (value: number, digits: number = 0): number => {
    const multiplier = Math.pow(10, digits);
    return Math.trunc(value * multiplier) / multiplier;
  };

  // Excel 분석에 따른 정확한 공식 구현
  const calculatedData = useMemo(() => {
    // Excel의 순환 참조 해결을 위한 반복 계산
    let converged = false;
    let iterations = 0;
    const maxIterations = 100;
    const tolerance = 0.001;
    
    // 초기값 설정 (각 환의 최종스탯과 AGI)
    const finalStats = [437, 417, 417, 417, 417]; // 1환만 437 고정, 나머지는 417+이전환포
    const calculatedAgi = [0, 0, 0, 0, 0];
    
    while (!converged && iterations < maxIterations) {
      const prevFinalStats = [...finalStats];
      const prevAgi = [...calculatedAgi];
      
      // 각 환별 계산
      const newData: RebirthData[] = [];
      let cumulativeQuests = 0;
      let cumulativeLevels = 0;
      
      for (let rebirthIdx = 0; rebirthIdx < 5; rebirthIdx++) {
        const level = userInputs.levels[rebirthIdx];
        const quest = FIXED_QUESTS[rebirthIdx];
        const userStat = userInputs.stats[rebirthIdx];
        
        // 누적값 계산 (Excel: C18, E18, G18, I18, K18)
        cumulativeQuests += quest;
        cumulativeLevels += level;
        
        // AGI 계산 (Excel 공식: =C32-C11-C10-C9-(437-(20+3*(C6-1))))
        const baseCalc = 437 - (20 + 3 * (level - 1));
        calculatedAgi[rebirthIdx] = Math.max(0, 
          finalStats[rebirthIdx] - userStat.con - userStat.wis - userStat.dex - baseCalc
        );
        
        // 표시스탯 (Excel: C9-C12)
        const displayStats: StatInput = {
          con: userStat.con,
          wis: userStat.wis,
          dex: userStat.dex,
          agi: calculatedAgi[rebirthIdx]
        };
        
        const totalDisplay = displayStats.con + displayStats.wis + displayStats.dex + displayStats.agi;
        
        // 실스탯 계산 (Excel 정확한 공식 적용)
        let realStats: StatInput;
        if (rebirthIdx === 0) {
          // 1환: 실스탯 = 표시스탯 (D9=C9, D10=C10, D11=C11, D12=C12)
          realStats = { ...displayStats };
        } else {
          // 2환 이후: Excel 공식 F9=E9+(D22-C22) 등
          // 실스탯 = 표시스탯 + (이전환실환포 - 이전환적용환포)
          const prevData = newData[rebirthIdx - 1];
          if (prevData) {
            // 이전 환의 실환포(정확한 소수점 값) - 적용환포(정수값) 차이
            realStats = {
              con: displayStats.con + (prevData.appliedRebirthDecimal.con - prevData.appliedRebirth.con),
              wis: displayStats.wis + (prevData.appliedRebirthDecimal.wis - prevData.appliedRebirth.wis),
              dex: displayStats.dex + (prevData.appliedRebirthDecimal.dex - prevData.appliedRebirth.dex),
              agi: displayStats.agi + (prevData.appliedRebirthDecimal.agi - prevData.appliedRebirth.agi)
            };
          } else {
            realStats = { ...displayStats };
          }
        }
        
        const totalReal = realStats.con + realStats.wis + realStats.dex + realStats.agi;
        
        // 환포계수 계산 (Excel: =TRUNC((C13/12)+(C18/4)+(C19-(85*환수))/4))
        const rebirthCoeff = Math.trunc(
          (totalReal / 12) + 
          (cumulativeQuests / 4) + 
          ((cumulativeLevels - 85 * (rebirthIdx + 1)) / 4)
        );
        
        // 환포적용 계산 (Excel 정확한 공식)
        // 실환포: 정확한 소수점 값 (D22-D25) = TRUNC((개별스탯/총스탯)*환포계수+0.5, 2)
        const appliedRebirthDecimal: StatInput = {
          con: totalReal > 0 ? TRUNC((realStats.con / totalReal) * rebirthCoeff + 0.5, 2) : 0,
          wis: totalReal > 0 ? TRUNC((realStats.wis / totalReal) * rebirthCoeff + 0.5, 2) : 0,
          dex: totalReal > 0 ? TRUNC((realStats.dex / totalReal) * rebirthCoeff + 0.5, 2) : 0,
          agi: totalReal > 0 ? TRUNC((realStats.agi / totalReal) * rebirthCoeff + 0.5, 2) : 0
        };
        
        // 적용환포: 정수값 (C22-C25) = TRUNC((개별스탯/총스탯)*환포계수+0.5)
        const appliedRebirth: StatInput = {
          con: totalReal > 0 ? TRUNC((realStats.con / totalReal) * rebirthCoeff + 0.5, 0) : 0,
          wis: totalReal > 0 ? TRUNC((realStats.wis / totalReal) * rebirthCoeff + 0.5, 0) : 0,
          dex: totalReal > 0 ? TRUNC((realStats.dex / totalReal) * rebirthCoeff + 0.5, 0) : 0,
          agi: totalReal > 0 ? TRUNC((realStats.agi / totalReal) * rebirthCoeff + 0.5, 0) : 0
        };

        
        const bonus = BONUSES[rebirthIdx];
        const appliedTotal = appliedRebirth.con + appliedRebirth.wis + appliedRebirth.dex + appliedRebirth.agi;
        const finalRebirthValue = appliedTotal + bonus;
        
        // 최종스탯 계산 (Excel: C32=437, E32=417+C27, ...)
        if (rebirthIdx === 0) {
          finalStats[rebirthIdx] = 437; // 1환 고정
        } else {
          finalStats[rebirthIdx] = 417 + newData[rebirthIdx - 1].finalRebirthValue;
        }
        
        // 남은포인트 계산 (Excel 공식에 따라)
        let remainingPoints: number;
        if (rebirthIdx === 0) {
          // 1환: 20+(3*(레벨-1))-총스탯
          remainingPoints = 20 + (3 * (level - 1)) - totalDisplay;
        } else {
          // 2환 이후: 이전환실제환포+(3*(레벨-1))-총스탯
          remainingPoints = newData[rebirthIdx - 1].finalRebirthValue + (3 * (level - 1)) - totalDisplay;
        }
        
        newData.push({
          level,
          quest,
          displayStats,
          realStats,
          totalDisplay,
          totalReal,
          remainingPoints,
          cumulativeQuests,
          cumulativeLevels,
          rebirthCoeff,
          appliedRebirth,
          appliedRebirthDecimal,
          bonus,
          finalRebirthValue,
          finalStats: finalStats[rebirthIdx]
        });
      }
      
      // 수렴 확인 (더 엄격한 조건)
      let maxDiff = 0;
      for (let i = 0; i < 5; i++) {
        maxDiff = Math.max(maxDiff, Math.abs(finalStats[i] - prevFinalStats[i]));
        maxDiff = Math.max(maxDiff, Math.abs(calculatedAgi[i] - prevAgi[i]));
      }
      
      converged = maxDiff < tolerance;
      iterations++;
      
      if (converged || iterations >= maxIterations) {
        return newData;
      }
    }
    
    return [];
  }, [userInputs, FIXED_QUESTS, BONUSES]);

  // 입력 처리
  const handleStatChange = (rebirthIndex: number, stat: 'con' | 'wis' | 'dex' | 'agi', value: string) => {
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
          [stat]: Math.min(Math.max(0, numValue), maxCon) 
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
          con: Math.max(0, remainingForCon)
        };
      }
      
      return {
        ...prev,
        stats: newStats
      };
    });
  };

  const handleLevelChange = (rebirthIndex: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setUserInputs(prev => ({
      ...prev,
      levels: prev.levels.map((level, i) => 
        i === rebirthIndex ? numValue : level
      )
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
        stats: data.stats
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
            <p className="text-base md:text-lg">💡 <span className="font-semibold">입력 가능 항목</span>: 레벨, 체력, 완력, 건강</p>
            <p className="text-sm text-orange-600 dark:text-orange-400">⚠️ <span className="font-semibold">환포 계산기는 환생 포인트 퀘스트를 모두 완료 했다고 가정하고 20개로 계산 됩니다</span></p>
          </div>
        </div>
      </div>

      {/* 환생별 카드 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {calculatedData.map((data, index) => (
          <div
            key={`rebirth-${index}`}
            className="rounded-xl shadow-lg bg-bg-secondary border border-border"
          >
            {/* 카드 헤더 */}
            <div className="px-6 py-4 rounded-t-xl bg-gradient-to-r from-blue-500 to-purple-500">
              <h3 className="text-xl font-bold text-white text-center">
                {index + 1}환
              </h3>
            </div>

            {/* 카드 내용 */}
            <div className="p-6">
              {/* 기본 설정 */}
              <div className="mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-text-secondary">
                    레벨
                  </label>
                  <input
                    type="number"
                    value={userInputs.levels[index]}
                    onChange={(e) => handleLevelChange(index, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
              </div>

              {/* 스탯 입력 */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-text-primary">
                  📊 스탯 설정
                </h4>
                
                <div className="space-y-3">
                  {[
                    { key: 'con', label: '체', editable: true },
                    { key: 'wis', label: '완', editable: true },
                    { key: 'dex', label: '건', editable: true },
                    { key: 'agi', label: '순', editable: false }
                  ].map(({ key, label, editable }) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="font-medium text-text-secondary">
                        {label}
                      </span>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={editable && key !== 'agi' ? userInputs.stats[index][key as keyof typeof userInputs.stats[0]] : data.displayStats[key as keyof StatInput]}
                          onChange={editable ? (e) => handleStatChange(index, key as 'con' | 'wis' | 'dex', e.target.value) : undefined}
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
                    <span className="font-semibold text-text-primary">
                      총합
                    </span>
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
                    <span className="font-semibold text-text-primary">
                      남은 포인트
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      data.remainingPoints > 0 
                        ? 'bg-orange-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {data.remainingPoints}
                    </span>
                  </div>
                </div>
              </div>

              {/* 환포 정보 */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-text-primary">
                  🎯 환포 정보
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                      환포계수
                    </span>
                    <span className="px-2 py-1 rounded text-sm font-bold bg-blue-500 text-white">
                      {data.rebirthCoeff}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                      보너스
                    </span>
                    <span className="px-2 py-1 rounded text-sm font-bold bg-purple-500 text-white">
                      {data.bonus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-text-primary">
                      실제환포
                    </span>
                    <span className="px-3 py-2 rounded-lg text-lg font-bold bg-green-500 text-white">
                      {data.finalRebirthValue}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-text-primary">
                      최종스탯
                    </span>
                    <span className="px-3 py-2 rounded-lg text-lg font-bold bg-accent text-white">
                      {data.finalStats}
                    </span>
                  </div>
                </div>
              </div>
              </div>
            </div>
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
              { key: 'agi', label: '순발 환포적용' }
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
                        {data.appliedRebirth.con + data.appliedRebirth.wis + data.appliedRebirth.dex + data.appliedRebirth.agi + data.bonus}
                      </div>
                      <div className="inline-block px-1.5 py-0.5 rounded text-xs font-mono bg-gray-600 text-white">
                        {(data.appliedRebirthDecimal.con + data.appliedRebirthDecimal.wis + data.appliedRebirthDecimal.dex + data.appliedRebirthDecimal.agi + data.bonus).toFixed(2)}
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
                <th className="px-4 py-3 text-left font-semibold" rowSpan={2}>스탯</th>
                {calculatedData.map((_, i) => (
                  <th key={i} className="px-2 py-2 text-center font-semibold border-l border-border" colSpan={2}>
                    {i + 1}환
                  </th>
                ))}
              </tr>
              <tr className="bg-bg-tertiary border-t border-border">
                {calculatedData.map((_, i) => (
                  <>
                    <th key={`${i}-applied`} className="px-2 py-2 text-center font-semibold text-xs bg-bg-tertiary text-text-secondary">
                      적용
                    </th>
                    <th key={`${i}-actual`} className="px-2 py-2 text-center font-semibold text-xs bg-bg-tertiary text-text-secondary">
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
                { key: 'agi', label: '순발 환포적용' }
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
                        {data.appliedRebirth.con + data.appliedRebirth.wis + data.appliedRebirth.dex + data.appliedRebirth.agi + data.bonus}
                      </span>
                    </td>
                    <td key={`${i}-total-actual`} className="px-2 py-3 text-center">
                      <span className="inline-block px-2 py-1 rounded text-xs font-mono bg-gray-600 text-white">
                        {(data.appliedRebirthDecimal.con + data.appliedRebirthDecimal.wis + data.appliedRebirthDecimal.dex + data.appliedRebirthDecimal.agi + data.bonus).toFixed(2)}
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
        <h2 className="text-2xl font-bold mb-4 text-center text-text-primary">
          🏆 MAX 환포
        </h2>
          
        <div className="grid grid-cols-5 gap-4">
          {[66, 98, 130, 161, 192].map((max, i) => (
            <div key={i} className="text-center">
              <div className="text-sm font-medium mb-2 text-text-secondary">
                {i + 1}환
              </div>
              <div className="px-4 py-2 rounded-lg font-bold text-lg bg-red-500 text-white">
                {max}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-lg p-6 w-96 max-w-90vw border border-border">
            <h3 className="text-xl font-bold mb-4 text-text-primary">데이터 저장</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-text-secondary">
                저장할 이름을 입력하세요
              </label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="예: 완캐/순캐"
                className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={10}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="text-xs text-text-muted mb-4">
              * 최대 5개까지 저장 가능하며, 초과 시 가장 오래된 데이터가 삭제됩니다.
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveTitle('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!saveTitle.trim()}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 불러오기 모달 */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-lg p-6 w-96 max-w-90vw border border-border max-h-80vh overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-text-primary">저장된 데이터 불러오기</h3>
            {savedDataList.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                저장된 데이터가 없습니다.
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {savedDataList
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((data) => (
                    <div key={data.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary border border-border">
                      <div className="flex-1">
                        <div className="font-semibold text-text-primary">{data.title}</div>
                        <div className="text-xs text-text-secondary">
                          {formatTimestamp(data.timestamp)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoad(data.id)}
                          className="px-3 py-1 rounded text-sm bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                        >
                          불러오기
                        </button>
                        <button
                          onClick={() => handleDelete(data.id)}
                          className="px-3 py-1 rounded text-sm bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorPage;