# 🏗️ 아키텍처 문서

## 📋 시스템 아키텍처 개요

### 애플리케이션 구조
```
스톤에이지 라이트 앱
├── 🎨 프레젠테이션 레이어     # React Components
├── 🔄 상태 관리 레이어        # React Hooks + LocalStorage
├── 📊 데이터 레이어          # JSON Files + Firebase
└── 🛠️ 유틸리티 레이어        # Helpers + Custom Hooks
```

## 🧩 컴포넌트 아키텍처

### 계층 구조
```
App.tsx (라우터 + 전역 상태)
├── 📄 Pages (페이지 컴포넌트)
│   ├── PetsPage.tsx           # 펫 목록 + 검색/필터
│   ├── BoardingPage.tsx       # 펫 탑승 정보
│   ├── ItemsPage.tsx          # 아이템 목록
│   ├── QuestsPage.tsx         # 퀘스트 목록
│   ├── QuestDetailPage.tsx    # 퀘스트 상세
│   ├── CalculatorPage.tsx     # 계산기 도구
│   └── BoardPage.tsx          # 커뮤니티 게시판
├── 🧱 Components (재사용 컴포넌트)
│   ├── 🎨 UI Components       # 기본 UI 요소
│   ├── 🔍 Filter Components   # 검색/필터링
│   ├── 📱 Layout Components   # 레이아웃/네비게이션
│   └── 🎯 Feature Components  # 기능별 전용 컴포넌트
└── 🪝 Hooks (커스텀 훅)
    ├── useInfiniteScroll.ts   # 무한 스크롤
    ├── useDebounce.ts         # 디바운싱
    └── useIntersectionObserver.ts # 교차 관찰자
```

## 📱 페이지 컴포넌트 상세

### PetsPage.tsx
**역할**: 펫 정보 메인 페이지
**기능**:
- 펫 목록 표시 (무한 스크롤)
- 실시간 검색 (300ms 디바운싱)
- 다중 필터링 (속성, 등급, 스탯, 즐겨찾기)
- 탭 네비게이션 (info/skills)
- URL 상태 동기화

**주요 로직**:
```typescript
// 검색 및 필터링 통합
const filteredPets = useMemo(() => {
  return petsData.filter(pet => {
    const matchesSearch = searchMultipleFields(pet, debouncedSearchTerm);
    const matchesElement = elementFilter.every(element => /* 속성 필터 */);
    const matchesGrade = gradeFilter.includes(pet.grade);
    const matchesStat = statFilters.every(filter => /* 스탯 필터 */);
    const matchesFavorite = !showOnlyFavorites || isFavorite(pet);
    
    return matchesSearch && matchesElement && matchesGrade && 
           matchesStat && matchesFavorite;
  });
}, [petsData, debouncedSearchTerm, filters...]);
```

### BoardingPage.tsx
**역할**: 펫 탑승 정보 관리
**기능**:
- 탑승 가능 펫 목록
- 캐릭터별 탑승 정보
- 탑승 조건 및 효과 표시

### ItemsPage.tsx
**역할**: 게임 아이템 정보
**데이터 소스**: pooyas_items.json, right_items.json
**기능**:
- 아이템 검색 및 필터링
- 카테고리별 분류
- 상세 정보 모달

## 🧱 핵심 컴포넌트 분석

### 🎨 UI Components

#### Header.tsx
```typescript
interface HeaderProps {
  // 브랜딩 및 네비게이션
}
```
- 로고 및 제목 표시
- 외부 링크 (공식 사이트)
- 반응형 레이아웃

#### TabNavigation.tsx
```typescript
interface TabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
```
- 페이지 간 네비게이션
- 활성 상태 표시
- 모바일 최적화

#### ThemeToggle.tsx
```typescript
interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}
```
- 다크/라이트 모드 전환
- localStorage 영속화
- CSS 변수 기반 테마

### 🔍 Filter Components

