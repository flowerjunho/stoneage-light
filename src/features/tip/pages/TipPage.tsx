import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import iceCastleData from '@/data/ice_castle.json';
import weeklyRaidData from '@/data/weekly_raid.json';
import rightItemsData from '@/data/right_items.json';
import MyTipBoard from '../components/MyTipBoard';

type MainTab = 'mytip' | 'raid';
type RaidSubTab = 'radonta' | 'ice-castle' | 'weekly';

// 라돈타 층별 데이터
const radontaFloors = [
  {
    floor: 10,
    setup: '수',
    support: '수우대',
    rainbow: '홉킨스, 카라쿠',
    boss: '홉킨스(부활)',
    basic: ['카라쿠(지10) x2', '홉킨스(지8수2) x1', '토라쿠(화8수2) x3', '차라쿠(풍6지4) x4'],
    aurora: ['카라쿠(화10) x2', '홉킨스(화8품2) x1', '토라쿠(지8중2) x3', '차라쿠(수6화4) x4'],
  },
  {
    floor: 20,
    setup: '수 (상대: 오로라)',
    support: '수우대',
    rainbow: '헷지',
    boss: '파사트',
    basic: [
      '헷지(풍8지2) x2',
      '베르고(지7풍3) x2',
      '지고르(지9수1) x3',
      '토라티스(지8풍1) x2',
      '파사트(지6수4) x1',
    ],
    aurora: [
      '헷지(수8화2) x2',
      '베르고(화7수3) x2',
      '지고르(화9풍1) x3',
      '토라티스(화8수1) x2',
      '파사트(화6품4) x1',
    ],
  },
  {
    floor: 30,
    setup: '지',
    support: '지우대',
    rainbow: 'X',
    boss: '케라스, 아라(부활)',
    basic: [
      '아라(화7품3) x2',
      '쿨코카스(수10) x2',
      '보투케스(화5품5) x3',
      '피노(화6수4) x2',
      '케라스(수6화4) x1',
    ],
    aurora: [
      '아라(지7수3) x2',
      '쿨코카스(풍10) x2',
      '보투케스(지5수5) x3',
      '피노(지6풍4) x2',
      '케라스(풍6지4) x1',
    ],
  },
  {
    floor: 40,
    setup: '지',
    support: '지우대',
    rainbow: 'X',
    boss: '격수, 매그노(부활)',
    basic: [
      '매그노(수8화2) x2',
      '청기로(수?화?) x3',
      '메가로돈(수9화1) x2',
      '기란(수5화5) x2',
      '격수(수7화3) x1',
    ],
    aurora: [
      '매그노(풍8지2) x2',
      '청기로(풍?지?) x3',
      '메가로돈(풍6지4) x2',
      '기란(풍5지5) x2',
      '격수(풍7지3) x1',
    ],
  },
  {
    floor: 50,
    setup: '수',
    support: '수우대',
    rainbow: '마그노, 매트노',
    boss: '카무르, 머그노/마그노(부활), 매트노(혼란), 맘트노(석화)',
    basic: [
      '머그노(풍10) x1',
      '마그노(지9풍1) x1',
      '매트노(지9풍1) x2',
      '맘그노(화8품2) x2',
      '맘트노(수5화5) x2',
      '카무르(화9품1) x1',
    ],
    aurora: [
      '머그노(수10) x1',
      '마그노(화9수1) x1',
      '매트노(화9수1) x2',
      '맘그노(지8수2) x2',
      '맘트노(풍5지5) x2',
      '카무르(지9수1) x1',
    ],
  },
  {
    floor: 60,
    setup: '수',
    support: '수우대',
    rainbow: 'X',
    boss: '엘크룬, 엘크론(부활), 스켈렉스(석화)',
    basic: [
      '보투케스(화5풍5) x2',
      '스켈렉스(풍6화4) x3',
      '가론고르(화8수2) x4',
      '엘크룬(화7풍3) x1',
    ],
    aurora: [
      '보투케스(지5수5) x2',
      '스켈렉스(수6지4) x3',
      '가론고르(지8풍2) x4',
      '엘크룬(지7수3) x1',
    ],
  },
  {
    floor: 70,
    setup: '지 (상대: 오로라)',
    support: '지우대',
    rainbow: '혈기노, 흑갈푸스',
    boss: '스피온',
    note: '안전하게 무지개 다 걸때까지 완캐+펫 가드 / 순캐 펫 가드',
    basic: [
      '혈기노(수10) x2',
      '라이쿠스(풍7화3) x2',
      '만보돈(풍8지2) x2',
      '르논(풍8지2) x2',
      '흑갈푸스(화8풍2) x1',
      '스피온(풍7지3) x1',
    ],
    aurora: [
      '혈기노(풍10) x2',
      '라이쿠스(수7지3) x2',
      '만보돈(수8화2) x2',
      '르논(수8화2) x2',
      '흑갈푸스(지8수2) x1',
      '스피온(수7화3) x1',
    ],
  },
  {
    floor: 80,
    setup: '수',
    support: '수우대',
    rainbow: '기로, 비노',
    boss: '메가테라냐',
    note: '안전하게 무지개 다 걸때까지 완캐+펫 가드 / 순캐 펫 가드',
    basic: [
      '기노(화8품2) x2',
      '비노(지8수2) x2',
      '기보로(화??수??) x2',
      '기로(수9화1) x2',
      '잔비노(지??풍?) x1',
      '메가테라냐(풍9지1) x1',
    ],
    aurora: [
      '기노(지8수2) x2',
      '비노(화8품2) x2',
      '기보로(지??풍??) x2',
      '기로(풍9지1) x2',
      '잔비노(화??수??) x1',
      '메가테라냐(수9화1) x1',
    ],
  },
  {
    floor: 90,
    setup: '수',
    support: '수우대',
    rainbow: '자피온',
    boss: '타무르, 타무르(부활), 자피온(가블)',
    note: '보스는 캐릭 안침',
    basic: [
      '자피온(지9수1)',
      '스켈로그(화10)',
      '싸가트(화9수1)',
      '킹고르(지?풍?)',
      '타무르(지3품7)',
      '쿠라스(화7수3)',
    ],
    aurora: [
      '자피온(화9품1)',
      '스켈로그(지10)',
      '싸가트(지9품1)',
      '킹고르(화?수)',
      '타무르(화3수7)',
      '쿠라스(지7품3)',
    ],
  },
  {
    floor: 100,
    setup: '수',
    support: '수우대',
    rainbow: '어스, 아이스, 본',
    boss: '바르굴, 어스(강력), 본드(부활), 헬무르(석화,수면,혼란 등)',
    note: '안전하게 무지개 다 걸때까지 완캐+펫 가드 / 순캐 펫 충견',
    basic: [
      '어스(지8풍2) x1',
      '본드(지4수6) x2',
      '아드(수8화2) x1',
      '블드(화8수2) x1',
      '헬무르(화?풍?) x1',
      '파킹드(화9풍1) x2',
      '레드(화9풍1) x1',
      '바르굴(화8풍2) x1',
    ],
    aurora: [
      '어스(화8수2) x1',
      '본드(화4풍6) x2',
      '아드(풍8지2) x1',
      '블드(지8풍2) x1',
      '헬무르(지?수?) x1',
      '파킹드(지9수1) x2',
      '레드(지9수1) x1',
      '바르굴(지8수2) x1',
    ],
  },
];

