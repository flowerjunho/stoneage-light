import type { BotStatsDocument, UserStats } from '../types';

export function mergeStats(docs: BotStatsDocument[]): BotStatsDocument {
  const merged: BotStatsDocument = {
    totalCalls: 0,
    commands: {},
    users: {},
    keywords: {},
    hourly: {},
    guilds: {},
    categories: { pet: 0, quest: 0, item: 0, map: 0 },
    commandKeywords: {},
  };

  for (const doc of docs) {
    merged.totalCalls += doc.totalCalls || 0;

    // commands
    if (doc.commands) {
      for (const [cmd, count] of Object.entries(doc.commands)) {
        merged.commands[cmd] = (merged.commands[cmd] || 0) + count;
      }
    }

    // users
    if (doc.users) {
      for (const [uid, userData] of Object.entries(doc.users)) {
        const u = userData as UserStats;
        if (!merged.users[uid]) {
          merged.users[uid] = { username: u.username, count: 0, commands: {}, keywords: {} };
        }
        merged.users[uid].count += u.count || 0;
        merged.users[uid].username = u.username || merged.users[uid].username;

        if (u.commands) {
          for (const [cmd, cnt] of Object.entries(u.commands)) {
            merged.users[uid].commands[cmd] = (merged.users[uid].commands[cmd] || 0) + cnt;
          }
        }
        if (u.keywords) {
          for (const [kw, cnt] of Object.entries(u.keywords)) {
            merged.users[uid].keywords[kw] = (merged.users[uid].keywords[kw] || 0) + cnt;
          }
        }
      }
    }

    // keywords
    if (doc.keywords) {
      for (const [kw, count] of Object.entries(doc.keywords)) {
        merged.keywords[kw] = (merged.keywords[kw] || 0) + count;
      }
    }

    // hourly
    if (doc.hourly) {
      for (const [h, count] of Object.entries(doc.hourly)) {
        merged.hourly[h] = (merged.hourly[h] || 0) + count;
      }
    }

    // guilds
    if (doc.guilds) {
      for (const [g, count] of Object.entries(doc.guilds)) {
        merged.guilds[g] = (merged.guilds[g] || 0) + count;
      }
    }

    // categories
    if (doc.categories) {
      merged.categories.pet += doc.categories.pet || 0;
      merged.categories.quest += doc.categories.quest || 0;
      merged.categories.item += doc.categories.item || 0;
      merged.categories.map += doc.categories.map || 0;
    }

    // commandKeywords
    if (doc.commandKeywords) {
      for (const [cmd, kwMap] of Object.entries(doc.commandKeywords)) {
        if (!merged.commandKeywords[cmd]) merged.commandKeywords[cmd] = {};
        for (const [kw, cnt] of Object.entries(kwMap as Record<string, number>)) {
          merged.commandKeywords[cmd][kw] = (merged.commandKeywords[cmd][kw] || 0) + cnt;
        }
      }
    }
  }

  return merged;
}
