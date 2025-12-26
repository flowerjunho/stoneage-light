/**
 * StoneAge Battle System - Battle UI & Buttons
 *
 * 배틀 UI 및 버튼 처리 구현
 * 분석 기반: libStoneage.so
 */

#include "../../include/battle_types.h"
#include "../../include/battle_protocol.h"
#include <string.h>
#include <stdio.h>

/*============================================================================
 * 외부 변수 참조
 *============================================================================*/

extern int32_t      BattleMyNo;
extern int32_t      BattleMapNo;
extern int32_t      BattleItemNo;
extern int32_t      BattleJujutuNo;
extern int32_t      BattleWazaNo;
extern int32_t      BattleSkill;
extern int32_t      battleMenuFlag;
extern int32_t      battlePetButtonFlag;
extern int32_t      battleButtonBak;
extern int32_t      battleWazaTargetBak;
extern int32_t      BattleAnimFlag;

extern BattleStatus* getBattleStatus(void);

/*============================================================================
 * 버튼 상태
 *============================================================================*/

// 버튼 활성화 플래그
static bool g_btnAttackEnabled = true;
static bool g_btnJujutsuEnabled = true;
static bool g_btnItemEnabled = true;
static bool g_btnPetEnabled = true;
static bool g_btnGuardEnabled = true;
static bool g_btnCaptureEnabled = true;
static bool g_btnEscapeEnabled = true;
static bool g_btnPPLSkillEnabled = true;
static bool g_btnHelpEnabled = true;
static bool g_btnWazaEnabled = true;

// 타겟 선택 모드
static bool g_targetSelectMode = false;
static int  g_currentTargetSlot = -1;

/*============================================================================
 * 버튼 초기화/정리
 *============================================================================*/

/**
 * 배틀 버튼 초기화
 * 원본: ClearBattleButton()
 */
void ClearBattleButton(void)
{
    g_btnAttackEnabled = true;
    g_btnJujutsuEnabled = true;
    g_btnItemEnabled = true;
    g_btnPetEnabled = true;
    g_btnGuardEnabled = true;
    g_btnCaptureEnabled = true;
    g_btnEscapeEnabled = true;
    g_btnPPLSkillEnabled = true;
    g_btnHelpEnabled = true;
    g_btnWazaEnabled = true;

    g_targetSelectMode = false;
    g_currentTargetSlot = -1;

    battleButtonBak = 0;
    BattleItemNo = -1;
    BattleJujutuNo = -1;
    BattleWazaNo = -1;
}

/**
 * 배틀 버튼 끄기
 * 원본: BattleButtonOff()
 */
void BattleButtonOff(void)
{
    g_btnAttackEnabled = false;
    g_btnJujutsuEnabled = false;
    g_btnItemEnabled = false;
    g_btnPetEnabled = false;
    g_btnGuardEnabled = false;
    g_btnCaptureEnabled = false;
    g_btnEscapeEnabled = false;
    g_btnPPLSkillEnabled = false;
    g_btnHelpEnabled = false;
    g_btnWazaEnabled = false;

    battleMenuFlag = 0;
}

/*============================================================================
 * 공격 버튼
 *============================================================================*/

/**
 * 공격 버튼 처리
 * 원본: BattleButtonAttack()
 *
 * 플로우:
 * 1. 버튼 클릭
 * 2. 타겟 선택 모드 진입
 * 3. 적 타겟 선택
 * 4. 명령 전송 ("H|타겟슬롯")
 */
