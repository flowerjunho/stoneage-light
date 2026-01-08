import { useState, useEffect, useRef } from 'react';

interface PigRaceGameProps {
  onBack: () => void;
}

type GamePhase = 'setup' | 'countdown' | 'racing' | 'result';

interface Pig {
  id: number;
  name: string;
  color: string;
  position: number;
  lane: number;
  finishTime: number | null;
  rank: number | null;
  // 상태 효과
  statusEffect: 'normal' | 'boost' | 'superBoost' | 'slip' | 'tired' | 'turbo';
  statusDuration: number; // 남은 프레임 수
  baseSpeedModifier: number; // 개별 돼지의 기본 속도 변동
}

const PIG_COLORS = [
  '#FF6B6B', // 빨강
  '#4ECDC4', // 청록
  '#FFE66D', // 노랑
  '#95E1D3', // 민트
  '#F38181', // 코랄
  '#AA96DA', // 보라
  '#FCBAD3', // 핑크
  '#A8D8EA', // 하늘
  '#FF9F43', // 주황
  '#6BCB77', // 초록
];

const PigRaceGame = ({ onBack }: PigRaceGameProps) => {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [pigs, setPigs] = useState<Pig[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [finishedCount, setFinishedCount] = useState(0);
  const [raceTime, setRaceTime] = useState(0);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const rankCounterRef = useRef<number>(0);

  // 초기 이름 설정
  useEffect(() => {
    const names = Array.from({ length: playerCount }, (_, i) => `돼지${i + 1}`);
    setPlayerNames(names);
  }, [playerCount]);

  // 돼지 초기화
  const initializePigs = () => {
    const newPigs: Pig[] = playerNames.map((name, idx) => ({
      id: idx,
      name,
      color: PIG_COLORS[idx % PIG_COLORS.length],
      position: 0,
      lane: idx,
      finishTime: null,
      rank: null,
      statusEffect: 'normal',
      statusDuration: 0,
      baseSpeedModifier: 0.8 + Math.random() * 0.4, // 0.8 ~ 1.2 개별 속도 특성
    }));
    setPigs(newPigs);
    setFinishedCount(0);
    rankCounterRef.current = 0;
  };

  // 게임 시작
  const startGame = () => {
    initializePigs();
    setCountdown(3);
    setPhase('countdown');
  };

  // 카운트다운
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // 카운트다운 끝 - 레이스 시작
      startTimeRef.current = performance.now();
      rankCounterRef.current = 0; // 등수 카운터 리셋
      setPhase('racing');
    }
  }, [phase, countdown]);

  // 레이스 애니메이션
  useEffect(() => {
    if (phase !== 'racing') return;

    const RACE_DURATION = 20000; // 1등이 약 20초에 골인
    const FPS = 60;
    const FRAME_TIME = 1000 / FPS;
    let lastFrameTime = 0;

    // 상태 효과별 속도 배율
    const getStatusSpeedMultiplier = (status: Pig['statusEffect']) => {
      switch (status) {
        case 'turbo': return 4.0;      // 터보! 엄청 빠름
        case 'superBoost': return 2.5; // 슈퍼 부스트
        case 'boost': return 1.8;      // 부스트
        case 'slip': return 0.05;      // 미끄러짐 (거의 멈춤)
        case 'tired': return 0.2;      // 지침
        default: return 1.0;
      }
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;

      // FPS 제한
      if (currentTime - lastFrameTime < FRAME_TIME) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;

      setRaceTime(elapsed);

      setPigs((prevPigs) => {
        let currentFinished = 0;

        // 현재 순위 계산 (역전 감지용)
        const sortedByPosition = [...prevPigs]
          .filter(p => p.finishTime === null)
          .sort((a, b) => b.position - a.position);

        const positionRanks = new Map<number, number>();
        sortedByPosition.forEach((pig, idx) => {
          positionRanks.set(pig.id, idx + 1);
        });

        const updatedPigs = prevPigs.map((pig) => {
          // 이미 골인한 돼지
          if (pig.finishTime !== null) {
            currentFinished++;
            return pig;
          }

          // 20초 동안 100%를 가야 하므로 기본 속도 계산
          const baseSpeed = 100 / (RACE_DURATION / FRAME_TIME);

          // 상태 효과 지속시간 감소
          let newStatusEffect = pig.statusEffect;
          let newStatusDuration = Math.max(0, pig.statusDuration - 1);

          // 상태 효과 종료
          if (newStatusDuration === 0 && pig.statusEffect !== 'normal') {
            newStatusEffect = 'normal';
          }

          // 새로운 상태 효과 발생 (상태가 normal일 때만)
          if (newStatusEffect === 'normal') {
            const rand = Math.random();
            const currentRank = positionRanks.get(pig.id) || 1;
            const totalPigs = sortedByPosition.length;
            const isLeading = currentRank <= Math.max(1, Math.floor(totalPigs * 0.3));
            const isLagging = currentRank >= Math.ceil(totalPigs * 0.7);

            // 선두 그룹은 불이익, 후미 그룹은 이점 (역전 유도)
            if (isLeading) {
              // 선두 돼지는 힘들어질 확률 높음
              if (rand < 0.08) {
                newStatusEffect = 'slip';
                newStatusDuration = 30 + Math.floor(Math.random() * 40); // 0.5~1.2초 미끄러짐
              } else if (rand < 0.20) {
                newStatusEffect = 'tired';
                newStatusDuration = 40 + Math.floor(Math.random() * 50); // 0.7~1.5초 지침
              } else if (rand < 0.25) {
                newStatusEffect = 'boost';
                newStatusDuration = 15 + Math.floor(Math.random() * 20);
              }
            } else if (isLagging) {
              // 후미 돼지는 부스트 확률 높음
              if (rand < 0.06) {
                newStatusEffect = 'turbo';
                newStatusDuration = 25 + Math.floor(Math.random() * 35); // 0.4~1초 터보
              } else if (rand < 0.18) {
                newStatusEffect = 'superBoost';
                newStatusDuration = 35 + Math.floor(Math.random() * 45); // 0.6~1.3초 슈퍼부스트
              } else if (rand < 0.30) {
                newStatusEffect = 'boost';
                newStatusDuration = 30 + Math.floor(Math.random() * 40);
              } else if (rand < 0.35) {
                newStatusEffect = 'slip';
                newStatusDuration = 20 + Math.floor(Math.random() * 20);
              }
            } else {
              // 중간 그룹
              if (rand < 0.03) {
                newStatusEffect = 'turbo';
                newStatusDuration = 20 + Math.floor(Math.random() * 30);
              } else if (rand < 0.08) {
                newStatusEffect = 'superBoost';
                newStatusDuration = 25 + Math.floor(Math.random() * 35);
              } else if (rand < 0.15) {
                newStatusEffect = 'boost';
                newStatusDuration = 25 + Math.floor(Math.random() * 35);
              } else if (rand < 0.22) {
                newStatusEffect = 'tired';
                newStatusDuration = 30 + Math.floor(Math.random() * 40);
              } else if (rand < 0.27) {
                newStatusEffect = 'slip';
                newStatusDuration = 25 + Math.floor(Math.random() * 30);
              }
            }
          }

          // 속도 계산
          const statusMultiplier = getStatusSpeedMultiplier(newStatusEffect);
          const randomVariation = 0.85 + Math.random() * 0.3; // 0.85 ~ 1.15
          const speed = baseSpeed * pig.baseSpeedModifier * statusMultiplier * randomVariation;

          const newPosition = Math.min(100, pig.position + speed);

          // 골인 체크
          if (newPosition >= 100) {
            rankCounterRef.current += 1;
            currentFinished++;
            return {
              ...pig,
              position: 100,
              finishTime: elapsed,
              rank: rankCounterRef.current,
              statusEffect: 'normal' as const,
              statusDuration: 0,
            };
          }

          return {
            ...pig,
            position: newPosition,
            statusEffect: newStatusEffect,
            statusDuration: newStatusDuration,
          };
        });

        setFinishedCount(currentFinished);

        // 모든 돼지 골인 체크
        if (currentFinished >= playerCount) {
          setTimeout(() => setPhase('result'), 500);
        }

        return updatedPigs;
      });

      // 계속 애니메이션
      if (phase === 'racing') {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, playerCount]);

  // 색상 유틸리티
  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
    const B = Math.max((num & 0x0000ff) - amt, 0);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  const lightenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min((num >> 16) + amt, 255);
    const G = Math.min(((num >> 8) & 0x00ff) + amt, 255);
    const B = Math.min((num & 0x0000ff) + amt, 255);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  // 상태 효과 이모지
  const getStatusEmoji = (status: Pig['statusEffect']) => {
    switch (status) {
      case 'turbo': return '🔥';
      case 'superBoost': return '⚡';
      case 'boost': return '💨';
      case 'slip': return '💫';
      case 'tired': return '😴';
      default: return '';
    }
  };

  // 돼지 렌더링
  const renderPig = (pig: Pig) => {
    const isFinished = pig.finishTime !== null;
    const isRunning = phase === 'racing' && !isFinished;
    const statusEmoji = getStatusEmoji(pig.statusEffect);

    return (
      <div
        key={pig.id}
        className="absolute flex items-center"
        style={{
          left: `calc(5% + ${pig.position * 0.9}%)`,
          top: `${pig.lane * (100 / playerCount) + (50 / playerCount)}%`,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.05s linear',
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* 상태 효과 이모지 */}
          {statusEmoji && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg animate-bounce">
              {statusEmoji}
            </div>
          )}
          {/* 이름 태그 */}
          <div
            className="text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-full mb-0.5"
            style={{
              backgroundColor: pig.color,
              color: '#000',
            }}
          >
            {pig.name}
            {pig.rank && <span className="ml-1">#{pig.rank}</span>}
          </div>

          {/* 돼지 SVG */}
          <svg
            width="45"
            height="35"
            viewBox="0 0 50 40"
            className={`drop-shadow-md ${isFinished ? 'scale-110' : ''}`}
            style={{
              animation: isRunning ? 'pigRun 0.2s infinite' : 'none',
            }}
          >
            {/* 몸통 */}
            <ellipse cx="25" cy="22" rx="16" ry="12" fill={pig.color} />

            {/* 귀 */}
            <ellipse cx="13" cy="12" rx="4" ry="5" fill={pig.color} />
            <ellipse cx="37" cy="12" rx="4" ry="5" fill={pig.color} />
            <ellipse cx="13" cy="12" rx="2.5" ry="3" fill={darkenColor(pig.color, 20)} />
            <ellipse cx="37" cy="12" rx="2.5" ry="3" fill={darkenColor(pig.color, 20)} />

            {/* 얼굴 */}
            <ellipse cx="25" cy="18" rx="9" ry="7" fill={lightenColor(pig.color, 10)} />

            {/* 코 */}
            <ellipse cx="25" cy="20" rx="5" ry="3.5" fill={darkenColor(pig.color, 30)} />
            <circle cx="22.5" cy="20" r="1.2" fill="#333" />
            <circle cx="27.5" cy="20" r="1.2" fill="#333" />

            {/* 눈 */}
            <circle cx="20" cy="15" r="2.5" fill="white" />
            <circle cx="30" cy="15" r="2.5" fill="white" />
            <circle cx="20.5" cy="15" r="1.2" fill="#333" />
            <circle cx="30.5" cy="15" r="1.2" fill="#333" />

            {/* 볼 */}
            <circle cx="15" cy="18" r="1.5" fill={darkenColor(pig.color, 10)} opacity="0.5" />
            <circle cx="35" cy="18" r="1.5" fill={darkenColor(pig.color, 10)} opacity="0.5" />

            {/* 다리 */}
            <rect x="14" y="31" width="4" height="5" rx="2" fill={darkenColor(pig.color, 20)} />
            <rect x="21" y="31" width="4" height="5" rx="2" fill={darkenColor(pig.color, 20)} />
            <rect x="28" y="31" width="4" height="5" rx="2" fill={darkenColor(pig.color, 20)} />
            <rect x="35" y="31" width="4" height="5" rx="2" fill={darkenColor(pig.color, 20)} />

            {/* 꼬리 */}
            <path
              d="M 41 22 Q 46 18, 44 24 Q 48 20, 46 26"
              stroke={darkenColor(pig.color, 20)}
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      </div>
    );
  };

  // 설정 화면
  const renderSetup = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          참가 돼지 수 (2~10마리)
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPlayerCount(Math.max(2, playerCount - 1))}
            className="w-10 h-10 rounded-lg bg-bg-tertiary hover:bg-bg-primary text-text-primary font-bold transition-colors"
          >
            -
          </button>
          <span className="text-2xl font-bold text-text-primary w-12 text-center">
            {playerCount}
          </span>
          <button
            onClick={() => setPlayerCount(Math.min(10, playerCount + 1))}
            className="w-10 h-10 rounded-lg bg-bg-tertiary hover:bg-bg-primary text-text-primary font-bold transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          돼지 이름
        </label>
        <div className="grid grid-cols-2 gap-2">
          {playerNames.map((name, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: PIG_COLORS[idx % PIG_COLORS.length] }}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const newNames = [...playerNames];
                  newNames[idx] = e.target.value;
                  setPlayerNames(newNames);
                }}
                className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm"
                placeholder={`돼지 ${idx + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={startGame}
        className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl transition-all text-lg"
      >
        🐷 레이스 시작!
      </button>
    </div>
  );

  // 레이싱 화면
  const renderRacing = () => (
    <div className="space-y-4">
      {/* 카운트다운 오버레이 */}
      {phase === 'countdown' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="text-9xl font-bold text-white animate-ping">
            {countdown === 0 ? '🏁 GO!' : countdown}
          </div>
        </div>
      )}

      {/* 상태 바 */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-text-secondary">
          {phase === 'countdown' ? '준비...' : `🏃 레이스 중! (${(raceTime / 1000).toFixed(1)}초)`}
        </span>
        <span className="text-text-secondary">
          🏁 {finishedCount}/{playerCount} 골인
        </span>
      </div>

      {/* 레이스 트랙 */}
      <div
        className="relative bg-gradient-to-b from-green-700 to-green-600 rounded-2xl overflow-hidden border-4 border-green-800"
        style={{ height: `${Math.max(280, playerCount * 60)}px` }}
      >
        {/* 레인 구분선 */}
        {Array.from({ length: playerCount - 1 }).map((_, idx) => (
          <div
            key={idx}
            className="absolute w-full border-t-2 border-dashed border-white/20"
            style={{ top: `${((idx + 1) * 100) / playerCount}%` }}
          />
        ))}

        {/* 출발선 */}
        <div className="absolute left-[5%] top-0 bottom-0 w-1 bg-white" />

        {/* 결승선 체커보드 */}
        <div className="absolute right-[3%] top-0 bottom-0 w-3 bg-checkered" />

        {/* 거리 마커 */}
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            className="absolute top-0 bottom-0 border-l border-dashed border-white/15"
            style={{ left: `${5 + p * 0.9}%` }}
          >
            <span className="absolute top-1 left-1 text-[10px] text-white/40">{p}%</span>
          </div>
        ))}

        {/* 돼지들 */}
        {pigs.map(renderPig)}
      </div>

      {/* 실시간 순위 */}
      <div className="bg-bg-tertiary rounded-xl p-3">
        <h4 className="text-xs font-medium text-text-secondary mb-2">실시간 순위</h4>
        <div className="flex flex-wrap gap-1.5">
          {[...pigs]
            .sort((a, b) => b.position - a.position)
            .map((pig, idx) => (
              <div
                key={pig.id}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                style={{ backgroundColor: pig.color + '30', color: pig.color }}
              >
                <span className="font-bold">{idx + 1}.</span>
                <span className="font-medium">{pig.name}</span>
                {pig.rank && <span>🏁</span>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  // 결과 화면
  const renderResult = () => {
    const sortedPigs = [...pigs].sort((a, b) => (a.rank || 999) - (b.rank || 999));

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-text-primary text-center">🏆 레이스 결과!</h3>

        {/* 시상대 */}
        <div className="flex justify-center items-end gap-2 h-40">
          {sortedPigs[1] && (
            <div className="flex flex-col items-center">
              <div className="text-2xl mb-1">🥈</div>
              <div
                className="w-16 rounded-t-lg flex items-center justify-center pb-2"
                style={{ backgroundColor: sortedPigs[1].color, height: '70px' }}
              >
                <span className="text-xs font-bold text-black text-center px-1">{sortedPigs[1].name}</span>
              </div>
            </div>
          )}
          {sortedPigs[0] && (
            <div className="flex flex-col items-center">
              <div className="text-3xl mb-1 animate-bounce">🥇</div>
              <div
                className="w-20 rounded-t-lg flex items-center justify-center pb-2"
                style={{ backgroundColor: sortedPigs[0].color, height: '100px' }}
              >
                <span className="text-sm font-bold text-black text-center px-1">{sortedPigs[0].name}</span>
              </div>
            </div>
          )}
          {sortedPigs[2] && (
            <div className="flex flex-col items-center">
              <div className="text-xl mb-1">🥉</div>
              <div
                className="w-14 rounded-t-lg flex items-center justify-center pb-2"
                style={{ backgroundColor: sortedPigs[2].color, height: '50px' }}
              >
                <span className="text-xs font-bold text-black text-center px-1">{sortedPigs[2].name}</span>
              </div>
            </div>
          )}
        </div>

        {/* 전체 순위 */}
        <div className="space-y-2">
          {sortedPigs.map((pig) => (
            <div
              key={pig.id}
              className={`flex justify-between items-center p-3 rounded-xl ${
                pig.rank === 1
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500'
                  : 'bg-bg-tertiary'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-bold w-8">
                  {pig.rank === 1 && '🥇'}
                  {pig.rank === 2 && '🥈'}
                  {pig.rank === 3 && '🥉'}
                  {pig.rank && pig.rank > 3 && `${pig.rank}등`}
                </span>
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: pig.color }} />
                <span className={pig.rank === 1 ? 'text-yellow-400 font-bold' : 'text-text-primary'}>
                  {pig.name}
                </span>
              </div>
              <span className="text-sm text-text-secondary">
                {pig.finishTime ? `${(pig.finishTime / 1000).toFixed(2)}초` : '-'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setPhase('setup');
              setPigs([]);
            }}
            className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg transition-colors"
          >
            다시 설정
          </button>
          <button
            onClick={startGame}
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-lg transition-all"
          >
            다시 달리기!
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-text-primary">🐷 돼지 달리기</h2>
          <p className="text-sm text-text-secondary">
            {phase === 'setup' && '참가 돼지를 설정하세요'}
            {phase === 'countdown' && '곧 시작합니다!'}
            {phase === 'racing' && '달려라 돼지들!'}
            {phase === 'result' && '레이스 종료!'}
          </p>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6">
        {phase === 'setup' && renderSetup()}
        {(phase === 'countdown' || phase === 'racing') && renderRacing()}
        {phase === 'result' && renderResult()}
      </div>

      {/* 스타일 */}
      <style>{`
        .bg-checkered {
          background-image:
            linear-gradient(45deg, #000 25%, transparent 25%),
            linear-gradient(-45deg, #000 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #000 75%),
            linear-gradient(-45deg, transparent 75%, #000 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
          background-color: white;
        }
        @keyframes pigRun {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default PigRaceGame;
