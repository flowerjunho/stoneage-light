# lssproto Protocol Analysis

## Overview

lssproto is the proprietary protocol used by StoneAge for client-server communication. It handles all game actions including movement, battle, items, and chat.

---

## Protocol Structure

### Message Format

```
COMMAND|arg1|arg2|arg3|...
```

- Commands are 1-3 uppercase letters
- Arguments separated by `|`
- String arguments may be URL-encoded
- Messages terminated with newline

---

## Protocol Functions

### Send Functions (Client -> Server)

| Function | Description |
|----------|-------------|
| `lssproto_B_send(int, char*)` | Battle command |
| `lssproto_M_send(int, int, int, int, int, int)` | Movement |
| `lssproto_S_send(int, char*)` | Say/Chat |
| `lssproto_L_send(int, int)` | Login |
| `lssproto_W_send(int, int, int, char*)` | Window action |
| `lssproto_C_send(int, int)` | Char action |
| `lssproto_MI_send(int, int, int)` | Move item |
| `lssproto_DI_send(int, int, int, int, int)` | Drop item |
| `lssproto_ID_send(int, int, int, int, int)` | Item do (use) |
| `lssproto_MU_send(int, int, int, int, int)` | Menu action |
| `lssproto_AB_send(int)` | Auto battle |
| `lssproto_JB_send(int, int, int)` | Join battle |
| `lssproto_LB_send(int, int, int)` | Leave battle |
| `lssproto_BU_send(int, int)` | Battle update |
| `lssproto_BM_send(int, int)` | Battle message |
| `lssproto_BATTLESKILL_send(int, int)` | Battle skill |
| `lssproto_PR_send(int, int, int, int)` | Party request |
| `lssproto_PS_send(int, int, int, int, char*)` | Party status |
| `lssproto_FS_send(int, int)` | File system |
| `lssproto_HL_send(int, int)` | Heal |
| `lssproto_KS_send(int, int)` | Kick |
| `lssproto_EN_send(int, int, int)` | Encounter |
| `lssproto_EV_send(int, int, int, int, int, int)` | Event |
| `lssproto_EO_send(int, int)` | End |
| `lssproto_DU_send(int, int, int)` | Duel |
| `lssproto_DG_send(int, int, int, int)` | Dig |
| `lssproto_DP_send(int, int, int, int)` | Deposit |
| `lssproto_DM_send(int)` | Delete message |
| `lssproto_DT_send(int, int)` | Date/Time |
| `lssproto_AC_send(int, int, int, int)` | Account |
| `lssproto_MA_send(int, int, int, int)` | Magic |
| `lssproto_PI_send(int, int, int, int)` | Pet info |
| `lssproto_KN_send(int, int, char*)` | Knock |
| `lssproto_FM_send(int, char*)` | Family |
| `lssproto_FT_send(int, char*)` | Family talk |
| `lssproto_DAB_send(int, int)` | Disable auto battle |
| `lssproto_AAB_send(int, int, int)` | Advanced auto battle |
| `lssproto_FamilyBadge_send(int)` | Family badge |
| `lssproto_reConnectBattle_send(int)` | Reconnect battle |

### Receive Functions (Server -> Client)

| Function | Description |
|----------|-------------|
| `lssproto_B_recv(int, char*)` | Battle update |
| `lssproto_I_recv(int, char*)` | Item data |
| `lssproto_M_recv(int, int, int, int, int, int, char*)` | Map/Movement |
| `lssproto_C_recv(int, char*)` | Character data |
| `lssproto_D_recv(int, int, int, int, char*)` | Dungeon/Map |
| `lssproto_R_recv(int, char*)` | Response |
| `lssproto_S_recv(int, char*)` | Say/Chat |
| `lssproto_AB_recv(int, char*)` | Auto battle |
| `lssproto_ABI_recv(int, int, char*)` | Auto battle info |
| `lssproto_BATTLESKILL_recv(int, char*)` | Battle skill |
| `lssproto_CA_recv(int, char*)` | Character attribute |
| `lssproto_CD_recv(int, char*)` | Character data |
| `lssproto_EF_recv(int, int, int, char*)` | Effect |
| `lssproto_EN_recv(int, int, int)` | Encounter |
| `lssproto_EV_recv(int, int, int)` | Event |
| `lssproto_FM_recv(int, char*)` | Family |
| `lssproto_FS_recv(int, int)` | File system |
| `lssproto_HL_recv(int, int)` | Heal |
| `lssproto_IC_recv(int, int, int)` | Item count |
| `lssproto_KS_recv(int, int, int)` | Kick |
| `lssproto_MC_recv(int, int, int, int, int, int, int, int, int, char*)` | Map change |
| `lssproto_NC_recv(int, int)` | NPC count |
| `lssproto_NU_recv(int, int)` | NPC update |
| `lssproto_PR_recv(int, int, int)` | Party request |
| `lssproto_PS_recv(int, int, int, int, int)` | Party status |
| `lssproto_RD_recv(int, char*)` | Read data |
| `lssproto_RS_recv(int, char*)` | Response status |
| `lssproto_TK_recv(int, int, char*, int, char*, int, bool)` | Talk |
| `lssproto_W_recv(int, int, int, int)` | Window |
| `lssproto_buyViror_recv(bool, char*)` | Buy |

