/**
 * StoneAge Battle System - Type Definitions
 *
 * 이 파일은 스톤에이지 게임의 배틀 시스템에서 사용되는
 * 모든 타입과 구조체를 정의합니다.
 *
 * 분석 기반: libStoneage.so (SaLight_v1.1.8.apk)
 */

#ifndef BATTLE_TYPES_H
#define BATTLE_TYPES_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/*============================================================================
 * 기본 상수 정의
 *============================================================================*/

// 배틀 슬롯 상수
#define MAX_BATTLE_UNITS        20      // 전투 최대 유닛 수 (아군 10 + 적군 10)
#define MAX_ALLY_UNITS          10      // 아군 최대 수
#define MAX_ENEMY_UNITS         10      // 적군 최대 수
#define ALLY_START_INDEX        0       // 아군 시작 인덱스
#define ENEMY_START_INDEX       10      // 적군 시작 인덱스

// 플레이어/펫 슬롯 배치
// 아군: 0=플레이어1, 1=펫1, 2=플레이어2, 3=펫2, ...
// 적군: 10=적1, 11=적펫1, 12=적2, 13=적펫2, ...

// 배틀 명령 버퍼 크기
#define BATTLE_CMD_BUFFER_SIZE  256
#define BATTLE_STATUS_BUFFER_SIZE 4096
#define BATTLE_MSG_BUFFER_SIZE  1024

// 카운트다운 시간 (밀리초)
#define BATTLE_CNT_DOWN_TIME    30000   // 30초

// 배틀맵 최대 개수
#define MAX_BATTLE_MAPS         220

/*============================================================================
 * 열거형 정의
 *============================================================================*/

/**
 * 배틀 명령 타입
 */
typedef enum {
    BATTLE_CMD_NONE = 0,        // 없음
    BATTLE_CMD_ATTACK = 'H',    // 일반 공격 (Hit)
    BATTLE_CMD_SKILL = 'S',     // 스킬/마법 사용 (Skill)
    BATTLE_CMD_ITEM = 'I',      // 아이템 사용 (Item)
    BATTLE_CMD_GUARD = 'G',     // 방어 (Guard)
    BATTLE_CMD_ESCAPE = 'E',    // 도망 (Escape)
    BATTLE_CMD_PET = 'P',       // 펫 교체 (Pet)
    BATTLE_CMD_CAPTURE = 'C',   // 포획 (Capture)
    BATTLE_CMD_WAIT = 'W',      // 대기 (Wait)
    BATTLE_CMD_REVIVE = 'T',    // 부활 선택 (가문전)
} BattleCommandType;

/**
 * 배틀 상태
 */
typedef enum {
    BATTLE_STATE_NONE = 0,      // 전투 없음
    BATTLE_STATE_INIT,          // 초기화 중
    BATTLE_STATE_WAITING,       // 명령 대기
    BATTLE_STATE_ANIMATING,     // 애니메이션 재생 중
    BATTLE_STATE_RESULT,        // 결과 표시
    BATTLE_STATE_END,           // 전투 종료
} BattleState;

/**
 * 배틀 결과
 */
typedef enum {
    BATTLE_RESULT_NONE = 0,
    BATTLE_RESULT_WIN,          // 승리
    BATTLE_RESULT_LOSE,         // 패배
    BATTLE_RESULT_ESCAPE,       // 도망
    BATTLE_RESULT_DRAW,         // 무승부
} BattleResult;

/**
 * 유닛 상태
 */
typedef enum {
    UNIT_STATE_NONE = 0,
    UNIT_STATE_ALIVE,           // 생존
    UNIT_STATE_DEAD,            // 사망
    UNIT_STATE_STUNNED,         // 기절 (piyo)
    UNIT_STATE_POISONED,        // 독
    UNIT_STATE_CONFUSED,        // 혼란
    UNIT_STATE_PETRIFIED,       // 석화
} UnitState;

/**
 * 데미지 폰트 타입
 */
typedef enum {
    FONT_BATTLE_NORMAL = 0,     // 일반 데미지
    FONT_BATTLE_CRITICAL,       // 크리티컬
    FONT_BATTLE_HEAL,           // 힐
    FONT_BATTLE_MISS,           // 미스
    FONT_BATTLE_GUARD,          // 방어
} FontBattleType;

/**
 * 이펙트 타입
 */
