// 멀티플레이어 게임 API 서비스

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

// 게임 모드 타입
export type GameMode = 'normal' | 'relay';

// 타입 정의
export interface Player {
  id: string;
  name: string;
  selectedPig: number | null; // 선택한 돼지 번호 (일반 모드만 사용, null이면 미선택)
  isReady: boolean;
  isSpectator: boolean; // 관전자 여부
  team: 'A' | 'B' | null; // 릴레이 모드: 소속 팀
  runnerOrder: number | null; // 릴레이 모드: 주자 순서 (1, 2, 3...)
  joinedAt: number;
}

export interface PigState {
  id: number;
  position: number;
  speed: number;
  status: 'normal' | 'turbo' | 'superBoost' | 'boost' | 'slip' | 'tired';
  finishTime: number | null;
  rank: number | null;
}

// 릴레이 모드 돼지 상태
export interface RelayPigState {
  id: number; // 0: A팀, 1: B팀
  team: 'A' | 'B';
  position: number; // 0-100
  speed: number;
  status: 'normal' | 'turbo' | 'superBoost' | 'boost' | 'slip' | 'tired';
  direction: 'forward' | 'backward'; // 이동 방향
  finishTime: number | null; // 팀 최종 완주 시간
  rank: number | null; // 팀 순위
}

// 팀별 릴레이 상태
export interface TeamRelayState {
  currentRunner: number; // 현재 달리는 주자 순서 (1부터)
  completedRunners: number; // 완주한 주자 수
  totalRunners: number; // 총 주자 수
  finishTime: number | null; // 팀 완주 시간
}

// 릴레이 상태
export interface RelayState {
  teamA: TeamRelayState;
  teamB: TeamRelayState;
}

export interface GameRoom {
  roomCode: string;
  hostId: string;
  gameMode: GameMode; // 게임 모드
  status: 'waiting' | 'selecting' | 'countdown' | 'racing' | 'finished';
  players: Player[];
  pigs: PigState[] | RelayPigState[]; // 일반 모드 또는 릴레이 모드
  maxPlayers: number;
  raceStartTime: number | null;
  raceEndTime: number | null;
  countdown: number;
  relay: RelayState | null; // 릴레이 모드 전용 상태
  createdAt: number;
  updatedAt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 유틸리티: 플레이어 ID 생성/조회
const getPlayerId = (): string => {
  let playerId = localStorage.getItem('PIG_RACE_PLAYER_ID');
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('PIG_RACE_PLAYER_ID', playerId);
  }
  return playerId;
};

// API 호출 래퍼
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Player-ID': getPlayerId(),
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
};

// ========== API 함수들 ==========

/**
 * 게임 방 생성
 */
export const createRoom = async (
  playerName: string,
  maxPlayers: number = 6,
  gameMode: GameMode = 'normal'
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>('/api/game/rooms', {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
      playerName,
      maxPlayers,
      gameMode,
    }),
  });
};

/**
 * 게임 방 입장
 */
export const joinRoom = async (
  roomCode: string,
  playerName: string
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/join`, {
    method: 'POST',
    body: JSON.stringify({
      playerName,
      playerId: getPlayerId(),
    }),
  });
};

/**
 * 게임 방 나가기
 */
export const leaveRoom = async (
  roomCode: string
): Promise<ApiResponse<{ message: string }>> => {
  return apiCall<{ message: string }>(`/api/game/rooms/${roomCode}/leave`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
    }),
  });
};

/**
 * 게임 방 상태 조회 (폴링용)
 */
export const getRoomState = async (
  roomCode: string
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}`);
};

/**
 * 돼지 선택
 */
export const selectPig = async (
  roomCode: string,
  pigId: number
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/select-pig`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
      pigId,
    }),
  });
};

/**
 * 준비 완료 토글
 */
export const toggleReady = async (
  roomCode: string
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/ready`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
    }),
  });
};

/**
 * 게임 시작 (호스트만)
 */
