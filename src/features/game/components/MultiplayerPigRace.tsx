import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameRoom, PigState, Player } from '../services/gameApi';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  selectPig,
  toggleReady,
  startGame,
  updateGameState,
  getCurrentPlayerId,
  isCurrentPlayerHost,
  getCurrentPlayer,
  subscribeToRoom,
  getRoomState,
  type SSEConnection,
} from '../services/gameApi';

// 돼지 색상 정의 (프론트엔드에서만 사용) - 30개 고유 색상
const PIG_COLORS = [
  '#FF6B6B', // 빨강
  '#4ECDC4', // 청록
  '#FFE66D', // 노랑
  '#95E1D3', // 민트
  '#F38181', // 코랄
  '#AA96DA', // 라벤더
  '#FCBAD3', // 핑크
  '#A8D8EA', // 하늘
  '#F9ED69', // 레몬
  '#B8E994', // 라임
  '#FF9F43', // 오렌지
  '#6C5CE7', // 보라
  '#74B9FF', // 파랑
  '#FD79A8', // 로즈
  '#00B894', // 에메랄드
  '#E17055', // 테라코타
  '#81ECEC', // 시안
  '#FFEAA7', // 베이지
  '#DFE6E9', // 실버
  '#A29BFE', // 퍼플
  '#55EFC4', // 아쿠아
  '#FAB1A0', // 피치
  '#74B9FF', // 스카이
  '#FF7675', // 살몬
  '#FDCB6E', // 골드
  '#E84393', // 마젠타
  '#00CEC9', // 틸
  '#636E72', // 그레이
  '#D63031', // 크림슨
  '#0984E3', // 블루
];

// 돼지 색상 가져오기
const getPigColor = (pigId: number): string => {
  return PIG_COLORS[pigId % PIG_COLORS.length];
};

// 돼지 소유자 찾기 (Player.selectedPig 기반)
const getPigOwner = (room: GameRoom, pigId: number): Player | undefined => {
  return room.players.find(p => p.selectedPig === pigId);
};

interface MultiplayerPigRaceProps {
  onBack: () => void;
  initialMode?: 'menu' | 'room' | 'input' | null;
  initialRoomCode?: string | null;
}

type ViewPhase = 'menu' | 'create' | 'join' | 'lobby' | 'game';

