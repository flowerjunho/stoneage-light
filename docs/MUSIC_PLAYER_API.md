# 음악 플레이어 API 명세서

## 개요

SPA 환경에서 페이지 전환 시에도 끊김 없이 재생되는 음악 플레이어를 위한 백엔드 API 명세입니다.

| 항목 | 값 |
|------|-----|
| 저장 방식 | **파일 시스템 + DB (메타데이터)** |
| 스트리밍 방식 | HTTP Range Request 지원 |
| 지원 포맷 | MP3, AAC, OGG, WAV |
| 인증 | 선택적 (공개/비공개 트랙) |

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React SPA)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   MusicPlayerContext                      │   │
│  │  - 전역 상태 관리 (현재 트랙, 재생 상태, 볼륨)            │   │
│  │  - HTML5 Audio API 제어                                   │   │
│  │  - 페이지 전환 시에도 상태 유지                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              MusicPlayer Component (Fixed Bottom)         │   │
│  │  - 재생/일시정지, 이전/다음 트랙                          │   │
│  │  - 프로그레스 바, 볼륨 조절                               │   │
│  │  - 플레이리스트 토글                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Server                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      REST API Layer                       │   │
│  │  GET  /api/music/tracks      - 트랙 목록 조회             │   │
│  │  GET  /api/music/tracks/:id  - 트랙 상세 조회             │   │
│  │  GET  /api/music/stream/:id  - 오디오 스트리밍            │   │
│  │  GET  /api/music/playlists   - 플레이리스트 목록          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────┐  ┌──────────────────────────────────┐   │
│  │    File Storage    │  │           Database               │   │
│  │  /uploads/music/   │  │  - tracks (메타데이터)           │   │
│  │  ├── track_001.mp3 │  │  - playlists                     │   │
│  │  ├── track_002.mp3 │  │  - playlist_tracks               │   │
│  │  └── ...           │  │                                  │   │
│  └────────────────────┘  └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 데이터베이스 스키마

### tracks 테이블

음악 파일의 메타데이터를 저장합니다.

```sql
CREATE TABLE tracks (
  id            VARCHAR(50) PRIMARY KEY,           -- 예: "track_1704067200000_abc"
  title         VARCHAR(200) NOT NULL,             -- 곡 제목
  artist        VARCHAR(200),                      -- 아티스트명
  album         VARCHAR(200),                      -- 앨범명
  duration      INT NOT NULL,                      -- 재생 시간 (초)
  file_path     VARCHAR(500) NOT NULL,             -- 서버 내 파일 경로
  file_size     BIGINT NOT NULL,                   -- 파일 크기 (bytes)
  mime_type     VARCHAR(50) NOT NULL,              -- MIME 타입 (audio/mpeg 등)
  cover_url     VARCHAR(500),                      -- 앨범 커버 이미지 URL
  is_public     BOOLEAN DEFAULT true,              -- 공개 여부
  play_count    INT DEFAULT 0,                     -- 재생 횟수
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_is_public (is_public),
  INDEX idx_created_at (created_at)
);
```

### playlists 테이블

플레이리스트 정보를 저장합니다.

```sql
CREATE TABLE playlists (
  id            VARCHAR(50) PRIMARY KEY,           -- 예: "playlist_1704067200000_abc"
  name          VARCHAR(200) NOT NULL,             -- 플레이리스트 이름
  description   TEXT,                              -- 설명
  cover_url     VARCHAR(500),                      -- 커버 이미지 URL
  is_public     BOOLEAN DEFAULT true,              -- 공개 여부
  track_count   INT DEFAULT 0,                     -- 트랙 수 (캐시)
  total_duration INT DEFAULT 0,                    -- 총 재생 시간 (초, 캐시)
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### playlist_tracks 테이블

플레이리스트와 트랙의 관계를 저장합니다.

```sql
CREATE TABLE playlist_tracks (
  id            VARCHAR(50) PRIMARY KEY,
  playlist_id   VARCHAR(50) NOT NULL,
  track_id      VARCHAR(50) NOT NULL,
  position      INT NOT NULL,                      -- 플레이리스트 내 순서
  added_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
  UNIQUE KEY uk_playlist_track (playlist_id, track_id),
  INDEX idx_playlist_position (playlist_id, position)
);
```

---

## TypeScript 인터페이스

프론트엔드와 백엔드에서 공통으로 사용할 타입 정의입니다.

```typescript
// ============================================
// Track (음악 트랙)
// ============================================
interface Track {
  id: string;                    // 고유 ID
  title: string;                 // 곡 제목
  artist: string | null;         // 아티스트명
  album: string | null;          // 앨범명
  duration: number;              // 재생 시간 (초)
  coverUrl: string | null;       // 앨범 커버 이미지 URL
  streamUrl: string;             // 스트리밍 URL (GET /api/music/stream/:id)
  isPublic: boolean;             // 공개 여부
  playCount: number;             // 재생 횟수
  createdAt: string;             // 생성 시간 (ISO 8601)
}