export const startGame = async (
  roomCode: string
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/start`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
    }),
  });
};

/**
 * 게임 상태 업데이트 (호스트가 레이스 진행 중 업데이트)
 * README 스펙에 맞게 updates 객체를 받음
 */
export const updateGameState = async (
  roomCode: string,
  updates: {
    status?: GameRoom['status'];
    countdown?: number;
    raceStartTime?: number | null;
    raceEndTime?: number | null;
    pigs?: PigState[] | RelayPigState[];
    relay?: RelayState | null; // 릴레이 모드 상태
    resetPlayers?: boolean; // 재경기 시 플레이어 선택/준비 초기화
  }
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/state`, {
    method: 'PUT',
    body: JSON.stringify({
      playerId: getPlayerId(),
      ...updates,
    }),
  });
};

/**
 * 방 삭제 (호스트만)
 */
export const deleteRoom = async (
  roomCode: string
): Promise<ApiResponse<{ message: string }>> => {
  return apiCall<{ message: string }>(`/api/game/rooms/${roomCode}`, {
    method: 'DELETE',
    body: JSON.stringify({
      playerId: getPlayerId(),
    }),
  });
};

/**
 * 플레이어 강퇴 (호스트만)
 */
export const kickPlayer = async (
  roomCode: string,
  targetPlayerId: string
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/kick`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
      targetPlayerId,
    }),
  });
};

/**
 * 팀 선택 (릴레이 모드 전용)
 */
export const selectTeam = async (
  roomCode: string,
  team: 'A' | 'B'
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/select-team`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
      team,
    }),
  });
};

/**
 * 주자 순서 선택 (릴레이 모드 전용)
 */
