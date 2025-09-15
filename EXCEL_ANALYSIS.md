# Excel 환포계산기 완전 분석 보고서 - EXACT FORMULAS

## 개요

이 문서는 "Job Character.xlsx" 파일의 **정확한 Excel 공식들을 추출**하여 분석한 완전한 보고서입니다. 사용자가 기존 구현에서 공식을 추측했다고 지적한 문제를 해결하기 위해, Excel에서 실제로 사용되는 모든 공식을 정확히 추출했습니다.

## 1. 기본 구조와 입력 상수값

### Worksheet: 환포 (Rebirth)

- **Used Range**: Rows 1-1000, Columns A-AP (1-41)
- **Active Range**: Rows 1-141, Columns B-R

### 입력 상수값들 (사용자 입력 흰색 셀):

- **C6 = 140** (1환 레벨)
- **C7 = 20** (1환 환포퀘)
- **C9 = 437** (1환 체력)
- **C10 = 0** (1환 완력)
- **C11 = 0** (1환 건강)
- **C26 = 10** (1환 보너스스탯)
- **N9 = 2** (6환 체력)
- **N10 = 2** (6환 완력)
- **N11 = 2** (6환 건강)
- **N12 = 589** (6환 순발)

## Visual Layout

```
    A  B     C      D      E      F      G      H      I      J      K      L      M   N      O
1           레벨                  포인트
2      흰색 칸  Lv, 체, 완, 건 입력
3           나머지는 자동계산이에요~~
4
5      구분   1환            2환            3환            4환            5환            6환(N열)
6      Lv    140    [calc]  140    [calc]  140    [calc]  140    [calc]  140    [calc]      140
7      환포퀘  20     [calc]  20     [calc]  20     [calc]  20     [calc]  20     [calc]      20
8           표시스탯  실스탯  표시스탯  실스탯  표시스탯  실스탯  표시스탯  실스탯  표시스탯  실스탯      표시스탯  실스탯
9      체    437    [calc]  482    [calc]  514    [calc]  546    [calc]  577    [calc]      2      [calc]
10     완    0      [calc]  0      [calc]  0      [calc]  0      [calc]  0      [calc]      2      [calc]
11     건    0      [calc]  0      [calc]  0      [calc]  0      [calc]  0      [calc]      2      [calc]
12     순    [calc] [calc]  [calc] [calc]  [calc] [calc]  [calc] [calc]  [calc] [calc]      589    [calc]
13     합계   [calc] [calc]  [calc] [calc]  [calc] [calc]  [calc] [calc]  [calc] [calc]      [calc] [calc]
14     남은포인트 [calc]      [calc]         [calc]         [calc]         [calc]              [calc]
...
18     누적환포수 [calc]      [calc]         [calc]         [calc]         [calc]              [calc]
19     누적레벨수 [calc]      [calc]         [calc]         [calc]         [calc]              [calc]
20     환포계수  [calc]      [calc]         [calc]         [calc]         [calc]              [calc]
...
22-25  환포적용 [calc] [calc] [calc] [calc] [calc] [calc] [calc] [calc] [calc] [calc]     [calc] [calc]
26     보너스   10     10     20     20     30     30     40     40     50     50         50     50
27     실제환포 [calc] [calc] [calc] [calc] [calc] [calc] [calc] [calc] [calc] [calc]     [calc]
28     MAX환포  66            98            130           161           192
...
32     최종스탯 437          [calc]        [calc]        [calc]        [calc]  [calc]
...
35-40  예제빌드 (A-E 타입별 스탯 분배 예시)
```

## Cell Categories

### Input Cells (User Editable - White cells)

These are the primary user inputs that control all calculations:

**Level & Quest Inputs:**

- `C6, E6, G6, I6, K6, N6`: Level for each rebirth (Default: 140)
- `C7, E7, G7, I7, K7, N7`: Quest completion count (Default: 20)

**Stat Distribution Inputs (per rebirth):**

- `C9, E9, G9, I9, K9, N9`: 체 (HP/Constitution) stats
- `C10, E10, G10, I10, K10, N10`: 완 (STR/Power) stats
- `C11, E11, G11, I11, K11, N11`: 건 (DEX/Dexterity) stats
- `N12`: 순 (AGI/Agility) for 6th rebirth (589 default)

**Example Build Inputs:**

- `C37, E37, G37, I37, K37`: Character type examples (체 stats)
- `C39, E39, G39, I39, K39`: 건 stats for examples
- `C40, E40, G40, I40, K40`: 순 stats for examples