// ============================================
// Playlist (플레이리스트)
// ============================================
interface Playlist {
  id: string;                    // 고유 ID
  name: string;                  // 플레이리스트 이름
  description: string | null;    // 설명
  coverUrl: string | null;       // 커버 이미지 URL
  isPublic: boolean;             // 공개 여부
  trackCount: number;            // 트랙 수
  totalDuration: number;         // 총 재생 시간 (초)
  tracks?: Track[];              // 트랙 목록 (상세 조회 시)
  createdAt: string;             // 생성 시간 (ISO 8601)
}

// ============================================
// API Response 공통 형식
// ============================================
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;               // 전체 개수
    page: number;                // 현재 페이지 (1부터 시작)
    limit: number;               // 페이지당 개수
    totalPages: number;          // 전체 페이지 수
  };
}
```

---

## REST API 엔드포인트

### 1. 트랙 목록 조회

전체 트랙 목록을 페이지네이션하여 조회합니다.

```
GET /api/music/tracks
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|:----:|--------|------|
| page | number | - | 1 | 페이지 번호 (1부터 시작) |
| limit | number | - | 20 | 페이지당 항목 수 (최대 100) |
| search | string | - | - | 제목/아티스트 검색어 |
| sort | string | - | "createdAt" | 정렬 기준 (createdAt, title, playCount) |
| order | string | - | "desc" | 정렬 순서 (asc, desc) |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "track_1704067200000_abc",
        "title": "스톤에이지 BGM 01",
        "artist": "StoneAge OST",
        "album": "환수강림 라이트",
        "duration": 185,
        "coverUrl": "/api/music/covers/track_1704067200000_abc.jpg",
        "streamUrl": "/api/music/stream/track_1704067200000_abc",
        "isPublic": true,
        "playCount": 1234,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "track_1704067300000_def",
        "title": "스톤에이지 BGM 02",
        "artist": "StoneAge OST",
        "album": "환수강림 라이트",
        "duration": 210,
        "coverUrl": "/api/music/covers/track_1704067300000_def.jpg",
        "streamUrl": "/api/music/stream/track_1704067300000_def",
        "isPublic": true,
        "playCount": 892,
        "createdAt": "2024-01-01T00:01:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Response 400 (잘못된 파라미터):**

```json
{
  "success": false,
  "error": "limit은 1-100 사이의 값이어야 합니다."
}
```

---

### 2. 트랙 상세 조회

특정 트랙의 상세 정보를 조회합니다.

```
GET /api/music/tracks/{trackId}
```

**Path Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| trackId | string | O | 트랙 ID |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "track_1704067200000_abc",
    "title": "스톤에이지 BGM 01",
    "artist": "StoneAge OST",
    "album": "환수강림 라이트",
    "duration": 185,
    "coverUrl": "/api/music/covers/track_1704067200000_abc.jpg",
    "streamUrl": "/api/music/stream/track_1704067200000_abc",
    "isPublic": true,
    "playCount": 1234,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response 404 (트랙 없음):**

```json
{
  "success": false,
  "error": "트랙을 찾을 수 없습니다."
}
```

---

### 3. 오디오 스트리밍 (핵심!)

> **중요**: 이 엔드포인트가 실제 음악 재생을 담당합니다.
> HTTP Range Request를 반드시 지원해야 탐색(seek)이 가능합니다.

```
GET /api/music/stream/{trackId}
```

**Path Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| trackId | string | O | 트랙 ID |

**Request Headers:**

| 헤더 | 필수 | 설명 |
|------|:----:|------|
| Range | - | 부분 요청 (예: "bytes=0-1048575") |

**Response 200 (전체 파일):**

Range 헤더가 없을 경우 전체 파일을 반환합니다.

```
HTTP/1.1 200 OK
Content-Type: audio/mpeg
Content-Length: 5242880
Accept-Ranges: bytes
Cache-Control: public, max-age=31536000

[바이너리 오디오 데이터]
```

**Response 206 (부분 콘텐츠):**

Range 헤더가 있을 경우 요청된 범위만 반환합니다.