// 정령왕 공략 데이터
const spiritKingStrategies = [
  {
    title: '정령왕 (수셋팅)',
    setup: '수',
    support: '수우대',
    rainbow: '홉킨스, 파사트, 케라스, 스노블',
    boss: '엘크론(부활), 홉킨스(부활), 멍클(부활), 파사트(강력)',
    note: '안전하게 무지개 다 걸때까지 완캐+펫 가드 / 순캐 펫 충견',
    basic: [
      '파사트(지6수4)',
      '홉킨스(지8수2)',
      '엘크룬(화7풍3)',
      '멍클(풍7지3)',
      '메가테라냐(풍9지1)',
      '스피온(풍7지3)',
      '스노블(수7화3)',
      '케라스(수6화4)',
      '카무르(화9풍1)',
      '정령왕(지?풍?)',
    ],
    aurora: [
      '파사트(화6풍4)',
      '홉킨스(화8풍2)',
      '엘크룬(지7수3)',
      '멍클(수7화3)',
      '메가테라냐(수9화1)',
      '스피온(수7화3)',
      '스노블(풍7지3)',
      '케라스(풍6지4)',
      '카무르(지9수1)',
      '정령왕(화?수?)',
    ],
  },
  {
    title: '정령왕 (지셋팅) 추천',
    setup: '지 (상대: 오로라)',
    support: '지우대',
    rainbow: '엘크룬, 스노블, 케라스, 카무르',
    boss: '엘크룬(부활), 홉킨스(부활), 멍클(부활), 파사트(강력)',
    note: '안전하게 무지개 다 걸때까지 완캐+펫 가드 / 순캐 펫 충견',
    basic: [
      '파사트(지6수4)',
      '멍클(풍7지3)',
      '엘크룬(화7풍3)',
      '홉킨스(지8수2)',
      '메가테라냐(풍9지1)',
      '스피온(풍7지3)',
      '스노블(수7화3)',
      '케라스(수6화4)',
      '카무르(화9풍1)',
      '정령왕(지?풍?)',
    ],
    aurora: [
      '파사트(화6풍4)',
      '멍클(수7화3)',
      '엘크룬(지7수3)',
      '홉킨스(화8풍2)',
      '메가테라냐(수9화1)',
      '스피온(수7화3)',
      '스노블(풍7지3)',
      '케라스(풍6지4)',
      '카무르(지9수1)',
      '정령왕(화?수?)',
    ],
  },
];

