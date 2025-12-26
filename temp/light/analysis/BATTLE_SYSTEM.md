# Battle System Detailed Analysis

## Overview

The Salight battle system is a turn-based combat system using the lssproto protocol for client-server communication. The battle logic is primarily implemented in `libStoneage.so` native library.

---

## Battle Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BATTLE SYSTEM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    lssproto_B     ┌──────────────┐           │
│  │   CLIENT     │ ◄──────────────► │    SERVER    │           │
│  │  (Salight)   │                   │   (GMSV)     │           │
│  └──────┬───────┘                   └──────────────┘           │
│         │                                                       │
│  ┌──────▼───────┐                                              │
│  │ BattleProc() │ ← Main battle loop                           │
│  └──────┬───────┘                                              │
│         │                                                       │
│  ┌──────▼───────────────────────────────────────────┐          │
│  │              BATTLE UI BUTTONS                    │          │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │          │
│  │  │ Attack │ │ Guard  │ │ Escape │ │ Item   │    │          │
│  │  └────────┘ └────────┘ └────────┘ └────────┘    │          │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │          │
│  │  │Jujutsu │ │Capture │ │  Pet   │ │  Waza  │    │          │
│  │  └────────┘ └────────┘ └────────┘ └────────┘    │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Functions

### Main Battle Loop

```c
// Address: 0x4528b4
void BattleProc(void) {
    // Main battle processing loop
    // Called every frame during battle

    // 1. Check animation flags
    CheckBattleAnimFlag();

    // 2. Process countdown
    BattleCntDownDisp();

    // 3. Handle menu input
    BattleMenuProc();

    // 4. Process messages
    BattleMsgProc();

    // 5. Render battle map
    DrawBattleMap();
}
```

### Battle Menu Processor

```c
// Address: 0x450310
void BattleMenuProc(void) {
    // Handle battle menu interactions
    // Check which button was pressed and call appropriate handler

    if (BattleButtonAttack_pressed) {
        BattleButtonAttack();
    } else if (BattleButtonGuard_pressed) {
        BattleButtonGuard();
    }
    // ... etc
}
```

---

## Battle Buttons

### Attack (공격)
```c
// Address: 0x447bdc
void BattleButtonAttack(void) {
    // Normal attack action
    // 1. Show target selection
    // 2. Wait for target choice
    // 3. Send command via battleSend()
}
```

### Guard (방어)
```c
// Address: 0x449710
void BattleButtonGuard(void) {
    // Guard action - reduce incoming damage
    // Sends: B|G|%d
}
```

### Jujutsu (주술/정령술)
```c
// Address: 0x447ef4
void BattleButtonJujutsu(void) {
    // Magic/Spirit attack
    // 1. Show jujutsu selection menu
    // 2. Show target selection
    // 3. Send command
    // Uses BattleJujutuNo for selected spell
}
```

### Capture (포획)
```c
// Address: 0x44936c
void BattleButtonCapture(void) {
    // Attempt to capture enemy pet
    // Only works on weakened enemies
}
```

### Item (아이템)
```c
// Address: 0x44a424
void BattleButtonItem(void) {
    // Use battle item
    // Uses BattleItemNo for selected item
}
```

### Pet (펫)
```c
// Address: 0x44bce4
void BattleButtonPet(void) {
    // Pet commands
    // Control pet actions during battle
}
```

### Waza (기술)
```c
// Address: 0x44ebc4
void BattleButtonWaza(void) {
    // Character skills
    // Uses BattleWazaNo for selected skill
}
```

### Escape (도주)
```c
// Address: 0x44d3a4
void BattleButtonEscape(void) {
    // Attempt to flee from battle
    // May fail based on enemy level/type
}
```

### PPLSKILL (직업스킬)
```c
// Address: 0x44c758
void BattleButtonPPLSKILL(void) {
    // Profession-specific skills
}
```

---

## Battle State Variables

### Global Variables

```c
// Battle state array - contains all battle participants
extern char BattleStatus[0x1000];        // 0xd7b2720

// Command queue for battle actions
extern char BattleCmd[0x1000];           // 0xd7ad718
extern char BattleCmdBak[0x1000];        // 0xd7ae718

// Turn tracking
extern int BattleCliTurnNo;              // 0xd7b7754 - Client turn
extern int BattleSvTurnNo;               // 0xd7b7758 - Server turn

// My position
extern int BattleMyNo;                   // 0xd7b7728 - My slot number
extern int BattleMyMp;                   // 0xd7b772c - My MP

// Current selections
extern int BattleItemNo;                 // 0xd7b7744
extern int BattleJujutuNo;               // 0xd7b773c
extern int BattleWazaNo;                 // 0xd7b7740

// Flags
extern int BattleAnimFlag;               // 0xd7b774c - Animation playing
extern int BattleEscFlag;                // 0xd7b7730 - Escape attempt
extern int BattleCntDownFlag;            // 0xd7b776d - Countdown active
extern int Battle1P2PFlag;               // 0xd7b7d34 - PVP mode

// Map
extern int BattleMapNo;                  // 0xd7ad70c
extern char* BattleMapFile;              // 0x7ce684
```

---

## Protocol Messages

### Send Commands (Client -> Server)

```
B|%d|%d|%s|%d|    - General battle command
                    - arg1: turn number
                    - arg2: action type
                    - arg3: action data
                    - arg4: target

B|G|%d            - Guard command
                    - arg1: player position

B|T|%d            - Turn command
                    - arg1: turn number
```