---

## Battle Protocol Details

### B Command (Battle)

```
Client -> Server:
B|%d|%d|%s|%d|
  │  │  │  └─ Target position
  │  │  └──── Action data (skill ID, item ID, etc)
  │  └─────── Action type
  └────────── Turn number

B|G|%d        - Guard action
B|T|%d        - Turn confirmation

Server -> Client:
B|%s|         - Serialized battle state
```

### Battle State Serialization

The battle state is serialized as a complex string containing:
- All participant data (HP, MP, status)
- Current turn information
- Battle effects active
- Action results

### Action Types

```c
// Estimated action codes
enum BattleAction {
    BA_ATTACK    = 0,   // Normal attack
    BA_GUARD     = 1,   // Defend
    BA_MAGIC     = 2,   // Jujutsu/Magic
    BA_CAPTURE   = 3,   // Capture pet
    BA_ITEM      = 4,   // Use item
    BA_PET       = 5,   // Pet command
    BA_SKILL     = 6,   // Character skill
    BA_ESCAPE    = 7,   // Run away
    BA_PROFSKILL = 8,   // Profession skill
    BA_HELP      = 9,   // Request help
    BA_SWITCH    = 10,  // Switch pet
};
```

---

## Character Protocol

### C Command (Character)

```
Server -> Client:
C|%d|        - Character update
              Contains character data:
              - Name
              - Level
              - HP/MP
              - Stats
              - Equipment
```

---

## Item Protocol

### Item Commands

```
MI|%d|%d|%d              - Move item (from, to, count)
DI|%d|%d|%d|%d|%d        - Drop item
ID|%d|%d|%d|%d|%d        - Use item
```

---

## Movement Protocol

### M Command (Movement)

```
Client -> Server:
M|%d|%d|%d|%d|%d|%d|     - Move request
                          (x, y, direction, ...)

Server -> Client:
M|%d|%d|%d|%d|%d|%d|%s|  - Movement confirmation
```

---

## Chat Protocol

### S/T Commands (Say/Talk)

```
S|%d|%s|                 - Send message
T|%s|%s|C|confirm        - Talk with confirmation
T|%s|%s|P|3|%d|%s        - Party talk
```

---

## Window Protocol

### W Command (Window)

```
W|%d|%d|%d|%s|           - Window action
WN|%d|%d|%d|%d|%d|%d|%s| - Window show
```

---

## Encryption

The protocol uses multiple encryption methods:

### AES (Rijndael)
```c
void Rijndael_keySchedule(uint8_t key[4][4]);
void aes_key_setup(const uint8_t* key, uint32_t* w, int keysize);
```

### Blowfish
```c
void blowfish_key_setup(const uint8_t* key, BLOWFISH_KEY* bk, size_t len);
```

### DES
```c
void des_setkey(const char* key);
```

---

## String Encoding

### Escape Functions

```c
// Address: 0x3d86d0
char* lssproto_escapeString(char* src);

// Address: 0x3d8a20
char* lssproto_descapeString(char* src);

// URL encoding for special characters
char* URLEncode(const char* src, int srclen, char* dst, int dstlen);
```

### Base62 Conversion

```c
// Address: (various)
char* lssproto_cnv10to62(int num, char* buf, int buflen);
// Converts integers to base62 for compact transmission
```

---

## Protocol Initialization

```c
// Address: 0x40xxxx
void lssproto_InitClient(callback, int, int);
void lssproto_CleanupClient(void);
void lssproto_AllocateCommonWork(int);
```

---

## Common Work Area

```c
// Message handling
int lssproto_GetMessageInfo(int*, char*, int, int*, ...);

// String utilities
void lssproto_strcpysafe(char* dst, char* src, int len);
void lssproto_strcatsafe(char* dst, char* src, int len);
char* lssproto_mkstr_int(int val);
void lssproto_bzero(char* ptr, int len);
void lssproto_bcopy(char* src, char* dst, int len);
```

---

## Error Handling

```c
// Log battle errors
// Address: 0x3bb7c0
void LogToBattleError(char* msg, int code);
```

---

## Protocol Message Examples

### Battle Start
```
EN|mapid|x|y           -> Encounter trigger
B|battledata|          <- Battle state
```

### Battle Turn
```
B|turn|action|data|target| -> Client action
B|result|                   <- Server result
```

### Battle End
```
B|END|exp|gold|items|   <- Battle result
```

### Movement
```
M|x|y|dir|0|0|0|       -> Move request
M|x|y|dir|0|0|0|ok|    <- Confirmation
```

---

## Related Files

- `symbols/lssproto_symbols.txt` - All protocol symbols
- `protocol/protocol_formats.txt` - Format strings
- `strings/all_strings.txt` - Search for patterns
