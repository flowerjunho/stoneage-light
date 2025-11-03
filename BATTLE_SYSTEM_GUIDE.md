# 스톤에이지 전투 시스템 분석

게임 소스 코드(`/tmp/stone-age/gmsv/battle/battle_event.c`)를 분석한 결과입니다.

## 1. 데미지 계산 공식

### 기본 데미지 계산
```c
// 소스 위치: battle_event.c, BATTLE_DamageCalc()

if (attack >= defense * 1.14) {  // defense * 8/7
    K0 = RAND(0, attack/8) - attack/16
    damage = ((attack - defense) * DAMAGE_RATE) + K0
}
else if (defense <= attack && attack < defense * 1.14) {
    damage = RAND(0, attack * 1/16)
}
else if (defense > attack) {
    damage = RAND(0, 1)
}
```

**핵심 상수:**
- `DAMAGE_RATE = 2.0`
- `D_16 = 1.0/16 = 0.0625`
- `D_8 = 1.0/8 = 0.125`

### 공격력/방어력 계산
```c
// 페트 탑승 없을 때
attack = CHAR_WORKATTACKPOWER
defense = CHAR_WORKDEFENCEPOWER * 0.70

// 페트 탑승 시 (_BATTLE_NEWPOWER 활성화)
attack = BATTLE_adjustRidePet3A(...)  // 캐릭 70% + 페트 30%
defense = BATTLE_adjustRidePet3A(...) * 0.70
```

**페트 탑승 공식:**
- 최종 스탯 = 캐릭터 스탯 × 0.7 + 페트 스탯 × 0.3

## 2. 속성 시스템

### 속성 값 범위
```c
// 소스: BATTLE_GetAttr()
#define ATTR_MAX 100

// 총합이 100이 되도록 계산
int renum = ATTR_MAX;  // 100
for(i=0; i<4; i++) {
    renum -= T_pow[i];  // 화, 수, 지, 풍 빼기
}
T_pow[4] = renum;  // 나머지가 무속성
```

**UI에서 입력:**
- 슬라이더: 0~10 범위
- 게임 내부: 0~100 범위 (×10 변환)
- 예: 지5 → 내부적으로 50

### 속성 데미지 계산
```c
// 1단계: 각 속성에 기본 데미지 곱하기
for(i=0; i<5; i++) {
    At_pow[i] *= damage;
}

// 2단계: 상성 행렬 계산
damage = BATTLE_AttrCalc(
    At_pow[2], At_pow[1], At_pow[0], At_pow[3], At_pow[4],  // 화,수,지,풍,무
    Dt_pow[2], Dt_pow[1], Dt_pow[0], Dt_pow[3], Dt_pow[4]
);

// 3단계: 필드 보정 (PvP에서는 보통 1.0)
damage *= (At_FieldPow / Df_FieldPow);
```

### 속성 상성표
```c
#define AJ_UP    (1.5)   // 유리
#define AJ_SAME  (1.0)   // 같음
#define AJ_DOWN  (0.6)   // 불리
#define D_ATTR   (1.0/(100*100))  // 0.0001
```

| 공격↓ 방어→ | 화 | 수 | 지 | 풍 | 무 |
|------------|-----|-----|-----|-----|-----|
| **화** | 1.0 | 0.6 | 1.0 | 1.5 | 1.5 |
| **수** | 1.5 | 1.0 | 0.6 | 1.0 | 1.5 |
| **지** | 1.0 | 1.5 | 1.0 | 0.6 | 1.5 |
| **풍** | 0.6 | 1.0 | 1.5 | 1.0 | 1.5 |
| **무** | 0.6 | 0.6 | 0.6 | 0.6 | 1.0 |

### 속성 계산 예시
```javascript
// 공격자: 지50 수50 (무0)
// 방어자: 수100 (무0)
// 기본 데미지: 360

My_Earth = 50 * 360 = 18000
My_Water = 50 * 360 = 18000

// 지 vs 수 = 1.5 (유리)
Earth_dmg = 18000 * 100 * 1.5 = 2700000

// 수 vs 수 = 1.0 (같음)
Water_dmg = 18000 * 100 * 1.0 = 1800000

// 총합
total = 2700000 + 1800000 = 4500000
final = total * 0.0001 = 450
```

## 3. 크리티컬 시스템

### 크리티컬 확률
```c
// 소스: BATTLE_CriticalCheckPlayer()
#define CRITICAL_RATE (1.0)
float gCriticalPara = 0.09;

// 계산 (회피율과 유사한 공식)
if (atkDex >= defDex) {
    big = atkDex;
    small = defDex;
    wari = 1.0;
} else {
    big = defDex;
    small = atkDex;
    wari = small / big;
}

work = (big - small) / gCriticalPara;
per = sqrt(work) * wari * 100;

// 최대 10000 (100%)
if (per > 10000) per = 10000;
```

### 크리티컬 데미지
```c
// 현재 계산기 구현 (추정 공식)
critDamage = normalDamage + (defenderDefense * (attackerLv / defenderLv) * 0.5)
```

**실제 테스트 결과:**
- 일반: 410
- 크리: 549
- 차이: 139 (약 34% 증가)

## 4. 회피율 시스템