typedef enum {
    EFFECT_NONE = 0,
    EFFECT_HIT,                 // 타격
    EFFECT_CRITICAL,            // 크리티컬
    EFFECT_MAGIC,               // 마법
    EFFECT_HEAL,                // 힐
    EFFECT_BUFF,                // 버프
    EFFECT_DEBUFF,              // 디버프
    EFFECT_DEATH,               // 사망
} EffectType;

/*============================================================================
 * 구조체 정의
 *============================================================================*/

/**
 * 액션 구조체 - 캐릭터/펫/몬스터의 기본 단위
 * 배틀에서 모든 유닛은 action 구조체로 표현됨
 */
typedef struct action {
    int32_t     id;                 // 유닛 고유 ID
    int32_t     graphNo;            // 그래픽 번호
    int16_t     x;                  // X 좌표
    int16_t     y;                  // Y 좌표
    int16_t     dir;                // 방향 (0-7)

    // 상태 정보
    int32_t     hp;                 // 현재 HP
    int32_t     maxHp;              // 최대 HP
    int32_t     mp;                 // 현재 MP
    int32_t     maxMp;              // 최대 MP

    // 배틀 관련
    int32_t     battleNo;           // 배틀 슬롯 번호 (0-19)
    int32_t     level;              // 레벨
    int32_t     att;                // 공격력
    int32_t     def;                // 방어력
    int32_t     agi;                // 민첩
    int32_t     luck;               // 행운

    // 애니메이션 관련
    int32_t     animNo;             // 현재 애니메이션 번호
    int32_t     animFrame;          // 현재 프레임
    int32_t     animCount;          // 애니메이션 카운터

    // 이펙트 관련
    int32_t     effectNo;           // 이펙트 번호
    int32_t     damageNum;          // 표시할 데미지 숫자
    FontBattleType damageType;      // 데미지 타입

    // 상태 플래그
    bool        isPlayer;           // 플레이어 여부
    bool        isPet;              // 펫 여부
    bool        isEnemy;            // 적 여부
    bool        isDead;             // 사망 여부
    bool        isRiding;           // 라이딩 여부

    // 이름
    char        name[64];           // 유닛 이름

    // 기타
    void*       userData;           // 사용자 데이터
} action;

/**
 * 배틀 유닛 정보
 */
typedef struct BattleUnit {
    action*     pAction;            // 액션 포인터
    int32_t     slotNo;             // 슬롯 번호

    int32_t     hp;
    int32_t     maxHp;
    int32_t     mp;
    int32_t     maxMp;

    int32_t     att;
    int32_t     def;
    int32_t     agi;
    int32_t     luck;

    UnitState   state;              // 유닛 상태

    // 버프/디버프
    int32_t     buffCount;
    int32_t     debuffCount;

    bool        isSelectable;       // 타겟으로 선택 가능 여부
    bool        hasActed;           // 이번 턴 행동 완료 여부
} BattleUnit;

/**
 * 배틀 명령 구조체
 */
typedef struct BattleCommand {
    BattleCommandType   type;       // 명령 타입
    int32_t             actorSlot;  // 행동 주체 슬롯
    int32_t             targetSlot; // 타겟 슬롯
    int32_t             skillNo;    // 스킬 번호 (스킬 사용 시)
    int32_t             itemNo;     // 아이템 번호 (아이템 사용 시)
    int32_t             petNo;      // 펫 번호 (펫 교체 시)
} BattleCommand;

/**
 * 배틀 상태 구조체 (전체 전투 상태)
 */
typedef struct BattleStatus {
    // 기본 정보
    int32_t         battleMapNo;        // 배틀맵 번호
    int32_t         myNo;               // 내 슬롯 번호
    int32_t         myPetNo;            // 내 펫 슬롯 번호

    // 턴 정보
    int32_t         serverTurnNo;       // 서버 턴 번호
    int32_t         clientTurnNo;       // 클라이언트 턴 번호
    int32_t         cntDown;            // 카운트다운 (초)

    // 유닛 정보
    BattleUnit      units[MAX_BATTLE_UNITS];
    int32_t         allyCount;          // 아군 수
    int32_t         enemyCount;         // 적 수

    // 상태 플래그
    BattleState     state;
    bool            isAnimating;        // 애니메이션 중
    bool            isPvP;              // PvP 여부
    bool            canEscape;          // 도망 가능 여부
    bool            escapeFlag;         // 도망 시도 플래그

    // 현재 명령
    BattleCommand   currentCmd;

    // 결과
    BattleResult    result;
    char            resultMsg[256];

    // 경험치/보상
    int32_t         expGained;
    int32_t         goldGained;
} BattleStatus;