const MultiplayerPigRace = ({ onBack, initialMode, initialRoomCode }: MultiplayerPigRaceProps) => {
  // 뷰 상태 - 초기 모드에 따라 설정
  const getInitialViewPhase = (): ViewPhase => {
    if (initialMode === 'room') return 'create';
    if (initialMode === 'input') return 'join';
    return 'menu';
  };

  const [viewPhase, setViewPhase] = useState<ViewPhase>(getInitialViewPhase());
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

  // 게임 상태
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // SSE & 애니메이션
  const sseConnectionRef = useRef<SSEConnection | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [raceTime, setRaceTime] = useState(0);

  // 호스트가 레이싱 중인지 추적하는 ref (SSE 업데이트 무시용)
  const isHostRacingRef = useRef(false);

  // SSE 연결 시작
  const startSSE = useCallback((roomCode: string) => {
    console.log('[SSE] startSSE 호출됨, roomCode:', roomCode);

    // 기존 연결 정리
    if (sseConnectionRef.current) {
      console.log('[SSE] 기존 연결 종료');
      sseConnectionRef.current.close();
    }

    console.log('[SSE] subscribeToRoom 호출 시작');
    const connection = subscribeToRoom(
      roomCode,
      (updatedRoom) => {
        console.log('[SSE] 🔔 방 상태 업데이트 수신!');
        console.log('[SSE] - 플레이어 수:', updatedRoom.players.length);
        console.log('[SSE] - 방 상태:', updatedRoom.status);
        console.log('[SSE] - isHostRacingRef:', isHostRacingRef.current);

        // 호스트가 레이싱 중이면 돼지 위치 업데이트만 무시 (로컬 애니메이션 우선)
        // 단, 레이싱 중에도 status가 finished로 바뀌면 받아야 함
        if (isHostRacingRef.current && updatedRoom.status === 'racing') {
          console.log('[SSE] ⏭️ 호스트 레이싱 중 - racing 상태 업데이트 무시');
          return;
        }

        setRoom(updatedRoom);
      },
      (errorMsg) => {
        console.error('[SSE] ❌ 에러:', errorMsg);
      }
    );

    console.log('[SSE] 연결 객체 저장됨');
    sseConnectionRef.current = connection;
  }, []);

  // SSE 연결 정리
  const stopConnection = useCallback(() => {
    if (sseConnectionRef.current) {
      sseConnectionRef.current.close();
      sseConnectionRef.current = null;
    }
  }, []);

  // 폴링 인터벌 ref
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 폴링 시작 (SSE 폴백용)
  // 게스트는 레이싱 중에도 폴링해서 돼지 위치 업데이트 받음
  const startPolling = useCallback((roomCode: string, interval: number = 3000) => {
    // 기존 폴링 정리
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    console.log(`[Polling] 폴링 시작 (${interval}ms 간격)`);

    pollingIntervalRef.current = setInterval(async () => {
      // 호스트가 레이싱 중이면 폴링 안 함 (로컬 애니메이션 사용)
      if (isHostRacingRef.current) {
        return;
      }

      const response = await getRoomState(roomCode);

      if (response.success && response.data) {
        setRoom(prev => {
          // 호스트가 레이싱 중이면 업데이트하지 않음
          if (isHostRacingRef.current && response.data!.status === 'racing') {
            return prev;
          }
          return response.data!;
        });
      }
    }, interval);
  }, []);

  // 폴링 정리
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('[Polling] 폴링 중지');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      stopConnection();
      stopPolling();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stopConnection, stopPolling]);

  // initialMode/initialRoomCode props 변경 시 상태 업데이트
  useEffect(() => {
    if (initialMode === 'room') {
      setViewPhase('create');
    } else if (initialMode === 'input') {
      setViewPhase('join');
    }
  }, [initialMode]);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode);
    }
  }, [initialRoomCode]);

  // URL 방 코드로 자동 입장 시도
  useEffect(() => {
    const autoJoin = async () => {
      if (initialRoomCode && playerName.trim() && !autoJoinAttempted && viewPhase === 'join') {
        setAutoJoinAttempted(true);
        setIsLoading(true);
        setError(null);

        console.log('🔗 URL 방 코드로 자동 입장 시도:', initialRoomCode);
        const response = await joinRoom(initialRoomCode.toUpperCase(), playerName.trim());

        if (response.success && response.data) {
          console.log('✅ 자동 입장 성공:', response.data.roomCode);
          setRoom(response.data);
          setViewPhase('lobby');
          startSSE(response.data.roomCode);
          startPolling(response.data.roomCode);
        } else {
          console.error('❌ 자동 입장 실패:', response.error);
          setError(response.error || '방 입장에 실패했습니다');
        }

        setIsLoading(false);
      }
    };

    autoJoin();
  }, [initialRoomCode, playerName, autoJoinAttempted, viewPhase, startSSE, startPolling]);

  // 방 생성
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('🏠 방 생성 요청...');
    const response = await createRoom(playerName.trim(), maxPlayers);
    console.log('🏠 방 생성 응답:', response);

    if (response.success && response.data) {
      console.log('✅ 방 생성 성공:', response.data.roomCode);
      console.log('- 플레이어:', response.data.players);
      console.log('- 돼지 수:', response.data.pigs.length);
      setRoom(response.data);
      setViewPhase('lobby');
      startSSE(response.data.roomCode);
      startPolling(response.data.roomCode); // SSE 폴백용 폴링 시작
    } else {
      console.error('❌ 방 생성 실패:', response.error);
      setError(response.error || '방 생성에 실패했습니다');
    }

    setIsLoading(false);
  };

  // 방 입장
  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }
    if (!roomCodeInput.trim()) {
      setError('방 코드를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('🚪 방 입장 요청...');
    const response = await joinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim());
    console.log('🚪 방 입장 응답:', response);

    if (response.success && response.data) {
      console.log('✅ 방 입장 성공:', response.data.roomCode);
      console.log('- 현재 플레이어 수:', response.data.players.length);
      console.log('- 플레이어들:', response.data.players.map(p => p.name).join(', '));
      setRoom(response.data);
      setViewPhase('lobby');
      startSSE(response.data.roomCode);
      startPolling(response.data.roomCode); // SSE 폴백용 폴링 시작
    } else {
      console.error('❌ 방 입장 실패:', response.error);
      setError(response.error || '방 입장에 실패했습니다');
    }

    setIsLoading(false);
  };

  // 방 나가기
  const handleLeaveRoom = async () => {
    if (!room) return;

    stopConnection();
    stopPolling();
    await leaveRoom(room.roomCode);
    setRoom(null);
    setViewPhase('menu');
  };

  // 수동 새로고침
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (!room || isRefreshing) return;

    setIsRefreshing(true);
    console.log('[Manual] 🔄 수동 새로고침...');

    const response = await getRoomState(room.roomCode);
    if (response.success && response.data) {
      console.log('[Manual] ✅ 새로고침 성공:', response.data.players.length, '명');
      setRoom(response.data);
    }

    setIsRefreshing(false);
  };

  // 재경기 준비 모드로 전환 - 호스트만
  const [isRestarting, setIsRestarting] = useState(false);
  const handlePrepareRematch = async () => {
    if (!room || !isCurrentPlayerHost(room) || isRestarting) return;

    setIsRestarting(true);
    console.log('🔄 재경기 준비 모드로 전환...');

    // 돼지 위치 초기화 (선택은 유지)
    const resetPigs = room.pigs.map(pig => ({
      ...pig,
      position: 0,
      speed: 0,
      status: 'normal' as const,
      finishTime: null,
      rank: null,
    }));

    // 서버에 상태 리셋 요청 - waiting 상태로 변경하여 준비 시스템 활성화
    const response = await updateGameState(room.roomCode, {
      status: 'waiting',
      countdown: 3,
      raceStartTime: null,
      raceEndTime: null,
      pigs: resetPigs,
    });

    if (response.success && response.data) {
      console.log('✅ 재경기 대기 상태로 전환!');
      setRoom(response.data);
      setRaceTime(0);
      setGuestRaceTime(0);
    } else {
      console.error('❌ 재경기 준비 실패:', response.error);
      alert('재경기 준비에 실패했습니다.');
    }

    setIsRestarting(false);
  };

  // 재경기 시작 - 모두 준비되면 호스트가 시작
  const handleStartRematch = async () => {
    if (!room || !isCurrentPlayerHost(room) || isRestarting) return;

    setIsRestarting(true);
    console.log('🔄 재경기 시작...');

    // 돼지 위치 초기화 (선택은 유지)
    const resetPigs = room.pigs.map(pig => ({
      ...pig,
      position: 0,
      speed: 0,
      status: 'normal' as const,
      finishTime: null,
      rank: null,
    }));

    // 서버에 카운트다운 시작 요청
    const response = await updateGameState(room.roomCode, {
      status: 'countdown',
      countdown: 3,
      raceStartTime: null,
      raceEndTime: null,
      pigs: resetPigs,
    });

    if (response.success && response.data) {
      console.log('✅ 재경기 시작!');
      setRoom(response.data);
      setRaceTime(0);
      setGuestRaceTime(0);
    } else {
      console.error('❌ 재경기 시작 실패:', response.error);
      alert('재경기 시작에 실패했습니다.');
    }

    setIsRestarting(false);
  };

  // 돼지 선택
  const handleSelectPig = async (pigId: number) => {
    // waiting 또는 selecting 상태에서만 돼지 선택 가능
    if (!room || (room.status !== 'waiting' && room.status !== 'selecting')) return;

    const response = await selectPig(room.roomCode, pigId);
    if (response.success && response.data) {
      setRoom(response.data);
    }
  };

  // 준비 완료
  const handleToggleReady = async () => {
    if (!room) return;

    console.log('준비 완료 요청:', room.roomCode);
    const response = await toggleReady(room.roomCode);
    console.log('준비 완료 응답:', response);
    if (response.success && response.data) {
      setRoom(response.data);
    } else {
      console.error('준비 완료 실패:', response.error);
      alert(`준비 완료 실패: ${response.error || '알 수 없는 오류'}`);
    }
  };

  // 게임 시작 (호스트만)
  const handleStartGame = async () => {
    console.log('🎮 게임 시작 클릭');
    console.log('- room:', room);
    console.log('- isHost:', room ? isCurrentPlayerHost(room) : 'no room');

    if (!room || !isCurrentPlayerHost(room)) {
      console.log('❌ 게임 시작 조건 불충족');
      return;
    }

    console.log('📤 startGame API 호출...');
    const response = await startGame(room.roomCode);
    console.log('📥 startGame 응답:', response);

    if (response.success && response.data) {
      console.log('✅ 게임 시작 성공, 상태:', response.data.status);
      setRoom(response.data);
      setViewPhase('game');
    } else {
      console.error('❌ 게임 시작 실패:', response.error);
      alert(`게임 시작 실패: ${response.error || '알 수 없는 오류'}`);
    }
  };

  // 호스트: 레이스 애니메이션 실행
  // 상태 지속시간을 로컬로 관리 (서버에는 전송 안함)
  const statusDurationRef = useRef<Map<number, number>>(new Map());

  // 카운트다운 처리 (호스트만)
  useEffect(() => {
    if (!room || room.status !== 'countdown' || !isCurrentPlayerHost(room)) return;

    console.log('⏱️ 카운트다운 시작:', room.countdown);
    const roomCode = room.roomCode;

    const countdownInterval = setInterval(async () => {
      setRoom(prev => {
        if (!prev || prev.status !== 'countdown') return prev;

        const newCountdown = prev.countdown - 1;
        console.log('⏱️ 카운트다운:', newCountdown);

        if (newCountdown <= 0) {
          // 카운트다운 종료 → racing 상태로 전환
          console.log('🏁 카운트다운 종료! racing으로 전환');
          clearInterval(countdownInterval);

          // 서버에 racing 상태 업데이트
          updateGameState(roomCode, {
            status: 'racing',
            countdown: 0,
            raceStartTime: Date.now(),
            pigs: prev.pigs,
          }).then(response => {
            if (response.success && response.data) {
              setRoom(response.data);
            }
          });

          return { ...prev, status: 'racing' as const, countdown: 0 };
        }

        // 서버에 카운트다운 업데이트
        updateGameState(roomCode, {
          status: 'countdown',
          countdown: newCountdown,
          pigs: prev.pigs,
        });

        return { ...prev, countdown: newCountdown };
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [room?.status, room?.roomCode]);

  // 돼지 상태를 ref로 관리 (클로저 문제 해결)
  const pigsRef = useRef<PigState[]>([]);
  const roomCodeRef = useRef<string>('');

  // room이 변경될 때 ref 업데이트
  useEffect(() => {
    if (room) {
      pigsRef.current = room.pigs;
      roomCodeRef.current = room.roomCode;
    }
  }, [room]);

  useEffect(() => {
    console.log('🏁 레이스 useEffect 실행');
    console.log('- room:', room?.roomCode);
    console.log('- status:', room?.status);
    console.log('- isHost:', room ? isCurrentPlayerHost(room) : 'no room');

    if (!room || room.status !== 'racing' || !isCurrentPlayerHost(room)) {
      console.log('⏸️ 레이스 애니메이션 조건 불충족');
      return;
    }

    console.log('🚀 레이스 애니메이션 시작!');
    console.log('- 돼지 수:', room.pigs.length);
    console.log('- 플레이어 수:', room.players.length);

    // 호스트 레이싱 플래그 설정 (SSE 업데이트 무시)
    isHostRacingRef.current = true;

    // 선택된 돼지 ID들 (게임 종료 조건에 사용)
    const selectedPigIds = new Set(
      room.players.map(p => p.selectedPig).filter((id): id is number => id !== null)
    );
    console.log('- 선택된 돼지들:', Array.from(selectedPigIds));

    const RACE_DURATION = 20000;
    const FPS = 60;
    const FRAME_TIME = 1000 / FPS;
    let lastFrameTime = 0;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 500; // 500ms마다 서버 업데이트 (SSE로 게스트에게 전파)
    let isAnimating = true;

    startTimeRef.current = performance.now();

    // 초기 돼지 상태 설정
    pigsRef.current = [...room.pigs];

    // 상태 지속시간 초기화
    room.pigs.forEach(pig => {
      statusDurationRef.current.set(pig.id, 0);
    });

    const getStatusSpeedMultiplier = (status: PigState['status']) => {
      switch (status) {
        case 'turbo': return 4.0;
        case 'superBoost': return 2.5;
        case 'boost': return 1.8;
        case 'slip': return 0.05;
        case 'tired': return 0.2;
        default: return 1.0;
      }
    };

    const animate = async (currentTime: number) => {
      if (!isAnimating) return;

      const elapsed = currentTime - startTimeRef.current;

      if (currentTime - lastFrameTime < FRAME_TIME) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;

      setRaceTime(elapsed);

      // 현재 돼지 상태에서 업데이트 (ref 사용)
      const currentPigs = pigsRef.current;

      // 돼지 위치 업데이트
      const updatedPigs = currentPigs.map((pig) => {
        if (pig.finishTime !== null) return pig;

        const baseSpeed = 100 / (RACE_DURATION / FRAME_TIME);

        let newStatus = pig.status;
        let duration = statusDurationRef.current.get(pig.id) || 0;
        duration = Math.max(0, duration - 1);

        if (duration === 0 && pig.status !== 'normal') {
          newStatus = 'normal';
        }

        if (newStatus === 'normal') {
          const rand = Math.random();
          if (rand < 0.03) {
            newStatus = 'turbo';
            duration = 25;
          } else if (rand < 0.08) {
            newStatus = 'superBoost';
            duration = 35;
          } else if (rand < 0.15) {
            newStatus = 'boost';
            duration = 25;
          } else if (rand < 0.20) {
            newStatus = 'tired';
            duration = 40;
          } else if (rand < 0.25) {
            newStatus = 'slip';
            duration = 30;
          }
        }

        statusDurationRef.current.set(pig.id, duration);

        const statusMultiplier = getStatusSpeedMultiplier(newStatus);
        const randomVariation = 0.85 + Math.random() * 0.3;
        const speed = baseSpeed * statusMultiplier * randomVariation;

        const newPosition = Math.min(100, pig.position + speed);

        if (newPosition >= 100 && pig.finishTime === null) {
          const finishedCount = currentPigs.filter(p => p.finishTime !== null).length;
          return {
            ...pig,
            position: 100,
            speed: 0,
            finishTime: elapsed,
            rank: finishedCount + 1,
            status: 'normal' as const,
          };
        }

        return {
          ...pig,
          position: newPosition,
          speed,
          status: newStatus,
        };
      });

      // ref 업데이트
      pigsRef.current = updatedPigs;

      // 로컬 상태 업데이트
      setRoom(prev => prev ? { ...prev, pigs: updatedPigs } : null);

      // 서버에 주기적으로 업데이트 전송
      if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
        lastUpdateTime = currentTime;

        // 선택된 돼지들만 확인하여 게임 종료 판단
        const selectedPigsFinished = updatedPigs
          .filter(p => selectedPigIds.has(p.id))
          .every(p => p.finishTime !== null);

        const allFinished = selectedPigsFinished || updatedPigs.every(p => p.finishTime !== null);
        const newStatus = allFinished ? 'finished' : 'racing';

        // 서버에 업데이트 전송 (SSE로 게스트들에게 전파됨)
        await updateGameState(roomCodeRef.current, {
          status: newStatus,
          pigs: updatedPigs,
          raceEndTime: allFinished ? Date.now() : null,
        });

        if (allFinished) {
          console.log('🏆 레이스 종료!');
          isAnimating = false;
          isHostRacingRef.current = false; // 레이스 종료 - SSE 다시 받기

          // 애니메이션 정리
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }

          // 로컬 상태를 finished로 확실히 업데이트
          setRoom(prev => prev ? {
            ...prev,
            status: 'finished' as const,
            pigs: updatedPigs,
            raceEndTime: Date.now()
          } : null);
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isAnimating = false;
      isHostRacingRef.current = false; // 클린업 시 플래그 해제
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [room?.status, room?.roomCode]);

  // 게스트용 보간 상태 (부드러운 애니메이션용)
  const [interpolatedPigs, setInterpolatedPigs] = useState<PigState[]>([]);
  const targetPigsRef = useRef<PigState[]>([]);
  const guestAnimationRef = useRef<number | null>(null);
  const guestStartTimeRef = useRef<number>(0);
  const [guestRaceTime, setGuestRaceTime] = useState(0);

  // 게스트: 서버에서 받은 돼지 위치를 목표로 설정
  useEffect(() => {
    if (room?.status === 'racing' && !isCurrentPlayerHost(room)) {
      targetPigsRef.current = room.pigs;
    }
  }, [room?.pigs, room?.status]);

  // 게스트용 보간 애니메이션 + 시간 카운트
  useEffect(() => {
    if (!room || room.status !== 'racing' || isCurrentPlayerHost(room)) {
      // 호스트거나 레이싱이 아니면 보간 불필요
      if (guestAnimationRef.current) {
        cancelAnimationFrame(guestAnimationRef.current);
        guestAnimationRef.current = null;
      }
      return;
    }

    console.log('🎮 게스트 보간 애니메이션 시작');

    // 초기 상태 설정
    setInterpolatedPigs(room.pigs);
    guestStartTimeRef.current = performance.now();

    const interpolate = () => {
      // 게스트 레이스 시간 업데이트
      const elapsed = performance.now() - guestStartTimeRef.current;
      setGuestRaceTime(elapsed);

      setInterpolatedPigs(prev => {
        const targets = targetPigsRef.current;
        if (!targets.length) return prev;

        return prev.map((pig, idx) => {
          const target = targets[idx];
          if (!target) return pig;

          // 이미 완주한 돼지는 그대로
          if (target.finishTime !== null) {
            return target;
          }

          // 부드럽게 목표 위치로 이동 (lerp) - 더 빠르게 따라가도록 조정
          const lerpFactor = 0.12; // 보간 속도
          const newPosition = pig.position + (target.position - pig.position) * lerpFactor;

          return {
            ...target,
            position: newPosition,
          };
        });
      });

      guestAnimationRef.current = requestAnimationFrame(interpolate);
    };

    guestAnimationRef.current = requestAnimationFrame(interpolate);

    return () => {
      if (guestAnimationRef.current) {
        cancelAnimationFrame(guestAnimationRef.current);
        guestAnimationRef.current = null;
      }
    };
  }, [room?.status, room?.roomCode]);

  // 게임 상태 변경 감지
  useEffect(() => {
    console.log('📺 상태 변경 감지:', room?.status);
    if (room?.status === 'countdown' || room?.status === 'racing' || room?.status === 'finished') {
      console.log('📺 → game 화면으로 전환');
      setViewPhase('game');
    } else if (room?.status === 'waiting' || room?.status === 'selecting') {
      console.log('📺 → lobby 화면으로 전환');
      setViewPhase('lobby');
    }
  }, [room?.status]);

  // 게스트: 레이싱 중에는 폴링 간격을 500ms로 줄여서 더 부드럽게
  useEffect(() => {
    if (!room) return;

    const isHost = isCurrentPlayerHost(room);

    if (room.status === 'racing' && !isHost) {
      // 게스트가 레이싱 중이면 빠른 폴링
      console.log('[Guest] 🏃 레이싱 중 - 폴링 간격 500ms로 변경');
      startPolling(room.roomCode, 500);
    } else if (room.status === 'waiting' || room.status === 'selecting') {
      // 로비에서는 3초 폴링
      startPolling(room.roomCode, 3000);
    } else if (room.status === 'finished') {
      // 게임 종료 시 폴링 중지
      stopPolling();
    }
  }, [room?.status, room?.roomCode, startPolling, stopPolling]);

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

  const getStatusEmoji = (status: PigState['status']) => {
    switch (status) {
      case 'turbo': return '🔥';
      case 'superBoost': return '⚡';
      case 'boost': return '💨';
      case 'slip': return '💫';
      case 'tired': return '😴';
      default: return '';
    }
  };

  // ========== 렌더링 ==========

  // 메뉴 화면
  const renderMenu = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🐷</div>
        <h2 className="text-2xl font-bold text-text-primary">멀티플레이어 돼지 레이스</h2>
        <p className="text-text-secondary mt-2">친구들과 함께 레이스를 즐겨보세요!</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setViewPhase('create')}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl transition-all text-lg"
        >
          🏠 방 만들기
        </button>
        <button
          onClick={() => setViewPhase('join')}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all text-lg"
        >
          🚪 방 입장하기
        </button>
      </div>
    </div>
  );

  // 방 생성 화면
  const renderCreate = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-text-primary text-center">🏠 방 만들기</h3>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          내 이름
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary"
          maxLength={10}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          최대 인원 ({maxPlayers}명)
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
            className="w-10 h-10 rounded-lg bg-bg-tertiary hover:bg-bg-primary text-text-primary font-bold"
          >
            -
          </button>
          <div className="flex-1 relative">
            <input
              type="range"
              min="2"
              max="30"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-pink-500
                [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:active:cursor-grabbing
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:hover:bg-pink-400
                [&::-webkit-slider-thumb]:transition-colors
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-pink-500
                [&::-moz-range-thumb]:border-none
                [&::-moz-range-thumb]:cursor-grab
                [&::-moz-range-thumb]:active:cursor-grabbing
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:hover:bg-pink-400"
              style={{
                background: `linear-gradient(to right, #EC4899 0%, #EC4899 ${((maxPlayers - 2) / 28) * 100}%, var(--bg-tertiary) ${((maxPlayers - 2) / 28) * 100}%, var(--bg-tertiary) 100%)`
              }}
            />
          </div>
          <button
            onClick={() => setMaxPlayers(Math.min(30, maxPlayers + 1))}
            className="w-10 h-10 rounded-lg bg-bg-tertiary hover:bg-bg-primary text-text-primary font-bold"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setViewPhase('menu');
            setError(null);
          }}
          className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg"
        >
          뒤로
        </button>
        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-lg disabled:opacity-50"
        >
          {isLoading ? '생성 중...' : '방 만들기'}
        </button>
      </div>
    </div>
  );

  // 방 입장 화면
  const renderJoin = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-text-primary text-center">🚪 방 입장하기</h3>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          내 이름
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary"
          maxLength={10}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          방 코드
        </label>
        <input
          type="text"
          value={roomCodeInput}
          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
          placeholder="6자리 코드 입력"
          className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-center text-2xl tracking-widest font-mono"
          maxLength={6}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setViewPhase('menu');
            setError(null);
          }}
          className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg"
        >
          뒤로
        </button>
        <button
          onClick={handleJoinRoom}
          disabled={isLoading}
          className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold rounded-lg disabled:opacity-50"
        >
          {isLoading ? '입장 중...' : '입장하기'}
        </button>
      </div>
    </div>
  );

  // 로비 화면
  const renderLobby = () => {
    if (!room) return null;

    const currentPlayer = getCurrentPlayer(room);
    const isHost = isCurrentPlayerHost(room);
    const allReady = room.players.every(p => p.isReady || p.id === room.hostId);
    const canStart = isHost && allReady && room.players.length >= 2;

    return (
      <div className="space-y-6">
        {/* 방 코드 */}
        <div className="text-center p-4 bg-bg-tertiary rounded-xl">
          <div className="flex justify-center items-center gap-2 mb-1">
            <p className="text-sm text-text-secondary">방 코드</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {isRefreshing ? '🔄 갱신중...' : '🔄 새로고침'}
            </button>
          </div>
          <p className="text-3xl font-mono font-bold text-accent tracking-widest">
            {room.roomCode}
          </p>
          <div className="mt-2 flex gap-3 justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(room.roomCode);
                alert('코드가 복사되었습니다!');
              }}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              📋 코드 복사
            </button>
            <button
              onClick={() => {
                // HashRouter 기반 URL 생성 (GitHub Pages 등 서브 경로 지원)
                const baseUrl = window.location.href.split('#')[0];
                const url = `${baseUrl}#/game?type=multi&code=${room.roomCode}`;
                navigator.clipboard.writeText(url);
                alert('링크가 복사되었습니다!');
              }}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              🔗 링크 복사 (바로 입장)
            </button>
          </div>
        </div>

        {/* 플레이어 목록 */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">
            참가자 ({room.players.length}/{room.maxPlayers})
          </h4>
          <div className="space-y-2">
            {room.players.map((player) => {
              const isPlayerHost = player.id === room.hostId;
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
                    <span className="font-medium text-text-primary">{player.name}</span>
                    {player.id === getCurrentPlayerId() && (
                      <span className="text-xs text-accent">(나)</span>
                    )}
                  </div>
                  <div>
                    {isPlayerHost ? (
                      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                        방장
                      </span>
                    ) : player.isReady ? (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        준비완료
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
                        대기중
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 돼지 선택 (waiting 또는 selecting 상태일 때) */}
        {(room.status === 'waiting' || room.status === 'selecting') && (
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-2">
              🐷 내 돼지 선택
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {room.pigs.map((pig) => {
                const owner = getPigOwner(room, pig.id);
                const isSelected = currentPlayer?.selectedPig === pig.id;
                const isAvailable = !owner;

                return (
                  <button
                    key={pig.id}
                    onClick={() => isAvailable && handleSelectPig(pig.id)}
                    disabled={!isAvailable && !isSelected}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/20'
                        : isAvailable
                        ? 'border-border hover:border-accent/50 bg-bg-tertiary'
                        : 'border-gray-600 bg-gray-800 opacity-50'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: getPigColor(pig.id) }}
                    />
                    <p className="text-xs text-text-secondary truncate">
                      {owner ? owner.name : `${pig.id + 1}번`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 버튼들 */}
        {(() => {
          // 재경기 대기 상태인지 확인 (모든 플레이어가 돼지를 이미 선택한 상태)
          const isRematchWaiting = room.players.every(p => p.selectedPig !== null);

          return (
            <div className="flex gap-3">
              <button
                onClick={handleLeaveRoom}
                className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg"
              >
                나가기
              </button>
              {isHost ? (
                <button
                  onClick={isRematchWaiting ? handleStartRematch : handleStartGame}
                  disabled={!canStart}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-lg disabled:opacity-50"
                >
                  {room.players.length < 2
                    ? '2명 이상 필요'
                    : !allReady
                    ? '모두 준비 대기'
                    : isRematchWaiting
                    ? '🔄 게임 시작!'
                    : '게임 시작!'}
                </button>
              ) : (
                <button
                  onClick={handleToggleReady}
                  className={`flex-1 py-3 font-bold rounded-lg ${
                    currentPlayer?.isReady
                      ? 'bg-gray-600 text-gray-300'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }`}
                >
                  {currentPlayer?.isReady ? '준비 취소' : '준비 완료'}
                </button>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  // 게임 화면
  const renderGame = () => {
    if (!room) return null;

    const isCountdown = room.status === 'countdown';
    const isRacing = room.status === 'racing';
    const isFinished = room.status === 'finished';
    const isHost = isCurrentPlayerHost(room);

    // 게스트는 보간된 위치 사용, 호스트는 room.pigs 직접 사용
    const displayPigs = (isRacing && !isHost && interpolatedPigs.length > 0)
      ? interpolatedPigs
      : room.pigs;

    // 상태 텍스트 결정 (게스트는 guestRaceTime 사용)
    const displayTime = isHost ? raceTime : guestRaceTime;
    const getStatusText = () => {
      if (isCountdown) return `⏱️ 카운트다운: ${room.countdown}`;
      if (isRacing) return `🏃 레이스 중! (${(displayTime / 1000).toFixed(1)}초)`;
      return '🏁 레이스 종료!';
    };

    return (
      <div className="space-y-4">
        {/* 카운트다운 오버레이 */}
        {isCountdown && room.countdown > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <div className="text-9xl font-bold text-white animate-pulse drop-shadow-lg">
                {room.countdown}
              </div>
              <div className="text-2xl text-white/80 mt-4">
                🐷 레이스 시작까지...
              </div>
            </div>
          </div>
        )}

        {/* 상태 바 */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary">
            {getStatusText()}
          </span>
          <span className="text-text-secondary">
            방 코드: {room.roomCode}
          </span>
        </div>

        {/* 레이스 트랙 */}
        <div
          className="relative bg-gradient-to-b from-green-700 to-green-600 rounded-2xl overflow-hidden border-4 border-green-800"
          style={{ height: `${Math.max(280, displayPigs.length * 60)}px` }}
        >
          {/* 레인 구분선 */}
          {Array.from({ length: displayPigs.length - 1 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute w-full border-t-2 border-dashed border-white/20"
              style={{ top: `${((idx + 1) * 100) / displayPigs.length}%` }}
            />
          ))}

          {/* 출발선 */}
          <div className="absolute left-[5%] top-0 bottom-0 w-1 bg-white" />

          {/* 결승선 */}
          <div className="absolute right-[3%] top-0 bottom-0 w-3 bg-checkered" />

          {/* 돼지들 */}
          {displayPigs.map((pig, idx) => {
            const owner = getPigOwner(room, pig.id);
            const isMyPig = getCurrentPlayer(room)?.selectedPig === pig.id;
            const statusEmoji = getStatusEmoji(pig.status);
            const pigColor = getPigColor(pig.id);

            return (
              <div
                key={pig.id}
                className="absolute flex items-center"
                style={{
                  left: `calc(5% + ${pig.position * 0.9}%)`,
                  top: `${idx * (100 / displayPigs.length) + (50 / displayPigs.length)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative flex flex-col items-center">
                  {/* 상태 효과 */}
                  {statusEmoji && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg animate-bounce">
                      {statusEmoji}
                    </div>
                  )}
                  {/* 이름 */}
                  <div
                    className={`text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-full mb-0.5 ${
                      isMyPig ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: pigColor, color: '#000' }}
                  >
                    {owner?.name || `돼지${pig.id + 1}`}
                    {pig.rank && <span className="ml-1">#{pig.rank}</span>}
                  </div>
                  {/* 돼지 SVG */}
                  <svg
                    width="45"
                    height="35"
                    viewBox="0 0 50 40"
                    className={`drop-shadow-md ${pig.finishTime ? 'scale-110' : ''}`}
                    style={{
                      animation: isRacing && !pig.finishTime ? 'pigRun 0.2s infinite' : 'none',
                    }}
                  >
                    <ellipse cx="25" cy="22" rx="16" ry="12" fill={pigColor} />
                    <ellipse cx="13" cy="12" rx="4" ry="5" fill={pigColor} />
                    <ellipse cx="37" cy="12" rx="4" ry="5" fill={pigColor} />
                    <ellipse cx="13" cy="12" rx="2.5" ry="3" fill={darkenColor(pigColor, 20)} />
                    <ellipse cx="37" cy="12" rx="2.5" ry="3" fill={darkenColor(pigColor, 20)} />
                    <ellipse cx="25" cy="18" rx="9" ry="7" fill={lightenColor(pigColor, 10)} />
                    <ellipse cx="25" cy="20" rx="5" ry="3.5" fill={darkenColor(pigColor, 30)} />
                    <circle cx="22.5" cy="20" r="1.2" fill="#333" />
                    <circle cx="27.5" cy="20" r="1.2" fill="#333" />
                    <circle cx="20" cy="15" r="2.5" fill="white" />
                    <circle cx="30" cy="15" r="2.5" fill="white" />
                    <circle cx="20.5" cy="15" r="1.2" fill="#333" />
                    <circle cx="30.5" cy="15" r="1.2" fill="#333" />
                    <rect x="14" y="31" width="4" height="5" rx="2" fill={darkenColor(pigColor, 20)} />
                    <rect x="21" y="31" width="4" height="5" rx="2" fill={darkenColor(pigColor, 20)} />
                    <rect x="28" y="31" width="4" height="5" rx="2" fill={darkenColor(pigColor, 20)} />
                    <rect x="35" y="31" width="4" height="5" rx="2" fill={darkenColor(pigColor, 20)} />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* 순위 */}
        {isFinished && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-secondary">🏆 최종 순위</h4>
            {[...room.pigs]
              .sort((a, b) => (a.rank || 999) - (b.rank || 999))
              .map((pig) => {
                const owner = getPigOwner(room, pig.id);
                const isMyPig = getCurrentPlayer(room)?.selectedPig === pig.id;
                const pigColor = getPigColor(pig.id);

                return (
                  <div
                    key={pig.id}
                    className={`flex justify-between items-center p-3 rounded-xl ${
                      pig.rank === 1
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500'
                        : isMyPig
                        ? 'bg-accent/10 border border-accent'
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
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: pigColor }}
                      />
                      <span className={pig.rank === 1 ? 'text-yellow-400 font-bold' : 'text-text-primary'}>
                        {owner?.name || `돼지${pig.id + 1}`}
                        {isMyPig && ' (나)'}
                      </span>
                    </div>
                    <span className="text-sm text-text-secondary">
                      {pig.finishTime ? `${(pig.finishTime / 1000).toFixed(2)}초` : '-'}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {/* 버튼 */}
        {isFinished && (
          <div className="space-y-3">
            {!isHost && (
              <p className="text-center text-text-secondary text-sm">
                ⏳ 방장이 재경기를 시작하면 로비로 이동합니다
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleLeaveRoom}
                className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg"
              >
                나가기
              </button>
              {isHost && (
                <button
                  onClick={handlePrepareRematch}
                  disabled={isRestarting}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-lg disabled:opacity-50"
                >
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
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={viewPhase === 'menu' ? onBack : () => {
            if (room) handleLeaveRoom();
            else setViewPhase('menu');
          }}
          className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-text-primary">🐷 멀티플레이어</h2>
          <p className="text-sm text-text-secondary">
            {viewPhase === 'menu' && '친구들과 함께 플레이'}
            {viewPhase === 'create' && '새 방 만들기'}
            {viewPhase === 'join' && '방 입장하기'}
            {viewPhase === 'lobby' && `대기실 (${room?.players.length || 0}명)`}
            {viewPhase === 'game' && '레이스!'}
          </p>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-6">
        {viewPhase === 'menu' && renderMenu()}
        {viewPhase === 'create' && renderCreate()}
        {viewPhase === 'join' && renderJoin()}
        {viewPhase === 'lobby' && renderLobby()}
        {viewPhase === 'game' && renderGame()}
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

export default MultiplayerPigRace;
