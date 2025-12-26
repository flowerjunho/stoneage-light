/**
 * StoneAge Battle System - Battle State Management
 *
 * 배틀 상태 관리 구현
 * 분석 기반: libStoneage.so
 */

#include "../../include/battle_types.h"
#include "../../include/battle_protocol.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

/*============================================================================
 * 전역 변수 정의
 *============================================================================*/

// 배틀 핵심 상태
int32_t     BattleMyNo = -1;                    // 내 슬롯 번호
int32_t     BattleMapNo = 0;                    // 배틀맵 번호
int32_t     BattleStatusRaw = 0;                // 원시 상태값
int32_t     BattleStatusBak = 0;                // 상태 백업

// 명령 버퍼
char        BattleCmd[BATTLE_CMD_BUFFER_SIZE];
char        BattleCmdBak[BATTLE_CMD_BUFFER_SIZE];
int32_t     BattleCmdNo = 0;
int32_t     BattleCmdReadPointer = 0;
int32_t     BattleCmdWritePointer = 0;

// 상태 버퍼
int32_t     BattleStatusReadPointer = 0;
int32_t     BattleStatusWritePointer = 0;

// 턴 관리
int32_t     BattleSvTurnNo = 0;                 // 서버 턴
int32_t     BattleCliTurnNo = 0;                // 클라이언트 턴
int32_t     BattleTurnReceiveFlag = 0;

// 카운트다운
int32_t     BattleCntDown = 0;
int32_t     BattleCntDownFlag = 0;

// 애니메이션
int32_t     BattleAnimFlag = 0;

// 플래그
int32_t     BattleEscFlag = 0;                  // 도망 플래그
int32_t     BattleBpFlag = 0;                   // BP 플래그
int32_t     BattleResultWndFlag = 0;            // 결과창 플래그
int32_t     Battle1P2PFlag = 0;                 // 1:1 전투 플래그
int32_t     battlePlayerEscFlag = 0;            // 플레이어 도망 플래그

// UI 관련
int32_t     BattleItemNo = -1;                  // 선택된 아이템
int32_t     BattleJujutuNo = -1;                // 선택된 주술
int32_t     BattleWazaNo = -1;                  // 선택된 기술
int32_t     BattleSkill = 0;
int32_t     battleMenuFlag = 0;
int32_t     battleMenuFlag2 = 0;
int32_t     battlePetButtonFlag = 0;
int32_t     battleButtonBak = 0;
int32_t     battleMsgType = 0;

// 결과
char        battleResultMsg[BATTLE_MSG_BUFFER_SIZE];
int32_t     reBattleTime = 0;

// 펫 관련
int32_t     battlePetNoBak = -1;
int32_t     battlePetNoBak2 = -1;
int32_t     BattlePetReceiveFlag = 0;
int32_t     BattlePetReceivePetNo = -1;
int32_t     BattlePetStMenCnt = 0;

// 기술 타겟
int32_t     battleWazaTargetBak = -1;

// 자동 전투
int32_t     autoBattleCount = 0;

// 맵 관련
void*       lpBattleSurface = NULL;
char        BattleMapFile[256];
int32_t     RandBattleBg = 0;

// 전투 간격
int32_t     BattleIntervalCnt = 0;

// 가문전
char        familyBattleInfo[512];

// 아이콘
int32_t     battleIconTbl[20];

// 버프 타입
int32_t     battlebufftype = 0;

// 전체 배틀 상태 구조체
static BattleStatus g_battleStatus;

/*============================================================================
 * 초기화 함수
 *============================================================================*/

/**
 * 배틀 시스템 초기화
 * 원본: InitBattleMenu()
 */
