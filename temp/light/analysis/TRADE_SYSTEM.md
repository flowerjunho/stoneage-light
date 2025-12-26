# Trade & Shop System Analysis

## Overview

Salight contains a comprehensive trading system including:
- **NPC Shop** - Buy/sell items from NPCs
- **Street Vendor** - Player-to-player trading stalls
- **Direct Trade** - Player-to-player trading
- **Skill Shop** - Purchase skills
- **Pool Shop** - Special item pools

---

## Trade System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TRADE SYSTEM                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  NPC Shop   │  │Street Vendor│  │ Direct Trade│         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │shopWindow1-8│  │VendorWndfunc│  │ TradeBuffer │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ Skill Shop  │  │  Pool Shop  │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## NPC Shop System

### Shop Window Functions
| Function | Address | Description |
|----------|---------|-------------|
| `ShopWN()` | 0x4971f4 | Main shop window |
| `initShopWN(char*)` | 0x484d48 | Initialize shop |
| `getShopApp()` | 0x3d31e4 | Get shop app |
| `shopWindow1()` | 0x49e2cc | Shop window 1 |
| `shopWindow2()` | 0x49eca8 | Shop window 2 |
| `shopWindow3()` | 0x4a1510 | Shop window 3 |
| `shopWindow4()` | 0x4a10dc | Shop window 4 |
| `shopWindow5()` | 0x4a2068 | Shop window 5 |
| `shopWindow6()` | 0x4a24b4 | Shop window 6 |
| `shopWindow7()` | 0x4a2854 | Shop window 7 |
| `shopWindow8()` | 0x4a456c | Shop window 8 |
| `shopWindow10()` | 0x4a3b50 | Shop window 10 |
| `queryShopProc()` | 0x4a9318 | Query shop |
| `getShopBuyIndex()` | 0x4a9dc0 | Get buy index |

### Shop Variables
| Variable | Address | Description |
|----------|---------|-------------|
| `ShopFlag` | 0xe945050 | Shop active flag |
| `NpcShopType` | 0xeb3a6c0 | NPC shop type |
| `shopStaus` | 0xeb6b33c | Shop status |
| `shopUrl` | 0xeb6b340 | Shop URL |
| `nowShopTime` | 0xeb6b338 | Current shop time |
| `startShopTime` | 0xeb6b334 | Shop start time |
| `selShopItemNo` | 0xeb517b0 | Selected item |
| `shopWindowMode` | 0xeb492fe | Window mode |

---

## Street Vendor System (노점상)

### Vendor Functions
| Function | Address | Description |
|----------|---------|-------------|
| `StreetVendorWndfunc(bool, char*)` | 0x46511c | Vendor window |
| `StreetVendorBuyWndfunc(char*)` | 0x465f34 | Buy from vendor |
| `StreetVendorManagementProc()` | 0x4653e8 | Manage vendor |
| `initStreetVendorManagement(char*)` | 0x4651b8 | Init management |
| `initLookVendor()` | 0x465120 | Init look vendor |
| `getLookVendor(int)` | 0x465174 | Get vendor |
| `changeLookVendor(int, bool)` | 0x465154 | Change vendor |
| `insertLookVendor(int)` | 0x465164 | Insert vendor |
| `selectStreetVendorSkinProc()` | 0x49c93c | Select skin |
| `initSelectStreetVendorSkin(char*)` | 0x484fc0 | Init skin select |

### Vendor Variables
| Variable | Address | Description |
|----------|---------|-------------|
| `LookVendorFlag` | 0xe954b9c | Look vendor flag |
| `ShowVendorItem` | 0xe94e888 | Show vendor items |
| `VendorManagementFlag` | 0xe954058 | Management flag |
| `VendorManagementItem` | 0xe95405c | Management item |
| `pActStreetVendorWnd` | 0xe94ddb0 | Vendor window actor |
| `pActStreetVendorBuyWnd` | 0xe94ddb8 | Buy window actor |
| `sStreetVendorBtn` | 0xe94ddc0 | Vendor button |
| `sStreetVendorBuyBtn` | 0xe94ddc2 | Buy button |
| `streenVendorSkin` | 0xeb88478 | Vendor skin |
| `nowLookVendorObj` | 0x803ce8 | Current vendor obj |

### Vendor Protocol
```c
// Send vendor data
// Address: 0x41143c
void lssproto_STREET_VENDOR_send(int, char*);

// Receive vendor data
// Address: 0x40e3d8
void lssproto_STREET_VENDOR_recv(int, char*);
```

---

## Direct Trade System (개인 거래)

### Trade Functions
| Function | Address | Description |
|----------|---------|-------------|
| `tradeInit()` | 0x4cfd04 | Initialize trade |
| `setCharTrade(action*, int)` | 0x45797c | Set char trade |
| `delCharTrade(action*)` | 0x4579b0 | Delete char trade |

