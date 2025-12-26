/**
 * StoneAge Battle System - AI Auto Battle
 *
 * AI 자동전투 시스템 구현
 * 분석 기반: libStoneage.so
 */

#include "../../include/battle_types.h"
#include "../../include/battle_protocol.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

/*============================================================================
 * 외부 변수 참조
 *============================================================================*/

extern int32_t      BattleMyNo;
extern int32_t      BattleAnimFlag;
extern int32_t      battleMenuFlag;
extern int32_t      autoBattleCount;

extern BattleStatus* getBattleStatus(void);
extern void battleSend(const char* cmd);

/*============================================================================
 * AI 전역 변수
 *============================================================================*/

// AI 상태
int32_t     AI_State = 0;               // AI 상태 (0=비활성, 1=활성)
int32_t     AI_Choosen = 0;             // AI가 선택한 행동

// AI 설정
AIConfig    aiConfig = {0};

// 포획 플래그
int32_t     aiCatchFlag = 0;

// 콤보박스/텍스트박스 포인터 (UI 연동)
void*       p_cbMagicBloodIndex = NULL;
void*       p_cbMagicBloodTarget = NULL;
void*       p_vtMagicBloodLimit = NULL;
void*       p_cbGameMagicBloodIndex = NULL;
void*       p_vtGameMagicBloodLimit = NULL;
void*       p_cbUsuallyMagicIndex = NULL;
void*       p_vtUsuallyMagicLimit = NULL;

// 펫 스킬
int32_t     petSkill[10] = {0};

// 직업 스킬
int32_t     profession_skill[20] = {0};

// 윈도우 인덱스
int32_t     AiWndIndex = -1;

/*============================================================================
 * AI 초기화
 *============================================================================*/

/**
 * AI 시스템 초기화
 * 원본: AI_Init(bool enabled)
 */
void AI_Init(bool enabled)
{
    AI_State = enabled ? 1 : 0;
    AI_Choosen = 0;
    autoBattleCount = 0;

    // 기본 설정 초기화
    memset(&aiConfig, 0, sizeof(AIConfig));
    aiConfig.enabled = enabled;
    aiConfig.healThreshold = 50;        // HP 50% 이하일 때 힐
    aiConfig.petHealThreshold = 30;     // 펫 HP 30% 이하일 때 힐
    aiConfig.catchThreshold = 20;       // HP 20% 이하일 때 포획
    aiConfig.escapeHpThreshold = 10;    // HP 10% 이하일 때 도망
}

/**
 * AI 설정 저장
 * 원본: AI_Save()
 */
void AI_Save(void)
{
    // 설정을 파일 또는 ConfigManager에 저장
    // 실제로는 ConfigManager::setInt() 등 사용
}

/**
 * AI 설정 초기화
 * 원본: initAiSetting()
 */
void initAiSetting(void)
{
    // UI 컨트롤 초기화
    // 콤보박스, 텍스트박스 등 설정
}

/**
 * 배틀 AI 초기화
 * 원본: initBattleAi()
 */
void initBattleAi(void)
{
    AI_Choosen = 0;
    autoBattleCount = 0;
}

/*============================================================================
 * AI 행동 선택
 *============================================================================*/

/**
 * AI 행동 선택 (메인 로직)
 * 원본: AI_ChooseAction()
 *
 * AI 우선순위:
 * 1. 아군 HP가 낮으면 힐
 * 2. 펫 HP가 낮으면 펫 힐
 * 3. 포획 가능하면 포획
 * 4. HP가 매우 낮으면 도망
 * 5. 공격 마법 사용
 * 6. 일반 공격
 */