```
HTTP/1.1 206 Partial Content
Content-Type: audio/mpeg
Content-Length: 1048576
Content-Range: bytes 0-1048575/5242880
Accept-Ranges: bytes
Cache-Control: public, max-age=31536000

[부분 바이너리 오디오 데이터]
```

**Response 404 (트랙 없음):**

```json
{
  "success": false,
  "error": "트랙을 찾을 수 없습니다."
}
```

**Response 416 (범위 오류):**

```json
{
  "success": false,
  "error": "요청한 범위가 파일 크기를 초과합니다."
}
```

---

### 4. 플레이리스트 목록 조회

전체 플레이리스트 목록을 조회합니다.

```
GET /api/music/playlists
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|:----:|--------|------|
| page | number | - | 1 | 페이지 번호 |
| limit | number | - | 20 | 페이지당 항목 수 |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "playlist_1704067200000_abc",
        "name": "스톤에이지 OST",
        "description": "환수강림 라이트 배경음악 모음",
        "coverUrl": "/api/music/covers/playlist_1704067200000_abc.jpg",
        "isPublic": true,
        "trackCount": 15,
        "totalDuration": 2850,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "playlist_1704067300000_def",
        "name": "전투 BGM",
        "description": "전투 시 배경음악",
        "coverUrl": "/api/music/covers/playlist_1704067300000_def.jpg",
        "isPublic": true,
        "trackCount": 8,
        "totalDuration": 1520,
        "createdAt": "2024-01-01T00:01:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 5. 플레이리스트 상세 조회 (트랙 포함)

특정 플레이리스트의 상세 정보와 포함된 트랙 목록을 조회합니다.

```
GET /api/music/playlists/{playlistId}
```

**Path Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| playlistId | string | O | 플레이리스트 ID |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "playlist_1704067200000_abc",
    "name": "스톤에이지 OST",
    "description": "환수강림 라이트 배경음악 모음",
    "coverUrl": "/api/music/covers/playlist_1704067200000_abc.jpg",
    "isPublic": true,
    "trackCount": 15,
    "totalDuration": 2850,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "tracks": [
      {
        "id": "track_1704067200000_abc",
        "title": "스톤에이지 BGM 01",
        "artist": "StoneAge OST",
        "album": "환수강림 라이트",
        "duration": 185,
        "coverUrl": "/api/music/covers/track_1704067200000_abc.jpg",
        "streamUrl": "/api/music/stream/track_1704067200000_abc",
        "isPublic": true,
        "playCount": 1234,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
      // ... 더 많은 트랙
    ]
  }
}
```

**Response 404 (플레이리스트 없음):**

```json
{
  "success": false,
  "error": "플레이리스트를 찾을 수 없습니다."
}
```

---

### 6. 재생 횟수 증가

트랙 재생 시 호출하여 재생 횟수를 증가시킵니다.

```
POST /api/music/tracks/{trackId}/play
```

**Path Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|:----:|------|
| trackId | string | O | 트랙 ID |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "playCount": 1235
  }
}
```

---

## 서버 구현 가이드 (Node.js/Express 예시)

### 프로젝트 구조

```
server/
├── src/
│   ├── config/
│   │   └── database.ts          # DB 연결 설정
│   ├── controllers/
│   │   └── musicController.ts   # API 핸들러
│   ├── middleware/
│   │   └── rangeParser.ts       # Range 헤더 파싱
│   ├── models/
│   │   ├── Track.ts
│   │   └── Playlist.ts
│   ├── routes/
│   │   └── musicRoutes.ts       # 라우트 정의
│   ├── services/
│   │   └── musicService.ts      # 비즈니스 로직
│   └── utils/
│       └── fileUtils.ts         # 파일 처리 유틸
├── uploads/
│   └── music/                   # 음악 파일 저장 경로
│       ├── tracks/              # 오디오 파일
│       └── covers/              # 커버 이미지
└── package.json
```

### 핵심 구현: 스트리밍 컨트롤러

```typescript
// src/controllers/musicController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getMimeType } from '../utils/fileUtils';
import { TrackService } from '../services/musicService';

export class MusicController {