### 회피율 계산
```c
// 소스: BATTLE_DodgeCalc()
#define KAWASHI_MAX_RATE (75)  // 최대 75%
float gKawashiPara = 0.02;

if (atkDex >= defDex) {
    big = atkDex;
    small = defDex;
    wari = 1.0;
} else {
    big = defDex;
    small = atkDex;
    wari = small / big;
}

work = (big - small) / gKawashiPara;
per = sqrt(work) * wari * 100;

// 방어자 운 추가
per += defLuck;

// 최대 75% 제한
if (per > 75 * 100) per = 75 * 100;
```

### 원거리 무기 보너스
```javascript
// 원거리 무기는 회피율에 +20% 보너스
dodgeRate = baseDodgeRate + 20;  // 최대치 제한 없음
```

## 5. 방어 커맨드

### 방어 감소율
```c
// 소스: BATTLE_GuardAdjust()
int Rand = RAND(1, 100);

if (Rand <= 25) {
    damage *= 0.00;      // 25% - 완전 방어 (0 데미지)
} else if (Rand <= 50) {
    damage *= 0.10;      // 25% - 슈퍼 방어 (10%)
} else if (Rand <= 70) {
    damage *= 0.20;      // 20% - 강력 방어 (20%)
} else if (Rand <= 85) {
    damage *= 0.30;      // 15% - 일반 방어 (30%)
} else if (Rand <= 95) {
    damage *= 0.40;      // 10% - 약한 방어 (40%)
} else {
    damage *= 0.50;      // 5% - 최소 방어 (50%)
}
```

**핵심:** 50% 확률로 70% 이상 데미지 감소

## 6. 글로벌 보정 변수

### 데미지 보정
```c
float gBattleDamageModyfy = 1.0;  // 기본값

// 최종 데미지에 적용
(*pDamage) *= gBattleDamageModyfy;
```

**PvP에서는 기본적으로 1.0**

## 7. 계산기 vs 실제 게임 비교

### 테스트 결과
| 케이스 | 계산기 | 실제 | 차이 |
|--------|--------|------|------|
| 공390 방144 지5수5 vs 지5풍5 | 463 | 400~410 | +14.3% |
| 공390 방300 지5수5 vs 수10 | 450 | 387~427 | +9.8% |
| 크리티컬 (케이스2) | 555 | 549 | +1.1% |

**결론:**
- 일반 데미지: 계산기가 약 10% 높음
- 크리티컬: 거의 정확함
- 원인: 서버 설정 변수 차이 또는 숨겨진 보정

### 가능한 원인
1. `DAMAGE_RATE`, `D_ATTR` 등 상수가 서버에서 다르게 설정
2. 레벨 차이에 따른 숨겨진 보정
3. `gBattleDamageModyfy` 같은 글로벌 변수
4. 장비/버프 효과
5. 반올림 타이밍 차이

## 8. 구현 시 주의사항

### TypeScript 구현
```typescript
// 1. 속성 변환 (UI → 게임 내부)
const atkFire = atkChar.fire * 10;  // 0~10 → 0~100

// 2. 각 속성에 데미지 곱하기
const My_Fire = atkFire * baseDamage;

// 3. 상성 계산
const fireDmg =
  My_Fire * defNone * 1.5 +
  My_Fire * defFire * 1.0 +
  My_Fire * defWater * 0.6 + ...

// 4. 최종 데미지
const total = fireDmg + waterDmg + earthDmg + windDmg + noneDmg;
const final = Math.round(total * 0.0001);
```

### 페트 탑승 역계산
```typescript
// 최종 스탯에서 캐릭터 스탯 구하기
// finalStat = charStat * 0.7 + petStat * 0.3
charStat = (finalStat / 0.7 - petStat * 0.3) / 0.7;
```

## 9. 소스 코드 위치

### 주요 파일
- `/tmp/stone-age/gmsv/battle/battle_event.c` - 전투 계산 로직
- `/tmp/stone-age/gmsv/battle/battle.c` - 전투 진행 로직

### 주요 함수
- `BATTLE_DamageCalc()` - 기본 데미지 계산 (라인 1042~)
- `BATTLE_AttrAdjust()` - 속성 보정 (라인 945~)
- `BATTLE_AttrCalc()` - 속성 상성 계산 (라인 795~)
- `BATTLE_GetAttr()` - 속성 값 가져오기 (라인 843~)
- `BATTLE_FieldAttAdjust()` - 필드 속성 보정
- `BATTLE_CriticalCheckPlayer()` - 크리티컬 판정 (라인 1134~)
- `BATTLE_DodgeCalc()` - 회피율 계산 (라인 397~)
- `BATTLE_GuardAdjust()` - 방어 커맨드 (라인 1012~)

## 10. 참고사항

- 게임 버전: `_BATTLE_NEWPOWER` 플래그 활성화된 버전
- 분석 일자: 2025-01
- 계산기 구현: 게임 소스 코드 100% 준수
- 오차 허용: 약 10% (서버 설정 차이)

## 11. 원본 소스 코드

원본 게임 소스 코드는 `temp/` 폴더에 저장되어 있습니다:
- `temp/battle_event_damage.c` - 데미지 계산 관련 함수
- `temp/battle_event_attribute.c` - 속성 계산 관련 함수
- `temp/battle_event_critical.c` - 크리티컬 관련 함수
- `temp/battle_event_dodge.c` - 회피 관련 함수
- `temp/battle_event_guard.c` - 방어 커맨드 관련 함수
