import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameRoom, PigState, Player, HostChangedData, KickedData, RaceMode, TeamScoreState, ChatMessage } from '../services/gameApi';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  selectPig,
  selectTeam,
  toggleReady,
  startGame,
  updateGameState,
  kickPlayer,
  getCurrentPlayerId,
  isCurrentPlayerHost,
  getCurrentPlayer,
  subscribeToRoom,
  getRoomState,
  sendHeartbeat,
  sendChatMessage,
  type SSEConnection,
} from '../services/gameApi';

// 돼지 색상 정의 (프론트엔드에서만 사용) - 첫 번째는 원본 색상
const PIG_COLORS = [
  'original', // 원본 (필터 없음)
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
];

// 돼지 색상 가져오기
const getPigColor = (pigId: number): string => {
  return PIG_COLORS[pigId % PIG_COLORS.length];
};

// 배경색용 색상 가져오기 (original일 경우 회색 반환)
const getPigBgColor = (pigId: number): string => {
  const color = PIG_COLORS[pigId % PIG_COLORS.length];
  return color === 'original' ? '#9CA3AF' : color; // 원본이면 회색
};

// HEX to HSL 변환 (그레이스케일 이미지에 색상을 입히기 위해)
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 100, l: 50 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
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

// 그레이스케일 이미지에 색상을 입히는 CSS filter 생성
const getColorFilter = (color: string): string => {
  // 원본 색상이면 필터 없음
  if (color === 'original') {
    return 'none';
  }

  const { h, s, l } = hexToHsl(color);

  // 흰색 계열 (밝기 90% 이상, 채도 10% 이하)
  if (l > 90 && s < 10) {
    return 'brightness(2) contrast(0.8)';
  }

  // 회색 계열 (채도 10% 이하)
  if (s < 10) {
    const grayBrightness = 0.5 + (l / 100);
    return `brightness(${grayBrightness}) contrast(1.1)`;
  }

  // grayscale → sepia로 기본 색조 부여 → hue-rotate로 원하는 색상으로 회전 → saturate로 채도 조절
  // brightness로 명도 조절
  const brightness = l > 50 ? 1 + (l - 50) / 100 : 0.8 + (l / 250);
  const saturate = s / 50;
  return `sepia(1) hue-rotate(${h - 50}deg) saturate(${saturate}) brightness(${brightness})`;
};

// 돼지 소유자 찾기 (Player.selectedPig 기반)
const getPigOwner = (room: GameRoom, pigId: number): Player | undefined => {
  return room.players.find(p => p.selectedPig === pigId);
};

interface MultiplayerPigRaceProps {
  onBack: () => void;
  initialMode?: 'menu' | 'room' | 'input' | null;
  initialRoomCode?: string | null;
  onGoToRelay?: () => void; // 릴레이 방 만들기로 이동
  onJoinRelayRoom?: (roomCode: string, playerName: string) => void; // 릴레이 방 입장으로 이동
}

type ViewPhase = 'menu' | 'create' | 'join' | 'lobby' | 'game';

