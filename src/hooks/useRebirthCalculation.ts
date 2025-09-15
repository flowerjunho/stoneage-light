import { useMemo } from 'react';

// Excel 분석에 따른 정확한 데이터 구조
export interface StatInput {
  con: number; // 체력 (C9, E9, G9, I9, K9)
  wis: number; // 완력 (C10, E10, G10, I10, K10)
  dex: number; // 건첩 (C11, E11, G11, I11, K11)
  agi: number; // 순발 (C12, E12, G12, I12, K12 - 계산됨)
}

export interface RebirthData {
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

interface UserInputs {
  levels: number[];
  stats: Array<{ con: number; wis: number; dex: number; }>;
}

export const useRebirthCalculation = (userInputs: UserInputs) => {
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

  return calculatedData;
};