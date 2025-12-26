/**
 * StoneAge Battle System - Protocol Implementation
 *
 * lssproto 프로토콜 구현
 * 분석 기반: libStoneage.so
 */

#include "../../include/battle_types.h"
#include "../../include/battle_protocol.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

/*============================================================================
 * 전역 변수
 *============================================================================*/

// 프로토콜 버퍼
static char lssproto_buffer[LSSPROTO_MAX_MESSAGE_SIZE];
static char lssproto_work[LSSPROTO_MAX_MESSAGE_SIZE];

// 메시지 ID
static int lssproto_messageId = 0;

// 쓰기 함수 포인터
static int (*lssproto_writeFunc)(int, char*, int) = NULL;

// 로그 파일명
char lssproto_readlogfilename[256] = "";
char lssproto_writelogfilename[256] = "";

// 문자열 래퍼
char lssproto_stringwrapper[1024];

// lssproto 구조체
typedef struct {
    int     fd;                 // 파일 디스크립터
    char*   buffer;             // 버퍼
    int     bufferSize;         // 버퍼 크기
    int     readPos;            // 읽기 위치
    int     writePos;           // 쓰기 위치
} lssproto_t;

static lssproto_t lssproto;

/*============================================================================
 * 초기화/정리
 *============================================================================*/

/**
 * 프로토콜 초기화
 * 원본: lssproto_InitClient(int (*writeFunc)(int, char*, int), int bufSize, int option)
 */
int lssproto_InitClient(int (*writeFunc)(int, char*, int), int bufSize, int option)
{
    lssproto_writeFunc = writeFunc;
    lssproto_messageId = 0;

    memset(&lssproto, 0, sizeof(lssproto_t));
    lssproto.bufferSize = bufSize;
    lssproto.buffer = (char*)malloc(bufSize);

    if (lssproto.buffer == NULL)
        return -1;

    memset(lssproto.buffer, 0, bufSize);
    return 0;
}

/**
 * 프로토콜 정리
 * 원본: lssproto_CleanupClient()
 */
void lssproto_CleanupClient(void)
{
    if (lssproto.buffer)
    {
        free(lssproto.buffer);
        lssproto.buffer = NULL;
    }
    lssproto_writeFunc = NULL;
}

/**
 * 공용 작업 공간 할당
 * 원본: lssproto_AllocateCommonWork(int size)
 */
int lssproto_AllocateCommonWork(int size)
{
    return 0;
}

/*============================================================================
 * 배틀 프로토콜 - 송신
 *============================================================================*/

/**
 * 배틀 명령 전송
 * 원본: lssproto_B_send(int cmdType, const char* cmdStr)
 *
 * 패킷 형식: B|cmdType|cmdStr
 */
