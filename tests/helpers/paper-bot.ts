import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { BotState, DEFAULT_RULES, RiskRules, STARTING_BANKROLL } from "@/lib/types";

export function isolatedDataDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pptl-quality-"));
  process.env.LAB_DATA_DIR = dir;
  process.env.LAB_STATE_FILE = path.join(dir, "lab-state.json");
  process.env.LAB_JOURNAL_FILE = path.join(dir, "trade-journal.jsonl");
  delete process.env.VERCEL;
  return dir;
}

export function emptyBot(id = "bot_test"): BotState {
  return {
    id,
    strategyId: "prop_47_ctrl_buy",
    status: "running",
    cash: STARTING_BANKROLL,
    equity: STARTING_BANKROLL,
    startingBankroll: STARTING_BANKROLL,
    realizedPnl: 0,
    unrealizedPnl: 0,
    feesPaid: 0,
    maxEquity: STARTING_BANKROLL,
    maxDrawdown: 0,
    tradeCount: 0,
    winCount: 0,
    runningSince: new Date().toISOString(),
    stoppedAt: null,
    lastTickAt: null,
    lastError: null,
    positions: [],
    fills: [],
    watchedWallets: [],
    copyCursorMs: 0,
  };
}

export function rules(overrides: Partial<RiskRules> = {}): RiskRules {
  return { ...DEFAULT_RULES, ...overrides };
}
