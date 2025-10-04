# 🐾 스톤에이지 환수강림 라이트 - 프로젝트 인덱스

## 📁 프로젝트 개요

**프로젝트명**: stoneage-light  
**타입**: React TypeScript 웹 애플리케이션  
**목적**: 스톤에이지 환수강림의 모든 펫, 아이템, 퀘스트 정보 검색 및 관리  
**빌드 도구**: Vite  
**패키지 매니저**: pnpm

## 🏗️ 전체 구조

```
stoneage/
├── 📁 src/                    # 소스 코드
│   ├── 📁 components/         # React 컴포넌트 (24개)
│   ├── 📁 pages/             # 페이지 컴포넌트 (7개)
│   ├── 📁 data/              # JSON 데이터 파일 (15개)
│   ├── 📁 hooks/             # 커스텀 훅
│   ├── 📁 utils/             # 유틸리티 함수
│   ├── 📁 types/             # TypeScript 타입 정의
│   ├── 📁 lib/               # 라이브러리 설정
│   └── 📁 styles/            # 스타일 파일
├── 📁 scripts/               # 데이터 스크래핑 스크립트 (5개)
├── 📁 public/                # 정적 파일
└── 📁 dist/                  # 빌드 결과물
```

## 🎯 핵심 기능 영역

### 1. 펫 관리 시스템
- **PetsPage**: 메인 펫 목록 및 검색
- **PetDetailModal**: 펫 상세 정보 모달
- **BoardingPage**: 펫 탑승 정보 관리
- **PetBoardingModal**: 탑승 관련 상세 정보

### 2. 아이템 시스템
- **ItemsPage**: 아이템 목록 및 검색
- **데이터**: pooyas_items.json, right_items.json

### 3. 퀘스트 시스템
- **QuestsPage**: 퀘스트 목록
- **QuestDetailPage**: 퀘스트 상세 정보
- **데이터**: quest.json, questWithContent.json

### 4. 계산기 도구
- **CalculatorPage**: 게임 내 계산 도구
- **ExpTableModal**: 경험치 테이블

### 5. 커뮤니티 기능
- **BoardPage**: 게시판
- **FirebaseComments**: Firebase 기반 댓글 시스템

## 🔧 주요 컴포넌트

### 📱 UI 컴포넌트
| 컴포넌트 | 역할 | 특징 |
|---------|------|------|
| `Header.tsx` | 헤더 및 썸네일 | 브랜딩, 네비게이션 |
| `TabNavigation.tsx` | 메인 탭 네비게이션 | 페이지 간 이동 |
| `ThemeToggle.tsx` | 테마 변경 | 다크/라이트 모드 |
| `SearchBar.tsx` | 검색 입력 | 실시간 검색, 디바운싱 |

### 🔍 필터링 시스템
| 컴포넌트 | 기능 | 데이터 타입 |
|---------|------|----------|
| `ElementFilter.tsx` | 속성 필터 | 지/수/화/풍 |
| `StatFilter.tsx` | 스탯 필터 | 수치 범위 |
| `GradeFilter.tsx` | 등급 필터 | S~F 등급 |
| `FavoriteFilter.tsx` | 즐겨찾기 | 로컬스토리지 |

### 📋 데이터 표시
| 컴포넌트 | 용도 | 성능 최적화 |
|---------|------|------------|
| `PetGrid.tsx` | 펫 목록 그리드 | 무한 스크롤 |
| `PetCard.tsx` | 개별 펫 카드 | React.memo |
| `PetCardSkeleton.tsx` | 로딩 스켈레톤 | UX 개선 |
| `RebirthCard.tsx` | 리버스 카드 | 특수 표시 |

### 🎛️ 상호작용
| 컴포넌트 | 기능 | 플랫폼 |
|---------|------|--------|
| `FloatingFilterButton.tsx` | 모바일 필터 | 모바일 전용 |
| `FilterBottomSheet.tsx` | 바텀시트 | 모바일 전용 |
| `ScrollToTopButton.tsx` | 상단 이동 | 전체 |
| `PageShareButton.tsx` | 페이지 공유 | 전체 |

## 📊 데이터 구조

### 핵심 데이터 파일
| 파일명 | 크기 | 내용 | 업데이트 |
|--------|------|------|---------|
| `pets.json` | ~500KB | 펫 정보 | 스크래핑 |
| `boarding.json` | ~50KB | 탑승 정보 | 수동 |
| `characters.json` | ~100KB | 캐릭터 정보 | 스크래핑 |
| `quest.json` | ~200KB | 퀘스트 기본 | 스크래핑 |
| `questWithContent.json` | ~1MB | 퀘스트 상세 | 스크래핑 |
| `pooyas_items.json` | ~300KB | 아이템 정보 | 스크래핑 |
| `skills.json` | ~50KB | 스킬 정보 | 수동 |
| `level_exp.json` | ~10KB | 경험치 테이블 | 고정 |

