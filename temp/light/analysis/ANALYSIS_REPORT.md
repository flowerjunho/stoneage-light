# Salight 1.2.2 APK Analysis Report

## Basic Information

| Item | Value |
|------|-------|
| **Package Name** | `com.stoneage.kr` |
| **App Name** | StoneAge Return |
| **Version** | 1.2.2 (versionCode: 122) |
| **SDK** | Min 21 / Target 35 |
| **Size** | 42MB |
| **Build Tool** | Android Gradle 8.7.3 |

---

## Architecture

```
Salight APK
├── Java/Kotlin Layer
│   ├── com.stoneage.light - Main app code
│   ├── com.stoneage.kr - Korean resources
│   ├── com.scottyab.rootbeer - Root detection
│   ├── com.beiguard.gameshield - Anti-cheat
│   └── org.libsdl.app - SDL3 wrapper
│
├── Native Layer (lib/)
│   ├── libStoneage.so (8.1MB) - Game engine
│   ├── libSDL3.so - Graphics
│   ├── libSDL3_mixer.so - Audio
│   ├── libSDL3_image.so - Image loading
│   ├── libSDL3_ttf.so - Font rendering
│   └── libtoolChecker.so - Root check
│
└── Assets
    ├── data/font/ - Fonts
    └── data/skin/ - UI skins
```

---

## Security Features

### Root Detection
- **RootBeer Library**: Checks for root binaries
- **libtoolChecker.so**: Native root detection
- Action: Shows error and exits app

### Anti-Cheat
- **GameshieldManager**: Beiguard game protection
- Encryption: AES, Blowfish, DES

---

## Network

### Server Endpoints
| Purpose | URL |
|---------|-----|
| Update | `r2.onninegame.com/update/list4.php` |
| Update | `stone.moahmall.com/update/list4.php` |
| Game | `stone.mooncg.com` |
| Login | `tungame.com/25server/reg/` |
| Payment | `r2.onninegame.com/pay/` |
| Community | `hwansoo.net` |

---

## Battle System

### Battle Functions (101 symbols)

#### Main Processors
| Function | Address | Description |
|----------|---------|-------------|
| `BattleProc()` | 0x4528b4 | Main battle loop |
| `BattleMenuProc()` | 0x450310 | Menu handler |
| `BattleMsgProc()` | 0x501a4c | Message handler |
| `BattleTargetSelect()` | 0x44f5d8 | Target selection |

#### UI Buttons
| Function | Address | Description |
|----------|---------|-------------|
| `BattleButtonAttack()` | 0x447bdc | Attack |
| `BattleButtonGuard()` | 0x449710 | Guard |
| `BattleButtonJujutsu()` | 0x447ef4 | Magic |
| `BattleButtonCapture()` | 0x44936c | Capture |
| `BattleButtonItem()` | 0x44a424 | Item |
| `BattleButtonPet()` | 0x44bce4 | Pet |
| `BattleButtonWaza()` | 0x44ebc4 | Skill |
| `BattleButtonEscape()` | 0x44d3a4 | Escape |
| `BattleButtonPPLSKILL()` | 0x44c758 | Profession skill |
| `BattleButtonHelp()` | 0x449634 | Help request |

#### Rendering
| Function | Address | Description |
|----------|---------|-------------|
| `DrawBattleMap()` | 0x4468c0 | Map rendering |
| `ddrawBattleMap()` | 0x4b9b88 | Double buffer |
| `ReadBattleMap()` | 0x446008 | Load map data |
| `BattleNameDisp()` | 0x447994 | Name display |
| `BattleCntDownDisp()` | 0x44fdb8 | Countdown |

### Battle Variables

#### State Variables
| Variable | Address | Description |
|----------|---------|-------------|
| `BattleStatus` | 0xd7b2720 | Battle state array |
| `BattleCmd` | 0xd7ad718 | Command queue |
| `BattleCliTurnNo` | 0xd7b7754 | Client turn number |
| `BattleSvTurnNo` | 0xd7b7758 | Server turn number |
| `BattleMyNo` | 0xd7b7728 | My slot number |
| `BattleMyMp` | 0xd7b772c | My MP |