void InitBattleMenu(void)
{
    // 상태 초기화
    memset(&g_battleStatus, 0, sizeof(BattleStatus));
    memset(BattleCmd, 0, sizeof(BattleCmd));
    memset(BattleCmdBak, 0, sizeof(BattleCmdBak));
    memset(battleResultMsg, 0, sizeof(battleResultMsg));

    // 변수 초기화
    BattleMyNo = -1;
    BattleMapNo = 0;
    BattleCmdNo = 0;
    BattleAnimFlag = 0;
    BattleSvTurnNo = 0;
    BattleCliTurnNo = 0;
    BattleTurnReceiveFlag = 0;
    BattleCntDown = 0;
    BattleCntDownFlag = 0;
    BattleEscFlag = 0;
    BattleBpFlag = 0;
    BattleResultWndFlag = 0;
    Battle1P2PFlag = 0;

    // UI 초기화
    BattleItemNo = -1;
    BattleJujutuNo = -1;
    BattleWazaNo = -1;
    BattleSkill = 0;
    battleMenuFlag = 0;
    battleMenuFlag2 = 0;
    battlePetButtonFlag = 0;
    battleButtonBak = 0;

    // 펫 초기화
    battlePetNoBak = -1;
    battlePetNoBak2 = -1;
    BattlePetReceiveFlag = 0;
    BattlePetReceivePetNo = -1;

    // 포인터 초기화
    BattleCmdReadPointer = 0;
    BattleCmdWritePointer = 0;
    BattleStatusReadPointer = 0;
    BattleStatusWritePointer = 0;

    // 상태 설정
    g_battleStatus.state = BATTLE_STATE_INIT;
}

/**
 * 배틀 애니메이션 플래그 초기화
 * 원본: InitBattleAnimFlag()
 */
void InitBattleAnimFlag(void)
{
    BattleAnimFlag = 0;
    g_battleStatus.isAnimating = false;
}

/**
 * 배틀 메시지 초기화
 * 원본: initBattleMsg()
 */
void initBattleMsg(void)
{
    battleMsgType = 0;
    memset(battleResultMsg, 0, sizeof(battleResultMsg));
}

/**
 * 배틀 AI 초기화
 * 원본: initBattleAi()
 */
void initBattleAi(void)
{
    autoBattleCount = 0;
    // AI 설정은 별도 모듈에서 관리
}

/*============================================================================
 * 상태 관리 함수
 *============================================================================*/

/**
 * 배틀 정보 설정
 * 원본: setBattleInfo(char* info)
 */
void setBattleInfo(const char* info)
{
    if (info == NULL) return;

    // 파싱 로직
    // 형식: "myNo|mapNo|..."
    // 실제 구현은 프로토콜 사양에 따름
}

/**
 * 배틀 정보 설정 (인덱스 포함)
 * 원본: setBattleInfo(int index, char* info)
 */
void setBattleInfoWithIndex(int index, const char* info)
{
    if (info == NULL || index < 0 || index >= MAX_BATTLE_UNITS) return;

    // 특정 유닛 정보 업데이트
}

/**
 * 배틀 상태 획득
 */
BattleStatus* getBattleStatus(void)
{
    return &g_battleStatus;
}

/**
 * 내 슬롯 번호 획득
 */
int32_t getMyBattleNo(void)
{
    return BattleMyNo;
}

/**
 * 배틀맵 번호 획득
 */
int32_t getBattleMapNo(void)
{
    return BattleMapNo;
}

/*============================================================================
 * 전투 흐름 함수
 *============================================================================*/

/**
 * 메인 배틀 처리
 * 원본: BattleProc()
 *
 * 매 프레임 호출되어 배틀 상태를 처리
 */
void BattleProc(void)
{
    switch (g_battleStatus.state)
    {
        case BATTLE_STATE_NONE:
            // 전투 없음
            break;

        case BATTLE_STATE_INIT:
            // 초기화 완료 대기
            // 맵 로드, 유닛 배치 등
            if (BattleMapNo > 0 && lpBattleSurface != NULL)
            {
                g_battleStatus.state = BATTLE_STATE_WAITING;
            }
            break;

        case BATTLE_STATE_WAITING:
            // 명령 입력 대기
            BattleCntDownDisp();    // 카운트다운 표시
            BattleMenuProc();       // 메뉴 처리
            break;

        case BATTLE_STATE_ANIMATING:
            // 애니메이션 재생 중
            if (!CheckBattleAnimFlag())
            {
                // 애니메이션 완료
                g_battleStatus.state = BATTLE_STATE_WAITING;
            }
            break;

        case BATTLE_STATE_RESULT:
            // 결과 표시
            if (BattleResultWndFlag)
            {
                // 결과창 처리
            }
            break;

        case BATTLE_STATE_END:
            // 전투 종료 처리
            break;
    }
}

