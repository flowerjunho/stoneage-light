# 멀티플레이어 돼지 레이스 API 명세서 v2.0

## 개요

멀티플레이어 돼지 레이스 게임을 위한 백엔드 API 명세서입니다.
**실시간 동기화는 SSE(Server-Sent Events) 방식**으로 구현되며, 폴링 대비 서버 부하 90% 감소 및 실시간 응답이 가능합니다.

## 기본 정보

- **Base URL**: `https://your-api-domain.com`
- **Content-Type**: `application/json`
- **SSE Content-Type**: `text/event-stream`
- **저장 방식**: JSON 파일 (방별 개별 파일 권장)

---

## 목차

1. [데이터 구조](#데이터-구조)
2. [REST API 엔드포인트](#rest-api-엔드포인트)
3. [SSE 실시간 스트림](#sse-실시간-스트림)
4. [CORS 설정](#cors-설정)
5. [이벤트 발행 시스템](#이벤트-발행-시스템)
6. [서버 구현 가이드](#서버-구현-가이드)
7. [에러 코드](#에러-코드)
8. [게임 흐름](#게임-흐름)
9. [테스트 시나리오](#테스트-시나리오)

---

## 데이터 구조

### Player (플레이어)

```typescript
interface Player {
  id: string;                    // 고유 플레이어 ID (클라이언트에서 생성)
  name: string;                  // 플레이어 닉네임 (2-10자)
  selectedPig: number | null;    // 선택한 돼지 번호 (0-9, null이면 미선택)
  isReady: boolean;              // 준비 완료 여부
  joinedAt: number;              // 입장 시간 (Unix timestamp ms)
}
```

### PigState (돼지 상태)

```typescript
interface PigState {
  id: number;                    // 돼지 번호 (0-9)
  position: number;              // 현재 위치 (0-100, 100이면 완주)
  speed: number;                 // 현재 속도 (0-10)
  status: PigStatus;             // 현재 상태
  finishTime: number | null;     // 완주 시간 ms (null이면 미완주)
  rank: number | null;           // 순위 (null이면 미완주)
}

type PigStatus = 'normal' | 'turbo' | 'superBoost' | 'boost' | 'slip' | 'tired';
```

**상태 설명:**
| status | 설명 | 속도 배율 |
|--------|------|----------|
| normal | 일반 | 1.0x |
| boost | 부스트 | 1.8x |
| superBoost | 슈퍼 부스트 | 2.5x |
| turbo | 터보 | 4.0x |
| tired | 지침 | 0.2x |
| slip | 미끄러짐 | 0.05x |

### GameRoom (게임 방)

```typescript
interface GameRoom {
  roomCode: string;              // 6자리 방 코드 (예: "A1B2C3")
  hostId: string;                // 방장 플레이어 ID
  status: GameStatus;            // 게임 상태
  players: Player[];             // 참가 플레이어 목록 (최대 10명)
  pigs: PigState[];              // 돼지 상태 배열 (10마리)
  maxPlayers: number;            // 최대 참가자 수 (기본값: 6, 최대: 10)
  raceStartTime: number | null;  // 레이스 시작 시간 (Unix timestamp ms)
  raceEndTime: number | null;    // 레이스 종료 시간 (Unix timestamp ms)
  countdown: number;             // 카운트다운 (3, 2, 1, 0)
  createdAt: number;             // 방 생성 시간 (Unix timestamp ms)
  updatedAt: number;             // 마지막 업데이트 시간 (Unix timestamp ms)
}

type GameStatus = 'waiting' | 'selecting' | 'countdown' | 'racing' | 'finished';
```

**상태 설명:**
| status | 설명 | 허용 동작 |
|--------|------|----------|
| waiting | 대기 중 | 입장, 퇴장, 돼지 선택, 준비 |
| selecting | 돼지 선택 중 | 퇴장, 돼지 선택, 준비 |
| countdown | 카운트다운 | - |
| racing | 레이스 중 | 상태 업데이트 (호스트만) |
| finished | 게임 종료 | 재시작, 퇴장 |

### ApiResponse (API 응답)

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## REST API 엔드포인트

### 1. 방 생성

새로운 게임 방을 생성합니다.

**POST** `/api/game/rooms`

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "playerId": "player_1704067200000_abc123def",
  "playerName": "닉네임",
  "maxPlayers": 6
}
```

| 필드 | 타입 | 필수 | 설명 | 유효성 검사 |
|------|------|------|------|-------------|
| playerId | string | ✅ | 플레이어 고유 ID | 최소 10자 |
| playerName | string | ✅ | 플레이어 닉네임 | 2-10자, 특수문자 제한 |
| maxPlayers | number | ❌ | 최대 인원 | 2-10 (기본값: 6) |

#### Response 200 (성공)
```json
{
  "success": true,
  "data": {
    "roomCode": "A1B2C3",
    "hostId": "player_1704067200000_abc123def",
    "status": "waiting",
    "players": [
      {
        "id": "player_1704067200000_abc123def",
        "name": "닉네임",
        "selectedPig": null,
        "isReady": false,
        "joinedAt": 1704067200000
      }
    ],
    "pigs": [
      { "id": 0, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 1, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 2, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 3, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 4, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 5, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 6, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 7, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 8, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
      { "id": 9, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null }
    ],
    "maxPlayers": 6,
    "raceStartTime": null,
    "raceEndTime": null,
    "countdown": 3,
    "createdAt": 1704067200000,
    "updatedAt": 1704067200000
  }
}
```

#### Response 400 (에러)
```json
{
  "success": false,
  "error": "플레이어 정보가 필요합니다."
}
```

#### 서버 구현 로직
```javascript
function createRoom(playerId, playerName, maxPlayers = 6) {
  // 1. 유효성 검사
  if (!playerId || playerId.length < 10) throw new Error('유효하지 않은 플레이어 ID');
  if (!playerName || playerName.length < 2 || playerName.length > 10) throw new Error('닉네임은 2-10자');
  if (maxPlayers < 2 || maxPlayers > 10) maxPlayers = 6;

  // 2. 고유 방 코드 생성 (중복 체크 필수)
  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (roomExists(roomCode));

  // 3. 방 데이터 생성
  const room = {
    roomCode,
    hostId: playerId,
    status: 'waiting',
    players: [{
      id: playerId,
      name: playerName,
      selectedPig: null,
      isReady: false,
      joinedAt: Date.now()
    }],
    pigs: Array.from({ length: 10 }, (_, i) => ({
      id: i,
      position: 0,
      speed: 0,
      status: 'normal',
      finishTime: null,
      rank: null
    })),
    maxPlayers,
    raceStartTime: null,
    raceEndTime: null,
    countdown: 3,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // 4. 파일 저장
  saveRoom(roomCode, room);

  return room;
}
```

---

### 2. 방 입장

기존 게임 방에 입장합니다.

**POST** `/api/game/rooms/:roomCode/join`

#### URL Parameters
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| roomCode | string | 6자리 방 코드 (대소문자 구분 없음) |

#### Request Body
```json
{
  "playerId": "player_1704067260000_xyz789ghi",
  "playerName": "참가자"
}
```

#### Response 200 (성공)
전체 GameRoom 객체 반환

#### Response 에러
| Status | error | 상황 |
|--------|-------|------|
| 400 | "플레이어 정보가 필요합니다." | playerId/playerName 누락 |
| 404 | "방을 찾을 수 없습니다." | 존재하지 않는 roomCode |
| 409 | "방이 가득 찼습니다." | maxPlayers 초과 |
| 409 | "게임이 이미 시작되었습니다." | status가 waiting/selecting이 아님 |

#### 서버 구현 로직
```javascript
function joinRoom(roomCode, playerId, playerName) {
  // 1. 방 조회 (대소문자 무시)
  const room = getRoom(roomCode.toUpperCase());
  if (!room) throw new NotFoundError('방을 찾을 수 없습니다.');

  // 2. 상태 확인
  if (!['waiting', 'selecting'].includes(room.status)) {
    throw new ConflictError('게임이 이미 시작되었습니다.');
  }

  // 3. 중복 입장 체크
  const existingPlayer = room.players.find(p => p.id === playerId);
  if (existingPlayer) {
    return room; // 기존 정보 반환
  }

  // 4. 인원 체크
  if (room.players.length >= room.maxPlayers) {
    throw new ConflictError('방이 가득 찼습니다.');
  }

  // 5. 플레이어 추가
  room.players.push({
    id: playerId,
    name: playerName,
    selectedPig: null,
    isReady: false,
    joinedAt: Date.now()
  });
  room.updatedAt = Date.now();

  // 6. 저장 및 이벤트 발행
  saveRoom(roomCode, room);
  emitRoomEvent(roomCode, room); // SSE로 모든 클라이언트에 전송

  return room;
}
```

---

### 3. 방 퇴장

게임 방에서 나갑니다.

**POST** `/api/game/rooms/:roomCode/leave`

#### Request Body
```json
{
  "playerId": "player_1704067260000_xyz789ghi"
}
```

#### Response 200 (성공)
```json
{
  "success": true,
  "data": {
    "message": "방에서 나갔습니다."
  }
}
```

#### 서버 구현 로직
```javascript
function leaveRoom(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room) throw new NotFoundError('방을 찾을 수 없습니다.');

  const wasHost = room.hostId === playerId;
  const wasGameInProgress = ['countdown', 'racing'].includes(room.status);

  // 1. 플레이어 제거
  room.players = room.players.filter(p => p.id !== playerId);

  // 2. 모든 플레이어가 나간 경우 방 삭제
  if (room.players.length === 0) {
    deleteRoom(roomCode);
    return { message: '방이 삭제되었습니다.' };
  }

  // 3. 방장이 나간 경우 새 방장 지정 (가장 먼저 입장한 사람)
  if (wasHost) {
    room.players.sort((a, b) => a.joinedAt - b.joinedAt);
    room.hostId = room.players[0].id;

    // 4. 게임 진행 중이면 host_changed 이벤트 발행 (게임 루프 인계 필요)
    if (wasGameInProgress) {
      emitHostChangedEvent(roomCode, room.hostId, room);
    }
  }

  room.updatedAt = Date.now();

  // 5. 저장 및 일반 업데이트 이벤트 발행
  saveRoom(roomCode, room);
  emitRoomEvent(roomCode, room);

  return { message: '방에서 나갔습니다.' };
}

// host_changed 이벤트 발행 함수
function emitHostChangedEvent(roomCode, newHostId, room) {
  const connections = roomConnections.get(roomCode);
  if (!connections) return;

  const data = JSON.stringify({ newHostId, room });
  connections.forEach(res => {
    res.write(`event: host_changed\n`);
    res.write(`data: ${data}\n\n`);
  });
}
```

---

### 4. 방 상태 조회 (단발성)

현재 방 상태를 1회 조회합니다. SSE 연결 전 초기 상태 확인용.

**GET** `/api/game/rooms/:roomCode`

#### Request Headers
```
X-Player-ID: player_1704067200000_abc123def
```

#### Response 200 (성공)
전체 GameRoom 객체 반환

---

### 5. 돼지 선택

플레이어가 응원할 돼지를 선택합니다. **선택 해제도 가능합니다.**

**POST** `/api/game/rooms/:roomCode/select-pig`

#### Request Body
```json
{
  "playerId": "player_1704067200000_abc123def",
  "pigId": 2
}
```

| 필드 | 타입 | 필수 | 설명 | 유효성 검사 |
|------|------|------|------|-------------|
| playerId | string | ✅ | 플레이어 ID | 방에 존재해야 함 |
| pigId | number | ✅ | 돼지 번호 | **-1 또는 0-9 범위** |

#### pigId 특수값
| pigId | 동작 |
|-------|------|
| -1 | 현재 선택 해제 (selectedPig = null로 설정) |
| 0-9 | 해당 번호 돼지 선택 |

#### 선택 해제 예시
```json
{
  "playerId": "player_1704067200000_abc123def",
  "pigId": -1
}
```
→ 플레이어의 selectedPig이 null로 설정됨

#### 프론트엔드 토글 구현 예시
```typescript
// 클라이언트에서 토글 로직 처리
const handlePigClick = async (pigId: number) => {
  // 같은 돼지 클릭 시 -1 전송하여 선택 해제
  const targetPigId = currentPlayer?.selectedPig === pigId ? -1 : pigId;

  await fetch(`/api/game/rooms/${roomCode}/select-pig`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: myPlayerId, pigId: targetPigId })
  });
  // SSE로 업데이트된 상태 자동 수신
};
```

#### Response 에러
| Status | error | 상황 |
|--------|-------|------|
| 400 | "잘못된 돼지 번호입니다." | pigId가 -1 미만 또는 9 초과 |
| 404 | "플레이어를 찾을 수 없습니다." | 방에 없는 playerId |
| 409 | "이미 다른 플레이어가 선택한 돼지입니다." | 다른 사람이 이미 선택한 돼지 |

#### 서버 구현 로직
```javascript
function selectPig(roomCode, playerId, pigId) {
  const room = getRoom(roomCode);
  if (!room) throw new NotFoundError('방을 찾을 수 없습니다.');

  // 1. 상태 확인
  if (!['waiting', 'selecting'].includes(room.status)) {
    throw new ConflictError('돼지를 선택할 수 없는 상태입니다.');
  }

  // 2. 돼지 번호 유효성 (-1은 선택 해제)
  if (pigId < -1 || pigId > 9) {
    throw new BadRequestError('잘못된 돼지 번호입니다.');
  }

  // 3. 플레이어 찾기
  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new NotFoundError('플레이어를 찾을 수 없습니다.');

  // 4. 선택 해제 (-1인 경우)
  if (pigId === -1) {
    player.selectedPig = null;
    room.updatedAt = Date.now();
    saveRoom(roomCode, room);
    emitRoomEvent(roomCode, room);
    return room;
  }

  // 5. 중복 선택 체크 (다른 플레이어가 이미 선택한 돼지)
  const alreadySelected = room.players.find(p => p.selectedPig === pigId && p.id !== playerId);
  if (alreadySelected) {
    throw new ConflictError('이미 다른 플레이어가 선택한 돼지입니다.');
  }

  // 6. 선택 저장
  player.selectedPig = pigId;
  room.updatedAt = Date.now();

  // 7. 저장 및 이벤트 발행
  saveRoom(roomCode, room);
  emitRoomEvent(roomCode, room);

  return room;
}
```

---

### 6. 준비 완료/해제

플레이어의 준비 상태를 토글합니다.

**POST** `/api/game/rooms/:roomCode/ready`

#### Request Body
```json
{
  "playerId": "player_1704067200000_abc123def"
}
```

#### 서버 구현 로직
```javascript
function toggleReady(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room) throw new NotFoundError('방을 찾을 수 없습니다.');

  // 1. 상태 확인
  if (!['waiting', 'selecting'].includes(room.status)) {
    throw new ConflictError('준비 상태를 변경할 수 없습니다.');
  }

  // 2. 플레이어 찾기
  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new NotFoundError('플레이어를 찾을 수 없습니다.');

  // 3. 방장은 자동 준비 (토글 불가)
  if (player.id === room.hostId) {
    player.isReady = true;
    // 방장은 항상 준비 상태
  } else {
    // 4. 준비 토글
    player.isReady = !player.isReady;
  }

  room.updatedAt = Date.now();

  // 5. 저장 및 이벤트 발행
  saveRoom(roomCode, room);
  emitRoomEvent(roomCode, room);

  return room;
}
```

---

### 7. 게임 시작

방장이 게임을 시작합니다.

**POST** `/api/game/rooms/:roomCode/start`

#### Request Body
```json
{
  "playerId": "player_1704067200000_abc123def"
}
```

#### Response 에러
| Status | error | 상황 |
|--------|-------|------|
| 403 | "방장만 게임을 시작할 수 있습니다." | hostId가 아닌 경우 |
| 422 | "최소 2명의 플레이어가 필요합니다." | players.length < 2 |
| 422 | "모든 플레이어가 준비를 완료해야 합니다." | isReady가 false인 플레이어 존재 |

#### 서버 구현 로직
```javascript
function startGame(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room) throw new NotFoundError('방을 찾을 수 없습니다.');

  // 1. 방장 확인
  if (room.hostId !== playerId) {
    throw new ForbiddenError('방장만 게임을 시작할 수 있습니다.');
  }

  // 2. 상태 확인
  if (!['waiting', 'selecting'].includes(room.status)) {
    throw new ConflictError('게임을 시작할 수 없는 상태입니다.');
  }

  // 3. 최소 인원 확인
  if (room.players.length < 2) {
    throw new UnprocessableError('최소 2명의 플레이어가 필요합니다.');
  }

  // 4. 준비 상태 확인 (방장 제외)
  const notReady = room.players.filter(p => p.id !== room.hostId && !p.isReady);
  if (notReady.length > 0) {
    throw new UnprocessableError('모든 플레이어가 준비를 완료해야 합니다.');
  }

  // 5. 카운트다운 시작
  room.status = 'countdown';
  room.countdown = 3;
  room.updatedAt = Date.now();

  // 6. 저장 및 이벤트 발행
  saveRoom(roomCode, room);
  emitRoomEvent(roomCode, room);

  return room;
}
```

---

### 8. 게임 상태 업데이트

방장(호스트)이 게임 상태를 업데이트합니다. **레이스 중 호스트만 이 API를 호출합니다.**

**PUT** `/api/game/rooms/:roomCode/state`

#### Request Body
```json
{
  "playerId": "player_1704067200000_abc123def",
  "status": "racing",
  "pigs": [
    { "id": 0, "position": 45.5, "speed": 2.3, "status": "boost", "finishTime": null, "rank": null },
    { "id": 1, "position": 52.1, "speed": 1.8, "status": "normal", "finishTime": null, "rank": null },
    { "id": 2, "position": 100, "speed": 0, "status": "normal", "finishTime": 15234, "rank": 1 },
    ...
  ],
  "countdown": 0,
  "raceStartTime": 1704067400000,
  "raceEndTime": null,
  "resetPlayers": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| playerId | string | ✅ | 요청자 ID (방장만 가능) |
| status | GameStatus | ❌ | 게임 상태 |
| pigs | PigState[] | ❌ | 돼지 상태 배열 (10개) |
| countdown | number | ❌ | 카운트다운 값 (0-3) |
| raceStartTime | number \| null | ❌ | 레이스 시작 시간 |
| raceEndTime | number \| null | ❌ | 레이스 종료 시간 |
| resetPlayers | boolean | ❌ | **플레이어 선택/준비 상태 초기화 (재경기용)** |

#### resetPlayers 옵션 (재경기 시 사용)

`resetPlayers: true`로 설정하면 모든 플레이어의 상태가 초기화됩니다:
- `selectedPig` → `null` (돼지 선택 해제)
- `isReady` → `false` (준비 상태 해제)

#### 재경기 요청 예시
```json
{
  "playerId": "player_1704067200000_abc123def",
  "status": "waiting",
  "pigs": [
    { "id": 0, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
    { "id": 1, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null },
    ...
  ],
  "countdown": 3,
  "raceStartTime": null,
  "raceEndTime": null,
  "resetPlayers": true
}
```

#### Response 에러
| Status | error | 상황 |
|--------|-------|------|
| 403 | "방장만 게임 상태를 업데이트할 수 있습니다." | hostId가 아닌 경우 |

#### 서버 구현 로직
```javascript
function updateGameState(roomCode, playerId, updates) {
  const room = getRoom(roomCode);
  if (!room) throw new NotFoundError('방을 찾을 수 없습니다.');

  // 1. 방장 확인
  if (room.hostId !== playerId) {
    throw new ForbiddenError('방장만 게임 상태를 업데이트할 수 있습니다.');
  }

  // 2. 상태 업데이트
  if (updates.status) room.status = updates.status;
  if (updates.pigs) room.pigs = updates.pigs;
  if (updates.countdown !== undefined) room.countdown = updates.countdown;
  if (updates.raceStartTime !== undefined) room.raceStartTime = updates.raceStartTime;
  if (updates.raceEndTime !== undefined) room.raceEndTime = updates.raceEndTime;

  // 3. 재경기 시 플레이어 상태 초기화
  if (updates.resetPlayers === true) {
    room.players = room.players.map(player => ({
      ...player,
      selectedPig: null,  // 돼지 선택 해제
      isReady: false      // 준비 상태 해제
    }));
  }

  room.updatedAt = Date.now();

  // 4. 저장 및 이벤트 발행
  saveRoom(roomCode, room);
  emitRoomEvent(roomCode, room);

  return room;
}
```

---

### 9. 방 삭제

게임 방을 삭제합니다 (방장 전용).

**DELETE** `/api/game/rooms/:roomCode`

#### Request Body
```json
{
  "playerId": "player_1704067200000_abc123def"
}
```

#### Response 200 (성공)
```json
{
  "success": true,
  "data": {
    "message": "방이 삭제되었습니다."
  }
}
```

---

## SSE 실시간 스트림

### 10. 방 이벤트 구독 ⭐ 핵심

방의 실시간 상태 변경을 SSE로 수신합니다. **폴링 대신 이 엔드포인트 사용.**

**GET** `/api/game/rooms/:roomCode/events`

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| playerId | string | ✅ | 플레이어 ID |

#### Request Example
```
GET /api/game/rooms/A1B2C3/events?playerId=player_1704067200000_abc123def
```

#### Response Headers
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: *
X-Accel-Buffering: no
```

#### SSE 이벤트 형식

**연결 성공 시 초기 상태 전송:**
```
event: connected
data: {"roomCode":"A1B2C3","status":"waiting",...}

```

**상태 변경 시 업데이트 전송:**
```
event: update
data: {"roomCode":"A1B2C3","status":"racing","pigs":[...],...}

```

**연결 유지 (30초마다):**
```
event: ping
data: {"timestamp":1704067200000}

```

**에러 발생 시:**
```
event: error
data: {"error":"방을 찾을 수 없습니다."}

```

**방 삭제 시:**
```
event: room_deleted
data: {"message":"방이 삭제되었습니다."}

```

**게임 중 방장 변경 시 (host_changed):**
```
event: host_changed
data: {"newHostId":"player_xyz","room":{...전체 GameRoom 객체}}

```

> ⚠️ **중요**: 게임이 진행 중(`countdown` 또는 `racing` 상태)일 때 방장이 나가면 `host_changed` 이벤트가 발생합니다. 새 방장으로 지정된 클라이언트는 이 이벤트를 받으면 **게임 루프(카운트다운/레이스 애니메이션)를 인계받아 실행**해야 합니다.

#### host_changed 이벤트 데이터 구조
```typescript
interface HostChangedEvent {
  newHostId: string;     // 새 방장 플레이어 ID
  room: GameRoom;        // 전체 방 상태 (hostId가 새 방장으로 업데이트됨)
}
```

#### 클라이언트 처리 예시
```typescript
eventSource.addEventListener('host_changed', (e: MessageEvent) => {
  const { newHostId, room } = JSON.parse(e.data);

  // 방 상태 업데이트
  setRoom(room);

  // 내가 새 방장인지 확인
  if (newHostId === myPlayerId) {
    console.log('내가 새 방장이 되었습니다!');

    // 게임 진행 중이면 게임 루프 인계
    if (room.status === 'countdown' || room.status === 'racing') {
      // 카운트다운/레이스 애니메이션 시작
      startGameLoop(room);
    }
  }
});
```

#### 서버 구현 코드 (Node.js + Express)

```javascript
const roomConnections = new Map(); // roomCode -> Set<Response>

app.get('/api/game/rooms/:roomCode/events', (req, res) => {
  const { roomCode } = req.params;
  const { playerId } = req.query;

  // 1. 방 존재 확인
  const room = getRoom(roomCode.toUpperCase());
  if (!room) {
    res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
    return;
  }

  // 2. 플레이어 확인
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    res.status(403).json({ success: false, error: '방에 참가하지 않은 플레이어입니다.' });
    return;
  }

  // 3. SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx 버퍼링 비활성화
  res.flushHeaders();

  // 4. 초기 상태 전송
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify(room)}\n\n`);

  // 5. 연결 저장
  if (!roomConnections.has(roomCode)) {
    roomConnections.set(roomCode, new Set());
  }
  roomConnections.get(roomCode).add(res);

  // 6. 연결 유지를 위한 ping (30초마다)
  const pingInterval = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 30000);

  // 7. 연결 종료 처리
  req.on('close', () => {
    clearInterval(pingInterval);
    const connections = roomConnections.get(roomCode);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        roomConnections.delete(roomCode);
      }
    }
    console.log(`SSE 연결 종료: ${roomCode} / ${playerId}`);
  });
});

// 이벤트 발행 함수
function emitRoomEvent(roomCode, room) {
  const connections = roomConnections.get(roomCode);
  if (!connections) return;

  const data = JSON.stringify(room);
  connections.forEach(res => {
    res.write(`event: update\n`);
    res.write(`data: ${data}\n\n`);
  });
}

// 방 삭제 시 이벤트
function emitRoomDeleted(roomCode) {
  const connections = roomConnections.get(roomCode);
  if (!connections) return;

  connections.forEach(res => {
    res.write(`event: room_deleted\n`);
    res.write(`data: ${JSON.stringify({ message: '방이 삭제되었습니다.' })}\n\n`);
    res.end();
  });
  roomConnections.delete(roomCode);
}
```

#### 클라이언트 사용 예시 (TypeScript)

```typescript
// gameApi.ts
export const subscribeToRoom = (
  roomCode: string,
  playerId: string,
  callbacks: {
    onConnected: (room: GameRoom) => void;
    onUpdate: (room: GameRoom) => void;
    onError: (error: string) => void;
    onDeleted: () => void;
  }
): EventSource => {
  const url = `${API_BASE_URL}/api/game/rooms/${roomCode}/events?playerId=${playerId}`;
  const eventSource = new EventSource(url);

  eventSource.addEventListener('connected', (e: MessageEvent) => {
    const room = JSON.parse(e.data) as GameRoom;
    callbacks.onConnected(room);
  });

  eventSource.addEventListener('update', (e: MessageEvent) => {
    const room = JSON.parse(e.data) as GameRoom;
    callbacks.onUpdate(room);
  });

  eventSource.addEventListener('error', (e: MessageEvent) => {
    if (e.data) {
      const { error } = JSON.parse(e.data);
      callbacks.onError(error);
    }
  });

  eventSource.addEventListener('room_deleted', () => {
    callbacks.onDeleted();
    eventSource.close();
  });

  eventSource.onerror = () => {
    // 자동 재연결 시도됨 (EventSource 기본 동작)
    console.warn('SSE 연결 끊김, 재연결 시도 중...');
  };

  return eventSource;
};

// React 컴포넌트에서 사용
useEffect(() => {
  if (!roomCode || !playerId) return;

  const eventSource = subscribeToRoom(roomCode, playerId, {
    onConnected: (room) => {
      console.log('SSE 연결됨');
      setRoom(room);
    },
    onUpdate: (room) => {
      setRoom(room);
    },
    onError: (error) => {
      console.error('SSE 에러:', error);
      // 폴링으로 폴백 가능
    },
    onDeleted: () => {
      alert('방이 삭제되었습니다.');
      onBack();
    }
  });

  return () => {
    eventSource.close();
  };
}, [roomCode, playerId]);
```

---

## CORS 설정

**반드시 모든 엔드포인트에 CORS 설정 필요!**

### Express.js 설정

```javascript
const cors = require('cors');

// CORS 옵션
const corsOptions = {
  origin: '*', // 또는 특정 도메인: ['https://your-frontend.com']
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Player-ID'],
  credentials: false
};

// 모든 라우트에 CORS 적용
app.use(cors(corsOptions));

// OPTIONS 프리플라이트 요청 처리 (중요!)
app.options('*', cors(corsOptions));
```

### Cloudflare Workers 설정

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Player-ID',
};

// OPTIONS 요청 처리
if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// 응답에 CORS 헤더 추가
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    ...corsHeaders
  }
});
```

---

## 이벤트 발행 시스템

### 이벤트 발행이 필요한 API

| API | 이벤트 발행 | 설명 |
|-----|------------|------|
| POST /rooms | ❌ | 방 생성자만 알면 됨 |
| POST /rooms/:code/join | ✅ | 새 플레이어 입장 알림 |
| POST /rooms/:code/leave | ✅ | 플레이어 퇴장 알림 |
| POST /rooms/:code/select-pig | ✅ | 돼지 선택 변경 알림 |
| POST /rooms/:code/ready | ✅ | 준비 상태 변경 알림 |
| POST /rooms/:code/start | ✅ | 게임 시작 알림 |
| PUT /rooms/:code/state | ✅ | 게임 상태 업데이트 (레이스 중 100ms마다) |
| DELETE /rooms/:code | ✅ | 방 삭제 알림 (room_deleted 이벤트) |

### 이벤트 발행 구현

```javascript
const EventEmitter = require('events');
const roomEvents = new EventEmitter();

// 구독 시 사용
roomEvents.on(`room:${roomCode}`, (room) => {
  // SSE로 전송
});

// API에서 사용
function emitRoomEvent(roomCode, room) {
  roomEvents.emit(`room:${roomCode}`, room);

  // SSE 연결된 클라이언트에 전송
  const connections = roomConnections.get(roomCode);
  if (connections) {
    const data = JSON.stringify(room);
    connections.forEach(res => {
      res.write(`event: update\n`);
      res.write(`data: ${data}\n\n`);
    });
  }
}
```

---

## 서버 구현 가이드

### 파일 구조

```
/server
├── index.js                 # 메인 서버
├── routes/
│   └── game.js             # 게임 API 라우터
├── services/
│   ├── roomService.js      # 방 관리 로직
│   └── sseService.js       # SSE 관리
├── data/
│   └── rooms/              # 방 데이터 저장
│       ├── A1B2C3.json
│       └── X9Y8Z7.json
└── utils/
    ├── roomCode.js         # 방 코드 생성
    └── errors.js           # 커스텀 에러
```

### 방 코드 생성

```javascript
// utils/roomCode.js
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateUniqueRoomCode(existingCodes) {
  let code;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = generateRoomCode();
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('방 코드 생성 실패');
    }
  } while (existingCodes.has(code));

  return code;
}
```

### 파일 저장/읽기

```javascript
// services/roomService.js
const fs = require('fs').promises;
const path = require('path');

