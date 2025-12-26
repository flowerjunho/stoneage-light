/**
 * StoneAge Battle System - Action System
 *
 * 액션(캐릭터/펫/몬스터) 시스템 구현
 * 분석 기반: libStoneage.so
 */

#include "../../include/battle_types.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

/*============================================================================
 * 전역 변수
 *============================================================================*/

// 액션 배열 (모든 활성 유닛)
#define MAX_ACTIONS 256
static action* g_actions[MAX_ACTIONS];
static int g_actionCount = 0;

// 액션 윈도우
static bool g_actionWndFlag = false;

// 스프라이트 정보
void* SpriteInfo = NULL;

// 스타 루프 (이펙트)
int StarLoop = 0;

// 액션 정보
static int action_inf = 0;

// 워프 카운트
int warpCount = 0;

/*============================================================================
 * 액션 초기화/정리
 *============================================================================*/

/**
 * 액션 시스템 초기화
 * 원본: InitAction()
 */
void InitAction(void)
{
    memset(g_actions, 0, sizeof(g_actions));
    g_actionCount = 0;
    g_actionWndFlag = false;
}

/**
 * 특정 액션 정리
 * 원본: ClearAction(action* act)
 */
void ClearAction(action* act)
{
    if (act == NULL) return;

    memset(act, 0, sizeof(action));
}

/**
 * 모든 액션 사망 처리
 * 원본: DeathAllAction()
 */
void DeathAllAction(void)
{
    for (int i = 0; i < g_actionCount; i++)
    {
        if (g_actions[i])
        {
            g_actions[i]->isDead = true;
        }
    }
}

/**
 * 액션 종료
 * 원본: EndAction()
 */
void EndAction(void)
{
    for (int i = 0; i < MAX_ACTIONS; i++)
    {
        if (g_actions[i])
        {
            free(g_actions[i]);
            g_actions[i] = NULL;
        }
    }
    g_actionCount = 0;
}

/*============================================================================
 * 액션 생성
 *============================================================================*/

/**
 * 캐릭터 액션 생성
 * 원본: createCharAction(int graphNo, int x, int y, int dir)
 */
action* createCharAction(int graphNo, int x, int y, int dir)
{
    if (g_actionCount >= MAX_ACTIONS) return NULL;

    action* act = (action*)malloc(sizeof(action));
    if (act == NULL) return NULL;

    memset(act, 0, sizeof(action));

    act->id = g_actionCount;
    act->graphNo = graphNo;
    act->x = x;
    act->y = y;
    act->dir = dir;
    act->isPlayer = true;
    act->isDead = false;

    g_actions[g_actionCount++] = act;
    return act;
}

/**
 * 펫 액션 생성
 * 원본: createPetAction(int graphNo, int x, int y, int dir, int a, int b, int c)
 */
action* createPetAction(int graphNo, int x, int y, int dir, int a, int b, int c)
{
    action* act = createCharAction(graphNo, x, y, dir);
    if (act)
    {
        act->isPlayer = false;
        act->isPet = true;
    }
    return act;
}

/**
 * 공용 이펙트 액션 생성
 * 원본: createCommmonEffectAction(int effectNo, int x, int y, int a, int b, int c)
 */
action* createCommmonEffectAction(int effectNo, int x, int y, int a, int b, int c)
{
    action* act = createCharAction(effectNo, x, y, 0);
    if (act)
    {
        act->isPlayer = false;
        act->isPet = false;
        act->effectNo = effectNo;
    }
    return act;
}

/*============================================================================
 * 액션 획득
 *============================================================================*/

/**
 * 액션 획득
 * 원본: GetAction(unsigned char type, unsigned int index)
 */
action* GetAction(unsigned char type, unsigned int index)
{
    if (index >= MAX_ACTIONS) return NULL;
    return g_actions[index];
}

/**
 * 액션에서 객체 인덱스 획득
 * 원본: getObjIndexFormAction(action* act)
 */
int getObjIndexFormAction(action* act)
{
    if (act == NULL) return -1;
    return act->id;
}

/**
 * 액션 크기 획득
 * 원본: GetActionSize(action* act, short* width, short* height)
 */