/**
 * 배틀 메뉴 처리
 * 원본: BattleMenuProc()
 */
void BattleMenuProc(void)
{
    if (!battleMenuFlag) return;

    // 메뉴 버튼 처리
    // 실제 구현은 UI 시스템과 연동
}

/**
 * 배틀 메시지 처리
 * 원본: BattleMsgProc()
 */
void BattleMsgProc(void)
{
    // 메시지 표시 및 처리
}

/**
 * 카운트다운 표시
 * 원본: BattleCntDownDisp()
 */
void BattleCntDownDisp(void)
{
    if (!BattleCntDownFlag) return;

    // 카운트다운 감소 및 표시
    // 실제로는 SDL_GetTicks() 등으로 시간 계산
}

/**
 * 이름 표시
 * 원본: BattleNameDisp()
 */
void BattleNameDisp(void)
{
    // 각 유닛의 이름을 화면에 표시
    for (int i = 0; i < MAX_BATTLE_UNITS; i++)
    {
        BattleUnit* unit = &g_battleStatus.units[i];
        if (unit->pAction != NULL && unit->state == UNIT_STATE_ALIVE)
        {
            // 이름 표시 로직
        }
    }
}

/*============================================================================
 * 상태 체크 함수
 *============================================================================*/

/**
 * 1:1 전투 체크
 * 원본: CheckBattle1P2P()
 */
bool CheckBattle1P2P(void)
{
    return Battle1P2PFlag != 0;
}

/**
 * 애니메이션 플래그 체크
 * 원본: CheckBattleAnimFlag()
 */
bool CheckBattleAnimFlag(void)
{
    return BattleAnimFlag != 0;
}

/**
 * 타겟 체크
 * 원본: CheckBattleTarget()
 */
bool CheckBattleTarget(void)
{
    // 현재 선택된 타겟이 유효한지 체크
    int targetSlot = g_battleStatus.currentCmd.targetSlot;
    if (targetSlot < 0 || targetSlot >= MAX_BATTLE_UNITS)
        return false;

    BattleUnit* target = &g_battleStatus.units[targetSlot];
    return target->isSelectable && target->state == UNIT_STATE_ALIVE;
}

/**
 * 배틀 버튼 플래그 획득
 * 원본: getBattleButtonFlag(int index)
 */
int32_t getBattleButtonFlag(int index)
{
    // 버튼 활성화 상태 반환
    return battleButtonBak;
}

/**
 * 배틀 타겟 선택 플래그 획득
 * 원본: getBattleTargetSelectFlag()
 */
bool getBattleTargetSelectFlag(void)
{
    return g_battleStatus.currentCmd.type != BATTLE_CMD_NONE;
}

/*============================================================================
 * 맵 관리 함수
 *============================================================================*/

/**
 * 배틀맵 읽기
 * 원본: ReadBattleMap(int mapNo)
 *
 * 배틀맵 파일 형식: data/battlemap/battle%02d.sabex
 */
int ReadBattleMap(int mapNo)
{
    if (mapNo < 0 || mapNo >= MAX_BATTLE_MAPS)
        return -1;

    // 맵 파일 경로 생성
    snprintf(BattleMapFile, sizeof(BattleMapFile),
             "data/battlemap/battle%02d.sabex", mapNo);

    // 파일 로드 (실제로는 리소스 시스템 사용)
    // lpBattleSurface = LoadBattleMapFromFile(BattleMapFile);

    BattleMapNo = mapNo;
    return 0;
}

/**
 * 배틀맵 그리기
 * 원본: DrawBattleMap()
 */
void DrawBattleMap(void)
{
    if (lpBattleSurface == NULL) return;

    // SDL로 맵 렌더링
    // 실제로는 SDL_RenderCopy 등 사용
}

/**
 * 배틀맵 더블 버퍼 그리기
 * 원본: ddrawBattleMap()
 */
void ddrawBattleMap(void)
{
    DrawBattleMap();
    // 추가 오버레이 그리기
}

/**
 * 배틀맵 해제
 * 원본: FreeGetBattleMap(int mapNo)
 */
