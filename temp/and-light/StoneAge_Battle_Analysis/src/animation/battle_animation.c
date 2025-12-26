/**
 * StoneAge Battle System - Battle Animation
 *
 * 배틀 애니메이션 및 이펙트 처리
 * 분석 기반: libStoneage.so
 */

#include "../../include/battle_types.h"
#include <string.h>
#include <stdio.h>
#include <math.h>

/*============================================================================
 * 외부 변수 참조
 *============================================================================*/

extern int32_t BattleAnimFlag;
extern int32_t BattleMapNo;

/*============================================================================
 * 애니메이션 상수
 *============================================================================*/

#define ANIM_SPEED_NORMAL       30      // 일반 애니 속도 (fps)
#define ANIM_SPEED_FAST         60      // 빠른 애니 속도
#define DAMAGE_FLOAT_SPEED      2       // 데미지 숫자 상승 속도
#define DAMAGE_DISPLAY_TIME     60      // 데미지 표시 시간 (프레임)

// 부메랑 이펙트 좌표 테이블
static const int boomerang_pos_tbl_start_1[] = {0, 10, 20, 30, 40};
static const int boomerang_pos_tbl_start_2[] = {5, 15, 25, 35, 45};
static const int boomerang_pos_tbl_end_1[] = {100, 90, 80, 70, 60};
static const int boomerang_pos_tbl_end_2[] = {95, 85, 75, 65, 55};

// 부메랑 체크 좌표
static int boomrangCheckPos1 = 0;
static int boomrangCheckPos2 = 0;
static int boomrangCheckPos3 = 0;

// 방향 변환 테이블
static const int crs_change_tbl[] = {0, 1, 2, 3, 4, 5, 6, 7};
static const int crs_change_tbl2[] = {4, 5, 6, 7, 0, 1, 2, 3};

// 기절(piyo) 포인트
static int piyo_point = 0;
static const int piyo_tbl[] = {0, 1, 2, 3, 2, 1, 0, -1, -2, -3, -2, -1};

// 경계선 마크
static int boundary_mark = 0;
static int boundary_2 = 0;

// 플래시 벡터
static int flash_vct_no = 0;

// 지진 효과
static int g_iRunEarthQuake = 0;
static int g_iCurRunEarthQuake = 0;
static int g_iNumRunEarthQuake = 0;

// 느린 효과
static int slow_flg = 0;

/*============================================================================
 * 애니메이션 상태
 *============================================================================*/

typedef struct AnimState {
    int     frame;              // 현재 프레임
    int     maxFrame;           // 최대 프레임
    int     speed;              // 속도
    int     loopCount;          // 루프 카운트
    bool    isPlaying;          // 재생 중
    bool    isLoop;             // 루프 여부
} AnimState;

// 공격자/피격자 정보
static int AttNextMagicNum = 0;
static int AttPreMagicNum = 0;
static int BeAttNum = 0;
static int iBeAttNum = 0;
static int ShooterNum = 0;

// 파이어 스킬
static bool bFireInit = false;
static bool FireSkillEnd = false;

/*============================================================================
 * 공격 이펙트 함수
 *============================================================================*/

/**
 * 공격 이펙트 표시
 * 원본: DisplayAttackEffect(action* act)
 */
void DisplayAttackEffect(action* act)
{
    if (act == NULL) return;

    // 공격 애니메이션 재생
    // 실제로는 스프라이트 시스템 사용
}

/**
 * 공격 이펙트 설정
 * 원본: SetDisplayAttackEffect(action* act, int effectNo)
 */
void SetDisplayAttackEffect(action* act, int effectNo)
{
    if (act == NULL) return;

    act->effectNo = effectNo;
    act->animNo = effectNo;
    act->animFrame = 0;
    act->animCount = 0;

    BattleAnimFlag = 1;
}

/**
 * 공격 이펙트 설정 2
 * 원본: SetDisplayAttackEffect1(action* act, int effectNo)
 */
void SetDisplayAttackEffect1(action* act, int effectNo)
{
    SetDisplayAttackEffect(act, effectNo);
}

/*============================================================================
 * 이동 이펙트
 *============================================================================*/

