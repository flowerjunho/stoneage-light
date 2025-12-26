# Game Functions Reference

## Core Game Functions

### Map Functions
| Function | Address | Description |
|----------|---------|-------------|
| `setMap(int, int, int)` | - | Set map |
| `createMap(int, int, int)` | - | Create map |
| `writeMap(...)` | - | Write map data |
| `checkHitMap(int, int)` | - | Check map collision |
| `ReadBattleMap(int)` | 0x446008 | Load battle map |

### Character Functions
| Function | Address | Description |
|----------|---------|-------------|
| `setCharBattle(action*, int, short, short)` | 0x4578f0 | Set char battle |
| `delCharBattle(action*)` | 0x457944 | Delete char battle |
| `setCharUseMagic(action*)` | - | Set magic use |
| `delCharUseMagic(action*)` | - | Delete magic use |

### Animation Functions
| Function | Address | Description |
|----------|---------|-------------|
| `AnimDisp(action*)` | - | Display animation |
| `InitBattleAnimFlag()` | 0x446e0c | Init anim flag |
| `CheckBattleAnimFlag()` | 0x446c84 | Check anim flag |
| `SpecAnim(int)` | - | Special animation |
| `ReleaseSpecAnim()` | - | Release special |

### Pet Functions
| Function | Address | Description |
|----------|---------|-------------|
| `noBattlePet()` | 0x4f399c | No battle pet |
| `CheckPetSkill(int)` | - | Check pet skill |
| `initPetSkillWindowType1(char*)` | - | Pet skill window |
| `PetSkillShowType1()` | - | Show pet skill |

### Skill Functions
| Function | Address | Description |
|----------|---------|-------------|
| `SortSkill()` | - | Sort skills |
| `skillShopWindow1()` | - | Skill shop 1 |
| `skillShopWindow2()` | - | Skill shop 2 |
| `skillShopWindow3()` | - | Skill shop 3 |
| `skillShopWindow4()` | - | Skill shop 4 |
| `getProfessionSkillType(int)` | - | Get profession |

### UI Functions
| Function | Address | Description |
|----------|---------|-------------|
| `StockFontBuffer(...)` | - | Render text |
| `PutWinText(...)` | - | Window text |
| `MakeHitBox()` | - | Create hit box |
| `stockFontNumToDamage(...)` | 0x470d60 | Damage text |

### Script Functions
| Function | Address | Description |
|----------|---------|-------------|
| `ScriptFunc_AutoBattle(...)` | 0x3d8e78 | Auto battle |
| `ScriptFunc_EnemyBattle(...)` | 0x3d8e24 | Enemy battle |
| `ScriptFunc_Map(...)` | - | Map script |
| `ScriptFunc_WarpMap(...)` | - | Warp script |
| `ScriptFunc_SetStartMap(...)` | - | Start map |
| `ScriptFunc_petSkillState(...)` | - | Pet skill |

### Network Functions
| Function | Address | Description |
|----------|---------|-------------|
| `connectServer()` | - | Connect |
| `disconnectServer()` | - | Disconnect |
| `battleSend(char*)` | 0x3d46ac | Battle send |
| `setBattleInfo(char*)` | 0x3d3c10 | Set info |

---

## Script Func Table

```c
// Script function prototypes
typedef int (*ScriptFunc)(int argc, ScriptArgument* args);

// Known script functions
ScriptFunc_AutoBattle
ScriptFunc_EnemyBattle
ScriptFunc_Map
ScriptFunc_WarpMap
ScriptFunc_SetStartMap
ScriptFunc_ShowGuideBoxFromBattle
ScriptFunc_petSkillState
```

---

## Action Structure

```c
typedef struct action {
    int type;           // Action type
    int x, y;           // Position
    int dir;            // Direction
    int anim_no;        // Animation number
    int anim_frame;     // Current frame
    // ... more fields
} action;
```

---

## Global Variables

### Game State
| Variable | Description |
|----------|-------------|
| `GameState` | Current game state |
| `GameRulesFlag` | Game rules flag |
| `GameRulesStr` | Game rules string |
| `clientLoginStatus` | Login status |
| `loginFlag` | Login flag |
| `loginToken` | Login token |
| `loginDp` | Login DP |

### Server
| Variable | Description |
|----------|-------------|
| `serverFunc` | Server function |
| `serverTime` | Server time |
| `reconnectFlag` | Reconnect flag |
| `disconnectServerFlag` | Disconnect flag |

### Map
| Variable | Description |
|----------|-------------|
| `BattleMapNo` | Battle map number |
| `BattleMapFile` | Battle map file |
| `RandBattleBg` | Random battle BG |

### Auto Battle
| Variable | Description |
|----------|-------------|
| `autoBattleCount` | Auto battle count |
| `reBattleTime` | Re-battle time |