### Receive Commands (Server -> Client)

```
B|%s|             - Battle state update
                    - Contains serialized battle state

AB|%s             - Auto battle result

BATTLESKILL|%s    - Battle skill result
```

### Action Type Codes (Estimated)

```c
#define ACTION_ATTACK    0   // Normal attack
#define ACTION_GUARD     1   // Guard
#define ACTION_JUJUTSU   2   // Magic
#define ACTION_CAPTURE   3   // Capture
#define ACTION_ITEM      4   // Use item
#define ACTION_PET       5   // Pet command
#define ACTION_WAZA      6   // Skill
#define ACTION_ESCAPE    7   // Escape
#define ACTION_PPLSKILL  8   // Profession skill
```

---

## Battle Position Layout

```
Enemy Side (Positions 10-19)
┌────┬────┬────┬────┬────┐
│ 14 │ 13 │ 12 │ 11 │ 10 │  Back Row
├────┼────┼────┼────┼────┤
│ 19 │ 18 │ 17 │ 16 │ 15 │  Front Row
└────┴────┴────┴────┴────┘

Player Side (Positions 0-9)
┌────┬────┬────┬────┬────┐
│  4 │  3 │  2 │  1 │  0 │  Front Row
├────┼────┼────┼────┼────┤
│  9 │  8 │  7 │  6 │  5 │  Back Row
└────┴────┴────┴────┴────┘

Positions 0-4: Player front row
Positions 5-9: Player back row (pets)
Positions 10-14: Enemy back row
Positions 15-19: Enemy front row
```

---

## Damage Calculation

### Hit Types

```c
typedef enum {
    HIT_NORMAL = 0,      // Normal hit
    HIT_CRITICAL = 1,    // Critical hit (2x damage)
    HIT_MISS = 2,        // Miss (0 damage)
    HIT_GUARD = 3,       // Guard (reduced damage)
    HIT_GUARD_BREAK = 4  // Guard break
} HitType;
```

### Damage Display

```c
// Address: 0x470d60
void stockFontNumToDamage(int x, int y, char type,
                          fontBattleType font, char* text, bool flag);

// fontBattleType determines the color/style:
// - Normal: white
// - Critical: yellow/orange
// - Miss: gray
// - Heal: green
```

---

## Animation System

### Battle Animations

```c
// Initialize animation flags
// Address: 0x446e0c
void InitBattleAnimFlag(void);

// Check if animation is playing
// Address: 0x446c84
int CheckBattleAnimFlag(void);

// Display character animation
// Address: (various)
void AnimDisp(action* act);

// Magic effect animation
// Address: (various)
void magic_effect(action* act);

// Attack effect animation
void DisplayAttackEffect(action* act);
```

### Battle Quake Effect

```c
// Address: 0x452470
void battle_quake(void) {
    // Screen shake effect during powerful attacks
}
```

---

## Lua Integration

### Battle Map Script

```lua
-- map/battlemap.lua
-- Defines battle background and layout

BattleMap = {
    id = 1,
    background = "battle_bg_001.png",
    music = "battle_01.ogg",
    positions = {
        -- player positions
        -- enemy positions
    }
}
```

### Script Functions

```c
// Address: 0x3d8e78
int ScriptFunc_AutoBattle(int argc, ScriptArgument* args);

// Address: 0x3d8e24
int ScriptFunc_EnemyBattle(int argc, ScriptArgument* args);

// Address: 0x3d7fcc
int ScriptFunc_ShowGuideBoxFromBattle(int argc, ScriptArgument* args);
```

---

## Auto Battle System

### Auto Battle Variables

```c
extern int autoBattleCount;  // 0xd7ad714 - Auto battle counter
```

### Auto Battle Flow

```
1. Player enables auto battle
2. lssproto_AB_send() called each turn
3. Server determines optimal action
4. lssproto_AB_recv() receives action
5. Execute action automatically
6. Repeat until battle ends or disabled
```

---

## Pet Battle System

### Pet Variables

```c
extern int BattlePetReceiveFlag;     // 0xebebee8
extern int BattlePetReceivePetNo;    // 0x8071c8
extern int BattlePetStMenCnt;        // 0xd7b7734
extern int battlePetButtonFlag;      // 0xd7b7774
extern int battlePetNoBak;           // 0x7e9f8c
extern int battlePetNoBak2;          // 0x7e9f90
```

### Pet Functions

```c
// Address: 0x4f399c
void noBattlePet(void);

// Pet skill window
void initPetSkillWindowType1(char* data);
void PetSkillShowType1(void);
```

---

## Battle Result

### Result Window

```c
extern int BattleResultWndFlag;      // 0xd7b775c
extern char battleResultMsg[0x1000]; // 0xfa435a0
```

### Result Types

- Victory: Player wins
- Defeat: Player loses
- Escape: Player escaped
- Capture: Pet captured
- Draw: Battle ends in draw

---

## Related Files

### Source Files
- `java/stoneage/light/RenderActivity.java` - Main activity
- `java/stoneage/light/JNILibrary.java` - JNI interface

### Native Libraries
- `lib/arm64-v8a/libStoneage.so` - Main game engine

### Symbols
- `symbols/battle_symbols.txt` - Battle function symbols
- `symbols/lssproto_symbols.txt` - Protocol symbols

### Strings
- `strings/battle_strings.txt` - Battle related strings
- `strings/battle_variables.txt` - Variable names