void GetActionSize(action* act, short* width, short* height)
{
    if (act == NULL) return;
    if (width) *width = 64;     // 기본 크기
    if (height) *height = 64;
}

/*============================================================================
 * 액션 실행
 *============================================================================*/

/**
 * 액션 실행
 * 원본: RunAction(bool flag)
 */
void RunAction(bool flag)
{
    for (int i = 0; i < g_actionCount; i++)
    {
        if (g_actions[i] && !g_actions[i]->isDead)
        {
            // 각 액션 업데이트
            if (g_actions[i]->isPlayer || g_actions[i]->isPet)
            {
                charProc(g_actions[i]);
            }
        }
    }
}

/**
 * 액션 함수 실행
 * 원본: RunActionFunc(void* param)
 */
void RunActionFunc(void* param)
{
    RunAction(true);
}

/*============================================================================
 * 캐릭터 처리
 *============================================================================*/

/**
 * 캐릭터 메인 처리
 * 원본: charProc(action* act)
 */
void charProc(action* act)
{
    if (act == NULL) return;

    // 이동 처리
    charMove(act);

    // 애니메이션 처리
    AnimDisp(act);
}

/**
 * 펫 처리
 * 원본: petProc(action* act)
 */
void petProc(action* act)
{
    if (act == NULL) return;

    // 펫 이동 처리
    petMoveProc(act);
}

/**
 * 캐릭터 이동
 * 원본: charMove(action* act)
 */
void charMove(action* act)
{
    if (act == NULL) return;

    // 이동 로직
}

/**
 * 캐릭터 이동 2
 * 원본: charMove2(action* act)
 */
void charMove2(action* act)
{
    if (act == NULL) return;

    // 대체 이동 로직
}

/**
 * 내부 캐릭터 이동
 * 원본: _charMove(action* act)
 */
void _charMove(action* act)
{
    if (act == NULL) return;

    // 내부 이동 처리
}

/**
 * 펫 이동 처리
 * 원본: petMoveProc(action* act)
 */
void petMoveProc(action* act)
{
    if (act == NULL) return;

    // 펫 이동 처리
}

/**
 * 펫 라우트 획득
 * 원본: getPetRoute(action* act)
 */
int getPetRoute(action* act)
{
    if (act == NULL) return -1;
    return 0;
}

/*============================================================================
 * 애니메이션 표시
 *============================================================================*/

/**
 * 애니메이션 표시
 * 원본: AnimDisp(action* act)
 */
void AnimDisp(action* act)
{
    if (act == NULL) return;

    // 프레임 업데이트
    act->animCount++;
    if (act->animCount >= 6)    // 6 프레임마다 변경
    {
        act->animCount = 0;
        act->animFrame++;
    }
}

/**
 * 윈도우 표시
 * 원본: WindowDisp(action* act)
 */
void WindowDisp(action* act)
{
    if (act == NULL) return;

    // 캐릭터 관련 윈도우 표시
}

/**
 * 사망 액션
 * 원본: DeathAction(action* act)
 */
void DeathAction(action* act)
{
    if (act == NULL) return;

    act->isDead = true;
    // 사망 애니메이션 재생
}

/**
 * 스탠드 액션 설정
 * 원본: setStandAction()
 */
void setStandAction(void)
{
    // 모든 액션을 스탠드 상태로
    for (int i = 0; i < g_actionCount; i++)
    {
        if (g_actions[i] && !g_actions[i]->isDead)
        {
            g_actions[i]->animNo = 0;   // 스탠드
        }
    }
}

/**
 * PC 액션 설정
 * 원본: setPcAction(int actionNo)
 */
void setPcAction(int actionNo)
{
    // PC 액션 번호 설정
}

/*============================================================================
 * 캐릭터 상태 설정
 *============================================================================*/

/**
 * 배틀 상태 설정
 * 원본: setCharBattle(action* act, int flag, short a, short b)
 */
void setCharBattle(action* act, int flag, short a, short b)
{
    if (act == NULL) return;
    act->battleNo = flag;
}

/**
 * 배틀 상태 제거
 * 원본: delCharBattle(action* act)
 */