void AI_ChooseAction(void)
{
    if (!aiConfig.enabled) return;
    if (BattleAnimFlag) return;
    if (!battleMenuFlag) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    BattleUnit* myUnit = &status->units[BattleMyNo];
    if (myUnit->state != UNIT_STATE_ALIVE) return;

    char cmd[64];
    bool actionTaken = false;

    // 1. 아군 HP 체크 - 힐 필요 여부
    if (aiConfig.healMagicIndex > 0)
    {
        for (int i = 0; i < MAX_ALLY_UNITS; i++)
        {
            BattleUnit* ally = &status->units[i];
            if (ally->state != UNIT_STATE_ALIVE) continue;

            int hpPercent = (ally->hp * 100) / ally->maxHp;
            if (hpPercent <= aiConfig.healThreshold)
            {
                // 힐 마법 사용
                snprintf(cmd, sizeof(cmd), "S|%d|%d", i, aiConfig.healMagicIndex);
                battleSend(cmd);
                AI_Choosen = BATTLE_CMD_SKILL;
                actionTaken = true;
                break;
            }
        }
    }

    if (actionTaken) return;

    // 2. 펫 HP 체크
    if (aiConfig.petAutoHeal && aiConfig.healMagicIndex > 0)
    {
        int petSlot = BattleMyNo + 1;   // 내 펫은 내 다음 슬롯
        if (petSlot < MAX_ALLY_UNITS)
        {
            BattleUnit* pet = &status->units[petSlot];
            if (pet->state == UNIT_STATE_ALIVE)
            {
                int hpPercent = (pet->hp * 100) / pet->maxHp;
                if (hpPercent <= aiConfig.petHealThreshold)
                {
                    snprintf(cmd, sizeof(cmd), "S|%d|%d", petSlot, aiConfig.healMagicIndex);
                    battleSend(cmd);
                    AI_Choosen = BATTLE_CMD_SKILL;
                    actionTaken = true;
                }
            }
        }
    }

    if (actionTaken) return;

    // 3. 내 HP가 매우 낮으면 도망 고려
    if (aiConfig.autoEscape && status->canEscape)
    {
        int myHpPercent = (myUnit->hp * 100) / myUnit->maxHp;
        if (myHpPercent <= aiConfig.escapeHpThreshold)
        {
            battleSend("E");
            AI_Choosen = BATTLE_CMD_ESCAPE;
            return;
        }
    }

    // 4. 포획 체크
    if (aiConfig.autoCatch && aiCatchFlag)
    {
        for (int i = ENEMY_START_INDEX; i < MAX_BATTLE_UNITS; i++)
        {
            BattleUnit* enemy = &status->units[i];
            if (enemy->state != UNIT_STATE_ALIVE) continue;
            if (enemy->pAction == NULL) continue;
            if (!enemy->pAction->isPet) continue;   // 펫만 포획 가능

            int hpPercent = (enemy->hp * 100) / enemy->maxHp;
            if (hpPercent <= aiConfig.catchThreshold)
            {
                snprintf(cmd, sizeof(cmd), "C|%d", i);
                battleSend(cmd);
                AI_Choosen = BATTLE_CMD_CAPTURE;
                actionTaken = true;
                break;
            }
        }
    }

    if (actionTaken) return;

    // 5. 공격 마법 사용
    if (aiConfig.attackMagicIndex > 0 && myUnit->mp > 10)
    {
        // 살아있는 첫 번째 적 찾기
        for (int i = ENEMY_START_INDEX; i < MAX_BATTLE_UNITS; i++)
        {
            BattleUnit* enemy = &status->units[i];
            if (enemy->state == UNIT_STATE_ALIVE)
            {
                snprintf(cmd, sizeof(cmd), "S|%d|%d", i, aiConfig.attackMagicIndex);
                battleSend(cmd);
                AI_Choosen = BATTLE_CMD_SKILL;
                actionTaken = true;
                break;
            }
        }
    }

    if (actionTaken) return;

    // 6. 기본: 일반 공격
    {
        // 가장 HP가 낮은 적 찾기
        int targetSlot = -1;
        int lowestHp = 999999;

        for (int i = ENEMY_START_INDEX; i < MAX_BATTLE_UNITS; i++)
        {
            BattleUnit* enemy = &status->units[i];
            if (enemy->state == UNIT_STATE_ALIVE)
            {
                if (enemy->hp < lowestHp)
                {
                    lowestHp = enemy->hp;
                    targetSlot = i;
                }
            }
        }

        if (targetSlot >= 0)
        {
            snprintf(cmd, sizeof(cmd), "H|%d", targetSlot);
            battleSend(cmd);
            AI_Choosen = BATTLE_CMD_ATTACK;
        }
    }

    autoBattleCount++;
}

/*============================================================================
 * 일반 AI 처리
 *============================================================================*/

/**
 * 일반 AI 처리
 * 원본: usuallyAiProc()
 *
 * 매 프레임 호출되어 AI 상태 업데이트
 */
void usuallyAiProc(void)
{
    if (!aiConfig.enabled) return;

    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 전투 중이고 명령 대기 상태일 때 AI 행동
    if (status->state == BATTLE_STATE_WAITING && !BattleAnimFlag)
    {
        AI_ChooseAction();
    }
}

/*============================================================================
 * AI 설정 UI
 *============================================================================*/

