import { describe, expect, it } from "vitest";
import { defaultState } from "@/lib/store";
import { ALL_STRATEGIES } from "@/lib/strategies/catalog";
import { DEFAULT_RULES, STARTING_BANKROLL } from "@/lib/types";

describe("default lab state", () => {
  it("seeds one stopped bot per catalog strategy with the starting bankroll", () => {
    const state = defaultState();
    expect(state.bots).toHaveLength(ALL_STRATEGIES.length);
    expect(state.rules).toEqual(DEFAULT_RULES);
    expect(new Set(state.bots.map((b) => b.strategyId)).size).toBe(
      ALL_STRATEGIES.length
    );
    for (const bot of state.bots) {
      expect(bot.status).toBe("stopped");
      expect(bot.cash).toBe(STARTING_BANKROLL);
      expect(bot.equity).toBe(STARTING_BANKROLL);
      expect(bot.startingBankroll).toBe(STARTING_BANKROLL);
      expect(bot.positions).toEqual([]);
      expect(bot.fills).toEqual([]);
    }
  });
});