const ROOMS_DIR = path.join(__dirname, '../data/rooms');

async function ensureRoomsDir() {
  try {
    await fs.mkdir(ROOMS_DIR, { recursive: true });
  } catch (err) {
    // 이미 존재하면 무시
  }
}

async function saveRoom(roomCode, room) {
  await ensureRoomsDir();
  const filePath = path.join(ROOMS_DIR, `${roomCode}.json`);
  await fs.writeFile(filePath, JSON.stringify(room, null, 2));
}

async function getRoom(roomCode) {
  try {
    const filePath = path.join(ROOMS_DIR, `${roomCode}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

async function deleteRoom(roomCode) {
  try {
    const filePath = path.join(ROOMS_DIR, `${roomCode}.json`);
    await fs.unlink(filePath);
  } catch (err) {
    // 파일이 없으면 무시
  }
}

async function getAllRoomCodes() {
  await ensureRoomsDir();
  const files = await fs.readdir(ROOMS_DIR);
  return new Set(files.map(f => f.replace('.json', '')));
}
```

### 자동 정리

```javascript
// 30분 이상 업데이트 없는 방 삭제
async function cleanupOldRooms() {
  const THIRTY_MINUTES = 30 * 60 * 1000;
  const now = Date.now();

  const roomCodes = await getAllRoomCodes();

  for (const code of roomCodes) {
    const room = await getRoom(code);
    if (room && now - room.updatedAt > THIRTY_MINUTES) {
      await deleteRoom(code);
      emitRoomDeleted(code);
      console.log(`오래된 방 삭제: ${code}`);
    }
  }
}

// 5분마다 실행
setInterval(cleanupOldRooms, 5 * 60 * 1000);
```

### 완전한 Express 서버 예시

```javascript
// index.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Player-ID'],
}));
app.options('*', cors());
app.use(express.json());

// 인메모리 저장소 (프로덕션에서는 파일 또는 DB 사용)
const rooms = new Map();
const roomConnections = new Map(); // SSE 연결

// 유틸리티 함수
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function emitRoomEvent(roomCode, room) {
  const connections = roomConnections.get(roomCode);
  if (!connections) return;

  const data = JSON.stringify(room);
  connections.forEach(res => {
    res.write(`event: update\n`);
    res.write(`data: ${data}\n\n`);
  });
}

// API 라우트
// 1. 방 생성
app.post('/api/game/rooms', (req, res) => {
  const { playerId, playerName, maxPlayers = 6 } = req.body;

  if (!playerId || !playerName) {
    return res.status(400).json({ success: false, error: '플레이어 정보가 필요합니다.' });
  }

  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  const room = {
    roomCode,
    hostId: playerId,
    status: 'waiting',
    players: [{
      id: playerId,
      name: playerName,
      selectedPig: null,
      isReady: false,
      joinedAt: Date.now()
    }],
    pigs: Array.from({ length: 10 }, (_, i) => ({
      id: i,
      position: 0,
      speed: 0,
      status: 'normal',
      finishTime: null,
      rank: null
    })),
    maxPlayers: Math.min(Math.max(maxPlayers, 2), 10),
    raceStartTime: null,
    raceEndTime: null,
    countdown: 3,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  rooms.set(roomCode, room);
  res.json({ success: true, data: room });
});

// 2. 방 입장
app.post('/api/game/rooms/:roomCode/join', (req, res) => {
  const { roomCode } = req.params;
  const { playerId, playerName } = req.body;

  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  if (!['waiting', 'selecting'].includes(room.status)) {
    return res.status(409).json({ success: false, error: '게임이 이미 시작되었습니다.' });
  }

  const existing = room.players.find(p => p.id === playerId);
  if (existing) {
    return res.json({ success: true, data: room });
  }

  if (room.players.length >= room.maxPlayers) {
    return res.status(409).json({ success: false, error: '방이 가득 찼습니다.' });
  }

  room.players.push({
    id: playerId,
    name: playerName,
    selectedPig: null,
    isReady: false,
    joinedAt: Date.now()
  });
  room.updatedAt = Date.now();

  emitRoomEvent(roomCode, room);
  res.json({ success: true, data: room });
});

// 3. 방 퇴장
app.post('/api/game/rooms/:roomCode/leave', (req, res) => {
  const { roomCode } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  room.players = room.players.filter(p => p.id !== playerId);

  if (room.players.length === 0) {
    rooms.delete(roomCode);
    return res.json({ success: true, data: { message: '방이 삭제되었습니다.' } });
  }

  if (room.hostId === playerId) {
    room.players.sort((a, b) => a.joinedAt - b.joinedAt);
    room.hostId = room.players[0].id;
  }

  room.updatedAt = Date.now();
  emitRoomEvent(roomCode, room);
  res.json({ success: true, data: { message: '방에서 나갔습니다.' } });
});

// 4. 방 상태 조회
app.get('/api/game/rooms/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const room = rooms.get(roomCode.toUpperCase());

  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  res.json({ success: true, data: room });
});

// 5. 돼지 선택
app.post('/api/game/rooms/:roomCode/select-pig', (req, res) => {
  const { roomCode } = req.params;
  const { playerId, pigId } = req.body;

  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  if (pigId < 0 || pigId > 9) {
    return res.status(400).json({ success: false, error: '잘못된 돼지 번호입니다.' });
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ success: false, error: '플레이어를 찾을 수 없습니다.' });
  }

  const alreadySelected = room.players.find(p => p.selectedPig === pigId && p.id !== playerId);
  if (alreadySelected) {
    return res.status(409).json({ success: false, error: '이미 다른 플레이어가 선택한 돼지입니다.' });
  }

  player.selectedPig = pigId;
  room.updatedAt = Date.now();

  emitRoomEvent(roomCode, room);
  res.json({ success: true, data: room });
});

// 6. 준비 완료
app.post('/api/game/rooms/:roomCode/ready', (req, res) => {
  const { roomCode } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ success: false, error: '플레이어를 찾을 수 없습니다.' });
  }

  if (player.id === room.hostId) {
    player.isReady = true;
  } else {
    player.isReady = !player.isReady;
  }

  room.updatedAt = Date.now();

  emitRoomEvent(roomCode, room);
  res.json({ success: true, data: room });
});

// 7. 게임 시작
app.post('/api/game/rooms/:roomCode/start', (req, res) => {
  const { roomCode } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  if (room.hostId !== playerId) {
    return res.status(403).json({ success: false, error: '방장만 게임을 시작할 수 있습니다.' });
  }

  if (room.players.length < 2) {
    return res.status(422).json({ success: false, error: '최소 2명의 플레이어가 필요합니다.' });
  }

  const notReady = room.players.filter(p => p.id !== room.hostId && !p.isReady);
  if (notReady.length > 0) {
    return res.status(422).json({ success: false, error: '모든 플레이어가 준비를 완료해야 합니다.' });
  }

  room.status = 'countdown';
  room.countdown = 3;
  room.updatedAt = Date.now();

  emitRoomEvent(roomCode, room);
  res.json({ success: true, data: room });
});

// 8. 게임 상태 업데이트
app.put('/api/game/rooms/:roomCode/state', (req, res) => {
  const { roomCode } = req.params;
  const { playerId, status, pigs, countdown, raceStartTime, raceEndTime } = req.body;

  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  if (room.hostId !== playerId) {
    return res.status(403).json({ success: false, error: '방장만 게임 상태를 업데이트할 수 있습니다.' });
  }

  if (status) room.status = status;
  if (pigs) room.pigs = pigs;
  if (countdown !== undefined) room.countdown = countdown;
  if (raceStartTime) room.raceStartTime = raceStartTime;
  if (raceEndTime) room.raceEndTime = raceEndTime;

  room.updatedAt = Date.now();

  emitRoomEvent(roomCode, room);
  res.json({ success: true, data: room });
});

// 9. 방 삭제
app.delete('/api/game/rooms/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const { playerId } = req.body;

  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  if (room.hostId !== playerId) {
    return res.status(403).json({ success: false, error: '방장만 방을 삭제할 수 있습니다.' });
  }

  // SSE 클라이언트에 삭제 알림
  const connections = roomConnections.get(roomCode);
  if (connections) {
    connections.forEach(res => {
      res.write(`event: room_deleted\n`);
      res.write(`data: ${JSON.stringify({ message: '방이 삭제되었습니다.' })}\n\n`);
      res.end();
    });
    roomConnections.delete(roomCode);
  }

  rooms.delete(roomCode);
  res.json({ success: true, data: { message: '방이 삭제되었습니다.' } });
});

// 10. SSE 이벤트 구독 ⭐
app.get('/api/game/rooms/:roomCode/events', (req, res) => {
  const { roomCode } = req.params;
  const { playerId } = req.query;

  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(403).json({ success: false, error: '방에 참가하지 않은 플레이어입니다.' });
  }

  // SSE 헤더
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // 초기 상태 전송
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify(room)}\n\n`);

  // 연결 저장
  if (!roomConnections.has(roomCode)) {
    roomConnections.set(roomCode, new Set());
  }
  roomConnections.get(roomCode).add(res);

  console.log(`SSE 연결: ${roomCode} / ${playerId}`);

  // Ping (30초마다)
  const pingInterval = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 30000);

  // 연결 종료
  req.on('close', () => {
    clearInterval(pingInterval);
    const connections = roomConnections.get(roomCode);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        roomConnections.delete(roomCode);
      }
    }
    console.log(`SSE 연결 종료: ${roomCode} / ${playerId}`);
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
```

---

## 에러 코드

| HTTP Status | error 메시지 | 상황 |
|-------------|-------------|------|
| 400 | "플레이어 정보가 필요합니다." | playerId 또는 playerName 누락 |
| 400 | "잘못된 돼지 번호입니다." | pigId가 0-9 범위 밖 |
| 403 | "방장만 게임을 시작할 수 있습니다." | 방장이 아닌 사람이 시작 요청 |
| 403 | "방장만 게임 상태를 업데이트할 수 있습니다." | 방장이 아닌 사람이 상태 업데이트 |
| 403 | "방장만 방을 삭제할 수 있습니다." | 방장이 아닌 사람이 삭제 요청 |
| 403 | "방에 참가하지 않은 플레이어입니다." | SSE 연결 시 방에 없는 플레이어 |
| 404 | "방을 찾을 수 없습니다." | 존재하지 않는 roomCode |
| 404 | "플레이어를 찾을 수 없습니다." | 방에 없는 playerId |
| 409 | "방이 가득 찼습니다." | maxPlayers 초과 |
| 409 | "게임이 이미 시작되었습니다." | waiting/selecting이 아닌 상태에서 입장 시도 |
| 409 | "이미 다른 플레이어가 선택한 돼지입니다." | 중복 돼지 선택 |
| 409 | "돼지를 선택할 수 없는 상태입니다." | 게임 진행 중 돼지 선택 시도 |
| 409 | "준비 상태를 변경할 수 없습니다." | 게임 진행 중 준비 토글 시도 |
| 422 | "최소 2명의 플레이어가 필요합니다." | 1명일 때 게임 시작 |
| 422 | "모든 플레이어가 준비를 완료해야 합니다." | 미준비 플레이어 존재 |

---

## 게임 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                           게임 흐름도                                │
└─────────────────────────────────────────────────────────────────────┘

1. 방 생성 (POST /api/game/rooms)
   └─ 방장이 방 생성
   └─ status: "waiting"
   └─ 방장은 SSE 연결 (GET /api/game/rooms/:code/events)

2. 플레이어 입장 (POST /api/game/rooms/:code/join)
   └─ 방 코드 입력하여 입장
   └─ status: "waiting"
   └─ 입장 후 SSE 연결
   └─ 모든 클라이언트에 SSE로 플레이어 목록 업데이트

3. 돼지 선택 (POST /api/game/rooms/:code/select-pig)
   └─ 각 플레이어가 돼지 선택
   └─ SSE로 선택 현황 실시간 동기화

4. 준비 완료 (POST /api/game/rooms/:code/ready)
   └─ 방장 제외 모든 플레이어가 준비
   └─ SSE로 준비 상태 실시간 동기화

5. 게임 시작 - 방장만 (POST /api/game/rooms/:code/start)
   └─ 모든 플레이어 준비 완료 시 시작 가능
   └─ status: "countdown"
   └─ SSE로 모든 클라이언트에 카운트다운 시작 알림

6. 카운트다운 + 레이스 진행
   └─ 방장이 상태 업데이트 (PUT /api/game/rooms/:code/state)
   └─ status: "countdown" → "racing" → "finished"
   └─ 100ms마다 SSE로 모든 클라이언트에 돼지 위치 동기화

7. 결과 확인
   └─ status: "finished"
   └─ 최종 순위 표시

┌─────────────────────────────────────────────────────────────────────┐
│                        상태 전이 다이어그램                          │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────┐   게임 시작   ┌───────────┐   카운트다운   ┌─────────┐
  │ waiting  │ ───────────→ │ countdown │ ────────────→ │ racing  │
  └──────────┘              └───────────┘   완료 (0)     └─────────┘
       │                                                      │
       │ (선택적)                                              │ 모든 돼지
       ↓                                                      │ 완주
  ┌───────────┐                                              ↓
  │ selecting │                                         ┌──────────┐
  └───────────┘                                         │ finished │
                                                        └──────────┘
```

---

## 테스트 시나리오

### 시나리오 1: 기본 게임 플로우 (SSE)

```bash
# 1. 플레이어 A가 방 생성
curl -X POST http://localhost:3000/api/game/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a","playerName":"호스트"}'

# 응답: roomCode = "A1B2C3"

# 2. 플레이어 A가 SSE 연결
curl -N "http://localhost:3000/api/game/rooms/A1B2C3/events?playerId=player_a"

# 3. 플레이어 B가 입장 (다른 터미널)
curl -X POST http://localhost:3000/api/game/rooms/A1B2C3/join \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b","playerName":"참가자"}'

# → A의 SSE에서 자동으로 update 이벤트 수신

# 4. 플레이어 B가 SSE 연결
curl -N "http://localhost:3000/api/game/rooms/A1B2C3/events?playerId=player_b"

# 5. A, B 각각 돼지 선택
curl -X POST http://localhost:3000/api/game/rooms/A1B2C3/select-pig \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a","pigId":0}'

curl -X POST http://localhost:3000/api/game/rooms/A1B2C3/select-pig \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b","pigId":1}'

# 6. B가 준비 완료
curl -X POST http://localhost:3000/api/game/rooms/A1B2C3/ready \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b"}'

# 7. A(방장)가 게임 시작
curl -X POST http://localhost:3000/api/game/rooms/A1B2C3/start \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a"}'

# 8. A가 게임 상태 업데이트 (레이스 중)
curl -X PUT http://localhost:3000/api/game/rooms/A1B2C3/state \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a","status":"racing","pigs":[...]}'
```

### 시나리오 2: SSE 연결 테스트 (브라우저)

```javascript
// 브라우저 콘솔에서 테스트
const eventSource = new EventSource(
  'http://localhost:3000/api/game/rooms/A1B2C3/events?playerId=player_a'
);

eventSource.addEventListener('connected', (e) => {
  console.log('연결됨:', JSON.parse(e.data));
});

eventSource.addEventListener('update', (e) => {
  console.log('업데이트:', JSON.parse(e.data));
});

eventSource.addEventListener('ping', (e) => {
  console.log('ping:', JSON.parse(e.data));
});

eventSource.onerror = (e) => {
  console.error('에러:', e);
};
```

### 시나리오 3: 방장 이탈 테스트

1. A가 방 생성, B, C가 입장
2. A가 퇴장 (POST /leave)
3. B가 새 방장이 됨 (joinedAt 기준)
4. SSE로 모든 클라이언트에 hostId 변경 알림

### 시나리오 4: CORS 테스트

```javascript
// 다른 도메인에서 API 호출 테스트
fetch('http://localhost:3000/api/game/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    playerId: 'test_player',
    playerName: '테스트'
  })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
```

---

## 주의사항

1. **SSE 연결 관리**
   - 클라이언트 연결 종료 시 반드시 정리
   - 메모리 누수 방지를 위해 연결 맵 관리 필수
   - nginx 사용 시 `X-Accel-Buffering: no` 헤더 필수

2. **CORS 설정**
   - 모든 엔드포인트에 CORS 헤더 필수
   - OPTIONS 프리플라이트 요청 처리 필수
   - SSE 엔드포인트도 CORS 적용

3. **방 코드 충돌**
   - 생성 시 반드시 기존 코드와 중복 체크
   - 대소문자 구분 없이 처리 (toUpperCase)

4. **시간 동기화**
   - 모든 timestamp는 서버 시간 기준
   - 클라이언트 시간 의존 금지

5. **상태 전이 규칙**
   - waiting → selecting → countdown → racing → finished
   - waiting에서 바로 countdown 가능 (selecting 생략)
   - 역방향 전이 불가

6. **방장 권한**
   - 게임 시작: 방장만
   - 상태 업데이트: 방장만
   - 방 삭제: 방장만
   - 방장 이탈 시 자동 위임

7. **자동 정리**
   - 30분 이상 업데이트 없는 방 자동 삭제
   - 정리 시 SSE로 room_deleted 이벤트 발행

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2024-01-01 | 최초 작성 (폴링 방식) |
| v2.0 | 2024-01-08 | SSE 방식으로 전환, CORS 설정 추가, 완전한 서버 구현 예시 추가 |
| v2.1 | 2025-01-08 | 돼지 선택 해제 기능 추가 (pigId: -1), 재경기 시 플레이어 초기화 옵션 추가 (resetPlayers), 게임 중 방장 변경 시 host_changed 이벤트 추가 |