#### SearchBar.tsx
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```
- 실시간 검색 입력
- 디바운싱 최적화
- 검색어 하이라이팅

#### ElementFilter.tsx
```typescript
interface ElementFilterItem {
  element: 'earth' | 'water' | 'fire' | 'wind';
  min: number;
  max: number;
}
```
- 속성별 필터링 (지/수/화/풍)
- 수치 범위 설정
- 다중 선택 지원

#### StatFilter.tsx
```typescript
interface StatFilterItem {
  stat: 'attack' | 'defense' | 'agility' | 'vitality';
  min: number;
  max: number;
  enabled: boolean;
}
```
- 기본 스탯 필터링
- 성장률 필터링
- 조합 스탯 (공+방, 공+순 등)
- 슬라이더 UI

#### GradeFilter.tsx
```typescript
type GradeType = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
```
- 등급별 필터링
- 체크박스 인터페이스
- 전체 선택/해제

#### FavoriteFilter.tsx
```typescript
interface FavoriteState {
  showOnlyFavorites: boolean;
  favoriteCount: number;
}
```
- 즐겨찾기 전용 필터
- 로컬스토리지 연동
- 실시간 카운트

### 📱 Layout Components

#### FloatingFilterButton.tsx (모바일 전용)
```typescript
interface FloatingButtonProps {
  onFilterOpen: () => void;
  hasActiveFilters: boolean;
}
```
- 모바일 필터 버튼
- 활성 필터 표시
- 플로팅 위치

#### FilterBottomSheet.tsx (모바일 전용)
```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```
- 모바일 필터 UI
- 슬라이드 애니메이션
- 오버레이 처리

#### ScrollToTopButton.tsx
```typescript
interface ScrollButtonState {
  isVisible: boolean;
  scrollProgress: number;
}
```
- 스크롤 탑 버튼
- 진행률 표시
- 부드러운 스크롤

### 🎯 Feature Components

#### PetGrid.tsx
```typescript
interface PetGridProps {
  pets: Pet[];
  isLoading?: boolean;
}
```
- 펫 목록 그리드 레이아웃
- 무한 스크롤 통합
- 스켈레톤 로딩

#### PetCard.tsx
```typescript
interface PetCardProps {
  pet: Pet;
}
```
- 개별 펫 정보 카드
- 즐겨찾기 토글
- 상세 모달 연동
- 공유 기능

#### PetDetailModal.tsx
```typescript
interface ModalProps {
  pet: Pet | null;
  isOpen: boolean;
  onClose: () => void;
}
```
- 펫 상세 정보 모달
- 스탯 차트 표시
- 탭 인터페이스

#### PetBoardingModal.tsx
```typescript
interface BoardingModalProps {
  pet: Pet;
  boardingData: BoardingInfo[];
}
```
- 탑승 정보 모달
- 캐릭터별 매핑
- 조건 및 효과 표시

## 🪝 커스텀 훅 아키텍처

### useInfiniteScroll.ts
```typescript
interface UseInfiniteScrollProps<T> {
  items: T[];
  itemsPerPage: number;
}

interface UseInfiniteScrollReturn<T> {
  displayedItems: T[];
  hasMore: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
  loadMore: () => void;
  reset: () => void;
}
```

**기능**:
- 페이지네이션 로직
- 로딩 상태 관리
- 성능 최적화 (메모이제이션)
- 자동 리셋 (검색어 변경 시)

**최적화 포인트**:
- `useMemo`로 표시 아이템 계산 최적화
- `useRef`로 중복 로딩 방지
- 짧은 딜레이(50ms)로 UX 개선

### useDebounce.ts
```typescript
function useDebounce<T>(value: T, delay: number): T;
```

**기능**:
- 입력 디바운싱 (300ms)
- API 호출 최적화
- 검색 성능 향상

### useIntersectionObserver.ts
```typescript
interface UseIntersectionObserverProps {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
}
```

**기능**:
- 무한 스크롤 트리거
- 뷰포트 감지
- 성능 최적화

## 📊 데이터 아키텍처

### 데이터 플로우
```
JSON Files → Import → Component State → UI Rendering
                ↓
          Local Storage ← → User Preferences
                ↓
           Firebase ← → Comments & Analytics