export const selectRunnerOrder = async (
  roomCode: string,
  order: number
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/select-order`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
      order,
    }),
  });
};

/**
 * 주자 순서 일괄 배정 (방장 전용, 릴레이 모드)
 * 게임 시작 전 방장이 모든 플레이어의 주자 순서를 한번에 배정
 */
export const assignRunnerOrders = async (
  roomCode: string,
  assignments: Array<{ playerId: string; order: number }>
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>(`/api/game/rooms/${roomCode}/assign-runner-orders`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
      assignments,
    }),
  });
};

// ========== 유틸리티 함수 ==========

export const getCurrentPlayerId = getPlayerId;

export const isCurrentPlayerHost = (room: GameRoom): boolean => {
  return room.hostId === getPlayerId();
};

export const getCurrentPlayer = (room: GameRoom): Player | undefined => {
  return room.players.find(p => p.id === getPlayerId());
};

export const getPlayerByPigId = (room: GameRoom, pigId: number): Player | undefined => {
  return room.players.find(p => p.selectedPig === pigId);
};

// ========== SSE (Server-Sent Events) ==========

export interface SSEEvent {
  event: 'room_update' | 'player_joined' | 'player_left' | 'pig_selected' | 'player_ready' | 'game_starting' | 'game_started' | 'race_update' | 'race_finished' | 'room_closed' | 'error' | 'connected' | 'heartbeat' | 'host_changed' | 'kicked';
  data: GameRoom | { message: string; playerId?: string; playerName?: string } | HostChangedData | KickedData;
  timestamp: number;
}

// kicked 이벤트 데이터 타입 (서버에서 message만 보냄 - 본인에게만 전송되므로)
export interface KickedData {
  message: string;
}

// host_changed 이벤트 데이터 타입
export interface HostChangedData {
  newHostId: string;
  room: GameRoom;
}

export interface SSEConnection {
  eventSource: EventSource;
  close: () => void;
}

/**
 * SSE로 게임 방 구독
 * 실시간으로 방 상태 업데이트를 수신합니다.
 *
 * @param roomCode - 방 코드
 * @param onUpdate - 방 상태 업데이트 콜백
 * @param onError - 에러 발생 시 콜백
 * @param onHostChanged - 방장 변경 시 콜백 (게임 중 방장이 나가면 호출)
 * @param onKicked - 강퇴당했을 때 콜백
 * @returns SSE 연결 객체 (close 함수 포함)
 */
export const subscribeToRoom = (
  roomCode: string,
  onUpdate: (room: GameRoom) => void,
  onError?: (error: string) => void,
  onHostChanged?: (data: HostChangedData) => void,
  onKicked?: (data: KickedData) => void
): SSEConnection => {
  const playerId = getPlayerId();
  const url = `${API_BASE_URL}/api/game/rooms/${roomCode}/events?playerId=${playerId}`;

  const eventSource = new EventSource(url);

  // 연결 성공
  eventSource.onopen = () => {
    // 연결 성공
  };

  // 메시지 수신 (기본 이벤트 - event: 없이 오는 경우)
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // 방 상태가 직접 들어오는 경우 (roomCode 있으면 GameRoom)
      if (data && 'roomCode' in data) {
        onUpdate(data as GameRoom);
      }
    } catch {
      // 파싱 오류 무시
    }
  };

  // 개별 이벤트 타입 핸들러
  // README 스펙: connected(초기), update(상태변경), ping(하트비트), room_deleted(삭제), host_changed(방장변경)
  const eventTypes = [
    'connected',      // 연결 시 초기 상태
    'update',         // 상태 업데이트 (플레이어 입장/퇴장/준비/게임시작 등)
    'room_update',    // 방 상태 업데이트
    'player_joined',
    'player_left',
    'pig_selected',
    'player_ready',
    'game_starting',
    'game_started',
    'race_update',
    'race_finished',
    'room_closed',
    'room_deleted',   // 방 삭제
    'ping',           // 하트비트
    'heartbeat',
    'kicked'          // 플레이어 강퇴
  ];

  eventTypes.forEach(eventType => {
    eventSource.addEventListener(eventType, (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // 방 상태가 포함된 이벤트
        if (data && 'roomCode' in data) {
          onUpdate(data as GameRoom);
        }
      } catch {
        // 파싱 오류 무시
      }
    });
  });

  // host_changed 이벤트 (게임 중 방장 변경) - 별도 처리
  eventSource.addEventListener('host_changed', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as HostChangedData;

      // onHostChanged 콜백 호출 (콜백에서 setRoom 처리하므로 onUpdate 중복 호출 안 함)
      if (onHostChanged) {
        onHostChanged(data);
      }
    } catch {
      // 파싱 오류 무시
    }
  });

  // kicked 이벤트 (플레이어 강퇴) - 별도 처리
  // 서버는 강퇴당한 플레이어에게만 kicked 이벤트를 보냄
  eventSource.addEventListener('kicked', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as KickedData;

      // onKicked 콜백 호출 (kicked 이벤트를 받으면 무조건 자신이 강퇴당한 것)
      if (onKicked) {
        onKicked(data);
      }
    } catch {
      // 파싱 오류 무시
    }
  });

  // 에러 처리
  eventSource.onerror = () => {
    // 연결이 닫혔는지 확인
    if (eventSource.readyState === EventSource.CLOSED) {
      onError?.('SSE 연결이 종료되었습니다');
    } else if (eventSource.readyState !== EventSource.CONNECTING) {
      onError?.('SSE 연결 오류');
    }
  };

  return {
    eventSource,
    close: () => {
      eventSource.close();
    }
  };
};

/**
 * 게임 방 상태 조회 (폴링 폴백용)
 * SSE 연결 실패 시 폴링으로 사용
 */
export const getRoomStateForPolling = getRoomState;

/**
 * 하트비트 전송 (플레이어 활성 상태 갱신)
 * 주기적으로 호출하여 플레이어가 아직 연결되어 있음을 알림
 * 서버는 일정 시간 동안 하트비트가 없는 플레이어를 비활성으로 처리
 */
export const sendHeartbeat = async (
  roomCode: string
): Promise<ApiResponse<{ message: string }>> => {
  return apiCall<{ message: string }>(`/api/game/rooms/${roomCode}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
    }),
  });
};