/**
 * 이동 이펙트 표시
 * 원본: Display_MoveEffect(action* act)
 */
void Display_MoveEffect(action* act)
{
    if (act == NULL) return;

    // 이동 중 이펙트 표시
}

/**
 * 이동 이펙트 설정
 * 원본: Set_MoveEffect(action* act, int effectNo)
 */
void Set_MoveEffect(action* act, int effectNo)
{
    if (act == NULL) return;

    // 이동 이펙트 번호 설정
}

/*============================================================================
 * 데미지 표시
 *============================================================================*/

/**
 * 데미지 숫자 표시
 * 원본: showDamage_num(action* act)
 */
void showDamage_num(action* act)
{
    if (act == NULL) return;

    // 데미지 숫자가 위로 떠오르며 표시
    // act->damageNum 값을 화면에 렌더링
}

/**
 * 데미지 숫자 설정
 * 원본: set_damage_num(action* act, int damage, int type)
 */
void set_damage_num(action* act, int damage, int type)
{
    if (act == NULL) return;

    act->damageNum = damage;
    act->damageType = (FontBattleType)type;

    // 애니메이션 시작
}

/**
 * 데미지 숫자 폰트 스톡
 * 원본: stockFontNumToDamage(int x, int y, char color, fontBattleType type, char* numStr, bool flag)
 */
void stockFontNumToDamage(int x, int y, char color, FontBattleType type,
                          const char* numStr, bool flag)
{
    if (numStr == NULL) return;

    // 데미지 숫자를 렌더링 큐에 추가
}

/**
 * 데미지 폰트 너비 계산
 * 원본: getFontNumWidthToDamage(char* numStr, fontBattleType type)
 */
int getFontNumWidthToDamage(const char* numStr, FontBattleType type)
{
    if (numStr == NULL) return 0;

    // 숫자 문자열의 픽셀 너비 계산
    int width = 0;
    int len = strlen(numStr);

    // 폰트 타입에 따른 문자 너비 (대략적)
    int charWidth = 12;
    if (type == FONT_BATTLE_CRITICAL) charWidth = 16;

    width = len * charWidth;

    return width;
}

/**
 * 데미지 표시 X 좌표
 * 원본: damage_dispx()
 */
void damage_dispx(void)
{
    // 데미지 표시 X 좌표 계산
}

/**
 * 데미지 사운드 재생
 * 원본: play_damage(int type, int volume)
 */
void play_damage(int type, int volume)
{
    // 데미지 사운드 재생
    // SDL_mixer 사용
}

/*============================================================================
 * 히트 마크
 *============================================================================*/

/**
 * 히트 마크 표시
 * 원본: hit_mark(action* act)
 */
void hit_mark(action* act)
{
    if (act == NULL) return;

    // 타격 마크 표시
}

/**
 * 크리티컬 히트 마크 표시
 * 원본: hit_mark_critical(action* act)
 */
void hit_mark_critical(action* act)
{
    if (act == NULL) return;

    // 크리티컬 타격 마크 표시 (더 화려함)
}

/**
 * 히트 마크 설정
 * 원본: set_hit_mark(action* attacker, action* target)
 */
void set_hit_mark(action* attacker, action* target)
{
    if (attacker == NULL || target == NULL) return;

    // 공격자와 타겟 사이에 히트 마크 설정
}

/**
 * 주술 히트 마크 설정
 * 원본: set_jujutsu_hit_mark(action* act)
 */
void set_jujutsu_hit_mark(action* act)
{
    if (act == NULL) return;

    // 주술 히트 마크 설정
}

/*============================================================================
 * 방어 마크
 *============================================================================*/

/**
 * 방어 마크 표시
 * 원본: disp_guard_mark(action* act)
 */
void disp_guard_mark(action* act)
{
    if (act == NULL) return;

    // 방어 마크 표시
}

/**
 * 방어 마크 설정
 * 원본: set_guard_mark(action* act)
 */
void set_guard_mark(action* act)
{
    if (act == NULL) return;

    // 방어 자세 마크 설정
}

/*============================================================================
 * 마법 이펙트
 *============================================================================*/

/**
 * 마법 이펙트 표시
 * 원본: magic_effect(action* act)
 */
