import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LadderGame from '../components/LadderGame';
import PigRaceGame from '../components/PigRaceGame';
import MultiplayerPigRace from '../components/MultiplayerPigRace';
import RelayPigRace from '../components/RelayPigRace';
import { getRoomState, type GameRoom } from '../services/gameApi';

type GameType = 'ladder' | 'pigrace' | 'multiplayer' | 'relay' | null;
type MultiplayerMode = 'menu' | 'room' | 'input' | null;

const GamePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedGame, setSelectedGame] = useState<GameType>(null);
  const [isDetectingRoom, setIsDetectingRoom] = useState(false);
  // 릴레이 방 만들기 버튼에서 직접 전달하는 모드 (URL 파라미터보다 우선)
  const [directRelayMode, setDirectRelayMode] = useState<MultiplayerMode>(null);
  // 천호 레이스에서 릴레이 방 입장 시 전달하는 방 정보
  const [relayRoomFromMultiplayer, setRelayRoomFromMultiplayer] = useState<GameRoom | null>(null);
  const [relayPlayerName, setRelayPlayerName] = useState<string | null>(null);

  // 쿼리 파라미터에서 초기 상태 설정
  const queryType = searchParams.get('type');
  const queryMode = searchParams.get('mode') as MultiplayerMode;
  const queryCode = searchParams.get('code'); // 방 코드 (6자리)

  // code가 있으면 자동으로 입장 화면으로 이동
  const effectiveMode = queryCode ? 'input' : queryMode;

  // URL 쿼리 파라미터 처리
  // code가 있으면 서버에서 게임 모드 자동 감지
  useEffect(() => {
    const detectGameMode = async () => {
      // code가 있으면 서버에서 방 정보 조회하여 게임 모드 감지
      if (queryCode) {
        setIsDetectingRoom(true);
        try {
          const response = await getRoomState(queryCode);
          if (response.success && response.data) {
            // 릴레이 방이면 릴레이로, 아니면 천호 레이스로
            if (response.data.gameMode === 'relay') {
              setSelectedGame('relay');
            } else {
              setSelectedGame('multiplayer');
            }
          } else {
            // 방을 찾지 못하면 천호 레이스로 (입장 시 에러 표시됨)
            setSelectedGame('multiplayer');
          }
        } catch {
          setSelectedGame('multiplayer');
        }
        setIsDetectingRoom(false);
        return;
      }

      // type=multi면 천호 레이스 선택
      if (queryType === 'multi') {
        setSelectedGame('multiplayer');
      }
    };

    detectGameMode();
  }, [queryType, queryCode]);

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
      name: '천호 레이스',
      description: '친구들과 함께 실시간 레이스!',
      icon: 'ho', // ho.svg 이미지 사용
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
    setDirectRelayMode(null); // 직접 모드 초기화
    setRelayRoomFromMultiplayer(null); // 릴레이 방 정보 초기화
    setRelayPlayerName(null);
    setSearchParams({});
  };

  const renderGameIcon = (icon: string, size: 'sm' | 'lg') => {
    if (icon === 'ho') {
      const sizeClass = size === 'lg' ? 'w-24 h-24' : 'w-12 h-12';
      return <img src={`${import.meta.env.BASE_URL}ho.svg`} alt="천호" className={sizeClass} />;
    }
    if (icon === 'relay') {
      const sizeClass = size === 'lg' ? 'text-8xl' : 'text-4xl';
      return <span className={sizeClass}>🏃</span>;
    }
    return <span>{icon}</span>;
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
            {renderGameIcon(game.icon, 'lg')}
          </div>
          <div className="relative z-10">
            <div className="text-4xl mb-3">{renderGameIcon(game.icon, 'sm')}</div>
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
            onGoToRelay={() => {
              setDirectRelayMode('room'); // 직접 모드 설정 (URL보다 우선)
              setSelectedGame('relay');
              setSearchParams({ type: 'multi' }); // URL은 천호 레이스 유지
            }}
            onJoinRelayRoom={async (roomCode, playerName) => {
              // 천호 레이스에서 릴레이 방 코드로 입장 시 호출됨
              // 이미 joinRoom이 호출된 상태이므로 방 정보를 가져와서 릴레이로 전환
              const response = await getRoomState(roomCode);
              if (response.success && response.data) {
                setRelayRoomFromMultiplayer(response.data);
                setRelayPlayerName(playerName);
                setSelectedGame('relay');
                setSearchParams({ type: 'multi', code: roomCode }); // URL은 천호 레이스 유지
              }
            }}
          />
        );
      case 'relay':
        return (
          <RelayPigRace
            onBack={() => {
              // 릴레이에서 뒤로가기 시 천호 레이스 메뉴로 돌아감
              setSelectedGame('multiplayer');
              setDirectRelayMode(null);
              setRelayRoomFromMultiplayer(null);
              setRelayPlayerName(null);
              setSearchParams({ type: 'multi' });
            }}
            initialMode={directRelayMode || effectiveMode}
            initialRoomCode={queryCode}
            alreadyJoinedRoom={relayRoomFromMultiplayer}
            alreadyJoinedPlayerName={relayPlayerName}
          />
        );
      default:
        return null;
    }
  };

  // 방 정보 조회 중 로딩 표시
  if (isDetectingRoom) {
    return (
      <div className="min-h-screen pt-2 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🔍</div>
          <p className="text-text-secondary">방 정보 확인 중...</p>
        </div>
      </div>
    );
  }

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