/**
 * AI 설정 구조체
 */
typedef struct AIConfig {
    bool        enabled;                // AI 활성화

    // HP 회복 설정
    int32_t     healMagicIndex;         // 사용할 힐 마법 인덱스
    int32_t     healTargetType;         // 힐 타겟 (0=자신, 1=펫, 2=아군)
    int32_t     healThreshold;          // 힐 시작 HP% (예: 50)

    // 공격 설정
    int32_t     attackMagicIndex;       // 사용할 공격 마법 인덱스
    int32_t     attackTargetType;       // 공격 타겟 우선순위

    // 펫 설정
    bool        petAutoHeal;            // 펫 자동 힐
    int32_t     petHealThreshold;       // 펫 힐 HP%

    // 포획 설정
    bool        autoCatch;              // 자동 포획
    int32_t     catchThreshold;         // 포획 시도 HP%

    // 도망 설정
    bool        autoEscape;             // 자동 도망
    int32_t     escapeHpThreshold;      // 도망 HP%
} AIConfig;

/**
 * 배틀 맵 정보
 */
typedef struct BattleMapInfo {
    int32_t     mapNo;
    char        fileName[128];          // 예: "data/battlemap/battle00.sabex"
    bool        isLoaded;
    void*       surfaceData;            // 맵 이미지 데이터
} BattleMapInfo;

/**
 * 스킬 정보
 */
typedef struct SkillInfo {
    int32_t     id;
    char        name[64];
    int32_t     mpCost;
    int32_t     targetType;             // 0=단일, 1=전체, 2=자신
    int32_t     effectType;
    int32_t     power;
    int32_t     accuracy;
} SkillInfo;

/*============================================================================
 * 전역 변수 선언 (extern)
 *============================================================================*/

// 배틀 상태 변수들 (libStoneage.so에서 추출)
extern int32_t      BattleMyNo;             // 내 전투 슬롯 번호
extern int32_t      BattleMapNo;            // 현재 배틀맵 번호
extern int32_t      BattleStatus;           // 배틀 상태 (raw)
extern int32_t      BattleStatusBak;        // 배틀 상태 백업
extern char         BattleCmd[];            // 배틀 명령 버퍼
extern char         BattleCmdBak[];         // 배틀 명령 백업
extern int32_t      BattleCmdNo;            // 현재 명령 번호
extern int32_t      BattleAnimFlag;         // 애니메이션 플래그
extern int32_t      BattleSvTurnNo;         // 서버 턴 번호
extern int32_t      BattleCliTurnNo;        // 클라이언트 턴 번호
extern int32_t      BattleTurnReceiveFlag;  // 턴 수신 플래그
extern int32_t      BattleCntDown;          // 카운트다운
extern int32_t      BattleCntDownFlag;      // 카운트다운 플래그
extern int32_t      BattleEscFlag;          // 도망 플래그
extern int32_t      BattleBpFlag;           // BP 플래그
extern int32_t      BattleResultWndFlag;    // 결과창 플래그
extern int32_t      BattleItemNo;           // 선택된 아이템 번호
extern int32_t      BattleJujutuNo;         // 선택된 주술 번호
extern int32_t      BattleWazaNo;           // 선택된 기술 번호
extern int32_t      BattleSkill;            // 배틀 스킬
extern int32_t      battleMenuFlag;         // 메뉴 플래그
extern int32_t      battlePetButtonFlag;    // 펫 버튼 플래그
extern int32_t      battleButtonBak;        // 버튼 백업
extern char         battleResultMsg[];      // 결과 메시지
extern int32_t      autoBattleCount;        // 자동전투 카운트
extern int32_t      Battle1P2PFlag;         // 1:1 전투 플래그

// AI 관련
extern int32_t      AI_State;               // AI 상태
extern int32_t      AI_Choosen;             // AI 선택 행동
extern AIConfig     aiConfig;               // AI 설정

#ifdef __cplusplus
}
#endif

#endif // BATTLE_TYPES_H