### Key Calculated Fields

#### Core Stats Calculations

- **총합 (Row 13)**: `=SUM(C9:C12)` - Total stats per rebirth
- **남은포인트 (Row 14)**: Available points calculation
- **순 계산 (Row 12)**: `=C32-C11-C10-C9-(437-(20+3*(C6-1)))`

#### Rebirth Coefficient Calculation (환포계수 - Row 20)

**Formula**: `=TRUNC((C13/12)+(C18/4)+(C19-(85*(rebirth_number)))/4)`

Components:

- `C13/12`: Total stats ÷ 12
- `C18/4`: Cumulative quests ÷ 4
- `(C19-(85*rebirth_number))/4`: Excess levels ÷ 4

#### Rebirth Application (Rows 22-25)

**Formula**: `=TRUNC((stat_ratio * rebirth_coefficient) + 0.5)`

Where stat_ratio = individual_stat / total_stats

#### Final Rebirth Value (Row 27)

**Formula**: `=SUM(C22:C25)+C26`

- Sum of applied rebirth stats + bonus stats

#### Final Character Stats (Row 32)

**Formula**: `=417 + rebirth_value`

## Constants Used

| Constant         | Value             | Usage                           |
| ---------------- | ----------------- | ------------------------------- |
| Base HP Level 1  | 437               | Starting character HP           |
| Base Quest Bonus | 20                | Default quest completion        |
| Points Per Level | 3                 | Stat points gained per level    |
| Base Stats       | 417               | Base calculation constant       |
| Level Offset     | 85                | Used in rebirth coefficient     |
| Bonus Stats      | 10,20,30,40,50,50 | Per-rebirth bonus               |
| Max Rebirth      | 66,98,130,161,192 | Maximum possible rebirth values |

## Data Flow

```
User Inputs (Level, Quests, Stats)
    ↓
Calculate Total Stats & Remaining Points
    ↓
Calculate Cumulative Values (Quests, Levels)
    ↓
Calculate Rebirth Coefficient
    ↓
Apply Rebirth Distribution (proportional to stat ratios)
    ↓
Add Bonus Stats
    ↓
Final Rebirth Value
    ↓
Final Character Stats (417 + rebirth)
```

## Formula Dependencies

### Forward Dependencies

- Stats inputs → Total stats → Rebirth coefficient → Applied rebirth → Final rebirth → Final stats

### Circular Dependencies

- 순 (AGI) calculation depends on final stats (C32) which depends on rebirth calculations
- This creates a circular reference resolved by Excel's iterative calculation

### Cross-Rebirth Dependencies

- Each rebirth's "실스탯" (real stats) includes previous rebirth bonuses
- Cumulative calculations build up across rebirths

## Web Implementation Considerations

### State Management

- Need reactive calculation system to handle formula dependencies
- Consider using computed properties/derived state for all calculated fields

### Input Validation

- Level range validation (typically 1-140+)
- Stat point allocation validation
- Maximum rebirth value constraints

### Calculation Order

1. Validate inputs
2. Calculate base totals
3. Calculate cumulative values
4. Calculate rebirth coefficients
5. Apply rebirth distribution
6. Calculate final values

### Performance

- All calculations should be instant/reactive
- Consider memoization for complex formulas
- Handle circular dependencies explicitly

## Key Features to Implement

1. **Real-time calculation** as user types
2. **Multiple rebirth tracking** (1st through 6th)
3. **Stat distribution visualization**
4. **Example build templates** (A-E types)
5. **Remaining points indicator**
6. **Maximum rebirth warnings**
7. **Export/Import capability**

## UI Layout Recommendations

### Primary Input Panel

- Level and Quest inputs for each rebirth
- Stat distribution sliders/inputs
- Real-time remaining points display

### Calculation Display Panel

- Rebirth coefficients
- Applied rebirth values
- Final character stats

### Results Panel

- Final stat totals
- Comparison with max possible values
- Character type matching

## 2. 정확한 Excel 공식 추출

### 순발력 계산 공식 (가장 중요!):

```excel
C12: =C32-C11-C10-C9-(437-(20+3*(C6-1)))
E12: =E32-E11-E10-E9-(437-(20+3*(E6-1)))
G12: =G32-G11-G10-G9-(437-(20+3*(G6-1)))
I12: =I32-I11-I10-I9-(437-(20+3*(I6-1)))
K12: =K32-K11-K10-K9-(437-(20+3*(K6-1)))
```

