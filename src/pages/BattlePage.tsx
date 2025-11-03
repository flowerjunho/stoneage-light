import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import petDataJson from '../data/petData.json';

type TabType = 'info' | 'calculator';
type CalculatorSubTab = 'damage' | 'reverse';
type AttributeType = 'fire' | 'water' | 'earth' | 'wind';

interface CharacterStats {
  lv: number;
  hp: number;
  str: number;
  tgh: number;
  dex: number;
  fire: number;
  water: number;
  earth: number;
  wind: number;
}

interface PetStats {
  str: number;
  tgh: number;
  dex: number;
  hp: number;
}

const STORAGE_KEY_ATTACKER = 'stoneage_battle_attacker';
const STORAGE_KEY_DEFENDER = 'stoneage_battle_defender';

const getDefaultStats = (): CharacterStats => ({
  lv: 140,
  hp: 0,
  str: 0,
  tgh: 0,
  dex: 0,
  fire: 0,
  water: 0,
  earth: 0,
  wind: 0,
});

const loadStatsFromStorage = (key: string): CharacterStats => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load stats from storage:', error);
  }
  return getDefaultStats();
};

const saveStatsToStorage = (key: string, stats: CharacterStats) => {
  try {
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats to storage:', error);
  }
};

const BattlePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL 쿼리에서 탭 상태 가져오기
  const tabFromQuery = searchParams.get('tab') as TabType | null;
  const initialTab =
    tabFromQuery === 'calculator' || tabFromQuery === 'info' ? tabFromQuery : 'info';

  const subTabFromQuery = searchParams.get('subTab') as CalculatorSubTab | null;
  const initialSubTab =
    subTabFromQuery === 'damage' || subTabFromQuery === 'reverse' ? subTabFromQuery : 'damage';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [calculatorSubTab, setCalculatorSubTab] = useState<CalculatorSubTab>(initialSubTab);

  // 공격자/방어자 스탯 (로컬 스토리지에서 불러오기)
  const [attacker, setAttacker] = useState<CharacterStats>(() =>
    loadStatsFromStorage(STORAGE_KEY_ATTACKER)
  );
  const [defender, setDefender] = useState<CharacterStats>(() =>
    loadStatsFromStorage(STORAGE_KEY_DEFENDER)
  );

  // 역계산용 상태
  const [reverseCalc, setReverseCalc] = useState({
    myAttack: 0,
    receivedDamage: 0,
    myEarth: 0,
    myWater: 0,
    myFire: 0,
    myWind: 0,
  });

  // 페트 탑승 상태
  const [attackerPet, setAttackerPet] = useState<PetStats | null>(null);
  const [defenderPet, setDefenderPet] = useState<PetStats | null>(null);

  // 역계산용 페트 상태 (petId와 레벨 저장)
  const [reverseOpponentPet, setReverseOpponentPet] = useState<{
    petId: string;
    lv: number;
  } | null>(null);

  // 탑승 가능한 페트 목록
  const rideablePets = petDataJson.pets.filter(pet => pet.rideable === '탑승가능');

  // 탭 변경 시 URL 쿼리 업데이트
  useEffect(() => {
    const params: { tab: string; subTab?: string } = { tab: activeTab };
    if (activeTab === 'calculator') {
      params.subTab = calculatorSubTab;
    }
    setSearchParams(params, { replace: true });
  }, [activeTab, calculatorSubTab, setSearchParams]);

  // 공격자 스탯이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveStatsToStorage(STORAGE_KEY_ATTACKER, attacker);
  }, [attacker]);

  // 방어자 스탯이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveStatsToStorage(STORAGE_KEY_DEFENDER, defender);
  }, [defender]);

  // 속성 총합 계산
  const getAttributeTotal = (char: CharacterStats) => {
    return char.fire + char.water + char.earth + char.wind;
  };

  // 페트 레벨에 따른 스탯 계산 (역계산용)
  const calculatePetStatsFromData = (petId: string, petLevel: number) => {
    const pet = petDataJson.pets.find(p => p.id === petId);
    if (!pet) return null;

    return {
      str: Math.floor(pet.baseStats.attack + pet.growthStats.attack * petLevel),
      tgh: Math.floor(pet.baseStats.defense + pet.growthStats.defense * petLevel),
      dex: Math.floor(pet.baseStats.agility + pet.growthStats.agility * petLevel),
      hp: Math.floor(pet.baseStats.vitality + pet.growthStats.vitality * petLevel),
    };
  };

  // 탑승 시 최종 스탯 계산 (캐릭터 70% + 페트 30%)
  const calculateRidingStats = (char: CharacterStats, petStats: PetStats | null) => {
    if (!petStats) return char;

    return {
      lv: char.lv,
      hp: Math.floor(char.hp * 0.7 + petStats.hp * 0.3),
      str: Math.floor(char.str * 0.7 + petStats.str * 0.3),
      tgh: Math.floor(char.tgh * 0.7 + petStats.tgh * 0.3),
      dex: Math.floor(char.dex * 0.7 + petStats.dex * 0.3),
      // 속성은 캐릭터의 속성을 따라감
      fire: char.fire,
      water: char.water,
      earth: char.earth,
      wind: char.wind,
    };
  };

  // 속성 업데이트 핸들러 (대립 속성 체크)
  const handleAttributeChange = (
    char: CharacterStats,
    setChar: React.Dispatch<React.SetStateAction<CharacterStats>>,
    attr: AttributeType,
    value: number
  ) => {
    const newValue = Math.max(0, Math.min(10, value));
    const newChar = { ...char, [attr]: newValue };

    // 대립 속성 체크 (지↔화, 수↔풍)
    if ((attr === 'earth' && newChar.fire > 0) || (attr === 'fire' && newChar.earth > 0)) {
      // 지-화 대립
      if (attr === 'earth') newChar.fire = 0;
      if (attr === 'fire') newChar.earth = 0;
    }
    if ((attr === 'water' && newChar.wind > 0) || (attr === 'wind' && newChar.water > 0)) {
      // 수-풍 대립
      if (attr === 'water') newChar.wind = 0;
      if (attr === 'wind') newChar.water = 0;
    }

    // 총합 10 체크
    const total = newChar.fire + newChar.water + newChar.earth + newChar.wind;
    if (total > 10) {
      return; // 10 초과 시 업데이트 안함
    }

    setChar(newChar);
  };

  // 속성 데미지 보정 계산
  const calculateAttributeBonus = (atkChar: CharacterStats, defChar: CharacterStats): number => {
    const atkFire = atkChar.fire * 10;
    const atkWater = atkChar.water * 10;
    const atkEarth = atkChar.earth * 10;
    const atkWind = atkChar.wind * 10;
    const atkNone = 100 - (atkFire + atkWater + atkEarth + atkWind);

    const defFire = defChar.fire * 10;
    const defWater = defChar.water * 10;
    const defEarth = defChar.earth * 10;
    const defWind = defChar.wind * 10;
    const defNone = 100 - (defFire + defWater + defEarth + defWind);

    // 화 속성 데미지
    const fireDmg =
      atkFire * defNone * 1.5 +
      atkFire * defFire * 1.0 +
      atkFire * defWater * 0.6 +
      atkFire * defEarth * 1.0 +
      atkFire * defWind * 1.5;

    // 수 속성 데미지
    const waterDmg =
      atkWater * defNone * 1.5 +
      atkWater * defFire * 1.5 +
      atkWater * defWater * 1.0 +
      atkWater * defEarth * 0.6 +
      atkWater * defWind * 1.0;

    // 지 속성 데미지
    const earthDmg =
      atkEarth * defNone * 1.5 +
      atkEarth * defFire * 1.0 +
      atkEarth * defWater * 1.5 +
      atkEarth * defEarth * 1.0 +
      atkEarth * defWind * 0.6;

    // 풍 속성 데미지
    const windDmg =
      atkWind * defNone * 1.5 +
      atkWind * defFire * 0.6 +
      atkWind * defWater * 1.0 +
      atkWind * defEarth * 1.5 +
      atkWind * defWind * 1.0;

    // 무속성 데미지
    const noneDmg =
      atkNone * defFire * 0.6 +
      atkNone * defWater * 0.6 +
      atkNone * defEarth * 0.6 +
      atkNone * defWind * 0.6 +
      atkNone * defNone * 1.0;

    const total = fireDmg + waterDmg + earthDmg + windDmg + noneDmg;
    return total * 0.0001;
  };

  // 크리티컬 확률 계산 (10000 단위, 실제 % = 결과 / 100)
  const calculateCriticalRate = (atkDex: number, defDex: number): number => {
    const divpara = 3.5; // 플레이어 vs 플레이어 기본값

    let big: number;
    let small: number;
    let wari: number;

    if (atkDex >= defDex) {
      big = atkDex;
      small = defDex;
      wari = 1.0;
    } else {
      big = defDex;
      small = atkDex;
      if (big <= 0) {
        wari = 0.0;
      } else {
        wari = small / big;
      }
    }

    const work = (big - small) / divpara;
    if (work <= 0) return 0;

    let per = Math.sqrt(work);
    per *= wari;
    per *= 100; // 10000 단위로 변환

    if (per < 0) per = 1;
    if (per > 10000) per = 10000;

    return Math.floor(per);
  };

  // 기본 데미지 계산
  const calculateBaseDamage = (
    atk: number,
    def: number
  ): { min: number; max: number; avg: number } => {
    const defense = def * 0.7;

    if (atk >= defense * 1.14) {
      // 케이스 1: 강한 데미지 (DAMAGE_RATE = 2.0)
      const base = (atk - defense) * 2.0;
      const variance = atk * 0.0625;
      return {
        min: Math.max(1, Math.round(base - variance)),
        max: Math.round(base + variance),
        avg: Math.round(base),
      };
    } else if (atk >= defense) {
      // 케이스 2: 약한 데미지
      const maxDmg = atk * 0.0625;
      return {
        min: 1,
        max: Math.round(maxDmg),
        avg: Math.round(maxDmg / 2),
      };
    } else {
      // 케이스 3: 무데미지
      return { min: 1, max: 1, avg: 1 };
    }
  };

  // 크리티컬 데미지 계산
  const calculateCriticalDamage = (normalDamage: number, defenderDef: number): number => {
    // 크리 데미지 = 일반 데미지 + (방어자 방어력 × 공격자 레벨 ÷ 방어자 레벨 × 0.5)
    const additionalDamage = defenderDef * (attacker.lv / defender.lv) * 0.5;
    return Math.round(normalDamage + additionalDamage);
  };

  // 회피율 계산
  const calculateDodgeRate = (atkDex: number, defDex: number, defLuck: number = 0): number => {
    // K값 (기본 0.02, 주술 커맨드시 0.027 - 여기서는 기본값 사용)
    const K = 0.02;

    const atkDexModified = atkDex;
    const defDexModified = defDex;

    // DEX 보정 규칙은 일단 기본 값 사용 (캐릭터 vs 캐릭터)
    // 실제로는 타입에 따라 0.8, 0.6 보정이 들어가지만 계산기에서는 기본값

    const bigDex = Math.max(atkDexModified, defDexModified);
    const smallDex = Math.min(atkDexModified, defDexModified);

    let ratio: number;
    if (defDexModified >= atkDexModified) {
      ratio = 1.0;
    } else {
      ratio = bigDex <= 0 ? 0 : smallDex / bigDex;
    }

    const work = (bigDex - smallDex) / K;
    if (work <= 0) return 0;

    let per = Math.sqrt(work);
    per *= ratio;
    per += defLuck; // 방어자 운 추가

    per *= 100; // 퍼센트로 변환

    // 최대 75% 제한
    if (per > 75 * 100) per = 75 * 100;
    if (per <= 0) per = 1;

    return per / 100; // 실제 퍼센트 값으로 반환
  };

  // 전체 데미지 계산
  const calculateDamage = (weaponType: 'melee' | 'ranged') => {
    // 페트 탑승 시 스탯 적용
    const finalAttacker = calculateRidingStats(attacker, attackerPet);
    const finalDefender = calculateRidingStats(defender, defenderPet);

    const atk = finalAttacker.str;
    const def = finalDefender.tgh;
    const baseDamage = calculateBaseDamage(atk, def);
    const attrBonus = calculateAttributeBonus(finalAttacker, finalDefender);
    const critRate = calculateCriticalRate(finalAttacker.dex, finalDefender.dex);
    // 회피율: 근접은 기본, 원거리는 +20% 보너스 (최대치 제한 없음)
    const baseDodgeRate = calculateDodgeRate(finalAttacker.dex, finalDefender.dex, 0);
    const dodgeRate = weaponType === 'ranged' ? baseDodgeRate + 20 : baseDodgeRate;

    const finalMin = Math.round(baseDamage.min * attrBonus);
    const finalMax = Math.round(baseDamage.max * attrBonus);
    const finalAvg = Math.round(baseDamage.avg * attrBonus);

    // 방어력 계산 (TGH × 0.7)
    const defenderDefense = finalDefender.tgh * 0.7;

    return {
      baseDamage,
      attrBonus,
      critRate,
      dodgeRate,
      normal: { min: finalMin, max: finalMax, avg: finalAvg },
      critical: {
        min: calculateCriticalDamage(finalMin, defenderDefense),
        max: calculateCriticalDamage(finalMax, defenderDefense),
        avg: calculateCriticalDamage(finalAvg, defenderDefense),
      },
    };
  };

  return (
    <div className="w-full min-h-screen bg-bg-primary text-text-primary p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/?tab=pet')}
            className="flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg transition-colors"
            aria-label="홈으로 가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>
          <ThemeToggle />
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-text-primary">
            스톤에이지 듀얼 정보
          </h1>
          <div className="w-20 h-0.5 bg-accent mx-auto rounded-full"></div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-2 font-bold transition-colors ${
              activeTab === 'info'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            정보
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 px-4 py-2 font-bold transition-colors ${
              activeTab === 'calculator'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            계산기
          </button>
        </div>

        {/* 정보 탭 */}
        {activeTab === 'info' && (
          <>
            {/* 목차 */}
            <div className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg">
              <h2 className="text-lg md:text-xl font-bold mb-3 text-text-primary flex items-center gap-2">
                <span>📖</span> 목차
              </h2>
              <ul className="space-y-1.5 text-sm md:text-base">
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-accent hover:underline text-left"
                  >
                    1. 캐릭터 능력치 시스템
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('attributes')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-accent hover:underline text-left"
                  >
                    2. 속성 시스템
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('damage')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-accent hover:underline text-left"
                  >
                    3. 데미지 계산 공식 & 크리티컬
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('riding')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-accent hover:underline text-left"
                  >
                    4. 라이딩 펫 시스템
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-accent hover:underline text-left"
                  >
                    5. 실전 예제
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('strategy')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-accent hover:underline text-left"
                  >
                    6. 최적화 전략
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('dodge')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-accent hover:underline text-left"
                  >
                    7. 회피(Dodge) 시스템
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('guard')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-accent hover:underline text-left"
                  >
                    8. 방어(Guard) 커맨드
                  </button>
                </li>
              </ul>
            </div>

            {/* 1. 캐릭터 능력치 시스템 */}
            <div
              id="stats"
              className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                <span>💪</span> 1. 캐릭터 능력치 시스템
              </h2>

              {/* 기본 능력치 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">1.1 기본 능력치</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary">
                        <th className="p-2 text-left border border-border">능력치</th>
                        <th className="p-2 text-center border border-border">포인트</th>
                        <th className="p-2 text-left border border-border">효과</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-border font-bold">체력 (VIT)</td>
                        <td className="p-2 text-center border border-border">0~20pt</td>
                        <td className="p-2 border border-border text-text-secondary">HP 증가</td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border font-bold">공격력 (STR)</td>
                        <td className="p-2 text-center border border-border">0~20pt</td>
                        <td className="p-2 border border-border text-text-secondary">
                          공격력 증가
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-border font-bold">방어력 (TGH)</td>
                        <td className="p-2 text-center border border-border">0~20pt</td>
                        <td className="p-2 border border-border text-text-secondary">
                          방어력 증가
                        </td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border font-bold">순발력 (DEX)</td>
                        <td className="p-2 text-center border border-border">0~20pt</td>
                        <td className="p-2 border border-border text-text-secondary">
                          크리티컬, 회피율
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <p className="text-sm text-text-secondary">
                    ✅ <strong>총 합계: 정확히 20pt</strong>
                  </p>
                </div>
              </div>

              {/* 속성 포인트 */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-accent">1.2 속성 포인트</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-center">
                    <div className="font-bold text-green-500 text-lg">지(地)</div>
                    <div className="text-xs text-text-secondary">0~10pt</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-center">
                    <div className="font-bold text-blue-500 text-lg">수(水)</div>
                    <div className="text-xs text-text-secondary">0~10pt</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-center">
                    <div className="font-bold text-red-500 text-lg">화(火)</div>
                    <div className="text-xs text-text-secondary">0~10pt</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-center">
                    <div className="font-bold text-yellow-500 text-lg">풍(風)</div>
                    <div className="text-xs text-text-secondary">0~10pt</div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded space-y-1 text-sm">
                  <p className="text-text-secondary">✅ 총 합계: 정확히 10pt</p>
                  <p className="text-text-secondary">✅ 최대 2개 속성만 선택 가능</p>
                  <p className="text-red-500">❌ 대립 속성 동시 선택 불가: 지↔화, 수↔풍</p>
                </div>
              </div>
            </div>

            {/* 2. 속성 시스템 */}
            <div
              id="attributes"
              className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                <span>🔮</span> 2. 속성 시스템
              </h2>

              {/* 속성 상성 구조 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">2.1 순환 상성 구조</h3>
                <div className="bg-bg-tertiary rounded p-4 mb-4">
                  <div className="text-center font-mono text-sm md:text-base space-y-2">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="text-green-500 font-bold">지(地)</span>
                      <span className="text-text-secondary">→</span>
                      <span className="text-blue-500 font-bold">수(水)</span>
                      <span className="text-text-secondary">→</span>
                      <span className="text-red-500 font-bold">화(火)</span>
                      <span className="text-text-secondary">→</span>
                      <span className="text-yellow-500 font-bold">풍(風)</span>
                      <span className="text-text-secondary">→</span>
                      <span className="text-green-500 font-bold">지(地)</span>
                    </div>
                    <div className="text-accent text-xs">각 단계: ×1.5배 (50% 증가)</div>
                  </div>
                </div>
              </div>

              {/* 속성 상성표 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">2.2 속성 상성표</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary">
                        <th className="p-2 border border-border">공격↓ \ 방어→</th>
                        <th className="p-2 border border-border text-green-500">지</th>
                        <th className="p-2 border border-border text-blue-500">수</th>
                        <th className="p-2 border border-border text-red-500">화</th>
                        <th className="p-2 border border-border text-yellow-500">풍</th>
                        <th className="p-2 border border-border text-text-secondary">무속성</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-border font-bold text-green-500">지</td>
                        <td className="p-2 text-center border border-border">1.0</td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                        <td className="p-2 text-center border border-border bg-red-500/20">
                          0.6 ⚠️
                        </td>
                        <td className="p-2 text-center border border-border">1.0</td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border font-bold text-blue-500">수</td>
                        <td className="p-2 text-center border border-border bg-red-500/20">
                          0.6 ⚠️
                        </td>
                        <td className="p-2 text-center border border-border">1.0</td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                        <td className="p-2 text-center border border-border bg-red-500/20">
                          0.6 ⚠️
                        </td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-border font-bold text-red-500">화</td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                        <td className="p-2 text-center border border-border bg-red-500/20">
                          0.6 ⚠️
                        </td>
                        <td className="p-2 text-center border border-border">1.0</td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border font-bold text-yellow-500">풍</td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                        <td className="p-2 text-center border border-border bg-red-500/20">
                          0.6 ⚠️
                        </td>
                        <td className="p-2 text-center border border-border">1.0</td>
                        <td className="p-2 text-center border border-border bg-green-500/20">
                          1.5 ✅
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm">
                  <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
                    ✅ <strong>유리한 속성:</strong> ×1.5배 (50% 증가)
                  </div>
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                    ⚠️ <strong>불리한 속성:</strong> ×0.6배 (40% 감소)
                  </div>
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                    ➖ <strong>동일 속성:</strong> ×1.0배 (변화 없음)
                  </div>
                </div>
                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                  💡 <strong>최대 차이:</strong> 1.5 ÷ 0.6 ={' '}
                  <strong className="text-accent">2.5배</strong>
                </div>
              </div>

              {/* 속성 조합 예시 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">
                  2.3 복합 속성 데미지 계산 예시
                </h3>
                <p className="text-sm text-text-secondary mb-3">
                  여러 속성을 조합했을 때 실제 데미지 보정이 어떻게 계산되는지 확인해보세요.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary">
                        <th className="p-2 border border-border text-left">공격자 속성</th>
                        <th className="p-2 border border-border text-left">방어자 속성</th>
                        <th className="p-2 border border-border">계산 과정</th>
                        <th className="p-2 border border-border">속성 보정</th>
                        <th className="p-2 border border-border">결과</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 예시 1: 수8지2 vs 화5풍5 */}
                      <tr>
                        <td className="p-2 border border-border">
                          <span className="text-blue-500 font-bold">수 8</span> +{' '}
                          <span className="text-green-500 font-bold">지 2</span>
                        </td>
                        <td className="p-2 border border-border">
                          <span className="text-red-500 font-bold">화 5</span> +{' '}
                          <span className="text-yellow-500 font-bold">풍 5</span>
                        </td>
                        <td className="p-2 border border-border text-xs">
                          <div className="space-y-0.5">
                            <div>수8: (80×50×1.5) + (80×50×1.0) = 6,000 + 4,000</div>
                            <div>지2: (20×50×1.5) + (20×50×1.0) = 1,500 + 1,000</div>
                            <div>총합: 12,500 × 0.0001</div>
                          </div>
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-accent">
                          ×1.25
                        </td>
                        <td className="p-2 text-center border border-border bg-green-500/10">
                          <span className="text-green-500 font-bold">유리</span>
                        </td>
                      </tr>

                      {/* 예시 2: 화10 vs 수5지5 */}
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border">
                          <span className="text-red-500 font-bold">화 10</span>
                        </td>
                        <td className="p-2 border border-border">
                          <span className="text-blue-500 font-bold">수 5</span> +{' '}
                          <span className="text-green-500 font-bold">지 5</span>
                        </td>
                        <td className="p-2 border border-border text-xs">
                          <div className="space-y-0.5">
                            <div>화10: (100×50×0.6) + (100×50×1.0) = 3,000 + 5,000</div>
                            <div>총합: 8,000 × 0.0001</div>
                          </div>
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-yellow-600">
                          ×0.8
                        </td>
                        <td className="p-2 text-center border border-border bg-red-500/10">
                          <span className="text-red-500 font-bold">불리</span>
                        </td>
                      </tr>

                      {/* 예시 3: 지7풍3 vs 화10 */}
                      <tr>
                        <td className="p-2 border border-border">
                          <span className="text-green-500 font-bold">지 7</span> +{' '}
                          <span className="text-yellow-500 font-bold">풍 3</span>
                        </td>
                        <td className="p-2 border border-border">
                          <span className="text-red-500 font-bold">화 10</span>
                        </td>
                        <td className="p-2 border border-border text-xs">
                          <div className="space-y-0.5">
                            <div>지7: 70×100×0.6 = 4,200</div>
                            <div>풍3: 30×100×1.5 = 4,500</div>
                            <div>총합: 8,700 × 0.0001</div>
                          </div>
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-yellow-600">
                          ×0.87
                        </td>
                        <td className="p-2 text-center border border-border bg-red-500/10">
                          <span className="text-red-500 font-bold">약간 불리</span>
                        </td>
                      </tr>

                      {/* 예시 4: 지6풍4 vs 수10 */}
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border">
                          <span className="text-green-500 font-bold">지 6</span> +{' '}
                          <span className="text-yellow-500 font-bold">풍 4</span>
                        </td>
                        <td className="p-2 border border-border">
                          <span className="text-blue-500 font-bold">수 10</span>
                        </td>
                        <td className="p-2 border border-border text-xs">
                          <div className="space-y-0.5">
                            <div>지6: 60×100×1.5 = 9,000</div>
                            <div>풍4: 40×100×1.0 = 4,000</div>
                            <div>총합: 13,000 × 0.0001</div>
                          </div>
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-accent">
                          ×1.3
                        </td>
                        <td className="p-2 text-center border border-border bg-green-500/10">
                          <span className="text-green-500 font-bold">유리</span>
                        </td>
                      </tr>

                      {/* 예시 5: 화7풍3 vs 지10 */}
                      <tr>
                        <td className="p-2 border border-border">
                          <span className="text-red-500 font-bold">화 7</span> +{' '}
                          <span className="text-yellow-500 font-bold">풍 3</span>
                        </td>
                        <td className="p-2 border border-border">
                          <span className="text-green-500 font-bold">지 10</span>
                        </td>
                        <td className="p-2 border border-border text-xs">
                          <div className="space-y-0.5">
                            <div>화7: 70×100×0.6 = 4,200</div>
                            <div>풍3: 30×100×1.5 = 4,500</div>
                            <div>총합: 8,700 × 0.0001</div>
                          </div>
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-yellow-600">
                          ×0.87
                        </td>
                        <td className="p-2 text-center border border-border bg-red-500/10">
                          <span className="text-red-500 font-bold">약간 불리</span>
                        </td>
                      </tr>

                      {/* 예시 6: 화5 vs 무속성 */}
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border">
                          <span className="text-red-500 font-bold">화 5</span>
                        </td>
                        <td className="p-2 border border-border">
                          <span className="text-text-secondary">무속성</span>
                        </td>
                        <td className="p-2 border border-border text-xs">
                          <div className="space-y-0.5">
                            <div>화5: 50×100×1.5 = 7,500</div>
                            <div>무5: 50×100×0.6 = 3,000</div>
                            <div>총합: 10,500 × 0.0001</div>
                          </div>
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-accent">
                          ×1.05
                        </td>
                        <td className="p-2 text-center border border-border bg-green-500/10">
                          <span className="text-green-500 font-bold">약간 유리</span>
                        </td>
                      </tr>

                      {/* 예시 7: 수9지1 vs 지7풍3 */}
                      <tr>
                        <td className="p-2 border border-border">
                          <span className="text-blue-500 font-bold">수 9</span> +{' '}
                          <span className="text-green-500 font-bold">지 1</span>
                        </td>
                        <td className="p-2 border border-border">
                          <span className="text-green-500 font-bold">지 7</span> +{' '}
                          <span className="text-yellow-500 font-bold">풍 3</span>
                        </td>
                        <td className="p-2 border border-border text-xs">
                          <div className="space-y-0.5">
                            <div>수9: (90×70×1.5) + (90×30×1.0) = 9,450 + 2,700</div>
                            <div>지1: (10×70×1.0) + (10×30×0.6) = 700 + 180</div>
                            <div>총합: 13,030 × 0.0001</div>
                          </div>
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-accent">
                          ×1.30
                        </td>
                        <td className="p-2 text-center border border-border bg-green-500/10">
                          <span className="text-green-500 font-bold">유리</span>
                        </td>
                      </tr>

                      {/* 예시 8: 화5풍5 vs 지8수2 */}
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border">
                          <span className="text-red-500 font-bold">화 5</span> +{' '}
                          <span className="text-yellow-500 font-bold">풍 5</span>
                        </td>
                        <td className="p-2 border border-border">
                          <span className="text-green-500 font-bold">지 8</span> +{' '}
                          <span className="text-blue-500 font-bold">수 2</span>
                        </td>
                        <td className="p-2 border border-border text-xs">
                          <div className="space-y-0.5">
                            <div>화5: (50×80×0.6) + (50×20×1.5) = 2,400 + 1,500</div>
                            <div>풍5: (50×80×1.5) + (50×20×0.6) = 6,000 + 600</div>
                            <div>총합: 10,500 × 0.0001</div>
                          </div>
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-accent">
                          ×1.05
                        </td>
                        <td className="p-2 text-center border border-border bg-green-500/10">
                          <span className="text-green-500 font-bold">약간 유리</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <h4 className="font-bold text-blue-500 mb-2">💡 핵심 인사이트</h4>
                  <div className="text-sm text-text-secondary space-y-1">
                    <p>
                      ⚠️ <strong>속성 조합 제약:</strong> 지↔화, 수↔풍은 동시 선택 불가 (대립
                      속성)
                    </p>
                    <p>
                      ✅ <strong>가능한 조합:</strong> 지+수, 지+풍, 수+화, 화+풍 (인접 속성만 조합
                      가능)
                    </p>
                    <p>
                      ✅ <strong>수8지2 vs 화5풍5</strong>: 1.25배 - 주 속성(수)이 유리하면
                      전체적으로 유리
                    </p>
                    <p>
                      ✅ <strong>단일 속성 10pt</strong>가 복합 속성보다 강력한 경우가 많습니다.
                    </p>
                    <p>
                      ✅ <strong>복합 속성</strong>은 상대 속성에 따라 0.87~1.5배로 변동이 큽니다.
                    </p>
                    <p className="text-accent mt-2">
                      🎯 <strong>최적 전략:</strong> 상대의 약점 속성 10pt 투자 → 최대 1.5배 데미지!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 데미지 계산 공식 */}
            <div
              id="damage"
              className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                <span>🎯</span> 3. 데미지 계산 공식 & 크리티컬
              </h2>

              {/* 전투 능력치 변환 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">3.1 전투 능력치 변환</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <strong>공격력:</strong> <code className="text-accent">STR</code> (거의 그대로)
                  </div>
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <strong>방어력:</strong> <code className="text-accent">TGH × 0.7</code> (70%
                    적용)
                  </div>
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <strong>순발력:</strong> <code className="text-accent">DEX</code> (거의 그대로)
                  </div>
                </div>
              </div>

              {/* 크리티컬 시스템 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">3.2 크리티컬 시스템</h3>
                <div className="p-4 bg-bg-tertiary rounded border border-border mb-3">
                  <h4 className="font-bold text-accent mb-2">크리티컬 확률 계산</h4>
                  <div className="text-sm space-y-2 text-text-secondary">
                    <p>
                      <strong>기본 공식:</strong>
                    </p>
                    <code className="block bg-bg-primary px-3 py-2 rounded text-xs md:text-sm">
                      크리확률 = (√(DEX차이 ÷ 3.5) + 무기크리옵션×0.5 + 행운) × 100
                    </code>
                    <p className="mt-2">
                      <strong>DEX 차이:</strong> 공격자 DEX - 방어자 DEX
                    </p>
                    <p>
                      <strong>무기 크리티컬 옵션:</strong> 무기에 부여된 크리티컬 수치
                    </p>
                    <p>
                      <strong>행운:</strong> 캐릭터의 행운 수치
                    </p>
                  </div>
                </div>

                <div className="mb-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <h4 className="font-bold text-yellow-500 mb-2">크리티컬 데미지 공식</h4>
                  <div className="text-sm space-y-2 text-text-secondary">
                    <code className="block bg-bg-primary px-3 py-2 rounded text-xs md:text-sm">
                      크리 데미지 = 일반 데미지 + (방어자 방어력 × 공격자 레벨 ÷ 방어자 레벨 × 0.5)
                    </code>
                    <div className="mt-3 p-3 bg-bg-tertiary rounded">
                      <p className="font-bold mb-2">예제:</p>
                      <p>• 일반 데미지: 100</p>
                      <p>• 방어자 방어력: 200</p>
                      <p>• 공격자 레벨: 120</p>
                      <p>• 방어자 레벨: 100</p>
                      <hr className="my-2 border-border" />
                      <p>크리 데미지 = 100 + (200 × 120 ÷ 100 × 0.5)</p>
                      <p className="text-accent font-bold">= 100 + 120 = 220</p>
                    </div>
                    <p className="text-yellow-500 mt-2">
                      ⚠️ <strong>중요:</strong> 단순히 2배가 아니라 방어력과 레벨을 고려한 추가
                      데미지!
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                    <h4 className="font-bold text-green-500 mb-2">크리티컬 효과</h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>✅ 방어력 기반 추가 데미지</p>
                      <p>✅ 레벨 차이 반영</p>
                      <p>✅ 시각 효과 발생</p>
                      <p>✅ DEX가 높을수록 발생률 증가</p>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-tertiary border border-border rounded">
                    <h4 className="font-bold text-accent mb-2">크리 확률 예제</h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>공격자 DEX: 305</p>
                      <p>방어자 DEX: 150</p>
                      <p>무기 크리옵션: 0</p>
                      <p>행운: 0</p>
                      <hr className="my-1 border-border" />
                      <p>DEX 차이: 155</p>
                      <p>
                        크리확률: <strong className="text-accent">√(155÷3.5) × 100 ≈ 665%</strong>
                      </p>
                      <p className="text-xs text-yellow-500">※ 실제: 6.65% (10000 단위)</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm">
                  💡 <strong>팁:</strong> DEX 차이가 클수록, 무기 크리옵션이 높을수록, 행운이
                  높을수록 크리티컬 확률 증가!
                </div>
              </div>

              {/* 데미지 계산 3단계 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">3.3 데미지 계산 3단계</h3>
                <p className="text-sm text-text-secondary mb-3">
                  공격력과 방어력의 비율에 따라 3가지 케이스로 나뉩니다.
                </p>

                {/* 케이스 1 */}
                <div className="mb-3 p-4 bg-green-500/10 border border-green-500/30 rounded">
                  <h4 className="font-bold text-green-500 mb-2">
                    케이스 1: 공격력 ≥ 방어력 × 1.14 (강한 데미지)
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <code className="bg-bg-tertiary px-2 py-1 rounded">
                        데미지 = (ATK - DEF) × 2.0 ± (ATK × 6.25%)
                      </code>
                    </p>
                    <p className="text-text-secondary mt-2">
                      <strong>예제:</strong> ATK 1500, DEF 840 → 기본 1320
                      <br />
                      최종 범위: <strong>1226 ~ 1414</strong>
                    </p>
                  </div>
                </div>

                {/* 케이스 2 */}
                <div className="mb-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <h4 className="font-bold text-yellow-600 mb-2">
                    케이스 2: 방어력 ≤ 공격력 &lt; 방어력 × 1.14 (약한 데미지)
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <code className="bg-bg-tertiary px-2 py-1 rounded">
                        데미지 = 0 ~ (ATK × 6.25%)
                      </code>
                    </p>
                    <p className="text-text-secondary mt-2">
                      <strong>예제:</strong> ATK 1000, DEF 900 → 데미지 범위:{' '}
                      <strong>0 ~ 62</strong>
                    </p>
                  </div>
                </div>

                {/* 케이스 3 */}
                <div className="mb-3 p-4 bg-red-500/10 border border-red-500/30 rounded">
                  <h4 className="font-bold text-red-500 mb-2">
                    케이스 3: 공격력 &lt; 방어력 (무데미지)
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <code className="bg-bg-tertiary px-2 py-1 rounded">데미지 = 0 ~ 1</code>
                    </p>
                    <p className="text-text-secondary mt-2">
                      <strong>결과:</strong> 거의 데미지 없음
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm">
                  💡 <strong>핵심 임계점:</strong> 방어력의{' '}
                  <strong className="text-accent">1.14배</strong>를 넘어야 강한 데미지!
                </div>
              </div>
            </div>

            {/* 4. 라이딩 펫 시스템 */}
            <div
              id="riding"
              className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                <span>🐎</span> 4. 라이딩 펫 시스템
              </h2>

              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm">
                <p>
                  💡 펫을 탑승하면 <strong>캐릭터와 펫의 능력치가 합산</strong>됩니다!
                </p>
              </div>

              {/* 능력치 합산표 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">4.1 라이딩 능력치 합산</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary">
                        <th className="p-2 border border-border text-left">능력치</th>
                        <th className="p-2 border border-border">무기 종류</th>
                        <th className="p-2 border border-border">캐릭터</th>
                        <th className="p-2 border border-border">펫</th>
                        <th className="p-2 border border-border">합계</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-border font-bold">공격력</td>
                        <td className="p-2 border border-border">근접</td>
                        <td className="p-2 text-center border border-border">80%</td>
                        <td className="p-2 text-center border border-border">80%</td>
                        <td className="p-2 text-center border border-border bg-green-500/20 font-bold">
                          160% ✨
                        </td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border font-bold">공격력</td>
                        <td className="p-2 border border-border">원거리</td>
                        <td className="p-2 text-center border border-border">100%</td>
                        <td className="p-2 text-center border border-border">40%</td>
                        <td className="p-2 text-center border border-border font-bold">140%</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-border font-bold">방어력</td>
                        <td className="p-2 border border-border">공통</td>
                        <td className="p-2 text-center border border-border">70%</td>
                        <td className="p-2 text-center border border-border">70%</td>
                        <td className="p-2 text-center border border-border font-bold">140%</td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border font-bold">속성</td>
                        <td className="p-2 border border-border">공통</td>
                        <td className="p-2 text-center border border-border">100%</td>
                        <td className="p-2 text-center border border-border bg-red-500/20">0%</td>
                        <td className="p-2 text-center border border-border font-bold">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                  ⚠️ <strong>중요:</strong> 신버전에서는 펫의 속성이 무시됩니다! 캐릭터 속성만
                  적용됩니다.
                </div>
              </div>

              {/* 예제 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">4.2 라이딩 공격력 예제</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-green-500 mb-2">근접 무기 (검/도끼)</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>캐릭터 ATK: 1500</p>
                      <p>펫 ATK: 1000</p>
                      <hr className="my-2 border-border" />
                      <p>
                        라이딩 ATK:{' '}
                        <strong className="text-accent">(1500×0.8) + (1000×0.8) = 2000</strong>
                      </p>
                      <p className="text-green-500">증가율: 33.3%</p>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-blue-500 mb-2">원거리 무기 (활/부메랑)</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>캐릭터 ATK: 1500</p>
                      <p>펫 ATK: 1000</p>
                      <hr className="my-2 border-border" />
                      <p>
                        라이딩 ATK:{' '}
                        <strong className="text-accent">1500 + (1000×0.4) = 1900</strong>
                      </p>
                      <p className="text-blue-500">증가율: 26.7%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. 실전 예제 */}
            <div
              id="examples"
              className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                <span>📊</span> 5. 실전 예제
              </h2>

              {/* 비라이딩 vs 라이딩 비교 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">5.1 데미지 비교</h3>
                <p className="text-sm text-text-secondary mb-3">
                  <strong>공격자:</strong> STR 1500, 화 속성 10pt | <strong>방어자:</strong> TGH
                  1200 (DEF 840), 풍 속성 10pt
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary">
                        <th className="p-2 border border-border text-left">상황</th>
                        <th className="p-2 border border-border">공격력</th>
                        <th className="p-2 border border-border">기본 데미지</th>
                        <th className="p-2 border border-border">속성 보정</th>
                        <th className="p-2 border border-border">최종 데미지</th>
                        <th className="p-2 border border-border">비율</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-border">비라이딩</td>
                        <td className="p-2 text-center border border-border">1500</td>
                        <td className="p-2 text-center border border-border">660</td>
                        <td className="p-2 text-center border border-border">×1.5</td>
                        <td className="p-2 text-center border border-border font-bold">990</td>
                        <td className="p-2 text-center border border-border">100%</td>
                      </tr>
                      <tr className="bg-green-500/10">
                        <td className="p-2 border border-border font-bold">라이딩(근접)</td>
                        <td className="p-2 text-center border border-border">2000</td>
                        <td className="p-2 text-center border border-border">1160</td>
                        <td className="p-2 text-center border border-border">×1.5</td>
                        <td className="p-2 text-center border border-border font-bold text-accent">
                          1740
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-green-500">
                          176%
                        </td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 border border-border">라이딩(원거리)</td>
                        <td className="p-2 text-center border border-border">1900</td>
                        <td className="p-2 text-center border border-border">1060</td>
                        <td className="p-2 text-center border border-border">×1.5</td>
                        <td className="p-2 text-center border border-border font-bold">1590</td>
                        <td className="p-2 text-center border border-border font-bold">161%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded text-sm">
                  ✅ <strong>결론:</strong> 근접 무기 라이딩이{' '}
                  <strong className="text-accent">가장 강력!</strong> (76% 증가)
                </div>
              </div>

              {/* 속성 차이 예제 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">5.2 속성 차이의 중요성</h3>
                <p className="text-sm text-text-secondary mb-3">
                  동일한 라이딩 상황에서 속성만 변경했을 때
                </p>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                    <h4 className="font-bold text-green-500 mb-2">유리한 속성 (화 vs 풍)</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>기본 데미지: 1160</p>
                      <p>속성 보정: ×1.5 (유리)</p>
                      <hr className="my-2 border-border" />
                      <p>
                        최종 데미지: <strong className="text-accent">1740</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <h4 className="font-bold text-red-500 mb-2">불리한 속성 (풍 vs 화)</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>기본 데미지: 1160</p>
                      <p>속성 보정: ×0.6 (불리)</p>
                      <hr className="my-2 border-border" />
                      <p>
                        최종 데미지: <strong className="text-red-500">696</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                  💡 <strong>속성 차이:</strong> 1740 vs 696 ={' '}
                  <strong className="text-accent">2.5배 차이!</strong>
                </div>
              </div>
            </div>

            {/* 6. 최적화 전략 */}
            <div
              id="strategy"
              className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                <span>🎓</span> 6. 최적화 전략
              </h2>

              {/* 캐릭터 육성 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">6.1 캐릭터 능력치 분배</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-red-500 mb-2">공격형</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>STR: 15~20pt ⭐</p>
                      <p>TGH: 0~5pt</p>
                      <p>DEX: 0~5pt (크리용)</p>
                      <p>VIT: 0pt</p>
                      <p className="text-xs text-yellow-500 mt-2">
                        💡 DEX 투자 시 크리티컬 확률 증가
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-blue-500 mb-2">방어형</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>TGH: 15~20pt ⭐</p>
                      <p>STR: 0~5pt</p>
                      <p>DEX: 0~5pt (회피용)</p>
                      <p>VIT: 0pt</p>
                      <p className="text-xs text-yellow-500 mt-2">
                        💡 DEX 투자 시 크리티컬 회피 증가
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-green-500 mb-2">균형형</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>STR: 10pt</p>
                      <p>TGH: 8pt</p>
                      <p>DEX: 2pt (크리/회피)</p>
                      <p>VIT: 0pt</p>
                      <p className="text-xs text-yellow-500 mt-2">💡 소량의 DEX로 크리확률 향상</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 속성 선택 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">6.2 속성 선택 전략</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                    <strong>✅ 추천:</strong> 단일 속성 10pt 투자 (최대 효과)
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <strong>❌ 비추천:</strong> 복합 속성 (5pt + 5pt) - 효과 절반
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <strong>💡 팁:</strong> 상대의 주력 속성 파악 후 유리한 속성 선택
                  </div>
                </div>
              </div>

              {/* 라이딩 펫 선택 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">6.3 라이딩 펫 선택</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-green-500 mb-2">근접 무기 사용 시</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>✅ STR 최대화 (공격력 80% 반영)</p>
                      <p>✅ TGH 높은 펫 (방어력 70% 반영)</p>
                      <p>✅ DEX 높은 펫 (방어 순발력 90%)</p>
                      <p>➖ 속성 무관 (캐릭터만 적용)</p>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-blue-500 mb-2">원거리 무기 사용 시</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>✅ STR 높은 펫 (40% 반영)</p>
                      <p>✅ 캐릭터 DEX 중시 (순발력 80%)</p>
                      <p>⚠️ 근접 대비 효율 낮음</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 전투 전략 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">6.4 전투 전략</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-accent mb-2">🎯 임계점 돌파</h4>
                    <p className="text-sm text-text-secondary">
                      적 방어력의 <strong>1.14배 이상</strong> 공격력 확보 시 데미지 폭발적 증가!
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      예: 적 DEF 840 → 필요 ATK 957 이상
                    </p>
                  </div>

                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-accent mb-2">⚡ 크리티컬 극대화</h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>
                        <strong>크리티컬 확률 올리기:</strong>
                      </p>
                      <p>• DEX를 적보다 높게 유지 (차이가 클수록 좋음)</p>
                      <p>• 무기에 크리티컬 옵션 부여</p>
                      <p>• 행운 스탯 투자</p>
                      <p className="text-accent mt-1">
                        💡 크리 발생 시 <strong>데미지 2배</strong> - 극딜의 핵심!
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-accent mb-2">🔮 속성 활용</h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>• 적이 풍 속성 → 화 속성 공격 (×1.5)</p>
                      <p>• 적이 화 속성 → 수 속성 공격 (×1.5)</p>
                      <p>• 적이 수 속성 → 지 속성 공격 (×1.5)</p>
                      <p>• 적이 지 속성 → 풍 속성 공격 (×1.5)</p>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-accent mb-2">🐎 펫 전략</h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>
                        <strong>펫 육성 우선순위:</strong>
                      </p>
                      <p>1. 공격형 펫: STR 극대화 (공격력)</p>
                      <p>2. 크리형 펫: DEX 극대화 (크리티컬)</p>
                      <p>3. 방어형 펫: TGH, DEX 극대화 (방어/회피)</p>
                      <p>4. 속성은 무시 (신버전)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 최대 데미지 달성법 */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-accent">6.5 최대 데미지 달성법</h3>
                <div className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg border border-accent">
                  <h4 className="font-bold text-accent mb-3">🏆 최강 조합</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-accent">✅</span>
                      <span className="text-text-secondary">캐릭터 STR 최대 (1500+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">✅</span>
                      <span className="text-text-secondary">펫 STR 최대 (1000+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">✅</span>
                      <span className="text-text-secondary">근접 무기 장착</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">✅</span>
                      <span className="text-text-secondary">유리한 속성 상성</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">✅</span>
                      <span className="text-text-secondary">임계점 이상 ATK (DEF×1.14)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent">✅</span>
                      <span className="text-text-secondary">DEX 우위 확보 (크리티컬)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-bg-secondary rounded border border-border text-sm">
                    <p className="text-text-secondary mb-1">
                      <strong>기본 데미지:</strong>
                    </p>
                    <p className="text-accent font-bold text-lg">1740</p>
                    <p className="text-green-500 mt-1">vs 비라이딩: 76% 증가!</p>
                    <p className="text-green-500">vs 불리한 속성: 339% 증가!</p>
                    <hr className="my-2 border-border" />
                    <p className="text-text-secondary mb-1">
                      <strong>크리티컬 발생 시:</strong>
                    </p>
                    <p className="text-yellow-500 font-bold text-xl">3480 (데미지 2배!)</p>
                    <p className="text-xs text-text-secondary mt-1">
                      💡 DEX 우위 + 크리옵션 무기로 크리확률 극대화!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. 회피 시스템 */}
            <div
              id="dodge"
              className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                <span>💨</span> 7. 회피(Dodge) 시스템
              </h2>

              {/* 회피 공식 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">7.1 회피 확률 계산 공식</h3>

                <div className="p-4 bg-bg-tertiary rounded border border-accent/30 mb-4">
                  <div className="text-sm space-y-2 font-mono">
                    <p className="text-accent font-bold">
                      회피확률 = √((큰DEX - 작은DEX) ÷ K) × 비율 + 방어자운
                    </p>
                    <div className="text-text-secondary text-xs space-y-1 mt-3">
                      <p>• K = 0.02 (기본) 또는 0.027 (주술 커맨드 사용 시)</p>
                      <p>• 비율 = 방어자 DEX ≥ 공격자 DEX면 1.0, 아니면 (작은DEX ÷ 큰DEX)</p>
                      <p>• 방어자운 = 방어자가 플레이어일 경우 LUCK 스탯 적용</p>
                    </div>
                  </div>
                </div>

                {/* DEX 보정 */}
                <div className="mb-4">
                  <h4 className="font-bold text-blue-500 mb-2">DEX 보정 규칙</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm">
                      <thead>
                        <tr className="bg-bg-tertiary">
                          <th className="p-2 border border-border text-left">공격자 타입</th>
                          <th className="p-2 border border-border text-left">방어자 타입</th>
                          <th className="p-2 border border-border">DEX 보정</th>
                          <th className="p-2 border border-border">설명</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border border-border">적</td>
                          <td className="p-2 border border-border">펫</td>
                          <td className="p-2 text-center border border-border font-bold text-yellow-500">
                            공격자 DEX × 0.8
                          </td>
                          <td className="p-2 border border-border text-xs">
                            적이 펫 공격 시 명중 감소
                          </td>
                        </tr>
                        <tr className="bg-bg-tertiary">
                          <td className="p-2 border border-border">플레이어/펫</td>
                          <td className="p-2 border border-border">펫</td>
                          <td className="p-2 text-center border border-border font-bold text-yellow-500">
                            방어자 DEX × 0.8
                          </td>
                          <td className="p-2 border border-border text-xs">펫의 회피력 감소</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-border">비플레이어</td>
                          <td className="p-2 border border-border">플레이어</td>
                          <td className="p-2 text-center border border-border font-bold text-green-500">
                            공격자 DEX × 0.6
                          </td>
                          <td className="p-2 border border-border text-xs">
                            플레이어 유리 (적 명중 크게 감소)
                          </td>
                        </tr>
                        <tr className="bg-bg-tertiary">
                          <td className="p-2 border border-border">플레이어</td>
                          <td className="p-2 border border-border">비플레이어</td>
                          <td className="p-2 text-center border border-border font-bold text-red-500">
                            방어자 DEX × 0.6
                          </td>
                          <td className="p-2 border border-border text-xs">적 회피력 크게 감소</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 최대 회피율 */}
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <strong>⚠️ 최대 회피율:</strong> 75% (아무리 DEX가 높아도 75%를 초과할 수 없음)
                </div>
              </div>

              {/* 회피 계산 예시 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">7.2 회피 계산 예시</h3>

                <div className="space-y-3">
                  {/* 예시 1 */}
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-green-500 mb-2">
                      예시 1: DEX 우위 (회피 성공 가능성 높음)
                    </h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>공격자 DEX: 150, 방어자 DEX: 250, 방어자 LUCK: 20</p>
                      <p className="font-mono text-xs mt-2">
                        1. 큰DEX = 250, 작은DEX = 150, 비율 = 1.0 (방어자 DEX가 더 큼)
                      </p>
                      <p className="font-mono text-xs">2. √((250 - 150) ÷ 0.02) = √5000 ≈ 70.7</p>
                      <p className="font-mono text-xs">
                        3. 70.7 × 1.0 + 20 = 90.7 →{' '}
                        <span className="text-yellow-500">75%로 제한</span>
                      </p>
                      <p className="text-accent font-bold mt-2">최종 회피율: 75%</p>
                    </div>
                  </div>

                  {/* 예시 2 */}
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-yellow-500 mb-2">
                      예시 2: DEX 열세 (회피 어려움)
                    </h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>공격자 DEX: 250, 방어자 DEX: 150, 방어자 LUCK: 10</p>
                      <p className="font-mono text-xs mt-2">
                        1. 큰DEX = 250, 작은DEX = 150, 비율 = 150 ÷ 250 = 0.6
                      </p>
                      <p className="font-mono text-xs">2. √((250 - 150) ÷ 0.02) = √5000 ≈ 70.7</p>
                      <p className="font-mono text-xs">3. 70.7 × 0.6 + 10 = 52.4%</p>
                      <p className="text-accent font-bold mt-2">최종 회피율: 52.4%</p>
                    </div>
                  </div>

                  {/* 예시 3 */}
                  <div className="p-3 bg-bg-tertiary rounded border border-border">
                    <h4 className="font-bold text-red-500 mb-2">
                      예시 3: DEX 차이 적음 (낮은 회피율)
                    </h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>공격자 DEX: 180, 방어자 DEX: 200, 방어자 LUCK: 5</p>
                      <p className="font-mono text-xs mt-2">
                        1. 큰DEX = 200, 작은DEX = 180, 비율 = 1.0
                      </p>
                      <p className="font-mono text-xs">2. √((200 - 180) ÷ 0.02) = √1000 ≈ 31.6</p>
                      <p className="font-mono text-xs">3. 31.6 × 1.0 + 5 = 36.6%</p>
                      <p className="text-accent font-bold mt-2">최종 회피율: 36.6%</p>
                    </div>
                  </div>

                  {/* 예시 4 - 원거리 무기 */}
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                    <h4 className="font-bold text-purple-500 mb-2">
                      예시 4: 원거리 무기(활/석궁) 공격받을 때 🏹
                    </h4>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>공격자 DEX: 180, 방어자 DEX: 200, 방어자 LUCK: 5</p>
                      <p className="font-mono text-xs mt-2">
                        1. 기본 회피율: 36.6% (예시 3과 동일)
                      </p>
                      <p className="font-mono text-xs">
                        2. 원거리 무기 보너스: 36.6% + 20% = 56.6%
                      </p>
                      <p className="text-purple-400 font-bold mt-2">
                        ✨ 최종 회피율: 56.6% (근접 대비 +20%)
                      </p>
                      <p className="text-xs text-yellow-400 mt-2">
                        💡 원거리 무기는 회피하기 쉽습니다!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 회피 전략 */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-accent">7.3 회피율 올리는 방법</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                    <h4 className="font-bold text-green-500 mb-2">✅ 회피율 증가 요소</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>• DEX 스탯 극대화 (가장 중요!)</p>
                      <p>• LUCK 스탯 투자 (플레이어 전용)</p>
                      <p>• 주술 커맨드 사용 (K값 0.02 → 0.027)</p>
                      <p>
                        •{' '}
                        <span className="text-yellow-400 font-bold">
                          원거리 무기(활/석궁)로 공격받을 때 자동 +20% 보너스
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <h4 className="font-bold text-red-500 mb-2">❌ 회피 불가능 상황</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p>• 방어(Guard) 커맨드 사용 중</p>
                      <p>• 기절, 수면 등 행동 불가 상태</p>
                      <p>• 특정 스킬/상태이상에 걸린 경우</p>
                      <p>• 콤보 공격의 2타 이상</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. 방어 시스템 */}
            <div
              id="guard"
              className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-text-primary flex items-center gap-2">
                <span>🛡️</span> 8. 방어(Guard) 커맨드
              </h2>

              {/* 방어 메커니즘 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">
                  8.1 방어 데미지 감소 메커니즘
                </h3>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded mb-4">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-blue-500">방어 커맨드</strong>를 사용하면 받는 데미지가{' '}
                    <strong>확률적으로 크게 감소</strong>합니다.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary">
                        <th className="p-2 border border-border">확률</th>
                        <th className="p-2 border border-border">데미지 감소율</th>
                        <th className="p-2 border border-border">실제 받는 데미지</th>
                        <th className="p-2 border border-border">등급</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-green-500/10">
                        <td className="p-2 text-center border border-border font-bold">25%</td>
                        <td className="p-2 text-center border border-border font-bold text-green-500">
                          100% 감소
                        </td>
                        <td className="p-2 text-center border border-border font-bold text-accent">
                          1 데미지
                        </td>
                        <td className="p-2 text-center border border-border text-green-500">
                          완전 방어
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 text-center border border-border font-bold">25%</td>
                        <td className="p-2 text-center border border-border font-bold text-green-500">
                          90% 감소
                        </td>
                        <td className="p-2 text-center border border-border">10%</td>
                        <td className="p-2 text-center border border-border text-green-500">
                          슈퍼 방어
                        </td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 text-center border border-border font-bold">20%</td>
                        <td className="p-2 text-center border border-border font-bold text-blue-500">
                          80% 감소
                        </td>
                        <td className="p-2 text-center border border-border">20%</td>
                        <td className="p-2 text-center border border-border text-blue-500">
                          강력 방어
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 text-center border border-border font-bold">15%</td>
                        <td className="p-2 text-center border border-border font-bold text-blue-500">
                          70% 감소
                        </td>
                        <td className="p-2 text-center border border-border">30%</td>
                        <td className="p-2 text-center border border-border text-blue-500">
                          좋은 방어
                        </td>
                      </tr>
                      <tr className="bg-bg-tertiary">
                        <td className="p-2 text-center border border-border font-bold">10%</td>
                        <td className="p-2 text-center border border-border font-bold text-yellow-500">
                          60% 감소
                        </td>
                        <td className="p-2 text-center border border-border">40%</td>
                        <td className="p-2 text-center border border-border text-yellow-500">
                          보통 방어
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 text-center border border-border font-bold">5%</td>
                        <td className="p-2 text-center border border-border font-bold text-red-500">
                          50% 감소
                        </td>
                        <td className="p-2 text-center border border-border">50%</td>
                        <td className="p-2 text-center border border-border text-red-500">
                          약한 방어
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                  <strong>💡 핵심:</strong> 방어 커맨드 사용 시{' '}
                  <strong>50%는 90% 이상 데미지 감소!</strong> (25% 완전방어 + 25% 슈퍼방어) 단,
                  최소 데미지는 1
                </div>
              </div>

              {/* 방어 계산 예시 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-accent">8.2 방어 데미지 계산 예시</h3>

                <div className="p-4 bg-bg-tertiary rounded border border-border">
                  <h4 className="font-bold text-blue-500 mb-3">원래 받을 데미지: 1000</h4>

                  <div className="space-y-2 text-sm text-text-secondary">
                    <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                      <span>25% 확률 (완전 방어):</span>
                      <span className="font-bold text-accent">1 데미지</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                      <span>25% 확률 (90% 감소):</span>
                      <span className="font-bold text-green-500">100 데미지</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-bg-secondary rounded">
                      <span>20% 확률 (80% 감소):</span>
                      <span className="font-bold text-blue-500">200 데미지</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-bg-secondary rounded">
                      <span>15% 확률 (70% 감소):</span>
                      <span className="font-bold text-blue-500">300 데미지</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-bg-secondary rounded">
                      <span>10% 확률 (60% 감소):</span>
                      <span className="font-bold text-yellow-500">400 데미지</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-500/10 rounded">
                      <span>5% 확률 (50% 감소):</span>
                      <span className="font-bold text-red-500">500 데미지</span>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm">
                    <strong>평균 받는 데미지:</strong> 약 175 데미지 (원래의 17.5%)
                  </div>
                </div>
              </div>

              {/* 방어 vs 회피 */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-accent">8.3 방어 vs 회피 비교</h3>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <h4 className="font-bold text-blue-500 mb-2">🛡️ 방어(Guard) 커맨드</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p className="text-green-500">✅ 확정적으로 데미지 감소</p>
                      <p className="text-green-500">✅ 50% 확률로 70% 이상 감소</p>
                      <p className="text-green-500">✅ 능력치 무관하게 작동</p>
                      <p className="text-red-500">❌ 회피 불가능</p>
                      <p className="text-red-500">❌ 공격 불가능 (방어만 가능)</p>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <h4 className="font-bold text-yellow-500 mb-2">💨 회피(Dodge)</h4>
                    <div className="text-sm space-y-1 text-text-secondary">
                      <p className="text-green-500">✅ 성공 시 데미지 0</p>
                      <p className="text-green-500">✅ 공격 커맨드 중에도 발동</p>
                      <p className="text-green-500">✅ DEX/LUCK으로 확률 조절</p>
                      <p className="text-red-500">❌ 확률 의존적 (최대 75%)</p>
                      <p className="text-red-500">❌ DEX 차이 필요</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded text-sm">
                  <strong>🎯 전략 추천:</strong>
                  <p className="mt-1 text-text-secondary">
                    • 위기 상황 (HP 낮음): <strong className="text-blue-500">방어 커맨드</strong>{' '}
                    사용 (확정 데미지 감소)
                  </p>
                  <p className="text-text-secondary">
                    • 공격형 플레이: <strong className="text-yellow-500">DEX 투자</strong>로 자연
                    회피 노리기
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 계산기 탭 */}
        {activeTab === 'calculator' && (
          <div className="space-y-4">
            {/* 서브탭 네비게이션 */}
            <div className="flex gap-2 justify-center mb-4">
              <button
                onClick={() => setCalculatorSubTab('damage')}
                className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                  calculatorSubTab === 'damage'
                    ? 'bg-accent text-white font-bold shadow-lg'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary border border-border'
                }`}
              >
                📊 데미지 계산
              </button>
              <button
                onClick={() => setCalculatorSubTab('reverse')}
                className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                  calculatorSubTab === 'reverse'
                    ? 'bg-accent text-white font-bold shadow-lg'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary border border-border'
                }`}
              >
                🔍 속성 및 방어 파악
              </button>
            </div>

            {/* 데미지 계산 서브탭 */}
            {calculatorSubTab === 'damage' && (
              <>
                {/* 공격자 입력 */}
                <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg">
                  <h2 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
                    <span>🗡️</span> 공격
                  </h2>

                  {/* 기본 스탯 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        레벨 (LV)
                      </label>
                      <input
                        type="number"
                        value={attacker.lv}
                        onChange={e => setAttacker({ ...attacker, lv: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        내구력 (HP)
                      </label>
                      <input
                        type="number"
                        value={attacker.hp}
                        onChange={e => setAttacker({ ...attacker, hp: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        공격력 (STR)
                      </label>
                      <input
                        type="number"
                        value={attacker.str}
                        onChange={e => setAttacker({ ...attacker, str: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        방어력 (TGH)
                      </label>
                      <input
                        type="number"
                        value={attacker.tgh}
                        onChange={e => setAttacker({ ...attacker, tgh: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        순발력 (DEX)
                      </label>
                      <input
                        type="number"
                        value={attacker.dex}
                        onChange={e => setAttacker({ ...attacker, dex: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                  </div>

                  {/* 속성 선택 */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-text-secondary">
                      속성 ({getAttributeTotal(attacker)}/10)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-green-500">지</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={attacker.earth}
                          onChange={e =>
                            handleAttributeChange(
                              attacker,
                              setAttacker,
                              'earth',
                              Number(e.target.value)
                            )
                          }
                          disabled={attacker.fire > 0}
                          className="w-full px-3 py-2 bg-green-500 border border-green-500 rounded text-white font-bold disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-blue-500">수</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={attacker.water}
                          onChange={e =>
                            handleAttributeChange(
                              attacker,
                              setAttacker,
                              'water',
                              Number(e.target.value)
                            )
                          }
                          disabled={attacker.wind > 0}
                          className="w-full px-3 py-2 bg-blue-500 border border-blue-500 rounded text-white font-bold disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-red-500">화</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={attacker.fire}
                          onChange={e =>
                            handleAttributeChange(
                              attacker,
                              setAttacker,
                              'fire',
                              Number(e.target.value)
                            )
                          }
                          disabled={attacker.earth > 0}
                          className="w-full px-3 py-2 bg-red-500 border border-red-500 rounded text-white font-bold disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-yellow-500">풍</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={attacker.wind}
                          onChange={e =>
                            handleAttributeChange(
                              attacker,
                              setAttacker,
                              'wind',
                              Number(e.target.value)
                            )
                          }
                          disabled={attacker.water > 0}
                          className="w-full px-3 py-2 bg-yellow-500 border border-yellow-500 rounded text-white font-bold disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 페트 탑승 */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-text-secondary">
                        🐾 페트 탑승 (스탯 70% + 페트 30%)
                      </label>
                      {attackerPet && (
                        <button
                          onClick={() => setAttackerPet(null)}
                          className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                        >
                          해제
                        </button>
                      )}
                    </div>
                    {!attackerPet ? (
                      <button
                        onClick={() => setAttackerPet({ str: 0, tgh: 0, dex: 0, hp: 0 })}
                        className="w-full px-3 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors text-sm"
                      >
                        + 페트 탑승 스탯 추가
                      </button>
                    ) : (
                      <div className="mt-3 p-3 bg-bg-tertiary rounded border border-border">
                        <p className="font-bold text-purple-400 mb-3 text-sm">페트 스탯 입력:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              공격력 (STR)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={attackerPet.str}
                              onChange={e =>
                                setAttackerPet({ ...attackerPet, str: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1 bg-bg-primary border border-border rounded text-text-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              방어력 (TGH)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={attackerPet.tgh}
                              onChange={e =>
                                setAttackerPet({ ...attackerPet, tgh: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1 bg-bg-primary border border-border rounded text-text-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              순발력 (DEX)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={attackerPet.dex}
                              onChange={e =>
                                setAttackerPet({ ...attackerPet, dex: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1 bg-bg-primary border border-border rounded text-text-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              내구력 (HP)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={attackerPet.hp}
                              onChange={e =>
                                setAttackerPet({ ...attackerPet, hp: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1 bg-bg-primary border border-border rounded text-text-primary text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 방어자 입력 */}
                <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg">
                  <h2 className="text-xl font-bold mb-4 text-blue-500 flex items-center gap-2">
                    <span>🛡️</span> 방어
                  </h2>

                  {/* 기본 스탯 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        레벨 (LV)
                      </label>
                      <input
                        type="number"
                        value={defender.lv}
                        onChange={e => setDefender({ ...defender, lv: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        내구력 (HP)
                      </label>
                      <input
                        type="number"
                        value={defender.hp}
                        onChange={e => setDefender({ ...defender, hp: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        공격력 (STR)
                      </label>
                      <input
                        type="number"
                        value={defender.str}
                        onChange={e => setDefender({ ...defender, str: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        방어력 (TGH)
                      </label>
                      <input
                        type="number"
                        value={defender.tgh}
                        onChange={e => setDefender({ ...defender, tgh: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        순발력 (DEX)
                      </label>
                      <input
                        type="number"
                        value={defender.dex}
                        onChange={e => setDefender({ ...defender, dex: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                      />
                    </div>
                  </div>

                  {/* 속성 선택 */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-text-secondary">
                      속성 ({getAttributeTotal(defender)}/10)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-green-500">지</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={defender.earth}
                          onChange={e =>
                            handleAttributeChange(
                              defender,
                              setDefender,
                              'earth',
                              Number(e.target.value)
                            )
                          }
                          disabled={defender.fire > 0}
                          className="w-full px-3 py-2 bg-green-500 border border-green-500 rounded text-white font-bold disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-blue-500">수</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={defender.water}
                          onChange={e =>
                            handleAttributeChange(
                              defender,
                              setDefender,
                              'water',
                              Number(e.target.value)
                            )
                          }
                          disabled={defender.wind > 0}
                          className="w-full px-3 py-2 bg-blue-500 border border-blue-500 rounded text-white font-bold disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-red-500">화</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={defender.fire}
                          onChange={e =>
                            handleAttributeChange(
                              defender,
                              setDefender,
                              'fire',
                              Number(e.target.value)
                            )
                          }
                          disabled={defender.earth > 0}
                          className="w-full px-3 py-2 bg-red-500 border border-red-500 rounded text-white font-bold disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 text-yellow-500">풍</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={defender.wind}
                          onChange={e =>
                            handleAttributeChange(
                              defender,
                              setDefender,
                              'wind',
                              Number(e.target.value)
                            )
                          }
                          disabled={defender.water > 0}
                          className="w-full px-3 py-2 bg-yellow-500 border border-yellow-500 rounded text-white font-bold disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 페트 탑승 */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-text-secondary">
                        🐾 페트 탑승 (스탯 70% + 페트 30%)
                      </label>
                      {defenderPet && (
                        <button
                          onClick={() => setDefenderPet(null)}
                          className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                        >
                          해제
                        </button>
                      )}
                    </div>
                    {!defenderPet ? (
                      <button
                        onClick={() => setDefenderPet({ str: 0, tgh: 0, dex: 0, hp: 0 })}
                        className="w-full px-3 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors text-sm"
                      >
                        + 페트 탑승 스탯 추가
                      </button>
                    ) : (
                      <div className="mt-3 p-3 bg-bg-tertiary rounded border border-border">
                        <p className="font-bold text-purple-400 mb-3 text-sm">페트 스탯 입력:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              공격력 (STR)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={defenderPet.str}
                              onChange={e =>
                                setDefenderPet({ ...defenderPet, str: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1 bg-bg-primary border border-border rounded text-text-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              방어력 (TGH)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={defenderPet.tgh}
                              onChange={e =>
                                setDefenderPet({ ...defenderPet, tgh: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1 bg-bg-primary border border-border rounded text-text-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              순발력 (DEX)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={defenderPet.dex}
                              onChange={e =>
                                setDefenderPet({ ...defenderPet, dex: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1 bg-bg-primary border border-border rounded text-text-primary text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              내구력 (HP)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={defenderPet.hp}
                              onChange={e =>
                                setDefenderPet({ ...defenderPet, hp: Number(e.target.value) })
                              }
                              className="w-full px-2 py-1 bg-bg-primary border border-border rounded text-text-primary text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 결과 표시 */}
                <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg">
                  <h2 className="text-xl font-bold mb-4 text-accent flex items-center gap-2">
                    <span>📊</span> 예상 데미지
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 근접 무기 */}
                    {(() => {
                      const result = calculateDamage('melee');
                      return (
                        <div className="bg-bg-tertiary rounded-lg p-4 border border-border">
                          <h3 className="font-bold text-lg mb-3 text-green-500">🗡️ 근접 무기</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-text-secondary">속성 보정:</span>
                              <span className="font-bold text-accent">
                                ×{result.attrBonus.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">크리티컬 확률:</span>
                              <span className="font-bold text-yellow-500">
                                {(result.critRate / 100).toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">회피율:</span>
                              <span className="font-bold text-cyan-500">
                                {result.dodgeRate.toFixed(2)}%
                              </span>
                            </div>
                            <hr className="border-border" />
                            <div>
                              <div className="text-text-secondary mb-1">일반 데미지:</div>
                              <div className="text-accent font-bold text-lg">
                                {result.normal.min} ~ {result.normal.max}
                              </div>
                              <div className="text-xs text-text-secondary">
                                평균: {result.normal.avg}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary mb-1">크리티컬 데미지:</div>
                              <div className="text-yellow-500 font-bold text-lg">
                                {result.critical.min} ~ {result.critical.max}
                              </div>
                              <div className="text-xs text-text-secondary">
                                평균: {result.critical.avg}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 원거리 무기 */}
                    {(() => {
                      const result = calculateDamage('ranged');
                      return (
                        <div className="bg-bg-tertiary rounded-lg p-4 border border-border">
                          <h3 className="font-bold text-lg mb-3 text-blue-500">🏹 원거리 무기</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-text-secondary">속성 보정:</span>
                              <span className="font-bold text-accent">
                                ×{result.attrBonus.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">크리티컬 확률:</span>
                              <span className="font-bold text-yellow-500">
                                {(result.critRate / 100).toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">회피율:</span>
                              <span className="font-bold text-green-500">
                                {result.dodgeRate.toFixed(2)}%
                                <span className="text-xs text-purple-400 ml-1">(+20% 보너스)</span>
                              </span>
                            </div>
                            <hr className="border-border" />
                            <div>
                              <div className="text-text-secondary mb-1">일반 데미지:</div>
                              <div className="text-accent font-bold text-lg">
                                {result.normal.min} ~ {result.normal.max}
                              </div>
                              <div className="text-xs text-text-secondary">
                                평균: {result.normal.avg}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary mb-1">크리티컬 데미지:</div>
                              <div className="text-yellow-500 font-bold text-lg">
                                {result.critical.min} ~ {result.critical.max}
                              </div>
                              <div className="text-xs text-text-secondary">
                                평균: {result.critical.avg}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}

            {/* 속성 파악 서브탭 (역계산) */}
            {calculatorSubTab === 'reverse' && (
              <div className="space-y-4">
                {/* 설명 */}
                <div className="bg-bg-secondary rounded-lg p-4 border border-border">
                  <h2 className="text-xl font-bold mb-2 text-purple-500 flex items-center gap-2">
                    <span>🔍</span> 역계산: 속성/방어력 추정
                  </h2>
                  <p className="text-sm text-text-secondary">
                    내 공격력, 속성과 실제로 받은 데미지를 입력하면, 상대방의 대략적인 속성이나
                    방어력을 추정할 수 있습니다.
                  </p>
                </div>

                {/* 내 정보 (공격자) */}
                <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-red-500 flex items-center gap-2">
                    <span>⚔️</span> 내 정보 (공격자)
                  </h3>

                  <div className="space-y-4">
                    {/* 내 공격력 */}
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        내 공격력 (STR)
                      </label>
                      <input
                        type="number"
                        value={reverseCalc.myAttack}
                        onChange={e =>
                          setReverseCalc({ ...reverseCalc, myAttack: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                        placeholder="예: 1500"
                      />
                    </div>

                    {/* 내 속성 입력 */}
                    <div>
                      <label className="block text-sm font-bold mb-2 text-text-secondary">
                        내 속성 (
                        {reverseCalc.myEarth +
                          reverseCalc.myWater +
                          reverseCalc.myFire +
                          reverseCalc.myWind}
                        /10)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1 text-green-500">지</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={reverseCalc.myEarth}
                            onChange={e => {
                              const val = Math.max(0, Math.min(10, Number(e.target.value)));
                              const total =
                                val + reverseCalc.myWater + reverseCalc.myFire + reverseCalc.myWind;
                              if (total <= 10) {
                                setReverseCalc({ ...reverseCalc, myEarth: val, myFire: 0 });
                              }
                            }}
                            className="w-full px-3 py-2 bg-green-500 border border-green-500 rounded text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 text-blue-500">수</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={reverseCalc.myWater}
                            onChange={e => {
                              const val = Math.max(0, Math.min(10, Number(e.target.value)));
                              const total =
                                reverseCalc.myEarth + val + reverseCalc.myFire + reverseCalc.myWind;
                              if (total <= 10) {
                                setReverseCalc({ ...reverseCalc, myWater: val, myWind: 0 });
                              }
                            }}
                            className="w-full px-3 py-2 bg-blue-500 border border-blue-500 rounded text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 text-red-500">화</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={reverseCalc.myFire}
                            onChange={e => {
                              const val = Math.max(0, Math.min(10, Number(e.target.value)));
                              const total =
                                reverseCalc.myEarth +
                                reverseCalc.myWater +
                                val +
                                reverseCalc.myWind;
                              if (total <= 10) {
                                setReverseCalc({ ...reverseCalc, myFire: val, myEarth: 0 });
                              }
                            }}
                            className="w-full px-3 py-2 bg-red-500 border border-red-500 rounded text-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 text-yellow-500">풍</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={reverseCalc.myWind}
                            onChange={e => {
                              const val = Math.max(0, Math.min(10, Number(e.target.value)));
                              const total =
                                reverseCalc.myEarth +
                                reverseCalc.myWater +
                                reverseCalc.myFire +
                                val;
                              if (total <= 10) {
                                setReverseCalc({ ...reverseCalc, myWind: val, myWater: 0 });
                              }
                            }}
                            className="w-full px-3 py-2 bg-yellow-500 border border-yellow-500 rounded text-white font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상대 정보 (방어자) */}
                <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-blue-500 flex items-center gap-2">
                    <span>🛡️</span> 상대 정보 (방어자)
                  </h3>

                  <div className="space-y-4">
                    {/* 실제 받은 데미지 */}
                    <div>
                      <label className="block text-sm font-bold mb-1 text-text-secondary">
                        실제 받은 데미지
                      </label>
                      <input
                        type="number"
                        value={reverseCalc.receivedDamage}
                        onChange={e =>
                          setReverseCalc({
                            ...reverseCalc,
                            receivedDamage: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                        placeholder="예: 800"
                      />
                    </div>

                    {/* 상대 페트 탑승 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-bold text-purple-400">
                          🐾 상대 페트 탑승 (선택)
                        </label>
                        {reverseOpponentPet && (
                          <button
                            onClick={() => setReverseOpponentPet(null)}
                            className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"
                          >
                            해제
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1 text-text-secondary">
                            페트 선택
                          </label>
                          <select
                            value={reverseOpponentPet?.petId || ''}
                            onChange={e => {
                              if (e.target.value) {
                                setReverseOpponentPet({
                                  petId: e.target.value,
                                  lv: reverseOpponentPet?.lv || 140,
                                });
                              } else {
                                setReverseOpponentPet(null);
                              }
                            }}
                            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                          >
                            <option value="">탑승 안함</option>
                            {rideablePets.map(pet => (
                              <option key={pet.id} value={pet.id}>
                                {pet.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {reverseOpponentPet && (
                          <div>
                            <label className="block text-xs font-bold mb-1 text-text-secondary">
                              페트 레벨
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="140"
                              value={reverseOpponentPet.lv}
                              onChange={e =>
                                setReverseOpponentPet({
                                  ...reverseOpponentPet,
                                  lv: Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary"
                            />
                          </div>
                        )}
                      </div>
                      {reverseOpponentPet &&
                        (() => {
                          const petStats = calculatePetStatsFromData(
                            reverseOpponentPet.petId,
                            reverseOpponentPet.lv
                          );
                          if (!petStats) return null;
                          return (
                            <div className="mt-3 p-3 bg-bg-tertiary rounded border border-border">
                              <div className="text-xs text-text-secondary space-y-1">
                                <p className="font-bold text-purple-400 mb-2">페트 스탯:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <p>공격력: {petStats.str}</p>
                                  <p>방어력: {petStats.tgh}</p>
                                  <p>순발력: {petStats.dex}</p>
                                  <p>내구력: {petStats.hp}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                </div>

                {/* 결과 섹션 */}
                {(reverseCalc.myAttack > 0 || reverseCalc.receivedDamage > 0) && (
                  <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg">
                    <h3 className="text-lg font-bold mb-4 text-accent">📊 추정 결과</h3>

                    {(() => {
                      const atk = reverseCalc.myAttack;
                      const dmg = reverseCalc.receivedDamage;

                      // 상대 페트 정보 가져오기
                      let opponentPetTgh = 0;
                      if (reverseOpponentPet) {
                        const petStats = calculatePetStatsFromData(
                          reverseOpponentPet.petId,
                          reverseOpponentPet.lv
                        );
                        if (petStats) {
                          opponentPetTgh = petStats.tgh;
                        }
                      }

                      // 내 속성 계산
                      const myFire = reverseCalc.myFire * 10;
                      const myWater = reverseCalc.myWater * 10;
                      const myEarth = reverseCalc.myEarth * 10;
                      const myWind = reverseCalc.myWind * 10;
                      const myNone = 100 - (myFire + myWater + myEarth + myWind);

                      // 속성 보정 계산 함수
                      const calcAttrBonus = (
                        enEarth: number,
                        enWater: number,
                        enFire: number,
                        enWind: number
                      ) => {
                        const enEarthPercent = enEarth * 10;
                        const enWaterPercent = enWater * 10;
                        const enFirePercent = enFire * 10;
                        const enWindPercent = enWind * 10;
                        const enNone =
                          100 - (enEarthPercent + enWaterPercent + enFirePercent + enWindPercent);

                        const fireDmg =
                          myFire * enNone * 1.5 +
                          myFire * enFirePercent * 1.0 +
                          myFire * enWaterPercent * 0.6 +
                          myFire * enEarthPercent * 1.0 +
                          myFire * enWindPercent * 1.5;

                        const waterDmg =
                          myWater * enNone * 1.5 +
                          myWater * enFirePercent * 1.5 +
                          myWater * enWaterPercent * 1.0 +
                          myWater * enEarthPercent * 0.6 +
                          myWater * enWindPercent * 1.0;

                        const earthDmg =
                          myEarth * enNone * 1.5 +
                          myEarth * enFirePercent * 0.6 +
                          myEarth * enWaterPercent * 1.5 +
                          myEarth * enEarthPercent * 1.0 +
                          myEarth * enWindPercent * 1.0;

                        const windDmg =
                          myWind * enNone * 1.5 +
                          myWind * enFirePercent * 1.0 +
                          myWind * enWaterPercent * 1.0 +
                          myWind * enEarthPercent * 1.5 +
                          myWind * enWindPercent * 1.0;

                        const noneDmg =
                          myNone * enNone * 1.0 +
                          myNone * enFirePercent * 0.6 +
                          myNone * enWaterPercent * 0.6 +
                          myNone * enEarthPercent * 0.6 +
                          myNone * enWindPercent * 0.6;

                        const total = fireDmg + waterDmg + earthDmg + windDmg + noneDmg;
                        return total * 0.0001;
                      };

                      // 2가지 케이스: 상성 유리 vs 상성 불리
                      const results = [];

                      // 케이스 1: 내가 상대를 잡아먹는 경우 (속성 보정 최대)
                      // 지 → 수 잡음, 수 → 화 잡음, 화 → 풍 잡음, 풍 → 지 잡음
                      let advantageAttr = '';
                      let advantageValues = { earth: 0, water: 0, fire: 0, wind: 0 };

                      if (
                        myEarth >= myWater &&
                        myEarth >= myFire &&
                        myEarth >= myWind &&
                        myEarth > 0
                      ) {
                        // 지가 제일 많으면 → 수 속성을 잡아먹음
                        advantageAttr = '수10';
                        advantageValues = { earth: 0, water: 10, fire: 0, wind: 0 };
                      } else if (
                        myWater >= myEarth &&
                        myWater >= myFire &&
                        myWater >= myWind &&
                        myWater > 0
                      ) {
                        // 수가 제일 많으면 → 화 속성을 잡아먹음
                        advantageAttr = '화10';
                        advantageValues = { earth: 0, water: 0, fire: 10, wind: 0 };
                      } else if (
                        myFire >= myEarth &&
                        myFire >= myWater &&
                        myFire >= myWind &&
                        myFire > 0
                      ) {
                        // 화가 제일 많으면 → 풍 속성을 잡아먹음
                        advantageAttr = '풍10';
                        advantageValues = { earth: 0, water: 0, fire: 0, wind: 10 };
                      } else if (
                        myWind >= myEarth &&
                        myWind >= myWater &&
                        myWind >= myFire &&
                        myWind > 0
                      ) {
                        // 풍이 제일 많으면 → 지 속성을 잡아먹음
                        advantageAttr = '지10';
                        advantageValues = { earth: 10, water: 0, fire: 0, wind: 0 };
                      } else {
                        // 무속성이면 → 아무 속성
                        advantageAttr = '화10';
                        advantageValues = { earth: 0, water: 0, fire: 10, wind: 0 };
                      }

                      const advantageBonus = calcAttrBonus(
                        advantageValues.earth,
                        advantageValues.water,
                        advantageValues.fire,
                        advantageValues.wind
                      );
                      const advantageDef = atk - dmg / (2.0 * advantageBonus);

                      if (advantageDef >= 0) {
                        // advantageDef는 최종 방어력 (탑승 적용된 값)
                        // 페트가 있으면: finalTgh = charTgh * 0.7 + petTgh * 0.3
                        // 역으로 계산: charTgh = (finalTgh - petTgh * 0.3) / 0.7
                        let charDefense;
                        if (opponentPetTgh > 0) {
                          // 페트 탑승 시: 캐릭터 실제 방어력 계산
                          charDefense = Math.round(
                            (advantageDef / 0.7 - opponentPetTgh * 0.3) / 0.7
                          );
                        } else {
                          // 페트 없으면 기존 방식
                          charDefense = Math.round(advantageDef / 0.7);
                        }

                        results.push({
                          case: '상성 유리 (내가 상대 속성을 잡는 경우)',
                          defense: charDefense,
                          enemyAttr: advantageAttr,
                          attrBonus: advantageBonus,
                        });
                      }

                      // 케이스 2: 상대가 나를 잡아먹는 경우 (속성 보정 최소)
                      // 지 ← 풍에 약함, 수 ← 지에 약함, 화 ← 수에 약함, 풍 ← 화에 약함
                      let disadvantageAttr = '';
                      let disadvantageValues = { earth: 0, water: 0, fire: 0, wind: 0 };

                      if (
                        myEarth >= myWater &&
                        myEarth >= myFire &&
                        myEarth >= myWind &&
                        myEarth > 0
                      ) {
                        // 지가 제일 많으면 → 풍 속성에 약함
                        disadvantageAttr = '풍10';
                        disadvantageValues = { earth: 0, water: 0, fire: 0, wind: 10 };
                      } else if (
                        myWater >= myEarth &&
                        myWater >= myFire &&
                        myWater >= myWind &&
                        myWater > 0
                      ) {
                        // 수가 제일 많으면 → 지 속성에 약함
                        disadvantageAttr = '지10';
                        disadvantageValues = { earth: 10, water: 0, fire: 0, wind: 0 };
                      } else if (
                        myFire >= myEarth &&
                        myFire >= myWater &&
                        myFire >= myWind &&
                        myFire > 0
                      ) {
                        // 화가 제일 많으면 → 수 속성에 약함
                        disadvantageAttr = '수10';
                        disadvantageValues = { earth: 0, water: 10, fire: 0, wind: 0 };
                      } else if (
                        myWind >= myEarth &&
                        myWind >= myWater &&
                        myWind >= myFire &&
                        myWind > 0
                      ) {
                        // 풍이 제일 많으면 → 화 속성에 약함
                        disadvantageAttr = '화10';
                        disadvantageValues = { earth: 0, water: 0, fire: 10, wind: 0 };
                      } else {
                        // 무속성이면 → 아무 속성
                        disadvantageAttr = '화10';
                        disadvantageValues = { earth: 0, water: 0, fire: 10, wind: 0 };
                      }

                      const disadvantageBonus = calcAttrBonus(
                        disadvantageValues.earth,
                        disadvantageValues.water,
                        disadvantageValues.fire,
                        disadvantageValues.wind
                      );
                      const disadvantageDef = atk - dmg / (2.0 * disadvantageBonus);

                      if (disadvantageDef >= 0) {
                        let charDefense;
                        if (opponentPetTgh > 0) {
                          charDefense = Math.round(
                            (disadvantageDef / 0.7 - opponentPetTgh * 0.3) / 0.7
                          );
                        } else {
                          charDefense = Math.round(disadvantageDef / 0.7);
                        }

                        results.push({
                          case: '상성 불리 (상대가 내 속성을 잡는 경우)',
                          defense: charDefense,
                          enemyAttr: disadvantageAttr,
                          attrBonus: disadvantageBonus,
                        });
                      }

                      // 케이스 3: 속성이 같은 경우 (속성 보정 1.0배)
                      // 내 속성과 완전히 동일한 상대
                      const neutralValues = {
                        earth: reverseCalc.myEarth,
                        water: reverseCalc.myWater,
                        fire: reverseCalc.myFire,
                        wind: reverseCalc.myWind,
                      };

                      const neutralAttrs = [];
                      if (neutralValues.earth > 0) neutralAttrs.push(`지${neutralValues.earth}`);
                      if (neutralValues.water > 0) neutralAttrs.push(`수${neutralValues.water}`);
                      if (neutralValues.fire > 0) neutralAttrs.push(`화${neutralValues.fire}`);
                      if (neutralValues.wind > 0) neutralAttrs.push(`풍${neutralValues.wind}`);
                      const neutralAttr =
                        neutralAttrs.length > 0 ? neutralAttrs.join('') : '무속성';

                      const neutralBonus = calcAttrBonus(
                        neutralValues.earth,
                        neutralValues.water,
                        neutralValues.fire,
                        neutralValues.wind
                      );
                      const neutralDef = atk - dmg / (2.0 * neutralBonus);

                      if (neutralDef >= 0) {
                        let charDefense;
                        if (opponentPetTgh > 0) {
                          charDefense = Math.round((neutralDef / 0.7 - opponentPetTgh * 0.3) / 0.7);
                        } else {
                          charDefense = Math.round(neutralDef / 0.7);
                        }

                        results.push({
                          case: '상성 없음 (속성이 같은 경우)',
                          defense: charDefense,
                          enemyAttr: neutralAttr,
                          attrBonus: neutralBonus,
                        });
                      }

                      return (
                        <div className="space-y-4">
                          {results.length > 0 ? (
                            results.map((result, idx) => (
                              <div
                                key={idx}
                                className={`p-4 rounded-lg border ${
                                  idx === 0
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : idx === 1
                                      ? 'bg-red-500/10 border-red-500/30'
                                      : 'bg-blue-500/10 border-blue-500/30'
                                }`}
                              >
                                <div className="mb-2">
                                  <h4 className="font-bold text-accent text-lg">{result.case}</h4>
                                </div>
                                <div className="text-sm space-y-2">
                                  <p>
                                    <span className="text-text-secondary">추정 방어력(TGH): </span>
                                    <span className="font-bold text-blue-500 text-lg">
                                      약 {result.defense}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-text-secondary">상대 추정 속성: </span>
                                    <span className="font-bold text-yellow-500 text-lg">
                                      {result.enemyAttr}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-text-secondary">속성 보정: </span>
                                    <span className="font-bold text-purple-500 text-lg">
                                      ×{result.attrBonus.toFixed(2)}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-text-secondary">
                              <p>입력값으로 추정할 수 있는 경우가 없습니다.</p>
                              <p className="text-xs mt-2">
                                공격력과 데미지 값을 다시 확인해주세요.
                              </p>
                            </div>
                          )}

                          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                            <h4 className="font-bold text-blue-500 mb-2">💡 참고사항</h4>
                            <ul className="text-xs text-text-secondary space-y-1">
                              <li>• 추정값은 근사치이며, 실제와 다를 수 있습니다</li>
                              <li>• 크리티컬 데미지는 일반 데미지보다 높으므로 주의하세요</li>
                              <li>• 여러 케이스가 나올 경우, 신뢰도가 높은 것을 우선 참고하세요</li>
                              <li>
                                • 속성 보정이 0.6배면 상성 불리, 1.5배면 상성 유리를 의미합니다
                              </li>
                            </ul>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BattlePage;