#### Flags
| Variable | Description |
|----------|-------------|
| `BattleAnimFlag` | Animation in progress |
| `BattleEscFlag` | Escape flag |
| `BattleBpFlag` | BP flag |
| `Battle1P2PFlag` | 1:1 PVP flag |
| `BattleTurnReceiveFlag` | Turn received |
| `BattleCntDownFlag` | Countdown active |

#### Selection
| Variable | Description |
|----------|-------------|
| `BattleItemNo` | Selected item |
| `BattleJujutuNo` | Selected magic |
| `BattleWazaNo` | Selected skill |
| `BattleSkill` | Battle skill data |

---

## lssproto Protocol

### Battle Protocol (Client -> Server)
| Function | Format | Description |
|----------|--------|-------------|
| `lssproto_B_send` | `B\|%s\|` | Battle command |
| `lssproto_AB_send` | - | Auto battle |
| `lssproto_BU_send` | - | Battle update |
| `lssproto_JB_send` | - | Join battle |
| `lssproto_LB_send` | - | Leave battle |
| `lssproto_BM_send` | - | Battle message |
| `lssproto_BATTLESKILL_send` | - | Battle skill |

### Battle Protocol (Server -> Client)
| Function | Description |
|----------|-------------|
| `lssproto_B_recv` | Battle state |
| `lssproto_AB_recv` | Auto battle result |
| `lssproto_BATTLESKILL_recv` | Skill result |

### Protocol Message Formats
```
B|%d|%d|%s|%d|    - Battle command (turn, action, data, target)
B|%s|             - Battle state
B|G|%d            - Guard
B|T|%d            - Turn info
```

---

## Lua Scripts

| Script | Purpose |
|--------|---------|
| `map/battlemap.lua` | Battle map definitions |
| `protocol.lua` | Protocol handling |
| `script.lua` | Game scripts |
| `login.lua` | Login logic |
| `menu.lua` | Menu system |
| `worldmap.lua` | World map |
| `warpanim.lua` | Warp animations |

---

## Battle Flow

```
1. BattleProc() start
   ↓
2. InitBattleMenu() - Initialize menu
   ↓
3. CheckBattleAnimFlag() - Check animation
   ↓
4. BattleMenuProc() - Handle user input
   │
   ├─→ BattleButtonAttack() → Select target → battleSend()
   ├─→ BattleButtonGuard()  → battleSend("B|G|%d")
   ├─→ BattleButtonJujutsu() → Select magic → target → battleSend()
   ├─→ BattleButtonItem()   → Select item → target → battleSend()
   └─→ BattleButtonEscape() → battleSend()
   ↓
5. lssproto_B_send() - Send command to server
   ↓
6. lssproto_B_recv() - Receive server response
   ↓
7. BattleMsgProc() - Process battle result
   ↓
8. AnimDisp() - Effect animation
   ↓
9. Next turn or battle end
```

---

## Damage Display

| Type | Display |
|------|---------|
| `Critical` | Critical damage |
| `Miss` | Miss |
| `NoMiss` | Always hit |
| `Non Critical` | Normal damage |
| `Guard break` | Guard break |

---

## File Structure

```
~/Downloads/light/
├── AndroidManifest.xml
├── analysis/
│   └── ANALYSIS_REPORT.md
├── assets/
│   ├── data/font/
│   └── data/skin/
├── java/
│   ├── stoneage/
│   ├── scottyab/
│   ├── beiguard/
│   └── libsdl/
├── lib/
│   ├── arm64-v8a/
│   ├── armeabi-v7a/
│   └── x86_64/
├── protocol/
│   ├── protocol_formats.txt
│   ├── lua_scripts.txt
│   └── server_urls.txt
├── strings/
│   ├── all_strings.txt
│   ├── battle_strings.txt
│   ├── battle_variables.txt
│   ├── cpp_functions.txt
│   └── game_strings.txt
└── symbols/
    ├── all_symbols.txt
    ├── battle_symbols.txt
    ├── game_symbols.txt
    └── lssproto_symbols.txt
```

---

## Analysis Date
2024-12-26