void delCharBattle(action* act)
{
    if (act == NULL) return;
    act->battleNo = -1;
}

/**
 * 캐릭터 타입 획득
 * 원본: getCharType(action* act)
 */
int getCharType(action* act)
{
    if (act == NULL) return -1;

    if (act->isPlayer) return 0;
    if (act->isPet) return 1;
    if (act->isEnemy) return 2;
    return -1;
}

/**
 * 팀 번호 획득
 * 원본: getCharTeamNum(action* act)
 */
int getCharTeamNum(action* act)
{
    if (act == NULL) return -1;

    if (act->battleNo < MAX_ALLY_UNITS)
        return 0;   // 아군
    return 1;       // 적군
}

/**
 * 쉴드 플래그 획득
 * 원본: getShieldFlag(action* act)
 */
bool getShieldFlag(action* act)
{
    if (act == NULL) return false;
    return false;   // 쉴드 상태
}

/**
 * 턴 형태 획득
 * 원본: getTurnFormAct(action* act)
 */
int getTurnFormAct(action* act)
{
    if (act == NULL) return -1;
    return 0;
}

/*============================================================================
 * 캐릭터 이펙트
 *============================================================================*/

/**
 * 마법 사용 설정
 * 원본: setCharUseMagic(action* act)
 */
void setCharUseMagic(action* act)
{
    if (act == NULL) return;
    // 마법 사용 상태 설정
}

/**
 * 마법 사용 제거
 * 원본: delCharUseMagic(action* act)
 */
void delCharUseMagic(action* act)
{
    if (act == NULL) return;
}

/**
 * 적 이펙트 설정
 * 원본: setCharEnemyEffect(action* act, int effectNo)
 */
void setCharEnemyEffect(action* act, int effectNo)
{
    if (act == NULL) return;
    act->effectNo = effectNo;
}

/**
 * 적 이펙트 제거
 * 원본: delCharEnemyEffect(action* act)
 */
void delCharEnemyEffect(action* act)
{
    if (act == NULL) return;
    act->effectNo = 0;
}

/**
 * FM 이펙트 설정
 * 원본: setCharFMEffect(action* act, int effectNo)
 */
void setCharFMEffect(action* act, int effectNo)
{
    if (act == NULL) return;
}

/**
 * FM 이펙트 제거
 * 원본: delCharFMEffect(action* act)
 */
void delCharFMEffect(action* act)
{
    if (act == NULL) return;
}

/**
 * 아이템 이펙트 설정
 * 원본: setCharItemEffect(action* act, int effectNo)
 */
void setCharItemEffect(action* act, int effectNo)
{
    if (act == NULL) return;
}

/**
 * 아이템 이펙트 제거
 * 원본: delCharItemEffect(action* act)
 */
void delCharItemEffect(action* act)
{
    if (act == NULL) return;
}

/**
 * 문자열 이펙트 설정
 * 원본: setCharStrEffect(action* act, int effectNo)
 */
void setCharStrEffect(action* act, int effectNo)
{
    if (act == NULL) return;
}

/**
 * 문자열 이펙트 제거
 * 원본: delCharStrEffect(action* act)
 */
void delCharStrEffect(action* act)
{
    if (act == NULL) return;
}

/*============================================================================
 * 캐릭터 이동 포인트
 *============================================================================*/

/**
 * 이동 포인트 설정
 * 원본: setCharMovePoint(action* act, int x, int y)
 */
void setCharMovePoint(action* act, int x, int y)
{
    if (act == NULL) return;
    // 목표 좌표 설정
}

/**
 * 내부 이동 포인트 설정
 * 원본: _setCharMovePoint(action* act, int x, int y)
 */
void _setCharMovePoint(action* act, int x, int y)
{
    setCharMovePoint(act, x, y);
}

/**
 * 이동 포인트 스톡
 * 원본: stockCharMovePoint(action* act, int x, int y)
 */
void stockCharMovePoint(action* act, int x, int y)
{
    if (act == NULL) return;
    // 이동 포인트 큐에 추가
}

/**
 * 이동 포인트 보정
 * 원본: correctCharMovePoint(action* act, int x, int y)
 */