```

### 타입 시스템
```typescript
// 새로운 정규화된 구조
interface Pet {
  id: string;
  name: string;
  baseStats: {
    attack: number;
    defense: number;
    agility: number;
    vitality: number;
  };
  growthStats: {
    attack: number;
    defense: number;
    agility: number;
    vitality: number;
  };
  elementStats: {
    water: number;
    fire: number;
    wind: number;
    earth: number;
  };
}

// 레거시 호환성 구조
interface PetLegacy {
  name: string;
  attack: number;
  defense: number;
  // ... 플랫 구조
}
```

### 상태 관리 패턴
```typescript
// 지역 상태 (컴포넌트별)
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState(defaultFilters);

// 전역 상태 (localStorage)
const [theme, setTheme] = useLocalStorage('theme', 'dark');
const [favorites, setFavorites] = useLocalStorage('favorites', []);

// 외부 상태 (Firebase)
const [comments, setComments] = useFirebase('comments');
```

## 🎨 스타일링 아키텍처

### CSS 변수 시스템
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1e293b;
  --accent: #3b82f6;
}

.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --accent: #60a5fa;
}
```

### Tailwind 확장
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'bg-primary': 'var(--bg-primary)',
      'text-primary': 'var(--text-primary)',
    },
    screens: {
      'iphone16': { max: '430px' },
    }
  }
}
```

## 🚀 성능 아키텍처

### 렌더링 최적화
```typescript
// 컴포넌트 메모이제이션
const PetCard = React.memo(({ pet }) => {
  // 렌더링 로직
});

// 계산 메모이제이션
const filteredPets = useMemo(() => {
  return pets.filter(filterLogic);
}, [pets, filters]);

// 콜백 메모이제이션
const handleFilterChange = useCallback((newFilter) => {
  setFilters(newFilter);
}, []);
```

### 지연 로딩 전략
```typescript
// 무한 스크롤 (페이지네이션)
const { displayedItems, loadMore } = useInfiniteScroll({
  items: filteredPets,
  itemsPerPage: 60
});

// 이미지 지연 로딩
<img 
  loading="lazy"
  src={pet.imageLink}
  alt={pet.name}
/>
```

## 🔒 보안 아키텍처

### 데이터 검증
```typescript
// 입력 검증
const sanitizeSearchTerm = (term: string) => {
  return term.replace(/[<>]/g, '').trim();
};

// 타입 가드
const isPet = (obj: unknown): obj is Pet => {
  return typeof obj === 'object' && 
         obj !== null && 
         'name' in obj;
};
```

### Firebase 보안 규칙
```javascript
// Firestore 규칙 (예상)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /comments/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📈 확장성 고려사항

### 모듈화 구조
```
src/
├── features/           # 기능별 모듈
│   ├── pets/          # 펫 관련 모든 코드
│   ├── items/         # 아이템 관련 코드
│   └── quests/        # 퀘스트 관련 코드
├── shared/            # 공통 컴포넌트/유틸
└── core/             # 핵심 설정/타입
```

### API 레이어 (미래 확장)
```typescript
// 향후 API 통합 구조
interface ApiService {
  getPets(): Promise<Pet[]>;
  getItems(): Promise<Item[]>;
  postComment(comment: Comment): Promise<void>;
}
```

### 상태 관리 확장 (미래)
```typescript
// Zustand/Redux 도입 시
interface AppState {
  pets: Pet[];
  filters: FilterState;
  user: UserState;
  ui: UIState;
}
```

---

**아키텍처 버전**: 1.0  
**마지막 업데이트**: 2025-09-23  
**복잡도**: ⭐⭐⭐⭐☆ (중간-높음)  
**유지보수성**: ⭐⭐⭐⭐⭐ (매우 좋음)