  /**
   * 오디오 스트리밍 (Range Request 지원)
   *
   * ⚠️ 핵심 구현 사항:
   * 1. Range 헤더 파싱
   * 2. 206 Partial Content 응답
   * 3. Content-Range 헤더 설정
   */
  async streamTrack(req: Request, res: Response) {
    try {
      const { trackId } = req.params;

      // 1. 트랙 정보 조회
      const track = await TrackService.findById(trackId);
      if (!track) {
        return res.status(404).json({
          success: false,
          error: '트랙을 찾을 수 없습니다.'
        });
      }

      // 2. 파일 존재 확인
      const filePath = track.filePath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: '오디오 파일을 찾을 수 없습니다.'
        });
      }

      // 3. 파일 정보
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const mimeType = track.mimeType || getMimeType(filePath);

      // 4. Range 헤더 파싱
      const range = req.headers.range;

      if (range) {
        // ========== Range Request 처리 ==========
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        // 범위 유효성 검사
        if (start >= fileSize || end >= fileSize) {
          res.status(416).json({
            success: false,
            error: '요청한 범위가 파일 크기를 초과합니다.'
          });
          return;
        }

        const chunkSize = (end - start) + 1;
        const stream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000',
        });

        stream.pipe(res);

      } else {
        // ========== 전체 파일 응답 ==========
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
        });

        fs.createReadStream(filePath).pipe(res);
      }

    } catch (error) {
      console.error('Stream error:', error);
      res.status(500).json({
        success: false,
        error: '스트리밍 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 트랙 목록 조회
   */
  async getTracks(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        sort = 'createdAt',
        order = 'desc'
      } = req.query;

      // 파라미터 유효성 검사
      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));

      const result = await TrackService.findAll({
        page: pageNum,
        limit: limitNum,
        search: String(search),
        sort: String(sort),
        order: String(order) as 'asc' | 'desc'
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get tracks error:', error);
      res.status(500).json({
        success: false,
        error: '트랙 목록 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 트랙 상세 조회
   */
  async getTrack(req: Request, res: Response) {
    try {
      const { trackId } = req.params;
      const track = await TrackService.findById(trackId);

      if (!track) {
        return res.status(404).json({
          success: false,
          error: '트랙을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: track
      });

    } catch (error) {
      console.error('Get track error:', error);
      res.status(500).json({
        success: false,
        error: '트랙 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 재생 횟수 증가
   */
  async incrementPlayCount(req: Request, res: Response) {
    try {
      const { trackId } = req.params;
      const playCount = await TrackService.incrementPlayCount(trackId);

      res.json({
        success: true,
        data: { playCount }
      });

    } catch (error) {
      console.error('Increment play count error:', error);
      res.status(500).json({
        success: false,
        error: '재생 횟수 업데이트 중 오류가 발생했습니다.'
      });
    }
  }
}
```

### 라우트 설정

```typescript
// src/routes/musicRoutes.ts
import { Router } from 'express';
import { MusicController } from '../controllers/musicController';

const router = Router();
const controller = new MusicController();

// 트랙 API
router.get('/tracks', controller.getTracks);
router.get('/tracks/:trackId', controller.getTrack);
router.post('/tracks/:trackId/play', controller.incrementPlayCount);

// 스트리밍 API (핵심!)
router.get('/stream/:trackId', controller.streamTrack);

// 플레이리스트 API
router.get('/playlists', controller.getPlaylists);
router.get('/playlists/:playlistId', controller.getPlaylist);

// 커버 이미지 (정적 파일)
router.use('/covers', express.static('uploads/music/covers'));

export default router;
```

### Express 앱 설정

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import musicRoutes from './routes/musicRoutes';

const app = express();

// CORS 설정 (프론트엔드 도메인 허용)
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend-domain.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
}));

app.use(express.json());

// 음악 API 라우트
app.use('/api/music', musicRoutes);

export default app;
```

---

## 파일 저장 구조

```
uploads/
└── music/
    ├── tracks/                          # 오디오 파일
    │   ├── track_1704067200000_abc.mp3
    │   ├── track_1704067300000_def.mp3
    │   └── ...
    └── covers/                          # 커버 이미지
        ├── track_1704067200000_abc.jpg
        ├── playlist_1704067200000_abc.jpg
        └── ...
```

### 파일 업로드 시 처리 (관리자용)

```typescript
// 관리자 API: 트랙 업로드
// POST /api/admin/music/upload

import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import mm from 'music-metadata';  // npm install music-metadata

const storage = multer.diskStorage({
  destination: 'uploads/music/tracks',
  filename: (req, file, cb) => {
    const id = `track_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/aac'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 오디오 형식입니다.'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024  // 50MB
  }
});

// 업로드 후 메타데이터 추출
async function extractMetadata(filePath: string) {
  const metadata = await mm.parseFile(filePath);
  return {
    title: metadata.common.title || path.basename(filePath),
    artist: metadata.common.artist || null,
    album: metadata.common.album || null,
    duration: Math.round(metadata.format.duration || 0),
    mimeType: `audio/${metadata.format.container || 'mpeg'}`
  };
}
```

---

## CORS 설정 주의사항

프론트엔드에서 오디오를 스트리밍하려면 다음 헤더가 반드시 필요합니다:

```typescript
// ⚠️ 필수 CORS 헤더
app.use(cors({
  origin: true,  // 또는 특정 도메인
  exposedHeaders: [
    'Content-Range',      // Range 응답에 필요
    'Accept-Ranges',      // Range 지원 표시
    'Content-Length',     // 파일 크기
    'Content-Type'        // MIME 타입
  ]
}));
```

---

## 프론트엔드 연동 예시

백엔드 API와 연동하는 프론트엔드 코드 예시입니다.

```typescript
// src/contexts/MusicPlayerContext.tsx
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string | null;
  duration: number;
  coverUrl: string | null;
  streamUrl: string;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playlist: Track[];
  play: (track?: Track) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  loadPlaylist: (tracks: Track[]) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<Track[]>([]);

  // Audio 요소 초기화
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handleTrackEnd = () => {
    next();
  };

  const play = async (track?: Track) => {
    if (!audioRef.current) return;

    if (track && track.id !== currentTrack?.id) {
      setCurrentTrack(track);
      // ⚠️ 백엔드 스트리밍 URL 사용
      audioRef.current.src = `${import.meta.env.VITE_API_URL}${track.streamUrl}`;

      // 재생 횟수 증가 API 호출
      fetch(`${import.meta.env.VITE_API_URL}/api/music/tracks/${track.id}/play`, {
        method: 'POST'
      });
    }

    await audioRef.current.play();
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const toggle = () => {
    isPlaying ? pause() : play();
  };

  const next = () => {
    if (playlist.length === 0 || !currentTrack) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    play(playlist[nextIndex]);
  };

  const previous = () => {
    if (playlist.length === 0 || !currentTrack) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    play(playlist[prevIndex]);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const loadPlaylist = (tracks: Track[]) => {
    setPlaylist(tracks);
    if (tracks.length > 0 && !currentTrack) {
      setCurrentTrack(tracks[0]);
    }
  };

  return (
    <MusicPlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      volume,
      currentTime,
      duration,
      playlist,
      play,
      pause,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      loadPlaylist
    }}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
};
```

---

## 체크리스트

백엔드 구현 완료 후 확인해야 할 항목입니다.

### 필수 구현 항목

- [ ] `GET /api/music/tracks` - 트랙 목록 조회
- [ ] `GET /api/music/tracks/:id` - 트랙 상세 조회
- [ ] `GET /api/music/stream/:id` - **오디오 스트리밍 (Range 지원)**
- [ ] `GET /api/music/playlists` - 플레이리스트 목록
- [ ] `GET /api/music/playlists/:id` - 플레이리스트 상세 (트랙 포함)
- [ ] `POST /api/music/tracks/:id/play` - 재생 횟수 증가

### Range Request 검증

```bash
# 전체 파일 요청
curl -I http://localhost:3000/api/music/stream/track_xxx

# 예상 응답:
# HTTP/1.1 200 OK
# Accept-Ranges: bytes
# Content-Length: 5242880
# Content-Type: audio/mpeg

# 부분 파일 요청 (Range)
curl -I -H "Range: bytes=0-1023" http://localhost:3000/api/music/stream/track_xxx

# 예상 응답:
# HTTP/1.1 206 Partial Content
# Content-Range: bytes 0-1023/5242880
# Content-Length: 1024
# Content-Type: audio/mpeg
```

### CORS 검증

```bash
# preflight 요청 확인
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Range" \
  http://localhost:3000/api/music/stream/track_xxx -v

# Access-Control-Expose-Headers에 Content-Range가 포함되어야 함
```

---

## 보안 고려사항

1. **파일 경로 검증**: 트랙 ID로 DB 조회 후 파일 경로 사용 (Path Traversal 방지)
2. **파일 형식 검증**: 업로드 시 MIME 타입 확인
3. **Rate Limiting**: 스트리밍 API에 요청 제한 적용
4. **인증** (선택): 비공개 트랙에 대한 접근 제어

---

## 문의

구현 중 문의사항이 있으시면 프론트엔드 담당자에게 연락해 주세요.

- 프론트엔드 담당: [담당자명]
- 이 문서 작성일: 2025-01-15
