import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const RadontaPage: React.FC = () => {
  const navigate = useNavigate();
  const floors = [
    {
      floor: 10,
      setup: '수',
      support: '수우대',
      rainbow: '홉킨스, 카라쿠',
      boss: '홉킨스(부활), 카라쿠(부활)',
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
        '토라티스(지8중1) x2',
        '파사트(지6수4) x1',
      ],
      aurora: [
        '헷지(수8화2) x2',
        '베르고(화7수3) x2',
        '지고르(화9품1) x3',
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
        '기란(중5지5) x2',
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
        '마그노(지9중1) x1',
        '매트노(지9중1) x2',
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
        '흑갈푸스(화8품2) x1',
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
      boss: '타무르, 보스(부활), 자피온(가블)',
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
      boss: '바르굴, 어스(강력), 본드(부활)',
      note: '안전하게 무지개 다 걸때까지 완캐+펫 가드 / 순캐 펫 가드',
      basic: [
        '어스(지8풍2) x1',
        '본드(지4수6) x2',
        '아드(수8화2) x1',
        '파킹드(화9품1) x2',
        '블드(화8수2) x1',
        '헬무르(화?품?) x1',
        '레드(화9품1) x1',
        '바르굴(화8품2) x1',
      ],
      aurora: [
        '어스(화8수2) x1',
        '본드(화4풍6) x2',
        '아드(풍8지2) x1',
        '파킹드(지9수1) x2',
        '블드(지8중2) x1',
        '헬무르(지?수?) x1',
        '레드(지9수1) x1',
        '바르굴(지8수2) x1',
      ],
    },
  ];

  const spiritKingStrategies = [
    {
      title: '정령왕 (수셋팅)',
      setup: '수',
      support: '수우대',
      rainbow: '홉킨스, 파사트, 케라스, 스노블',
      boss: '엘크론(부활), 홉킨스(부활)',
      note: '안전하게 무지개 다 걸때까지 완+펫 가드 / 순 펫 충견',
      basic: [
        '파사트(지6수4)',
        '홉킨스(지8수2)',
        '엘크룬(화7품3)',
        '메가테라냐(풍9지1)',
        '스피온(풍7지3)',
        '멍클(풍7지3)',
        '스노블(수7화3)',
        '케라스(수6화4)',
        '카무르(화9품1)',
        '정령왕(지?풍?)',
      ],
      aurora: [
        '파사트(화6풍4)',
        '홉킨스(화8품2)',
        '엘크룬(지7수3)',
        '메가테라냐(수9화1)',
        '스피온(수7화3)',
        '멍클(수7화3)',
        '스노블(풍7지3)',
        '케라스(풍6지4)',
        '카무르(지9수1)',
        '정령왕(화?수?)',
      ],
    },
    {
      title: '정령왕 (지셋팅) ⭐ 추천',
      setup: '지 (상대: 오로라)',
      support: '지우대',
      rainbow: '엘크룬, 스노블, 케라스, 카무르',
      boss: '엘크론(부활), 홉킨스(부활)',
      basic: [
        '파사트(지6수4)',
        '홉킨스(지8수2)',
        '엘크룬(화7품3)',
        '메가테라냐(풍9지1)',
        '스피온(풍7지3)',
        '멍클(풍7지3)',
        '스노블(수7화3)',
        '케라스(수6화4)',
        '카무르(화9품1)',
        '정령왕(지?풍?)',
      ],
      aurora: [
        '파사트(화6풍4)',
        '홉킨스(화8풍2)',
        '엘크룬(지7수3)',
        '메가테라냐(수9화1)',
        '스피온(수7화3)',
        '멍클(수7화3)',
        '스노블(풍7지3)',
        '케라스(풍6지4)',
        '카무르(지9수1)',
        '정령왕(화?수?)',
      ],
    },
  ];

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
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-text-primary">라돈타 공략</h1>
          <div className="w-20 h-0.5 bg-accent mx-auto rounded-full"></div>
        </div>

        {/* 기본 수칙 */}
        <div className="bg-bg-secondary rounded-lg p-4 md:p-5 mb-4 border border-border shadow-lg">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-text-primary flex items-center gap-2">
            <span>📌</span> 기본 수칙
          </h2>
          <ul className="space-y-2 text-sm md:text-base">
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
              <span className="text-red-500">상대 펫 속성은 틀릴 가능성이 있음</span>
            </li>
          </ul>
        </div>

        {/* 층별 공략 */}
        <div className="space-y-3 mb-6">
          {floors.map(floor => (
            <div
              key={floor.floor}
              className="bg-bg-secondary rounded-lg p-3 md:p-4 border border-border shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-3 pb-3 border-b border-border">
                <div className="bg-accent text-white font-bold text-lg md:text-xl px-3 md:px-4 py-1.5 md:py-2 rounded-lg shadow-md">
                  {floor.floor}층
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs md:text-sm">
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
                <span className="font-bold text-red-500 text-xs md:text-sm">보스:</span>{' '}
                <span className="text-text-secondary text-xs md:text-sm">{floor.boss}</span>
              </div>

              {floor.note && (
                <div className="mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                  <span className="font-bold text-yellow-600 text-xs md:text-sm">⚠️ 주의:</span>{' '}
                  <span className="text-text-secondary text-xs md:text-sm">{floor.note}</span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-bg-tertiary rounded p-3 border border-border">
                  <h4 className="font-bold text-green-500 mb-2 text-sm md:text-base">기본</h4>
                  <ul className="space-y-1.5">
                    {floor.basic.map((pet, idx) => (
                      <li
                        key={idx}
                        className="text-xs md:text-sm text-text-secondary flex items-center gap-2"
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
                  <h4 className="font-bold text-blue-500 mb-2 text-sm md:text-base">오로라</h4>
                  <ul className="space-y-1.5">
                    {floor.aurora.map((pet, idx) => (
                      <li
                        key={idx}
                        className="text-xs md:text-sm text-text-secondary flex items-center gap-2"
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
        <div className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-3 text-text-primary">
            정령왕 공략
          </h2>
          {spiritKingStrategies.map((strategy, idx) => (
            <div
              key={idx}
              className="bg-bg-secondary rounded-lg p-3 md:p-4 border border-border shadow-lg"
            >
              <div className="flex items-center gap-4 mb-3 pb-3 border-b border-border">
                <h3 className="text-lg md:text-xl font-bold text-text-primary">{strategy.title}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 text-xs md:text-sm">
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
                <span className="font-bold text-red-500 text-xs md:text-sm">보스:</span>{' '}
                <span className="text-text-secondary text-xs md:text-sm">{strategy.boss}</span>
              </div>

              {strategy.note && (
                <div className="mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                  <span className="font-bold text-yellow-600 text-xs md:text-sm">⚠️ 주의:</span>{' '}
                  <span className="text-text-secondary text-xs md:text-sm">{strategy.note}</span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-bg-tertiary rounded p-3 border border-border">
                  <h4 className="font-bold text-green-500 mb-2 text-sm md:text-base">기본</h4>
                  <ul className="space-y-1.5">
                    {strategy.basic.map((pet, idx) => (
                      <li
                        key={idx}
                        className="text-xs md:text-sm text-text-secondary flex items-center gap-2"
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
                  <h4 className="font-bold text-blue-500 mb-2 text-sm md:text-base">오로라</h4>
                  <ul className="space-y-1.5">
                    {strategy.aurora.map((pet, idx) => (
                      <li
                        key={idx}
                        className="text-xs md:text-sm text-text-secondary flex items-center gap-2"
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
      </div>
    </div>
  );
};

export default RadontaPage;