int lssproto_B_send(int cmdType, const char* cmdStr)
{
    if (cmdStr == NULL) return -1;

    char packet[256];
    snprintf(packet, sizeof(packet), "B|%d|%s", cmdType, cmdStr);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 전투 시작 요청
 * 원본: lssproto_EN_send(int flag, int enemyId, int option)
 *
 * 패킷 형식: EN|flag|enemyId|option
 */
int lssproto_EN_send(int flag, int enemyId, int option)
{
    char packet[64];
    snprintf(packet, sizeof(packet), "EN|%d|%d|%d", flag, enemyId, option);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 전투 옵션 설정
 * 원본: lssproto_EO_send(int flag, int option)
 */
int lssproto_EO_send(int flag, int option)
{
    char packet[64];
    snprintf(packet, sizeof(packet), "EO|%d|%d", flag, option);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 도망 플래그 설정
 * 원본: lssproto_FS_send(int flag, int option)
 */
int lssproto_FS_send(int flag, int option)
{
    char packet[64];
    snprintf(packet, sizeof(packet), "FS|%d|%d", flag, option);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 배틀 스킬 정보 요청
 * 원본: lssproto_BATTLESKILL_send(int skillNo, int option)
 */
int lssproto_BATTLESKILL_send(int skillNo, int option)
{
    char packet[64];
    snprintf(packet, sizeof(packet), "BATTLESKILL|%d|%d", skillNo, option);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 재접속 시 배틀 복구
 * 원본: lssproto_reConnectBattle_send(int flag)
 */
int lssproto_reConnectBattle_send(int flag)
{
    char packet[64];
    snprintf(packet, sizeof(packet), "RECONBATTLE|%d", flag);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 적 On/Off 설정
 * 원본: lssproto_Enemyonoff_send(int flag)
 */
int lssproto_Enemyonoff_send(int flag)
{
    char packet[64];
    snprintf(packet, sizeof(packet), "ENEMYONOFF|%d", flag);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 전투 이벤트 전송
 * 원본: lssproto_EV_send(int a, int b, int c, int d, int e, int f)
 */
int lssproto_EV_send(int a, int b, int c, int d, int e, int f)
{
    char packet[128];
    snprintf(packet, sizeof(packet), "EV|%d|%d|%d|%d|%d|%d", a, b, c, d, e, f);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 듀얼 요청
 * 원본: lssproto_DU_send(int flag, int targetId, int option)
 */
int lssproto_DU_send(int flag, int targetId, int option)
{
    char packet[64];
    snprintf(packet, sizeof(packet), "DU|%d|%d|%d", flag, targetId, option);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/**
 * 펫 상태 변경 요청
 * 원본: lssproto_PETST_send(int petNo, int state, int option)
 */
int lssproto_PETST_send(int petNo, int state, int option)
{
    char packet[64];
    snprintf(packet, sizeof(packet), "PETST|%d|%d|%d", petNo, state, option);

    return lssproto_Send(0, packet, strlen(packet), 0);
}

/*============================================================================
 * 배틀 프로토콜 - 수신
 *============================================================================*/

/**
 * 배틀 상태 수신 핸들러
 * 원본: lssproto_B_recv(int flag, const char* statusStr)
 *
 * 상태 문자열 파싱하여 배틀 상태 업데이트
 */
void lssproto_B_recv(int flag, const char* statusStr)
{
    if (statusStr == NULL) return;

    extern BattleStatus* getBattleStatus(void);
    BattleStatus* status = getBattleStatus();
    if (status == NULL) return;

    // 상태 문자열 파싱
    // 형식: "슬롯|이름|HP|MAXHP|MP|MAXMP|상태|..."

    char buffer[4096];
    strncpy(buffer, statusStr, sizeof(buffer) - 1);

    char* token = strtok(buffer, "|");
    int index = 0;

    while (token != NULL && index < MAX_BATTLE_UNITS)
    {
        // 각 유닛 정보 파싱
        // 실제 구현은 더 복잡함
        token = strtok(NULL, "|");
        index++;
    }

    // 턴 수신 플래그 설정
    extern int32_t BattleTurnReceiveFlag;
    BattleTurnReceiveFlag = 1;
}

/**
 * 전투 진입 알림
 * 원본: lssproto_EN_recv(int flag, int mapNo, int option)
 */
void lssproto_EN_recv(int flag, int mapNo, int option)
{
    extern int32_t BattleMapNo;
    extern void InitBattleMenu(void);
    extern int ReadBattleMap(int mapNo);

    // 배틀 초기화
    InitBattleMenu();

    // 배틀맵 로드
    BattleMapNo = mapNo;
    ReadBattleMap(mapNo);

    // 배틀 상태 변경
    extern BattleStatus* getBattleStatus(void);
    BattleStatus* status = getBattleStatus();
    if (status)
    {
        status->battleMapNo = mapNo;
        status->state = BATTLE_STATE_INIT;
    }
}

/**
 * 전투 결과 수신
 * 원본: lssproto_RS_recv(int flag, const char* resultStr)
 */
void lssproto_RS_recv(int flag, const char* resultStr)
{
    if (resultStr == NULL) return;

    extern int32_t BattleResultWndFlag;
    extern char battleResultMsg[];

    // 결과 문자열 파싱
    strncpy(battleResultMsg, resultStr, BATTLE_MSG_BUFFER_SIZE - 1);
    BattleResultWndFlag = 1;

    // 배틀 상태 변경
    extern BattleStatus* getBattleStatus(void);
    BattleStatus* status = getBattleStatus();
    if (status)
    {
        status->state = BATTLE_STATE_RESULT;
    }
}

/**
 * 이벤트 수신
 * 원본: lssproto_EV_recv(int a, int b, int c)
 */
void lssproto_EV_recv(int a, int b, int c)
{
    // 이벤트 처리
}

/**
 * 도망 결과 수신
 * 원본: lssproto_FS_recv(int result, int option)
 */
void lssproto_FS_recv(int result, int option)
{
    extern int32_t BattleEscFlag;
    extern BattleStatus* getBattleStatus(void);

    if (result == 1)
    {
        // 도망 성공
        BattleEscFlag = 1;

        BattleStatus* status = getBattleStatus();
        if (status)
        {
            status->result = BATTLE_RESULT_ESCAPE;
            status->state = BATTLE_STATE_END;
        }
    }
    // result == 0 이면 도망 실패
}

/**
 * 배틀 스킬 정보 수신
 * 원본: lssproto_BATTLESKILL_recv(int skillNo, const char* skillData)
 */
void lssproto_BATTLESKILL_recv(int skillNo, const char* skillData)
{
    if (skillData == NULL) return;

    // 스킬 정보 파싱 및 저장
}

/**
 * 펫 상태 변경 수신
 * 원본: lssproto_PETST_recv(int petNo, int state, int option)
 */
void lssproto_PETST_recv(int petNo, int state, int option)
{
    extern int32_t BattlePetReceiveFlag;
    extern int32_t BattlePetReceivePetNo;

    BattlePetReceiveFlag = 1;
    BattlePetReceivePetNo = petNo;
}

/**
 * 킬 스킬 수신
 * 원본: lssproto_KS_recv(int a, int b, int c)
 */
void lssproto_KS_recv(int a, int b, int c)
{
    // 스킬 결과 처리
}

/**
 * 이펙트 수신
 * 원본: lssproto_EF_recv(int a, int b, int c, const char* effectData)
 */
void lssproto_EF_recv(int a, int b, int c, const char* effectData)
{
    if (effectData == NULL) return;

    // 이펙트 표시
}

/**
 * 사운드 이펙트 수신
 * 원본: lssproto_SE_recv(int a, int b, int c, int d, int e)
 */
void lssproto_SE_recv(int a, int b, int c, int d, int e)
{
    // 사운드 재생
}

/*============================================================================
 * 기본 송수신
 *============================================================================*/

/**
 * 패킷 전송
 * 원본: lssproto_Send(int fd, char* data, int size, int option)
 */
int lssproto_Send(int fd, char* data, int size, int option)
{
    if (data == NULL || size <= 0) return -1;

    if (lssproto_writeFunc)
    {
        return lssproto_writeFunc(fd, data, size);
    }

    return -1;
}

/**
 * 기본 쓰기 래퍼
 * 원본: lssproto_default_write_wrap(int fd, char* data, int size)
 */
int lssproto_default_write_wrap(int fd, char* data, int size)
{
    // 기본 쓰기 구현
    // 실제로는 소켓 write
    return size;
}

/*============================================================================
 * 메시지 관리
 *============================================================================*/

/**
 * 메시지 정보 획득
 * 원본: lssproto_GetMessageInfo(int* type, char* msg, int msgSize, int* param)
 */
int lssproto_GetMessageInfo(int* type, char* msg, int msgSize, int* param)
{
    return 0;
}

/**
 * 새 메시지 ID 획득
 * 원본: lssproto_GetNewMessageID()
 */
int lssproto_GetNewMessageID(void)
{
    return ++lssproto_messageId;
}

/**
 * 헤더 생성
 * 원본: lssproto_CreateHeader(char* buffer, char* type)
 */
int lssproto_CreateHeader(char* buffer, char* type)
{
    if (buffer == NULL || type == NULL) return -1;

    sprintf(buffer, "%s|", type);
    return strlen(buffer);
}

/**
 * 헤더 생성 (ID 포함)
 * 원본: lssproto_CreateHeaderID(char* buffer, long id, char* type)
 */
int lssproto_CreateHeaderID(char* buffer, long id, char* type)
{
    if (buffer == NULL || type == NULL) return -1;

    sprintf(buffer, "%ld|%s|", id, type);
    return strlen(buffer);
}

/*============================================================================
 * 문자열 인코딩/디코딩
 *============================================================================*/

/**
 * 문자열 이스케이프
 * 원본: lssproto_escapeString(char* str)
 */
char* lssproto_escapeString(char* str)
{
    if (str == NULL) return NULL;

    static char escaped[2048];
    int j = 0;

    for (int i = 0; str[i] && j < sizeof(escaped) - 2; i++)
    {
        if (str[i] == '|' || str[i] == '\\')
        {
            escaped[j++] = '\\';
        }
        escaped[j++] = str[i];
    }
    escaped[j] = '\0';

    return escaped;
}

/**
 * 문자열 언이스케이프
 * 원본: lssproto_descapeString(char* str)
 */
char* lssproto_descapeString(char* str)
{
    if (str == NULL) return NULL;

    static char unescaped[2048];
    int j = 0;

    for (int i = 0; str[i] && j < sizeof(unescaped) - 1; i++)
    {
        if (str[i] == '\\' && str[i+1])
        {
            i++;
        }
        unescaped[j++] = str[i];
    }
    unescaped[j] = '\0';

    return unescaped;
}

/**
 * 정수를 문자열로 변환
 * 원본: lssproto_mkstr_int(int val)
 */
char* lssproto_mkstr_int(int val)
{
    static char buf[32];
    sprintf(buf, "%d", val);
    return buf;
}

/**
 * 문자열을 정수로 변환
 * 원본: lssproto_demkstr_int(char* str)
 */
int lssproto_demkstr_int(char* str)
{
    if (str == NULL) return 0;
    return atoi(str);
}

/**
 * 10진수를 62진수로 변환
 * 원본: lssproto_cnv10to62(int val, char* buf, int bufSize)
 *
 * 62진수: 0-9, a-z, A-Z
 */
int lssproto_cnv10to62(int val, char* buf, int bufSize)
{
    if (buf == NULL || bufSize <= 0) return -1;

    static const char digits[] =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    char temp[32];
    int i = 0;
    int negative = 0;

    if (val < 0)
    {
        negative = 1;
        val = -val;
    }

    do
    {
        temp[i++] = digits[val % 62];
        val /= 62;
    } while (val > 0 && i < sizeof(temp) - 1);

    if (negative && i < sizeof(temp) - 1)
    {
        temp[i++] = '-';
    }

    // 역순으로 복사
    int j = 0;
    while (i > 0 && j < bufSize - 1)
    {
        buf[j++] = temp[--i];
    }
    buf[j] = '\0';

    return j;
}

/**
 * 62진수를 10진수로 변환
 * 원본: lssproto_a62toi(char* str)
 */
int lssproto_a62toi(char* str)
{
    if (str == NULL) return 0;

    int result = 0;
    int negative = 0;
    int i = 0;

    if (str[0] == '-')
    {
        negative = 1;
        i = 1;
    }

    for (; str[i]; i++)
    {
        int digit;
        char c = str[i];

        if (c >= '0' && c <= '9')
            digit = c - '0';
        else if (c >= 'a' && c <= 'z')
            digit = c - 'a' + 10;
        else if (c >= 'A' && c <= 'Z')
            digit = c - 'A' + 36;
        else
            break;

        result = result * 62 + digit;
    }

    return negative ? -result : result;
}

/**
 * 문자열 분리
 * 원본: lssproto_splitString(char* str)
 */
char* lssproto_splitString(char* str)
{
    if (str == NULL) return NULL;

    static char* next = NULL;

    if (str != NULL)
    {
        next = str;
    }

    if (next == NULL || *next == '\0')
        return NULL;

    char* start = next;

    while (*next && *next != '|')
    {
        if (*next == '\\' && *(next + 1))
        {
            next++;
        }
        next++;
    }

    if (*next == '|')
    {
        *next = '\0';
        next++;
    }

    return start;
}

/**
 * 라인 소비
 * 원본: lssproto_consumeLine(char* str, int size)
 */
int lssproto_consumeLine(char* str, int size)
{
    if (str == NULL) return 0;

    int consumed = 0;
    while (consumed < size && str[consumed] && str[consumed] != '\n')
    {
        consumed++;
    }

    if (consumed < size && str[consumed] == '\n')
        consumed++;

    return consumed;
}

/**
 * 라인 복사
 * 원본: lssproto_copyLine(char* dest, char* src, int size)
 */
int lssproto_copyLine(char* dest, char* src, int size)
{
    if (dest == NULL || src == NULL) return 0;

    int copied = 0;
    while (copied < size - 1 && src[copied] && src[copied] != '\n')
    {
        dest[copied] = src[copied];
        copied++;
    }
    dest[copied] = '\0';

    return copied;
}

/*============================================================================
 * 안전한 문자열 함수
 *============================================================================*/

int lssproto_strcpysafe(char* dest, char* src, int size)
{
    if (dest == NULL || src == NULL) return 0;

    int i;
    for (i = 0; i < size - 1 && src[i]; i++)
    {
        dest[i] = src[i];
    }
    dest[i] = '\0';

    return i;
}

int lssproto_strcatsafe(char* dest, char* src, int size)
{
    if (dest == NULL || src == NULL) return 0;

    int len = strlen(dest);
    return lssproto_strcpysafe(dest + len, src, size - len);
}

void lssproto_bzero(char* buf, int size)
{
    if (buf) memset(buf, 0, size);
}

void lssproto_bcopy(char* src, char* dest, int size)
{
    if (src && dest) memcpy(dest, src, size);
}

/**
 * 문자열 래핑
 * 원본: lssproto_wrapStringAddr(char* str, int size, char* out)
 */
int lssproto_wrapStringAddr(char* str, int size, char* out)
{
    if (str == NULL || out == NULL) return -1;

    return lssproto_strcpysafe(out, str, size);
}

/**
 * Long to ASCII
 * 원본: lssproto_Ltoa(long val)
 */
char* lssproto_Ltoa(long val)
{
    static char buf[32];
    sprintf(buf, "%ld", val);
    return buf;
}

/**
 * Unsigned Long to ASCII
 * 원본: lssproto_Ultoa(unsigned long val)
 */
char* lssproto_Ultoa(unsigned long val)
{
    static char buf[32];
    sprintf(buf, "%lu", val);
    return buf;
}