### 보조 데이터
- `pet-riding.json`: 펫 탑승 매핑
- `right_items.json`: 정제된 아이템 데이터
- `petData_2025.09.18.json`: 백업 데이터

## 🛠️ 스크래핑 시스템

### 스크립트 파일
| 스크립트 | 대상 사이트 | 데이터 | 실행 명령 |
|---------|------------|------|----------|
| `petScraper.js` | hwansoo.net | 펫 정보 | `npm run scrape:pets` |
| `questScraper.js` | hwansoo.net | 퀘스트 기본 | `npm run scrape:quests` |
| `questScraperWithContent.js` | hwansoo.net | 퀘스트 상세 | `npm run scrape:quests:content` |
| `characterScraper.js` | hwansoo.net | 캐릭터 정보 | 수동 실행 |
| `cleanCharacters.js` | - | 데이터 정제 | 후처리 |

### 외부 스크립트
- `scrape_items.js`: 아이템 스크래핑 (`npm run scrape:items`)
- `fast_scrape.js`: 고속 스크래핑
- `final_scrape.js`: 최종 스크래핑
- `fixed_scrape.js`: 수정된 스크래핑

## 🎨 기술 스택

### 프론트엔드
- **React 19.1.1**: UI 라이브러리
- **TypeScript 5.8.3**: 타입 안전성
- **React Router DOM 7.9.1**: 라우팅
- **Tailwind CSS 3.4.14**: 스타일링

### 빌드 도구
- **Vite 7.1.2**: 빌드 시스템
- **PostCSS 8.5.6**: CSS 후처리
- **Autoprefixer**: 브라우저 호환성

### 개발 도구
- **ESLint**: 코드 품질
- **Prettier**: 코드 포맷팅
- **TypeScript ESLint**: TS 린팅

### 데이터 수집
- **Puppeteer 24.21.0**: 웹 스크래핑
- **Firebase 12.2.1**: 댓글 시스템

## 🚀 성능 최적화

### 렌더링 최적화
- React.memo 사용 컴포넌트: PetCard, 필터 컴포넌트들
- useMemo/useCallback: 검색 및 필터링 로직
- 무한 스크롤: 60개씩 점진적 로딩

### 검색 성능
- 300ms 디바운싱
- 메모이제이션된 필터링
- 효율적인 상태 관리

### 사용자 경험
- 스켈레톤 로딩
- 실시간 필터 동기화
- 부드러운 애니메이션

## 📱 반응형 디자인

### 브레이크포인트
- **모바일**: iPhone 16 Pro 기준 (~375px)
- **태블릿**: md (768px+)
- **데스크톱**: lg (1024px+)

### 모바일 특화 기능
- 플로팅 필터 버튼
- 바텀시트 UI
- 터치 최적화 인터페이스

## 🔄 상태 관리

### 로컬 상태
- React Hooks (useState, useEffect)
- 컴포넌트별 독립적 상태

### 전역 상태
- 테마: localStorage
- 즐겨찾기: localStorage
- 필터 상태: URL 파라미터

### 데이터 흐름
```
데이터 파일 → 컴포넌트 import → 상태 관리 → UI 렌더링
```

## 🧪 품질 관리

### 코드 품질
- ESLint 설정: 엄격한 규칙
- Prettier: 일관된 포맷팅
- TypeScript: 타입 안전성

### 성능 모니터링
- React DevTools 호환
- 번들 크기 최적화
- 로딩 성능 최적화

## 🌐 배포 및 호스팅

### 빌드 설정
- **개발**: `npm run dev` (포트 9999)
- **빌드**: `npm run build`
- **미리보기**: `npm run preview`

### 정적 파일 호스팅
- Hash Router 사용 (GitHub Pages 호환)
- public 폴더: 정적 자산
- dist 폴더: 빌드 결과물

## 🔗 외부 연동

### 공식 사이트 연동
- **환수강림 라이트**: https://www.hwansoo.top/
- **환수강림 네트**: https://www.hwansoo.net/

### Firebase 연동
- 댓글 시스템
- 방문자 추적
- 관리자 인증

## 📈 확장 가능성

### 추가 예정 기능
- 펫 비교 도구
- 개인 컬렉션 관리
- 펫 조합 시뮬레이터

### 기술적 확장
- PWA 지원
- 오프라인 모드
- 실시간 데이터 동기화

---

**마지막 업데이트**: 2025-09-23  
**버전**: 0.0.0  
**개발자**: 명가