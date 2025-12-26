# StoneAge Battle System Analysis

스톤에이지 (SaLight v1.1.8) APK에서 추출한 배틀 시스템 분석 프로젝트입니다.

## 프로젝트 구조

```
StoneAge_Battle_Analysis/
├── include/
│   ├── battle_types.h      # 타입 및 구조체 정의
│   └── battle_protocol.h   # 프로토콜 함수 선언
├── src/
│   ├── battle/
│   │   ├── battle_state.c  # 배틀 상태 관리
│   │   └── battle_ui.c     # 배틀 UI/버튼 처리
│   ├── protocol/
│   │   └── battle_protocol.c # lssproto 프로토콜 구현
│   ├── animation/
│   │   └── battle_animation.c # 배틀 애니메이션/이펙트
│   ├── ai/
│   │   └── battle_ai.c     # AI 자동전투 시스템
│   └── action/
│       └── action_system.c # 액션(캐릭터/펫) 시스템
└── README.md
```

## 배틀 시스템 개요

### 1. 배틀 흐름

```
1. 전투 시작 (lssproto_EN_recv)
   ├─ InitBattleMenu() - UI 초기화
   ├─ ReadBattleMap() - 배경 로드
   └─ InitBattleAnimFlag() - 애니메이션 초기화

2. 턴 대기 (BattleProc)
   ├─ lssproto_B_recv() - 상태 수신
   ├─ BattleCntDownDisp() - 카운트다운
   └─ BattleMenuProc() - 메뉴 처리

3. 명령 입력
   ├─ BattleButtonAttack() - 공격
   ├─ BattleButtonJujutsu() - 주술
   ├─ BattleButtonItem() - 아이템
   ├─ BattleButtonPet() - 펫 교체
   ├─ BattleButtonGuard() - 방어
   ├─ BattleButtonCapture() - 포획
   └─ BattleButtonEscape() - 도망

4. 명령 전송 (lssproto_B_send)
   └─ battleSend() - 명령 문자열 전송

5. 애니메이션 재생
   ├─ DisplayAttackEffect() - 공격 이펙트
   ├─ magic_effect() - 마법 이펙트
   ├─ showDamage_num() - 데미지 표시
   └─ DeathAction() - 사망 애니메이션

6. 전투 종료 (lssproto_RS_recv)
```

### 2. 명령 코드

| 코드 | 의미 | 형식 |
|------|------|------|
| H | 공격 (Hit) | `H\|타겟슬롯` |
| S | 스킬 (Skill) | `S\|타겟슬롯\|스킬번호` |
| I | 아이템 (Item) | `I\|타겟슬롯\|아이템번호` |
| G | 방어 (Guard) | `G` |
| E | 도망 (Escape) | `E` |
| P | 펫 교체 (Pet) | `P\|펫번호` |
| C | 포획 (Capture) | `C\|타겟슬롯` |
| W | 대기 (Wait) | `W` |

### 3. 슬롯 배치

```
아군 (0-9):
  0: 플레이어1    1: 플레이어1 펫
  2: 플레이어2    3: 플레이어2 펫
  4: 플레이어3    5: 플레이어3 펫
  ...

적군 (10-19):
  10: 적1         11: 적1 펫
  12: 적2         13: 적2 펫
  ...
```

### 4. 주요 전역 변수

| 변수 | 설명 |
|------|------|
| BattleMyNo | 내 슬롯 번호 |
| BattleMapNo | 배틀맵 번호 |
| BattleAnimFlag | 애니메이션 진행 플래그 |
| BattleSvTurnNo | 서버 턴 번호 |
| BattleCliTurnNo | 클라이언트 턴 번호 |
| BattleCntDown | 카운트다운 시간 |
| BattleEscFlag | 도망 플래그 |
| battleMenuFlag | 메뉴 표시 플래그 |

### 5. AI 자동전투

AI 우선순위:
1. 아군 HP 낮음 → 힐
2. 펫 HP 낮음 → 펫 힐
3. HP 매우 낮음 → 도망 고려
4. 포획 가능 → 포획
5. MP 있음 → 공격 마법
6. 기본 → 일반 공격

### 6. 프로토콜 (lssproto)

#### 송신 함수 (Client → Server)
- `lssproto_B_send(type, cmd)` - 배틀 명령
- `lssproto_EN_send(flag, enemyId, option)` - 전투 시작
- `lssproto_FS_send(flag, option)` - 도망
- `lssproto_PETST_send(petNo, state, option)` - 펫 상태

#### 수신 함수 (Server → Client)
- `lssproto_B_recv(flag, statusStr)` - 배틀 상태
- `lssproto_EN_recv(flag, mapNo, option)` - 전투 진입
- `lssproto_RS_recv(flag, resultStr)` - 전투 결과
- `lssproto_FS_recv(result, option)` - 도망 결과

## 원본 함수 목록

### Battle 함수
- BattleProc, BattleMenuProc, BattleMsgProc
- InitBattleMenu, InitBattleAnimFlag, initBattleMsg
- BattleButtonAttack, BattleButtonJujutsu, BattleButtonItem
- BattleButtonPet, BattleButtonGuard, BattleButtonCapture
- BattleButtonEscape, BattleButtonPPLSKILL, BattleButtonHelp
- BattleTargetSelect, BattleSetWazaHitBox
- BattleNameDisp, BattleCntDownDisp
- ReadBattleMap, DrawBattleMap, ddrawBattleMap
- CheckBattleAnimFlag, CheckBattleTarget, CheckBattle1P2P
- setBattleInfo, battleSend, LogToBattleError

### Action 함수
- InitAction, ClearAction, EndAction, DeathAction
- createCharAction, createPetAction, GetAction
- charProc, petProc, charMove, AnimDisp
- setCharBattle, delCharBattle
- setCharMovePoint, setCharWarpPoint
- DisplayAttackEffect, SetDisplayAttackEffect

### Animation 함수
- showDamage_num, set_damage_num, stockFontNumToDamage
- hit_mark, hit_mark_critical, set_hit_mark
- magic_effect, set_single_jujutsu
- boomerang, bow, axe, stone, missile
- piyo_loop, set_piyo_loop
- amelioration, attrib_reverse

### AI 함수
- AI_Init, AI_Save, initAiSetting
- AI_ChooseAction, usuallyAiProc
- initBattleAi, AI_SettingProc

## 빌드 방법

이 프로젝트는 분석/참조용입니다. 실제 컴파일을 위해서는:

1. SDL3 라이브러리 필요
2. Lua 5.x 라이브러리 필요
3. 네트워크 소켓 라이브러리 필요

## 참고사항

- 원본 코드는 C++로 작성되었으나, 분석 편의상 C 스타일로 변환
- 실제 게임 클라이언트는 추가적인 암호화/보호 적용
- 배틀맵 파일: data/battlemap/battle*.sabex (0-219)
- 스프라이트 데이터: 별도 리소스 파일에서 로드

## 라이선스

이 프로젝트는 교육 및 분석 목적으로만 사용됩니다.
원본 게임의 저작권은 해당 개발사에 있습니다.