void correctCharMovePoint(action* act, int x, int y)
{
    if (act == NULL) return;
    // 이동 포인트 보정
}

/**
 * 워프 포인트 설정
 * 원본: setCharWarpPoint(action* act, int x, int y)
 */
void setCharWarpPoint(action* act, int x, int y)
{
    if (act == NULL) return;
    act->x = x;
    act->y = y;
    warpCount++;
}

/*============================================================================
 * 캐릭터 관계
 *============================================================================*/

/**
 * 파티 설정
 * 원본: setCharParty(action* act)
 */
void setCharParty(action* act)
{
    if (act == NULL) return;
}

/**
 * 파티 제거
 * 원본: delCharParty(action* act)
 */
void delCharParty(action* act)
{
    if (act == NULL) return;
}

/**
 * 리더 설정
 * 원본: setCharLeader(action* act)
 */
void setCharLeader(action* act)
{
    if (act == NULL) return;
}

/**
 * 리더 제거
 * 원본: delCharLeader(action* act)
 */
void delCharLeader(action* act)
{
    if (act == NULL) return;
}

/**
 * 가문 설정
 * 원본: setCharFamily(action* act, int familyNo)
 */
void setCharFamily(action* act, int familyNo)
{
    if (act == NULL) return;
}

/**
 * 가문 제거
 * 원본: delCharFamily(action* act)
 */
void delCharFamily(action* act)
{
    if (act == NULL) return;
}

/*============================================================================
 * 기타
 *============================================================================*/

/**
 * 말풍선 설정
 * 원본: setCharFukidashi(action* act, unsigned int text)
 */
void setCharFukidashi(action* act, unsigned int text)
{
    if (act == NULL) return;
}

/**
 * 이름 색상 설정
 * 원본: setCharNameColor(action* act, int color)
 */
void setCharNameColor(action* act, int color)
{
    if (act == NULL) return;
}

/**
 * 캐릭터 상태 그리기
 * 원본: drawCharStatus(action* act)
 */
void drawCharStatus(action* act)
{
    if (act == NULL) return;
    // HP/MP 바 등 표시
}

/**
 * 액션 변경
 * 원본: changeCharAct(action* act, int a, int b, int c, int d, int e, int f, int g)
 */
void changeCharAct(action* act, int a, int b, int c, int d, int e, int f, int g)
{
    if (act == NULL) return;
    // 액션 상태 변경
}

/**
 * 버퍼 카운트 쉬프트
 * 원본: shiftBufCount(action* act)
 */
void shiftBufCount(action* act)
{
    if (act == NULL) return;
}

/**
 * 애니메이션 체크
 * 원본: ActionAnim_check(int* result)
 */
void ActionAnim_check(int* result)
{
    if (result == NULL) return;

    *result = 0;
    for (int i = 0; i < g_actionCount; i++)
    {
        if (g_actions[i] && !g_actions[i]->isDead)
        {
            if (g_actions[i]->animNo > 0)
            {
                *result = 1;
                break;
            }
        }
    }
}

/**
 * 액션 윈도우 열기
 * 원본: openActionWnd()
 */
void openActionWnd(void)
{
    g_actionWndFlag = true;
}

/**
 * 액션 윈도우 닫기
 * 원본: closeActionWnd()
 */
void closeActionWnd(void)
{
    g_actionWndFlag = false;
}

/**
 * 액션 윈도우 플래그 획득
 * 원본: getActionWndFlag()
 */
bool getActionWndFlag(void)
{
    return g_actionWndFlag;
}

/**
 * 액션 윈도우 처리
 * 원본: actionWndProc()
 */
void actionWndProc(void)
{
    if (!g_actionWndFlag) return;
    // 윈도우 처리
}

/**
 * 액션 단축키 처리
 * 원본: actionShortCutKeyProc()
 */
void actionShortCutKeyProc(void)
{
    // 단축키 처리
}

/**
 * 패턴 처리
 * 원본: pattern(action* act, int a, int b)
 */
void pattern(action* act, int a, int b)
{
    if (act == NULL) return;
    // 패턴 애니메이션
}
