import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameRoom, Player, PigState, RelayState, HostChangedData, KickedData } from '../services/gameApi';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  selectPig,
  selectTeam,
  toggleReady,
  startGame,
  updateGameState,
  assignRunnerOrders,
  kickPlayer,
  getCurrentPlayerId,
  isCurrentPlayerHost,
  getCurrentPlayer,
  subscribeToRoom,
  getRoomState,
  sendHeartbeat,
  type SSEConnection,
} from '../services/gameApi';

// 돼지 색상 정의 (기존 멀티플레이어와 동일)
const PIG_COLORS = [
  'original',
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8D8EA', '#F9ED69', '#B8E994',
  '#FF9F43', '#6C5CE7', '#74B9FF', '#FD79A8', '#00B894',
  '#E17055', '#81ECEC', '#FFEAA7', '#DFE6E9', '#A29BFE',
  '#55EFC4', '#FAB1A0', '#74B9FF', '#FF7675', '#FDCB6E',
  '#E84393', '#00CEC9', '#636E72', '#D63031',
];

const getPigColor = (pigId: number): string => PIG_COLORS[pigId % PIG_COLORS.length];
const getPigBgColor = (pigId: number): string => {
  const color = PIG_COLORS[pigId % PIG_COLORS.length];
  return color === 'original' ? '#9CA3AF' : color;
};

// HEX to HSL 변환
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 100, l: 50 };
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const getColorFilter = (color: string): string => {
  if (color === 'original') return 'none';
  const { h, s, l } = hexToHsl(color);
  if (l > 90 && s < 10) return 'brightness(2) contrast(0.8)';
  if (s < 10) return `brightness(${0.5 + (l / 100)}) contrast(1.1)`;
  const brightness = l > 50 ? 1 + (l - 50) / 100 : 0.8 + (l / 250);
  return `sepia(1) hue-rotate(${h - 50}deg) saturate(${s / 50}) brightness(${brightness})`;
};

// 상태 이모지
const getStatusEmoji = (status: PigState['status']) => {
  switch (status) {
    case 'turbo': return '🔥';
    case 'superBoost': return '⚡';
    case 'boost': return '💨';
    case 'slip': return '🍌';
    case 'tired': return '😴';
    default: return '';
  }
};