**해석**: 순발 = 해당환총스탯 - 건강 - 완력 - 체력 - (437 - (20 + 3×(레벨-1)))

### 환포계수 계산 공식:

```excel
C20: =TRUNC((C13/12)+(C18/4)+(C19-(85*(1)))/4)
E20: =TRUNC((E13/12)+(E18/4)+(E19-(85*(E17)))/4)
G20: =TRUNC((G13/12)+(G18/4)+(G19-(85*(G17)))/4)
I20: =TRUNC((I13/12)+(I18/4)+(I19-(85*(I17)))/4)
K20: =TRUNC((K13/12)+(K18/4)+(K19-(85*(K17)))/4)
N20: =TRUNC((N13/12)+(N18/4)+(N19-(85*(6)))/4)
```

**공식 구조**: TRUNC(총스탯/12 + 누적환포수/4 + (누적레벨수 - 85×환수)/4)

### 누적 환포수 계산:

```excel
C18: =SUM(C7)           // 1환: 20
E18: =SUM(C7:E7)        // 1-2환 합계: 40
G18: =SUM(C7:G7)        // 1-3환 합계: 60
I18: =SUM(C7:I7)        // 1-4환 합계: 80
K18: =SUM(C7:K7)        // 1-5환 합계: 100
N18: =SUM(C7:N7)        // 1-6환 합계: 120
```

### 누적 레벨수 계산:

```excel
C19: =IF(C$6>=130,C$6,C$6)                    // 1환 레벨
E19: =SUM(IF(E$6>=130,E$6,E$6)+C$19)          // 1-2환 레벨 합계
G19: =SUM(IF(G$6>=130,G$6,G$6)+E$19)          // 1-3환 레벨 합계
I19: =SUM(IF(I$6>=130,I$6,I$6)+G$19)          // 1-4환 레벨 합계
K19: =SUM(IF(K$6>=130,K$6,K$6)+I$19)          // 1-5환 레벨 합계
N19: =SUM(IF(N$6>=130,130,N$6)+K$19)          // 1-6환 레벨 합계
```

### 스탯 총합 계산:

```excel
C13: =SUM(C9:C12)   // 체+완+건+순
D13: =SUM(D9:D12)   // 실제 스탯 총합
E13: =SUM(E9:E12)
F13: =SUM(F9:F12)
// ... 모든 환에 대해 동일
```

## 3. 순환 참조 구조 (핵심!)

### 실제 스탯 계산 (D열):

```excel
D9: =C9      // 1환 실제 체력 = 표시 체력
D10: =C10    // 1환 실제 완력 = 표시 완력
D11: =C11    // 1환 실제 건강 = 표시 건강
D12: =C12    // 1환 실제 순발 = 계산된 순발
```

### 다음 환 실제 스탯 (순환 참조 시작):

```excel
F9: =E9+(D22-C22)      // 2환 실제 체력 = 표시 + (1환실환포체 - 1환적용환포체)
F10: =E10+(D23-C23)    // 2환 실제 완력 = 표시 + (1환실환포완 - 1환적용환포완)
F11: =E11+(D24-C24)    // 2환 실제 건강 = 표시 + (1환실환포건 - 1환적용환포건)
F12: =E12+(D25-C25)    // 2환 실제 순발 = 표시 + (1환실환포순 - 1환적용환포순)
```

### 환포 적용 계산 (C21 값을 참조):

```excel
// 적용환포 값들 (C21에 입력되는 값을 참조)
E21: =$C$21    // 2환 적용환포 = C21값
G21: =$C$21    // 3환 적용환포 = C21값
I21: =$C$21    // 4환 적용환포 = C21값
K21: =$C$21    // 5환 적용환포 = C21값
N21: =$C$21    // 6환 적용환포 = C21값
```

### 각 스탯별 환포 분배:

```excel
// 1환 체력 환포
C22: =TRUNC((D9/D13)*(C20)+0.5)      // 적용환포체
D22: =TRUNC((D9/D13)*(C20)+0.5,2)    // 실환포체

// 1환 완력 환포
C23: =TRUNC((D10/D13)*(C20)+0.5)     // 적용환포완
D23: =TRUNC((D10/D13)*(C20)+0.5,2)   // 실환포완

// 1환 건강 환포
C24: =TRUNC((D11/D13)*(C20)+0.5)     // 적용환포건
D24: =TRUNC((D11/D13)*(C20)+0.5,2)   // 실환포건

// 1환 순발 환포
C25: =TRUNC((D12/D13)*(C20)+0.5)     // 적용환포순
D25: =TRUNC((D12/D13)*(C20)+0.5,2)   // 실환포순
```