void magic_effect(action* act)
{
    if (act == NULL) return;

    // 마법 이펙트 애니메이션 재생
}

/**
 * 단일 주술 설정
 * 원본: set_single_jujutsu(int skillNo, action* act)
 */
void set_single_jujutsu(int skillNo, action* act)
{
    if (act == NULL) return;

    // 단일 타겟 주술 이펙트 설정
    act->effectNo = skillNo;
}

/*============================================================================
 * 무기 이펙트
 *============================================================================*/

/**
 * 부메랑 이펙트
 * 원본: boomerang(action* act)
 */
void boomerang(action* act)
{
    if (act == NULL) return;

    // 부메랑이 날아가고 돌아오는 애니메이션
}

/**
 * 레이더 이펙트
 * 원본: radar(action* act, int* x, int* y)
 */
void radar(action* act, int* x, int* y)
{
    if (act == NULL) return;

    // 레이더 이펙트
}

/**
 * 레이더 이펙트 2
 * 원본: radar2(action* act, int a, int b, int c)
 */
void radar2(action* act, int a, int b, int c)
{
    if (act == NULL) return;

    // 레이더 이펙트 변형
}

/**
 * 활 이펙트
 * 원본: bow(action* act)
 */
void bow(action* act)
{
    if (act == NULL) return;

    // 화살이 날아가는 애니메이션
}

/**
 * 스틱 활 이펙트
 * 원본: stick_bow(action* act)
 */
void stick_bow(action* act)
{
    if (act == NULL) return;

    // 지팡이 발사 이펙트
}

/**
 * 슛 이펙트
 * 원본: shoot(action* act)
 */
void shoot(action* act)
{
    if (act == NULL) return;

    // 발사 이펙트
}

/**
 * 도끼 이펙트
 * 원본: axe(action* act)
 */
void axe(action* act)
{
    if (act == NULL) return;

    // 도끼가 날아가는 애니메이션
}

/**
 * 도끼 그림자
 * 원본: axe_shadow(action* act)
 */
void axe_shadow(action* act)
{
    if (act == NULL) return;

    // 도끼 그림자 이펙트
}

/**
 * 돌 이펙트
 * 원본: stone(action* act)
 */
void stone(action* act)
{
    if (act == NULL) return;

    // 돌이 날아가는 애니메이션
}

/**
 * 돌 그림자
 * 원본: stone_shadow(action* act)
 */
void stone_shadow(action* act)
{
    if (act == NULL) return;

    // 돌 그림자
}

/**
 * 미사일 이펙트
 * 원본: missile(action* act)
 */
void missile(action* act)
{
    if (act == NULL) return;

    // 미사일 이펙트
}

/**
 * 폭죽 그림자
 * 원본: firecracker_shadow(action* act)
 */
void firecracker_shadow(action* act)
{
    if (act == NULL) return;

    // 폭죽 그림자 이펙트
}

/**
 * 파이어 헌터 스킬
 * 원본: fireHunter(action* act)
 */
void fireHunter(action* act)
{
    if (act == NULL) return;

    // 파이어 헌터 전용 스킬 이펙트
    bFireInit = true;
}

/*============================================================================
 * 상태 이펙트
 *============================================================================*/

/**
 * 기절 루프
 * 원본: piyo_loop(action* act)
 */
void piyo_loop(action* act)
{
    if (act == NULL) return;

    // 기절 상태 애니메이션 (별이 도는 이펙트)
    int idx = piyo_point % 12;
    int offset = piyo_tbl[idx];

    // 캐릭터 위에 기절 이펙트 표시
}

/**
 * 기절 루프 설정
 * 원본: set_piyo_loop(action* act)
 */
void set_piyo_loop(action* act)
{
    if (act == NULL) return;

    piyo_point = 0;
}

/**
 * 속성 반전
 * 원본: attrib_reverse(action* act)
 */
void attrib_reverse(action* act)
{
    if (act == NULL) return;

    // 속성 반전 이펙트
}

/**
 * 속성 반전 설정
 * 원본: set_attrib_reverse(action* act)
 */
void set_attrib_reverse(action* act)
{
    if (act == NULL) return;

    // 속성 반전 이펙트 설정
}

