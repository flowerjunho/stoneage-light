# 스톤에이지 게임 소스 코드

게임 서버 소스 코드에서 전투 시스템 관련 파일들을 추출한 것입니다.

## 전체 파일 목록

### 전투 시스템 (핵심)
- `battle_event.c` (187KB) - 전투 계산 로직 전체 (가장 중요)
- `battle.c` (212KB) - 전투 진행 및 관리 로직

### 세부 추출 파일 (참고용)
전투 계산의 주요 부분만 추출한 파일들:
- `battle_event_constants.c` - 상수 정의 (#define)
- `battle_event_damage.c` - 기본 데미지 계산 함수
- `battle_event_attribute.c` - 속성 계산 함수
- `battle_event_critical.c` - 크리티컬 계산 함수
- `battle_event_dodge.c` - 회피율 계산 함수
- `battle_event_guard.c` - 방어 커맨드 함수

### 캐릭터/페트 시스템
- `pet.c` (19KB) - 페트 시스템
- `skill.c` (9.1KB) - 스킬 시스템

## 주요 함수 위치

### battle_event.c
```
라인 1~100    : 상수 정의 및 전역 변수
라인 300~450  : BATTLE_DodgeCalc() - 회피율 계산
라인 795~842  : BATTLE_AttrCalc() - 속성 상성 계산
라인 843~940  : BATTLE_GetAttr() - 속성 값 가져오기
라인 945~1010 : BATTLE_AttrAdjust() - 속성 보정 적용
라인 1012~1040: BATTLE_GuardAdjust() - 방어 커맨드
라인 1042~1130: BATTLE_DamageCalc() - 기본 데미지 계산 (핵심!)
라인 1134~1250: BATTLE_CriticalCheckPlayer() - 크리티컬 판정
```

## 핵심 상수

```c
#define DAMAGE_RATE      (2.0)    // 데미지 배율
#define CRITICAL_RATE    (1.0)    // 크리티컬 배율
#define KAWASHI_MAX_RATE (75)     // 최대 회피율 75%
#define AJ_UP            (1.5)    // 속성 유리
#define AJ_SAME          (1.0)    // 속성 같음
#define AJ_DOWN          (0.6)    // 속성 불리
#define ATTR_MAX         (100)    // 속성 최대값
#define D_ATTR           (1.0/(100*100))  // 0.0001
#define D_16             (1.0/16)  // 0.0625
#define D_8              (1.0/8)   // 0.125

float gKawashiPara = 0.02;    // 회피 파라미터
float gCriticalPara = 0.09;   // 크리티컬 파라미터
float gBattleDamageModyfy;    // 데미지 보정 (기본 1.0)
```

## 데미지 계산 흐름

1. **공격력/방어력 계산**
   - `CHAR_WORKATTACKPOWER` 가져오기
   - `CHAR_WORKDEFENCEPOWER * 0.70` 계산
   - 페트 탑승 시: 캐릭 70% + 페트 30%

2. **기본 데미지 계산** (`BATTLE_DamageCalc`)
   ```c
   if (attack >= defense * 1.14) {
       K0 = RAND(0, attack/8) - attack/16
       damage = ((attack - defense) * 2.0) + K0
   }
   ```

3. **속성 보정 적용** (`BATTLE_AttrAdjust`)
   ```c
   // 각 속성에 데미지 곱하기
   for(i=0; i<5; i++) {
       At_pow[i] *= damage;
   }
   
   // 상성 계산
   damage = BATTLE_AttrCalc(...);
   
   // 필드 보정
   damage *= (At_FieldPow / Df_FieldPow);
   ```

4. **추가 보정**
   - `gBattleDamageModyfy` 곱하기
   - 장비 보정 등

## 사용 방법

1. 데미지 계산 이해: `battle_event_damage.c` 참고
2. 속성 시스템 이해: `battle_event_attribute.c` 참고
3. 전체 컨텍스트: `battle_event.c` 참고
4. 계산기 구현: `../BATTLE_SYSTEM_GUIDE.md` 참고

## 주의사항

- 이 파일들은 참고용으로만 사용
- 실제 서버 설정은 다를 수 있음
- 버전: `_BATTLE_NEWPOWER` 활성화
- 언어: C (인코딩 주의)
