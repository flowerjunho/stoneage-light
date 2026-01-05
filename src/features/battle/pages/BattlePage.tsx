import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '@/shared/components/layout/ThemeToggle';
import petDataJson from '@/data/petData.json';

type TabType = 'info' | 'combo' | 'calculator';
type CalculatorSubTab = 'damage' | 'reverse';
type AttributeType = 'fire' | 'water' | 'earth' | 'wind';
type UnitType = 'PLAYER' | 'PET';
type StatusEffect = 'none' | 'poison' | 'paralysis' | 'sleep' | 'stone' | 'drunk' | 'confusion' | 'weaken';
type FieldAttribute = 'none' | 'fire' | 'water' | 'earth' | 'wind';

// 서버 원본 상수들
const BATTLE_CONSTANTS = {
  // 데미지 관련
  DEFENSE_RATE: 0.7,          // 방어력 계수 (_BATTLE_NEWPOWER)
  DAMAGE_RATE: 2.0,           // 데미지 증폭 계수
  D_16: 1 / 16,               // 1/16
  D_8: 1 / 8,                 // 1/8

  // 확률 관련
  gCriticalPara: 0.09,        // 크리티컬 기본 계수
  gCounterPara: 0.08,         // 카운터 기본 계수
  gKawashiPara: 0.02,         // 회피 기본 계수
  KAWASHI_MAX_RATE: 75,       // 최대 회피율 75%

  // 운(LUCK) 관련 - 플레이어 전용 숨겨진 스탯
  // 장비의 ITEM_MODIFYLUCK 옵션으로만 획득 가능
  // 크리티컬/회피/카운터/포획/도주 확률에 영향
  LUCK_MIN: 0,                // 운 최소값
  LUCK_MAX: 5,                // 운 최대값 (초과 시 서버 에러)

  // 속성 관련
  AJ_UP: 1.5,                 // 유리 속성
  AJ_DOWN: 0.6,               // 불리 속성
  AJ_SAME: 1.0,               // 동일/무관
  ATTR_MAX: 100,              // 속성 최대값

  // 필드 속성 보정
  FIELD_AJ_BOTTOM: 0.5,       // 필드 기본 보정
  FIELD_AJ_PLUS: 0.5,         // 필드 추가 보정
};

interface CharacterStats {
  lv: number;
  hp: number;
  str: number;
  tgh: number;
  dex: number;
  luck: number;              // 운 스탯 추가
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
const STORAGE_KEY_ATTACKER_PET = 'stoneage_battle_attacker_pet';
const STORAGE_KEY_DEFENDER_PET = 'stoneage_battle_defender_pet';

interface BattleOptions {
  attackerType: UnitType;
  defenderType: UnitType;
  attackerStatus: StatusEffect;
  defenderStatus: StatusEffect;
  fieldAttribute: FieldAttribute;
  fieldPower: number;  // 필드 속성 강도 (0-100)
  weaponCritBonus: number;  // 무기 크리티컬 보너스
}

const getDefaultStats = (): CharacterStats => ({
  lv: 140,
  hp: 0,
  str: 0,
  tgh: 0,
  dex: 0,
  luck: 0,
  fire: 0,
  water: 0,
  earth: 0,
  wind: 0,
});

const getDefaultBattleOptions = (): BattleOptions => ({
  attackerType: 'PLAYER',
  defenderType: 'PLAYER', // PLAYER vs PLAYER 기본값 (DEX 보정 없음)
  attackerStatus: 'none',
  defenderStatus: 'none',
  fieldAttribute: 'none',
  fieldPower: 50,
  weaponCritBonus: 0,
});

const loadStatsFromStorage = (key: string): CharacterStats => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 기존 데이터에 luck이 없을 경우 기본값 추가
      return {
        ...getDefaultStats(),
        ...parsed,
        luck: parsed.luck ?? 0,
      };
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

const loadPetStatsFromStorage = (key: string): PetStats | null => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load pet stats from storage:', error);
  }
  return null;
};

const savePetStatsToStorage = (key: string, petStats: PetStats | null) => {
  try {
    if (petStats === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(petStats));
    }
  } catch (error) {
    console.error('Failed to save pet stats to storage:', error);
  }
};

const BattlePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);

  // URL 쿼리에서 탭 상태 가져오기
  const tabFromQuery = searchParams.get('tab') as TabType | null;
  const initialTab =
    tabFromQuery === 'calculator' || tabFromQuery === 'info' || tabFromQuery === 'combo'
      ? tabFromQuery
      : 'info';

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

  // 페트 탑승 상태 (로컬 스토리지에서 불러오기)
  const [attackerPet, setAttackerPet] = useState<PetStats | null>(() =>
    loadPetStatsFromStorage(STORAGE_KEY_ATTACKER_PET)
  );
  const [defenderPet, setDefenderPet] = useState<PetStats | null>(() =>
    loadPetStatsFromStorage(STORAGE_KEY_DEFENDER_PET)
  );

  // 역계산용 페트 상태 (petId와 레벨 저장)
  const [reverseOpponentPet, setReverseOpponentPet] = useState<{
    petId: string;
    lv: number;
  } | null>(null);

  // 탑승 가능한 페트 목록
  const rideablePets = petDataJson.pets.filter(pet => pet.rideable === '탑승가능');

  // 배틀 옵션 (새로 추가)
  const [battleOptions, setBattleOptions] = useState<BattleOptions>(getDefaultBattleOptions);

  // 시뮬레이션 관련 state
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationCount, setSimulationCount] = useState(100);
  const [simulationWeaponType, setSimulationWeaponType] = useState<'melee' | 'ranged'>('melee');
  const [simulationResult, setSimulationResult] = useState<{
    total: number;
    dodged: number;
    hit: number;
    countered: number;
    critical: number;
    dodgeRate: number;
    counterRate: number;
    critRate: number;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStatsExpanded, setSimStatsExpanded] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  // 인증 확인 및 테마 적용
  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('THEME_TOGGLE_STATE');
    const root = document.documentElement;

    if (savedTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    // Check authentication
    const authKey = localStorage.getItem('BATTLE_AUTH');
    if (authKey === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  // 비밀번호 확인
  const handlePasswordSubmit = () => {
    // 비밀번호 설정 (원하는 비밀번호로 변경 가능)
    const correctPassword = '2580';

    if (password === correctPassword) {
      localStorage.setItem('BATTLE_AUTH', 'authenticated');
      setIsAuthenticated(true);
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
    }
  };

  // 탭 변경 시 URL 쿼리 업데이트
  useEffect(() => {
    const params: { tab: string; subTab?: string } = { tab: activeTab };
    if (activeTab === 'calculator') {
      params.subTab = calculatorSubTab;
    }
    setSearchParams(params, { replace: true });
  }, [activeTab, calculatorSubTab, setSearchParams]);

  // 목차 클릭 시 스크롤 처리
  const handleTocClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 20; // 상단 여유 공간 (약간의 패딩)
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  };

  // 공격자 스탯이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveStatsToStorage(STORAGE_KEY_ATTACKER, attacker);
  }, [attacker]);

  // 방어자 스탯이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveStatsToStorage(STORAGE_KEY_DEFENDER, defender);
  }, [defender]);

  // 공격자 페트 스탯이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    savePetStatsToStorage(STORAGE_KEY_ATTACKER_PET, attackerPet);
  }, [attackerPet]);

  // 방어자 페트 스탯이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    savePetStatsToStorage(STORAGE_KEY_DEFENDER_PET, defenderPet);
  }, [defenderPet]);

  // 속성 총합 계산
  const getAttributeTotal = (char: CharacterStats) => {
    return char.fire + char.water + char.earth + char.wind;
  };

  // 공격자와 방어자 정보 스왑
  const handleSwapAttackerDefender = () => {
    // 스탯 스왑
    const tempAttacker = { ...attacker };
    setAttacker({ ...defender });
    setDefender(tempAttacker);

    // 페트 정보 스왑
    const tempAttackerPet = attackerPet;
    setAttackerPet(defenderPet);
    setDefenderPet(tempAttackerPet);
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
  const calculateRidingStats = (char: CharacterStats, petStats: PetStats | null): CharacterStats => {
    if (!petStats) return char;

    return {
      lv: char.lv,
      hp: Math.floor(char.hp * 0.7 + petStats.hp * 0.3),
      str: Math.floor(char.str * 0.7 + petStats.str * 0.3),
      tgh: Math.floor(char.tgh * 0.7 + petStats.tgh * 0.3),
      dex: Math.floor(char.dex * 0.7 + petStats.dex * 0.3),
      luck: char.luck, // 운은 캐릭터 스탯 유지
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
  // 서버 원본: battle_event.c BATTLE_CriticalCheckPlayer (1136-1203)
  const calculateCriticalRate = (
    atkDex: number,
    defDex: number,
    atkLuck: number = 0,
    weaponCritBonus: number = 0,
    atkType: UnitType = 'PLAYER',
    defType: UnitType = 'PLAYER'
  ): number => {
    const gCriticalPara = 0.09;
    let divpara = gCriticalPara;
    let root = 1; // 제곱근 사용 여부
    let modDefDex = defDex;

    // 타입별 보정 (PVP 전용 - 서버 로직 기반)
    // PLAYER → PET: 방어자 펫 DEX × 0.8 (플레이어가 펫 공격 시 크리율 높음)
    // PET → PLAYER: divpara = 10.0, root = 0 (펫이 플레이어 공격 시 크리율 낮음)
    if (atkType === 'PLAYER' && defType === 'PET') {
      modDefDex *= 0.8;
    } else if (atkType === 'PET' && defType === 'PLAYER') {
      divpara = 10.0;
      root = 0;
    }

    // Big/Small 판정
    let big: number, small: number, wari: number;
    if (atkDex >= modDefDex) {
      big = atkDex;
      small = modDefDex;
      wari = 1.0;
    } else {
      big = modDefDex;
      small = atkDex;
      wari = big <= 0 ? 0.0 : small / big;
    }

    // 핵심 계산
    let work = (big - small) / divpara;
    if (work <= 0) work = 0;

    let per: number;
    if (root === 1) {
      per = Math.sqrt(work) + weaponCritBonus * 0.5;
    } else {
      per = work + weaponCritBonus * 0.5;
    }

    per *= wari;
    per += atkLuck;
    per *= 100; // 10000 단위로 변환

    // 범위 제한
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

  /**
   * 회피율 계산 (서버 원본: battle_event.c BATTLE_DuckCheck 667-792)
   *
   * ## 서버 로직 설명
   *
   * ### 1. 타입별 DEX 보정
   * - 적 vs 펫: 공격자 DEX × 0.8
   * - 비적 vs 펫: 방어자 DEX × 0.8
   * - 비플레이어 vs 플레이어: 공격자 DEX × 0.6
   * - 플레이어 vs 비플레이어: 방어자 DEX × 0.6
   *
   * ### 2. Big/Small/Wari 계산
   * - 방어자 DEX >= 공격자 DEX: Big=방어자, Small=공격자, wari=1.0
   * - 공격자 DEX > 방어자 DEX: Big=공격자, Small=방어자, wari=방어자/공격자
   *
   * ### 3. 회피율 공식
   * per = sqrt((Big - Small) / K) × wari + 운
   * - K = 0.02 (기본) 또는 0.027 (주술 커맨드)
   * - per × 100 후 최대 7500 (75%) 제한
   * - RAND(1, 10000) <= per 이면 회피 성공
   *
   * ### 예시 (공격자 279, 방어자 300, PLAYER vs PLAYER)
   * - 방어자 >= 공격자이므로: Big=300, Small=279, wari=1.0
   * - Work = (300-279)/0.02 = 1050
   * - per = sqrt(1050) × 1.0 = 32.4
   * - 최종 회피율 = 32.4%
   */
  const calculateDodgeRate = (
    atkDex: number,
    defDex: number,
    defLuck: number = 0,
    atkType: UnitType = 'PLAYER',
    defType: UnitType = 'PLAYER',
    isJujutsu: boolean = false,
    isRanged: boolean = false
  ): number => {
    const K = isJujutsu ? 0.027 : BATTLE_CONSTANTS.gKawashiPara;

    let modAtkDex = atkDex;
    let modDefDex = defDex;

    // 타입별 DEX 보정 (PVP 전용)
    // PLAYER → PET: 방어자 펫 DEX × 0.8
    // PET → PLAYER: 공격자 펫 DEX × 0.6
    if (atkType === 'PLAYER' && defType === 'PET') {
      modDefDex *= 0.8;
    } else if (atkType === 'PET' && defType === 'PLAYER') {
      modAtkDex *= 0.6;
    }

    // Big/Small/Wari 계산
    let big: number, small: number, wari: number;
    if (modDefDex >= modAtkDex) {
      big = modDefDex;
      small = modAtkDex;
      wari = 1.0;
    } else {
      big = modAtkDex;
      small = modDefDex;
      wari = big <= 0 ? 0.0 : small / big;
    }

    // 회피율 계산
    const work = (big - small) / K;
    let per = work <= 0 ? 0 : Math.sqrt(work);
    per *= wari;
    per += defLuck;

    // 원거리 무기 보너스 (서버 코드에서 +20이 두 번 적용됨 - 752줄, 759줄)
    // per *= 100 이전에 적용되어야 함
    if (isRanged) {
      per += 40;
    }

    // 10000 기준 변환 및 제한
    per *= 100;
    if (per > BATTLE_CONSTANTS.KAWASHI_MAX_RATE * 100) {
      per = BATTLE_CONSTANTS.KAWASHI_MAX_RATE * 100;
    }
    if (per <= 0) per = 1;

    return per / 100;
  };

  // 카운터 확률 계산 (서버 원본 기반 - gCounterPara = 0.08)
  // 카운터는 방어자가 공격자를 반격하는 것 - 방어자 순발력이 높을수록 카운터율 증가
  const calculateCounterRate = (
    atkDex: number,
    defDex: number,
    atkType: UnitType = 'PLAYER',
    defType: UnitType = 'PLAYER'
  ): number => {
    let modAtkDex = atkDex;
    let modDefDex = defDex;

    // 타입별 DEX 보정 (PVP 전용)
    // PLAYER → PET: 방어자 펫 DEX × 0.8 (펫이 카운터하기 어려움)
    // PET → PLAYER: 공격자 펫 DEX × 0.6 (플레이어가 카운터하기 쉬움)
    if (atkType === 'PLAYER' && defType === 'PET') {
      modDefDex *= 0.8;
    } else if (atkType === 'PET' && defType === 'PLAYER') {
      modAtkDex *= 0.6;
    }

    // Big/Small 판정 (회피율과 동일한 로직)
    let big: number;
    let small: number;
    let wari: number;

    if (modDefDex >= modAtkDex) {
      big = modDefDex;
      small = modAtkDex;
      wari = 1.0;
    } else {
      big = modAtkDex;
      small = modDefDex;
      wari = big <= 0 ? 0.0 : small / big;
    }

    // 카운터율 계산: sqrt((Big - Small) / K) * wari
    const work = (big - small) / BATTLE_CONSTANTS.gCounterPara;
    if (work <= 0) {
      return 1;
    }

    let per = Math.sqrt(work);
    per *= wari;
    per *= 100;

    if (per < 0) per = 1;
    if (per > 10000) per = 10000;

    return Math.floor(per);
  };

  // 필드 속성 보정 계산 (서버 원본 기반)
  const calculateFieldAttributeBonus = (
    charAttr: CharacterStats,
    fieldAttr: FieldAttribute,
    fieldPower: number // 0-100
  ): number => {
    if (fieldAttr === 'none') return 1.0;

    const attrValue = {
      fire: charAttr.fire * 10,
      water: charAttr.water * 10,
      earth: charAttr.earth * 10,
      wind: charAttr.wind * 10,
    };

    const matchingAttr = attrValue[fieldAttr] || 0;
    const power =
      BATTLE_CONSTANTS.FIELD_AJ_BOTTOM +
      matchingAttr * (fieldPower / 100) * 0.01 * BATTLE_CONSTANTS.FIELD_AJ_PLUS;

    return power;
  };

  // 상태이상에 따른 방어력 보정
  const getDefenseModifierByStatus = (status: StatusEffect): number => {
    switch (status) {
      case 'stone': // 석화: 방어력 2배
        return 2.0;
      case 'weaken': // 허약: 방어력 감소
        return 0.7;
      default:
        return 1.0;
    }
  };

  // 상태이상에 따른 공격력 보정
  const getAttackModifierByStatus = (status: StatusEffect): number => {
    switch (status) {
      case 'drunk': // 취기: 공격력 변동
        return 0.9 + Math.random() * 0.2;
      case 'confusion': // 혼란: 공격력 감소
        return 0.8;
      case 'weaken': // 허약: 공격력 감소
        return 0.7;
      default:
        return 1.0;
    }
  };

  // 상태이상에 따른 행동 불가 확률
  const getActionDisabledChance = (status: StatusEffect): number => {
    switch (status) {
      case 'paralysis': // 마비
        return 0.5; // 50%
      case 'sleep': // 수면
        return 1.0; // 100%
      case 'stone': // 석화
        return 1.0; // 100%
      default:
        return 0;
    }
  };

  // 시뮬레이션 실행 함수 (페이지의 공격자/방어자 스탯과 전투 타입 사용, 애니메이션 포함)
  const runSimulation = (weaponType: 'melee' | 'ranged', count: number) => {
    setIsSimulating(true);
    setSimProgress(0);
    setSimulationResult(null);

    // 현재 페이지의 스탯 사용 (탑승 펫 반영)
    const finalAttacker = calculateRidingStats(attacker, attackerPet);
    const finalDefender = calculateRidingStats(defender, defenderPet);

    // 회피율 계산 (페이지 스탯 사용)
    const dodgeRateCalc = calculateDodgeRate(
      finalAttacker.dex,
      finalDefender.dex,
      finalDefender.luck,
      battleOptions.attackerType,
      battleOptions.defenderType,
      false, // isJujutsu
      weaponType === 'ranged' // isRanged
    );

    // 크리티컬 확률 계산 (페이지 스탯 사용)
    const critRateCalc = calculateCriticalRate(
      finalAttacker.dex,
      finalDefender.dex,
      finalAttacker.luck,
      battleOptions.weaponCritBonus,
      battleOptions.attackerType,
      battleOptions.defenderType
    );

    // 카운터 확률 계산 (페이지 스탯 사용)
    const counterRateCalc = calculateCounterRate(
      finalAttacker.dex,
      finalDefender.dex,
      battleOptions.attackerType,
      battleOptions.defenderType
    );

    // 애니메이션을 위한 단계별 시뮬레이션
    const batchSize = Math.max(1, Math.floor(count / 20)); // 20단계로 나눔
    let currentIndex = 0;
    let dodged = 0;
    let hit = 0;
    let countered = 0;
    let critical = 0;

    const simulateBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, count);

      for (let i = currentIndex; i < endIndex; i++) {
        const rand = Math.random() * 100;

        if (rand < dodgeRateCalc) {
          dodged++;
        } else {
          hit++;

          const critRand = Math.random() * 100;
          if (critRand < (critRateCalc / 100)) {
            critical++;
          }

          const counterRand = Math.random() * 100;
          if (counterRand < (counterRateCalc / 100)) {
            countered++;
          }
        }
      }

      currentIndex = endIndex;
      setSimProgress(Math.floor((currentIndex / count) * 100));

      if (currentIndex < count) {
        setTimeout(simulateBatch, 50); // 50ms 딜레이로 일관된 애니메이션
      } else {
        setSimulationResult({
          total: count,
          dodged,
          hit,
          countered,
          critical,
          dodgeRate: dodgeRateCalc,
          counterRate: counterRateCalc / 100,
          critRate: critRateCalc / 100,
        });
        setIsSimulating(false);
      }
    };

    setTimeout(simulateBatch, 50); // 첫 배치도 딜레이 적용
  };

  // 전체 데미지 계산 (확장된 버전)
  const calculateDamage = (weaponType: 'melee' | 'ranged') => {
    // 페트 탑승 시 스탯 적용
    const finalAttacker = calculateRidingStats(attacker, attackerPet);
    const finalDefender = calculateRidingStats(defender, defenderPet);

    // 상태이상 보정 적용
    const atkStatusMod = getAttackModifierByStatus(battleOptions.attackerStatus);
    const defStatusMod = getDefenseModifierByStatus(battleOptions.defenderStatus);

    // 최종 공격력/방어력 (상태이상 보정 적용)
    const atk = Math.floor(finalAttacker.str * atkStatusMod);
    const def = Math.floor(finalDefender.tgh * defStatusMod);

    // 기본 데미지 계산
    const baseDamage = calculateBaseDamage(atk, def);

    // 속성 보정 계산
    const attrBonus = calculateAttributeBonus(finalAttacker, finalDefender);

    // 필드 속성 보정 계산
    const atkFieldBonus = calculateFieldAttributeBonus(
      finalAttacker,
      battleOptions.fieldAttribute,
      battleOptions.fieldPower
    );
    const defFieldBonus = calculateFieldAttributeBonus(
      finalDefender,
      battleOptions.fieldAttribute,
      battleOptions.fieldPower
    );
    const fieldBonus = atkFieldBonus / defFieldBonus;

    // 크리티컬 확률 계산
    const critRate = calculateCriticalRate(
      finalAttacker.dex,
      finalDefender.dex,
      finalAttacker.luck,
      battleOptions.weaponCritBonus,
      battleOptions.attackerType,
      battleOptions.defenderType
    );

    // 회피율 계산 (타입별 보정 + 원거리 무기 보너스 적용)
    const dodgeRate = calculateDodgeRate(
      finalAttacker.dex,
      finalDefender.dex,
      finalDefender.luck,
      battleOptions.attackerType,
      battleOptions.defenderType,
      false, // isJujutsu
      weaponType === 'ranged' // isRanged - 서버 코드에서 BOW는 +20이 두 번 적용됨
    );

    // 카운터 확률 계산 (새로 추가)
    const counterRate = calculateCounterRate(
      finalAttacker.dex,
      finalDefender.dex,
      battleOptions.attackerType,
      battleOptions.defenderType
    );

    // 행동 불가 확률 (상태이상)
    const actionDisabledChance = getActionDisabledChance(battleOptions.attackerStatus);

    // 최종 데미지 (속성 보정 + 필드 보정)
    const totalBonus = attrBonus * fieldBonus;
    const finalMin = Math.round(baseDamage.min * totalBonus);
    const finalMax = Math.round(baseDamage.max * totalBonus);
    const finalAvg = Math.round(baseDamage.avg * totalBonus);

    // 방어력 계산 (TGH × 0.7 × 상태이상 보정)
    const defenderDefense = finalDefender.tgh * BATTLE_CONSTANTS.DEFENSE_RATE * defStatusMod;

    return {
      baseDamage,
      attrBonus,
      fieldBonus,
      critRate,
      dodgeRate,
      counterRate,
      actionDisabledChance,
      normal: { min: finalMin, max: finalMax, avg: finalAvg },
      critical: {
        min: calculateCriticalDamage(finalMin, defenderDefense),
        max: calculateCriticalDamage(finalMax, defenderDefense),
        avg: calculateCriticalDamage(finalAvg, defenderDefense),
      },
      statusEffects: {
        attackerStatus: battleOptions.attackerStatus,
        defenderStatus: battleOptions.defenderStatus,
        atkMod: atkStatusMod,
        defMod: defStatusMod,
      },
    };
  };

  // 수평 스크롤만 허용하는 터치 핸들러
  const touchStartRef = useRef<{ x: number; y: number; scrollLeft: number } | null>(null);

  const handleHorizontalTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const target = e.currentTarget;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      scrollLeft: target.scrollLeft,
    };
  }, []);

  const handleHorizontalTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touchStartRef.current.x - touch.clientX;
    const deltaY = Math.abs(touchStartRef.current.y - touch.clientY);

    // 수평 이동이 수직 이동보다 크면 수평 스크롤만 허용
    if (Math.abs(deltaX) > deltaY) {
      e.preventDefault();
      e.currentTarget.scrollLeft = touchStartRef.current.scrollLeft + deltaX;
    }
  }, []);

  const handleHorizontalTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // 비밀번호 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
        <ThemeToggle />
        <div className="bg-bg-secondary rounded-lg p-8 border border-border shadow-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-center mb-6">🔐 비밀번호 입력</h2>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-accent"
            />
            {showPasswordError && <p className="text-red-500 text-sm">잘못된 비밀번호입니다.</p>}
            <button
              onClick={handlePasswordSubmit}
              className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div
          className="flex mb-6 border-b border-border overflow-x-auto overflow-y-hidden"
          style={{ touchAction: 'pan-x' }}
          onTouchStart={handleHorizontalTouchStart}
          onTouchMove={handleHorizontalTouchMove}
          onTouchEnd={handleHorizontalTouchEnd}
        >
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
            onClick={() => setActiveTab('combo')}
            className={`flex-1 px-4 py-2 font-bold transition-colors ${
              activeTab === 'combo'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            콤보
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
                <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }} onTouchStart={handleHorizontalTouchStart} onTouchMove={handleHorizontalTouchMove} onTouchEnd={handleHorizontalTouchEnd}>
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
                <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }} onTouchStart={handleHorizontalTouchStart} onTouchMove={handleHorizontalTouchMove} onTouchEnd={handleHorizontalTouchEnd}>
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

                <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }} onTouchStart={handleHorizontalTouchStart} onTouchMove={handleHorizontalTouchMove} onTouchEnd={handleHorizontalTouchEnd}>
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
                      <strong>기본 공식 (플레이어 vs 적):</strong>
                    </p>
                    <code className="block bg-bg-primary px-3 py-2 rounded text-xs md:text-sm">
                      크리확률 = ((√(DEX차이 ÷ 0.09) + 무기크리×0.5) × wari + 행운) × 100
                    </code>
                    <p className="mt-2">
                      <strong>계산 순서:</strong>
                    </p>
                    <ol className="list-decimal list-inside text-xs space-y-1 ml-2">
                      <li>DEX 차이 계산: 공격자 DEX - (방어자 DEX × 0.6)</li>
                      <li>제곱근 계산: √(DEX차이 ÷ 0.09)</li>
                      <li>무기 크리 가산: 결과 + (무기크리옵션 × 0.5)</li>
                      <li>wari 배율 적용: 결과 × wari</li>
                      <li>행운 가산: 결과 + 행운</li>
                      <li>백분율 변환: 결과 × 100</li>
                    </ol>
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                      <p className="font-bold text-blue-400 text-sm mb-1">wari (DEX 역전 페널티)</p>
                      <code className="block bg-bg-primary px-2 py-1 rounded text-xs">
                        wari = 공격자 DEX ≥ 방어자 DEX ? 1.0 : (공격자 DEX ÷ 방어자 DEX)
                      </code>
                      <p className="text-xs text-text-secondary mt-2">
                        💡 공격자가 방어자보다 느리면 (DEX가 낮으면) 크리티컬 확률이 비율만큼
                        감소합니다.
                      </p>
                      <p className="text-xs text-text-secondary">
                        예: 공격자 DEX 100 vs 방어자 DEX 200 → wari = 0.5 (크리 확률 50%로 감소)
                      </p>
                    </div>
                    <p className="text-yellow-500 mt-2">
                      ⚠️ <strong>중요:</strong> 플레이어가 공격할 때 적의 DEX는 0.6배로 계산!
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
                      <p>공격자 DEX: 305 (플레이어)</p>
                      <p>방어자 DEX: 150 → 보정 후 90 (적)</p>
                      <p>무기 크리옵션: 0</p>
                      <p>행운: 0</p>
                      <hr className="my-1 border-border" />
                      <p>DEX 차이: 305 - 90 = 215</p>
                      <p>
                        크리확률: <strong className="text-accent">√(215÷0.09) × 100 ≈ 4882%</strong>
                      </p>
                      <p className="text-xs text-green-500">※ 실제: 48.82% (10000 단위)</p>
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
                <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }} onTouchStart={handleHorizontalTouchStart} onTouchMove={handleHorizontalTouchMove} onTouchEnd={handleHorizontalTouchEnd}>
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

                <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }} onTouchStart={handleHorizontalTouchStart} onTouchMove={handleHorizontalTouchMove} onTouchEnd={handleHorizontalTouchEnd}>
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
                  <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }} onTouchStart={handleHorizontalTouchStart} onTouchMove={handleHorizontalTouchMove} onTouchEnd={handleHorizontalTouchEnd}>
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

                <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }} onTouchStart={handleHorizontalTouchStart} onTouchMove={handleHorizontalTouchMove} onTouchEnd={handleHorizontalTouchEnd}>
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
                          0 데미지
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
                  <strong>50%는 90% 이상 데미지 감소!</strong> (25% 완전방어 + 25% 슈퍼방어)
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
                      <span className="font-bold text-accent">0 데미지</span>
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

        {/* 콤보 탭 */}
        {activeTab === 'combo' && (
          <div className="space-y-6">
            {/* 목차 */}
            <div className="bg-bg-secondary rounded-lg p-5 border border-border shadow-lg">
              <h2 className="text-lg font-bold mb-3 text-accent">📑 목차</h2>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <button
                  onClick={() => handleTocClick('combo-overview')}
                  className="p-2 hover:bg-bg-tertiary rounded transition-colors cursor-pointer text-text-secondary hover:text-accent text-left"
                >
                  ⚔️ 콤보 시스템 개요
                </button>
                <button
                  onClick={() => handleTocClick('combo-conditions')}
                  className="p-2 hover:bg-bg-tertiary rounded transition-colors cursor-pointer text-text-secondary hover:text-accent text-left"
                >
                  🎲 발동 조건
                </button>
                <button
                  onClick={() => handleTocClick('combo-process')}
                  className="p-2 hover:bg-bg-tertiary rounded transition-colors cursor-pointer text-text-secondary hover:text-accent text-left"
                >
                  🔄 발동 과정
                </button>
                <button
                  onClick={() => handleTocClick('combo-calculation')}
                  className="p-2 hover:bg-bg-tertiary rounded transition-colors cursor-pointer text-text-secondary hover:text-accent text-left"
                >
                  💥 데미지 계산
                </button>
                <button
                  onClick={() => handleTocClick('combo-comparison')}
                  className="p-2 hover:bg-bg-tertiary rounded transition-colors cursor-pointer text-text-secondary hover:text-accent text-left"
                >
                  📊 일반 공격 비교
                </button>
                <button
                  onClick={() => handleTocClick('combo-strategy')}
                  className="p-2 hover:bg-bg-tertiary rounded transition-colors cursor-pointer text-text-secondary hover:text-accent text-left"
                >
                  💡 활용 전략
                </button>
                <button
                  onClick={() => handleTocClick('combo-cases')}
                  className="p-2 hover:bg-bg-tertiary rounded transition-colors cursor-pointer text-text-secondary hover:text-accent text-left"
                >
                  📖 실전 케이스 (20개)
                </button>
              </div>
            </div>

            {/* 개요 */}
            <div
              id="combo-overview"
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-5 border border-purple-500/50 scroll-mt-6"
            >
              <h2 className="text-2xl font-bold mb-3 text-purple-400">⚔️ 콤보 시스템이란?</h2>
              <p className="text-text-primary mb-3">
                콤보는 <strong className="text-yellow-400">2~5명이 같은 적을 연속으로 공격</strong>
                하여 누적 데미지를 한 번에 가하는 시스템입니다.
              </p>
              <div className="bg-bg-tertiary rounded p-4 space-y-2 text-sm">
                <p>
                  🎯 <strong className="text-red-400">회피 불가!</strong> 일반 공격과 달리 반드시
                  명중합니다
                </p>
                <p>
                  💥 각자의 데미지를 계산하여{' '}
                  <strong className="text-accent">마지막에 모아서 한 번에</strong> 적용
                </p>
                <p>
                  👥 최대 <strong className="text-accent">5명</strong>까지 참여 가능
                </p>
                <p>
                  🐾 <strong className="text-purple-400">캐릭터와 펫이 섞여서 콤보 가능!</strong>{' '}
                  (예: 캐릭A → 펫B → 캐릭C)
                </p>
                <p>
                  ⚡ 각자 <strong className="text-accent">독립적으로</strong> 크리티컬 및 속성 보정
                  적용
                </p>
                <p className="pt-2 border-t border-border">
                  📊 <strong className="text-green-400">아래 실전 상황 분석 20가지 케이스</strong>를
                  확인하여 콤보 성공 조건을 완벽히 파악하세요!
                </p>
              </div>
            </div>

            {/* 콤보 발동 조건 */}
            <div
              id="combo-conditions"
              className="bg-bg-secondary rounded-lg p-5 border border-border scroll-mt-6"
            >
              <h2 className="text-xl font-bold mb-4 text-accent">🎲 콤보 발동 조건</h2>

              {/* 턴 순서와 확률 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-green-400">
                  1. 핵심 원리: DEX 순서와 확률
                </h3>

                <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded">
                  <p className="font-bold text-purple-400 mb-2">
                    ⚡ 전투 순서는 DEX(순발력) 내림차순!
                  </p>
                  <p className="text-sm text-text-secondary">
                    DEX가 높을수록 먼저 행동합니다. 예: DEX 300 → 200 → 100 → 50 순서로 공격
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
                    <div className="text-center mb-2">
                      <span className="text-3xl font-bold text-blue-400">50%</span>
                    </div>
                    <p className="text-center text-sm text-text-secondary font-bold">
                      플레이어 캐릭터 / 펫
                    </p>
                    <p className="text-xs text-center text-text-tertiary mt-2">
                      <strong className="text-yellow-400">첫 번째만</strong> 확률 판정!
                      <br />
                      통과하면 "대기 상태" 진입
                      <br />
                      <span className="text-purple-400">캐릭터든 펫이든 동일!</span>
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-4">
                    <div className="text-center mb-2">
                      <span className="text-3xl font-bold text-red-400">20%</span>
                    </div>
                    <p className="text-center text-sm text-text-secondary font-bold">적</p>
                    <p className="text-xs text-center text-text-tertiary mt-2">
                      <strong className="text-yellow-400">첫 번째 적만</strong> 확률 판정!
                      <br />
                      통과하면 "대기 상태" 진입
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded text-sm">
                  <p className="text-green-400 font-bold mb-1">
                    ✅ 중요: 두 번째 사람부터는 확률 판정 없음!
                  </p>
                  <p className="text-text-secondary text-xs">
                    조건만 맞으면 자동으로 콤보에 합류합니다. 즉, 첫 사람의 확률만 뚫으면 나머지는
                    조건만 체크!
                  </p>
                </div>
              </div>

              {/* 필수 조건 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 text-green-400">2. 필수 조건</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="font-bold text-accent mb-1">일반 공격만 가능</p>
                      <p className="text-sm text-text-secondary">방어, 스킬, 주술 등은 콤보 불가</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="font-bold text-accent mb-1">근접 무기만 가능</p>
                      <p className="text-sm text-text-secondary">활, 투척 무기는 콤보 불가</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="font-bold text-accent mb-1">같은 적을 공격</p>
                      <p className="text-sm text-text-secondary">
                        첫 번째 사람이 선택한 적을 나머지도 공격해야 함
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="font-bold text-accent mb-1">같은 편이어야 함</p>
                      <p className="text-sm text-text-secondary">아군끼리, 적끼리만 콤보 가능</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <p className="font-bold text-accent mb-1">행동 가능 상태</p>
                      <p className="text-sm text-text-secondary">
                        HP가 0이 아니고, 상태이상으로 행동 불가가 아니어야 함
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 최소 인원 */}
              <div className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/50 rounded">
                <p className="text-lg font-bold text-red-400 mb-2">
                  ⚠️ 최소 2명 이상이어야 콤보 성립!
                </p>
                <p className="text-sm text-text-secondary">
                  1명이 확률에 성공해도, 다음 사람이 조건을 만족하지 않으면 콤보가 불발되고 일반
                  공격으로 처리됩니다.
                </p>
              </div>
            </div>

            {/* 콤보 발동 과정 */}
            <div
              id="combo-process"
              className="bg-bg-secondary rounded-lg p-5 border border-border scroll-mt-6"
            >
              <h2 className="text-xl font-bold mb-4 text-accent">🔄 콤보 발동 과정</h2>

              <div className="space-y-4">
                {/* 단계 1 */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      1
                    </span>
                    <h3 className="text-lg font-bold text-purple-400">첫 번째 사람 - 확률 체크</h3>
                  </div>
                  <div className="pl-11 space-y-2 text-sm">
                    <p>• A가 적 X를 일반 공격 (근접 무기)</p>
                    <p>
                      • 50% 확률 체크 → <strong className="text-green-400">성공!</strong>
                    </p>
                    <p>• A는 "대기 상태"가 됨 (아직 콤보 아님)</p>
                    <p className="text-yellow-400">→ 다음 사람을 기다림...</p>
                  </div>
                </div>

                {/* 단계 2 */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      2
                    </span>
                    <h3 className="text-lg font-bold text-blue-400">
                      두 번째 사람 - 조인 (확률 없음!)
                    </h3>
                  </div>
                  <div className="pl-11 space-y-2 text-sm">
                    <p>• B가 같은 적 X를 공격 (근접 무기)</p>
                    <p>
                      • <strong className="text-yellow-400">확률 체크 없이</strong> 조건만 확인!
                    </p>
                    <p>
                      • 모든 조건 만족 → <strong className="text-green-400">자동 조인!</strong>
                    </p>
                    <p>• A와 B 모두 "콤보" 상태로 변경</p>
                    <p>• 콤보 그룹 ID 부여 (예: ComboId=2)</p>
                    <p className="text-green-400">→ 2명 콤보 성립!</p>
                  </div>
                </div>

                {/* 단계 3 */}
                <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      3
                    </span>
                    <h3 className="text-lg font-bold text-green-400">추가 참여 (선택)</h3>
                  </div>
                  <div className="pl-11 space-y-2 text-sm">
                    <p>• C, D, E도 조건을 만족하면 계속 참여 가능</p>
                    <p>• 같은 콤보 그룹 ID 부여</p>
                    <p>• 최대 5명까지 가능</p>
                    <p className="text-green-400">→ 5명 콤보!</p>
                  </div>
                </div>

                {/* 중단 케이스 */}
                <div className="bg-red-500/10 border border-red-500/30 rounded p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      ✕
                    </span>
                    <h3 className="text-lg font-bold text-red-400">콤보 중단 조건</h3>
                  </div>
                  <div className="pl-11 space-y-2 text-sm">
                    <p>• 다른 적을 공격하면 콤보 종료</p>
                    <p>• 원거리 무기 사용자가 나오면 종료</p>
                    <p>• 방어/스킬을 쓰면 종료</p>
                    <p>• HP 0이거나 행동 불가 상태면 스킵</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 콤보 데미지 계산 */}
            <div
              id="combo-calculation"
              className="bg-bg-secondary rounded-lg p-5 border border-border scroll-mt-6"
            >
              <h2 className="text-xl font-bold mb-4 text-accent">💥 콤보 데미지 계산</h2>

              <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <p className="font-bold text-yellow-400 mb-2">핵심 원리</p>
                <p className="text-sm text-text-secondary">
                  각자의 데미지를 <strong>개별 계산</strong>한 후 <strong>누적</strong>하여, 마지막
                  사람 차례에 <strong>한 번에</strong> 적용합니다!
                </p>
              </div>

              <div className="space-y-4">
                {/* 단계별 설명 */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded">
                    <span className="text-xl">①</span>
                    <div className="flex-1">
                      <p className="font-bold text-accent">A의 데미지 계산</p>
                      <p className="text-sm text-text-secondary">
                        공격력 200 vs 방어력 100 → 속성 보정 1.2배 → 크리티컬! →{' '}
                        <strong className="text-yellow-400">336 데미지</strong>
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">AllDamage = 336</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded">
                    <span className="text-xl">②</span>
                    <div className="flex-1">
                      <p className="font-bold text-accent">B의 데미지 계산</p>
                      <p className="text-sm text-text-secondary">
                        공격력 180 vs 방어력 100 → 속성 보정 1.5배 → 일반 →{' '}
                        <strong className="text-blue-400">270 데미지</strong>
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">AllDamage = 336 + 270 = 606</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-bg-tertiary rounded">
                    <span className="text-xl">③</span>
                    <div className="flex-1">
                      <p className="font-bold text-accent">C의 데미지 계산 (마지막)</p>
                      <p className="text-sm text-text-secondary">
                        공격력 220 vs 방어력 100 → 속성 보정 1.0배 → 일반 →{' '}
                        <strong className="text-green-400">220 데미지</strong>
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">AllDamage = 606 + 220 = 826</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded">
                    <span className="text-2xl">💥</span>
                    <div className="flex-1">
                      <p className="font-bold text-purple-400 text-lg">최종 데미지 적용</p>
                      <p className="text-sm text-text-secondary mt-1">
                        C의 차례에 <strong className="text-accent text-xl">826 데미지</strong>를 한
                        번에 적용!
                      </p>
                      <p className="text-xs text-text-tertiary mt-2">
                        <strong className="text-red-400">회피 불가</strong> → 적 HP 1000 → 174
                      </p>
                    </div>
                  </div>
                </div>

                {/* 특징 */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                    <p className="font-bold text-green-400 mb-2">✅ 크리티컬</p>
                    <p className="text-sm text-text-secondary">
                      각자 독립적으로 판정! A만 크리티컬 나면 A의 데미지만 1.4배
                    </p>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="font-bold text-blue-400 mb-2">✅ 속성 보정</p>
                    <p className="text-sm text-text-secondary">
                      각자의 속성으로 독립 계산! A는 1.2배, B는 1.5배 가능
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="font-bold text-red-400 mb-2">🚫 회피 불가</p>
                    <p className="text-sm text-text-secondary">
                      콤보 공격은 <strong className="text-red-400">회피 판정이 없음</strong> →
                      반드시 명중!
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="font-bold text-red-400 mb-2">⚠️ 반격</p>
                    <p className="text-sm text-text-secondary">
                      마지막에 1회만 판정! 반격은 마지막 공격자에게만 적용
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 콤보 vs 일반 공격 */}
            <div
              id="combo-comparison"
              className="bg-bg-secondary rounded-lg p-5 border border-border scroll-mt-6"
            >
              <h2 className="text-xl font-bold mb-4 text-accent">⚔️ 콤보 vs 일반 공격 비교</h2>

              <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }} onTouchStart={handleHorizontalTouchStart} onTouchMove={handleHorizontalTouchMove} onTouchEnd={handleHorizontalTouchEnd}>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-bg-tertiary">
                      <th className="p-3 border border-border text-left">항목</th>
                      <th className="p-3 border border-border text-center">일반 공격</th>
                      <th className="p-3 border border-border text-center">콤보 공격</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-border font-bold">발동 확률</td>
                      <td className="p-3 border border-border text-center">없음</td>
                      <td className="p-3 border border-border text-center text-yellow-400">
                        플레이어 50% / 적 20%
                      </td>
                    </tr>
                    <tr className="bg-bg-tertiary">
                      <td className="p-3 border border-border font-bold">최소 인원</td>
                      <td className="p-3 border border-border text-center">1명</td>
                      <td className="p-3 border border-border text-center text-accent">2명</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-border font-bold">최대 인원</td>
                      <td className="p-3 border border-border text-center">1명</td>
                      <td className="p-3 border border-border text-center text-accent">5명</td>
                    </tr>
                    <tr className="bg-bg-tertiary">
                      <td className="p-3 border border-border font-bold">무기 제한</td>
                      <td className="p-3 border border-border text-center">없음</td>
                      <td className="p-3 border border-border text-center text-red-400">
                        근접 무기만
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-border font-bold">데미지 적용</td>
                      <td className="p-3 border border-border text-center">즉시</td>
                      <td className="p-3 border border-border text-center text-purple-400">
                        누적 후 한 번에
                      </td>
                    </tr>
                    <tr className="bg-bg-tertiary">
                      <td className="p-3 border border-border font-bold">회피 판정</td>
                      <td className="p-3 border border-border text-center">공격마다 1회</td>
                      <td className="p-3 border border-border text-center text-red-400 font-bold">
                        불가능 (반드시 명중)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-border font-bold">반격 판정</td>
                      <td className="p-3 border border-border text-center">공격마다 1회</td>
                      <td className="p-3 border border-border text-center text-green-400">
                        전체에 대해 1회만
                      </td>
                    </tr>
                    <tr className="bg-bg-tertiary">
                      <td className="p-3 border border-border font-bold">크리티컬</td>
                      <td className="p-3 border border-border text-center">1회 판정</td>
                      <td className="p-3 border border-border text-center text-blue-400">
                        각자 독립 판정
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-border font-bold">속성 보정</td>
                      <td className="p-3 border border-border text-center">1회 적용</td>
                      <td className="p-3 border border-border text-center text-blue-400">
                        각자 독립 적용
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 전략 팁 */}
            <div
              id="combo-strategy"
              className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-5 border border-green-500/50 scroll-mt-6"
            >
              <h2 className="text-xl font-bold mb-4 text-green-400">💡 콤보 활용 전략</h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <p className="font-bold text-accent mb-1">반드시 명중하는 강력한 공격!</p>
                    <p className="text-sm text-text-secondary">
                      콤보는 <strong className="text-red-400">회피 불가</strong>! 일반 공격과 달리
                      반드시 명중하므로 큰 데미지를 안정적으로 넣을 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold text-red-400 mb-1">DEX 관리가 생명! (매우 중요)</p>
                    <p className="text-sm text-text-secondary">
                      <strong className="text-yellow-400">적이 중간에 끼면 콤보가 끊깁니다!</strong>
                      <br />
                      예: 우리(200) → <span className="text-red-400">적(185)</span> → 우리(170) →
                      콤보 불가!
                      <br />
                      <strong className="text-green-400">해결책:</strong> 우리팀의 DEX를 모두 적보다
                      높게 만들거나, 모두 낮게 만들어 연속 공격!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <p className="font-bold text-accent mb-1">속성 다양화</p>
                    <p className="text-sm text-text-secondary">
                      각자 독립 계산이므로 다양한 속성을 가진 파티가 유리! 불, 물, 지, 바람을 골고루
                      배치하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold text-red-400 mb-1">반격/흡수/반사 주의</p>
                    <p className="text-sm text-text-secondary">
                      콤보는 회피는 불가능하지만 반격, 흡수, 반사는 가능! 반격/흡수/반사 능력이 있는
                      적에게는 주의하세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold text-red-400 mb-1">근접 무기 필수</p>
                    <p className="text-sm text-text-secondary">
                      활, 투척 무기는 콤보 불가! 콤보를 노린다면 반드시 근접 무기를 장착하세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 실전 상황 분석 */}
            <div
              id="combo-cases"
              className="bg-bg-secondary rounded-lg p-5 border border-border scroll-mt-6"
            >
              <h2 className="text-xl font-bold mb-4 text-accent">
                📊 실전 상황 분석: 콤보 가능 여부 판단
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                다양한 전투 상황에서 콤보 성공/실패 케이스를 분석하여 실전 대처 능력을 향상시키세요.
              </p>

              <div className="space-y-4">
                {/* 성공 예시 */}
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                  <h3 className="text-lg font-bold text-green-400 mb-3">
                    ✅ 성공 사례: 완벽한 5명 콤보
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      파티: A(DEX 200), B(DEX 180), C(DEX 170), D(DEX 160), E(DEX 150)
                      <br />
                      모두 근접 무기, 적 X (HP 3000) 공격
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. A가 50% 체크 성공 → 콤보 시작 (대기)</p>
                      <p>2. B가 조인 → A, B 콤보 성립 (ComboId=2)</p>
                      <p>3. C가 조인 → 3명 콤보</p>
                      <p>4. D가 조인 → 4명 콤보</p>
                      <p>5. E가 조인 → 5명 콤보!</p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      A(300) + B(280크리) + C(260) + D(240) + E(220) ={' '}
                      <strong className="text-green-400 text-lg">1300 데미지!</strong>
                      <br />
                      <strong className="text-red-400">회피 불가!</strong> → 반드시 명중 → 적 HP
                      3000 → 1700
                    </p>
                  </div>
                </div>

                {/* DEX 차이 예시 - 사용자 질문 */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <h3 className="text-lg font-bold text-blue-400 mb-3">
                    🎯 특수 케이스: 적의 DEX가 더 높을 때
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀: A(DEX 200), B(DEX 100), C(DEX 50), D(DEX 20), E(DEX 10)
                      <br />
                      적: X(DEX 300) ← 모두보다 빠름!
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-yellow-400">
                        X(300) → A(200) → B(100) → C(50) → D(20) → E(10)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 적 X가 먼저 공격 (우리를 공격)</p>
                      <p>2. A가 X를 공격 → 50% 체크 → 성공! (대기 상태)</p>
                      <p>
                        3. B가 X를 공격 → 조건 만족 →{' '}
                        <strong className="text-green-400">콤보 성립!</strong>
                      </p>
                      <p>4. C, D, E도 조건 맞으면 계속 참여 가능</p>
                    </div>

                    <p className="font-bold text-accent mt-3">결론:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-green-400">✅ 콤보 가능합니다!</strong>
                      <br />
                      DEX는 단지 <strong className="text-yellow-400">행동 순서만</strong>{' '}
                      결정합니다.
                      <br />
                      적이 먼저 행동하더라도, 우리가 같은 적을 연속으로 공격하면 콤보가 성립합니다!
                    </p>
                  </div>
                </div>

                {/* 10 vs 10 예시 */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded">
                  <h3 className="text-lg font-bold text-purple-400 mb-3">
                    🐾 특별 케이스: 캐릭터와 펫 혼합 콤보
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      10 vs 10 전투 (캐릭 5명 + 펫 5마리 vs 적 5명 + 펫 5마리)
                      <br />
                      전투 순서: 캐릭A(DEX 200) → 펫B(DEX 180) → 캐릭C(DEX 150) → 펫A(DEX 120) →
                      캐릭B(DEX 100)
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 캐릭A가 적X 공격 → 50% 체크 → 성공! (대기)</p>
                      <p>
                        2. 펫B가 적X 공격 →{' '}
                        <strong className="text-green-400">50% 아님! 확률 없이 조건만 체크!</strong>{' '}
                        → 조인!
                      </p>
                      <p>3. 캐릭C가 적X 공격 → 조건 만족 → 조인!</p>
                      <p>4. 펫A가 적X 공격 → 조건 만족 → 조인!</p>
                      <p>5. 캐릭B가 적X 공격 → 조건 만족 → 조인!</p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-purple-400 text-lg">
                        캐릭-펫-캐릭-펫-캐릭 5명 콤보 성립!
                      </strong>
                      <br />
                      캐릭A(350) + 펫B(280) + 캐릭C(320) + 펫A(250) + 캐릭B(300) ={' '}
                      <strong className="text-green-400">1500 데미지!</strong>
                      <br />
                      <strong className="text-red-400">회피 불가</strong> → 반드시 명중!
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 핵심: 캐릭터와 펫은 완전히 동등! 같은 편(side)이면 누구든 콤보 가능!
                    </p>
                  </div>
                </div>

                {/* DEX 실패 예시 - 수정된 케이스 */}
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded">
                  <h3 className="text-lg font-bold text-orange-400 mb-3">
                    ⚠️ 부분 성공: 적이 중간에 끼는 경우
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 200, 190, 180, 170, 160
                      <br />
                      적팀: DEX 195 (5마리 모두 동일)
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-yellow-400">
                        200(우리) → 195(적1) → 195(적2) → 195(적3) → 195(적4) → 195(적5) → 190(우리)
                        → 180(우리) → 170(우리) → 160(우리)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 우리1(200) → 50% 성공 → 대기 (ComboId=2)</p>
                      <p>
                        2. <strong className="text-red-400">적1(195) 공격</strong> → side != oldside
                        → <strong className="text-red-400">콤보 종료!</strong>
                      </p>
                      <p>3. 적2(195) → 20% 체크 → 성공 가정 → 대기 (ComboId=3)</p>
                      <p>
                        4. 적3, 적4, 적5 → 조건 만족 →{' '}
                        <strong className="text-green-400">적 4명 콤보!</strong> (ComboId=3)
                      </p>
                      <p>5. 우리2(190) → 새로 50% 체크 → 성공! → 대기 (ComboId=4)</p>
                      <p>
                        6. 우리3, 우리4, 우리5 →{' '}
                        <strong className="text-green-400">우리 4명 콤보!</strong> (ComboId=4)
                      </p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-cyan-400">한 턴에 3개의 독립적인 콤보 시도!</strong>
                      <br />
                      • 우리1(200): 일반 공격 (ComboId=2 불발)
                      <br />
                      • 적팀: 4명 콤보 (ComboId=3)
                      <br />
                      • 우리팀: 4명 콤보 (ComboId=4)
                      <br />
                      <strong className="text-yellow-400">
                        적이 끼면 각 그룹이 독립적으로 콤보 형성!
                      </strong>
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 핵심: 적이 중간에 끼어도 그 뒤에서 새 콤보 시작 가능! 각 콤보는 독립적인
                      ComboId를 가짐!
                      <br />
                      ⚠️ 최적화: 우리팀 전원을 195 이상 또는 이하로 맞춰야 5명 콤보 가능!
                    </p>
                  </div>
                </div>

                {/* 불발 예시 */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <h3 className="text-lg font-bold text-yellow-400 mb-3">
                    ⚠️ 불발 사례: 타겟 불일치
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      A가 적 X 공격, B가 적 Y 공격 (다른 적 선택)
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. A가 50% 체크 성공 → 콤보 시작 (대기)</p>
                      <p>2. B가 다른 적(Y)을 공격 → enemy 불일치 → 콤보 종료</p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      A, B 모두 일반 공격으로 처리
                      <br />
                      A의 확률 성공은 의미 없어짐
                    </p>
                  </div>
                </div>

                {/* 케이스 1: 다수 적 상황 */}
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded">
                  <h3 className="text-lg font-bold text-orange-400 mb-3">
                    🎯 케이스 1: 적이 2마리 이상일 때
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 180, 170, 160, 150, 140 (모두 근접 무기)
                      <br />적 X(DEX 100, HP 2000), 적 Y(DEX 90, HP 1500)
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-yellow-400">
                        180 → 170 → 160 → 150 → 140 → X(100) → Y(90)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">판단:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-green-400">✅ 콤보 완벽 가능!</strong>
                      <br />
                      우리팀 5명이 모두 적보다 빠르므로 연속 공격 가능
                      <br />
                      <strong className="text-yellow-400">전략:</strong> 약한 적 Y를 5명이 집중
                      공격하여 한 방에 제거!
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 팁: 다수 적 상황에서는 약한 적부터 제거하여 피해 최소화!
                    </p>
                  </div>
                </div>

                {/* 케이스 2: DEX가 엇갈린 상황 */}
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded">
                  <h3 className="text-lg font-bold text-orange-400 mb-3">
                    ⚠️ 케이스 2: DEX가 엇갈려도 부분 콤보 가능!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 250, 180, 120, 80, 50
                      <br />적 X(DEX 200), Y(DEX 150), Z(DEX 100)
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-red-400">
                        250(우리1) → 200(적X) → 180(우리2) → 150(적Y) → 120(우리3) → 100(적Z) →
                        80(우리4) → 50(우리5)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 우리1(250) → 50% 성공 → 대기 (ComboId=2)</p>
                      <p>2. 적X(200) → side 다름 → 콤보 종료!</p>
                      <p>3. 우리2(180) → 새로 50% 체크 → 성공 → 대기 (ComboId=3)</p>
                      <p>4. 적Y(150) → side 다름 → 콤보 종료!</p>
                      <p>5. 우리3(120) → 새로 50% 체크 → 성공 → 대기 (ComboId=4)</p>
                      <p>6. 적Z(100) → side 다름 → 콤보 종료!</p>
                      <p>7. 우리4(80) → 새로 50% 체크 → 성공 → 대기 (ComboId=5)</p>
                      <p>
                        8. 우리5(50) → 조건 만족 →{' '}
                        <strong className="text-green-400">2명 콤보 성립!</strong>
                      </p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-orange-400">
                        ⚠️ 5명 콤보는 불가능하지만 부분 콤보 가능!
                      </strong>
                      <br />
                      • 우리1: 일반 공격 (ComboId=2 불발)
                      <br />
                      • 우리2: 일반 공격 (ComboId=3 불발)
                      <br />
                      • 우리3: 일반 공격 (ComboId=4 불발)
                      <br />• <strong className="text-green-400">우리4+5: 2명 콤보!</strong>{' '}
                      (ComboId=5)
                      <br />
                      <strong className="text-yellow-400">
                        확률에 따라 여러 번의 콤보 시도 기회!
                      </strong>
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 핵심: 적이 끼어도 각 구간마다 새로운 콤보 시도 가능!
                      <br />
                      ⚠️ 최적화: DEX를 200 이상 또는 100 이하로 맞춰야 5명 콤보 가능!
                    </p>
                  </div>
                </div>

                {/* 케이스 3: 원거리 무기 혼합 */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
                  <h3 className="text-lg font-bold text-red-400 mb-3">
                    ❌ 케이스 3: 원거리 무기 착용자가 끼는 경우
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 200(근접), 180(활 장착!), 170(근접), 160(근접), 150(근접)
                      <br />적 X(DEX 100, 약함)
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      200 → 180(활) → 170 → 160 → 150 → X(100)
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 200 DEX(근접)가 X 공격 → 50% 성공 → 대기</p>
                      <p>
                        2. 180 DEX(활)가 X 공격 →{' '}
                        <strong className="text-red-400">armtype == 1</strong> → 콤보 종료!
                      </p>
                      <p>3. 170 DEX → 일반 공격...</p>
                    </div>

                    <p className="font-bold text-accent mt-3">판단:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-red-400">❌ 2명 콤보 불가! 모두 일반 공격!</strong>
                      <br />
                      원거리 무기 착용자가 중간에 끼면 콤보가 끊김
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      ⚠️ 해결: 활 착용자는 DEX를 가장 낮게 만들어 마지막에 행동하게 하거나, 근접
                      무기로 교체!
                    </p>
                  </div>
                </div>

                {/* 케이스 4: 방어 명령 사용자 */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
                  <h3 className="text-lg font-bold text-red-400 mb-3">
                    ❌ 케이스 4: 방어 명령으로 콤보 끊기기 (순서 중요!)
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황 A: 가드가 먼저 행동 (✅ 콤보 가능)</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 50(가드), 40(공격), 30(공격)
                      <br />적 X(DEX 20)
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 50 DEX 가드 → 콤보 시작 안됨 (com != ATTACK)</p>
                      <p>2. 40 DEX 공격 → 50% 체크 → 성공! → 대기</p>
                      <p>
                        3. 30 DEX 공격 → 조건 만족 →{' '}
                        <strong className="text-green-400">콤보 성립!</strong>
                      </p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-green-400">✅ 40+30 2명 콤보 성공!</strong>
                      <br />
                      가드는 콤보에 참여 안하지만, 나머지끼리 콤보 가능!
                    </p>

                    <div className="mt-4 pt-4 border-t border-red-500/30">
                      <p className="font-bold text-accent">
                        상황 B: 가드가 중간에 끼는 경우 (❌ 콤보 실패)
                      </p>
                      <p className="text-text-secondary pl-4">
                        우리팀 DEX: 50(공격), 40(가드), 30(공격)
                        <br />적 X(DEX 20)
                      </p>

                      <p className="font-bold text-accent mt-3">진행:</p>
                      <div className="pl-4 space-y-1 text-text-secondary">
                        <p>1. 50 DEX 공격 → 50% 성공 → 대기 (ComboId=2)</p>
                        <p>
                          2. 40 DEX 가드 →{' '}
                          <strong className="text-red-400">com != ATTACK → 콤보 종료!</strong>
                        </p>
                        <p>
                          3. 30 DEX 공격 → <strong className="text-cyan-400">새로 50% 체크!</strong>{' '}
                          → 실패 or 성공 (ComboId=3)
                        </p>
                      </div>

                      <p className="font-bold text-accent mt-3">결과:</p>
                      <p className="text-text-secondary pl-4">
                        <strong className="text-orange-400">
                          ⚠️ 50 DEX는 일반 공격! (ComboId=2 불발)
                        </strong>
                        <br />
                        40 DEX는 가드
                        <br />
                        30 DEX는 50% 확률에 따라:
                        <br />
                        • 성공 시: 혼자 일반 공격 (2명 이상이어야 콤보)
                        <br />
                        • 실패 시: 일반 공격
                        <br />
                        <strong className="text-yellow-400">
                          💡 하지만 30 DEX 뒤에 더 있다면 새 콤보 가능!
                        </strong>
                      </p>
                    </div>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      ⚠️ 핵심: 가드/스킬/주술을 쓸 사람은 DEX를 가장 높게(맨 앞) 또는 가장 낮게(맨
                      뒤) 배치!
                      <br />
                      💡 중간에 끼면 콤보가 끊겨서 큰 피해!
                    </p>
                  </div>
                </div>

                {/* 케이스 5: 확률 실패 */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <h3 className="text-lg font-bold text-yellow-400 mb-3">
                    🎲 케이스 5: 첫 번째 확률 실패
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      완벽한 조건! 우리팀 DEX 모두 적보다 높음, 모두 근접 무기, 같은 적 공격
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>
                        1. 첫 번째 캐릭터 공격 → 50% 체크 →{' '}
                        <strong className="text-red-400">실패!</strong>
                      </p>
                      <p>2. 일반 공격으로 처리</p>
                      <p>3. 두 번째 캐릭터 → 일반 공격 (콤보 시작 안됨)</p>
                    </div>

                    <p className="font-bold text-accent mt-3">판단:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-yellow-400">⚠️ 운이 나쁘면 콤보 불발!</strong>
                      <br />
                      조건이 완벽해도 첫 번째 확률을 뚫어야 함<br />
                      평균적으로 2턴에 1번 콤보 기회 (50% 확률)
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 팁: 확률이므로 여러 전투에서 평균적으로 50% 성공!
                    </p>
                  </div>
                </div>

                {/* 케이스 6: 적 펫 포함 */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <h3 className="text-lg font-bold text-blue-400 mb-3">
                    🐾 케이스 6: 적도 펫이 있는 10 vs 10
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리 캐릭A(DEX 200) + 우리 펫들(170, 160, 150, 140)
                      <br />적 캐릭X(DEX 190) + 적 펫Y(DEX 180)
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-red-400">
                        200(우리) → 190(적X) → 180(적Y펫) → 170(우리) → 160(우리)...
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">판단:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-red-400">❌ 콤보 불가!</strong>
                      <br />적 캐릭과 적 펫이 우리 사이에 2명 끼면 콤보 끊김
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      ⚠️ 해결: 우리 펫들의 DEX를 190 이상으로 올려서 적보다 빠르게!
                    </p>
                  </div>
                </div>

                {/* 케이스 7: 부분 성공 */}
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                  <h3 className="text-lg font-bold text-green-400 mb-3">
                    ✅ 케이스 7: 2~3명 콤보도 충분히 강력!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 220, 210 (근접), 200(활 장착), 190, 180
                      <br />적 X(DEX 100)
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 220 DEX → X 공격 → 50% 성공 → 대기</p>
                      <p>
                        2. 210 DEX → X 공격 → 조인 →{' '}
                        <strong className="text-green-400">2명 콤보 성립!</strong>
                      </p>
                      <p>3. 200 DEX(활) → X 공격 → 원거리 무기 → 콤보 종료</p>
                      <p>4. 190, 180은 일반 공격</p>
                    </div>

                    <p className="font-bold text-accent mt-3">판단:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-green-400">✅ 2명 콤보 성공!</strong>
                      <br />
                      5명 콤보가 아니어도{' '}
                      <strong className="text-yellow-400">회피 불가 + 데미지 집중</strong>은 여전히
                      강력!
                      <br />
                      220(400) + 210(380) = <strong className="text-green-400">
                        780 데미지
                      </strong>{' '}
                      반드시 명중!
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 중요: 5명 콤보에 집착하지 말고, 2~3명 콤보도 충분히 활용!
                    </p>
                  </div>
                </div>

                {/* 케이스 8: 최악의 상황에서 역전 */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded">
                  <h3 className="text-lg font-bold text-purple-400 mb-3">
                    🎯 케이스 8: DEX가 불리해도 전략으로 극복
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 모두 100~150 (약함)
                      <br />
                      적들 DEX: 모두 160~200 (빠름!)
                      <br />
                      하지만 우리 전원 근접 무기, 적 X는 혼자!
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-yellow-400">
                        적들 → 우리(150) → 우리(140) → 우리(130) → 우리(120) → 우리(100)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">전략:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 적들의 공격을 모두 받음 (어쩔 수 없음)</p>
                      <p>2. 우리 150 DEX → 적X 공격 → 50% 성공 → 대기</p>
                      <p>
                        3. 우리 140, 130, 120, 100 → 모두 적X 공격 →{' '}
                        <strong className="text-green-400">5명 콤보!</strong>
                      </p>
                      <p>4. 누적 데미지로 적 X 제거!</p>
                    </div>

                    <p className="font-bold text-accent mt-3">판단:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-green-400">✅ 콤보 가능!</strong>
                      <br />
                      적들이 먼저 공격하지만,{' '}
                      <strong className="text-yellow-400">우리끼리 연속으로 행동</strong>하면 콤보
                      성립!
                      <br />
                      DEX가 낮아도 전원 같은 범위에 있으면 오히려 유리!
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 핵심: DEX가 낮다고 포기하지 마! 우리끼리 뭉쳐있으면 콤보 가능!
                    </p>
                  </div>
                </div>

                {/* 케이스 9: 동일 DEX에서 여러 콤보 */}
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded">
                  <h3 className="text-lg font-bold text-cyan-400 mb-3">
                    🔥 케이스 9: 한 턴에 여러 콤보 동시 발생!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 5명 모두 DEX 50 (동일!)
                      <br />
                      순서: 캐릭1 → 캐릭2 → 캐릭5(가드) → 캐릭3 → 캐릭4
                      <br />
                      (DEX 같으면 sequence 값으로 순서 결정)
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 캐릭1 공격 → 50% 성공 → 대기 (ComboId=2)</p>
                      <p>
                        2. 캐릭2 공격 → 조건 만족 →{' '}
                        <strong className="text-green-400">첫 번째 콤보 성립!</strong> (ComboId=2)
                      </p>
                      <p>
                        3. 캐릭5 가드 → com != ATTACK →{' '}
                        <strong className="text-red-400">콤보 종료!</strong>
                      </p>
                      <p>4. 캐릭3 공격 → 새로 50% 체크 → 성공! → 대기 (ComboId=3)</p>
                      <p>
                        5. 캐릭4 공격 → 조건 만족 →{' '}
                        <strong className="text-green-400">두 번째 콤보 성립!</strong> (ComboId=3)
                      </p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-cyan-400 text-lg">
                        한 턴에 2개의 콤보가 동시 발생!
                      </strong>
                      <br />• <strong className="text-green-400">첫 번째 콤보:</strong> 캐릭1+캐릭2
                      (ComboId=2) → 데미지 600
                      <br />• <strong className="text-green-400">두 번째 콤보:</strong> 캐릭3+캐릭4
                      (ComboId=3) → 데미지 550
                      <br />
                      • 캐릭5는 가드로 방어력 증가
                      <br />총 1150 데미지 + 1명 방어!
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      🔥 놀라운 발견: ComboId가 계속 증가하므로 한 턴에 여러 독립적인 콤보 가능!
                      <br />
                      💡 활용: DEX가 같을 때 의도적으로 가드/스킬을 중간에 배치하여 콤보를 나눌 수
                      있음!
                    </p>
                  </div>
                </div>

                {/* 케이스 10: 적이 끼는데 뒤에서 콤보 재시작 */}
                <div className="p-4 bg-lime-500/10 border border-lime-500/30 rounded">
                  <h3 className="text-lg font-bold text-lime-400 mb-3">
                    🔄 케이스 10: 적이 끼어도 새 콤보 시작!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 50, 40, 30, 20, 10
                      <br />적 X: DEX 45
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-yellow-400">
                        50(우리1) → 45(적X) → 40(우리2) → 30(우리3) → 20(우리4) → 10(우리5)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 우리1(50) → 50% 성공 → 대기 (ComboId=2)</p>
                      <p>
                        2. <strong className="text-red-400">적X(45) 공격</strong> → side != oldside
                        → <strong className="text-red-400">콤보 종료!</strong>
                      </p>
                      <p>
                        3. 우리2(40) → <strong className="text-cyan-400">새로 50% 체크!</strong> →
                        성공! → 대기 (ComboId=3)
                      </p>
                      <p>4. 우리3(30) → 조건 만족 → 콤보 합류!</p>
                      <p>5. 우리4(20) → 조건 만족 → 콤보 합류!</p>
                      <p>6. 우리5(10) → 조건 만족 → 콤보 합류!</p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-lime-400 text-lg">2개의 독립적인 콤보 시도!</strong>
                      <br />
                      • 우리1(50): 일반 공격 (ComboId=2 불발)
                      <br />
                      • 적X(45): 일반 공격
                      <br />• <strong className="text-green-400">
                        우리2+3+4+5: 4명 콤보!
                      </strong>{' '}
                      (ComboId=3)
                      <br />총 데미지: 우리1(300) + 우리2~5 콤보(1100) ={' '}
                      <strong className="text-green-400">1400!</strong>
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 핵심: 첫 번째가 실패해도 두 번째부터 다시 콤보 시작 가능!
                      <br />
                      🎲 각 턴마다 독립적으로 50% 확률 체크하므로 여러 기회!
                    </p>
                  </div>
                </div>

                {/* 케이스 11: 가드가 중간에 끼어도 뒤에서 콤보 */}
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded">
                  <h3 className="text-lg font-bold text-indigo-400 mb-3">
                    🛡️ 케이스 11: 가드 후 재결집!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 50(공격), 40(공격), 30(가드), 20(공격), 10(공격)
                      <br />적 X: DEX 5
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-yellow-400">
                        50(우리1) → 40(우리2) → 30(우리3 가드) → 20(우리4) → 10(우리5) → 5(적X)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 우리1(50) → 50% 성공 → 대기 (ComboId=2)</p>
                      <p>
                        2. 우리2(40) → 조건 만족 →{' '}
                        <strong className="text-green-400">2명 콤보 성립!</strong>
                      </p>
                      <p>
                        3. 우리3(30) → <strong className="text-red-400">가드!</strong> → com !=
                        ATTACK → <strong className="text-red-400">콤보 종료!</strong>
                      </p>
                      <p>
                        4. 우리4(20) → <strong className="text-cyan-400">새로 50% 체크!</strong> →
                        성공! → 대기 (ComboId=3)
                      </p>
                      <p>5. 우리5(10) → 조건 만족 → 콤보 합류!</p>
                      <p>6. 적X → 일반 공격</p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-indigo-400 text-lg">3개의 독립적인 행동!</strong>
                      <br />• <strong className="text-green-400">우리1+2: 2명 콤보!</strong>{' '}
                      (ComboId=2) → 데미지 600
                      <br />
                      • 우리3: 가드 → 방어력 증가
                      <br />• <strong className="text-green-400">우리4+5: 2명 콤보!</strong>{' '}
                      (ComboId=3) → 데미지 350
                      <br />총 950 데미지 + 1명 방어 체제!
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 핵심: 가드가 콤보를 끊어도 그 뒤에서 새 콤보 시작 가능!
                      <br />
                      🛡️ 전략: 가드를 중간에 배치해도 앞뒤로 콤보 형성 가능!
                      <br />
                      ⚠️ 주의: 각 콤보는 50% 확률을 독립적으로 통과해야 함!
                    </p>
                  </div>
                </div>

                {/* 케이스 12: 다중 타겟 그룹 콤보 */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded">
                  <h3 className="text-lg font-bold text-emerald-400 mb-3">
                    ✅ 케이스 12: 다중 타겟 - 그룹별 콤보 성공!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 50, 40, 30, 20, 10
                      <br />
                      적 A(HP 1000), 적 B(HP 1500)
                      <br />
                      타겟 선택: 50→A, 40→A, 30→B, 20→B, 10→B
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-yellow-400">
                        50(→A) → 40(→A) → 30(→B) → 20(→B) → 10(→B)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 우리1(50) → A 공격 → 50% 성공 → 대기 (ComboId=2)</p>
                      <p>
                        2. 우리2(40) → A 공격 → enemy(A) == oldenemy(A) →{' '}
                        <strong className="text-green-400">콤보 합류!</strong>
                      </p>
                      <p>
                        3. 우리3(30) → B 공격 → enemy(B) != oldenemy(A) →{' '}
                        <strong className="text-red-400">콤보 종료!</strong>
                      </p>
                      <p className="ml-4">→ 새로 50% 체크 → 성공! → 대기 (ComboId=3)</p>
                      <p>
                        4. 우리4(20) → B 공격 → enemy(B) == oldenemy(B) →{' '}
                        <strong className="text-green-400">콤보 합류!</strong>
                      </p>
                      <p>
                        5. 우리5(10) → B 공격 → enemy(B) == oldenemy(B) →{' '}
                        <strong className="text-green-400">콤보 합류!</strong>
                      </p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-emerald-400 text-lg">한 턴에 2개의 콤보 성공!</strong>
                      <br />• <strong className="text-green-400">그룹 1 (ComboId=2):</strong> 50+40
                      → A 타겟 = <strong className="text-green-400">580 데미지</strong>
                      <br />• <strong className="text-green-400">그룹 2 (ComboId=3):</strong>{' '}
                      30+20+10 → B 타겟 = <strong className="text-green-400">720 데미지</strong>
                      <br />총 <strong className="text-yellow-400">1300 데미지!</strong> (모두 회피
                      불가)
                      <br />적 A는 거의 죽음, 적 B도 절반 이하!
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 핵심: DEX 순서대로 그룹을 나누면 여러 타겟에 동시 콤보 가능!
                      <br />
                      🎯 전략: 약한 적을 먼저 제거하거나, 강한 적 2마리를 동시에 약화!
                      <br />✨ 연속성이 핵심: 같은 타겟을 연속으로 공격해야 그룹 형성!
                    </p>
                  </div>
                </div>

                {/* 케이스 13: 교차 타겟 실패 */}
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded">
                  <h3 className="text-lg font-bold text-red-400 mb-3">
                    ❌ 케이스 13: 교차 타겟 - 콤보 완전 실패!
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 50, 40, 30, 20, 10
                      <br />
                      적 A, 적 B<br />
                      타겟 선택: 50→A, 40→B, 30→A, 20→B, 10→A (교차!)
                    </p>

                    <p className="font-bold text-accent mt-3">전투 순서:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-red-400">
                        50(→A) → 40(→B) → 30(→A) → 20(→B) → 10(→A)
                      </strong>
                    </p>

                    <p className="font-bold text-accent mt-3">진행:</p>
                    <div className="pl-4 space-y-1 text-text-secondary">
                      <p>1. 우리1(50) → A 공격 → 50% 성공 → 대기 (ComboId=2)</p>
                      <p>
                        2. 우리2(40) → B 공격 →{' '}
                        <strong className="text-red-400">
                          enemy(B) != oldenemy(A) → 콤보 종료!
                        </strong>
                      </p>
                      <p className="ml-4">→ 50% 성공 → 대기 (ComboId=3)</p>
                      <p>
                        3. 우리3(30) → A 공격 →{' '}
                        <strong className="text-red-400">
                          enemy(A) != oldenemy(B) → 콤보 종료!
                        </strong>
                      </p>
                      <p className="ml-4">→ 50% 성공 → 대기 (ComboId=4)</p>
                      <p>
                        4. 우리4(20) → B 공격 →{' '}
                        <strong className="text-red-400">
                          enemy(B) != oldenemy(A) → 콤보 종료!
                        </strong>
                      </p>
                      <p className="ml-4">→ 50% 성공 → 대기 (ComboId=5)</p>
                      <p>
                        5. 우리5(10) → A 공격 →{' '}
                        <strong className="text-red-400">
                          enemy(A) != oldenemy(B) → 콤보 종료!
                        </strong>
                      </p>
                      <p className="ml-4">→ 50% 성공해도 혼자 (2명 이상 필요!)</p>
                    </div>

                    <p className="font-bold text-accent mt-3">결과:</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-red-400 text-lg">
                        5개의 ComboId 생성, 모두 불발!
                      </strong>
                      <br />
                      • ComboId=2: 우리1만 → 1명 (콤보 불발)
                      <br />
                      • ComboId=3: 우리2만 → 1명 (콤보 불발)
                      <br />
                      • ComboId=4: 우리3만 → 1명 (콤보 불발)
                      <br />
                      • ComboId=5: 우리4만 → 1명 (콤보 불발)
                      <br />
                      • ComboId=6: 우리5만 → 1명 (콤보 불발)
                      <br />
                      <strong className="text-red-400">모두 일반 공격!</strong> (회피 가능 + 데미지
                      분산 = 최악!)
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      ⚠️ 치명적 실수: 타겟을 교차로 선택하면 절대 콤보 불가!
                      <br />
                      💡 해결: 같은 타겟을 연속으로 선택하여 그룹 형성!
                      <br />
                      🎯 올바른 예: A-A-B-B-B 또는 A-A-A-B-B (그룹별로!)
                    </p>
                  </div>
                </div>

                {/* 케이스 14: 전략적 타겟 분배 */}
                <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded">
                  <h3 className="text-lg font-bold text-violet-400 mb-3">
                    🎯 케이스 14: 전략적 타겟 분배
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-accent">상황:</p>
                    <p className="text-text-secondary pl-4">
                      우리팀 DEX: 60, 50, 40, 30, 20
                      <br />
                      적 A(약함, HP 800), 적 B(강함, HP 2500)
                      <br />
                      전략: 약한 적 A를 우선 제거!
                    </p>

                    <p className="font-bold text-accent mt-3">타겟 선택 전략:</p>
                    <div className="pl-4 space-y-2 text-text-secondary">
                      <p>
                        <strong className="text-green-400">전략 1:</strong> 60→A, 50→A, 40→A | 30→B,
                        20→B
                      </p>
                      <p className="ml-4">
                        → 3명 콤보(A) = 850 데미지 →{' '}
                        <strong className="text-green-400">적 A 제거!</strong>
                      </p>
                      <p className="ml-4">→ 2명 콤보(B) = 550 데미지 → 적 B 약화</p>

                      <p className="mt-2">
                        <strong className="text-yellow-400">전략 2:</strong> 60→A, 50→A | 40→B,
                        30→B, 20→B
                      </p>
                      <p className="ml-4">→ 2명 콤보(A) = 600 데미지 → 적 A 거의 죽음</p>
                      <p className="ml-4">→ 3명 콤보(B) = 750 데미지 → 적 B 크게 약화</p>

                      <p className="mt-2">
                        <strong className="text-red-400">나쁜 전략:</strong> 60→A, 50→B, 40→A, 30→B,
                        20→A (교차)
                      </p>
                      <p className="ml-4">→ 모두 일반 공격 → 데미지 분산 + 회피 가능 = 최악!</p>
                    </div>

                    <p className="font-bold text-accent mt-3">최적 결과 (전략 1):</p>
                    <p className="text-text-secondary pl-4">
                      <strong className="text-violet-400 text-lg">1턴만에 적 1마리 제거!</strong>
                      <br />
                      • 적 A: 제거됨 → 다음 턴부터 공격 1명 감소
                      <br />
                      • 적 B: HP 1950 남음 → 2턴 안에 제거 가능
                      <br />
                      <strong className="text-green-400">피해 최소화 전략 성공!</strong>
                    </p>

                    <p className="font-bold text-yellow-400 mt-3 text-xs">
                      💡 핵심: 약한 적부터 제거하여 다음 턴 피해 감소!
                      <br />
                      🎯 그룹 구성: DEX 순서대로 타겟 그룹을 명확히 나누기!
                      <br />
                      ⚠️ 절대 금지: 타겟 교차 선택은 콤보 완전 불발!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 계산기 탭 */}
        {activeTab === 'calculator' && (
          <div className="space-y-4">
            {/* 서브탭 네비게이션 */}
            <div
              className="flex gap-2 justify-center mb-4 overflow-x-auto overflow-y-hidden"
              style={{ touchAction: 'pan-x' }}
              onTouchStart={handleHorizontalTouchStart}
              onTouchMove={handleHorizontalTouchMove}
              onTouchEnd={handleHorizontalTouchEnd}
            >
              <button
                onClick={() => setCalculatorSubTab('damage')}
                className={`px-4 py-1.5 text-sm rounded-full transition-all ${
                  calculatorSubTab === 'damage'
                    ? 'bg-accent text-white font-bold shadow-lg'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary border border-border'
                }`}
              >
                ⚔️ 전투 시뮬레이션
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

            {/* 전투 시뮬레이션 서브탭 */}
            {calculatorSubTab === 'damage' && (
              <>
                {/* 전투 타입 선택 */}
                <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg mb-4">
                  <h2 className="text-xl font-bold mb-3 text-purple-500 flex items-center gap-2">
                    <span>⚔️</span> 전투 타입
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { atk: 'PLAYER', def: 'PLAYER', label: '유저 → 유저', mod: '' },
                      { atk: 'PLAYER', def: 'PET', label: '유저 → 방어자 펫', mod: '방어 DEX ×0.8' },
                      { atk: 'PET', def: 'PLAYER', label: '공격자 펫 → 유저', mod: '공격 DEX ×0.6' },
                      { atk: 'PET', def: 'PET', label: '펫 → 펫', mod: '' },
                    ].map(type => (
                      <button
                        key={`${type.atk}-${type.def}`}
                        onClick={() =>
                          setBattleOptions({
                            ...battleOptions,
                            attackerType: type.atk as UnitType,
                            defenderType: type.def as UnitType,
                          })
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          battleOptions.attackerType === type.atk &&
                          battleOptions.defenderType === type.def
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary border border-border'
                        }`}
                      >
                        {type.label}
                        {type.mod && <span className="ml-1 text-xs text-yellow-300">({type.mod})</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 공격자 입력 */}
                <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg">
                  <h2 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
                    <span>🗡️</span> 공격
                  </h2>

                  {/* 기본 스탯 */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
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
                    <div>
                      <label className="block text-sm font-bold mb-1 text-yellow-500">
                        운 (0~5)
                      </label>
                      <input
                        type="number"
                        min={BATTLE_CONSTANTS.LUCK_MIN}
                        max={BATTLE_CONSTANTS.LUCK_MAX}
                        value={attacker.luck}
                        onChange={e => {
                          const val = Math.max(BATTLE_CONSTANTS.LUCK_MIN, Math.min(BATTLE_CONSTANTS.LUCK_MAX, Number(e.target.value)));
                          setAttacker({ ...attacker, luck: val });
                        }}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-yellow-500/50 rounded text-text-primary"
                        placeholder="0"
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

                {/* 스왑 버튼 */}
                <div className="flex justify-center -my-2 relative z-10">
                  <button
                    onClick={handleSwapAttackerDefender}
                    className="group bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white font-bold p-3 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 active:scale-95"
                    title="공격자와 방어자 정보 교환"
                  >
                    <svg
                      className="w-6 h-6 transform group-hover:rotate-180 transition-transform duration-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  </button>
                </div>

                {/* 방어자 입력 */}
                <div className="bg-bg-secondary rounded-lg p-4 md:p-5 border border-border shadow-lg">
                  <h2 className="text-xl font-bold mb-4 text-blue-500 flex items-center gap-2">
                    <span>🛡️</span> 방어
                  </h2>

                  {/* 기본 스탯 */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
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
                    <div>
                      <label className="block text-sm font-bold mb-1 text-yellow-500">
                        운 (0~5)
                      </label>
                      <input
                        type="number"
                        min={BATTLE_CONSTANTS.LUCK_MIN}
                        max={BATTLE_CONSTANTS.LUCK_MAX}
                        value={defender.luck}
                        onChange={e => {
                          const val = Math.max(BATTLE_CONSTANTS.LUCK_MIN, Math.min(BATTLE_CONSTANTS.LUCK_MAX, Number(e.target.value)));
                          setDefender({ ...defender, luck: val });
                        }}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-yellow-500/50 rounded text-text-primary"
                        placeholder="0"
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

                  {/* 현재 선택된 전투 타입 표시 */}
                  {(() => {
                    const { attackerType, defenderType } = battleOptions;

                    const getLabel = (type: UnitType) => {
                      if (type === 'PLAYER') return '유저';
                      return '펫';
                    };

                    let dexMod = '';
                    if (attackerType === 'PLAYER' && defenderType === 'PET') {
                      dexMod = '방어 DEX ×0.8';
                    } else if (attackerType === 'PET' && defenderType === 'PLAYER') {
                      dexMod = '공격 DEX ×0.6';
                    }

                    return (
                      <div className="mb-4 p-3 bg-purple-500/10 border-purple-500/30 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">⚔️ 전투 타입:</span>
                          <span className="font-bold text-purple-400">
                            {getLabel(attackerType)} → {getLabel(defenderType)}
                          </span>
                        </div>
                        {dexMod ? (
                          <div className="text-xs text-yellow-400 mt-1">⚡ DEX 보정: {dexMod}</div>
                        ) : (
                          <div className="text-xs text-green-400 mt-1">✓ DEX 보정 없음</div>
                        )}
                      </div>
                    );
                  })()}

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
                            {result.fieldBonus !== 1 && (
                              <div className="flex justify-between">
                                <span className="text-text-secondary">필드 보정:</span>
                                <span className="font-bold text-purple-400">
                                  ×{result.fieldBonus.toFixed(2)}
                                </span>
                              </div>
                            )}
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
                            <div className="flex justify-between">
                              <span className="text-text-secondary">카운터 확률:</span>
                              <span className="font-bold text-orange-500">
                                {(result.counterRate / 100).toFixed(2)}%
                              </span>
                            </div>
                            {result.actionDisabledChance > 0 && (
                              <div className="flex justify-between bg-red-500/20 p-1 rounded">
                                <span className="text-red-400">행동 불가 확률:</span>
                                <span className="font-bold text-red-500">
                                  {(result.actionDisabledChance * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                            {result.statusEffects.atkMod !== 1 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-text-muted">공격자 상태이상 보정:</span>
                                <span className="text-red-400">
                                  ×{result.statusEffects.atkMod.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {result.statusEffects.defMod !== 1 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-text-muted">방어자 상태이상 보정:</span>
                                <span className="text-blue-400">
                                  ×{result.statusEffects.defMod.toFixed(2)}
                                </span>
                              </div>
                            )}
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
                            <button
                              onClick={() => {
                                setSimulationResult(null);
                                setSimProgress(0);
                                setSimulationWeaponType('melee');
                                setShowSimulation(true);
                              }}
                              className="w-full mt-3 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm transition-colors"
                            >
                              🎲 시뮬레이션
                            </button>
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
                            {result.fieldBonus !== 1 && (
                              <div className="flex justify-between">
                                <span className="text-text-secondary">필드 보정:</span>
                                <span className="font-bold text-purple-400">
                                  ×{result.fieldBonus.toFixed(2)}
                                </span>
                              </div>
                            )}
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
                            <div className="flex justify-between">
                              <span className="text-text-secondary">카운터 확률:</span>
                              <span className="font-bold text-orange-500">
                                {(result.counterRate / 100).toFixed(2)}%
                              </span>
                            </div>
                            {result.actionDisabledChance > 0 && (
                              <div className="flex justify-between bg-red-500/20 p-1 rounded">
                                <span className="text-red-400">행동 불가 확률:</span>
                                <span className="font-bold text-red-500">
                                  {(result.actionDisabledChance * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                            {result.statusEffects.atkMod !== 1 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-text-muted">공격자 상태이상 보정:</span>
                                <span className="text-red-400">
                                  ×{result.statusEffects.atkMod.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {result.statusEffects.defMod !== 1 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-text-muted">방어자 상태이상 보정:</span>
                                <span className="text-blue-400">
                                  ×{result.statusEffects.defMod.toFixed(2)}
                                </span>
                              </div>
                            )}
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
                            <button
                              onClick={() => {
                                setSimulationResult(null);
                                setSimProgress(0);
                                setSimulationWeaponType('ranged');
                                setShowSimulation(true);
                              }}
                              className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm transition-colors"
                            >
                              🎲 시뮬레이션
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 시뮬레이션 모달 */}
                {showSimulation && (
                  <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2"
                    onClick={() => setShowSimulation(false)}
                  >
                    <div
                      className="bg-bg-secondary border border-border rounded-lg p-4 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold text-accent">🎲 전투 시뮬레이션</h3>
                        <button
                          onClick={() => setShowSimulation(false)}
                          className="text-text-secondary hover:text-text-primary text-xl leading-none"
                        >
                          ×
                        </button>
                      </div>

                      {/* 전투 타입 + 무기 타입 (한 줄) */}
                      <div className="mb-3 p-2 bg-bg-tertiary rounded border border-border">
                        <div className="grid grid-cols-4 gap-1 mb-2">
                          {[
                            { atk: 'PLAYER' as UnitType, def: 'PLAYER' as UnitType, label: '유저→유저' },
                            { atk: 'PLAYER' as UnitType, def: 'PET' as UnitType, label: '유저→펫' },
                            { atk: 'PET' as UnitType, def: 'PLAYER' as UnitType, label: '펫→유저' },
                            { atk: 'PET' as UnitType, def: 'PET' as UnitType, label: '펫→펫' },
                          ].map(({ atk, def, label }) => (
                            <button
                              key={`${atk}-${def}`}
                              onClick={() => setBattleOptions(prev => ({ ...prev, attackerType: atk, defenderType: def }))}
                              className={`px-1 py-1.5 rounded text-xs font-bold transition-all ${
                                battleOptions.attackerType === atk && battleOptions.defenderType === def
                                  ? 'bg-accent text-white'
                                  : 'bg-bg-secondary text-text-muted hover:bg-bg-primary border border-border'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 justify-center">
                          <label className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer text-xs font-bold transition-all ${
                            simulationWeaponType === 'melee'
                              ? 'bg-green-600/30 border border-green-500 text-green-400'
                              : 'bg-bg-secondary border border-border text-text-muted hover:bg-bg-primary'
                          }`}>
                            <input type="radio" name="weaponType" value="melee" checked={simulationWeaponType === 'melee'} onChange={() => setSimulationWeaponType('melee')} className="sr-only" />
                            🗡️ 근접
                          </label>
                          <label className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer text-xs font-bold transition-all ${
                            simulationWeaponType === 'ranged'
                              ? 'bg-blue-600/30 border border-blue-500 text-blue-400'
                              : 'bg-bg-secondary border border-border text-text-muted hover:bg-bg-primary'
                          }`}>
                            <input type="radio" name="weaponType" value="ranged" checked={simulationWeaponType === 'ranged'} onChange={() => setSimulationWeaponType('ranged')} className="sr-only" />
                            🏹 원거리
                          </label>
                        </div>
                      </div>

                      {/* 스탯 설정 (접이식) */}
                      <div className="mb-3">
                        <button
                          onClick={() => setSimStatsExpanded(!simStatsExpanded)}
                          className="w-full flex items-center justify-between px-2 py-1.5 bg-bg-tertiary rounded border border-border hover:bg-bg-primary transition-colors text-xs"
                        >
                          <span className="font-bold text-text-secondary">📊 스탯 설정</span>
                          <span className="text-text-muted text-xs">{simStatsExpanded ? '▲' : '▼'}</span>
                        </button>
                        {simStatsExpanded && (
                          <div className="mt-1 p-2 bg-bg-tertiary/50 rounded border border-border space-y-2">
                            <div>
                              <div className="text-xs font-bold text-red-400 mb-1">🗡️ 공격자</div>
                              <div className="grid grid-cols-6 gap-1">
                                {(['lv', 'hp', 'str', 'tgh', 'dex', 'luck'] as const).map(stat => (
                                  <div key={`atk-${stat}`}>
                                    <label className="block text-[10px] text-text-muted text-center">
                                      {stat === 'lv' ? 'Lv' : stat === 'hp' ? '체' : stat === 'str' ? '공' : stat === 'tgh' ? '방' : stat === 'dex' ? '순' : '행'}
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={attacker[stat]}
                                      onChange={e => setAttacker(prev => ({ ...prev, [stat]: Number(e.target.value) }))}
                                      className="w-full px-1 py-0.5 bg-bg-secondary border border-border rounded text-text-primary text-xs text-center"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-blue-400 mb-1">🛡️ 방어자</div>
                              <div className="grid grid-cols-6 gap-1">
                                {(['lv', 'hp', 'str', 'tgh', 'dex', 'luck'] as const).map(stat => (
                                  <div key={`def-${stat}`}>
                                    <label className="block text-[10px] text-text-muted text-center">
                                      {stat === 'lv' ? 'Lv' : stat === 'hp' ? '체' : stat === 'str' ? '공' : stat === 'tgh' ? '방' : stat === 'dex' ? '순' : '행'}
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={defender[stat]}
                                      onChange={e => setDefender(prev => ({ ...prev, [stat]: Number(e.target.value) }))}
                                      className="w-full px-1 py-0.5 bg-bg-secondary border border-border rounded text-text-primary text-xs text-center"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 횟수 + 시작 버튼 (한 줄) */}
                      <div className="flex gap-2 mb-3">
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={simulationCount}
                            onChange={e => setSimulationCount(Math.min(500, Math.max(1, Number(e.target.value))))}
                            className="w-16 px-2 py-1.5 bg-bg-tertiary border border-border rounded text-text-primary text-center text-sm font-bold"
                          />
                          <span className="text-text-muted text-xs">회</span>
                          <div className="flex gap-1 ml-1">
                            {[50, 100, 200, 500].map(num => (
                              <button
                                key={num}
                                onClick={() => setSimulationCount(num)}
                                className={`px-1.5 py-0.5 rounded text-xs transition-all ${
                                  simulationCount === num
                                    ? 'bg-accent text-white'
                                    : 'bg-bg-tertiary text-text-muted hover:bg-bg-primary'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => runSimulation(simulationWeaponType, simulationCount)}
                          disabled={isSimulating}
                          className={`px-4 py-1.5 rounded font-bold text-sm transition-all ${
                            isSimulating
                              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                          }`}
                        >
                          {isSimulating ? `${simProgress}%` : '시작'}
                        </button>
                      </div>

                      {/* 진행률 바 */}
                      {isSimulating && (
                        <div className="mb-3">
                          <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                              style={{ width: `${simProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 시뮬레이션 결과 */}
                      {simulationResult && (
                        <div className="space-y-4">
                          {/* 전투 정보 */}
                          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <div className="text-sm text-text-secondary mb-1">⚔️ 전투 정보</div>
                            <div className="flex items-center justify-center gap-2 text-lg font-bold">
                              <span className="text-red-400">
                                {battleOptions.attackerType === 'PLAYER' ? '공격자(유저)' : '공격자(펫)'}
                              </span>
                              <span className="text-text-muted">→</span>
                              <span className="text-blue-400">
                                {battleOptions.defenderType === 'PLAYER' ? '방어자(유저)' : '방어자(펫)'}
                              </span>
                            </div>
                            <div className="text-center text-sm text-text-secondary mt-1">
                              총 {simulationResult.total}회 공격
                            </div>
                          </div>

                          {/* 결과 바 차트 */}
                          <div className="space-y-3">
                            {/* 회피 (방어자 기준) */}
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-cyan-400">🛡️ 방어자 회피</span>
                                <span className="text-text-primary font-bold">
                                  {simulationResult.dodged}회 ({((simulationResult.dodged / simulationResult.total) * 100).toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-4 bg-bg-tertiary rounded overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500 transition-all duration-300"
                                  style={{ width: `${(simulationResult.dodged / simulationResult.total) * 100}%` }}
                                />
                              </div>
                              <div className="text-xs text-text-muted mt-1">
                                이론값: {simulationResult.dodgeRate.toFixed(2)}%
                              </div>
                            </div>

                            {/* 명중 (공격자 기준) */}
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-red-400">⚔️ 공격자 명중</span>
                                <span className="text-text-primary font-bold">
                                  {simulationResult.hit}회 ({((simulationResult.hit / simulationResult.total) * 100).toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-4 bg-bg-tertiary rounded overflow-hidden">
                                <div
                                  className="h-full bg-red-500 transition-all duration-300"
                                  style={{ width: `${(simulationResult.hit / simulationResult.total) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* 크리티컬 (공격자가 방어자 공격 시) */}
                            {simulationResult.hit > 0 && (
                              <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-yellow-400">💥 공격자 크리티컬</span>
                                  <span className="text-text-primary font-bold">
                                    {simulationResult.critical}회 ({((simulationResult.critical / simulationResult.hit) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="h-4 bg-bg-tertiary rounded overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-500 transition-all duration-300"
                                    style={{ width: `${(simulationResult.critical / simulationResult.hit) * 100}%` }}
                                  />
                                </div>
                                <div className="text-xs text-text-muted mt-1">
                                  이론값: {simulationResult.critRate.toFixed(2)}%
                                </div>
                              </div>
                            )}

                            {/* 카운터 (방어자가 공격자에게 반격) */}
                            {simulationResult.hit > 0 && (
                              <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-orange-400">🔄 방어자 카운터</span>
                                  <span className="text-text-primary font-bold">
                                    {simulationResult.countered}회 ({((simulationResult.countered / simulationResult.hit) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="h-4 bg-bg-tertiary rounded overflow-hidden">
                                  <div
                                    className="h-full bg-orange-500 transition-all duration-300"
                                    style={{ width: `${(simulationResult.countered / simulationResult.hit) * 100}%` }}
                                  />
                                </div>
                                <div className="text-xs text-text-muted mt-1">
                                  이론값: {simulationResult.counterRate.toFixed(2)}%
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 요약 */}
                          <div className="mt-4 p-3 bg-bg-tertiary rounded text-sm">
                            <div className="text-text-secondary mb-2">📊 요약</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-text-muted">회피 편차:</span>
                                <span className={`ml-1 font-bold ${
                                  Math.abs((simulationResult.dodged / simulationResult.total * 100) - simulationResult.dodgeRate) < 5
                                    ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                  {((simulationResult.dodged / simulationResult.total * 100) - simulationResult.dodgeRate) >= 0 ? '+' : ''}
                                  {((simulationResult.dodged / simulationResult.total * 100) - simulationResult.dodgeRate).toFixed(1)}%
                                </span>
                              </div>
                              {simulationResult.hit > 0 && (
                                <>
                                  <div>
                                    <span className="text-text-muted">크리 편차:</span>
                                    <span className={`ml-1 font-bold ${
                                      Math.abs((simulationResult.critical / simulationResult.hit * 100) - simulationResult.critRate) < 5
                                        ? 'text-green-400' : 'text-yellow-400'
                                    }`}>
                                      {((simulationResult.critical / simulationResult.hit * 100) - simulationResult.critRate) >= 0 ? '+' : ''}
                                      {((simulationResult.critical / simulationResult.hit * 100) - simulationResult.critRate).toFixed(1)}%
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {isSimulating && (
                        <div className="text-center py-8">
                          <div className="text-2xl animate-spin">🎲</div>
                          <div className="text-text-secondary mt-2">시뮬레이션 중...</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 속성 상성 정보 */}
                {(() => {
                  // 속성은 항상 캐릭터 스탯 사용 (펫에는 속성이 없음)
                  const attrBonus = calculateAttributeBonus(attacker, defender);

                  const atkTotal = attacker.fire + attacker.water + attacker.earth + attacker.wind;
                  const defTotal = defender.fire + defender.water + defender.earth + defender.wind;

                  // 속성이 하나라도 있으면 표시
                  if (atkTotal > 0 || defTotal > 0) {
                    const getAttributeLabel = (char: CharacterStats) => {
                      const attrs = [];
                      if (char.fire > 0) attrs.push(`불${char.fire}`);
                      if (char.water > 0) attrs.push(`물${char.water}`);
                      if (char.earth > 0) attrs.push(`지${char.earth}`);
                      if (char.wind > 0) attrs.push(`바람${char.wind}`);
                      const none = 10 - (char.fire + char.water + char.earth + char.wind);
                      if (none > 0) attrs.push(`무${none}`);
                      return attrs.join(' + ');
                    };

                    return (
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 md:p-5 border border-purple-500/30 shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2">
                          <span>✨</span> 속성 상성 분석
                        </h2>

                        <div className="space-y-4">
                          {/* 공격자 속성 */}
                          <div className="bg-bg-tertiary rounded-lg p-3 border border-border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-bold text-green-400">
                                ⚔️ 공격자 속성
                              </span>
                              <span className="text-xs text-text-secondary">
                                총합: {atkTotal}/10
                              </span>
                            </div>
                            <div className="text-sm text-text-primary">
                              {getAttributeLabel(attacker)}
                            </div>
                          </div>

                          {/* 방어자 속성 */}
                          <div className="bg-bg-tertiary rounded-lg p-3 border border-border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-bold text-blue-400">
                                🛡️ 방어자 속성
                              </span>
                              <span className="text-xs text-text-secondary">
                                총합: {defTotal}/10
                              </span>
                            </div>
                            <div className="text-sm text-text-primary">
                              {getAttributeLabel(defender)}
                            </div>
                          </div>

                          {/* 속성 보정 결과 */}
                          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/50">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-bold text-yellow-300 mb-1">
                                  최종 속성 보정값
                                </div>
                                <div className="text-xs text-text-secondary">
                                  데미지에 곱해지는 배율
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-yellow-400">
                                  ×{attrBonus.toFixed(4)}
                                </div>
                                <div className="text-xs text-text-secondary mt-1">
                                  {attrBonus > 1.0
                                    ? '🔥 상성 유리!'
                                    : attrBonus < 1.0
                                      ? '💧 상성 불리'
                                      : '⚖️ 보통'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 예시 계산 */}
                          <div className="bg-bg-tertiary rounded-lg p-3 border border-border">
                            <div className="text-xs text-text-secondary space-y-1">
                              <p className="font-bold text-accent mb-2">💡 계산 예시</p>
                              <p>• 기본 데미지가 1000이라면</p>
                              <p className="text-yellow-400 font-bold pl-4">
                                → 속성 적용 후: {(1000 * attrBonus).toFixed(0)} 데미지
                              </p>
                              <p className="text-xs text-text-tertiary mt-2">
                                ※ 속성 보정은 모든 데미지에 적용됩니다
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
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
                          myEarth * enFirePercent * 1.0 +
                          myEarth * enWaterPercent * 1.5 +
                          myEarth * enEarthPercent * 1.0 +
                          myEarth * enWindPercent * 0.6;

                        const windDmg =
                          myWind * enNone * 1.5 +
                          myWind * enFirePercent * 0.6 +
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

                      // 새로운 접근: 모든 속성 조합을 탐색하여 일치하는 것 찾기
                      // 데미지 공식: dmg = (atk - def*0.7) * 2.0 * attrBonus
                      // 역산: def*0.7 = atk - dmg / (2.0 * attrBonus)
                      // def = (atk - dmg / (2.0 * attrBonus)) / 0.7

                      // 가능한 모든 속성 조합 생성 (최대 2개 속성, 합계 10)
                      const generateAttrCombinations = () => {
                        const combos: Array<{
                          earth: number;
                          water: number;
                          fire: number;
                          wind: number;
                          label: string;
                        }> = [];

                        // 무속성
                        combos.push({ earth: 0, water: 0, fire: 0, wind: 0, label: '무속성' });

                        // 단일 속성 (지10, 수10, 화10, 풍10)
                        combos.push({ earth: 10, water: 0, fire: 0, wind: 0, label: '지10' });
                        combos.push({ earth: 0, water: 10, fire: 0, wind: 0, label: '수10' });
                        combos.push({ earth: 0, water: 0, fire: 10, wind: 0, label: '화10' });
                        combos.push({ earth: 0, water: 0, fire: 0, wind: 10, label: '풍10' });

                        // 2개 속성 조합 (주속성 + 부속성, 합계 10)
                        const attrs = ['earth', 'water', 'fire', 'wind'] as const;
                        const attrNames = { earth: '지', water: '수', fire: '화', wind: '풍' };

                        for (let i = 0; i < attrs.length; i++) {
                          for (let j = i + 1; j < attrs.length; j++) {
                            // 주속성 5~9, 부속성 1~5 (주 >= 부)
                            for (let main = 5; main <= 9; main++) {
                              const sub = 10 - main;
                              // 첫 번째가 주속성
                              const combo1: { earth: number; water: number; fire: number; wind: number } = {
                                earth: 0,
                                water: 0,
                                fire: 0,
                                wind: 0,
                              };
                              combo1[attrs[i]] = main;
                              combo1[attrs[j]] = sub;
                              combos.push({
                                ...combo1,
                                label: `${attrNames[attrs[i]]}${main}${attrNames[attrs[j]]}${sub}`,
                              });

                              // 두 번째가 주속성
                              const combo2: { earth: number; water: number; fire: number; wind: number } = {
                                earth: 0,
                                water: 0,
                                fire: 0,
                                wind: 0,
                              };
                              combo2[attrs[j]] = main;
                              combo2[attrs[i]] = sub;
                              combos.push({
                                ...combo2,
                                label: `${attrNames[attrs[j]]}${main}${attrNames[attrs[i]]}${sub}`,
                              });
                            }
                          }
                        }

                        return combos;
                      };

                      const allCombos = generateAttrCombinations();

                      // 각 조합에 대해 역계산 수행
                      type ResultItem = {
                        defense: number;
                        attrBonus: number;
                        enemyAttr: string;
                        category: 'advantage' | 'disadvantage' | 'neutral';
                      };
                      const matchingResults: ResultItem[] = [];

                      // 내 주속성 결정 (가장 높은 속성)
                      const myAttrs = [
                        { type: 'earth', val: myEarth / 10, beats: 'water', beatenBy: 'wind' },
                        { type: 'water', val: myWater / 10, beats: 'fire', beatenBy: 'earth' },
                        { type: 'fire', val: myFire / 10, beats: 'wind', beatenBy: 'water' },
                        { type: 'wind', val: myWind / 10, beats: 'earth', beatenBy: 'fire' },
                      ];
                      const mainAttr = myAttrs.reduce((a, b) => (a.val >= b.val ? a : b));

                      allCombos.forEach(combo => {
                        const bonus = calcAttrBonus(combo.earth, combo.water, combo.fire, combo.wind);
                        const defenseTimesPoint7 = atk - dmg / (2.0 * bonus);

                        if (defenseTimesPoint7 >= 0) {
                          let charDefense;
                          if (opponentPetTgh > 0) {
                            charDefense = Math.round(
                              (defenseTimesPoint7 / 0.7 - opponentPetTgh * 0.3) / 0.7
                            );
                          } else {
                            charDefense = Math.round(defenseTimesPoint7 / 0.7);
                          }

                          // 현실적인 방어력 범위만 (0~3000)
                          if (charDefense >= 0 && charDefense <= 3000) {
                            // 카테고리 결정: 상대 주속성 확인
                            const enemyAttrs = [
                              { type: 'earth', val: combo.earth },
                              { type: 'water', val: combo.water },
                              { type: 'fire', val: combo.fire },
                              { type: 'wind', val: combo.wind },
                            ];
                            const enemyMainAttr = enemyAttrs.reduce((a, b) =>
                              a.val >= b.val ? a : b
                            );

                            let category: 'advantage' | 'disadvantage' | 'neutral' = 'neutral';
                            if (mainAttr.val > 0 && enemyMainAttr.val > 0) {
                              if (mainAttr.beats === enemyMainAttr.type) {
                                category = 'advantage';
                              } else if (mainAttr.beatenBy === enemyMainAttr.type) {
                                category = 'disadvantage';
                              }
                            }

                            matchingResults.push({
                              defense: charDefense,
                              attrBonus: bonus,
                              enemyAttr: combo.label,
                              category,
                            });
                          }
                        }
                      });

                      // 방어력 기준으로 그룹핑 (±50 범위)
                      const groupByDefense = (
                        results: ResultItem[]
                      ): Array<{ defense: number; items: ResultItem[] }> => {
                        const groups: Array<{ defense: number; items: ResultItem[] }> = [];
                        const sorted = [...results].sort((a, b) => a.defense - b.defense);

                        sorted.forEach(item => {
                          const existing = groups.find(
                            g => Math.abs(g.defense - item.defense) <= 50
                          );
                          if (existing) {
                            existing.items.push(item);
                          } else {
                            groups.push({ defense: item.defense, items: [item] });
                          }
                        });

                        // 각 그룹의 대표 방어력을 평균으로 재계산
                        groups.forEach(g => {
                          g.defense = Math.round(
                            g.items.reduce((sum, i) => sum + i.defense, 0) / g.items.length
                          );
                        });

                        return groups;
                      };

                      const groupedResults = groupByDefense(matchingResults);

                      // 카테고리별로 필터링된 대표 결과
                      const getCategoryResults = (cat: 'advantage' | 'disadvantage' | 'neutral') => {
                        const filtered = matchingResults.filter(r => r.category === cat);
                        if (filtered.length === 0) return null;

                        // 같은 카테고리 내에서 방어력 범위와 속성 조합 모음
                        const minDef = Math.min(...filtered.map(r => r.defense));
                        const maxDef = Math.max(...filtered.map(r => r.defense));

                        // 대표 속성 조합들 (중복 제거, 최대 5개)
                        const uniqueAttrs = [...new Set(filtered.map(r => r.enemyAttr))].slice(0, 5);

                        return {
                          minDef,
                          maxDef,
                          attrs: uniqueAttrs,
                          bonusRange: {
                            min: Math.min(...filtered.map(r => r.attrBonus)),
                            max: Math.max(...filtered.map(r => r.attrBonus)),
                          },
                        };
                      };

                      const advantageResult = getCategoryResults('advantage');
                      const disadvantageResult = getCategoryResults('disadvantage');
                      const neutralResult = getCategoryResults('neutral');

                      return (
                        <div className="space-y-4">
                          {/* 상성 유리 */}
                          {advantageResult && (
                            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30">
                              <h4 className="font-bold text-green-400 text-lg mb-2">
                                ✅ 상성 유리 (내가 상대 속성을 잡는 경우)
                              </h4>
                              <div className="text-sm space-y-2">
                                <p>
                                  <span className="text-text-secondary">추정 방어력(TGH): </span>
                                  <span className="font-bold text-blue-400 text-lg">
                                    {advantageResult.minDef === advantageResult.maxDef
                                      ? `약 ${advantageResult.minDef}`
                                      : `${advantageResult.minDef} ~ ${advantageResult.maxDef}`}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-text-secondary">상대 추정 속성: </span>
                                  <span className="font-bold text-yellow-400">
                                    {advantageResult.attrs.join(', ')}
                                    {advantageResult.attrs.length >= 5 && ' ...'}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-text-secondary">속성 보정: </span>
                                  <span className="font-bold text-purple-400">
                                    ×{advantageResult.bonusRange.min.toFixed(2)}
                                    {advantageResult.bonusRange.min !== advantageResult.bonusRange.max &&
                                      ` ~ ×${advantageResult.bonusRange.max.toFixed(2)}`}
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 상성 불리 */}
                          {disadvantageResult && (
                            <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/30">
                              <h4 className="font-bold text-red-400 text-lg mb-2">
                                ❌ 상성 불리 (상대가 내 속성을 잡는 경우)
                              </h4>
                              <div className="text-sm space-y-2">
                                <p>
                                  <span className="text-text-secondary">추정 방어력(TGH): </span>
                                  <span className="font-bold text-blue-400 text-lg">
                                    {disadvantageResult.minDef === disadvantageResult.maxDef
                                      ? `약 ${disadvantageResult.minDef}`
                                      : `${disadvantageResult.minDef} ~ ${disadvantageResult.maxDef}`}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-text-secondary">상대 추정 속성: </span>
                                  <span className="font-bold text-yellow-400">
                                    {disadvantageResult.attrs.join(', ')}
                                    {disadvantageResult.attrs.length >= 5 && ' ...'}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-text-secondary">속성 보정: </span>
                                  <span className="font-bold text-purple-400">
                                    ×{disadvantageResult.bonusRange.min.toFixed(2)}
                                    {disadvantageResult.bonusRange.min !==
                                      disadvantageResult.bonusRange.max &&
                                      ` ~ ×${disadvantageResult.bonusRange.max.toFixed(2)}`}
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 상성 중립 */}
                          {neutralResult && (
                            <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/30">
                              <h4 className="font-bold text-blue-400 text-lg mb-2">
                                ⚖️ 상성 중립 (상성 관계 없음)
                              </h4>
                              <div className="text-sm space-y-2">
                                <p>
                                  <span className="text-text-secondary">추정 방어력(TGH): </span>
                                  <span className="font-bold text-blue-400 text-lg">
                                    {neutralResult.minDef === neutralResult.maxDef
                                      ? `약 ${neutralResult.minDef}`
                                      : `${neutralResult.minDef} ~ ${neutralResult.maxDef}`}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-text-secondary">상대 추정 속성: </span>
                                  <span className="font-bold text-yellow-400">
                                    {neutralResult.attrs.join(', ')}
                                    {neutralResult.attrs.length >= 5 && ' ...'}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-text-secondary">속성 보정: </span>
                                  <span className="font-bold text-purple-400">
                                    ×{neutralResult.bonusRange.min.toFixed(2)}
                                    {neutralResult.bonusRange.min !== neutralResult.bonusRange.max &&
                                      ` ~ ×${neutralResult.bonusRange.max.toFixed(2)}`}
                                  </span>
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 상세 결과 (접이식) */}
                          {groupedResults.length > 0 && (
                            <details className="mt-4">
                              <summary className="cursor-pointer text-text-secondary hover:text-text-primary text-sm">
                                📋 상세 조합 보기 ({matchingResults.length}개 조합)
                              </summary>
                              <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                                {groupedResults.slice(0, 10).map((group, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-bg-tertiary rounded border border-border text-xs"
                                  >
                                    <div className="font-bold text-text-primary mb-1">
                                      방어력 약 {group.defense}
                                    </div>
                                    <div className="text-text-secondary">
                                      가능한 속성:{' '}
                                      {group.items
                                        .slice(0, 5)
                                        .map(i => i.enemyAttr)
                                        .join(', ')}
                                      {group.items.length > 5 && ` 외 ${group.items.length - 5}개`}
                                    </div>
                                  </div>
                                ))}
                                {groupedResults.length > 10 && (
                                  <div className="text-center text-text-muted text-xs">
                                    ... 외 {groupedResults.length - 10}개 그룹
                                  </div>
                                )}
                              </div>
                            </details>
                          )}

                          {!advantageResult && !disadvantageResult && !neutralResult && (
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
