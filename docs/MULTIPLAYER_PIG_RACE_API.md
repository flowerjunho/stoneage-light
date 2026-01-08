# 멀티플레이어 돼지 레이스 API 명세서 v3.0

## 개요

멀티플레이어 돼지 레이스 게임을 위한 백엔드 API 명세서입니다.
**실시간 동기화는 SSE(Server-Sent Events) 방식**으로 구현되며, 폴링 대비 서버 부하 90% 감소 및 실시간 응답이 가능합니다.

## 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `/api/game` |
| Content-Type | `application/json` |
| SSE Content-Type | `text/event-stream` |
| 저장 방식 | JSON 파일 (`game-rooms/` 디렉토리) |
| 게임 모드 | `normal` (일반 레이스), `relay` (릴레이 레이스) |

---

## 목차

1. [게임 모드](#게임-모드)
2. [데이터 구조](#데이터-구조)
3. [REST API 엔드포인트](#rest-api-엔드포인트)
4. [SSE 실시간 스트림](#sse-실시간-스트림)
5. [CORS 설정](#cors-설정)
6. [에러 코드](#에러-코드)
7. [게임 흐름도](#게임-흐름도)
8. [테스트 시나리오](#테스트-시나리오)

---

## 게임 모드

### 일반 모드 (normal)
- 각 플레이어가 1마리씩 돼지를 선택하여 레이스
- 먼저 결승선에 도달하는 돼지가 우승
- 편도 레이스 (0 → 100)

### 릴레이 모드 (relay) ⭐ NEW
- 팀 대항전 (A팀 vs B팀)
- 각 팀에 돼지 1마리씩 (총 2마리 고정)
- **왕복 레이스**: 출발 → 결승선 → 출발점 복귀
- 한 주자가 왕복 완료하면 다음 주자가 출발
- 마지막 주자가 먼저 복귀하는 팀 승리

**릴레이 레이스 흐름:**
```
1번 주자: 0 → 100 → 0 (왕복 완료) → 2번 주자에게 바통 전달
2번 주자: 0 → 100 → 0 (왕복 완료) → 3번 주자에게 바통 전달
...
마지막 주자: 0 → 100 → 0 (왕복 완료) → 팀 완주!
```

---

## 데이터 구조

### Player (플레이어)

```typescript
interface Player {
  id: string;                    // 플레이어 고유 ID (클라이언트에서 생성)
  name: string;                  // 닉네임 (2-10자)
  selectedPig: number | null;    // 선택한 돼지 색상 번호 (0-29, null이면 미선택)
  isReady: boolean;              // 준비 완료 여부
  isSpectator: boolean;          // 관전자 여부
  team: 'A' | 'B' | null;        // 릴레이 모드: 소속 팀
  runnerOrder: number | null;    // 릴레이 모드: 주자 순서 (1, 2, 3...)
  joinedAt: number;              // 입장 시간 (Unix timestamp ms)
}
```

### PigState (일반 모드 돼지 상태)

```typescript
interface PigState {
  id: number;                    // 돼지 번호 (0 ~ 플레이어수-1, 동적으로 증감)
  position: number;              // 현재 위치 (0-100, 100이면 완주)
  speed: number;                 // 현재 속도
  status: PigStatus;             // 현재 상태
  finishTime: number | null;     // 완주 시간 (ms), null이면 미완주
  rank: number | null;           // 순위, null이면 미완주
}

type PigStatus = 'normal' | 'boost' | 'superBoost' | 'turbo' | 'tired' | 'slip';
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

### RelayPigState (릴레이 모드 돼지 상태) ⭐ NEW

```typescript
interface RelayPigState {
  id: number;                    // 돼지 번호 (0: A팀, 1: B팀)
  team: 'A' | 'B';               // 소속 팀
  position: number;              // 현재 위치 (0-100)
  speed: number;                 // 현재 속도
  status: PigStatus;             // 현재 상태
  direction: 'forward' | 'backward'; // 이동 방향 (forward: 0→100, backward: 100→0)
  finishTime: number | null;     // 팀 최종 완주 시간
  rank: number | null;           // 팀 순위 (1등 또는 2등)
}
```

> **일반 모드**: 돼지 수 = 참가자 수 (동적 증감)
> **릴레이 모드**: 돼지 수 = 2마리 (팀당 1마리, 고정)

### RelayState (릴레이 모드 전용) ⭐ NEW

```typescript
interface RelayState {
  teamA: TeamRelayState;
  teamB: TeamRelayState;
}

interface TeamRelayState {
  currentRunner: number;         // 현재 달리는 주자 순서 (1부터 시작)
  completedRunners: number;      // 완주한 주자 수
  totalRunners: number;          // 총 주자 수
  finishTime: number | null;     // 팀 완주 시간
}
```

### GameRoom (게임 방)

```typescript
interface GameRoom {
  roomCode: string;              // 6자리 방 코드 (예: "A1B2C3")
  hostId: string;                // 방장 플레이어 ID
  gameMode: 'normal' | 'relay';  // ⭐ 게임 모드
  status: GameStatus;            // 게임 상태
  players: Player[];             // 참가자 목록 (최대 30명)
  pigs: PigState[] | RelayPigState[]; // 돼지 상태
  maxPlayers: number;            // 최대 인원 (2-30)
  raceStartTime: number | null;  // 레이스 시작 시간
  raceEndTime: number | null;    // 레이스 종료 시간
  countdown: number;             // 카운트다운 (3, 2, 1, 0)
  relay: RelayState | null;      // ⭐ 릴레이 모드 전용 상태 (일반 모드면 null)
  createdAt: number;             // 방 생성 시간
  updatedAt: number;             // 마지막 업데이트 시간
}

type GameStatus = 'waiting' | 'selecting' | 'countdown' | 'racing' | 'finished';
```

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

새 게임 방을 만들고 방장이 됩니다.

```
POST /api/game/rooms
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123",
  "playerName": "닉네임",
  "maxPlayers": 6,
  "gameMode": "normal"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| playerId | string | O | 플레이어 고유 ID |
| playerName | string | O | 닉네임 (2-10자) |
| maxPlayers | number | X | 최대 인원 (기본값: 6, 범위: 2-30) |
| gameMode | string | X | 게임 모드: `normal` (기본값) 또는 `relay` |

**Response 200 (일반 모드):**
```json
{
  "success": true,
  "data": {
    "roomCode": "A1B2C3",
    "hostId": "player_1704067200000_abc123",
    "gameMode": "normal",
    "status": "waiting",
    "players": [
      {
        "id": "player_1704067200000_abc123",
        "name": "닉네임",
        "selectedPig": null,
        "isReady": false,
        "isSpectator": false,
        "team": null,
        "runnerOrder": null,
        "joinedAt": 1704067200000
      }
    ],
    "pigs": [
      {"id": 0, "position": 0, "speed": 0, "status": "normal", "finishTime": null, "rank": null}
    ],
    "maxPlayers": 6,
    "raceStartTime": null,
    "raceEndTime": null,
    "countdown": 3,
    "relay": null,
    "createdAt": 1704067200000,
    "updatedAt": 1704067200000
  }
}
```

**Response 200 (릴레이 모드):**
```json
{
  "success": true,
  "data": {
    "roomCode": "A1B2C3",
    "hostId": "player_1704067200000_abc123",
    "gameMode": "relay",
    "status": "waiting",
    "players": [...],
    "pigs": [
      {"id": 0, "team": "A", "position": 0, "speed": 0, "status": "normal", "direction": "forward", "finishTime": null, "rank": null},
      {"id": 1, "team": "B", "position": 0, "speed": 0, "status": "normal", "direction": "forward", "finishTime": null, "rank": null}
    ],
    "relay": {
      "teamA": {"currentRunner": 1, "completedRunners": 0, "totalRunners": 0, "finishTime": null},
      "teamB": {"currentRunner": 1, "completedRunners": 0, "totalRunners": 0, "finishTime": null}
    },
    ...
  }
}
```

> **일반 모드**: 방장 1명이므로 돼지 1마리 생성, 입장/퇴장 시 동적 증감
> **릴레이 모드**: 돼지 2마리 고정 (팀당 1마리), 입장/퇴장해도 변화 없음

**Response 400:**
```json
{"success": false, "error": "플레이어 정보가 필요합니다."}
{"success": false, "error": "닉네임은 2-10자 사이여야 합니다."}
{"success": false, "error": "게임 모드는 normal 또는 relay만 가능합니다."}
```

---

### 2. 방 입장

기존 방에 참가합니다. 관전자로 입장할 수도 있습니다.

```
POST /api/game/rooms/:roomCode/join
```

**URL Parameters:**
| 파라미터 | 설명 |
|----------|------|
| roomCode | 6자리 방 코드 (대소문자 무관) |

**Request Body:**
```json
{
  "playerId": "player_1704067260000_xyz789",
  "playerName": "참가자",
  "isSpectator": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| playerId | string | O | 플레이어 고유 ID |
| playerName | string | O | 닉네임 (2-10자) |
| isSpectator | boolean | X | 관전자 여부 (기본값: false) |

**Response 200:**
```json
{
  "success": true,
  "data": { /* GameRoom 객체 (players에 새 플레이어 추가됨) */ }
}
```

> - **참가자**로 입장 시 돼지도 1마리 추가됩니다.
> - **관전자**로 입장 시 돼지는 추가되지 않습니다. 관전자는 돼지 선택/준비가 불가합니다.

**Response 404:**
```json
{"success": false, "error": "방을 찾을 수 없습니다."}
```

**Response 409:**
```json
{"success": false, "error": "방이 가득 찼습니다."}
{"success": false, "error": "게임이 이미 시작되었습니다."}
```

---

### 3. 방 퇴장

방에서 나갑니다. 방장이 나가면 다음 참가자가 방장이 됩니다.

```
POST /api/game/rooms/:roomCode/leave
```

**Request Body:**
```json
{
  "playerId": "player_1704067260000_xyz789"
}
```

**Response 200:**
```json
{"success": true, "data": {"message": "방에서 나갔습니다."}}
```

마지막 플레이어가 나가면:
```json
{"success": true, "data": {"message": "방이 삭제되었습니다."}}
```

---

### 4. 플레이어 강퇴 (방장 전용)

방장이 준비하지 않은 플레이어 등을 강퇴합니다. 대기/선택 상태에서만 가능합니다.

```
POST /api/game/rooms/:roomCode/kick
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123",
  "targetPlayerId": "player_1704067260000_xyz789"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| playerId | string | 방장의 플레이어 ID |
| targetPlayerId | string | 강퇴할 플레이어의 ID |

**Response 200:**
```json
{
  "success": true,
  "message": "닉네임님을 강퇴했습니다.",
  "data": { /* GameRoom 객체 */ }
}
```

**Response 403:**
```json
{"success": false, "error": "방장만 강퇴할 수 있습니다."}
```

**Response 409:**
```json
{"success": false, "error": "게임 중에는 강퇴할 수 없습니다."}
```

> 강퇴된 플레이어는 `kicked` SSE 이벤트를 수신합니다.

---

### 5. 방 상태 조회

현재 방 상태를 조회합니다. (SSE 연결 전 초기 상태 확인용)

```
GET /api/game/rooms/:roomCode
```

**Response 200:**
```json
{
  "success": true,
  "data": { /* GameRoom 객체 */ }
}
```

**Response 404:**
```json
{"success": false, "error": "방을 찾을 수 없습니다."}
```

---

### 6. 팀 선택 (릴레이 모드 전용) ⭐ NEW

릴레이 모드에서 A팀 또는 B팀을 선택합니다.

```
POST /api/game/rooms/:roomCode/select-team
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123",
  "team": "A"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| playerId | string | O | 플레이어 ID |
| team | string | O | 선택할 팀: `"A"` 또는 `"B"` |

**Response 200:**
```json
{
  "success": true,
  "data": { /* GameRoom 객체 (해당 플레이어의 team이 변경됨) */ }
}
```

**Response 400:**
```json
{"success": false, "error": "팀은 A 또는 B만 선택할 수 있습니다."}
```

**Response 409:**
```json
{"success": false, "error": "릴레이 모드에서만 팀을 선택할 수 있습니다."}
{"success": false, "error": "대기 중일 때만 팀을 선택할 수 있습니다."}
{"success": false, "error": "관전자는 팀을 선택할 수 없습니다."}
```

> **팀 변경 시 주자 순서 자동 초기화**: 팀을 변경하면 기존 runnerOrder가 `null`로 초기화됩니다.

---

### 7. 주자 순서 일괄 배정 (방장 전용, 릴레이 모드) ⭐ NEW

릴레이 모드에서 방장이 게임 시작 전 모든 플레이어의 주자 순서를 한번에 배정합니다.
프론트엔드에서 랜덤 순서를 생성하여 이 API로 일괄 배정합니다.

```
POST /api/game/rooms/:roomCode/assign-runner-orders
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123",
  "assignments": [
    { "playerId": "player_a", "order": 1 },
    { "playerId": "player_b", "order": 2 },
    { "playerId": "player_c", "order": 1 },
    { "playerId": "player_d", "order": 2 }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| playerId | string | O | 방장의 플레이어 ID |
| assignments | array | O | 플레이어별 주자 순서 배열 |
| assignments[].playerId | string | O | 대상 플레이어 ID |
| assignments[].order | number | O | 주자 순서 (1부터 시작) |

**Response 200:**
```json
{
  "success": true,
  "data": { /* GameRoom 객체 (모든 플레이어의 runnerOrder가 배정됨) */ }
}
```

**Response 403:**
```json
{"success": false, "error": "방장만 주자 순서를 배정할 수 있습니다."}
```

**Response 409:**
```json
{"success": false, "error": "릴레이 모드에서만 주자 순서를 배정할 수 있습니다."}
{"success": false, "error": "대기 중일 때만 주자 순서를 배정할 수 있습니다."}
```

**Response 422:**
```json
{"success": false, "error": "같은 팀 내에서 순서가 중복되었습니다."}
{"success": false, "error": "A팀의 주자 순서가 올바르지 않습니다. 1부터 연속된 번호여야 합니다."}
```

**서버 구현 요구사항:**
1. `playerId`가 방장(`hostId`)인지 검증
2. `gameMode`가 `relay`인지 검증
3. `status`가 `waiting`인지 검증
4. 각 플레이어가 방에 존재하는지 검증
5. 각 플레이어의 `runnerOrder` 필드를 업데이트
6. 같은 팀 내에서 순서 중복 검증
7. 각 팀의 순서가 1부터 연속되어야 함 검증 (예: 1,2,3 ✓ / 1,3 ✗)

**서버 구현 예시:**
```javascript
function assignRunnerOrders(roomCode, playerId, assignments) {
  const room = getRoom(roomCode);
  if (!room) throw new NotFoundError('방을 찾을 수 없습니다.');

  // 1. 권한 확인 (방장만)
  if (room.hostId !== playerId) {
    throw new ForbiddenError('방장만 주자 순서를 배정할 수 있습니다.');
  }

  // 2. 게임 모드 확인
  if (room.gameMode !== 'relay') {
    throw new ConflictError('릴레이 모드에서만 주자 순서를 배정할 수 있습니다.');
  }

  // 3. 상태 확인
  if (room.status !== 'waiting') {
    throw new ConflictError('대기 중일 때만 주자 순서를 배정할 수 있습니다.');
  }

  // 4. 배정 적용
  const teamAOrders = [];
  const teamBOrders = [];

  for (const assignment of assignments) {
    const player = room.players.find(p => p.id === assignment.playerId);
    if (!player) {
      throw new NotFoundError(`플레이어를 찾을 수 없습니다: ${assignment.playerId}`);
    }

    player.runnerOrder = assignment.order;

    // 팀별 순서 수집 (검증용)
    if (player.team === 'A') teamAOrders.push(assignment.order);
    if (player.team === 'B') teamBOrders.push(assignment.order);
  }

  // 5. 순서 연속성 검증
  const validateOrders = (orders, teamName) => {
    if (orders.length === 0) return;
    orders.sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new UnprocessableError(
          `${teamName}팀의 주자 순서가 올바르지 않습니다. 1부터 연속된 번호여야 합니다.`
        );
      }
    }
  };

  validateOrders(teamAOrders, 'A');
  validateOrders(teamBOrders, 'B');

  room.updatedAt = Date.now();
  saveRoom(roomCode, room);
  emitRoomEvent(roomCode, room);

  return room;
}
```

---

### 8. 돼지(색상) 선택

플레이어가 돼지 색상을 선택합니다. **같은 돼지를 다시 선택하면 선택이 해제됩니다 (토글).**

일반 모드에서는 돼지 번호를 선택하고, 릴레이 모드에서는 돼지 색상만 선택합니다.

```
POST /api/game/rooms/:roomCode/select-pig
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123",
  "pigId": 3
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| playerId | string | 플레이어 ID |
| pigId | number | 돼지 번호 (일반: 0~플레이어수-1, 릴레이: 색상 번호 0-29) |

**동작 방식:**
- **새 돼지 선택**: `selectedPig`가 해당 번호로 설정됨
- **같은 돼지 재선택**: `selectedPig`가 `null`로 설정됨 (선택 해제)
- **다른 돼지로 변경**: 기존 선택 해제 후 새 돼지 선택

**Response 200:**
```json
{
  "success": true,
  "data": { /* GameRoom 객체 (해당 플레이어의 selectedPig가 변경됨) */ }
}
```

**Response 400:**
```json
{"success": false, "error": "잘못된 돼지 번호입니다."}
```

**Response 409:**
```json
{"success": false, "error": "이미 다른 플레이어가 선택한 돼지입니다."}
{"success": false, "error": "돼지를 선택할 수 없는 상태입니다."}
```

---

### 9. 준비 완료/해제

준비 상태를 토글합니다. 방장은 항상 준비 상태입니다.

> **참가자, 관전자 모두 준비 가능**합니다. 돼지를 선택하지 않아도 준비할 수 있습니다.

```
POST /api/game/rooms/:roomCode/ready
```

**Request Body:**
```json
{
  "playerId": "player_1704067260000_xyz789"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { /* GameRoom 객체 (해당 플레이어의 isReady가 토글됨) */ }
}
```

**Response 409:**
```json
{"success": false, "error": "준비 상태를 변경할 수 없습니다."}
```

---

### 10. 게임 시작 (방장 전용)

게임을 시작합니다. 모든 플레이어가 준비 완료해야 합니다.

```
POST /api/game/rooms/:roomCode/start
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { /* GameRoom 객체 (status: "countdown", countdown: 3) */ }
}
```

**Response 403:**
```json
{"success": false, "error": "방장만 게임을 시작할 수 있습니다."}
```

**Response 409:**
```json
{"success": false, "error": "게임을 시작할 수 없는 상태입니다."}
```

**Response 422 (공통):**
```json
{"success": false, "error": "최소 2명의 플레이어가 필요합니다."}
{"success": false, "error": "모든 플레이어가 준비를 완료해야 합니다."}
```

**Response 422 (릴레이 모드 전용):**
```json
{"success": false, "error": "각 팀에 최소 1명의 플레이어가 필요합니다."}
{"success": false, "error": "모든 참가자가 팀을 선택해야 합니다."}
{"success": false, "error": "모든 참가자가 주자 순서를 선택해야 합니다."}
{"success": false, "error": "A팀의 주자 순서가 올바르지 않습니다. 1부터 연속된 번호여야 합니다."}
{"success": false, "error": "B팀의 주자 순서가 올바르지 않습니다. 1부터 연속된 번호여야 합니다."}
```

> **릴레이 모드 게임 시작 조건:**
> 1. 모든 플레이어 준비 완료
> 2. 양 팀에 최소 1명 이상
> 3. 모든 참가자(관전자 제외)가 팀 선택 완료
> 4. 모든 참가자가 주자 순서 선택 완료
> 5. 각 팀의 주자 순서가 1부터 연속 (예: 1,2,3 ✓ / 1,3 ✗)

---

### 11. 게임 상태 업데이트 (방장 전용)

레이스 진행 중 돼지 위치/상태를 업데이트합니다.

```
PUT /api/game/rooms/:roomCode/state
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123",
  "status": "racing",
  "countdown": 0,
  "raceStartTime": 1704067400000,
  "raceEndTime": null,
  "pigs": [
    {"id": 0, "position": 45.5, "speed": 2.3, "status": "boost", "finishTime": null, "rank": null},
    {"id": 1, "position": 52.1, "speed": 1.8, "status": "normal", "finishTime": null, "rank": null},
    {"id": 2, "position": 100, "speed": 0, "status": "normal", "finishTime": 15234, "rank": 1}
  ]
}
```

**릴레이 모드 업데이트 예시:**
```json
{
  "playerId": "player_1704067200000_abc123",
  "status": "racing",
  "pigs": [
    {"id": 0, "team": "A", "position": 75, "speed": 2, "status": "normal", "direction": "backward", "finishTime": null, "rank": null},
    {"id": 1, "team": "B", "position": 50, "speed": 1.5, "status": "normal", "direction": "forward", "finishTime": null, "rank": null}
  ],
  "relay": {
    "teamA": {"currentRunner": 2, "completedRunners": 1, "totalRunners": 3, "finishTime": null},
    "teamB": {"currentRunner": 1, "completedRunners": 0, "totalRunners": 3, "finishTime": null}
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| playerId | string | O | 방장 ID |
| status | GameStatus | X | 게임 상태 |
| countdown | number | X | 카운트다운 값 |
| raceStartTime | number | X | 레이스 시작 시간 |
| raceEndTime | number | X | 레이스 종료 시간 |
| pigs | PigState[] | X | 돼지 상태 배열 |
| relay | RelayState | X | 릴레이 모드 상태 |
| resetPlayers | boolean | X | 재경기 시 플레이어 선택/준비 초기화 |

**Response 200:**
```json
{
  "success": true,
  "data": { /* 업데이트된 GameRoom 객체 */ }
}
```

**Response 403:**
```json
{"success": false, "error": "방장만 게임 상태를 업데이트할 수 있습니다."}
```

---

### 12. 방 삭제 (방장 전용)

방을 삭제합니다.

```
DELETE /api/game/rooms/:roomCode
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123"
}
```

**Response 200:**
```json
{"success": true, "data": {"message": "방이 삭제되었습니다."}}
```

**Response 403:**
```json
{"success": false, "error": "방장만 방을 삭제할 수 있습니다."}
```

---

## SSE (Server-Sent Events) 실시간 스트림

### 13. 방 이벤트 구독

방의 실시간 상태 변경을 수신합니다. **폴링 대신 반드시 이 엔드포인트를 사용하세요.**

```
GET /api/game/rooms/:roomCode/events?playerId=player_123
```

**Query Parameters:**
| 파라미터 | 필수 | 설명 |
|----------|:----:|------|
| playerId | O | 플레이어 ID (방에 입장한 플레이어만 가능) |

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

---

### SSE 이벤트 종류

#### 1. `connected` - 연결 성공

SSE 연결 즉시 현재 방 상태를 전송합니다.

```
event: connected
data: {"roomCode":"A1B2C3","hostId":"player_123","status":"waiting","players":[...],...}

```

#### 2. `update` - 상태 업데이트

방 상태가 변경될 때마다 전송됩니다.

```
event: update
data: {"roomCode":"A1B2C3","hostId":"player_123","status":"racing","players":[...],"pigs":[...],...}

```

#### 3. `ping` - 연결 유지

30초마다 전송됩니다. 연결 유지용이므로 무시해도 됩니다.

```
event: ping
data: {"timestamp":1704067200000}

```

#### 4. `room_deleted` - 방 삭제됨

방이 삭제되면 전송됩니다. 이 이벤트 후 연결이 종료됩니다.

```
event: room_deleted
data: {"message":"방이 삭제되었습니다."}

```

#### 5. `kicked` - 강퇴됨

방장에 의해 강퇴되었을 때 해당 플레이어에게만 전송됩니다.

```
event: kicked
data: {"message":"방장에 의해 강퇴되었습니다."}

```

#### 6. `host_changed` - 게임 중 방장 변경 ⚠️ 중요

**게임 진행 중(countdown 또는 racing)** 방장이 퇴장하면 전송됩니다.

새 방장은 이 이벤트를 받으면 **게임 업데이트 루프를 즉시 시작**해야 합니다.

```
event: host_changed
data: {"newHostId":"player_456","room":{...전체 방 상태...}}

```

---

## 에러 코드 정리

### 공통 에러

| HTTP | error | 설명 |
|:----:|-------|------|
| 400 | 플레이어 정보가 필요합니다. | playerId 또는 playerName 누락 |
| 400 | 닉네임은 2-10자 사이여야 합니다. | playerName 길이 오류 |
| 400 | 게임 모드는 normal 또는 relay만 가능합니다. | 잘못된 gameMode |
| 403 | 방장만 게임을 시작할 수 있습니다. | 비방장이 시작 시도 |
| 403 | 방장만 게임 상태를 업데이트할 수 있습니다. | 비방장이 상태 업데이트 시도 |
| 403 | 방장만 방을 삭제할 수 있습니다. | 비방장이 삭제 시도 |
| 403 | 방에 참가하지 않은 플레이어입니다. | SSE 연결 시 방에 없는 플레이어 |
| 404 | 방을 찾을 수 없습니다. | 존재하지 않는 roomCode |
| 404 | 플레이어를 찾을 수 없습니다. | 방에 없는 playerId |
| 409 | 방이 가득 찼습니다. | maxPlayers 초과 |
| 409 | 게임이 이미 시작되었습니다. | 진행 중 입장 시도 |
| 409 | 준비 상태를 변경할 수 없습니다. | 게임 중 준비 토글 시도 |
| 409 | 게임을 시작할 수 없는 상태입니다. | 이미 진행 중 |
| 422 | 최소 2명의 플레이어가 필요합니다. | 1명일 때 시작 |
| 422 | 모든 플레이어가 준비를 완료해야 합니다. | 미준비자 존재 |

### 일반 모드 전용 에러

| HTTP | error | 설명 |
|:----:|-------|------|
| 400 | 잘못된 돼지 번호입니다. | pigId가 유효 범위 밖 |
| 409 | 이미 다른 플레이어가 선택한 돼지입니다. | 중복 선택 |
| 409 | 돼지를 선택할 수 없는 상태입니다. | 게임 중 선택 시도 |

### 릴레이 모드 전용 에러 ⭐ NEW

| HTTP | error | 설명 |
|:----:|-------|------|
| 400 | 팀은 A 또는 B만 선택할 수 있습니다. | 잘못된 team 값 |
| 400 | 주자 순서는 1 이상의 정수여야 합니다. | 0 이하의 order 값 |
| 403 | 방장만 주자 순서를 배정할 수 있습니다. | 비방장이 순서 배정 시도 |
| 409 | 릴레이 모드에서만 팀을 선택할 수 있습니다. | 일반 모드에서 팀 선택 시도 |
| 409 | 릴레이 모드에서만 주자 순서를 배정할 수 있습니다. | 일반 모드에서 순서 배정 시도 |
| 409 | 대기 중일 때만 팀을 선택할 수 있습니다. | 게임 중 팀 변경 시도 |
| 409 | 대기 중일 때만 주자 순서를 배정할 수 있습니다. | 게임 중 순서 변경 시도 |
| 409 | 관전자는 팀을 선택할 수 없습니다. | 관전자가 팀 선택 시도 |
| 422 | 각 팀에 최소 1명의 플레이어가 필요합니다. | 한 팀에 0명인 상태로 시작 시도 |
| 422 | 모든 참가자가 팀을 선택해야 합니다. | 팀 미선택 참가자 존재 |
| 422 | 모든 참가자가 주자 순서를 선택해야 합니다. | 순서 미선택 참가자 존재 |
| 422 | A팀의 주자 순서가 올바르지 않습니다. 1부터 연속된 번호여야 합니다. | 순서 비연속 (예: 1,3) |
| 422 | B팀의 주자 순서가 올바르지 않습니다. 1부터 연속된 번호여야 합니다. | 순서 비연속 (예: 1,3) |

---

## 게임 흐름도

### 일반 모드 (Normal Mode)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 방 생성/입장                                                 │
│     POST /rooms (방장) 또는 POST /rooms/:code/join (참가자)      │
│     → 응답으로 받은 roomCode로 SSE 연결                          │
│     GET /rooms/:code/events?playerId=xxx                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. 대기실 (status: "waiting")                                   │
│     - SSE로 실시간 플레이어 목록 동기화                           │
│     - POST /rooms/:code/select-pig (돼지 선택)                   │
│     - POST /rooms/:code/ready (준비 완료)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. 게임 시작 (방장만)                                           │
│     POST /rooms/:code/start                                      │
│     → status: "countdown"                                        │
│     → SSE로 모든 클라이언트에 전파                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. 카운트다운 (status: "countdown")                             │
│     방장이 PUT /rooms/:code/state로 countdown: 3→2→1→0          │
│     → SSE로 모든 클라이언트에 전파                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. 레이스 (status: "racing")                                    │
│     방장이 100ms마다 PUT /rooms/:code/state로 pigs 업데이트      │
│     → SSE로 모든 클라이언트에 전파                               │
│     → 참가자는 SSE로 받은 pigs 데이터로 화면 렌더링              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. 종료 (status: "finished")                                    │
│     모든 돼지 완주 시 방장이 status: "finished" 업데이트         │
│     → 결과 화면 표시                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 릴레이 모드 (Relay Mode) ⭐ NEW

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 방 생성 (gameMode: "relay")                                  │
│     POST /rooms { ..., gameMode: "relay" }                       │
│     → 돼지 2마리 자동 생성 (A팀, B팀 각 1마리)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. 돼지 색상 선택                                               │
│     POST /rooms/:code/select-pig { pigId: 5 }                    │
│     → 각 플레이어가 원하는 색상 선택 (30가지)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. 팀 선택                                                      │
│     POST /rooms/:code/select-team { team: "A" }                  │
│     → 각 플레이어가 A팀 또는 B팀 선택                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. 준비 완료                                                    │
│     POST /rooms/:code/ready                                      │
│     → 모든 참가자 준비 완료 필요                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. 주자 순서 랜덤 배정 + 게임 시작 (방장만)                     │
│     POST /rooms/:code/assign-runner-orders                       │
│     → 방장이 랜덤 순서 생성 후 일괄 배정                         │
│     POST /rooms/:code/start                                      │
│     → relay.teamA/B.totalRunners 자동 설정                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. 릴레이 레이스 (status: "racing") 🏃                          │
│                                                                  │
│     [1번 주자 왕복]                                              │
│     ┌────────────────────────────────────────────────┐          │
│     │ A팀 1번: 0 ──forward──→ 100 ──backward──→ 0    │          │
│     │ B팀 1번: 0 ──forward──→ 100 ──backward──→ 0    │          │
│     └────────────────────────────────────────────────┘          │
│              ↓ 왕복 완료 시 바통 전달                            │
│     [2번 주자 왕복]                                              │
│     ┌────────────────────────────────────────────────┐          │
│     │ A팀 2번: 0 ──forward──→ 100 ──backward──→ 0    │          │
│     │ B팀 2번: 0 ──forward──→ 100 ──backward──→ 0    │          │
│     └────────────────────────────────────────────────┘          │
│              ↓ ... 마지막 주자까지 반복                          │
│                                                                  │
│     [상태 업데이트 데이터 예시]                                   │
│     pigs[0]: {team:"A", position:75, direction:"backward"}       │
│     pigs[1]: {team:"B", position:50, direction:"forward"}        │
│     relay.teamA: {currentRunner:2, completedRunners:1}           │
│     relay.teamB: {currentRunner:1, completedRunners:0}           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  7. 종료 (status: "finished")                                    │
│     한 팀의 마지막 주자가 먼저 왕복 완료 시                      │
│     → relay.teamA/B.finishTime 설정                              │
│     → pigs[].rank로 팀 순위 표시 (1등/2등)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 테스트 시나리오

### 일반 모드 테스트

```bash
# 1. 방 생성 (일반 모드)
curl -X POST http://localhost:5000/api/game/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a","playerName":"호스트","gameMode":"normal"}'

# 2. SSE 연결 (roomCode = A1B2C3)
curl -N "http://localhost:5000/api/game/rooms/A1B2C3/events?playerId=player_a"

# 3. 방 입장 (다른 터미널에서)
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/join \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b","playerName":"참가자"}'
# → 위의 SSE 연결에서 event: update 수신됨

# 4. 돼지 선택
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-pig \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a","pigId":0}'

# 5. 준비 완료
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/ready \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b"}'

# 6. 게임 시작
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/start \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a"}'
```

### 릴레이 모드 테스트 ⭐ NEW

```bash
# 1. 릴레이 모드 방 생성
curl -X POST http://localhost:5000/api/game/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a","playerName":"호스트","gameMode":"relay","maxPlayers":10}'

# 2. SSE 연결
curl -N "http://localhost:5000/api/game/rooms/A1B2C3/events?playerId=player_a"

# 3. 다른 플레이어 입장
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/join \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b","playerName":"참가자1"}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/join \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_c","playerName":"참가자2"}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/join \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_d","playerName":"참가자3"}'

# 4. 돼지 색상 선택 (각자)
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-pig \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a","pigId":0}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-pig \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b","pigId":5}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-pig \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_c","pigId":10}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-pig \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_d","pigId":15}'

# 5. 팀 선택 (A팀 2명, B팀 2명)
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-team \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a","team":"A"}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-team \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b","team":"A"}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-team \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_c","team":"B"}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/select-team \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_d","team":"B"}'

# 6. 준비 완료 (방장 제외 모든 플레이어)
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/ready \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_b"}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/ready \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_c"}'

curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/ready \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_d"}'

# 7. 주자 순서 배정 (방장이 랜덤 순서로)
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/assign-runner-orders \
  -H "Content-Type: application/json" \
  -d '{
    "playerId":"player_a",
    "assignments":[
      {"playerId":"player_a","order":1},
      {"playerId":"player_b","order":2},
      {"playerId":"player_c","order":1},
      {"playerId":"player_d","order":2}
    ]
  }'

# 8. 게임 시작
curl -X POST http://localhost:5000/api/game/rooms/A1B2C3/start \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player_a"}'
# → relay.teamA/B.totalRunners가 자동으로 설정됨

# 9. 릴레이 상태 업데이트 (방장만, 레이스 중)
curl -X PUT http://localhost:5000/api/game/rooms/A1B2C3/state \
  -H "Content-Type: application/json" \
  -d '{
    "playerId":"player_a",
    "status":"racing",
    "pigs":[
      {"id":0,"team":"A","position":50,"speed":2,"status":"normal","direction":"forward","finishTime":null,"rank":null},
      {"id":1,"team":"B","position":75,"speed":1.5,"status":"normal","direction":"forward","finishTime":null,"rank":null}
    ],
    "relay":{
      "teamA":{"currentRunner":1,"completedRunners":0,"totalRunners":2,"finishTime":null},
      "teamB":{"currentRunner":1,"completedRunners":0,"totalRunners":2,"finishTime":null}
    }
  }'
```

---

### 14. 하트비트 (플레이어 활성 상태 갱신) ⭐ NEW

클라이언트가 주기적으로 하트비트를 전송하여 활성 상태임을 서버에 알립니다.
서버는 일정 시간 동안 하트비트가 없는 플레이어를 비활성으로 처리하여 자동으로 방에서 제거합니다.

```
POST /api/game/rooms/:roomCode/heartbeat
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| playerId | string | O | 플레이어 ID |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "하트비트 수신 완료"
  }
}
```

**Response 404:**
```json
{"success": false, "error": "방을 찾을 수 없습니다."}
{"success": false, "error": "플레이어를 찾을 수 없습니다."}
```

**클라이언트 구현:**
- 방 입장 후 즉시 하트비트 1회 전송
- 이후 **10초마다** 하트비트 전송
- 방 퇴장, 강퇴, 연결 종료 시 하트비트 중지

**서버 구현 요구사항:**

1. **Player 타입에 lastHeartbeat 필드 추가:**
```typescript
interface Player {
  // ... 기존 필드들
  lastHeartbeat: number;  // 마지막 하트비트 시간 (Unix timestamp ms)
}
```

2. **하트비트 수신 시 처리:**
```javascript
function handleHeartbeat(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room) throw new NotFoundError('방을 찾을 수 없습니다.');

  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new NotFoundError('플레이어를 찾을 수 없습니다.');

  // 마지막 하트비트 시간 갱신
  player.lastHeartbeat = Date.now();
  room.updatedAt = Date.now();

  saveRoom(roomCode, room);

  return { message: '하트비트 수신 완료' };
}
```

3. **비활성 플레이어 자동 제거 (권장: 15초 타임아웃):**
```javascript
// 주기적으로 실행 (예: 5초마다)
function cleanupInactivePlayers() {
  const HEARTBEAT_TIMEOUT = 15000; // 15초
  const now = Date.now();

  for (const roomCode of getAllRoomCodes()) {
    const room = getRoom(roomCode);
    if (!room) continue;

    // 대기 중이거나 게임 중일 때만 체크
    if (room.status === 'waiting' || room.status === 'selecting') {
      const inactivePlayers = room.players.filter(
        p => now - (p.lastHeartbeat || p.joinedAt) > HEARTBEAT_TIMEOUT
      );

      for (const player of inactivePlayers) {
        console.log(`[Heartbeat] 비활성 플레이어 제거: ${player.name} (${player.id})`);

        // 플레이어 제거 로직 (leave와 동일)
        removePlayerFromRoom(roomCode, player.id);
      }
    }
  }
}

// 5초마다 실행
setInterval(cleanupInactivePlayers, 5000);
```

4. **방 입장 시 lastHeartbeat 초기화:**
```javascript
function joinRoom(roomCode, playerId, playerName) {
  // ... 기존 로직

  const newPlayer = {
    id: playerId,
    name: playerName,
    selectedPig: null,
    isReady: false,
    isSpectator: false,
    team: null,
    runnerOrder: null,
    joinedAt: Date.now(),
    lastHeartbeat: Date.now()  // 입장 시 초기화
  };

  room.players.push(newPlayer);
  // ...
}
```

5. **SSE 이벤트 전파:**
비활성 플레이어가 제거되면 `update` 이벤트를 전파하여 다른 플레이어들에게 알립니다.

**타임아웃 설정 권장값:**
| 항목 | 값 | 설명 |
|------|-----|------|
| 클라이언트 하트비트 주기 | 10초 | `setInterval(() => sendHeartbeat(roomCode), 10000)` |
| 서버 타임아웃 | 15초 | 하트비트 주기의 1.5배 (네트워크 지연 고려) |
| 서버 체크 주기 | 5초 | 비활성 플레이어 체크 간격 |

> **참고**: 게임 진행 중(countdown, racing, finished)에는 하트비트 타임아웃을 적용하지 않는 것이 좋습니다. 게임 중에는 클라이언트가 게임 로직에 집중하므로 하트비트가 지연될 수 있습니다.

---

## 주요 특징

1. **SSE 실시간 동기화**: 폴링 대비 서버 부하 90% 감소
2. **방장 권한 시스템**: 게임 시작, 상태 업데이트, 방 삭제는 방장만 가능
3. **자동 정리**: 30분 이상 업데이트 없는 방 자동 삭제
4. **방장 위임**: 방장 퇴장 시 가장 먼저 입장한 플레이어로 자동 위임
5. **동적 돼지 수 (일반 모드)**: 플레이어 수 = 돼지 수 (입장 시 추가, 퇴장 시 제거)
6. **고정 돼지 수 (릴레이 모드)**: 팀당 1마리, 총 2마리 고정
7. **최대 30명**: 최대 30명까지 플레이 가능
8. **2가지 게임 모드**: 일반(normal) / 릴레이(relay) 모드 지원
9. **릴레이 왕복 레이스**: 각 주자가 출발→결승→출발 왕복 후 다음 주자 출발
10. **랜덤 주자 순서**: 방장이 게임 시작 시 팀 내 주자 순서를 랜덤 배정
11. **하트비트 기반 플레이어 관리**: 비활성 플레이어 자동 제거 (15초 타임아웃)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2024-01-01 | 최초 작성 (폴링 방식) |
| v2.0 | 2024-01-08 | SSE 방식으로 전환, CORS 설정 추가, 완전한 서버 구현 예시 추가 |
| v2.1 | 2025-01-08 | 돼지 선택 해제 기능 추가, 재경기 시 플레이어 초기화 옵션 추가, 게임 중 방장 변경 시 host_changed 이벤트 추가 |
| v3.0 | 2025-01-09 | **릴레이 모드 추가**: 팀 대항전, 왕복 레이스, 주자 순서 일괄 배정 API 추가 |