const MultiplayerPigRace = ({ onBack, initialMode, initialRoomCode, onGoToRelay, onJoinRelayRoom }: MultiplayerPigRaceProps) => {
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
  const [raceMode, setRaceMode] = useState<RaceMode>('individual'); // 개인전/팀전 (방 생성 시 선택용)
  const [showPasswordModal, setShowPasswordModal] = useState(false); // 비밀번호 입력 모달
  const [passwordInput, setPasswordInput] = useState(''); // 비밀번호 입력값
  const [passwordError, setPasswordError] = useState(''); // 비밀번호 오류
  const [pendingAction, setPendingAction] = useState<'create' | 'relay' | null>(null); // 비밀번호 확인 후 실행할 액션
  const [currentRaceMode, setCurrentRaceMode] = useState<RaceMode | null>(null); // 현재 방의 실제 레이스 모드 (서버가 반환 안 할 경우 대비)

  // 게임 상태
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // SSE & 애니메이션
  const sseConnectionRef = useRef<SSEConnection | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [raceTime, setRaceTime] = useState(0);
  const [retireCountdown, setRetireCountdown] = useState<number | null>(null); // 1등 골인 후 남은 시간 (초)

  // 게임 결과 스냅샷 (플레이어 퇴장 시에도 결과 유지용)
  interface ResultSnapshot {
    pigs: PigState[];
    players: Player[];
    teamScore: TeamScoreState | null;
    raceMode: RaceMode;
  }
  const [resultSnapshot, setResultSnapshot] = useState<ResultSnapshot | null>(null);

  // 채팅 상태
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true); // 기본 열림
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 호스트가 레이싱 중인지 추적하는 ref (SSE 업데이트 무시용)
  const isHostRacingRef = useRef(false);

  // 방장 인계 트리거 (게임 중 방장이 바뀌면 새 방장이 게임 루프 시작)
  const [hostTakeoverTrigger, setHostTakeoverTrigger] = useState(0);

  // 폴링 인터벌 ref
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // BGM ref
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // SSE 연결 정리
  const stopConnection = useCallback(() => {
    if (sseConnectionRef.current) {
      sseConnectionRef.current.close();
      sseConnectionRef.current = null;
    }
  }, []);

  // 폴링 정리
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 하트비트 정리
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // SSE 연결 시작
  const startSSE = useCallback((roomCode: string) => {
    // 기존 연결 정리
    if (sseConnectionRef.current) {
      sseConnectionRef.current.close();
    }

    const connection = subscribeToRoom(
      roomCode,
      (updatedRoom) => {
        // 일반 update 이벤트에서도 hostId 변경 감지 (host_changed 이벤트 대신 update로 올 수 있음)
        setRoom(prevRoom => {
          if (prevRoom && prevRoom.hostId !== updatedRoom.hostId) {
            const myPlayerId = getCurrentPlayerId();

            // 내가 새 방장이 되었고, 게임 중이면 게임 루프 인계
            if (updatedRoom.hostId === myPlayerId) {
              if (updatedRoom.status === 'countdown' || updatedRoom.status === 'racing') {
                // setTimeout으로 state 업데이트 후 트리거
                setTimeout(() => setHostTakeoverTrigger(prev => prev + 1), 0);
              }
            }
          }

          // 게임이 종료되면 결과 스냅샷 저장 (게스트용 - SSE로 finished 받았을 때)
          if (updatedRoom.status === 'finished' && prevRoom?.status !== 'finished') {
            const effectiveRaceMode = updatedRoom.raceMode || currentRaceMode || 'individual';
            const pigs = updatedRoom.pigs as PigState[];
            const teamScore = effectiveRaceMode === 'team' ? calculateTeamScore(pigs, updatedRoom.players) : null;
            setResultSnapshot({
              pigs: [...pigs],
              players: [...updatedRoom.players],
              teamScore,
              raceMode: effectiveRaceMode,
            });
          }

          return updatedRoom;
        });

        // 호스트가 레이싱 중이면 돼지 위치 업데이트만 무시 (로컬 애니메이션 우선)
        // 단, 레이싱 중에도 status가 finished로 바뀌면 받아야 함
        if (isHostRacingRef.current && updatedRoom.status === 'racing') {
          return;
        }
      },
      () => {
        // 에러 처리
      },
      // host_changed 이벤트 처리 (게임 중 방장 변경)
      (hostChangedData: HostChangedData) => {
        const myPlayerId = getCurrentPlayerId();

        // 먼저 room 상태 업데이트 (hostId가 변경됨)
        setRoom(hostChangedData.room);

        // 내가 새 방장인지 확인
        if (hostChangedData.newHostId === myPlayerId) {
          // 게임 중이면 트리거를 통해 useEffect 강제 실행
          if (hostChangedData.room.status === 'countdown' || hostChangedData.room.status === 'racing') {
            // 트리거 값을 변경하여 useEffect 강제 재실행
            setHostTakeoverTrigger(prev => prev + 1);
          }
        }
      },
      // kicked 이벤트 처리 (플레이어 강퇴)
      // 서버는 강퇴당한 플레이어에게만 kicked 이벤트를 보냄
      (kickedData: KickedData) => {
        // kicked 이벤트를 받으면 무조건 자신이 강퇴당한 것
        alert(kickedData.message || '방장에 의해 강퇴되었습니다.');
        // 연결 종료하고 메뉴로 이동
        stopConnection();
        stopPolling();
        stopHeartbeat();
        setRoom(null);
        setViewPhase('menu');
      },
      // chat 이벤트 처리 (채팅 메시지)
      (chatMessage: ChatMessage) => {
        setChatMessages(prev => {
          const newMessages = [...prev, chatMessage];
          // 최대 100개 유지
          if (newMessages.length > 100) {
            return newMessages.slice(-100);
          }
          return newMessages;
        });
      }
    );

    sseConnectionRef.current = connection;
  }, [stopConnection, stopPolling, stopHeartbeat, currentRaceMode]);

  // 폴링 시작 (SSE 폴백용)
  // 게스트는 레이싱 중에도 폴링해서 돼지 위치 업데이트 받음
  const startPolling = useCallback((roomCode: string, interval: number = 5000) => {
    // 기존 폴링 정리
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      // 호스트가 레이싱 중이면 폴링 안 함 (로컬 애니메이션 사용)
      if (isHostRacingRef.current) {
        return;
      }

      const response = await getRoomState(roomCode);

      if (response.success && response.data) {
        // 강퇴 감지: 내가 플레이어 목록에 없으면 강퇴된 것
        const myPlayerId = getCurrentPlayerId();
        const meInRoom = response.data.players.find(p => p.id === myPlayerId);
        if (!meInRoom) {
          alert('방장에 의해 강퇴되었습니다.');
          stopConnection();
          stopPolling();
          stopHeartbeat();
          setRoom(null);
          setViewPhase('menu');
          return;
        }

        setRoom(prev => {
          // 호스트가 레이싱 중이면 업데이트하지 않음
          if (isHostRacingRef.current && response.data!.status === 'racing') {
            return prev;
          }
          return response.data!;
        });
      } else {
        // 방을 찾을 수 없는 경우 (방이 삭제되었거나 서버 오류)
        stopConnection();
        stopPolling();
        stopHeartbeat();
        setRoom(null);
        // onBack을 호출하여 URL 파라미터도 정리하고 메뉴로 이동
        onBack();
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

  // 정리
  useEffect(() => {
    return () => {
      stopConnection();
      stopPolling();
      stopHeartbeat();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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

  // URL 방 코드는 입력 필드에만 자동 설정되며, 입장은 버튼 클릭 시에만 수행
  // (자동 입장 제거 - 사용자가 직접 입장하기 버튼을 눌러야 함)

  // 방 생성
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    const response = await createRoom(playerName.trim(), maxPlayers, 'normal', raceMode);

    if (response.success && response.data) {
      // 서버가 raceMode를 반환하지 않는 경우를 대비해 생성 시 설정한 값 저장
      setCurrentRaceMode(response.data.raceMode || raceMode);
      setRoom(response.data);
      setViewPhase('lobby');
      startSSE(response.data.roomCode);
      startPolling(response.data.roomCode); // SSE 폴백용 폴링 시작
      startHeartbeat(response.data.roomCode); // 하트비트 시작
    } else {
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

    const response = await joinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim());

    if (response.success && response.data) {
      // 릴레이 방이면 릴레이 페이지로 이동
      if (response.data.gameMode === 'relay' && onJoinRelayRoom) {
        setIsLoading(false);
        onJoinRelayRoom(response.data.roomCode, playerName.trim());
        return;
      }

      // 서버가 raceMode를 반환하지 않으면, 방에 팀이 설정된 플레이어가 있는지 확인하여 팀전 감지
      const detectedRaceMode = response.data.raceMode ||
        (response.data.players.some(p => p.team !== null) ? 'team' : 'individual');
      setCurrentRaceMode(detectedRaceMode);
      setRoom(response.data);
      setViewPhase('lobby');
      startSSE(response.data.roomCode);
      startPolling(response.data.roomCode); // SSE 폴백용 폴링 시작
      startHeartbeat(response.data.roomCode); // 하트비트 시작
    } else {
      setError(response.error || '방 입장에 실패했습니다');
    }

    setIsLoading(false);
  };

  // 방 나가기
  const handleLeaveRoom = async () => {
    if (!room) return;

    stopConnection();
    stopPolling();
    stopHeartbeat();
    await leaveRoom(room.roomCode);
    setRoom(null);
    setCurrentRaceMode(null);
    setViewPhase('menu');
  };

  // 수동 새로고침
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (!room || isRefreshing) return;

    setIsRefreshing(true);

    const response = await getRoomState(room.roomCode);
    if (response.success && response.data) {
      setRoom(response.data);
    }

    setIsRefreshing(false);
  };

  // 재경기 준비 모드로 전환 - 호스트만
  const [isRestarting, setIsRestarting] = useState(false);
  const handlePrepareRematch = async () => {
    if (!room || !isCurrentPlayerHost(room) || isRestarting) return;

    setIsRestarting(true);

    // 돼지 위치 초기화 (선택도 초기화하여 새로 선택 가능)
    const resetPigs = room.pigs.map(pig => ({
      ...pig,
      position: 0,
      speed: 0,
      status: 'normal' as const,
      finishTime: null,
      rank: null,
    }));

    // 서버에 상태 리셋 요청 - waiting 상태로 변경하여 준비 시스템 활성화
    // 플레이어들의 selectedPig과 isReady도 서버에서 초기화됨
    const response = await updateGameState(room.roomCode, {
      status: 'waiting',
      countdown: 3,
      raceStartTime: null,
      raceEndTime: null,
      pigs: resetPigs,
      // 재경기 시 플레이어 선택/준비 초기화 플래그
      resetPlayers: true,
    });

    if (response.success && response.data) {
      setRoom(response.data);
      setRaceTime(0);
      setGuestRaceTime(0);
    } else {
      alert('재경기 준비에 실패했습니다.');
    }

    setIsRestarting(false);
  };

  // 재경기 시작 - 모두 준비되면 호스트가 시작
  const handleStartRematch = async () => {
    if (!room || !isCurrentPlayerHost(room) || isRestarting) return;

    setIsRestarting(true);

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
      setRoom(response.data);
      setRaceTime(0);
      setGuestRaceTime(0);
    } else {
      alert('재경기 시작에 실패했습니다.');
    }

    setIsRestarting(false);
  };

  // 채팅 메시지 전송
  const handleSendChat = async () => {
    if (!room || !chatInput.trim()) return;

    const response = await sendChatMessage(room.roomCode, chatInput.trim());
    if (response.success) {
      setChatInput('');
    }
  };

  // 채팅 스크롤 자동 하단 이동 (메시지 추가, 화면 전환, 채팅창 열릴 때)
  useEffect(() => {
    // 화면 전환 시 DOM이 완전히 렌더링된 후 스크롤하도록 여러 번 시도
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    };

    // 즉시 한 번 시도
    scrollToBottom();

    // requestAnimationFrame으로 다음 프레임에서 시도
    const rafId = requestAnimationFrame(() => {
      scrollToBottom();
    });

    // 화면 전환 시 DOM 마운트 지연을 위해 추가 딜레이
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [chatMessages, viewPhase, isChatOpen, room?.status]);

  // 방 나갈 때 채팅 초기화
  useEffect(() => {
    if (!room) {
      setChatMessages([]);
    }
  }, [room]);

  // 돼지 선택 (서버에서 토글 처리 - 같은 돼지 클릭하면 서버가 자동 해제)
  const handleSelectPig = async (pigId: number) => {
    // waiting 또는 selecting 상태에서만 돼지 선택 가능
    if (!room || (room.status !== 'waiting' && room.status !== 'selecting')) return;

    // 서버가 토글 로직 처리: 같은 돼지 선택 시 자동으로 selectedPig: null로 변경
    const response = await selectPig(room.roomCode, pigId);
    if (response.success && response.data) {
      setRoom(response.data);
    }
  };

  // 준비 완료
  const handleToggleReady = async () => {
    if (!room) return;

    // 모바일 오디오 unlock (게스트도 준비 버튼 클릭 시 unlock)
    if (!bgmRef.current) {
      bgmRef.current = new Audio(`${import.meta.env.BASE_URL}bgm.mp3`);
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.2;
    }
    bgmRef.current.play().then(() => {
      bgmRef.current?.pause();
      if (bgmRef.current) bgmRef.current.currentTime = 0;
    }).catch(() => {});

    const response = await toggleReady(room.roomCode);
    if (response.success && response.data) {
      setRoom(response.data);
    } else {
      alert(`준비 완료 실패: ${response.error || '알 수 없는 오류'}`);
    }
  };

  // 게임 시작 (호스트만)
  const handleStartGame = async () => {
    if (!room || !isCurrentPlayerHost(room)) {
      return;
    }

    // 모바일 오디오 unlock (사용자 상호작용 시점에 미리 준비)
    if (!bgmRef.current) {
      bgmRef.current = new Audio(`${import.meta.env.BASE_URL}bgm.mp3`);
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.1;
    }
    // 무음으로 한 번 재생하여 unlock
    bgmRef.current.play().then(() => {
      bgmRef.current?.pause();
      if (bgmRef.current) bgmRef.current.currentTime = 0;
    }).catch(() => {});

    const response = await startGame(room.roomCode);

    if (response.success && response.data) {
      setRoom(response.data);
      setViewPhase('game');
    } else {
      alert(`게임 시작 실패: ${response.error || '알 수 없는 오류'}`);
    }
  };

  // 호스트: 레이스 애니메이션 실행
  // 상태 지속시간을 로컬로 관리 (서버에는 전송 안함)
  const statusDurationRef = useRef<Map<number, number>>(new Map());

  // 카운트다운 처리 (호스트만)
  // room?.hostId 의존성 추가: 게임 중 방장이 변경되면 새 방장이 카운트다운 루프를 이어받음
  useEffect(() => {
    if (!room || room.status !== 'countdown' || !isCurrentPlayerHost(room)) return;

    const roomCode = room.roomCode;

    const countdownInterval = setInterval(async () => {
      setRoom(prev => {
        if (!prev || prev.status !== 'countdown') return prev;

        const newCountdown = prev.countdown - 1;

        if (newCountdown <= 0) {
          // 카운트다운 종료 → racing 상태로 전환
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
    // hostTakeoverTrigger: 게임 중 방장이 바뀌면 새 방장이 카운트다운 루프 인계
  }, [room?.status, room?.roomCode, room?.hostId, hostTakeoverTrigger]);

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
    if (!room || room.status !== 'racing' || !isCurrentPlayerHost(room)) {
      return;
    }

    // 호스트 레이싱 플래그 설정 (SSE 업데이트 무시)
    isHostRacingRef.current = true;

    // 선택된 돼지 ID들 (게임 종료 조건에 사용)
    const selectedPigIds = new Set(
      room.players.map(p => p.selectedPig).filter((id): id is number => id !== null)
    );

    const RACE_DURATION = 10000; // 2배속
    const FPS = 60;
    const FRAME_TIME = 1000 / FPS;
    // 리타이어 기준은 서버에서 받은 값 사용 (기본값: 10초)
    const RETIRE_TIMEOUT = room.retireThreshold || 10000;
    let lastFrameTime = 0;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 500; // 500ms마다 서버 업데이트 (SSE로 게스트에게 전파)
    let isAnimating = true;
    let firstPlaceFinishTime: number | null = null; // 1등 골인 시간 추적

    // 방장 인계 시: 서버의 raceStartTime 기준으로 경과 시간 계산
    // 새로 시작하는 경우: 현재 시간 기준
    const serverElapsed = room.raceStartTime ? Date.now() - room.raceStartTime : 0;
    const isHostTakeover = serverElapsed > 500; // 500ms 이상 경과했으면 인계로 판단

    if (isHostTakeover) {
      // 인계 시: 서버 경과 시간을 기준으로 startTimeRef 설정
      startTimeRef.current = performance.now() - serverElapsed;
      // 서버에서 받은 돼지 위치 유지
      pigsRef.current = [...room.pigs];
    } else {
      startTimeRef.current = performance.now();
      // 초기 돼지 상태 설정
      pigsRef.current = [...room.pigs];
    }

    // 상태 지속시간 초기화 (인계 시에도 리셋 - 상태 효과는 새로 적용)
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
        case 'stumble': return -0.8; // 뒤로 후진! (음수 = 역방향)
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
          } else if (rand < 0.30) {
            newStatus = 'stumble'; // 비틀거림 - 뒤로 후진!
            duration = 15; // 짧은 지속시간
          }
        }

        statusDurationRef.current.set(pig.id, duration);

        const statusMultiplier = getStatusSpeedMultiplier(newStatus);
        const randomVariation = 0.85 + Math.random() * 0.3;
        const speed = baseSpeed * statusMultiplier * randomVariation;

        // 위치 계산: 음수 속도(stumble)일 때 뒤로 이동, 0 미만은 0으로 제한
        const newPosition = Math.max(0, Math.min(100, pig.position + speed));

        if (newPosition >= 100 && pig.finishTime === null) {
          // 선택된 돼지들 중에서만 순위 계산 (관전자 돼지 제외)
          const finishedSelectedCount = currentPigs.filter(
            p => p.finishTime !== null && selectedPigIds.has(p.id)
          ).length;
          // 선택되지 않은 돼지는 순위 없음 (null)
          const rank = selectedPigIds.has(pig.id) ? finishedSelectedCount + 1 : null;

          // 1등 골인 시간 기록 및 서버 전송
          if (rank === 1) {
            firstPlaceFinishTime = elapsed;
            const firstPlaceTime = Date.now();
            // 서버에서 받은 리타이어 기준으로 카운트다운 시작
            setRetireCountdown(Math.ceil(RETIRE_TIMEOUT / 1000));
            // 로컬 상태에도 firstPlaceFinishTime 업데이트 (UI 표시용)
            setRoom(prev => prev ? { ...prev, firstPlaceFinishTime: firstPlaceTime } : null);
            // 서버에 1등 골인 시간 즉시 전송 (게스트들이 카운트다운 표시할 수 있도록)
            updateGameState(roomCodeRef.current, {
              firstPlaceFinishTime: firstPlaceTime,
            });
          }

          return {
            ...pig,
            position: 100,
            speed: 0,
            finishTime: elapsed,
            rank,
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

      // 1등 골인 후 카운트다운 업데이트 (초 단위)
      if (firstPlaceFinishTime !== null) {
        const remainingMs = RETIRE_TIMEOUT - (elapsed - firstPlaceFinishTime);
        const remainingSec = Math.ceil(remainingMs / 1000);
        setRetireCountdown(remainingSec > 0 ? remainingSec : 0);
      }

      // 1등 골인 후 리타이어 기준 시간 경과 체크 - 미완주자 리타이어 처리
      if (firstPlaceFinishTime !== null && elapsed - firstPlaceFinishTime >= RETIRE_TIMEOUT) {
        // 아직 완주하지 못한 돼지들을 리타이어 처리 (rank: null 유지, finishTime만 설정)
        const finalPigs = updatedPigs.map(pig => {
          if (pig.finishTime === null && selectedPigIds.has(pig.id)) {
            return {
              ...pig,
              finishTime: elapsed, // 현재 시간으로 기록 (리타이어 시간)
              rank: null, // rank는 null로 유지 (리타이어 표시용)
              status: 'normal' as const,
            };
          }
          return pig;
        });

        pigsRef.current = finalPigs;
        isAnimating = false;
        isHostRacingRef.current = false;

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }

        // 서버에 최종 상태 전송
        await updateGameState(roomCodeRef.current, {
          status: 'finished',
          pigs: finalPigs,
          raceEndTime: Date.now(),
        });

        setRoom(prev => {
          if (!prev) return null;
          const newRoom = {
            ...prev,
            status: 'finished' as const,
            pigs: finalPigs,
            raceEndTime: Date.now()
          };
          // 결과 스냅샷 저장 (플레이어 퇴장해도 결과 유지)
          const effectiveRaceMode = prev.raceMode || currentRaceMode || 'individual';
          const teamScore = effectiveRaceMode === 'team' ? calculateTeamScore(finalPigs, prev.players) : null;
          setResultSnapshot({
            pigs: [...finalPigs],
            players: [...prev.players],
            teamScore,
            raceMode: effectiveRaceMode,
          });
          return newRoom;
        });
        setRetireCountdown(null); // 카운트다운 초기화
        return;
      }

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
          isAnimating = false;
          isHostRacingRef.current = false; // 레이스 종료 - SSE 다시 받기

          // 애니메이션 정리
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }

          // 로컬 상태를 finished로 확실히 업데이트
          setRoom(prev => {
            if (!prev) return null;
            const newRoom = {
              ...prev,
              status: 'finished' as const,
              pigs: updatedPigs,
              raceEndTime: Date.now()
            };
            // 결과 스냅샷 저장 (플레이어 퇴장해도 결과 유지)
            const effectiveRaceMode = prev.raceMode || currentRaceMode || 'individual';
            const teamScore = effectiveRaceMode === 'team' ? calculateTeamScore(updatedPigs, prev.players) : null;
            setResultSnapshot({
              pigs: [...updatedPigs],
              players: [...prev.players],
              teamScore,
              raceMode: effectiveRaceMode,
            });
            return newRoom;
          });
          setRetireCountdown(null); // 카운트다운 초기화
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
    // hostTakeoverTrigger: 게임 중 방장이 바뀌면 새 방장이 레이스 루프 인계
    // currentRaceMode: 스냅샷 저장 시 필요
  }, [room?.status, room?.roomCode, room?.hostId, hostTakeoverTrigger, currentRaceMode]);

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

    // 초기 상태 설정
    setInterpolatedPigs(room.pigs);
    guestStartTimeRef.current = performance.now();

    // 리타이어 기준은 서버에서 받은 값 사용 (기본값: 10초)
    const RETIRE_TIMEOUT = room.retireThreshold || 10000;

    const interpolate = () => {
      // 게스트 레이스 시간 업데이트
      const elapsed = performance.now() - guestStartTimeRef.current;
      setGuestRaceTime(elapsed);

      // 게스트용 리타이어 카운트다운 (서버에서 받은 firstPlaceFinishTime 및 retireThreshold 기반)
      if (room.firstPlaceFinishTime) {
        const now = Date.now();
        const elapsedSinceFirst = now - room.firstPlaceFinishTime;
        const remainingSec = Math.ceil((RETIRE_TIMEOUT - elapsedSinceFirst) / 1000);
        setRetireCountdown(remainingSec > 0 ? remainingSec : 0);
      }

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
  }, [room?.status, room?.roomCode, room?.firstPlaceFinishTime]);

  // 게임 상태 변경 감지
  useEffect(() => {
    if (room?.status === 'countdown' || room?.status === 'racing' || room?.status === 'finished') {
      setViewPhase('game');
    } else if (room?.status === 'waiting' || room?.status === 'selecting') {
      setViewPhase('lobby');
    }
  }, [room?.status]);

  // BGM 페이드아웃 ref (cleanup용)
  const fadeIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // BGM 페이드아웃 함수
  const fadeOutBgm = (duration: number = 1500) => {
    if (!bgmRef.current) return;
    // 이미 페이드아웃 중이면 무시
    if (fadeIntervalRef.current) return;

    const audio = bgmRef.current;
    const startVolume = audio.volume;
    const steps = 30;
    const stepTime = duration / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, startVolume - volumeStep * currentStep);
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.2; // 다음 재생을 위해 볼륨 복원
      }
    }, stepTime);
  };

  // BGM 재생/정지
  useEffect(() => {
    if (room?.status === 'racing') {
      // 페이드아웃 중이면 취소
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      // 레이스 시작 시 BGM 재생
      if (!bgmRef.current) {
        bgmRef.current = new Audio(`${import.meta.env.BASE_URL}bgm.mp3`);
        bgmRef.current.loop = true;
      }
      bgmRef.current.volume = 0.2;
      bgmRef.current.currentTime = 0;
      bgmRef.current.play().catch(() => {
        // 자동 재생 실패 시 무시 (브라우저 정책)
      });
    } else if (room?.status === 'finished') {
      // 레이스 종료 시 BGM 페이드아웃
      fadeOutBgm(1500);
    }
  }, [room?.status]);

  // 컴포넌트 언마운트 시 BGM 정리
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
      }
    };
  }, []);

  // 상태에 따른 폴링 관리
  useEffect(() => {
    if (!room) return;

    const isHost = isCurrentPlayerHost(room);

    if (room.status === 'racing' && !isHost) {
      // 게스트가 레이싱 중이면 빠른 폴링
      startPolling(room.roomCode, 500);
    } else if (room.status === 'waiting' || room.status === 'selecting') {
      // 로비에서는 5초 폴링 (호스트/게스트 모두)
      startPolling(room.roomCode, 5000);
    } else if (room.status === 'finished') {
      // 게임 종료 후에도 폴링 유지 (재경기 대기 감지용)
      startPolling(room.roomCode, 1000); // 1초로 줄여서 빠른 감지
    } else if (room.status === 'countdown') {
      // 카운트다운 중에도 폴링 유지
      startPolling(room.roomCode, 500);
    }
  }, [room?.status, room?.roomCode, startPolling, stopPolling]);

  const getStatusEmoji = (status: PigState['status']) => {
    switch (status) {
      case 'turbo': return '🔥';
      case 'superBoost': return '⚡';
      case 'boost': return '💨';
      case 'slip': return '💫';
      case 'tired': return '😴';
      case 'stumble': return '🔙'; // 비틀거림 - 뒤로 후진!
      default: return '';
    }
  };

  // 팀전 점수 계산 (등수별 점수: 1등=10, 2등=8, 3등=6, 4등=5, 5등=4, 6등=3, 7등=2, 8등이하=1)
  // 동점 시 타이브레이커: 1등 보유팀이 승리
  const calculateTeamScore = (pigs: PigState[], players: Player[]): TeamScoreState => {
    const rankPoints: Record<number, number> = {
      1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2
    };

    let teamAScore = 0;
    let teamBScore = 0;
    let firstPlaceTeam: 'A' | 'B' | null = null;

    pigs.forEach(pig => {
      if (pig.rank === null) return; // 완주하지 않은 돼지는 제외

      const owner = players.find(p => p.selectedPig === pig.id);
      if (!owner || !owner.team) return; // 팀이 없으면 제외

      const points = rankPoints[pig.rank] || 1; // 8등 이하는 1점

      // 1등 보유팀 추적 (타이브레이커용)
      if (pig.rank === 1) {
        firstPlaceTeam = owner.team;
      }

      if (owner.team === 'A') {
        teamAScore += points;
      } else {
        teamBScore += points;
      }
    });

    return { teamA: teamAScore, teamB: teamBScore, firstPlaceTeam };
  };

  // ========== 렌더링 ==========

  // 메뉴 화면
  const renderMenu = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4">
          <img src={`${import.meta.env.BASE_URL}ho.svg`} alt="천호" className="w-20 h-20 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">천호 레이스</h2>
        <p className="text-text-secondary mt-2">친구들과 함께 레이스를 즐겨보세요!</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => {
            setShowPasswordModal(true);
            setPasswordInput('');
            setPasswordError('');
            setPendingAction('create');
          }}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl transition-all text-lg"
        >
          🏠 방 만들기
        </button>
        {onGoToRelay && (
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordInput('');
              setPasswordError('');
              setPendingAction('relay');
            }}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all text-lg"
          >
            🏃 릴레이 방 만들기
          </button>
        )}
        <button
          onClick={() => setViewPhase('join')}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all text-lg"
        >
          🚪 방 입장하기
        </button>
      </div>

      {/* 비밀번호 입력 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary rounded-2xl p-6 max-w-sm w-full space-y-4 border border-border">
            <h3 className="text-xl font-bold text-text-primary text-center">🔒 비밀번호 입력</h3>
            <p className="text-sm text-text-secondary text-center">방을 만들려면 비밀번호를 입력하세요</p>

            {passwordError && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm text-center">
                {passwordError}
              </div>
            )}

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (passwordInput === '5882') {
                    setShowPasswordModal(false);
                    if (pendingAction === 'relay' && onGoToRelay) {
                      onGoToRelay();
                    } else {
                      setViewPhase('create');
                    }
                    setPendingAction(null);
                  } else {
                    setPasswordError('비밀번호가 올바르지 않습니다');
                  }
                }
              }}
              placeholder="비밀번호 4자리"
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-center text-xl tracking-widest"
              maxLength={10}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingAction(null);
                }}
                className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-primary text-text-primary font-medium rounded-lg"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (passwordInput === '5882') {
                    setShowPasswordModal(false);
                    if (pendingAction === 'relay' && onGoToRelay) {
                      onGoToRelay();
                    } else {
                      setViewPhase('create');
                    }
                    setPendingAction(null);
                  } else {
                    setPasswordError('비밀번호가 올바르지 않습니다');
                  }
                }}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-lg"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스킬 설명 */}
      <div className="mt-6 p-4 bg-bg-tertiary rounded-xl border border-border">
        <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
          <span>⚡</span> 레이스 스킬
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg">
            <span className="text-lg">🔥</span>
            <div>
              <div className="font-bold text-orange-400">터보</div>
              <div className="text-text-secondary">4배속 질주</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg">
            <span className="text-lg">⚡</span>
            <div>
              <div className="font-bold text-yellow-400">슈퍼부스트</div>
              <div className="text-text-secondary">2.5배속 가속</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg">
            <span className="text-lg">💨</span>
            <div>
              <div className="font-bold text-cyan-400">부스트</div>
              <div className="text-text-secondary">1.8배속 가속</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg">
            <span className="text-lg">😴</span>
            <div>
              <div className="font-bold text-purple-400">피로</div>
              <div className="text-text-secondary">0.2배속 감속</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg">
            <span className="text-lg">💫</span>
            <div>
              <div className="font-bold text-pink-400">미끄러짐</div>
              <div className="text-text-secondary">거의 멈춤 (0.05배속)</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-bg-secondary rounded-lg">
            <span className="text-lg">🔙</span>
            <div>
              <div className="font-bold text-red-400">비틀거림</div>
              <div className="text-text-secondary">뒤로 후진!</div>
            </div>
          </div>
        </div>
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
          placeholder="꼭 디스코드 닉네임을 포함한 닉네임으로 입장해주세요"
          className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm"
          maxLength={10}
        />
      </div>

      {/* 레이스 모드 선택 */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          레이스 모드
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setRaceMode('individual')}
            className={`p-4 rounded-xl border-2 transition-all ${
              raceMode === 'individual'
                ? 'border-pink-500 bg-pink-500/20'
                : 'border-border hover:border-pink-500/50 bg-bg-tertiary'
            }`}
          >
            <div className="text-2xl mb-1">🏃</div>
            <div className="font-bold text-text-primary">개인전</div>
            <div className="text-xs text-text-secondary">각자의 순위 경쟁</div>
          </button>
          <button
            onClick={() => setRaceMode('team')}
            className={`p-4 rounded-xl border-2 transition-all ${
              raceMode === 'team'
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-border hover:border-blue-500/50 bg-bg-tertiary'
            }`}
          >
            <div className="text-2xl mb-1">👥</div>
            <div className="font-bold text-text-primary">팀전</div>
            <div className="text-xs text-text-secondary">A팀 vs B팀 점수 대결</div>
          </button>
        </div>
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
          placeholder="꼭 디스코드 닉네임을 포함한 닉네임으로 입장해주세요"
          className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm"
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

  // 팀 선택 핸들러
  const handleSelectTeam = async (team: 'A' | 'B') => {
    if (!room) return;

    const response = await selectTeam(room.roomCode, team);
    if (response.success && response.data) {
      setRoom(response.data);
    }
  };

  // 로비 화면
  const renderLobby = () => {
    if (!room) return null;

    const currentPlayer = getCurrentPlayer(room);
    const isHost = isCurrentPlayerHost(room);
    // 서버가 raceMode를 반환하지 않는 경우 currentRaceMode 사용
    const isTeamMode = (room.raceMode || currentRaceMode) === 'team';

    // 참가자: 돼지를 선택한 플레이어 (방장 포함)
    // 관전자: 돼지를 선택하지 않은 플레이어
    const participants = room.players.filter(p => p.selectedPig !== null);
    const spectators = room.players.filter(p => p.selectedPig === null);

    // 팀전일 경우 팀별 분류 (관전자 제외)
    const teamAPlayers = room.players.filter(p => p.team === 'A' && p.selectedPig !== null);
    const teamBPlayers = room.players.filter(p => p.team === 'B' && p.selectedPig !== null);
    const noTeamPlayers = room.players.filter(p => p.team === null && p.selectedPig !== null);
    const spectatorPlayers = room.players.filter(p => p.selectedPig === null);

    // 방장을 제외한 모든 플레이어가 준비 완료해야 함
    const allReady = room.players.every(p => p.isReady || p.id === room.hostId);
    // 돼지를 선택한 참가자가 2명 이상이어야 게임 시작 가능 (방장도 관전 가능)
    const hasEnoughParticipants = participants.length >= 2;
    // 팀전일 경우: 양 팀에 각각 1명 이상 있어야 하고, 팀 인원수가 동일해야 함 (관전자 제외)
    const teamAParticipants = teamAPlayers.filter(p => p.selectedPig !== null);
    const teamBParticipants = teamBPlayers.filter(p => p.selectedPig !== null);
    const hasValidTeams = !isTeamMode || (
      teamAParticipants.length >= 1 &&
      teamBParticipants.length >= 1 &&
      teamAParticipants.length === teamBParticipants.length
    );
    const teamsBalanced = !isTeamMode || teamAParticipants.length === teamBParticipants.length;
    const canStart = isHost && allReady && hasEnoughParticipants && hasValidTeams;

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

        {/* 팀전 모드 표시 및 팀 선택 */}
        {isTeamMode && (
          <div className={`p-4 rounded-xl border ${
            !currentPlayer?.team && currentPlayer?.selectedPig !== null
              ? 'bg-gradient-to-r from-red-500/20 to-blue-500/20 border-yellow-500 animate-pulse'
              : 'bg-gradient-to-r from-red-500/10 to-blue-500/10 border-border'
          }`}>
            <h4 className="text-sm font-medium text-text-secondary mb-3 text-center">
              {currentPlayer?.selectedPig === null
                ? '👀 관전 모드 - 팀 선택 없이 관전합니다'
                : !currentPlayer?.team
                  ? '⚠️ 팀을 선택해야 준비할 수 있습니다!'
                  : '👥 팀전 모드 - 팀을 선택하세요'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* A팀 */}
              <button
                onClick={() => handleSelectTeam('A')}
                disabled={currentPlayer?.isReady || currentPlayer?.selectedPig === null}
                className={`p-3 rounded-xl border-2 transition-all ${
                  currentPlayer?.team === 'A'
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-red-500/30 hover:border-red-500/60 bg-red-500/5'
                } ${currentPlayer?.isReady || currentPlayer?.selectedPig === null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-lg font-bold text-red-400 mb-1">🔴 A팀</div>
                <div className="text-xs text-text-secondary">
                  {teamAPlayers.length}명 참가
                </div>
                <div className="mt-2 space-y-1">
                  {teamAPlayers.map(p => (
                    <div key={p.id} className="text-xs text-red-300 truncate">
                      {p.id === room.hostId && '👑'} {p.name}
                    </div>
                  ))}
                </div>
              </button>

              {/* B팀 */}
              <button
                onClick={() => handleSelectTeam('B')}
                disabled={currentPlayer?.isReady || currentPlayer?.selectedPig === null}
                className={`p-3 rounded-xl border-2 transition-all ${
                  currentPlayer?.team === 'B'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5'
                } ${currentPlayer?.isReady || currentPlayer?.selectedPig === null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-lg font-bold text-blue-400 mb-1">🔵 B팀</div>
                <div className="text-xs text-text-secondary">
                  {teamBPlayers.length}명 참가
                </div>
                <div className="mt-2 space-y-1">
                  {teamBPlayers.map(p => (
                    <div key={p.id} className="text-xs text-blue-300 truncate">
                      {p.id === room.hostId && '👑'} {p.name}
                    </div>
                  ))}
                </div>
              </button>
            </div>

            {/* 관전 영역 */}
            {spectatorPlayers.length > 0 && (
              <div className="mt-3 p-3 rounded-xl border-2 border-gray-500/30 bg-gray-500/5">
                <div className="text-sm font-bold text-gray-400 mb-1">👀 관전</div>
                <div className="text-xs text-text-secondary mb-2">
                  {spectatorPlayers.length}명 관전 중
                </div>
                <div className="space-y-1">
                  {spectatorPlayers.map(p => (
                    <div key={p.id} className="text-xs text-gray-300 truncate">
                      {p.id === room.hostId && '👑'} {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {noTeamPlayers.length > 0 && (
              <div className="mt-3 text-center text-xs text-text-secondary">
                팀 미선택: {noTeamPlayers.map(p => p.name).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* 플레이어 목록 */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">
            {isTeamMode ? '전체 참가자' : `참가자 (${participants.length}명) / 관전자 (${spectators.length}명)`}
          </h4>
          <div className="space-y-2">
            {room.players.map((player) => {
              const isPlayerHost = player.id === room.hostId;
              const isSpectator = player.selectedPig === null;
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
                    {isTeamMode && player.team && (
                      <span className={player.team === 'A' ? 'text-red-400' : 'text-blue-400'}>
                        {player.team === 'A' ? '🔴' : '🔵'}
                      </span>
                    )}
                    <span className="font-medium text-text-primary">{player.name}</span>
                    {player.id === getCurrentPlayerId() && (
                      <span className="text-xs text-accent">(나)</span>
                    )}
                    {isSpectator && (
                      <span className="text-xs text-blue-400">[관전]</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isTeamMode && player.team && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        player.team === 'A' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {player.team}팀
                      </span>
                    )}
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

        {/* 돼지 선택 (waiting 또는 selecting 상태일 때) */}
        {(room.status === 'waiting' || room.status === 'selecting') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-text-secondary">
                🐷 내 돼지 선택
              </h4>
              <span className="text-xs text-blue-400">
                💡 선택 안 하면 관전 모드
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {/* 서버에서 제공하는 pigs 배열 사용 (접속 인원 수만큼) */}
              {room.pigs.map((pig) => {
                const owner = getPigOwner(room, pig.id);
                const isSelected = currentPlayer?.selectedPig === pig.id;
                const isAvailable = !owner;
                const isPlayerReady = currentPlayer?.isReady ?? false;
                // 준비 완료 상태면 클릭 불가
                const canClick = !isPlayerReady && (isAvailable || isSelected);

                const isOriginal = getPigColor(pig.id) === 'original';
                return (
                  <button
                    key={pig.id}
                    onClick={() => canClick && handleSelectPig(pig.id)}
                    disabled={!canClick}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-accent bg-accent/20'
                        : isAvailable && !isPlayerReady
                        ? 'border-border hover:border-accent/50 bg-bg-tertiary'
                        : 'border-gray-600 bg-gray-800 opacity-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full mx-auto mb-1 ${isOriginal ? 'border-2 border-white' : ''}`}
                      style={{ backgroundColor: getPigBgColor(pig.id) }}
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
                  {!hasEnoughParticipants
                    ? '참가자 2명 이상 필요'
                    : !hasValidTeams
                    ? !teamsBalanced
                      ? `팀 인원 불균형 (A:${teamAParticipants.length} vs B:${teamBParticipants.length})`
                      : '양 팀에 참가자 필요'
                    : !allReady
                    ? '모두 준비 대기'
                    : isRematchWaiting
                    ? '🔄 게임 시작!'
                    : '게임 시작!'}
                </button>
              ) : (
                <button
                  onClick={handleToggleReady}
                  disabled={isTeamMode && !currentPlayer?.team && currentPlayer?.selectedPig !== null}
                  className={`flex-1 py-3 font-bold rounded-lg ${
                    currentPlayer?.isReady
                      ? 'bg-gray-600 text-gray-300'
                      : currentPlayer?.selectedPig === null
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  } disabled:opacity-50`}
                >
                  {isTeamMode && !currentPlayer?.team && currentPlayer?.selectedPig !== null
                    ? '팀을 선택하세요'
                    : currentPlayer?.isReady
                    ? '준비 취소'
                    : currentPlayer?.selectedPig === null
                    ? '👀 관전 준비'
                    : '준비 완료'}
                </button>
              )}
            </div>
          );
        })()}

        {/* 채팅 */}
        <div className="mt-4 border-t border-border pt-4">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-full flex items-center justify-between p-3 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
          >
            <span className="text-sm font-medium text-text-primary flex items-center gap-2">
              💬 채팅
              {chatMessages.length > 0 && (
                <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full">
                  {chatMessages.length}
                </span>
              )}
            </span>
            <span className="text-text-secondary">{isChatOpen ? '▲' : '▼'}</span>
          </button>

          {isChatOpen && (
            <div className="mt-2 bg-bg-tertiary rounded-lg overflow-hidden">
              {/* 메시지 목록 */}
              <div
                ref={chatContainerRef}
                className="h-48 overflow-y-auto p-3 space-y-2"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center text-text-secondary text-sm py-8">
                    아직 메시지가 없습니다
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.playerId === getCurrentPlayerId();
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            isMe
                              ? 'bg-accent text-white'
                              : 'bg-bg-secondary text-text-primary'
                          }`}
                        >
                          {!isMe && (
                            <div className="text-xs text-text-secondary mb-1">
                              {msg.playerName}
                            </div>
                          )}
                          <div className="text-sm break-words">{msg.content}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 입력 */}
              <div className="p-3 border-t border-border flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="메시지를 입력하세요..."
                  maxLength={200}
                  className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 bg-accent text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                >
                  전송
                </button>
              </div>
            </div>
          )}
        </div>
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

    // 선택된 돼지 ID 목록 (관전자는 돼지를 선택하지 않았으므로 제외됨)
    const selectedPigIds = new Set(
      room.players.filter(p => p.selectedPig !== null).map(p => p.selectedPig!)
    );

    // 게스트는 보간된 위치 사용, 호스트는 room.pigs 직접 사용
    // 선택된 돼지만 필터링하여 표시 (관전자의 돼지는 없음)
    const allPigs = (isRacing && !isHost && interpolatedPigs.length > 0)
      ? interpolatedPigs
      : room.pigs;
    const displayPigs = allPigs.filter(pig => selectedPigIds.has(pig.id));

    // 상태 텍스트 결정 (게스트는 guestRaceTime 사용)
    const displayTime = isHost ? raceTime : guestRaceTime;
    const getStatusText = () => {
      if (isCountdown) return `⏱️ 카운트다운: ${room.countdown}`;
      if (isRacing) return `🏃 레이스 중! (${(displayTime / 1000).toFixed(1)}초)`;
      return '🏁 레이스 종료!';
    };

    // 팀전 모드 및 내 팀 정보
    const isTeamModeGame = (room.raceMode || currentRaceMode) === 'team';
    const currentPlayer = getCurrentPlayer(room);
    const myTeam = currentPlayer?.team;

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

        {/* 1등 골인 후 리타이어 카운트다운 오버레이 - 서버에서 firstPlaceFinishTime 받았을 때만 표시 */}
        {isRacing && room?.firstPlaceFinishTime && retireCountdown !== null && retireCountdown > 0 && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
            <div className={`px-6 py-3 rounded-2xl shadow-lg ${
              retireCountdown <= 3
                ? 'bg-red-500/90 animate-pulse'
                : 'bg-yellow-500/90'
            }`}>
              <div className="text-center">
                <div className="text-sm font-medium text-white/80">
                  ⏱️ 골인까지 남은 시간
                </div>
                <div className={`text-4xl font-bold text-white ${
                  retireCountdown <= 3 ? 'animate-bounce' : ''
                }`}>
                  {retireCountdown}초
                </div>
                <div className="text-xs text-white/70 mt-1">
                  시간 초과 시 리타이어 처리
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상태 바 */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary">
              {getStatusText()}
            </span>
            {/* 팀전 모드 - 내 팀 표시 */}
            {isTeamModeGame && myTeam && (
              <span className={`px-2 py-1 rounded-lg font-bold text-xs ${
                myTeam === 'A'
                  ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                  : 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
              }`}>
                {myTeam === 'A' ? '🔴 A팀' : '🔵 B팀'}
              </span>
            )}
          </div>
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
            const isOriginal = pigColor === 'original';
            const isTeamModeRace = (room.raceMode || currentRaceMode) === 'team';
            const ownerTeam = owner?.team;

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
                  {/* 이름 + 팀 표시 */}
                  <div
                    className={`flex items-center text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-full mb-0.5 ${
                      isMyPig ? 'ring-2 ring-white' : ''
                    } ${isOriginal ? 'border border-gray-500' : ''}`}
                    style={{ backgroundColor: getPigBgColor(pig.id), color: '#000' }}
                  >
                    {/* 팀 표시 (팀전 모드) - 닉네임 왼쪽 */}
                    {isTeamModeRace && ownerTeam && (
                      <span className="mr-0.5 text-xs">
                        {ownerTeam === 'A' ? '🔴' : '🔵'}
                      </span>
                    )}
                    {owner?.name || `돼지${pig.id + 1}`}
                    {pig.rank && <span className="ml-1">#{pig.rank}</span>}
                  </div>
                  {/* 호 캐릭터 이미지 */}
                  <img
                    src={`${import.meta.env.BASE_URL}ho.svg`}
                    alt={`호${pig.id + 1}`}
                    width="50"
                    height="50"
                    className={`drop-shadow-md ${pig.finishTime ? 'scale-110' : ''}`}
                    style={{
                      animation: isRacing && !pig.finishTime ? 'pigRun 0.2s infinite' : 'none',
                      filter: getColorFilter(pigColor),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 순위 */}
        {isFinished && (() => {
          // 스냅샷이 있으면 스냅샷 사용, 없으면 현재 room 데이터 사용
          const snapshotPigs = resultSnapshot?.pigs || room.pigs as PigState[];
          const snapshotPlayers = resultSnapshot?.players || room.players;
          const snapshotTeamScore = resultSnapshot?.teamScore;
          const isTeamMode = resultSnapshot?.raceMode === 'team' || (room.raceMode || currentRaceMode) === 'team';
          // 스냅샷에 teamScore가 있으면 사용, 없으면 계산 (폴백)
          const teamScore = snapshotTeamScore || (isTeamMode ? calculateTeamScore(snapshotPigs, snapshotPlayers) : null);
          const rankPoints: Record<number, number> = { 1: 10, 2: 8, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2 };
          // 스냅샷 플레이어에서 소유자 찾기
          const getSnapshotPigOwner = (pigId: number): Player | undefined => snapshotPlayers.find(p => p.selectedPig === pigId);

          return (
            <div className="space-y-4">
              {/* 팀전 결과 */}
              {isTeamMode && teamScore && (() => {
                // 승리팀 결정: 점수가 높은 팀 승리, 동점이면 1등 보유팀 승리
                const isTied = teamScore.teamA === teamScore.teamB;
                const teamAWins = teamScore.teamA > teamScore.teamB ||
                  (isTied && teamScore.firstPlaceTeam === 'A');
                const teamBWins = teamScore.teamB > teamScore.teamA ||
                  (isTied && teamScore.firstPlaceTeam === 'B');

                return (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 via-purple-500/10 to-blue-500/10 border border-border">
                    <h4 className="text-center text-sm font-medium text-text-secondary mb-3">👥 팀전 결과</h4>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      {/* A팀 */}
                      <div className={`text-center p-3 rounded-xl ${
                        teamAWins ? 'bg-red-500/20 border-2 border-red-500' : 'bg-red-500/10'
                      }`}>
                        <div className="text-2xl mb-1">🔴</div>
                        <div className="text-lg font-bold text-red-400">A팀</div>
                        <div className="text-3xl font-bold text-red-300">{teamScore.teamA}점</div>
                        {teamAWins ? (
                          <div className="text-yellow-400 font-bold mt-1">
                            🏆 승리!
                            {isTied && <span className="text-xs block text-yellow-300">(1등 보유)</span>}
                          </div>
                        ) : (
                          <div className="text-gray-400 font-bold mt-1">
                            💀 패배
                            {isTied && <span className="text-xs block text-gray-500">(1등 없음)</span>}
                          </div>
                        )}
                      </div>

                      {/* VS */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-text-secondary">VS</div>
                        {isTied && (
                          <div className="text-purple-400 font-bold text-sm mt-2">동점!</div>
                        )}
                      </div>

                      {/* B팀 */}
                      <div className={`text-center p-3 rounded-xl ${
                        teamBWins ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-blue-500/10'
                      }`}>
                        <div className="text-2xl mb-1">🔵</div>
                        <div className="text-lg font-bold text-blue-400">B팀</div>
                        <div className="text-3xl font-bold text-blue-300">{teamScore.teamB}점</div>
                        {teamBWins ? (
                          <div className="text-yellow-400 font-bold mt-1">
                            🏆 승리!
                            {isTied && <span className="text-xs block text-yellow-300">(1등 보유)</span>}
                          </div>
                        ) : (
                          <div className="text-gray-400 font-bold mt-1">
                            💀 패배
                            {isTied && <span className="text-xs block text-gray-500">(1등 없음)</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 개인 순위 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-secondary">
                  {isTeamMode ? '📊 개인 순위 (획득 점수)' : '🏆 최종 순위'}
                </h4>
                {[...snapshotPigs]
                  .filter(pig => selectedPigIds.has(pig.id)) // 선택된 돼지만 순위에 표시
                  .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                  .map((pig) => {
                    const owner = getSnapshotPigOwner(pig.id);
                    const isMyPig = getCurrentPlayer(room)?.selectedPig === pig.id;
                    const isOriginal = getPigColor(pig.id) === 'original';
                    const points = pig.rank ? (rankPoints[pig.rank] || 1) : 0;
                    const isRetired = pig.rank === null; // 리타이어 (제한 시간 내 미완주)

                    return (
                      <div
                        key={pig.id}
                        className={`flex justify-between items-center p-3 rounded-xl ${
                          isRetired
                            ? 'bg-gray-500/10 opacity-60'
                            : pig.rank === 1
                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500'
                            : isMyPig
                            ? 'bg-accent/10 border border-accent'
                            : 'bg-bg-tertiary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold w-8">
                            {isRetired && '💨'}
                            {pig.rank === 1 && '🥇'}
                            {pig.rank === 2 && '🥈'}
                            {pig.rank === 3 && '🥉'}
                            {pig.rank && pig.rank > 3 && `${pig.rank}등`}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full ${isOriginal ? 'border-2 border-gray-400' : ''}`}
                            style={{ backgroundColor: getPigBgColor(pig.id) }}
                          />
                          {/* 팀전일 경우 팀 표시 */}
                          {isTeamMode && owner?.team && (
                            <span className={owner.team === 'A' ? 'text-red-400' : 'text-blue-400'}>
                              {owner.team === 'A' ? '🔴' : '🔵'}
                            </span>
                          )}
                          <span className={
                            isRetired
                              ? 'text-gray-400 line-through'
                              : pig.rank === 1
                              ? 'text-yellow-400 font-bold'
                              : 'text-text-primary'
                          }>
                            {owner?.name || `돼지${pig.id + 1}`}
                            {isMyPig && ' (나)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {isTeamMode && (
                            <span className={`text-sm font-bold ${isRetired ? 'text-gray-400' : 'text-accent'}`}>
                              {isRetired ? '0점' : `+${points}점`}
                            </span>
                          )}
                          <span className="text-sm text-text-secondary">
                            {isRetired ? '리타이어' : pig.finishTime ? `${(pig.finishTime / 1000).toFixed(2)}초` : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })()}

        {/* 레이스 중 채팅 */}
        <div className="mt-4 border-t border-border pt-4">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-full flex items-center justify-between p-2 bg-bg-tertiary rounded-lg hover:bg-bg-tertiary/80 transition-colors"
          >
            <span className="text-xs font-medium text-text-primary flex items-center gap-2">
              💬 채팅
              {chatMessages.length > 0 && (
                <span className="bg-accent/20 text-accent text-xs px-1.5 py-0.5 rounded-full">
                  {chatMessages.length}
                </span>
              )}
            </span>
            <span className="text-text-secondary text-xs">{isChatOpen ? '▲' : '▼'}</span>
          </button>

          {isChatOpen && (
            <div className="mt-2 bg-bg-tertiary rounded-lg overflow-hidden">
              {/* 메시지 목록 (레이스 중에는 높이 축소) */}
              <div
                ref={chatContainerRef}
                className="h-32 overflow-y-auto p-2 space-y-1.5"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center text-text-secondary text-xs py-4">
                    아직 메시지가 없습니다
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.playerId === getCurrentPlayerId();
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-2 py-1 ${
                            isMe
                              ? 'bg-accent text-white'
                              : 'bg-bg-secondary text-text-primary'
                          }`}
                        >
                          {!isMe && (
                            <div className="text-[10px] text-text-secondary mb-0.5">
                              {msg.playerName}
                            </div>
                          )}
                          <div className="text-xs break-words">{msg.content}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 입력 */}
              <div className="p-2 border-t border-border flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="메시지 입력..."
                  maxLength={200}
                  className="flex-1 bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="px-3 py-1.5 bg-accent text-white rounded-lg font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                >
                  전송
                </button>
              </div>
            </div>
          )}
        </div>

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
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}ho.svg`} alt="천호" className="w-6 h-6" />
            천호 레이스
          </h2>
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
