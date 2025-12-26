/**
 * StoneAge Battle System - Protocol Definitions
 *
 * lssproto 프로토콜 - 서버/클라이언트 통신 정의
 * 분석 기반: libStoneage.so (SaLight_v1.1.8.apk)
 */

#ifndef BATTLE_PROTOCOL_H
#define BATTLE_PROTOCOL_H

#include "battle_types.h"

#ifdef __cplusplus
extern "C" {
#endif

/*============================================================================
 * 프로토콜 상수
 *============================================================================*/

#define LSSPROTO_MAX_MESSAGE_SIZE   8192
#define LSSPROTO_HEADER_SIZE        32

/*============================================================================
 * 프로토콜 함수 - 송신 (Client -> Server)
 *============================================================================*/

/**
 * 배틀 명령 전송
 * @param cmdType   명령 타입 (H, S, I, G, E, P, C, W, T)
 * @param cmdStr    명령 문자열 (형식: "명령타입|타겟|스킬번호")
 *
 * 예시:
 * - "H|15"     : 15번 슬롯 공격
 * - "S|12|3"   : 12번 슬롯에 3번 스킬 사용
 * - "I|0|5"    : 0번 슬롯에 5번 아이템 사용
 * - "G"        : 방어
 * - "E"        : 도망
 */
int lssproto_B_send(int cmdType, const char* cmdStr);

/**
 * 전투 시작 요청
 * @param flag      전투 플래그
 * @param enemyId   적 ID
 * @param option    옵션
 */
int lssproto_EN_send(int flag, int enemyId, int option);

/**
 * 전투 옵션 설정 (자동전투 등)
 * @param flag      플래그
 * @param option    옵션 값
 */
int lssproto_EO_send(int flag, int option);

/**
 * 도망 플래그 설정
 * @param flag      도망 플래그
 * @param option    옵션
 */
int lssproto_FS_send(int flag, int option);

/**
 * 배틀 스킬 정보 요청
 * @param skillNo   스킬 번호
 * @param option    옵션
 */
int lssproto_BATTLESKILL_send(int skillNo, int option);

/**
 * 재접속 시 배틀 복구
 * @param flag  복구 플래그
 */
int lssproto_reConnectBattle_send(int flag);

/**
 * 적 On/Off 설정 (이벤트 적 조우)
 * @param flag  플래그
 */
int lssproto_Enemyonoff_send(int flag);

/**
 * 전투 이벤트 전송
 */
int lssproto_EV_send(int a, int b, int c, int d, int e, int f);

/**
 * 듀얼 요청
 */
int lssproto_DU_send(int flag, int targetId, int option);

/**
 * 펫 상태 변경 요청
 * @param petNo     펫 번호
 * @param state     새 상태
 * @param option    옵션
 */
int lssproto_PETST_send(int petNo, int state, int option);

/*============================================================================
 * 프로토콜 함수 - 수신 (Server -> Client)
 *============================================================================*/

/**
 * 배틀 상태 수신 핸들러
 * @param flag      플래그
 * @param statusStr 상태 문자열 (모든 유닛 정보 포함)
 *
 * 상태 문자열 형식:
 * "슬롯|이름|HP|MAXHP|MP|MAXMP|상태|...|슬롯|이름|..."
 */
void lssproto_B_recv(int flag, const char* statusStr);

/**
 * 전투 진입 알림
 * @param flag      플래그
 * @param mapNo     배틀맵 번호
 * @param option    옵션
 */
void lssproto_EN_recv(int flag, int mapNo, int option);

/**
 * 전투 결과 수신
 * @param flag      플래그
 * @param resultStr 결과 문자열 (경험치, 드롭 등)
 */
void lssproto_RS_recv(int flag, const char* resultStr);

/**
 * 이벤트 수신
 */
void lssproto_EV_recv(int a, int b, int c);

/**
 * 도망 결과 수신
 */
void lssproto_FS_recv(int result, int option);

/**
 * 배틀 스킬 정보 수신
 * @param skillNo   스킬 번호
 * @param skillData 스킬 데이터 문자열
 */
void lssproto_BATTLESKILL_recv(int skillNo, const char* skillData);

/**
 * 펫 상태 변경 수신
 */
void lssproto_PETST_recv(int petNo, int state, int option);

/**
 * 킬 스킬 수신 (전투 중 스킬 결과)
 */
void lssproto_KS_recv(int a, int b, int c);

/**
 * 이펙트 수신
 */
void lssproto_EF_recv(int a, int b, int c, const char* effectData);

/**
 * 사운드 이펙트 수신
 */
void lssproto_SE_recv(int a, int b, int c, int d, int e);

/*============================================================================
 * 프로토콜 유틸리티 함수
 *============================================================================*/

/**
 * 프로토콜 초기화
 * @param writeFunc 쓰기 함수 포인터
 * @param bufSize   버퍼 크기
 * @param option    옵션
 */
int lssproto_InitClient(int (*writeFunc)(int, char*, int), int bufSize, int option);

/**
 * 프로토콜 정리
 */
void lssproto_CleanupClient(void);

/**
 * 공용 작업 공간 할당
 */
int lssproto_AllocateCommonWork(int size);

/**
 * 메시지 정보 획득
 */
int lssproto_GetMessageInfo(int* type, char* msg, int msgSize, int* param);

/**
 * 새 메시지 ID 획득
 */
int lssproto_GetNewMessageID(void);

/**
 * 헤더 생성
 */
int lssproto_CreateHeader(char* buffer, char* type);

/**
 * 헤더 생성 (ID 포함)
 */
int lssproto_CreateHeaderID(char* buffer, long id, char* type);

/*============================================================================
 * 문자열 인코딩/디코딩 함수
 *============================================================================*/

/**
 * 문자열 이스케이프
 */
char* lssproto_escapeString(char* str);

/**
 * 문자열 언이스케이프
 */
char* lssproto_descapeString(char* str);

/**
 * 정수를 문자열로 변환
 */
char* lssproto_mkstr_int(int val);

/**
 * 문자열을 정수로 변환
 */
int lssproto_demkstr_int(char* str);

/**
 * 10진수를 62진수로 변환 (압축)
 */
int lssproto_cnv10to62(int val, char* buf, int bufSize);

/**
 * 62진수를 10진수로 변환
 */
int lssproto_a62toi(char* str);

/**
 * 문자열 분리
 */
char* lssproto_splitString(char* str);

/**
 * 라인 소비
 */
int lssproto_consumeLine(char* str, int size);

/**
 * 라인 복사
 */
int lssproto_copyLine(char* dest, char* src, int size);

/*============================================================================
 * 안전한 문자열 함수
 *============================================================================*/

int lssproto_strcpysafe(char* dest, char* src, int size);
int lssproto_strcatsafe(char* dest, char* src, int size);
void lssproto_bzero(char* buf, int size);
void lssproto_bcopy(char* src, char* dest, int size);

/*============================================================================
 * 배열 인코딩/디코딩
 *============================================================================*/

char* lssproto_mkstr_int_array(int count, int* arr);
char* lssproto_mkstr_char_array(int count, char* arr);
char* lssproto_mkstr_short_array(int count, short* arr);
char* lssproto_mkstr_float_array(int count, float* arr);

int lssproto_demkstr_int_array(char** str, int* arr, int maxCount, int option);
int lssproto_demkstr_char_array(char** str, char* arr, int maxCount, int option);
int lssproto_demkstr_short_array(char** str, short* arr, int maxCount, int option);
int lssproto_demkstr_float_array(char** str, float* arr, int maxCount, int option);

#ifdef __cplusplus
}
#endif

#endif // BATTLE_PROTOCOL_H