// 팀 색상
const TEAM_COLORS = {
  A: { primary: '#EF4444', bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' },
  B: { primary: '#3B82F6', bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
};

interface RelayPigRaceProps {
  onBack: () => void;
  initialMode?: 'menu' | 'room' | 'input' | null;
  initialRoomCode?: string | null;
  // 다른 게임에서 입장 후 전환된 경우 (이미 joinRoom 호출됨)
  alreadyJoinedRoom?: GameRoom | null;
  alreadyJoinedPlayerName?: string | null;
}

type ViewPhase = 'menu' | 'create' | 'join' | 'lobby' | 'game';

// 릴레이 주자 정보 (프론트엔드 전용)
interface RelayRunner {
  playerId: string;
  playerName: string;
  pigId: number;
  team: 'A' | 'B';
  order: number; // 1부터 시작
  position: number; // 현재 위치 (0-100)
  direction: 'forward' | 'backward' | 'waiting' | 'finished';
  finishTime: number | null;
  status: PigState['status']; // 현재 상태 (turbo, boost, slip 등)
}

const RelayPigRace = ({ onBack, initialMode, initialRoomCode, alreadyJoinedRoom, alreadyJoinedPlayerName }: RelayPigRaceProps) => {
  const getInitialViewPhase = (): ViewPhase => {
    // 이미 입장한 방이 있으면 바로 로비로
    if (alreadyJoinedRoom) return 'lobby';
    if (initialMode === 'room') return 'create';
    if (initialMode === 'input') return 'join';
    return 'menu';
  };

  const [viewPhase, setViewPhase] = useState<ViewPhase>(getInitialViewPhase());
  const [playerName, setPlayerName] = useState(alreadyJoinedPlayerName || '');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [maxPlayers, setMaxPlayers] = useState(30);

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 릴레이 주자 정보 (게임 시작 시 생성)
  const [relayRunners, setRelayRunners] = useState<RelayRunner[]>([]);
  const relayRunnersRef = useRef<RelayRunner[]>([]);
  const statusDurationRef = useRef<Map<string, number>>(new Map()); // 상태 지속시간 (playerId -> duration)

  const sseConnectionRef = useRef<SSEConnection | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [raceTime, setRaceTime] = useState(0);
  const isHostRacingRef = useRef(false);
  const [hostTakeoverTrigger, setHostTakeoverTrigger] = useState(0);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopConnection = useCallback(() => {
    if (sseConnectionRef.current) {
      sseConnectionRef.current.close();
      sseConnectionRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startSSE = useCallback((roomCode: string) => {
    if (sseConnectionRef.current) sseConnectionRef.current.close();

    const connection = subscribeToRoom(
      roomCode,
      (updatedRoom) => {
        setRoom(prevRoom => {
          if (prevRoom && prevRoom.hostId !== updatedRoom.hostId) {
            const myPlayerId = getCurrentPlayerId();
            if (updatedRoom.hostId === myPlayerId) {
              if (updatedRoom.status === 'countdown' || updatedRoom.status === 'racing') {
                setTimeout(() => setHostTakeoverTrigger(prev => prev + 1), 0);
              }
            }
          }
          return updatedRoom;
        });
        if (isHostRacingRef.current && updatedRoom.status === 'racing') return;
      },
      () => { /* SSE 에러 무시 */ },
      (hostChangedData: HostChangedData) => {
        const myPlayerId = getCurrentPlayerId();
        setRoom(hostChangedData.room);
        if (hostChangedData.newHostId === myPlayerId) {
          if (hostChangedData.room.status === 'countdown' || hostChangedData.room.status === 'racing') {
            setHostTakeoverTrigger(prev => prev + 1);
          }
        }
      },
      (kickedData: KickedData) => {
        alert(kickedData.message || '방장에 의해 강퇴되었습니다.');
        stopConnection();
        stopPolling();
        stopHeartbeat();
        setRoom(null);
        onBack(); // 천호 레이스 메뉴로 돌아가기
      }
    );
    sseConnectionRef.current = connection;
  }, [stopConnection, stopPolling, stopHeartbeat, onBack]);

  const startPolling = useCallback((roomCode: string, interval: number = 5000) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      if (isHostRacingRef.current) return;
      const response = await getRoomState(roomCode);
      if (response.success && response.data) {
        const myPlayerId = getCurrentPlayerId();
        const meInRoom = response.data.players.find(p => p.id === myPlayerId);
        if (!meInRoom) {
          alert('방장에 의해 강퇴되었습니다.');
          stopConnection();
          stopPolling();
          stopHeartbeat();
          setRoom(null);
          onBack(); // 천호 레이스 메뉴로 돌아가기
          return;
        }
        setRoom(prev => {
          if (isHostRacingRef.current && response.data!.status === 'racing') return prev;
          // finished 상태면 로컬 relay 상태 유지 (서버에서 finishTime이 누락될 수 있음)
          // 호스트와 게스트 모두 적용
          if (prev && prev.status === 'finished' && response.data!.status === 'finished') {
            // 로컬에 finishTime이 있고 서버에 없으면 로컬 유지
            if (prev.relay?.teamA.finishTime || prev.relay?.teamB.finishTime) {
              const serverRelay = response.data!.relay;
              // 서버에 더 완전한 데이터가 있으면 서버 데이터 사용
              if (serverRelay?.teamA.finishTime && serverRelay?.teamB.finishTime) {
                return response.data!;
              }
              return { ...response.data!, relay: prev.relay };
            }
          }
          return response.data!;
        });
      } else {
        // 방을 찾을 수 없는 경우 (방이 삭제되었거나 서버 오류)
        alert('방을 찾을 수 없습니다. 메뉴로 이동합니다.');
        stopConnection();
        stopPolling();
        stopHeartbeat();
        setRoom(null);
        onBack(); // 천호 레이스 메뉴로 돌아가기
      }
    }, interval);
  }, [stopConnection, stopPolling, stopHeartbeat, onBack]);

  // 하트비트 전송 (10초마다 - 서버에서 15초 동안 응답 없으면 제거)
  const startHeartbeat = useCallback((roomCode: string) => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

    // 즉시 한번 하트비트 전송
    sendHeartbeat(roomCode);

    // 10초마다 하트비트 전송
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat(roomCode);
    }, 10000);
  }, []);

  useEffect(() => {
    return () => {
      stopConnection();
      stopPolling();
      stopHeartbeat();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [stopConnection, stopPolling, stopHeartbeat]);

  // 브라우저 종료/새로고침 시 방 나가기
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (room) {
        // sendBeacon으로 비동기 요청 (브라우저 종료 시에도 전송됨)
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';
        const playerId = localStorage.getItem('game-player-id');
        navigator.sendBeacon(
          `${API_BASE_URL}/api/game/rooms/${room.roomCode}/leave`,
          JSON.stringify({ playerId })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [room]);

  // 이미 입장한 방이 있으면 초기화 (천호 레이스에서 입장 후 전환된 경우)
  useEffect(() => {
    if (alreadyJoinedRoom) {
      setRoom(alreadyJoinedRoom);
      startSSE(alreadyJoinedRoom.roomCode);
      startPolling(alreadyJoinedRoom.roomCode);
      startHeartbeat(alreadyJoinedRoom.roomCode);
    }
  }, [alreadyJoinedRoom, startSSE, startPolling, startHeartbeat]);

  // 방 생성
  const handleCreateRoom = async () => {
    if (!playerName.trim()) { setError('이름을 입력해주세요'); return; }
    setIsLoading(true);
    setError(null);

    const response = await createRoom(playerName.trim(), maxPlayers, 'relay');
    if (response.success && response.data) {
      setRoom(response.data);
      setViewPhase('lobby');
      startSSE(response.data.roomCode);
      startPolling(response.data.roomCode);
      startHeartbeat(response.data.roomCode);
    } else {
      setError(response.error || '방 생성에 실패했습니다');
    }
    setIsLoading(false);
  };

  // 방 입장
  const handleJoinRoom = async () => {
    if (!playerName.trim()) { setError('이름을 입력해주세요'); return; }
    if (!roomCodeInput.trim()) { setError('방 코드를 입력해주세요'); return; }
    setIsLoading(true);
    setError(null);

    const response = await joinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim());
    if (response.success && response.data) {
      if (response.data.gameMode !== 'relay') {
        setError('릴레이 모드 방이 아닙니다');
        setIsLoading(false);
        return;
      }
      setRoom(response.data);
      setViewPhase('lobby');
      startSSE(response.data.roomCode);
      startPolling(response.data.roomCode);
      startHeartbeat(response.data.roomCode);
    } else {
      setError(response.error || '방 입장에 실패했습니다');
    }
    setIsLoading(false);
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    stopConnection();
    stopPolling();
    stopHeartbeat();
    await leaveRoom(room.roomCode);
    setRoom(null);
    onBack(); // 천호 레이스 메뉴로 돌아가기
  };

  // 돼지 선택 (기존과 동일)
  const handleSelectPig = async (pigId: number) => {
    if (!room || (room.status !== 'waiting' && room.status !== 'selecting')) return;
    const response = await selectPig(room.roomCode, pigId);
    if (response.success && response.data) setRoom(response.data);
  };

  // 팀 선택
  const handleSelectTeam = async (team: 'A' | 'B') => {
    if (!room || room.status !== 'waiting') return;
    const response = await selectTeam(room.roomCode, team);
    if (response.success && response.data) {
      setRoom(response.data);
    } else {
      alert(response.error || '팀 선택에 실패했습니다');
    }
  };

  const handleToggleReady = async () => {
    if (!room) return;
    const response = await toggleReady(room.roomCode);
    if (response.success && response.data) setRoom(response.data);
    else alert(response.error || '준비 상태 변경에 실패했습니다');
  };

  // 게임 시작 - 주자 순서 랜덤 배정
  const handleStartGame = async () => {
    if (!room || !isCurrentPlayerHost(room)) return;

    // 팀별 플레이어 분류 (관전자 제외, 돼지 선택한 플레이어만)
    const teamAPlayers = room.players.filter(p => p.team === 'A' && p.selectedPig !== null && !p.isSpectator);
    const teamBPlayers = room.players.filter(p => p.team === 'B' && p.selectedPig !== null && !p.isSpectator);

    // 검증: 양 팀에 최소 1명씩 필요
    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      alert('각 팀에 최소 1명의 플레이어가 필요합니다');
      return;
    }

    // 랜덤 셔플 (Fisher-Yates)
    const shuffle = <T,>(arr: T[]): T[] => {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const shuffledA = shuffle(teamAPlayers);
    const shuffledB = shuffle(teamBPlayers);

    // 1. 먼저 서버에 주자 순서 배정 요청
    const assignments: Array<{ playerId: string; order: number }> = [
      ...shuffledA.map((p, idx) => ({ playerId: p.id, order: idx + 1 })),
      ...shuffledB.map((p, idx) => ({ playerId: p.id, order: idx + 1 })),
    ];

    const assignResponse = await assignRunnerOrders(room.roomCode, assignments);
    if (!assignResponse.success) {
      alert(assignResponse.error || '주자 순서 배정에 실패했습니다');
      return;
    }

    // 2. 릴레이 주자 정보 생성 (프론트엔드용)
    const runners: RelayRunner[] = [
      ...shuffledA.map((p, idx) => ({
        playerId: p.id,
        playerName: p.name,
        pigId: p.selectedPig!,
        team: 'A' as const,
        order: idx + 1,
        position: 0,
        direction: idx === 0 ? 'forward' as const : 'waiting' as const,
        finishTime: null,
        status: 'normal' as const,
      })),
      ...shuffledB.map((p, idx) => ({
        playerId: p.id,
        playerName: p.name,
        pigId: p.selectedPig!,
        team: 'B' as const,
        order: idx + 1,
        position: 0,
        direction: idx === 0 ? 'forward' as const : 'waiting' as const,
        finishTime: null,
        status: 'normal' as const,
      })),
    ];

    setRelayRunners(runners);
    relayRunnersRef.current = runners;

    // 3. 게임 시작 요청
    const response = await startGame(room.roomCode);
    if (response.success && response.data) {
      // 릴레이 상태 초기화
      const relayState: RelayState = {
        teamA: { currentRunner: 1, completedRunners: 0, totalRunners: shuffledA.length, finishTime: null },
        teamB: { currentRunner: 1, completedRunners: 0, totalRunners: shuffledB.length, finishTime: null },
      };

      // runners를 pigs 형태로 변환 (게스트가 초기 데이터를 받을 수 있도록)
      const initialPigsData = runners.map((runner, idx) => ({
        id: idx,
        playerId: runner.playerId,
        playerName: runner.playerName,
        pigId: runner.pigId,
        team: runner.team,
        order: runner.order,
        position: runner.position,
        speed: 0,
        status: runner.status,
        direction: runner.direction,
        finishTime: runner.finishTime,
        rank: null,
      }));

      // 릴레이 상태와 초기 pigs 데이터 함께 업데이트
      await updateGameState(room.roomCode, {
        status: 'countdown',
        countdown: 3,
        relay: relayState,
        pigs: initialPigsData as any,
      });
      setRoom({ ...response.data, relay: relayState });
      setViewPhase('game');
    } else {
      alert(response.error || '게임 시작에 실패했습니다');
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (!room || isRefreshing) return;
    setIsRefreshing(true);
    const response = await getRoomState(room.roomCode);
    if (response.success && response.data) setRoom(response.data);
    setIsRefreshing(false);
  };

  const [isRestarting, setIsRestarting] = useState(false);
  const handlePrepareRematch = async () => {
    if (!room || !isCurrentPlayerHost(room) || isRestarting) return;
    setIsRestarting(true);

    // 플레이어 수만큼 돼지 초기화 (관전자 포함 전체 인원)
    const initialPigs: PigState[] = room.players.map((_, idx) => ({
      id: idx,
      team: idx % 2 === 0 ? 'A' : 'B',
      position: 0,
      speed: 0,
      status: 'normal',
      direction: 'forward',
      finishTime: null,
      rank: null,
    }));

    const response = await updateGameState(room.roomCode, {
      status: 'waiting',
      countdown: 3,
      raceStartTime: null,
      raceEndTime: null,
      relay: null,
      pigs: initialPigs,
      resetPlayers: true,
    });

    if (response.success && response.data) {
      setRoom(response.data);
      setRaceTime(0);
      setRelayRunners([]);
      relayRunnersRef.current = [];
    } else {
      alert('재경기 준비에 실패했습니다.');
    }
    setIsRestarting(false);
  };

  // 카운트다운
  useEffect(() => {
    if (!room || room.status !== 'countdown' || !isCurrentPlayerHost(room)) return;
    const roomCode = room.roomCode;

    const countdownInterval = setInterval(async () => {
      setRoom(prev => {
        if (!prev || prev.status !== 'countdown') return prev;
        const newCountdown = prev.countdown - 1;

        if (newCountdown <= 0) {
          clearInterval(countdownInterval);
          updateGameState(roomCode, {
            status: 'racing',
            countdown: 0,
            raceStartTime: Date.now(),
          });
          return { ...prev, status: 'racing' as const, countdown: 0, raceStartTime: Date.now() };
        }

        updateGameState(roomCode, { status: 'countdown', countdown: newCountdown });
        return { ...prev, countdown: newCountdown };
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [room?.status, room?.roomCode, room?.hostId, hostTakeoverTrigger]);

  const roomCodeRef = useRef<string>('');
  useEffect(() => {
    if (room) roomCodeRef.current = room.roomCode;
  }, [room]);

  // 릴레이 레이스 애니메이션
  useEffect(() => {
    if (!room || room.status !== 'racing' || !isCurrentPlayerHost(room)) {
      return;
    }
    if (relayRunnersRef.current.length === 0) {
      return;
    }

    isHostRacingRef.current = true;

    // 속도 = 1프레임당 이동 거리 (0-100 스케일)
    const BASE_SPEED = 1.25;

    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 200; // 더 빠른 업데이트
    let isAnimating = true;

    startTimeRef.current = performance.now();

    // 깊은 복사로 relay 상태 생성 (원본 수정 방지)
    const relay: RelayState = room.relay ? {
      teamA: { ...room.relay.teamA },
      teamB: { ...room.relay.teamB },
    } : {
      teamA: { currentRunner: 1, completedRunners: 0, totalRunners: relayRunnersRef.current.filter(r => r.team === 'A').length, finishTime: null },
      teamB: { currentRunner: 1, completedRunners: 0, totalRunners: relayRunnersRef.current.filter(r => r.team === 'B').length, finishTime: null },
    };

    // 박진감 밸런스: 상태 효과 더 극적으로
    const getStatusSpeedMultiplier = (status: PigState['status']) => {
      switch (status) {
        case 'turbo': return 2.5;      // 확 치고 나가기
        case 'superBoost': return 2.0;
        case 'boost': return 1.5;
        case 'slip': return 0.4;       // 살짝 미끄러짐
        case 'tired': return 0.6;      // 약간 지침
        default: return 1.0;
      }
    };

    const animate = async (currentTime: number) => {
      if (!isAnimating) return;

      const elapsed = currentTime - startTimeRef.current;
      setRaceTime(elapsed);

      const runners = relayRunnersRef.current;
      let teamAFinished = relay.teamA.finishTime !== null;
      let teamBFinished = relay.teamB.finishTime !== null;

      // 각 주자 업데이트
      const updatedRunners = runners.map(runner => {
        const teamRelay = runner.team === 'A' ? relay.teamA : relay.teamB;
        const isTeamFinished = runner.team === 'A' ? teamAFinished : teamBFinished;

        if (isTeamFinished || runner.direction === 'finished' || runner.direction === 'waiting') {
          return runner;
        }

        // 현재 주자가 아니면 대기
        if (runner.order !== teamRelay.currentRunner) {
          return runner;
        }

        // 속도 = BASE_SPEED (상수)
        const baseSpeed = BASE_SPEED;

        let newStatus = runner.status;
        let duration = statusDurationRef.current.get(runner.playerId) || 0;
        duration = Math.max(0, duration - 1);

        // 지속시간이 끝나면 normal로 복귀
        if (duration === 0 && runner.status !== 'normal') {
          newStatus = 'normal';
        }

        // normal 상태일 때만 새로운 상태 발동 가능
        // 박진감: 상태 발동 확률 높이고, 지속시간 짧게 → 역전 가능성 UP
        if (newStatus === 'normal') {
          const rand = Math.random();
          if (rand < 0.05) {
            newStatus = 'turbo';
            duration = 10;  // 짧지만 강력
          } else if (rand < 0.12) {
            newStatus = 'superBoost';
            duration = 12;
          } else if (rand < 0.22) {
            newStatus = 'boost';
            duration = 10;
          } else if (rand < 0.28) {
            newStatus = 'tired';
            duration = 12;  // 짧은 페널티
          } else if (rand < 0.34) {
            newStatus = 'slip';
            duration = 8;   // 아주 짧은 미끄러짐
          }
        }

        statusDurationRef.current.set(runner.playerId, duration);

        const statusMultiplier = getStatusSpeedMultiplier(newStatus);
        // 랜덤 변동폭 더 타이트하게: 0.95~1.05 (10%)
        const randomVariation = 0.95 + Math.random() * 0.1;
        const speed = baseSpeed * statusMultiplier * randomVariation;

        let newPosition = runner.position;
        let newDirection = runner.direction;

        if (runner.direction === 'forward') {
          newPosition = Math.min(100, runner.position + speed);
          if (newPosition >= 100) {
            newDirection = 'backward';
            newPosition = 100;
          }
        } else if (runner.direction === 'backward') {
          newPosition = Math.max(0, runner.position - speed);
          if (newPosition <= 0) {
            // 왕복 완료
            const team = runner.team === 'A' ? 'teamA' : 'teamB';
            relay[team].completedRunners++;

            if (relay[team].completedRunners >= relay[team].totalRunners) {
              // 팀 완주!
              relay[team].finishTime = elapsed;
              if (runner.team === 'A') teamAFinished = true;
              else teamBFinished = true;
              return { ...runner, position: 0, direction: 'finished' as const, finishTime: elapsed, status: 'normal' as const };
            } else {
              // 다음 주자 출발
              relay[team].currentRunner++;
              return { ...runner, position: 0, direction: 'finished' as const, finishTime: elapsed, status: 'normal' as const };
            }
          }
        }

        return { ...runner, position: newPosition, direction: newDirection, status: newStatus };
      });

      // 다음 주자 활성화
      const finalRunners = updatedRunners.map(runner => {
        const teamRelay = runner.team === 'A' ? relay.teamA : relay.teamB;
        if (runner.direction === 'waiting' && runner.order === teamRelay.currentRunner) {
          return { ...runner, direction: 'forward' as const };
        }
        return runner;
      });

      relayRunnersRef.current = finalRunners;
      setRelayRunners([...finalRunners]);

      // 서버 업데이트 (주자 위치 포함)
      if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
        lastUpdateTime = currentTime;

        const allFinished = teamAFinished && teamBFinished;

        // relayRunners를 pigs 형태로 변환하여 서버에 저장 (게스트가 볼 수 있도록)
        const pigsData = finalRunners.map((runner, idx) => ({
          id: idx,
          playerId: runner.playerId,
          playerName: runner.playerName,
          pigId: runner.pigId,
          team: runner.team,
          order: runner.order,
          position: runner.position,
          speed: 0,
          status: runner.status,
          direction: runner.direction,
          finishTime: runner.finishTime,
          rank: null,
        }));

        await updateGameState(roomCodeRef.current, {
          status: allFinished ? 'finished' : 'racing',
          relay: relay,
          pigs: pigsData as any,
          raceEndTime: allFinished ? Date.now() : null,
        });

        if (allFinished) {
          isAnimating = false;
          isHostRacingRef.current = false;
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
          setRoom(prev => prev ? { ...prev, status: 'finished' as const, relay, raceEndTime: Date.now() } : null);
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isAnimating = false;
      isHostRacingRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [room?.status, room?.roomCode, room?.hostId, hostTakeoverTrigger]);

  // 게임 상태 변경 감지 + 게스트를 위한 relayRunners 초기화
  useEffect(() => {
    if (room?.status === 'countdown' || room?.status === 'racing' || room?.status === 'finished') {
      setViewPhase('game');

      const isHost = isCurrentPlayerHost(room);

      // 게스트: room.pigs에서 relayRunners 업데이트 (서버에서 받은 위치 데이터 사용)
      if (!isHost && room.pigs && room.pigs.length > 0) {
        const pigsData = room.pigs as any[];
        // pigs 데이터에 playerId가 있으면 릴레이 데이터
        if (pigsData[0]?.playerId) {
          const runners: RelayRunner[] = pigsData.map(pig => ({
            playerId: pig.playerId,
            playerName: pig.playerName,
            pigId: pig.pigId,
            team: pig.team as 'A' | 'B',
            order: pig.order,
            position: pig.position,
            direction: pig.direction as 'forward' | 'backward' | 'waiting' | 'finished',
            finishTime: pig.finishTime,
            status: pig.status as PigState['status'],
          }));
          setRelayRunners(runners);
          relayRunnersRef.current = runners;
        }
      }
      // 게스트: relayRunners가 비어있고 pigs도 없으면 room.players에서 초기 생성
      else if (!isHost && relayRunnersRef.current.length === 0 && room.players.length > 0) {
        const teamAPlayers = room.players
          .filter(p => p.team === 'A' && p.runnerOrder !== null && !p.isSpectator)
          .sort((a, b) => (a.runnerOrder || 0) - (b.runnerOrder || 0));
        const teamBPlayers = room.players
          .filter(p => p.team === 'B' && p.runnerOrder !== null && !p.isSpectator)
          .sort((a, b) => (a.runnerOrder || 0) - (b.runnerOrder || 0));

        const runners: RelayRunner[] = [
          ...teamAPlayers.map((p, idx) => ({
            playerId: p.id,
            playerName: p.name,
            pigId: p.selectedPig || 0,
            team: 'A' as const,
            order: p.runnerOrder || idx + 1,
            position: 0,
            direction: (p.runnerOrder === 1 ? 'forward' : 'waiting') as 'forward' | 'backward' | 'waiting' | 'finished',
            finishTime: null,
            status: 'normal' as const,
          })),
          ...teamBPlayers.map((p, idx) => ({
            playerId: p.id,
            playerName: p.name,
            pigId: p.selectedPig || 0,
            team: 'B' as const,
            order: p.runnerOrder || idx + 1,
            position: 0,
            direction: (p.runnerOrder === 1 ? 'forward' : 'waiting') as 'forward' | 'backward' | 'waiting' | 'finished',
            finishTime: null,
            status: 'normal' as const,
          })),
        ];

        if (runners.length > 0) {
          setRelayRunners(runners);
          relayRunnersRef.current = runners;
        }
      }
    } else if (room?.status === 'waiting' || room?.status === 'selecting') {
      setViewPhase('lobby');
    }
  }, [room?.status, room?.players, room?.pigs]);

  // 폴링 관리
  useEffect(() => {
    if (!room) return;
    const isHost = isCurrentPlayerHost(room);

    if (room.status === 'racing' && !isHost) {
      startPolling(room.roomCode, 300);
    } else if (room.status === 'waiting' || room.status === 'selecting') {
      startPolling(room.roomCode, 3000);
    } else if (room.status === 'finished') {
      startPolling(room.roomCode, 1000);
    } else if (room.status === 'countdown') {
      startPolling(room.roomCode, 500);
    }
  }, [room?.status, room?.roomCode, startPolling]);

  // 게스트용 실시간 타이머 (호스트는 애니메이션 루프에서 처리)
  useEffect(() => {
    if (!room || room.status !== 'racing') return;
    const isHost = isCurrentPlayerHost(room);
    if (isHost) return; // 호스트는 애니메이션에서 처리

    // 게스트: raceStartTime 기준으로 경과 시간 계산
    const startTime = room.raceStartTime || Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setRaceTime(elapsed);
    }, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, [room?.status, room?.raceStartTime]);

  // ========== 렌더링 ==========

  const renderMenu = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4">
          <img src={`${import.meta.env.BASE_URL}ho.svg`} alt="천호" className="w-20 h-20 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">릴레이 레이스</h2>
        <p className="text-text-secondary mt-2">팀을 나눠 왕복 릴레이!</p>
        <p className="text-sm text-accent mt-1">🔴 A팀 vs B팀 🔵</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setViewPhase('create')}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all text-lg"
        >
          🏠 릴레이 방 만들기
        </button>
        <button
          onClick={() => setViewPhase('join')}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all text-lg"
        >
          🚪 릴레이 방 입장하기
        </button>
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-text-primary text-center">🏠 릴레이 방 만들기</h3>
      {error && <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">내 이름</label>
        <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
          placeholder="이름을 입력하세요" className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary" maxLength={10} />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">최대 인원 ({maxPlayers}명)</label>
        <input type="range" min="2" max="30" step="1" value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className="w-full" />
        <p className="text-xs text-text-secondary mt-1 text-center">💡 팀 밸런스가 안 맞으면 관전 가능</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setViewPhase('menu'); setError(null); }} className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg">뒤로</button>
        <button onClick={handleCreateRoom} disabled={isLoading} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg disabled:opacity-50">
          {isLoading ? '생성 중...' : '방 만들기'}
        </button>
      </div>
    </div>
  );

  const renderJoin = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-text-primary text-center">🚪 릴레이 방 입장하기</h3>
      {error && <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">내 이름</label>
        <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
          placeholder="이름을 입력하세요" className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary" maxLength={10} />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">방 코드</label>
        <input type="text" value={roomCodeInput} onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
          placeholder="6자리 코드" className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-center text-2xl tracking-widest font-mono" maxLength={6} />
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setViewPhase('menu'); setError(null); }} className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg">뒤로</button>
        <button onClick={handleJoinRoom} disabled={isLoading} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg disabled:opacity-50">
          {isLoading ? '입장 중...' : '입장하기'}
        </button>
      </div>
    </div>
  );

  const renderLobby = () => {
    if (!room) return null;

    const currentPlayer = getCurrentPlayer(room);
    const isHost = isCurrentPlayerHost(room);

    // 돼지 소유자 찾기
    const getPigOwner = (pigId: number): Player | undefined => room.players.find(p => p.selectedPig === pigId);

    // 팀별 분류
    const teamAPlayers = room.players.filter(p => p.team === 'A' && p.selectedPig !== null);
    const teamBPlayers = room.players.filter(p => p.team === 'B' && p.selectedPig !== null);
    const noPigPlayers = room.players.filter(p => p.selectedPig === null);

    const allReady = room.players.every(p => p.isReady || p.id === room.hostId);
    const hasEnoughPlayers = teamAPlayers.length >= 1 && teamBPlayers.length >= 1;
    const teamsBalanced = teamAPlayers.length === teamBPlayers.length;
    const canStart = isHost && allReady && hasEnoughPlayers && teamsBalanced;

    const myTeam = currentPlayer?.team;
    const myPig = currentPlayer?.selectedPig;
    const isPlayerReady = currentPlayer?.isReady ?? false;

    return (
      <div className="space-y-4">
        {/* 방 코드 */}
        <div className="text-center p-3 bg-bg-tertiary rounded-xl">
          <div className="flex justify-center items-center gap-2 mb-1">
            <p className="text-sm text-text-secondary">릴레이 방</p>
            <button onClick={handleRefresh} disabled={isRefreshing} className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              {isRefreshing ? '🔄' : '새로고침'}
            </button>
          </div>
          <p className="text-2xl font-mono font-bold text-accent tracking-widest">{room.roomCode}</p>
          <div className="mt-1 flex gap-3 justify-center">
            <button onClick={() => { navigator.clipboard.writeText(room.roomCode); alert('코드가 복사되었습니다!'); }} className="text-xs text-text-secondary hover:text-text-primary">
              📋 코드 복사
            </button>
            <button onClick={() => {
              const baseUrl = window.location.href.split('#')[0];
              const url = `${baseUrl}#/game?code=${room.roomCode}`;
              navigator.clipboard.writeText(url);
              alert('링크가 복사되었습니다!');
            }} className="text-xs text-text-secondary hover:text-text-primary">
              🔗 링크 복사
            </button>
          </div>
        </div>

        {/* 돼지 선택 */}
        {(room.status === 'waiting' || room.status === 'selecting') && !isPlayerReady && (
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-2">🐷 내 돼지 선택</h4>
            <div className="grid grid-cols-6 gap-2">
              {/* 서버에서 제공하는 pigs 배열 사용 (접속 인원 수만큼) */}
              {room.pigs.map((pig) => {
                const owner = getPigOwner(pig.id);
                const isSelected = myPig === pig.id;
                const isAvailable = !owner;
                const canClick = !isPlayerReady && (isAvailable || isSelected);
                const isOriginal = getPigColor(pig.id) === 'original';

                return (
                  <button key={pig.id} onClick={() => canClick && handleSelectPig(pig.id)} disabled={!canClick}
                    className={`p-1.5 rounded-lg border-2 transition-all ${isSelected ? 'border-accent bg-accent/20' : isAvailable ? 'border-border hover:border-accent/50 bg-bg-tertiary' : 'border-gray-600 bg-gray-800 opacity-50'}`}>
                    <div className={`w-6 h-6 rounded-full mx-auto ${isOriginal ? 'border-2 border-white' : ''}`} style={{ backgroundColor: getPigBgColor(pig.id) }} />
                    <p className="text-[8px] text-text-secondary truncate mt-0.5">{owner ? owner.name : ''}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 팀 선택 */}
        {(room.status === 'waiting') && myPig !== null && !isPlayerReady && (
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-2">🏃 내 팀 선택</h4>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleSelectTeam('A')}
                className={`p-3 rounded-xl border-2 transition-all ${myTeam === 'A' ? 'border-red-500 bg-red-500/20' : 'border-border hover:border-red-500/50 bg-bg-tertiary'}`}>
                <div className="text-xl mb-1">🔴</div>
                <div className="font-bold text-red-400">A팀</div>
                <div className="text-xs text-text-secondary">{teamAPlayers.length}명</div>
              </button>
              <button onClick={() => handleSelectTeam('B')}
                className={`p-3 rounded-xl border-2 transition-all ${myTeam === 'B' ? 'border-blue-500 bg-blue-500/20' : 'border-border hover:border-blue-500/50 bg-bg-tertiary'}`}>
                <div className="text-xl mb-1">🔵</div>
                <div className="font-bold text-blue-400">B팀</div>
                <div className="text-xs text-text-secondary">{teamBPlayers.length}명</div>
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2 text-center">💡 주자 순서는 게임 시작 시 랜덤 배정!</p>
          </div>
        )}

        {/* 참가자 목록 (천호 레이스와 동일) */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">
            참가자 ({teamAPlayers.length + teamBPlayers.length}명) / 관전자 ({noPigPlayers.length}명)
          </h4>
          <div className="space-y-2">
            {room.players.map((player) => {
              const isPlayerHost = player.id === room.hostId;
              const isSpectator = player.selectedPig === null;
              const playerTeam = player.team;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === getCurrentPlayerId()
                      ? 'bg-accent/20 border border-accent'
                      : 'bg-bg-tertiary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isPlayerHost && <span>👑</span>}
                    {isSpectator && !isPlayerHost && <span>👀</span>}
                    {!isSpectator && player.selectedPig !== null && (
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: getPigBgColor(player.selectedPig) }} />
                    )}
                    <span className="font-medium text-text-primary">{player.name}</span>
                    {player.id === getCurrentPlayerId() && (
                      <span className="text-xs text-accent">(나)</span>
                    )}
                    {isSpectator && (
                      <span className="text-xs text-blue-400">[관전]</span>
                    )}
                    {!isSpectator && playerTeam && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        playerTeam === 'A' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {playerTeam === 'A' ? '🔴 A팀' : '🔵 B팀'}
                      </span>
                    )}
                    {!isSpectator && !playerTeam && (
                      <span className="text-xs text-yellow-400">[팀 미선택]</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isPlayerHost ? (
                      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                        방장
                      </span>
                    ) : player.isReady ? (
                      <span className={`text-xs px-2 py-1 rounded ${
                        isSpectator
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {isSpectator ? '관전 준비' : '준비완료'}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
                        대기중
                      </span>
                    )}
                    {/* 방장만 다른 플레이어 강퇴 가능 */}
                    {isHost && !isPlayerHost && (
                      <button
                        onClick={async () => {
                          if (!confirm(`${player.name}님을 강퇴하시겠습니까?`)) return;
                          const result = await kickPlayer(room.roomCode, player.id);
                          if (result.success && result.data) {
                            setRoom(result.data);
                          } else {
                            alert(result.error || '강퇴에 실패했습니다.');
                          }
                        }}
                        className="text-xs px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                      >
                        강퇴
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 시작 조건 */}
        {isHost && (
          <div className="text-xs text-text-secondary p-2 bg-bg-tertiary rounded-lg space-y-1">
            <p className={hasEnoughPlayers ? 'text-green-400' : 'text-red-400'}>
              {hasEnoughPlayers ? '✓' : '✗'} 각 팀 최소 1명
            </p>
            <p className={teamsBalanced ? 'text-green-400' : 'text-red-400'}>
              {teamsBalanced ? '✓' : '✗'} A팀 = B팀 인원 ({teamAPlayers.length} vs {teamBPlayers.length})
            </p>
            <p className={allReady ? 'text-green-400' : 'text-red-400'}>
              {allReady ? '✓' : '✗'} 모두 준비 완료
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button onClick={handleLeaveRoom} className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg">나가기</button>
          {isHost ? (
            <button onClick={handleStartGame} disabled={!canStart}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg disabled:opacity-50">
              {!canStart ? '준비 대기' : '🏁 시작!'}
            </button>
          ) : (
            <button onClick={handleToggleReady}
              className={`flex-1 py-3 font-bold rounded-lg ${isPlayerReady ? 'bg-gray-600 text-gray-300' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'}`}>
              {isPlayerReady ? '준비 취소' : myPig === null ? '👀 관전 준비' : '준비 완료'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderGame = () => {
    if (!room) return null;

    const isCountdown = room.status === 'countdown';
    const isRacing = room.status === 'racing';
    const isFinished = room.status === 'finished';
    const isHost = isCurrentPlayerHost(room);

    // relay 데이터 (서버에서 finishTime이 누락될 경우 relayRunners에서 계산)
    const relay = room.relay ? {
      ...room.relay,
      teamA: {
        ...room.relay.teamA,
        // 서버에 finishTime이 없으면 relayRunners에서 마지막 주자의 finishTime 사용
        finishTime: room.relay.teamA.finishTime ||
          relayRunners.filter(r => r.team === 'A' && r.direction === 'finished')
            .reduce((max, r) => r.finishTime && r.finishTime > (max || 0) ? r.finishTime : max, null as number | null),
      },
      teamB: {
        ...room.relay.teamB,
        finishTime: room.relay.teamB.finishTime ||
          relayRunners.filter(r => r.team === 'B' && r.direction === 'finished')
            .reduce((max, r) => r.finishTime && r.finishTime > (max || 0) ? r.finishTime : max, null as number | null),
      },
    } : null;

    // 팀별 주자 분리
    const teamARunners = relayRunners.filter(r => r.team === 'A').sort((a, b) => a.order - b.order);
    const teamBRunners = relayRunners.filter(r => r.team === 'B').sort((a, b) => a.order - b.order);

    // 게스트: relayRunners가 없으면 로딩 표시
    if (relayRunners.length === 0 && !isHost) {
      return (
        <div className="text-center py-10">
          <div className="text-4xl animate-bounce mb-4">🏃</div>
          <p className="text-text-secondary">게임 데이터 로딩 중...</p>
        </div>
      );
    }

    const currentRunnerA = relay ? teamARunners.find(r => r.order === relay.teamA.currentRunner) : null;
    const currentRunnerB = relay ? teamBRunners.find(r => r.order === relay.teamB.currentRunner) : null;

    return (
      <div className="space-y-4">
        {/* 카운트다운 */}
        {isCountdown && room.countdown > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <div className="text-9xl font-bold text-white animate-pulse">{room.countdown}</div>
              <div className="text-2xl text-white/80 mt-4">🏃 릴레이 시작!</div>
            </div>
          </div>
        )}

        {/* 상태 바 */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">
            {isCountdown && `⏱️ ${room.countdown}`}
            {isRacing && `🏃 ${(raceTime / 1000).toFixed(1)}초`}
            {isFinished && '🏁 종료!'}
          </span>
          <span className="text-text-secondary">{room.roomCode}</span>
        </div>

        {/* 팀 진행 상황 */}
        {relay && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-2 rounded-xl ${TEAM_COLORS.A.bg} border ${TEAM_COLORS.A.border}`}>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-red-400">🔴 A팀</span>
                <span className="text-text-secondary">{relay.teamA.completedRunners}/{relay.teamA.totalRunners}</span>
              </div>
              {currentRunnerA && <div className="text-xs mt-1">달리는 중: {currentRunnerA.playerName}</div>}
              {relay.teamA.finishTime && <div className="text-green-400 font-bold text-sm">🏆 {(relay.teamA.finishTime / 1000).toFixed(2)}초</div>}
            </div>
            <div className={`p-2 rounded-xl ${TEAM_COLORS.B.bg} border ${TEAM_COLORS.B.border}`}>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-blue-400">🔵 B팀</span>
                <span className="text-text-secondary">{relay.teamB.completedRunners}/{relay.teamB.totalRunners}</span>
              </div>
              {currentRunnerB && <div className="text-xs mt-1">달리는 중: {currentRunnerB.playerName}</div>}
              {relay.teamB.finishTime && <div className="text-green-400 font-bold text-sm">🏆 {(relay.teamB.finishTime / 1000).toFixed(2)}초</div>}
            </div>
          </div>
        )}

        {/* 레이스 트랙 - 모든 주자 표시 */}
        <div className="relative bg-gradient-to-b from-green-700 to-green-600 rounded-2xl overflow-hidden border-4 border-green-800"
          style={{ height: `${Math.max(200, relayRunners.length * 35)}px` }}>

          {/* 출발선 */}
          <div className="absolute left-[5%] top-0 bottom-0 w-1 bg-white" />
          {/* 결승선 */}
          <div className="absolute right-[5%] top-0 bottom-0 w-3 bg-checkered" />

          {/* A팀 주자들 (위쪽) */}
          {teamARunners.map((runner, idx) => {
            const isCurrentRunner = relay && runner.order === relay.teamA.currentRunner;
            const pigColor = getPigColor(runner.pigId);
            const statusEmoji = getStatusEmoji(runner.status);

            return (
              <div key={`A-${runner.playerId}`} className="absolute flex items-center"
                style={{
                  left: `calc(5% + ${runner.position * 0.9}%)`,
                  top: `${10 + idx * 30}px`,
                  transform: 'translateX(-50%)',
                  opacity: runner.direction === 'waiting' ? 0.4 : 1,
                  transition: 'opacity 0.3s',
                }}>
                <div className="relative flex flex-col items-center">
                  <div className="text-[9px] font-bold px-1 py-0.5 rounded-full mb-0.5 whitespace-nowrap"
                    style={{ backgroundColor: TEAM_COLORS.A.primary, color: '#fff' }}>
                    {statusEmoji && <span className="mr-0.5">{statusEmoji}</span>}
                    {runner.order}. {runner.playerName}
                    {runner.direction === 'backward' && ' ←'}
                    {runner.direction === 'forward' && ' →'}
                  </div>
                  {/* 이미지 반전을 위한 래퍼 (애니메이션과 scaleX 충돌 방지) */}
                  <div style={{ transform: runner.direction === 'backward' ? 'scaleX(-1)' : 'none' }}>
                    <img src={`${import.meta.env.BASE_URL}ho.svg`} alt="호" width="35" height="35"
                      className={isCurrentRunner && isRacing ? 'drop-shadow-md' : ''}
                      style={{
                        animation: isCurrentRunner && isRacing && runner.direction !== 'finished' && runner.direction !== 'waiting' ? 'pigRun 0.2s infinite' : 'none',
                        filter: getColorFilter(pigColor),
                      }} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* 팀 구분선 */}
          <div className="absolute w-full border-t-2 border-dashed border-white/30"
            style={{ top: `${10 + teamARunners.length * 30 + 10}px` }} />

          {/* B팀 주자들 (아래쪽) */}
          {teamBRunners.map((runner, idx) => {
            const isCurrentRunner = relay && runner.order === relay.teamB.currentRunner;
            const pigColor = getPigColor(runner.pigId);
            const topOffset = 10 + teamARunners.length * 30 + 25;
            const statusEmoji = getStatusEmoji(runner.status);

            return (
              <div key={`B-${runner.playerId}`} className="absolute flex items-center"
                style={{
                  left: `calc(5% + ${runner.position * 0.9}%)`,
                  top: `${topOffset + idx * 30}px`,
                  transform: 'translateX(-50%)',
                  opacity: runner.direction === 'waiting' ? 0.4 : 1,
                  transition: 'opacity 0.3s',
                }}>
                <div className="relative flex flex-col items-center">
                  <div className="text-[9px] font-bold px-1 py-0.5 rounded-full mb-0.5 whitespace-nowrap"
                    style={{ backgroundColor: TEAM_COLORS.B.primary, color: '#fff' }}>
                    {statusEmoji && <span className="mr-0.5">{statusEmoji}</span>}
                    {runner.order}. {runner.playerName}
                    {runner.direction === 'backward' && ' ←'}
                    {runner.direction === 'forward' && ' →'}
                  </div>
                  {/* 이미지 반전을 위한 래퍼 (애니메이션과 scaleX 충돌 방지) */}
                  <div style={{ transform: runner.direction === 'backward' ? 'scaleX(-1)' : 'none' }}>
                    <img src={`${import.meta.env.BASE_URL}ho.svg`} alt="호" width="35" height="35"
                      className={isCurrentRunner && isRacing ? 'drop-shadow-md' : ''}
                      style={{
                        animation: isCurrentRunner && isRacing && runner.direction !== 'finished' && runner.direction !== 'waiting' ? 'pigRun 0.2s infinite' : 'none',
                        filter: getColorFilter(pigColor),
                      }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 결과 */}
        {isFinished && relay && (
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-text-primary text-center">🏆 결과</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { team: 'A', relay: relay.teamA, color: TEAM_COLORS.A },
                { team: 'B', relay: relay.teamB, color: TEAM_COLORS.B },
              ].sort((a, b) => (a.relay.finishTime || 999999) - (b.relay.finishTime || 999999))
                .map(({ team, relay: teamRelay, color }, idx) => (
                  <div key={team} className={`p-4 rounded-xl ${idx === 0 ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500' : 'bg-gray-500/20 border border-gray-500'}`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-1 ${idx === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {idx === 0 ? '🎉 승리!' : '패배'}
                      </div>
                      <div className={`font-bold text-xl ${color.text}`}>
                        {team === 'A' ? '🔴 A팀' : '🔵 B팀'}
                      </div>
                      <div className="text-text-secondary mt-1">
                        {teamRelay.finishTime ? `${(teamRelay.finishTime / 1000).toFixed(2)}초` : '미완주'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 버튼 */}
        {isFinished && (
          <div className="space-y-3">
            {!isHost && <p className="text-center text-text-secondary text-sm">⏳ 방장이 재경기를 시작하면 로비로 이동</p>}
            <div className="flex gap-3">
              <button onClick={handleLeaveRoom} className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg">나가기</button>
              {isHost && (
                <button onClick={handlePrepareRematch} disabled={isRestarting}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg disabled:opacity-50">
                  {isRestarting ? '준비중...' : '🔄 한번 더!'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={viewPhase === 'menu' ? onBack : () => { if (room) handleLeaveRoom(); else setViewPhase('menu'); }}
          className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
          <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}ho.svg`} alt="천호" className="w-6 h-6" />
            천호 레이스
          </h2>
          <p className="text-sm text-text-secondary">
            {viewPhase === 'menu' && '릴레이 모드 - A팀 vs B팀 왕복 릴레이'}
            {viewPhase === 'create' && '릴레이 방 만들기'}
            {viewPhase === 'join' && '릴레이 방 입장'}
            {viewPhase === 'lobby' && `릴레이 대기실 (${room?.players.length || 0}명)`}
            {viewPhase === 'game' && '릴레이!'}
          </p>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-border p-6">
        {viewPhase === 'menu' && renderMenu()}
        {viewPhase === 'create' && renderCreate()}
        {viewPhase === 'join' && renderJoin()}
        {viewPhase === 'lobby' && renderLobby()}
        {viewPhase === 'game' && renderGame()}
      </div>

      <style>{`
        .bg-checkered {
          background-image: linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%);
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

export default RelayPigRace;