// 라돈타 컨텐츠 컴포넌트
const RadontaContent: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* 타이틀 */}
      <h2 className="text-xl font-bold text-text-primary text-center mb-6">라돈타 공략</h2>

      {/* 기본 수칙 */}
      <div className="bg-bg-secondary rounded-lg p-4 border border-border">
        <h3 className="text-base font-bold mb-3 text-text-primary flex items-center gap-2">
          <span>📌</span> 기본 수칙
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">
              우리팀 오로라는 지양한다 (펫 교체 시 무지개를 써야하기 때문)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">캐릭터 지속 10, 수속 10 필수</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">
              완캐 충견 + 활은 어중간한 완캐는 하지 말 것
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">완500미만은 펫 배3이 더 효과적</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">보스만 남았을 시 창첸 올일공 다굴</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">
              순캐 탑펫: 돌북이 & 카타 & 바우트 & 고르돈
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">
              완캐는 바우트 탑승 (탱펫 탈 것) - 탑순은 주술에 영향이 가지 않으므로 탱펫을 탑승하여
              방어구를 증진
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">우대는 1남았을때 무조건 우대 덮어쓰기</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span className="text-text-secondary">
              70층부터 선 뺏길 가능성 큼, 피100%라도 메인힐은 힐 계속 쓸 것
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold">⚠</span>
            <span className="text-red-500">
              상대 펫 속성은 틀릴 가능성이 있음 - 수정 필요 시 연락바람 ( 박준순 / 준순 )
            </span>
          </li>
        </ul>
      </div>

      {/* 층별 공략 */}
      <div className="space-y-3">
        {radontaFloors.map(floor => (
          <div
            key={floor.floor}
            className="bg-bg-secondary rounded-lg p-3 border border-border"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-3 pb-3 border-b border-border">
              <div className="bg-accent text-white font-bold text-base px-3 py-1.5 rounded-lg">
                {floor.floor}층
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-bg-tertiary px-2 py-1.5 rounded border border-border flex items-center">
                  <span className="text-text-secondary">셋팅:</span>{' '}
                  <span className="font-bold text-text-primary ml-1">{floor.setup}</span>
                </div>
                <div className="bg-bg-tertiary px-2 py-1.5 rounded border border-border flex items-center">
                  <span className="text-text-secondary">우대:</span>{' '}
                  <span className="font-bold text-text-primary ml-1">{floor.support}</span>
                </div>
                <div className="bg-bg-tertiary px-2 py-1.5 rounded border border-border flex items-center">
                  <span className="text-text-secondary">무지개:</span>{' '}
                  <span className="font-bold text-text-primary ml-1">{floor.rainbow}</span>
                </div>
              </div>
            </div>

            <div className="mb-2 bg-red-500/10 border border-red-500/30 rounded p-2">
              <span className="font-bold text-red-500 text-xs">보스:</span>{' '}
              <span className="text-text-secondary text-xs">{floor.boss}</span>
            </div>

            {floor.note && (
              <div className="mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                <span className="font-bold text-yellow-600 text-xs">⚠️ 주의:</span>{' '}
                <span className="text-text-secondary text-xs">{floor.note}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-bg-tertiary rounded p-3 border border-border">
                <h4 className="font-bold text-green-500 mb-2 text-sm">기본</h4>
                <ul className="space-y-1.5">
                  {floor.basic.map((pet, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-text-secondary flex items-center gap-2"
                    >
                      <span className="bg-green-500 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      {pet}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-bg-tertiary rounded p-3 border border-border">
                <h4 className="font-bold text-blue-500 mb-2 text-sm">오로라</h4>
                <ul className="space-y-1.5">
                  {floor.aurora.map((pet, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-text-secondary flex items-center gap-2"
                    >
                      <span className="bg-blue-500 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      {pet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 정령왕 공략 */}
      <div className="space-y-3 mt-6">
        <h3 className="text-lg font-bold text-center text-text-primary">정령왕 공략</h3>
        {spiritKingStrategies.map((strategy, idx) => (
          <div
            key={idx}
            className="bg-bg-secondary rounded-lg p-3 border border-border"
          >
            <div className="flex items-center gap-4 mb-3 pb-3 border-b border-border">
              <h4 className="text-base font-bold text-text-primary">{strategy.title}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 text-xs">
              <div className="bg-bg-tertiary px-2 py-1.5 rounded border border-border flex items-center">
                <span className="text-text-secondary">셋팅:</span>{' '}
                <span className="font-bold text-text-primary ml-1">{strategy.setup}</span>
              </div>
              <div className="bg-bg-tertiary px-2 py-1.5 rounded border border-border flex items-center">
                <span className="text-text-secondary">우대:</span>{' '}
                <span className="font-bold text-text-primary ml-1">{strategy.support}</span>
              </div>
              <div className="bg-bg-tertiary px-2 py-1.5 rounded border border-border flex items-center">
                <span className="text-text-secondary">무지개:</span>{' '}
                <span className="font-bold text-text-primary ml-1">{strategy.rainbow}</span>
              </div>
            </div>

            <div className="mb-2 bg-red-500/10 border border-red-500/30 rounded p-2">
              <span className="font-bold text-red-500 text-xs">보스:</span>{' '}
              <span className="text-text-secondary text-xs">{strategy.boss}</span>
            </div>

            {strategy.note && (
              <div className="mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                <span className="font-bold text-yellow-600 text-xs">⚠️ 주의:</span>{' '}
                <span className="text-text-secondary text-xs">{strategy.note}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-bg-tertiary rounded p-3 border border-border">
                <h5 className="font-bold text-green-500 mb-2 text-sm">기본</h5>
                <ul className="space-y-1.5">
                  {strategy.basic.map((pet, petIdx) => (
                    <li
                      key={petIdx}
                      className="text-xs text-text-secondary flex items-center gap-2"
                    >
                      <span className="bg-green-500 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                        {petIdx + 1}
                      </span>
                      {pet}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-bg-tertiary rounded p-3 border border-border">
                <h5 className="font-bold text-blue-500 mb-2 text-sm">오로라</h5>
                <ul className="space-y-1.5">
                  {strategy.aurora.map((pet, petIdx) => (
                    <li
                      key={petIdx}
                      className="text-xs text-text-secondary flex items-center gap-2"
                    >
                      <span className="bg-blue-500 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                        {petIdx + 1}
                      </span>
                      {pet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface RightItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  materials?: string;
}

// 로컬 이미지 경로 처리 (로컬/프로덕션 환경 모두 지원)
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${import.meta.env.BASE_URL}${url}`;
};

const TipPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 펼쳐진 보스 ID 상태
  const [expandedBossId, setExpandedBossId] = useState<string | null>(null);

  // right_items.json을 id로 빠르게 조회할 수 있는 맵 생성
  const itemsMap = useMemo(() => {
    const map = new Map<string, RightItem>();
    (rightItemsData as RightItem[]).forEach(item => {
      map.set(item.id, item);
    });
    return map;
  }, []);

  // URL에서 탭 상태 초기화
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'mytip' || tabFromUrl === 'raid') {
      return tabFromUrl;
    }
    return 'mytip'; // 기본값을 나만의 팁으로 변경
  });

  // 레이드 서브탭 상태
  const [raidSubTab, setRaidSubTab] = useState<RaidSubTab>(() => {
    const subTabFromUrl = searchParams.get('sub');
    return subTabFromUrl === 'radonta' || subTabFromUrl === 'ice-castle' || subTabFromUrl === 'weekly' ? subTabFromUrl : 'radonta';
  });

  // 페이지 로드 시 URL에 기본값 설정
  useEffect(() => {
    const currentTab = searchParams.get('tab');

    // URL에 탭 정보가 없으면 기본값 설정
    if (!currentTab) {
      setSearchParams({ tab: mainTab }, { replace: true });
    }
  }, []);

  // 메인 탭 변경 핸들러
  const handleMainTabChange = useCallback((tab: MainTab) => {
    setMainTab(tab);
    if (tab === 'mytip') {
      // mytip 탭일 때는 sub 파라미터 제거
      setSearchParams({ tab });
    } else {
      // raid 탭일 때는 sub 파라미터 유지/설정
      setSearchParams({ tab, sub: raidSubTab });
    }
  }, [setSearchParams, raidSubTab]);

  // 서브탭 변경 핸들러
  const handleRaidSubTabChange = useCallback((tab: RaidSubTab) => {
    setRaidSubTab(tab);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', 'raid');
      newParams.set('sub', tab);
      return newParams;
    });
  }, [setSearchParams]);

  // 보스 아코디언 토글
  const toggleBoss = useCallback((bossId: string) => {
    setExpandedBossId(prev => prev === bossId ? null : bossId);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="text-center text-text-secondary space-y-4">
          <p className="text-base md:text-lg">스톤에이지 공략 팁</p>

          {/* 정보성 알림 박스 */}
          <div className="bg-bg-secondary border-l-4 border-accent rounded-r-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-accent text-lg flex-shrink-0">💡</div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">
                  게임 플레이에 유용한 공략과 팁을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 탭 (나만의 팁 + 레이드) */}
      <div className="mb-4">
        <div className="flex space-x-1 bg-bg-secondary rounded-lg p-1">
          <button
            onClick={() => handleMainTabChange('mytip')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              mainTab === 'mytip'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            나만의 팁
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500 text-black rounded-full">
              BETA
            </span>
          </button>
          <button
            onClick={() => handleMainTabChange('raid')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              mainTab === 'raid'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            레이드
          </button>
        </div>
        {/* 나만의 팁 안내 문구 */}
        {mainTab === 'mytip' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-yellow-500">
            <span>⚠️</span>
            <span>서버가 불안정 할 수 있습니다. 서버 접속이 안될경우 왕/킹에게 문의 주세요.</span>
          </div>
        )}
        {/* 레이드 안내 문구 */}
        {mainTab === 'raid' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-yellow-500">
            <span>⚠️</span>
            <span>레이드의 경우 파티마다 공략방법이 다를 수 있습니다.</span>
          </div>
        )}
      </div>

      {/* 레이드 서브탭 */}
      {mainTab === 'raid' && (
        <div className="mb-6">
          <div className="flex space-x-1 bg-bg-tertiary rounded-lg p-1">
            <button
              onClick={() => handleRaidSubTabChange('radonta')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                raidSubTab === 'radonta'
                  ? 'bg-blue-500 text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              라돈타
            </button>
            <button
              onClick={() => handleRaidSubTabChange('ice-castle')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                raidSubTab === 'ice-castle'
                  ? 'bg-blue-500 text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              얼음성
            </button>
            <button
              onClick={() => handleRaidSubTabChange('weekly')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                raidSubTab === 'weekly'
                  ? 'bg-blue-500 text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              주간
            </button>
          </div>
          {/* 주간 레이드 공통 정보 */}
          {raidSubTab === 'weekly' && (
            <div className="flex items-center gap-2 mt-2 text-xs text-blue-400">
              <span>ℹ️</span>
              <span>주간 레이드 공통정보: {weeklyRaidData.commonInfo}</span>
            </div>
          )}
        </div>
      )}

      {/* 나만의 팁 컨텐츠 */}
      {mainTab === 'mytip' && (
        <MyTipBoard />
      )}

      {/* 라돈타 공략 컨텐츠 */}
      {mainTab === 'raid' && raidSubTab === 'radonta' && (
        <RadontaContent />
      )}

      {/* 얼음성 공략 컨텐츠 */}
      {mainTab === 'raid' && raidSubTab === 'ice-castle' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary text-center mb-6">
            {iceCastleData.title}
          </h2>

          {iceCastleData.bosses.map((boss) => {
            const isExpanded = expandedBossId === boss.id;
            return (
              <div
                key={boss.id}
                className="bg-bg-secondary border border-border rounded-xl overflow-hidden"
              >
                {/* 보스 헤더 (클릭 가능) */}
                <button
                  onClick={() => toggleBoss(boss.id)}
                  className="w-full p-4 flex items-center justify-between gap-2 hover:bg-bg-tertiary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-text-primary">
                      {boss.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-bg-tertiary rounded-full text-xs text-text-secondary">
                        {boss.room}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        boss.attribute === '수속성'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {boss.attribute}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-text-secondary transition-transform duration-200 flex-shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 보스 상세 정보 (펼쳐질 때만 표시) */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border">
                    {/* 준비물 */}
                    <div className="pt-4">
                      <h4 className="text-sm font-medium text-text-secondary mb-2">준비물</h4>
                      <div className="flex flex-wrap gap-2">
                        {boss.preparation.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 페트 */}
                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-2">페트</h4>
                      <span className="px-3 py-1 bg-accent/20 text-accent rounded-lg text-sm font-medium">
                        {boss.pet}
                      </span>
                    </div>

                    {/* 공략 */}
                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-2">공략</h4>
                      <ol className="space-y-2">
                        {boss.strategy.map((step, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-sm text-text-primary"
                          >
                            <span className="flex-shrink-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* 기타 */}
                    {boss.etc && (
                      <div className="text-sm text-text-muted italic">
                        💬 {boss.etc}
                      </div>
                    )}

                    {/* 보상 */}
                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-3">보상</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-2 text-text-secondary font-medium w-16">이미지</th>
                              <th className="text-left py-2 px-2 text-text-secondary font-medium">아이템</th>
                              <th className="text-left py-2 px-2 text-text-secondary font-medium hidden sm:table-cell">설명</th>
                            </tr>
                          </thead>
                          <tbody>
                            {boss.rewards.map((reward, idx) => {
                              const itemInfo = itemsMap.get(reward.itemId);
                              return (
                                <tr key={idx} className="border-b border-border/50 hover:bg-bg-tertiary/50 transition-colors">
                                  <td className="py-2 px-2">
                                    <div className="w-12 h-12 bg-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center">
                                      {itemInfo?.imageUrl ? (
                                        <img
                                          src={getImageUrl(itemInfo.imageUrl)}
                                          alt={reward.name}
                                          className="w-full h-full object-contain"
                                          onError={e => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <span className="text-text-muted text-xs">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-text-primary">{reward.name}</div>
                                    {/* 모바일에서 설명 표시 */}
                                    <div className="sm:hidden text-xs text-text-muted mt-1 line-clamp-2">
                                      {itemInfo?.description || '-'}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2 text-text-secondary hidden sm:table-cell">
                                    {itemInfo?.description || '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 주간 레이드 공략 컨텐츠 */}
      {mainTab === 'raid' && raidSubTab === 'weekly' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary text-center mb-6">
            {weeklyRaidData.title}
          </h2>

          {weeklyRaidData.bosses.map((boss) => {
            const isExpanded = expandedBossId === boss.id;
            return (
              <div
                key={boss.id}
                className="bg-bg-secondary border border-border rounded-xl overflow-hidden"
              >
                {/* 보스 헤더 (클릭 가능) */}
                <button
                  onClick={() => toggleBoss(boss.id)}
                  className="w-full p-4 flex items-center justify-between gap-2 hover:bg-bg-tertiary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-text-primary">
                      {boss.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      boss.attribute === '수속성'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {boss.attribute}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-text-secondary transition-transform duration-200 flex-shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 보스 상세 정보 (펼쳐질 때만 표시) */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border">
                    {/* 준비물 */}
                    <div className="pt-4">
                      <h4 className="text-sm font-medium text-text-secondary mb-2">준비물</h4>
                      <div className="flex flex-wrap gap-2">
                        {boss.preparation.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 페트 */}
                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-2">페트</h4>
                      <span className="px-3 py-1 bg-accent/20 text-accent rounded-lg text-sm font-medium">
                        {boss.pet}
                      </span>
                    </div>

                    {/* 공략 */}
                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-2">공략</h4>
                      <ol className="space-y-2">
                        {boss.strategy.map((step, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-sm text-text-primary"
                          >
                            <span className="flex-shrink-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* 기타 */}
                    {boss.etc && (
                      <div className="text-sm text-text-muted italic">
                        💬 {boss.etc}
                      </div>
                    )}

                    {/* 보상 */}
                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-3">보상</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-2 text-text-secondary font-medium w-16">이미지</th>
                              <th className="text-left py-2 px-2 text-text-secondary font-medium">아이템</th>
                              <th className="text-left py-2 px-2 text-text-secondary font-medium hidden sm:table-cell">설명</th>
                            </tr>
                          </thead>
                          <tbody>
                            {boss.rewards.map((reward, idx) => {
                              const itemInfo = itemsMap.get(reward.itemId);
                              return (
                                <tr key={idx} className="border-b border-border/50 hover:bg-bg-tertiary/50 transition-colors">
                                  <td className="py-2 px-2">
                                    <div className="w-12 h-12 bg-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center">
                                      {itemInfo?.imageUrl ? (
                                        <img
                                          src={getImageUrl(itemInfo.imageUrl)}
                                          alt={reward.name}
                                          className="w-full h-full object-contain"
                                          onError={e => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <span className="text-text-muted text-xs">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-text-primary">{reward.name}</div>
                                    {/* 모바일에서 설명 표시 */}
                                    <div className="sm:hidden text-xs text-text-muted mt-1 line-clamp-2">
                                      {itemInfo?.description || '-'}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2 text-text-secondary hidden sm:table-cell">
                                    {itemInfo?.description || '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TipPage;