/**
 * 회복 이펙트
 * 원본: amelioration(action* act)
 */
void amelioration(action* act)
{
    if (act == NULL) return;

    // 회복 이펙트 (초록빛 상승)
}

/*============================================================================
 * 오브젝트 이펙트
 *============================================================================*/

/**
 * 오브젝트 이펙트
 * 원본: obj_effect(action* act)
 */
void obj_effect(action* act)
{
    if (act == NULL) return;

    // 오브젝트 이펙트
}

/**
 * 오브젝트 이펙트 1
 * 원본: obj_effect1(action* act)
 */
void obj_effect1(action* act)
{
    if (act == NULL) return;

    // 오브젝트 이펙트 변형
}

/**
 * 오브젝트 이펙트 설정
 * 원본: set_obj_effect(action* act, int effectNo)
 */
void set_obj_effect(action* act, int effectNo)
{
    if (act == NULL) return;

    act->effectNo = effectNo;
}

/**
 * 오브젝트 이펙트 1 설정
 * 원본: set_obj_effect1(action* act, int effectNo)
 */
void set_obj_effect1(action* act, int effectNo)
{
    set_obj_effect(act, effectNo);
}

/*============================================================================
 * 특수 이펙트
 *============================================================================*/

/**
 * 제미니 이펙트
 * 원본: gemini(action* act)
 */
void gemini(action* act)
{
    if (act == NULL) return;

    // 제미니 스킬 이펙트
}

/**
 * 카티노 이펙트
 * 원본: katino(action* act)
 */
void katino(action* act)
{
    if (act == NULL) return;

    // 카티노 스킬 이펙트 (수면)
}

/**
 * 마스터 이펙트
 * 원본: master(action* act)
 */
void master(action* act)
{
    if (act == NULL) return;

    // 마스터 스킬 이펙트
}

/**
 * 몬스터 이펙트
 * 원본: monster(action* act)
 */
void monster(action* act)
{
    if (act == NULL) return;

    // 몬스터 변신 이펙트
}

/*============================================================================
 * 텍스트 표시
 *============================================================================*/

/**
 * 속성 표시
 * 원본: disp_attrib(action* act)
 */
void disp_attrib(action* act)
{
    if (act == NULL) return;

    // 속성 아이콘 표시
}

/**
 * 한자 표시
 * 원본: disp_kanji(action* act)
 */
void disp_kanji(action* act)
{
    if (act == NULL) return;

    // 한자 이펙트 표시 (일격 등)
}

/**
 * 이름 획득
 * 원본: get_name(action* act)
 */
void get_name(action* act)
{
    if (act == NULL) return;

    // 이름 문자열 획득
}

/*============================================================================
 * 래스터 효과
 *============================================================================*/

/**
 * 래스터 위치 설정
 * 원본: set_raster_pos(action* act)
 */
void set_raster_pos(action* act)
{
    if (act == NULL) return;

    // 래스터 스크롤 위치 설정
}

/*============================================================================
 * 유틸리티
 *============================================================================*/

/**
 * BC 숫자 획득
 * 원본: get_bc_num()
 */
int get_bc_num(void)
{
    return 0;
}

/**
 * BC ASC 획득
 * 원본: get_bc_asc(action* act, int index)
 */
void get_bc_asc(action* act, int index)
{
    if (act == NULL) return;
}

/**
 * BC ASC 라이드펫 획득
 * 원본: get_bc_asc_ridepet(action* act)
 */
void get_bc_asc_ridepet(action* act)
{
    if (act == NULL) return;
}

/**
 * 커맨드 ASC 획득
 * 원본: get_command_asc()
 */
void get_command_asc(void)
{
}

/**
 * 숫자 획득
 * 원본: get_num()
 */
int get_num(void)
{
    return 0;
}

/**
 * 모든 사망 체크
 * 원본: check_all_dead()
 */
bool check_all_dead(void)
{
    // 모든 유닛 사망 체크
    return false;
}

/**
 * 런타임 마법 호출
 * 원본: RunTimeMagicToCall()
 */
void RunTimeMagicToCall(void)
{
    // 런타임 마법 이펙트 호출
}
