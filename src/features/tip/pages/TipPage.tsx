import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Lightbulb, ChevronDown, AlertTriangle, Info, Swords, Castle, Calendar } from 'lucide-react';
import iceCastleData from '@/data/ice_castle.json';
import weeklyRaidData from '@/data/weekly_raid.json';
import rightItemsData from '@/data/right_items.json';
import MyTipBoard from '../components/MyTipBoard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    <div className="space-y-6">
      {/* 타이틀 */}
      <div className="text-center">
        <Badge variant="outline" className="gap-2 px-4 py-2 text-base">
          <Swords className="w-4 h-4" />
          라돈타 공략
        </Badge>
      </div>

      {/* 기본 수칙 */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Info className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-text-primary">기본 수칙</h3>
        </div>
        <ul className="space-y-3">
          {[
            '우리팀 오로라는 지양한다 (펫 교체 시 무지개를 써야하기 때문)',
            '캐릭터 지속 10, 수속 10 필수',
            '완캐 충견 + 활은 어중간한 완캐는 하지 말 것',
            '완500미만은 펫 배3이 더 효과적',
            '보스만 남았을 시 창첸 올일공 다굴',
            '순캐 탑펫: 돌북이 & 카타 & 바우트 & 고르돈',
            '완캐는 바우트 탑승 (탱펫 탈 것) - 탑순은 주술에 영향이 가지 않으므로 탱펫을 탑승하여 방어구를 증진',
            '우대는 1남았을때 무조건 우대 덮어쓰기',
            '70층부터 선 뺏길 가능성 큼, 피100%라도 메인힐은 힐 계속 쓸 것',
          ].map((tip, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-accent text-xs font-bold">{idx + 1}</span>
              </span>
              <span className="text-sm text-text-secondary">{tip}</span>
            </li>
          ))}
          <li className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-500">
              상대 펫 속성은 틀릴 가능성이 있음 - 수정 필요 시 연락바람 ( 박준순 / 준순 )
            </span>
          </li>
        </ul>
      </Card>

      {/* 층별 공략 */}
      <div className="space-y-4">
        {radontaFloors.map(floor => (
          <Card key={floor.floor} className="overflow-hidden">
            {/* 층 헤더 */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Badge className="w-fit text-base px-4 py-1.5 bg-accent text-white">
                  {floor.floor}층
                </Badge>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                    <span className="text-xs text-text-muted">셋팅</span>
                    <span className="text-sm font-semibold text-text-primary">{floor.setup}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                    <span className="text-xs text-text-muted">우대</span>
                    <span className="text-sm font-semibold text-text-primary">{floor.support}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                    <span className="text-xs text-text-muted">무지개</span>
                    <span className="text-sm font-semibold text-text-primary">{floor.rainbow}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* 보스 정보 */}
              <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                <Swords className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-red-500 block mb-1">보스</span>
                  <span className="text-sm text-text-secondary">{floor.boss}</span>
                </div>
              </div>

              {/* 주의사항 */}
              {floor.note && (
                <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-amber-500 block mb-1">주의</span>
                    <span className="text-sm text-text-secondary">{floor.note}</span>
                  </div>
                </div>
              )}

              {/* 기본/오로라 펫 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <h4 className="text-sm font-bold text-emerald-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    기본
                  </h4>
                  <ul className="space-y-2">
                    {floor.basic.map((pet, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        {pet}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                  <h4 className="text-sm font-bold text-blue-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    오로라
                  </h4>
                  <ul className="space-y-2">
                    {floor.aurora.map((pet, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        {pet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 정령왕 공략 */}
      <div className="space-y-4 mt-8">
        <div className="text-center">
          <Badge variant="outline" className="gap-2 px-4 py-2 text-base">
            <Castle className="w-4 h-4" />
            정령왕 공략
          </Badge>
        </div>

        {spiritKingStrategies.map((strategy, idx) => (
          <Card key={idx} className="overflow-hidden">
            {/* 전략 헤더 */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-purple-500/5 to-transparent">
              <h4 className="text-lg font-bold text-text-primary">{strategy.title}</h4>
            </div>

            <div className="p-4 space-y-4">
              {/* 설정 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                  <span className="text-xs text-text-muted">셋팅</span>
                  <span className="text-sm font-semibold text-text-primary">{strategy.setup}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                  <span className="text-xs text-text-muted">우대</span>
                  <span className="text-sm font-semibold text-text-primary">{strategy.support}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                  <span className="text-xs text-text-muted">무지개</span>
                  <span className="text-sm font-semibold text-text-primary">{strategy.rainbow}</span>
                </div>
              </div>

              {/* 보스 정보 */}
              <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                <Swords className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-red-500 block mb-1">보스</span>
                  <span className="text-sm text-text-secondary">{strategy.boss}</span>
                </div>
              </div>

              {/* 주의사항 */}
              {strategy.note && (
                <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-amber-500 block mb-1">주의</span>
                    <span className="text-sm text-text-secondary">{strategy.note}</span>
                  </div>
                </div>
              )}

              {/* 기본/오로라 펫 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <h5 className="text-sm font-bold text-emerald-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    기본
                  </h5>
                  <ul className="space-y-2">
                    {strategy.basic.map((pet, petIdx) => (
                      <li key={petIdx} className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {petIdx + 1}
                        </span>
                        {pet}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                  <h5 className="text-sm font-bold text-blue-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    오로라
                  </h5>
                  <ul className="space-y-2">
                    {strategy.aurora.map((pet, petIdx) => (
                      <li key={petIdx} className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {petIdx + 1}
                        </span>
                        {pet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
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
    <div className="max-w-6xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Lightbulb className="w-4 h-4" />
            스톤에이지 공략 팁
          </Badge>

          {/* 정보성 알림 박스 */}
          <Card className="p-4">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-text-secondary text-left">
                게임 플레이에 유용한 <span className="font-medium text-text-primary">공략과 팁</span>을 제공합니다.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 메인 탭 (나만의 팁 + 레이드) */}
      <div className="mb-6 px-4 md:px-0">
        <Card className="relative p-1.5">
          {/* 슬라이딩 배경 인디케이터 */}
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-accent shadow-glow
                       transition-all duration-300 ease-out-expo pointer-events-none"
            style={{
              left: mainTab === 'mytip' ? '6px' : 'calc(50% + 2px)',
              width: 'calc(50% - 8px)',
            }}
          />
          <Button
            variant="ghost"
            onClick={() => handleMainTabChange('mytip')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300",
              mainTab === 'mytip' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Lightbulb className="w-4 h-4" />
            나만의 팁
            <Badge className="ml-1 px-1.5 py-0 text-[10px] bg-amber-500 text-black hover:bg-amber-500">
              BETA
            </Badge>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleMainTabChange('raid')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300",
              mainTab === 'raid' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Swords className="w-4 h-4" />
            레이드
          </Button>
        </Card>

        {/* 안내 문구 */}
        {mainTab === 'mytip' && (
          <Card className="mt-3 p-3 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 text-xs text-amber-500">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>서버가 불안정 할 수 있습니다. 서버 접속이 안될경우 왕/킹에게 문의 주세요.</span>
            </div>
          </Card>
        )}
        {mainTab === 'raid' && (
          <Card className="mt-3 p-3 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 text-xs text-amber-500">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>레이드의 경우 파티마다 공략방법이 다를 수 있습니다.</span>
            </div>
          </Card>
        )}
      </div>

      {/* 레이드 서브탭 */}
      {mainTab === 'raid' && (
        <div className="mb-6">
          <Card className="relative p-1.5">
            {/* 슬라이딩 배경 인디케이터 */}
            <div
              className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-blue-500 shadow-glow
                         transition-all duration-300 ease-out-expo pointer-events-none"
              style={{
                left: raidSubTab === 'radonta' ? '6px' : raidSubTab === 'ice-castle' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 2px)',
                width: 'calc(33.33% - 8px)',
              }}
            />
            <Button
              variant="ghost"
              onClick={() => handleRaidSubTabChange('radonta')}
              className={cn(
                "relative z-10 flex-1 w-1/3 gap-2 rounded-xl transition-colors duration-300",
                raidSubTab === 'radonta' ? 'text-white hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Swords className="w-4 h-4" />
              라돈타
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleRaidSubTabChange('ice-castle')}
              className={cn(
                "relative z-10 flex-1 w-1/3 gap-2 rounded-xl transition-colors duration-300",
                raidSubTab === 'ice-castle' ? 'text-white hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Castle className="w-4 h-4" />
              얼음성
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleRaidSubTabChange('weekly')}
              className={cn(
                "relative z-10 flex-1 w-1/3 gap-2 rounded-xl transition-colors duration-300",
                raidSubTab === 'weekly' ? 'text-white hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Calendar className="w-4 h-4" />
              주간
            </Button>
          </Card>

          {/* 주간 레이드 공통 정보 */}
          {raidSubTab === 'weekly' && (
            <Card className="mt-3 p-3 border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>주간 레이드 공통정보: {weeklyRaidData.commonInfo}</span>
              </div>
            </Card>
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
          <div className="text-center">
            <Badge variant="outline" className="gap-2 px-4 py-2 text-base">
              <Castle className="w-4 h-4" />
              {iceCastleData.title}
            </Badge>
          </div>

          {iceCastleData.bosses.map((boss) => {
            const isExpanded = expandedBossId === boss.id;
            return (
              <Card key={boss.id} className="overflow-hidden">
                {/* 보스 헤더 (클릭 가능) */}
                <button
                  onClick={() => toggleBoss(boss.id)}
                  className="w-full p-4 flex items-center justify-between gap-2 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-text-primary">
                      {boss.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {boss.room}
                      </Badge>
                      <Badge className={cn(
                        "text-xs",
                        boss.attribute === '수속성'
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      )}>
                        {boss.attribute}
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-text-secondary transition-transform duration-200 flex-shrink-0",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* 보스 상세 정보 (펼쳐질 때만 표시) */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border">
                    {/* 준비물 */}
                    <div className="pt-4">
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        준비물
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {boss.preparation.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1.5">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 페트 */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        페트
                      </h4>
                      <Badge className="bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1.5">
                        {boss.pet}
                      </Badge>
                    </div>

                    {/* 공략 */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        공략
                      </h4>
                      <ol className="space-y-3">
                        {boss.strategy.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
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
                      <Card className="p-3 bg-bg-tertiary border-none">
                        <div className="flex items-start gap-2 text-sm text-text-muted">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {boss.etc}
                        </div>
                      </Card>
                    )}

                    {/* 보상 */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        보상
                      </h4>
                      <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-bg-tertiary/50">
                                <th className="text-left py-3 px-3 text-text-muted font-medium w-16">이미지</th>
                                <th className="text-left py-3 px-3 text-text-muted font-medium">아이템</th>
                                <th className="text-left py-3 px-3 text-text-muted font-medium hidden sm:table-cell">설명</th>
                              </tr>
                            </thead>
                            <tbody>
                              {boss.rewards.map((reward, idx) => {
                                const itemInfo = itemsMap.get(reward.itemId);
                                return (
                                  <tr key={idx} className="border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors">
                                    <td className="py-3 px-3">
                                      <div className="w-12 h-12 bg-bg-secondary rounded-lg overflow-hidden flex items-center justify-center border border-border">
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
                                    <td className="py-3 px-3">
                                      <div className="font-medium text-text-primary">{reward.name}</div>
                                      <div className="sm:hidden text-xs text-text-muted mt-1 line-clamp-2">
                                        {itemInfo?.description || '-'}
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 text-text-secondary hidden sm:table-cell">
                                      {itemInfo?.description || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 주간 레이드 공략 컨텐츠 */}
      {mainTab === 'raid' && raidSubTab === 'weekly' && (
        <div className="space-y-6">
          <div className="text-center">
            <Badge variant="outline" className="gap-2 px-4 py-2 text-base">
              <Calendar className="w-4 h-4" />
              {weeklyRaidData.title}
            </Badge>
          </div>

          {weeklyRaidData.bosses.map((boss) => {
            const isExpanded = expandedBossId === boss.id;
            return (
              <Card key={boss.id} className="overflow-hidden">
                {/* 보스 헤더 (클릭 가능) */}
                <button
                  onClick={() => toggleBoss(boss.id)}
                  className="w-full p-4 flex items-center justify-between gap-2 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-text-primary">
                      {boss.name}
                    </h3>
                    <Badge className={cn(
                      "text-xs",
                      boss.attribute === '수속성'
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    )}>
                      {boss.attribute}
                    </Badge>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-text-secondary transition-transform duration-200 flex-shrink-0",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* 보스 상세 정보 (펼쳐질 때만 표시) */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border">
                    {/* 준비물 */}
                    <div className="pt-4">
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        준비물
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {boss.preparation.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1.5">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 페트 */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        페트
                      </h4>
                      <Badge className="bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1.5">
                        {boss.pet}
                      </Badge>
                    </div>

                    {/* 공략 */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        공략
                      </h4>
                      <ol className="space-y-3">
                        {boss.strategy.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
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
                      <Card className="p-3 bg-bg-tertiary border-none">
                        <div className="flex items-start gap-2 text-sm text-text-muted">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {boss.etc}
                        </div>
                      </Card>
                    )}

                    {/* 보상 */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        보상
                      </h4>
                      <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-bg-tertiary/50">
                                <th className="text-left py-3 px-3 text-text-muted font-medium w-16">이미지</th>
                                <th className="text-left py-3 px-3 text-text-muted font-medium">아이템</th>
                                <th className="text-left py-3 px-3 text-text-muted font-medium hidden sm:table-cell">설명</th>
                              </tr>
                            </thead>
                            <tbody>
                              {boss.rewards.map((reward, idx) => {
                                const itemInfo = itemsMap.get(reward.itemId);
                                return (
                                  <tr key={idx} className="border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors">
                                    <td className="py-3 px-3">
                                      <div className="w-12 h-12 bg-bg-secondary rounded-lg overflow-hidden flex items-center justify-center border border-border">
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
                                    <td className="py-3 px-3">
                                      <div className="font-medium text-text-primary">{reward.name}</div>
                                      <div className="sm:hidden text-xs text-text-muted mt-1 line-clamp-2">
                                        {itemInfo?.description || '-'}
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 text-text-secondary hidden sm:table-cell">
                                      {itemInfo?.description || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TipPage;
