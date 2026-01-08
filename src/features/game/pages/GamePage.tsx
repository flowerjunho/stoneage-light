import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LadderGame from '../components/LadderGame';
import PigRaceGame from '../components/PigRaceGame';
import MultiplayerPigRace from '../components/MultiplayerPigRace';

type GameType = 'ladder' | 'pigrace' | 'multiplayer' | null;
type MultiplayerMode = 'menu' | 'room' | 'input' | null;

const GamePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedGame, setSelectedGame] = useState<GameType>(null);

  // 쿼리 파라미터에서 초기 상태 설정
  const queryType = searchParams.get('type');
  const queryMode = searchParams.get('mode') as MultiplayerMode;
  const queryCode = searchParams.get('code'); // 방 코드 (6자리)

  // code가 있으면 자동으로 입장 화면으로 이동
  const effectiveMode = queryCode ? 'input' : queryMode;

  // URL 쿼리 파라미터 처리
  useEffect(() => {
    if (queryType === 'multi') {
      setSelectedGame('multiplayer');
    }
  }, [queryType]);

  const games = [
    {
      id: 'ladder' as GameType,
      name: '사다리 게임',
      description: '누가 당첨될까요? 사다리를 타보세요!',
      icon: '🪜',
      color: 'from-red-500 to-orange-500',
    },
    {
      id: 'pigrace' as GameType,
      name: '돼지 달리기',
      description: '귀여운 돼지들의 달리기 경주!',
      icon: '🐷',
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 'multiplayer' as GameType,
      name: '멀티플레이어 돼지 레이스',
      description: '친구들과 함께 실시간 레이스!',
      icon: '🎮',
      color: 'from-purple-500 to-indigo-500',
    },
  ];

  const handleSelectGame = (gameId: GameType) => {
    setSelectedGame(gameId);
    if (gameId === 'multiplayer') {
      setSearchParams({ type: 'multi' });
    }
  };

  const handleBack = () => {
    setSelectedGame(null);
    setSearchParams({});
  };

  const renderGameList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((game) => (
        <button
          key={game.id}
          onClick={() => handleSelectGame(game.id)}
          className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br ${game.color}`}
        >
          <div className="absolute top-0 right-0 text-8xl opacity-20 transform translate-x-4 -translate-y-4">
            {game.icon}
          </div>
          <div className="relative z-10">
            <div className="text-4xl mb-3">{game.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
            <p className="text-white/80 text-sm">{game.description}</p>
          </div>
        </button>
      ))}
    </div>
  );

  const renderSelectedGame = () => {
    switch (selectedGame) {
      case 'ladder':
        return <LadderGame onBack={handleBack} />;
      case 'pigrace':
        return <PigRaceGame onBack={handleBack} />;
      case 'multiplayer':
        return (
          <MultiplayerPigRace
            onBack={handleBack}
            initialMode={effectiveMode}
            initialRoomCode={queryCode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-2 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        {!selectedGame && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-2">
              🎮 미니게임
            </h1>
            <p className="text-text-secondary mt-1">스톤에이지 테마의 미니게임을 즐겨보세요!</p>
          </div>
        )}

        {/* Content */}
        {selectedGame ? (
          renderSelectedGame()
        ) : (
          <div className="bg-bg-secondary rounded-2xl border border-border p-6">
            {renderGameList()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