int FreeGetBattleMap(int mapNo)
{
    if (lpBattleSurface != NULL)
    {
        // SDL_FreeSurface 등으로 해제
        lpBattleSurface = NULL;
    }
    return 0;
}

/*============================================================================
 * 유닛 관리 함수
 *============================================================================*/

/**
 * 유닛 추가
 */
int addBattleUnit(int slotNo, action* pAction)
{
    if (slotNo < 0 || slotNo >= MAX_BATTLE_UNITS || pAction == NULL)
        return -1;

    BattleUnit* unit = &g_battleStatus.units[slotNo];
    unit->pAction = pAction;
    unit->slotNo = slotNo;
    unit->hp = pAction->hp;
    unit->maxHp = pAction->maxHp;
    unit->mp = pAction->mp;
    unit->maxMp = pAction->maxMp;
    unit->att = pAction->att;
    unit->def = pAction->def;
    unit->agi = pAction->agi;
    unit->luck = pAction->luck;
    unit->state = UNIT_STATE_ALIVE;
    unit->isSelectable = true;
    unit->hasActed = false;

    // 아군/적군 카운트
    if (slotNo < MAX_ALLY_UNITS)
        g_battleStatus.allyCount++;
    else
        g_battleStatus.enemyCount++;

    return 0;
}

/**
 * 유닛 제거
 */
int removeBattleUnit(int slotNo)
{
    if (slotNo < 0 || slotNo >= MAX_BATTLE_UNITS)
        return -1;

    BattleUnit* unit = &g_battleStatus.units[slotNo];
    unit->pAction = NULL;
    unit->state = UNIT_STATE_NONE;

    if (slotNo < MAX_ALLY_UNITS)
        g_battleStatus.allyCount--;
    else
        g_battleStatus.enemyCount--;

    return 0;
}

/**
 * 유닛 HP 설정
 */
void setUnitHP(int slotNo, int hp)
{
    if (slotNo < 0 || slotNo >= MAX_BATTLE_UNITS) return;

    BattleUnit* unit = &g_battleStatus.units[slotNo];
    unit->hp = hp;

    if (unit->pAction)
        unit->pAction->hp = hp;

    // 사망 체크
    if (hp <= 0)
    {
        unit->state = UNIT_STATE_DEAD;
        unit->isSelectable = false;
    }
}

/**
 * 유닛 상태 설정
 */
void setUnitState(int slotNo, UnitState state)
{
    if (slotNo < 0 || slotNo >= MAX_BATTLE_UNITS) return;

    g_battleStatus.units[slotNo].state = state;

    if (state == UNIT_STATE_DEAD || state == UNIT_STATE_STUNNED)
    {
        g_battleStatus.units[slotNo].isSelectable = false;
    }
}

/*============================================================================
 * 로깅 함수
 *============================================================================*/

/**
 * 배틀 에러 로그
 * 원본: LogToBattleError(char* msg, int errorCode)
 */
void LogToBattleError(const char* msg, int errorCode)
{
    // 에러 로깅
    fprintf(stderr, "[Battle Error] %s (code: %d)\n", msg, errorCode);
}

/*============================================================================
 * 기타 유틸리티
 *============================================================================*/

/**
 * 배틀맵 메뉴 고정
 * 원본: battleMenuFix()
 */
void battleMenuFix(void)
{
    // 메뉴 위치 고정
}

/**
 * 전투 흔들림 효과
 * 원본: battle_quake()
 */
void battle_quake(void)
{
    // 화면 흔들림 효과
}

/**
 * 펫 없음 설정
 * 원본: noBattlePet()
 */
void noBattlePet(void)
{
    battlePetNoBak = -1;
    battlePetNoBak2 = -1;
    battlePetButtonFlag = 0;
}

/**
 * 배틀 명령 전송
 * 원본: battleSend(char* cmd)
 */
void battleSend(const char* cmd)
{
    if (cmd == NULL) return;

    // 명령 저장
    strncpy(BattleCmd, cmd, sizeof(BattleCmd) - 1);
    strncpy(BattleCmdBak, cmd, sizeof(BattleCmdBak) - 1);

    // 프로토콜로 전송
    lssproto_B_send(0, cmd);
}
