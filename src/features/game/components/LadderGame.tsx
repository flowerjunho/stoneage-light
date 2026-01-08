import { useState, useEffect, useRef, useCallback } from 'react';

interface LadderGameProps {
  onBack: () => void;
}

type GamePhase = 'setup' | 'playing' | 'result';

interface LadderLine {
  fromCol: number;
  row: number;
}

const LadderGame = ({ onBack }: LadderGameProps) => {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [ladderLines, setLadderLines] = useState<LadderLine[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);
  const [pathHistory, setPathHistory] = useState<{ col: number; row: number }[]>([]);
  const [finalResults, setFinalResults] = useState<Map<number, number>>(new Map());
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<number>>(new Set());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const ROWS = 15;
  const CELL_HEIGHT = 30;
  const CELL_WIDTH = 80;
  const PADDING_TOP = 60;
  const PADDING_BOTTOM = 60;

  // 초기 이름/결과 설정
  useEffect(() => {
    const names = Array.from({ length: playerCount }, (_, i) => `참가자${i + 1}`);
    const defaultResults = Array.from({ length: playerCount }, (_, i) => i === 0 ? '당첨!' : '꽝');
    setPlayerNames(names);
    setResults(defaultResults);
  }, [playerCount]);

  // 사다리 생성
  const generateLadder = useCallback(() => {
    const lines: LadderLine[] = [];
    const lineCount = Math.floor(ROWS * playerCount * 0.4);

    for (let i = 0; i < lineCount; i++) {
      const fromCol = Math.floor(Math.random() * (playerCount - 1));
      const row = Math.floor(Math.random() * (ROWS - 2)) + 1;

      // 같은 행에 연속된 가로선이 없도록 체크
      const hasConflict = lines.some(
        (line) => line.row === row && Math.abs(line.fromCol - fromCol) <= 1
      );

      if (!hasConflict) {
        lines.push({ fromCol, row });
      }
    }

    return lines;
  }, [playerCount]);

  // 경로 계산
  const calculatePath = useCallback((startCol: number): { path: { col: number; row: number }[]; endCol: number } => {
    const path: { col: number; row: number }[] = [];
    let currentCol = startCol;

    path.push({ col: currentCol, row: 0 });

    for (let row = 0; row < ROWS; row++) {
      // 현재 위치에서 오른쪽으로 가는 가로선 확인
      const rightLine = ladderLines.find(l => l.row === row && l.fromCol === currentCol);
      // 현재 위치에서 왼쪽으로 가는 가로선 확인
      const leftLine = ladderLines.find(l => l.row === row && l.fromCol === currentCol - 1);

      if (rightLine) {
        currentCol += 1;
        path.push({ col: currentCol, row });
      } else if (leftLine) {
        currentCol -= 1;
        path.push({ col: currentCol, row });
      }

      path.push({ col: currentCol, row: row + 1 });
    }

    return { path, endCol: currentCol };
  }, [ladderLines]);

  // 캔버스 그리기
  const drawLadder = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = CELL_WIDTH * playerCount;
    const height = PADDING_TOP + CELL_HEIGHT * ROWS + PADDING_BOTTOM;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // 세로선 그리기
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;

    for (let i = 0; i < playerCount; i++) {
      const x = CELL_WIDTH / 2 + i * CELL_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, PADDING_TOP);
      ctx.lineTo(x, PADDING_TOP + CELL_HEIGHT * ROWS);
      ctx.stroke();
    }

    // 가로선 그리기
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;

    ladderLines.forEach((line) => {
      const x1 = CELL_WIDTH / 2 + line.fromCol * CELL_WIDTH;
      const x2 = CELL_WIDTH / 2 + (line.fromCol + 1) * CELL_WIDTH;
      const y = PADDING_TOP + line.row * CELL_HEIGHT;

      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    });

    // 경로 애니메이션
    if (pathHistory.length > 1) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const startX = CELL_WIDTH / 2 + pathHistory[0].col * CELL_WIDTH;
      const startY = PADDING_TOP + pathHistory[0].row * CELL_HEIGHT;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < pathHistory.length; i++) {
        const x = CELL_WIDTH / 2 + pathHistory[i].col * CELL_WIDTH;
        const y = PADDING_TOP + pathHistory[i].row * CELL_HEIGHT;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 현재 위치 마커
      const lastPoint = pathHistory[pathHistory.length - 1];
      const markerX = CELL_WIDTH / 2 + lastPoint.col * CELL_WIDTH;
      const markerY = PADDING_TOP + lastPoint.row * CELL_HEIGHT;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(markerX, markerY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 이미 공개된 경로들 그리기
    revealedPlayers.forEach((playerIdx) => {
      const result = finalResults.get(playerIdx);
      if (result === undefined || playerIdx === currentPlayer) return;

      const { path } = calculatePath(playerIdx);

      ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      const startX = CELL_WIDTH / 2 + path[0].col * CELL_WIDTH;
      const startY = PADDING_TOP + path[0].row * CELL_HEIGHT;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < path.length; i++) {
        const x = CELL_WIDTH / 2 + path[i].col * CELL_WIDTH;
        const y = PADDING_TOP + path[i].row * CELL_HEIGHT;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }, [playerCount, ladderLines, pathHistory, revealedPlayers, finalResults, currentPlayer, calculatePath]);

  useEffect(() => {
    if (phase === 'playing' || phase === 'result') {
      drawLadder();
    }
  }, [phase, drawLadder]);

  // 게임 시작
  const startGame = () => {
    const lines = generateLadder();
    setLadderLines(lines);
    setPhase('playing');
    setCurrentPlayer(null);
    setPathHistory([]);
    setFinalResults(new Map());
    setRevealedPlayers(new Set());
  };

  // 플레이어 클릭 시 사다리 타기
  const handlePlayerClick = (playerIdx: number) => {
    if (isAnimating || revealedPlayers.has(playerIdx)) return;

    setIsAnimating(true);
    setCurrentPlayer(playerIdx);

    const { path, endCol } = calculatePath(playerIdx);

    // 애니메이션 (더 느리게: 150ms 간격)
    let step = 0;
    const animate = () => {
      if (step < path.length) {
        setPathHistory(path.slice(0, step + 1));
        step++;
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(animate, 150); // 50ms -> 150ms로 3배 느리게
        });
      } else {
        // 애니메이션 완료
        setFinalResults((prev) => new Map(prev).set(playerIdx, endCol));
        setRevealedPlayers((prev) => new Set(prev).add(playerIdx));
        setIsAnimating(false);

        // 모든 플레이어가 공개되면 결과 화면으로
        if (revealedPlayers.size + 1 === playerCount) {
          setTimeout(() => setPhase('result'), 1000);
        }
      }
    };

    animate();
  };

  // 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 설정 화면
  const renderSetup = () => (
    <div className="space-y-6">
      {/* 인원 수 설정 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          참가 인원 (2~10명)
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

      {/* 참가자 이름 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          참가자 이름
        </label>
        <div className="grid grid-cols-2 gap-2">
          {playerNames.map((name, idx) => (
            <input
              key={idx}
              type="text"
              value={name}
              onChange={(e) => {
                const newNames = [...playerNames];
                newNames[idx] = e.target.value;
                setPlayerNames(newNames);
              }}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm"
              placeholder={`참가자 ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 결과 설정 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          결과 설정 (사다리 아래)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {results.map((result, idx) => (
            <input
              key={idx}
              type="text"
              value={result}
              onChange={(e) => {
                const newResults = [...results];
                newResults[idx] = e.target.value;
                setResults(newResults);
              }}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm"
              placeholder={`결과 ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={startGame}
        className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all text-lg"
      >
        🎲 게임 시작!
      </button>
    </div>
  );

  // 게임 플레이 화면
  const renderPlaying = () => (
    <div className="space-y-4">
      <p className="text-center text-text-secondary text-sm">
        참가자를 클릭하여 사다리를 타세요!
      </p>

      {/* 참가자 버튼 */}
      <div
        className="flex justify-center gap-0"
        style={{ width: CELL_WIDTH * playerCount, margin: '0 auto' }}
      >
        {playerNames.map((name, idx) => (
          <button
            key={idx}
            onClick={() => handlePlayerClick(idx)}
            disabled={isAnimating || revealedPlayers.has(idx)}
            className={`
              flex-shrink-0 px-2 py-2 rounded-lg text-xs font-medium transition-all truncate
              ${revealedPlayers.has(idx)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : currentPlayer === idx
                  ? 'bg-red-500 text-white'
                  : 'bg-bg-tertiary hover:bg-accent text-text-primary hover:text-white'
              }
            `}
            style={{ width: CELL_WIDTH }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* 사다리 캔버스 */}
      <div className="overflow-x-auto">
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>
      </div>

      {/* 결과 표시 */}
      <div
        className="flex justify-center gap-0"
        style={{ width: CELL_WIDTH * playerCount, margin: '0 auto' }}
      >
        {results.map((result, idx) => {
          const winner = Array.from(finalResults.entries()).find(([, endCol]) => endCol === idx);
          const isRevealed = winner !== undefined;
          const isWinning = result.includes('당첨');

          return (
            <div
              key={idx}
              className={`
                flex-shrink-0 px-2 py-2 rounded-lg text-xs font-medium text-center truncate
                ${isRevealed
                  ? isWinning
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-600 text-gray-300'
                  : 'bg-bg-tertiary text-text-secondary'
                }
              `}
              style={{ width: CELL_WIDTH }}
            >
              {isRevealed ? `${playerNames[winner[0]]}: ${result}` : '???'}
            </div>
          );
        })}
      </div>

      {/* 전체 공개 버튼 */}
      {revealedPlayers.size < playerCount && (
        <button
          onClick={() => {
            // 모든 플레이어 결과 계산
            const allResults = new Map<number, number>();
            for (let i = 0; i < playerCount; i++) {
              const { endCol } = calculatePath(i);
              allResults.set(i, endCol);
            }
            setFinalResults(allResults);
            setRevealedPlayers(new Set(Array.from({ length: playerCount }, (_, i) => i)));
            setTimeout(() => setPhase('result'), 500);
          }}
          className="w-full py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg transition-colors"
        >
          전체 결과 공개
        </button>
      )}
    </div>
  );

  // 결과 화면
  const renderResult = () => {
    const sortedResults = Array.from(finalResults.entries())
      .map(([playerIdx, resultIdx]) => ({
        player: playerNames[playerIdx],
        result: results[resultIdx],
        isWinner: results[resultIdx].includes('당첨'),
      }))
      .sort((a, b) => (b.isWinner ? 1 : 0) - (a.isWinner ? 1 : 0));

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-text-primary text-center">🎉 결과 발표!</h3>

        <div className="space-y-2">
          {sortedResults.map((item, idx) => (
            <div
              key={idx}
              className={`
                flex justify-between items-center p-4 rounded-xl
                ${item.isWinner
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500'
                  : 'bg-bg-tertiary'
                }
              `}
            >
              <span className={`font-medium ${item.isWinner ? 'text-yellow-400' : 'text-text-primary'}`}>
                {item.isWinner && '🏆 '}{item.player}
              </span>
              <span className={`font-bold ${item.isWinner ? 'text-yellow-400' : 'text-text-secondary'}`}>
                {item.result}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setPhase('setup');
              setPathHistory([]);
              setCurrentPlayer(null);
            }}
            className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg transition-colors"
          >
            다시 설정
          </button>
          <button
            onClick={startGame}
            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all"
          >
            다시 하기
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
          <h2 className="text-xl font-bold text-text-primary">🪜 사다리 게임</h2>
          <p className="text-sm text-text-secondary">
            {phase === 'setup' && '참가자와 결과를 설정하세요'}
            {phase === 'playing' && '사다리를 타세요!'}
            {phase === 'result' && '게임 종료!'}
          </p>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6">
        {phase === 'setup' && renderSetup()}
        {phase === 'playing' && renderPlaying()}
        {phase === 'result' && renderResult()}
      </div>
    </div>
  );
};

export default LadderGame;