### 실제 환포 합계:

```excel
C27: =SUM(C22:C25)+C26    // 1환 실제환포 = 분배환포합계 + 보너스(10)
D27: =SUM(D22:D25)+D26    // 1환 실제환포 (상세버전)
E27: =SUM(E22:E25)+E26    // 2환 실제환포 = 분배환포합계 + 보너스(20)
// ... 계속
```

### 다음 환 총 스탯:

```excel
E32: =417+C27    // 2환 총스탯 = 417 + 1환실제환포
G32: =417+E27    // 3환 총스탯 = 417 + 2환실제환포
I32: =417+G27    // 4환 총스탯 = 417 + 3환실제환포
K32: =417+I27    // 5환 총스탯 = 417 + 4환실제환포
L32: =417+K27    // 6환 총스탯 = 417 + 5환실제환포
```

### 남은 포인트 계산:

```excel
C14: =20+(3*(C6-1))-C13      // 1환 남은포인트 = 환포퀘 + 레벨보너스 - 총스탯
E14: =C27+(3*(E6-1))-E13     // 2환 남은포인트 = 1환실제환포 + 레벨보너스 - 총스탯
G14: =E27+(3*(G6-1))-G13     // 3환 남은포인트 = 2환실제환포 + 레벨보너스 - 총스탯
I14: =G27+(3*(I6-1))-I13     // 4환 남은포인트 = 3환실제환포 + 레벨보너스 - 총스탯
K14: =I27+(3*(K6-1))-K13     // 5환 남은포인트 = 4환실제환포 + 레벨보너스 - 총스탯
N14: =K27+(3*(N6-1))-N13     // 6환 남은포인트 = 5환실제환포 + 레벨보너스 - 총스탯
```

## 4. 순환 참조 해결 방법

Excel에서는 **반복 계산(Iterative Calculation)**으로 이 문제를 해결합니다:

1. **초기값 설정**: 모든 환포값을 0으로 시작
2. **반복 계산**: 수렴할 때까지 계산 반복
3. **수렴 조건**: 연속 두 번의 계산 결과 차이가 임계값 이하

### 핵심 순환 고리:

- C12 (순발) ← C32 (총스탯) ← C27 (실제환포) ← C22~C25 (환포분배) ← C20 (환포계수) ← C13 (스탯합계) ← C12

## 5. 중요 상수값들

### 게임 내 상수:

- **437**: 기본 체력 (1레벨 기준)
- **417**: 다음 환 계산용 기본값
- **20**: 기본 환포퀘 완료수
- **3**: 레벨당 추가 포인트
- **85**: 누적레벨 계산용 상수
- **12**: 환포계수 계산용 분모 (총스탯/12)
- **4**: 환포계수 계산용 분모 (환포수/4, 레벨차/4)

### 보너스 스탯:

- **1환**: 10, **2환**: 20, **3환**: 30, **4환**: 40, **5환**: 50, **6환**: 50

### MAX 환포값:

- **1환**: 66, **2환**: 98, **3환**: 130, **4환**: 161, **5환**: 192

## 6. 구현시 정확한 계산 순서

### 반복 계산 알고리즘:

```javascript
function calculateRebirth(inputs) {
  let prevValues = {};
  let currentValues = {};
  let iterations = 0;
  const maxIterations = 100;
  const tolerance = 0.001;

  do {
    prevValues = { ...currentValues };

    // 1단계: 순발력 계산 (C12 등)
    // 2단계: 스탯 총합 (C13 등)
    // 3단계: 누적값들 (C18, C19 등)
    // 4단계: 환포계수 (C20 등)
    // 5단계: 환포 분배 (C22~C25 등)
    // 6단계: 실제 환포 (C27 등)
    // 7단계: 다음 환 스탯 (E32 등)

    iterations++;
  } while (!hasConverged(prevValues, currentValues, tolerance) && iterations < maxIterations);

  return currentValues;
}
```

## 7. Excel 함수 정확한 구현

### TRUNC 함수:

```javascript
function TRUNC(value, digits = 0) {
  const multiplier = Math.pow(10, digits);
  return Math.trunc(value * multiplier) / multiplier;
}
```

### 범위 SUM 함수:

```javascript
function SUM(range) {
  return range.reduce((sum, val) => sum + (val || 0), 0);
}
```

이제 Excel의 정확한 공식들을 바탕으로 완벽하게 구현할 수 있습니다.