void BattleButtonAttack(void)
{
    if (!g_btnAttackEnabled) return;
    if (BattleAnimFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 타겟 선택 모드 진입
    g_targetSelectMode = true;
    status->currentCmd.type = BATTLE_CMD_ATTACK;
    status->currentCmd.actorSlot = BattleMyNo;

    // 기본 타겟 설정 (첫 번째 살아있는 적)
    for (int i = ENEMY_START_INDEX; i < MAX_BATTLE_UNITS; i++)
    {
        if (status->units[i].state == UNIT_STATE_ALIVE)
        {
            g_currentTargetSlot = i;
            break;
        }
    }

    // 타겟 선택 UI 표시
    BattleTargetSelect();
}

/*============================================================================
 * 주술(마법) 버튼
 *============================================================================*/

/**
 * 주술 버튼 처리
 * 원본: BattleButtonJujutsu()
 *
 * 플로우:
 * 1. 버튼 클릭
 * 2. 주술 목록 표시
 * 3. 주술 선택
 * 4. 타겟 선택 모드 진입
 * 5. 명령 전송 ("S|타겟슬롯|주술번호")
 */
void BattleButtonJujutsu(void)
{
    if (!g_btnJujutsuEnabled) return;
    if (BattleAnimFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 주술 목록 표시
    // 실제로는 UI 시스템으로 목록 팝업

    status->currentCmd.type = BATTLE_CMD_SKILL;
    status->currentCmd.actorSlot = BattleMyNo;

    // BattleJujutuNo가 설정되면 타겟 선택 모드
    if (BattleJujutuNo >= 0)
    {
        status->currentCmd.skillNo = BattleJujutuNo;
        g_targetSelectMode = true;
        BattleTargetSelect();
    }
}

/*============================================================================
 * 아이템 버튼
 *============================================================================*/

/**
 * 아이템 버튼 처리
 * 원본: BattleButtonItem()
 *
 * 플로우:
 * 1. 버튼 클릭
 * 2. 아이템 목록 표시
 * 3. 아이템 선택
 * 4. 타겟 선택 (필요시)
 * 5. 명령 전송 ("I|타겟슬롯|아이템번호")
 */
void BattleButtonItem(void)
{
    if (!g_btnItemEnabled) return;
    if (BattleAnimFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 아이템 목록 표시
    // 실제로는 UI 시스템으로 인벤토리 팝업

    status->currentCmd.type = BATTLE_CMD_ITEM;
    status->currentCmd.actorSlot = BattleMyNo;

    // BattleItemNo가 설정되면 타겟 선택 모드
    if (BattleItemNo >= 0)
    {
        status->currentCmd.itemNo = BattleItemNo;
        g_targetSelectMode = true;

        // 아이템에 따라 타겟 종류 결정
        // 회복 아이템 = 아군 타겟
        // 공격 아이템 = 적 타겟

        BattleTargetSelect();
    }
}

/*============================================================================
 * 펫 버튼
 *============================================================================*/

/**
 * 펫 버튼 처리
 * 원본: BattleButtonPet()
 *
 * 플로우:
 * 1. 버튼 클릭
 * 2. 펫 목록 표시
 * 3. 펫 선택
 * 4. 명령 전송 ("P|펫번호")
 */
void BattleButtonPet(void)
{
    if (!g_btnPetEnabled) return;
    if (BattleAnimFlag) return;
    if (!battlePetButtonFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 펫 목록 표시
    // 실제로는 UI 시스템으로 펫 선택 팝업

    status->currentCmd.type = BATTLE_CMD_PET;
    status->currentCmd.actorSlot = BattleMyNo;

    // 펫이 선택되면 명령 전송
    if (status->currentCmd.petNo >= 0)
    {
        char cmd[64];
        snprintf(cmd, sizeof(cmd), "P|%d", status->currentCmd.petNo);
        battleSend(cmd);
    }
}

/*============================================================================
 * 방어 버튼
 *============================================================================*/

/**
 * 방어 버튼 처리
 * 원본: BattleButtonGuard()
 *
 * 타겟 선택 없이 바로 명령 전송 ("G")
 */
void BattleButtonGuard(void)
{
    if (!g_btnGuardEnabled) return;
    if (BattleAnimFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    status->currentCmd.type = BATTLE_CMD_GUARD;
    status->currentCmd.actorSlot = BattleMyNo;

    // 바로 명령 전송
    battleSend("G");

    // 버튼 비활성화
    BattleButtonOff();
}

/*============================================================================
 * 포획 버튼
 *============================================================================*/

/**
 * 포획 버튼 처리
 * 원본: BattleButtonCapture()
 *
 * 플로우:
 * 1. 버튼 클릭
 * 2. 타겟 선택 모드 진입 (적 펫만)
 * 3. 명령 전송 ("C|타겟슬롯")
 */
void BattleButtonCapture(void)
{
    if (!g_btnCaptureEnabled) return;
    if (BattleAnimFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    status->currentCmd.type = BATTLE_CMD_CAPTURE;
    status->currentCmd.actorSlot = BattleMyNo;

    // 타겟 선택 모드 (적 펫만 선택 가능)
    g_targetSelectMode = true;

    // 포획 가능한 대상 체크
    for (int i = ENEMY_START_INDEX; i < MAX_BATTLE_UNITS; i++)
    {
        BattleUnit* unit = &status->units[i];
        // 펫이고 살아있고 HP가 낮은 적
        if (unit->pAction && unit->pAction->isPet &&
            unit->state == UNIT_STATE_ALIVE)
        {
            unit->isSelectable = true;
        }
        else
        {
            unit->isSelectable = false;
        }
    }

    BattleTargetSelect();
}

/*============================================================================
 * 도망 버튼
 *============================================================================*/

/**
 * 도망 버튼 처리
 * 원본: BattleButtonEscape()
 *
 * 타겟 선택 없이 바로 명령 전송 ("E")
 */
void BattleButtonEscape(void)
{
    if (!g_btnEscapeEnabled) return;
    if (BattleAnimFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    if (!status->canEscape)
    {
        // 도망 불가능 메시지
        return;
    }

    status->currentCmd.type = BATTLE_CMD_ESCAPE;
    status->currentCmd.actorSlot = BattleMyNo;

    // 바로 명령 전송
    battleSend("E");

    // 버튼 비활성화
    BattleButtonOff();
}

/*============================================================================
 * 직업 스킬 버튼
 *============================================================================*/

/**
 * 직업 스킬 버튼 처리
 * 원본: BattleButtonPPLSKILL()
 *
 * 직업별 고유 스킬 사용
 */
void BattleButtonPPLSKILL(void)
{
    if (!g_btnPPLSkillEnabled) return;
    if (BattleAnimFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 직업 스킬 목록 표시
    // 실제로는 UI 시스템으로 스킬 목록 팝업

    status->currentCmd.type = BATTLE_CMD_SKILL;
    status->currentCmd.actorSlot = BattleMyNo;

    // 스킬 선택 후 타겟 선택
    if (BattleSkill > 0)
    {
        status->currentCmd.skillNo = BattleSkill;
        g_targetSelectMode = true;
        BattleTargetSelect();
    }
}

/*============================================================================
 * 도움말 버튼
 *============================================================================*/

/**
 * 도움말 버튼 처리
 * 원본: BattleButtonHelp()
 */
void BattleButtonHelp(void)
{
    if (!g_btnHelpEnabled) return;

    // 도움말 표시
}

/*============================================================================
 * 기술 버튼
 *============================================================================*/

/**
 * 기술 버튼 처리
 * 원본: BattleButtonWaza()
 */
void BattleButtonWaza(void)
{
    if (!g_btnWazaEnabled) return;
    if (BattleAnimFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 기술 목록 표시

    if (BattleWazaNo >= 0)
    {
        status->currentCmd.type = BATTLE_CMD_SKILL;
        status->currentCmd.skillNo = BattleWazaNo;
        g_targetSelectMode = true;
        BattleTargetSelect();
    }
}

/*============================================================================
 * 타겟 선택
 *============================================================================*/

/**
 * 타겟 선택 처리
 * 원본: BattleTargetSelect()
 */
void BattleTargetSelect(void)
{
    if (!g_targetSelectMode) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 타겟 선택 UI 표시
    // 선택 가능한 유닛 강조

    // 실제로는 마우스/터치 입력 처리
}

/**
 * 기술 히트박스 설정
 * 원본: BattleSetWazaHitBox(int x, int y)
 *
 * 기술의 영향 범위 설정
 */
void BattleSetWazaHitBox(int x, int y)
{
    battleWazaTargetBak = -1;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 좌표 기반으로 타겟 슬롯 찾기
    for (int i = 0; i < MAX_BATTLE_UNITS; i++)
    {
        BattleUnit* unit = &status->units[i];
        if (unit->pAction == NULL) continue;
        if (!unit->isSelectable) continue;

        action* act = unit->pAction;

        // 히트박스 체크 (간략화)
        int unitX = act->x;
        int unitY = act->y;
        int hitRange = 32; // 기본 히트 범위

        if (x >= unitX - hitRange && x <= unitX + hitRange &&
            y >= unitY - hitRange && y <= unitY + hitRange)
        {
            battleWazaTargetBak = i;
            break;
        }
    }
}

/*============================================================================
 * 타겟 선택 완료
 *============================================================================*/

/**
 * 타겟 선택 확정 및 명령 전송
 */
void confirmTargetSelection(int targetSlot)
{
    if (!g_targetSelectMode) return;
    if (targetSlot < 0 || targetSlot >= MAX_BATTLE_UNITS) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    status->currentCmd.targetSlot = targetSlot;

    // 명령 문자열 생성 및 전송
    char cmd[64];

    switch (status->currentCmd.type)
    {
        case BATTLE_CMD_ATTACK:
            snprintf(cmd, sizeof(cmd), "H|%d", targetSlot);
            break;

        case BATTLE_CMD_SKILL:
            snprintf(cmd, sizeof(cmd), "S|%d|%d",
                     targetSlot, status->currentCmd.skillNo);
            break;

        case BATTLE_CMD_ITEM:
            snprintf(cmd, sizeof(cmd), "I|%d|%d",
                     targetSlot, status->currentCmd.itemNo);
            break;

        case BATTLE_CMD_CAPTURE:
            snprintf(cmd, sizeof(cmd), "C|%d", targetSlot);
            break;

        default:
            return;
    }

    battleSend(cmd);

    // 상태 초기화
    g_targetSelectMode = false;
    g_currentTargetSlot = -1;
    BattleButtonOff();
}

/*============================================================================
 * 부활 선택 (가문전)
 *============================================================================*/

/**
 * 부활 선택 처리
 * 원본: BattlerRliveSelectProc()
 */
void BattlerRliveSelectProc(void)
{
    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 가문전에서 사망 시 부활 선택
    // 실제로는 UI로 선택지 표시
}

/*============================================================================
 * 프롬프트 표시
 *============================================================================*/

/**
 * 배틀 프롬프트 표시
 * 원본: showPromptBmpToBattle(int x, int y, char* text)
 */
void showPromptBmpToBattle(int x, int y, const char* text)
{
    if (text == NULL) return;

    // 지정된 위치에 프롬프트 메시지 표시
}
