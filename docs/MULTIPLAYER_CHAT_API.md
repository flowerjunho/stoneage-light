# 멀티플레이어 대기실 채팅 API

## 개요

천호 레이스 대기실에서 플레이어 간 실시간 채팅을 위한 API 명세입니다.

> ⚠️ **핵심 구현 사항**
>
> 채팅이 동작하려면 **반드시** 다음 두 가지가 구현되어야 합니다:
>
> 1. **POST /chat** → 메시지 저장 ✅
> 2. **저장 직후 SSE 브로드캐스트** → `broadcastToRoom(roomCode, 'chat', message)` ⚠️
>
> ```javascript
> // POST /api/game/rooms/:roomCode/chat 핸들러 마지막에 반드시 추가!
> broadcastToRoom(roomCode, 'chat', message);  // ← 이 줄이 없으면 채팅이 안 보임
> ```

| 항목 | 값 |
|------|-----|
| 저장 방식 | **메모리 기반** (DB 사용 안함) |
| 전송 방식 | 기존 SSE 활용 |
| 메시지 수명 | 방 삭제 시 자동 소멸 |
| 사용 가능 상태 | `waiting`, `selecting` (대기실) |

---

## 데이터 구조

### ChatMessage

```typescript
interface ChatMessage {
  id: string;              // 메시지 고유 ID (예: "msg_1704067200000_abc")
  playerId: string;        // 발신자 플레이어 ID
  playerName: string;      // 발신자 닉네임
  content: string;         // 메시지 내용
  timestamp: number;       // 전송 시간 (Unix timestamp ms)
}
```

### 서버 메모리 구조

```typescript
// 기존 rooms 객체에 messages 배열 추가
interface GameRoom {
  // ... 기존 필드들 ...
  messages: ChatMessage[];  // 채팅 메시지 (메모리에만 저장)
}
```

---

## REST API

### 메시지 전송

채팅 메시지를 전송합니다.

```
POST /api/game/rooms/{roomCode}/chat
```

**Request Body:**
```json
{
  "playerId": "player_1704067200000_abc123",
  "content": "안녕하세요!"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| playerId | string | O | 발신자 플레이어 ID |
| content | string | O | 메시지 내용 (1-200자) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "msg_1704067200000_abc",
    "playerId": "player_1704067200000_abc123",
    "playerName": "플레이어1",
    "content": "안녕하세요!",
    "timestamp": 1704067200000
  }
}
```

**Response 400 (유효성 검사 실패):**
```json
{
  "success": false,
  "error": "메시지는 1-200자 사이여야 합니다."
}
```

**Response 403 (권한 없음):**
```json
{
  "success": false,
  "error": "해당 방의 참가자가 아닙니다."
}
```

**Response 404 (방 없음):**
```json
{
  "success": false,
  "error": "방을 찾을 수 없습니다."
}
```

---

## SSE 이벤트

### chat 이벤트

새 메시지가 전송되면 해당 방의 모든 참가자에게 SSE로 브로드캐스트됩니다.

```
event: chat
data: {
  "id": "msg_1704067200000_abc",
  "playerId": "player_1704067200000_abc123",
  "playerName": "플레이어1",
  "content": "안녕하세요!",
  "timestamp": 1704067200000
}
```

---

## 서버 구현 가이드

### 1. 메모리 저장 (DB 불필요)

```javascript
// rooms 객체 내부에 messages 배열 추가
const rooms = {
  "A1B2C3": {
    roomCode: "A1B2C3",
    players: [...],
    status: "waiting",
    messages: []  // 채팅 메시지 (메모리에만 저장)
  }
};
```

### 2. 메시지 전송 처리

