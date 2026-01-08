// 멀티플레이어 게임 API 서비스

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

// 타입 정의
export interface Player {
  id: string;
  name: string;
  selectedPig: number | null; // 선택한 돼지 번호 (null이면 미선택)
  isReady: boolean;
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

export interface GameRoom {
  roomCode: string;
  hostId: string;
  status: 'waiting' | 'selecting' | 'countdown' | 'racing' | 'finished';
  players: Player[];
  pigs: PigState[];
  maxPlayers: number;
  raceStartTime: number | null;
  raceEndTime: number | null;
  countdown: number;
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
    console.error('API 호출 실패:', error);
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
  maxPlayers: number = 6
): Promise<ApiResponse<GameRoom>> => {
  return apiCall<GameRoom>('/api/game/rooms', {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
      playerName,
      maxPlayers,
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
    pigs?: PigState[];
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
  event: 'room_update' | 'player_joined' | 'player_left' | 'pig_selected' | 'player_ready' | 'game_starting' | 'game_started' | 'race_update' | 'race_finished' | 'room_closed' | 'error' | 'connected' | 'heartbeat';
  data: GameRoom | { message: string; playerId?: string; playerName?: string };
  timestamp: number;
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
 * @returns SSE 연결 객체 (close 함수 포함)
 */
export const subscribeToRoom = (
  roomCode: string,
  onUpdate: (room: GameRoom) => void,
  onError?: (error: string) => void
): SSEConnection => {
  const playerId = getPlayerId();
  const url = `${API_BASE_URL}/api/game/rooms/${roomCode}/events?playerId=${playerId}`;

  console.log('[SSE] EventSource 생성 시작');
  console.log('[SSE] URL:', url);
  console.log('[SSE] Player ID:', playerId);

  const eventSource = new EventSource(url);

  console.log('[SSE] EventSource 객체 생성됨, readyState:', eventSource.readyState);
  // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED

  // 연결 성공
  eventSource.onopen = () => {
    console.log('[SSE] ✅ 연결 성공! roomCode:', roomCode);
    console.log('[SSE] readyState:', eventSource.readyState);
  };

  // 메시지 수신 (기본 이벤트 - event: 없이 오는 경우)
  eventSource.onmessage = (event) => {
    console.log('[SSE] 📨 onmessage 호출됨!');
    console.log('[SSE] raw event.data:', event.data);
    try {
      const data = JSON.parse(event.data);
      console.log('[SSE] 기본 메시지 파싱됨:', data);

      // 방 상태가 직접 들어오는 경우 (roomCode 있으면 GameRoom)
      if (data && 'roomCode' in data) {
        console.log('[SSE] GameRoom 데이터 감지, onUpdate 호출');
        onUpdate(data as GameRoom);
      }
    } catch (err) {
      console.error('[SSE] 파싱 오류:', err);
    }
  };

  // 개별 이벤트 타입 핸들러
  // README 스펙: connected(초기), update(상태변경), ping(하트비트), room_deleted(삭제)
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
    'heartbeat'
  ];

  console.log('[SSE] 이벤트 리스너 등록 시작:', eventTypes.join(', '));

  eventTypes.forEach(eventType => {
    eventSource.addEventListener(eventType, (event: MessageEvent) => {
      console.log(`[SSE] 📬 이벤트 수신: "${eventType}"`);
      console.log(`[SSE] raw data:`, event.data);
      try {
        const data = JSON.parse(event.data);
        console.log(`[SSE] ${eventType} 파싱됨:`, data);

        // 방 상태가 포함된 이벤트
        if (data && 'roomCode' in data) {
          console.log(`[SSE] ${eventType}에서 GameRoom 감지, onUpdate 호출`);
          onUpdate(data as GameRoom);
        }
      } catch (err) {
        console.error(`[SSE] ${eventType} 파싱 오류:`, err);
      }
    });
  });

  console.log('[SSE] 모든 이벤트 리스너 등록 완료');

  // 에러 처리
  eventSource.onerror = (event) => {
    console.error('[SSE] ❌ 에러 발생!');
    console.error('[SSE] readyState:', eventSource.readyState);
    console.error('[SSE] event:', event);

    // 연결이 닫혔는지 확인
    if (eventSource.readyState === EventSource.CLOSED) {
      console.error('[SSE] 연결 CLOSED 상태');
      onError?.('SSE 연결이 종료되었습니다');
    } else if (eventSource.readyState === EventSource.CONNECTING) {
      console.log('[SSE] 재연결 시도 중...');
    } else {
      console.error('[SSE] 알 수 없는 오류');
      onError?.('SSE 연결 오류');
    }
  };

  return {
    eventSource,
    close: () => {
      console.log('[SSE] 연결 종료');
      eventSource.close();
    }
  };
};

/**
 * 게임 방 상태 조회 (폴링 폴백용)
 * SSE 연결 실패 시 폴링으로 사용
 */
export const getRoomStateForPolling = getRoomState;
