import { describe, expect, it } from "vitest";
import {
  ALL_STRATEGIES,
  PROP_STRATEGIES,
  WALLET_STRATEGIES,
  getStrategy,
} from "@/lib/strategies/catalog";

describe("strategy catalog", () => {
  it("ships 50 wallet-discovery and 50 proprietary definitions", () => {
    expect(WALLET_STRATEGIES).toHaveLength(50);
    expect(PROP_STRATEGIES).toHaveLength(50);
    expect(ALL_STRATEGIES).toHaveLength(100);
  });

  it("uses unique strategy ids", () => {
    const ids = ALL_STRATEGIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tags families consistently", () => {
    expect(WALLET_STRATEGIES.every((s) => s.family === "wallet_discovery")).toBe(
      true
    );
    expect(PROP_STRATEGIES.every((s) => s.family === "proprietary")).toBe(true);
  });

  it("resolves known ids and returns undefined for unknown ids", () => {
    const first = ALL_STRATEGIES[0];
    expect(first).toBeDefined();
    expect(getStrategy(first.id)).toEqual(first);
    expect(getStrategy("does_not_exist")).toBeUndefined();
  });
});