### Trade Variables
| Variable | Address | Description |
|----------|---------|-------------|
| `Tradeflag` | 0xebebde8 | Trade active |
| `TradeBtnflag` | 0xebebde9 | Trade button |
| `TradeBuffer` | 0xebebca0 | Trade data buffer |
| `TradeTalkWnd` | 0xebebeb8 | Trade talk window |
| `MainTradeWndflag` | 0x80701f | Main trade window |
| `SecondTradeWnd` | 0xebebeb0 | Second trade window |
| `SecondTradeWndflag` | 0xebebeac | Second trade flag |
| `tradeStatus` | 0xecdf4d2 | Trade status |
| `mytradelist` | 0x807020 | My trade list |
| `opptradelist` | 0x8070ec | Opponent trade list |
| `g_bTradesystemOpen` | 0xebdfe28 | Trade system open |

---

## Skill Shop System

### Skill Shop Functions
| Function | Address | Description |
|----------|---------|-------------|
| `skillShopWindow1()` | 0x4a4cac | Skill shop 1 |
| `skillShopWindow2()` | 0x4a5844 | Skill shop 2 |
| `skillShopWindow3()` | 0x4a5ea4 | Skill shop 3 |
| `skillShopWindow4()` | 0x4a638c | Skill shop 4 |
| `initSkillShopWindow1()` | 0x4a4c9c | Init skill shop 1 |
| `initSkillShopWindow2()` | 0x4a5834 | Init skill shop 2 |
| `initSkillShopWindow3()` | 0x4a5e94 | Init skill shop 3 |
| `initSkillShopWindow4()` | 0x4a637c | Init skill shop 4 |

### Skill Shop Variables
| Variable | Address | Description |
|----------|---------|-------------|
| `skillShopIndex` | 0x805c8c | Skill shop index |
| `selShopSkillNo` | 0xeb5f9d6 | Selected skill |
| `selShopSkillPetNo` | 0xeb5f9d8 | Selected pet |
| `selShopSkillSlotNo` | 0xeb5f9da | Selected slot |
| `skillShopWindowProcNo` | 0xeb5f9d4 | Window proc |

---

## Pool Shop System

### Pool Shop Functions
| Function | Address | Description |
|----------|---------|-------------|
| `poolShopWindow1()` | 0x4a6878 | Pool shop 1 |
| `poolShopWindow2()` | 0x4a6e78 | Pool shop 2 |
| `poolShopWindow3()` | 0x4a7dbc | Pool shop 3 |
| `poolShopWindow4()` | 0x4a8214 | Pool shop 4 |
| `initPoolShopWindow1()` | 0x4a6868 | Init pool shop 1 |
| `initPoolShopWindow2()` | 0x4a6e68 | Init pool shop 2 |
| `initPoolShopWindow3()` | 0x4a7dac | Init pool shop 3 |
| `initPoolShopWindow4()` | 0x4a8204 | Init pool shop 4 |

---

## Sell System

### Sell Functions
| Function | Address | Description |
|----------|---------|-------------|
| `SellPriceWndfunc(bool*)` | 0x464a84 | Sell price window |
| `sellShopItemCall(void*, void*)` | 0x4a4bc4 | Sell item callback |
| `GetEmptyShowSellItem(...)` | 0x464fcc | Get empty slot |

### Sell Variables
| Variable | Address | Description |
|----------|---------|-------------|
| `ShowSellItem` | 0xe94ddd0 | Show sell items |

---

## Trade Flow

### NPC Shop Flow
```
1. Player interacts with NPC
2. initShopWN() called
3. shopWindow1-8() displays items
4. Player selects item
5. queryShopProc() processes purchase
6. Item added to inventory
```

### Street Vendor Flow
```
1. Player sets up vendor: StreetVendorManagementProc()
2. Configure items: VendorManagementItem
3. Select skin: selectStreetVendorSkinProc()
4. Other players browse: StreetVendorBuyWndfunc()
5. Purchase: lssproto_STREET_VENDOR_send()
6. Complete: lssproto_STREET_VENDOR_recv()
```

### Direct Trade Flow
```
1. tradeInit() - Initialize trade
2. setCharTrade() - Set trade partner
3. Add items to TradeBuffer
4. Both confirm in TradeTalkWnd
5. Exchange items
6. delCharTrade() - Clean up
```

---

## Related Protocol

### Trade Protocol Commands
```
STREET_VENDOR|...    - Street vendor actions
```

### Buy/Sell Related
| Variable | Description |
|----------|-------------|
| `buyCrystal` | Buy crystal |
| `buyOffFlag` | Buy off flag |
| `buyVigorFlag` | Buy vigor flag |
| `buyVigorMsg` | Buy vigor message |
| `buyVigorWndFlag` | Buy vigor window |

---

## Item Storage

### Storage Variables
| Variable | Description |
|----------|-------------|
| `itemStorage` | Item storage array |
| `itemStorageNowNum` | Current storage count |
| `itemStorageTotal` | Total storage capacity |
| `itemStorageVipGold` | VIP gold storage |
| `ItemBuffer` | Item data buffer |
| `itemFlg` | Item flags |
| `itemNo` | Item number |
| `itemPages` | Item pages |