```javascript
app.post('/api/game/rooms/:roomCode/chat', (req, res) => {
  const { roomCode } = req.params;
  const { playerId, content } = req.body;

  const room = rooms[roomCode];
  if (!room) {
    return res.status(404).json({ success: false, error: '방을 찾을 수 없습니다.' });
  }

  // 참가자 확인
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(403).json({ success: false, error: '해당 방의 참가자가 아닙니다.' });
  }

  // 메시지 유효성 검사
  if (!content || content.length < 1 || content.length > 200) {
    return res.status(400).json({ success: false, error: '메시지는 1-200자 사이여야 합니다.' });
  }

  // 메시지 생성
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    playerName: player.name,
    content,
    timestamp: Date.now()
  };

  // 메모리에 저장 (최대 100개 유지)
  room.messages.push(message);
  if (room.messages.length > 100) {
    room.messages.shift();  // 오래된 메시지 제거
  }

  // SSE로 브로드캐스트
  broadcastToRoom(roomCode, 'chat', message);

  res.json({ success: true, data: message });
});
```

### 3. SSE 브로드캐스트

```javascript
function broadcastToRoom(roomCode, eventType, data) {
  const clients = sseClients[roomCode] || [];
  clients.forEach(client => {
    client.write(`event: ${eventType}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}
```

### 4. 방 삭제 시 자동 정리

```javascript
function deleteRoom(roomCode) {
  // 방 삭제 시 messages도 함께 삭제됨 (별도 처리 불필요)
  delete rooms[roomCode];

  // SSE 연결 정리
  if (sseClients[roomCode]) {
    sseClients[roomCode].forEach(client => client.end());
    delete sseClients[roomCode];
  }
}
```

---

## 클라이언트 구현 가이드

### 1. 메시지 전송

```typescript
export const sendChatMessage = async (
  roomCode: string,
  content: string
): Promise<ApiResponse<ChatMessage>> => {
  return apiCall<ChatMessage>(`/api/game/rooms/${roomCode}/chat`, {
    method: 'POST',
    body: JSON.stringify({
      playerId: getPlayerId(),
      content,
    }),
  });
};
```

### 2. SSE 이벤트 수신

```typescript
// 기존 SSE 연결에 chat 이벤트 핸들러 추가
eventSource.addEventListener('chat', (event) => {
  const message: ChatMessage = JSON.parse(event.data);
  setMessages(prev => [...prev, message]);
});
```

### 3. UI 컴포넌트 예시

```tsx
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [inputValue, setInputValue] = useState('');

const handleSend = async () => {
  if (!inputValue.trim()) return;

  const response = await sendChatMessage(roomCode, inputValue);
  if (response.success) {
    setInputValue('');
  }
};

return (
  <div className="chat-container">
    <div className="messages">
      {messages.map(msg => (
        <div key={msg.id} className="message">
          <span className="name">{msg.playerName}</span>
          <span className="content">{msg.content}</span>
        </div>
      ))}
    </div>
    <input
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
      onKeyPress={e => e.key === 'Enter' && handleSend()}
      maxLength={200}
    />
    <button onClick={handleSend}>전송</button>
  </div>
);
```

---

## 제약 사항

| 항목 | 제한 |
|------|------|
| 메시지 길이 | 1-200자 |
| 메시지 보관 | 방당 최대 100개 (초과 시 오래된 것부터 삭제) |
| 사용 가능 상태 | `waiting`, `selecting` (레이싱 중에는 비활성화 권장) |
| 저장 | 메모리만 (서버 재시작 시 소멸) |

---

## 요약

```
┌─────────────────────────────────────────────────────────┐
│                    채팅 시스템 흐름                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  유저A: 메시지 입력                                       │
│       ↓                                                 │
│  POST /api/game/rooms/{roomCode}/chat                   │
│       ↓                                                 │
│  서버: room.messages.push(msg)  ← 메모리 저장            │
│       ↓                                                 │
│  SSE event: chat → 모든 참가자에게 브로드캐스트            │
│       ↓                                                 │
│  유저B, C, D: 메시지 수신 및 화면 표시                     │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  방 삭제 시: delete rooms[roomCode]                      │
│       → messages 배열도 함께 삭제 (자동 정리)              │
│       → DB cleanup 불필요!                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-01-09 | 최초 작성 - 메모리 기반 대기실 채팅 API |
