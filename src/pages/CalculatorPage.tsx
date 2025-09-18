import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import petData from '../data/petData.json';

const CalculatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 서브탭 상태 관리
  const [activeSubTab, setActiveSubTab] = useState('rebirth');

  // 페트 판매 계산기 상태
  const [petSaleLevel, setPetSaleLevel] = useState(60);
  const [petSaleResults, setPetSaleResults] = useState({
    normal: 0,
    grade1: 0,
    grade2: 0,
  });

  // 페트성장 계산기 상태
  const [petLevel, setPetLevel] = useState(1);
  const [selectedPet, setSelectedPet] = useState<(typeof petData.pets)[0] | null>(null);
  const [petSearchQuery, setPetSearchQuery] = useState('');
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const [filteredPets, setFilteredPets] = useState(petData.pets);

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

  // 페트 판매가 계산 함수
  const calculatePetSalePrice = (level: number) => {
    if (level < 1 || level > 140) {
      return { normal: 0, grade1: 0, grade2: 0 };
    }

    const result1 = (((level + 1) * level) / 2 - 1) * 20 + 10;
    const result2 = result1 * 8;
    const result3 = result1 * 5;

    return {
      normal: result1,
      grade1: result2,
      grade2: result3,
    };
  };

  // 레벨 변경 시 가격 계산
  React.useEffect(() => {
    const results = calculatePetSalePrice(petSaleLevel);
    setPetSaleResults(results);
  }, [petSaleLevel]);

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

  // 페트 검색 핸들러
  const handlePetSearch = (query: string) => {
    setPetSearchQuery(query);
    setShowPetDropdown(true);

    if (query.trim() === '') {
      setFilteredPets(petData.pets);
    } else {
      const filtered = petData.pets.filter(pet => {
        const lowerQuery = query.toLowerCase();
        const lowerName = pet.name.toLowerCase();
        const lowerGrade = pet.grade.toLowerCase();
        const lowerSource = pet.source.toLowerCase();

        // 기본 텍스트 검색
        const textMatch =
          lowerName.includes(lowerQuery) ||
          lowerGrade.includes(lowerQuery) ||
          lowerSource.includes(lowerQuery);

        // 초성 검색 (한글 자음만 입력한 경우)
        const isKoreanConsonants = /^[ㄱ-ㅎ]+$/.test(query);
        const initialMatch = isKoreanConsonants ? matchesInitialSearch(pet.name, query) : false;

        return textMatch || initialMatch;
      });
      setFilteredPets(filtered.slice(0, 10)); // 최대 10개까지만 표시
    }
  };

  // 페트 선택 핸들러
  const handlePetSelect = (pet: (typeof petData.pets)[0]) => {
    setSelectedPet(pet);
    setPetSearchQuery(pet.name);
    setShowPetDropdown(false);
  };

  // 드롭다운 외부 클릭 시 닫기
  const handleInputBlur = () => {
    // 약간의 딜레이를 주어 드롭다운 클릭이 처리되도록 함
    setTimeout(() => {
      setShowPetDropdown(false);
    }, 200);
  };

  // 페트 능력치 계산
  const calculatePetStats = () => {
    if (!selectedPet) return null;

    const levelBonus = petLevel - 1;

    return {
      attack: Math.floor(
        selectedPet.baseStats.attack + selectedPet.growthStats.attack * levelBonus
      ),
      defense: Math.floor(
        selectedPet.baseStats.defense + selectedPet.growthStats.defense * levelBonus
      ),
      agility: Math.floor(
        selectedPet.baseStats.agility + selectedPet.growthStats.agility * levelBonus
      ),
      vitality: Math.floor(
        selectedPet.baseStats.vitality + selectedPet.growthStats.vitality * levelBonus
      ),
    };
  };

  const calculatedPetStats = calculatePetStats();

  // 한글 초성 변환 함수
  const getInitialConsonant = (char: string): string => {
    const code = char.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return char;
    const initialConsonants = [
      'ㄱ',
      'ㄲ',
      'ㄴ',
      'ㄷ',
      'ㄸ',
      'ㄹ',
      'ㅁ',
      'ㅂ',
      'ㅃ',
      'ㅅ',
      'ㅆ',
      'ㅇ',
      'ㅈ',
      'ㅉ',
      'ㅊ',
      'ㅋ',
      'ㅌ',
      'ㅍ',
      'ㅎ',
    ];
    return initialConsonants[Math.floor(code / 588)];
  };

  // 문자열을 초성으로 변환
  const getInitialConsonants = (str: string): string => {
    return str
      .split('')
      .map(char => getInitialConsonant(char))
      .join('');
  };

  // 초성 검색 매칭 함수
  const matchesInitialSearch = (petName: string, searchQuery: string): boolean => {
    const petInitials = getInitialConsonants(petName);
    const queryInitials = getInitialConsonants(searchQuery);
    return petInitials.includes(queryInitials);
  };

  // URL 파라미터에서 서브탭 상태 관리
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'petgrowth' || tabParam === 'rebirth' || tabParam === 'petsale') {
      setActiveSubTab(tabParam);
    } else {
      // 기본값 설정 및 URL 업데이트
      setActiveSubTab('rebirth');
    }
  }, [searchParams]);

  // 컴포넌트 마운트 시 저장된 데이터 목록 로드
  React.useEffect(() => {
    loadSavedList();
  }, []);

  // 서브탭 변경 핸들러
  const handleSubTabChange = (tabId: string) => {
    setActiveSubTab(tabId);
    // URL 파라미터 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tabId);
    navigate(`/calculator?${newSearchParams.toString()}`, { replace: true });
  };

  // 서브탭 메뉴
  const subTabs = [
    { id: 'rebirth', label: '환생포인트' },
    { id: 'petgrowth', label: '페트성장' },
    { id: 'petsale', label: '페트판매' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 iphone16:px-3">
      {/* 서브탭 네비게이션 */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="flex">
            {subTabs.map(tab => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange(tab.id)}
                  className={`flex-1 py-3 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    isActive
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-muted'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 환생포인트 서브탭 */}
      {activeSubTab === 'rebirth' && (
        <div>
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
                  <h4 className="font-semibold text-text-primary mb-2 text-sm">
                    환포 총합 + 보너스
                  </h4>
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
                      <React.Fragment key={`header-${i}`}>
                        <th className="px-2 py-2 text-center font-semibold text-xs bg-bg-tertiary text-text-secondary">
                          적용
                        </th>
                        <th className="px-2 py-2 text-center font-semibold text-xs bg-bg-tertiary text-text-secondary">
                          실제
                        </th>
                      </React.Fragment>
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
                        <React.Fragment key={`${key}-${i}`}>
                          <td className="px-2 py-3 text-center">
                            <span className="inline-block px-2 py-1 rounded text-xs font-mono font-bold bg-green-500 text-white">
                              {data.appliedRebirth[key as keyof StatInput]}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className="inline-block px-2 py-1 rounded text-xs font-mono bg-bg-tertiary text-text-primary">
                              {data.appliedRebirthDecimal[key as keyof StatInput].toFixed(2)}
                            </span>
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t font-semibold border-border bg-bg-tertiary">
                    <td className="px-4 py-3">환포 총합 + 보너스</td>
                    {calculatedData.map((data, i) => (
                      <React.Fragment key={`total-${i}`}>
                        <td className="px-2 py-3 text-center">
                          <span className="inline-block px-3 py-2 rounded text-sm font-mono font-bold bg-blue-500 text-white shadow-lg">
                            {data.appliedRebirth.con +
                              data.appliedRebirth.wis +
                              data.appliedRebirth.dex +
                              data.appliedRebirth.agi +
                              data.bonus}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-center">
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
                      </React.Fragment>
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
                  <div className="px-4 py-2 rounded-lg font-bold text-lg bg-red-500 text-white flex items-center justify-center">
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
      )}

      {/* 페트성장 서브탭 */}
      {activeSubTab === 'petgrowth' && (
        <div>
          {/* 페트 선택 및 레벨 입력 */}
          <div className="bg-bg-secondary rounded-xl p-6 mb-6 border border-border">
            <h2 className="text-xl font-bold text-text-primary mb-4 text-center">
              🐾 페트성장 계산기
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 페트 검색 및 선택 */}
              <div className="relative">
                <label className="block text-text-primary font-medium mb-2">페트 선택</label>
                <div className="relative">
                  <input
                    type="text"
                    value={petSearchQuery}
                    onChange={e => handlePetSearch(e.target.value)}
                    onFocus={() => setShowPetDropdown(true)}
                    onBlur={handleInputBlur}
                    placeholder="페트이름 및 초성으로 검색"
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-text-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* 드롭다운 목록 */}
                {showPetDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-bg-tertiary border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPets.length > 0 ? (
                      <>
                        {filteredPets.map(pet => (
                          <div
                            key={pet.id}
                            onClick={() => handlePetSelect(pet)}
                            className="px-3 py-2 hover:bg-bg-secondary cursor-pointer transition-colors border-b border-border last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="text-text-primary font-medium">{pet.name}</span>
                                <span className="text-text-secondary text-xs">{pet.source}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                {pet.grade && pet.grade.trim() !== '' && (
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      pet.grade === '영웅'
                                        ? 'bg-yellow-500 text-black'
                                        : pet.grade === '희귀'
                                          ? 'bg-purple-500 text-white'
                                          : 'bg-bg-primary text-text-secondary'
                                    }`}
                                  >
                                    {pet.grade}
                                  </span>
                                )}
                                <span className="text-accent text-xs mt-1">
                                  성장률: {pet.totalGrowth}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {petData.pets.length > 10 && filteredPets.length === 10 && (
                          <div className="px-3 py-2 text-text-secondary text-xs text-center bg-bg-secondary">
                            더 많은 결과가 있습니다. 검색어를 더 구체적으로 입력해주세요.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="px-3 py-4 text-text-secondary text-center">
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 레벨 입력 */}
              <div>
                <label className="block text-text-primary font-medium mb-2">레벨</label>
                <input
                  type="number"
                  min="1"
                  max="140"
                  value={petLevel}
                  onChange={e =>
                    setPetLevel(Math.max(1, Math.min(140, parseInt(e.target.value) || 1)))
                  }
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="레벨을 입력하세요 (1-140)"
                />
              </div>
            </div>
          </div>

          {/* 페트 정보 및 계산 결과 */}
          {selectedPet && calculatedPetStats && (
            <div className="space-y-6">
              {/* 페트 기본 정보 */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-4">
                  {selectedPet.name} 정보
                </h3>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* 페트 이미지 */}
                  <div className="flex-shrink-0">
                    {selectedPet.imageLink ? (
                      <div className="w-32 h-32 mx-auto md:mx-0">
                        <img
                          src={selectedPet.imageLink}
                          alt={selectedPet.name}
                          className="w-full h-full object-contain rounded-lg border border-border bg-bg-tertiary"
                          onError={e => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 mx-auto md:mx-0 flex items-center justify-center bg-bg-tertiary rounded-lg border border-border">
                        <span className="text-4xl">🐾</span>
                      </div>
                    )}
                  </div>

                  {/* 페트 정보 */}
                  <div className="flex-1">
                    {/* 속성 정보 */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-text-primary mb-3">속성</h4>

                      {/* 속성 아이콘 */}
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {selectedPet.elementStats.earth > 0 && (
                          <span className="text-sm px-2 py-1 rounded border bg-green-500/10 border-green-500/30 text-green-400">
                            地 {selectedPet.elementStats.earth}
                          </span>
                        )}
                        {selectedPet.elementStats.water > 0 && (
                          <span className="text-sm px-2 py-1 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400">
                            水 {selectedPet.elementStats.water}
                          </span>
                        )}
                        {selectedPet.elementStats.fire > 0 && (
                          <span className="text-sm px-2 py-1 rounded border bg-red-500/10 border-red-500/30 text-red-400">
                            火 {selectedPet.elementStats.fire}
                          </span>
                        )}
                        {selectedPet.elementStats.wind > 0 && (
                          <span className="text-sm px-2 py-1 rounded border bg-amber-500/10 border-amber-500/30 text-amber-400">
                            風 {selectedPet.elementStats.wind}
                          </span>
                        )}
                      </div>

                      {/* 속성 프로그레스 바 */}
                      <div className="space-y-2">
                        {selectedPet.elementStats.earth > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-400 w-4">地</span>
                            <div className="flex gap-0.5 flex-1">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={`earth-bar-${i}`}
                                  className={`h-1.5 w-2 rounded-sm ${
                                    i < selectedPet.elementStats.earth
                                      ? 'bg-green-500'
                                      : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedPet.elementStats.water > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-400 w-4">水</span>
                            <div className="flex gap-0.5 flex-1">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={`water-bar-${i}`}
                                  className={`h-1.5 w-2 rounded-sm ${
                                    i < selectedPet.elementStats.water
                                      ? 'bg-blue-500'
                                      : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedPet.elementStats.fire > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-400 w-4">火</span>
                            <div className="flex gap-0.5 flex-1">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={`fire-bar-${i}`}
                                  className={`h-1.5 w-2 rounded-sm ${
                                    i < selectedPet.elementStats.fire ? 'bg-red-500' : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedPet.elementStats.wind > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-400 w-4">風</span>
                            <div className="flex gap-0.5 flex-1">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={`wind-bar-${i}`}
                                  className={`h-1.5 w-2 rounded-sm ${
                                    i < selectedPet.elementStats.wind
                                      ? 'bg-amber-500'
                                      : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 기본 정보 */}
                    <div className="border-t border-border pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-text-secondary">등급:</span>
                          <span className="ml-2 text-text-primary font-medium">
                            {selectedPet.grade}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">획득처:</span>
                          <span className="ml-2 text-text-primary font-medium">
                            {selectedPet.source}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">탑승:</span>
                          <span
                            className={`ml-2 font-medium ${selectedPet.rideable === '탑승가능' ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {selectedPet.rideable}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">총 성장률:</span>
                          <span className="ml-2 text-accent font-bold">
                            {selectedPet.totalGrowth}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 능력치 상세 */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-4 text-center">
                  능력치 상세
                </h3>

                {/* 데스크톱 테이블 뷰 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg-tertiary">
                        <th className="px-4 py-3 text-left font-semibold text-text-primary">
                          구분
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-text-primary">
                          공격력
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-text-primary">
                          방어력
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-text-primary">
                          순발력
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-text-primary">
                          내구력
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-text-primary">초기치</td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {selectedPet.baseStats.attack}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {selectedPet.baseStats.defense}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {selectedPet.baseStats.agility}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary">
                          {selectedPet.baseStats.vitality}
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-text-primary">성장률</td>
                        <td className="px-4 py-3 text-center text-accent">
                          {selectedPet.growthStats.attack}
                        </td>
                        <td className="px-4 py-3 text-center text-accent">
                          {selectedPet.growthStats.defense}
                        </td>
                        <td className="px-4 py-3 text-center text-accent">
                          {selectedPet.growthStats.agility}
                        </td>
                        <td className="px-4 py-3 text-center text-accent">
                          {selectedPet.growthStats.vitality}
                        </td>
                      </tr>
                      <tr className="border-t border-border bg-bg-tertiary">
                        <td className="px-4 py-3 font-bold text-text-primary">
                          Lv.{petLevel} <span className="text-green-500">S급</span> 능력치
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 rounded bg-blue-500 text-white font-bold">
                            {calculatedPetStats.attack}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 rounded bg-green-500 text-white font-bold">
                            {calculatedPetStats.defense}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 rounded bg-yellow-500 text-white font-bold">
                            {calculatedPetStats.agility}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 rounded bg-red-500 text-white font-bold">
                            {calculatedPetStats.vitality}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 모바일 카드 뷰 */}
                <div className="block md:hidden space-y-3">
                  {/* 현재 레벨 표시 */}
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-3 text-white text-center mb-4">
                    <div className="text-xl font-bold">Lv.{petLevel} S급 능력치</div>
                  </div>

                  {/* 능력치 그리드 */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'attack', label: '공격력', color: 'bg-blue-500' },
                      { key: 'defense', label: '방어력', color: 'bg-green-500' },
                      { key: 'agility', label: '순발력', color: 'bg-yellow-500' },
                      { key: 'vitality', label: '내구력', color: 'bg-red-500' },
                    ].map(({ key, label, color }) => (
                      <div key={key} className="bg-bg-tertiary rounded-lg p-3 border border-border">
                        <div className="text-center">
                          <div className="mb-2">
                            <span className="text-text-primary font-medium text-sm">{label}</span>
                          </div>

                          <div className={`${color} text-white rounded-lg py-2 px-3 mb-3`}>
                            <div className="font-bold text-lg">
                              {calculatedPetStats[key as keyof typeof calculatedPetStats]}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-text-secondary mb-1">초기치</div>
                              <div className="font-mono text-text-primary bg-bg-primary rounded px-1 py-1">
                                {selectedPet.baseStats[key as keyof typeof selectedPet.baseStats]}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary mb-1">성장률</div>
                              <div className="font-mono text-accent bg-bg-primary rounded px-1 py-1">
                                {
                                  selectedPet.growthStats[
                                    key as keyof typeof selectedPet.growthStats
                                  ]
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 계산 공식 설명 */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold text-text-primary mb-4 text-center">
                  📊 계산 공식
                </h3>
                <div className="text-center text-text-secondary">
                  <p className="mb-2">
                    <span className="font-mono bg-bg-tertiary px-2 py-1 rounded">
                      최종 능력치 = 초기치 + (성장률 × (레벨 - 1))
                    </span>
                  </p>
                  <p className="text-sm">
                    예: 공격력 = {selectedPet.baseStats.attack} + ({selectedPet.growthStats.attack}{' '}
                    × {petLevel - 1}) = {calculatedPetStats.attack}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 페트 미선택 시 안내 */}
          {!selectedPet && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🐾</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">페트를 선택하세요</h3>
              <p className="text-text-secondary">
                위에서 페트와 레벨을 선택하면 능력치를 계산해드립니다
              </p>
            </div>
          )}
        </div>
      )}

      {/* 페트판매 서브탭 */}
      {activeSubTab === 'petsale' && (
        <div>
          {/* 페트판매 계산기 */}
          <div className="bg-bg-secondary rounded-xl p-6 mb-6 border border-border">
            <h2 className="text-xl font-bold text-text-primary mb-6 text-center">
              💰 페트 판매가 계산기
            </h2>

            {/* 레벨 입력 */}
            <div className="max-w-lg mx-auto mb-8">
              <label className="block text-text-primary font-bold mb-4 text-center text-lg">
                페트 레벨 입력
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="140"
                  value={petSaleLevel}
                  onChange={e => {
                    const level = parseInt(e.target.value) || 1;
                    setPetSaleLevel(Math.max(1, Math.min(140, level)));
                  }}
                  className="w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 border-accent rounded-xl text-text-primary text-center text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-accent/30 shadow-lg"
                  placeholder="60"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm font-medium">
                  Lv
                </div>
              </div>
              <div className="text-center mt-2 text-text-secondary text-sm">레벨 범위: 1 ~ 140</div>
            </div>

            {/* 계산 결과 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 일반 페트 */}
              <div className="bg-bg-tertiary rounded-lg p-6 border border-border text-center">
                <div className="text-gray-500 text-lg mb-2">일반 페트</div>
                <div className="text-2xl md:text-3xl font-bold text-blue-500 mb-2">
                  {petSaleResults.normal.toLocaleString()}
                </div>
                <div className="text-text-secondary text-sm">stone</div>
              </div>

              {/* 1등급 페트 */}
              <div className="bg-bg-tertiary rounded-lg p-6 border border-border text-center">
                <div className="text-purple-500 text-lg mb-2">1등급 페트</div>
                <div className="text-2xl md:text-3xl font-bold text-purple-500 mb-2">
                  {petSaleResults.grade1.toLocaleString()}
                </div>
                <div className="text-text-secondary text-sm">stone</div>
              </div>

              {/* 2등급 페트 */}
              <div className="bg-bg-tertiary rounded-lg p-6 border border-border text-center">
                <div className="text-yellow-500 text-lg mb-2">2등급 페트</div>
                <div className="text-2xl md:text-3xl font-bold text-yellow-500 mb-2">
                  {petSaleResults.grade2.toLocaleString()}
                </div>
                <div className="text-text-secondary text-sm">stone</div>
              </div>
            </div>

            {/* 레벨별 예시 */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-text-primary mb-4 text-center">
                📈 레벨별 판매가 예시
              </h3>

              {/* 모바일 뷰 */}
              <div className="block md:hidden space-y-3">
                {[50, 100, 140].map(level => {
                  const results = calculatePetSalePrice(level);
                  return (
                    <div key={level} className="bg-bg-tertiary rounded-lg p-3 border border-border">
                      <div className="text-center text-accent font-bold mb-2">Lv.{level}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-text-secondary mb-1">일반</div>
                          <div className="font-mono text-blue-500">
                            {results.normal.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-text-secondary mb-1">1등급</div>
                          <div className="font-mono text-purple-500">
                            {results.grade1.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-text-secondary mb-1">2등급</div>
                          <div className="font-mono text-yellow-500">
                            {results.grade2.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 데스크톱 뷰 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-text-secondary">
                  <thead>
                    <tr className="bg-bg-tertiary">
                      <th className="px-4 py-3 text-center font-semibold text-text-primary">
                        레벨
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-blue-500">
                        일반 페트
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-purple-500">
                        1등급 페트
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-yellow-500">
                        2등급 페트
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[50, 75, 100, 125, 140].map(level => {
                      const results = calculatePetSalePrice(level);
                      return (
                        <tr key={level} className="border-t border-border">
                          <td className="px-4 py-3 text-center font-medium text-accent">
                            Lv.{level}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-blue-500">
                            {results.normal.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-purple-500">
                            {results.grade1.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-yellow-500">
                            {results.grade2.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-orange-500 text-xl flex-shrink-0">⚠️</div>
                <div>
                  <h4 className="text-orange-600 dark:text-orange-400 font-medium mb-1">
                    주의사항
                  </h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• 실제 게임에서의 판매가와 다를 수 있습니다</li>
                    <li>• 페트의 상태나 특별한 조건에 따라 가격이 변동될 수 있습니다</li>
                    <li>• 이 계산기는 기본 공식에 따른 참고용입니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorPage;
