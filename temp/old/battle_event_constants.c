#include "version.h"
#include <string.h>
#include <math.h>
#include "char.h"
#include "char_event.h"
#include "battle.h"
#include "battle_event.h"
#include "configfile.h"
#include "pet.h"
#include "log.h"
#include "lssproto_serv.h"
#include "anim_tbl.h"
#include "battle_magic.h"
#include "util.h"
#include "enemy.h"
#include "pet_skill.h"
#include "char_base.h"
#include "item_event.h"

#define DEFENSE_RATE	(0.5)
#define DAMAGE_RATE		(2.0)
#define CRITICAL_RATE	(1.0)
#define KAWASHI_MAX_RATE (75)

#define AJ_SAME	(1.0)

#define AJ_UP	(1.5)
#define AJ_DOWN	(0.6)

#define ATTR_MAX 100
#define D_ATTR (1.0/(ATTR_MAX*ATTR_MAX))

#define D_16	(1.0/16)
#define D_8		(1.0/8)

float gKawashiPara = 0.02;
float gCounterPara = 0.08;
float gCriticalPara = 0.09;

float gBattleDamageModyfy;
int   gBattleDuckModyfy;
int	 gBattleStausChange;
int	 gBattleStausTurn;
float gDuckPer;
int gCriper;

int	gBattleBadStatusTbl[BATTLE_ENTRY_MAX*2];

#ifdef _OTHER_MAGICSTAUTS
#ifdef _MAGICSTAUTS_RESIST
char MagicStatus[MAXSTATUSTYPE][36] = { "NULL","Ä§¿¹","Ìú±Ú","»ð¿¹","µç¿¹","±ù¿¹"};
int MagicTbl[] = { -1, CHAR_DEFMAGICSTATUS, CHAR_MAGICSUPERWALL, CHAR_MAGICFIRE, CHAR_MAGICTHUNDER, CHAR_MAGICICE };
#else
char MagicStatus[MAXSTATUSTYPE][36] = { "NULL","Ä§¿¹","Ìú±Ú"};
int MagicTbl[] = { -1, CHAR_DEFMAGICSTATUS, CHAR_MAGICSUPERWALL };
#endif //_MAGICSTAUTS_RESIST
#endif

char *aszStatus[] = { "È«", "¶¾", "Âé", "Ãß", "Ê¯", "×í", "ÂÒ", "Ðé", "¾ç", "ÕÏ", "Ä¬" 
#ifdef _PET_SKILL_SARS			// WON ADD ¶¾É·ÂûÑÓ
					  ,"É·"
#endif
#ifdef _PROFESSION_SKILL			// WON ADD ÈËÎïÖ°Òµ¼¼ÄÜ
					  ,"ÔÎ","²ø","ÂÞ","±¬","Íü","¼ý","¹Æ","Õë","Ìô","ÉÕ","Ëª","µç","×¨","»ð","±ù","À×","Ñ×","¶³","»÷"
#endif
};

char *aszStatusFull[] = { "È«¿ì", "¶¾", "Âé±Ô", "Ë¯Ãß", "Ê¯»¯", "¾Æ×í", "»ìÂÒ", "ÐéÈõ", "¾ç¶¾", "Ä§ÕÏ", "³ÁÄ¬" 
#ifdef _PET_SKILL_SARS			// WON ADD ¶¾É·ÂûÑÓ
					  ,"¶¾É·"
#endif
#ifdef _PROFESSION_SKILL			// WON ADD ÈËÎïÖ°Òµ¼¼ÄÜ
					  ,"ÔÎÑ£","²øÈÆ","ÌìÂÞ","±ù±¬","ÒÅÍü","±ù¼ý","ÊÈÑª¹Æ","Ò»Õë¼ûÑª","Ìô²¦","»ð¸½Ìå",
					  "±ù¸½Ìå","À×¸½Ìå","×¨×¢Õ½¶·","»ð¿¹","±ù¿¹","À×¿¹","»ð¸½","±ù¸½","À×¸½"
#endif
};

int StatusTbl[] = { -1, CHAR_WORKPOISON,	CHAR_WORKPARALYSIS,
						CHAR_WORKSLEEP,		CHAR_WORKSTONE,
						CHAR_WORKDRUNK,		CHAR_WORKCONFUSION,
						CHAR_WORKWEAKEN,	CHAR_WORKDEEPPOISON,
						CHAR_WORKBARRIER,   CHAR_WORKNOCAST
#ifdef _PET_SKILL_SARS			// WON ADD ¶¾É·ÂûÑÓ
						,CHAR_WORKSARS
#endif
#ifdef _PROFESSION_SKILL			// WON ADD ÈËÎïÖ°Òµ¼¼ÄÜ
						,CHAR_WORKDIZZY,		CHAR_WORKENTWINE
						,CHAR_WORKDRAGNET,		CHAR_WORKICECRACK
						,CHAR_WORKOBLIVION,		CHAR_WORKICEARROW
						,CHAR_WORKBLOODWORMS,	CHAR_WORKSIGN
						,CHAR_WORKINSTIGATE,	CHAR_WORK_F_ENCLOSE
						,CHAR_WORK_I_ENCLOSE,	CHAR_WORK_T_ENCLOSE
						,CHAR_WORK_FOCUS,		CHAR_WORKRESIST_F
						,CHAR_WORKRESIST_I,		CHAR_WORKRESIST_T
						,CHAR_WORK_F_ENCLOSE_2,	CHAR_WORK_I_ENCLOSE_2
						,CHAR_WORK_T_ENCLOSE_2
#endif
					};

int RegTbl[] = { -1, CHAR_WORKMODPOISON,	CHAR_WORKMODPARALYSIS,