/**
 * AI 설정 UI 처리
 * 원본: AI_SettingProc()
 */
void AI_SettingProc(void)
{
    // AI 설정 윈도우 처리
    // 실제로는 ScrollPanel, ComboBox 등 사용

    if (AiWndIndex < 0) return;

    // UI 업데이트 및 입력 처리
}

/**
 * 설명 윈도우 숨기기
 * 원본: hideDescriptionWnd()
 */
void hideDescriptionWnd(void)
{
    // 설명 팝업 숨기기
}

/**
 * 설명 윈도우 초기화
 * 원본: initWndDescription(int x, int y, char* title, char* desc, int a, bool b)
 */
void initWndDescription(int x, int y, const char* title, const char* desc, int a, bool b)
{
    if (title == NULL || desc == NULL) return;

    // 설명 윈도우 생성 및 표시
}

/*============================================================================
 * AI 유틸리티 함수
 *============================================================================*/

/**
 * 최적 타겟 찾기
 * HP가 가장 낮은 살아있는 적 반환
 */
int findBestAttackTarget(void)
{
    BattleStatus* status = getBattleStatus();
    if (status == NULL) return -1;

    int targetSlot = -1;
    int lowestHp = 999999;

    for (int i = ENEMY_START_INDEX; i < MAX_BATTLE_UNITS; i++)
    {
        BattleUnit* enemy = &status->units[i];
        if (enemy->state == UNIT_STATE_ALIVE && enemy->hp < lowestHp)
        {
            lowestHp = enemy->hp;
            targetSlot = i;
        }
    }

    return targetSlot;
}

/**
 * 최적 힐 타겟 찾기
 * HP%가 가장 낮은 살아있는 아군 반환
 */
int findBestHealTarget(void)
{
    BattleStatus* status = getBattleStatus();
    if (status == NULL) return -1;

    int targetSlot = -1;
    int lowestHpPercent = 100;

    for (int i = 0; i < MAX_ALLY_UNITS; i++)
    {
        BattleUnit* ally = &status->units[i];
        if (ally->state == UNIT_STATE_ALIVE)
        {
            int hpPercent = (ally->hp * 100) / ally->maxHp;
            if (hpPercent < lowestHpPercent)
            {
                lowestHpPercent = hpPercent;
                targetSlot = i;
            }
        }
    }

    return targetSlot;
}

/**
 * 포획 가능 타겟 찾기
 * HP가 낮은 적 펫 반환
 */
int findCaptureTarget(void)
{
    BattleStatus* status = getBattleStatus();
    if (status == NULL) return -1;

    for (int i = ENEMY_START_INDEX; i < MAX_BATTLE_UNITS; i++)
    {
        BattleUnit* enemy = &status->units[i];
        if (enemy->state != UNIT_STATE_ALIVE) continue;
        if (enemy->pAction == NULL) continue;
        if (!enemy->pAction->isPet) continue;

        int hpPercent = (enemy->hp * 100) / enemy->maxHp;
        if (hpPercent <= aiConfig.catchThreshold)
        {
            return i;
        }
    }

    return -1;
}

/**
 * AI 활성화/비활성화
 */
void setAIEnabled(bool enabled)
{
    aiConfig.enabled = enabled;
    AI_State = enabled ? 1 : 0;

    if (!enabled)
    {
        AI_Choosen = 0;
        autoBattleCount = 0;
    }
}

/**
 * AI 활성화 여부 확인
 */
bool isAIEnabled(void)
{
    return aiConfig.enabled;
}

/**
 * AI 힐 임계값 설정
 */
void setAIHealThreshold(int percent)
{
    if (percent > 0 && percent <= 100)
    {
        aiConfig.healThreshold = percent;
    }
}

/**
 * AI 공격 마법 설정
 */
void setAIAttackMagic(int magicIndex)
{
    aiConfig.attackMagicIndex = magicIndex;
}

/**
 * AI 힐 마법 설정
 */
void setAIHealMagic(int magicIndex)
{
    aiConfig.healMagicIndex = magicIndex;
}

/**
 * 자동 포획 설정
 */
void setAIAutoCatch(bool enabled)
{
    aiConfig.autoCatch = enabled;
    aiCatchFlag = enabled ? 1 : 0;
}

/**
 * 자동 도망 설정
 */
void setAIAutoEscape(bool enabled, int hpPercent)
{
    aiConfig.autoEscape = enabled;
    if (hpPercent > 0 && hpPercent <= 100)
    {
        aiConfig.escapeHpThreshold = hpPercent;
    }
}
