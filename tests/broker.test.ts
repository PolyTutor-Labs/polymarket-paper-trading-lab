import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calcTakerFee, executeIntent, feeRateForTitle } from "@/lib/paper/broker";
import { emptyBot, isolatedDataDir, rules } from "./helpers/paper-bot";

describe("feeRateForTitle", () => {
  it("maps published category keywords to Polymarket taker rates", () => {
    expect(feeRateForTitle("Geopolitical war risk", 0.05)).toBe(0);
    expect(feeRateForTitle("Bitcoin up or down", 0.05)).toBe(0.07);
    expect(feeRateForTitle("NBA championship", 0.05)).toBe(0.05);
    expect(feeRateForTitle("Fed inflation print", 0.05)).toBe(0.05);
    expect(feeRateForTitle("Senate election", 0.05)).toBe(0.04);
    expect(feeRateForTitle("NASDAQ earnings", 0.05)).toBe(0.04);
    expect(feeRateForTitle("OpenAI model release", 0.05)).toBe(0.04);
    expect(feeRateForTitle("Mentions on a tweet", 0.05)).toBe(0.04);
    expect(feeRateForTitle("Hurricane temperature", 0.05)).toBe(0.05);
  });

  it("uses the caller fallback when no category matches", () => {
    expect(feeRateForTitle("obscure custom market", 0.033)).toBe(0.033);
  });
});

describe("calcTakerFee", () => {
  it("uses C × feeRate × p × (1 − p) rounded to 5 decimals", () => {
    expect(calcTakerFee(100, 0.5, 0.05)).toBe(1.25);
    expect(calcTakerFee(10, 0.2, 0.07)).toBe(0.112);
  });

  it("returns 0 for non-positive rate, shares, or dust after rounding", () => {
    expect(calcTakerFee(10, 0.5, 0)).toBe(0);
    expect(calcTakerFee(0, 0.5, 0.05)).toBe(0);
    expect(calcTakerFee(0.0001, 0.5, 0.0001)).toBe(0);
  });
});

describe("executeIntent", () => {
  beforeEach(() => {
    isolatedDataDir();
  });

  afterEach(() => {
    delete process.env.LAB_DATA_DIR;
    delete process.env.LAB_STATE_FILE;
    delete process.env.LAB_JOURNAL_FILE;
  });

  it("rejects prices outside the configured skip band", () => {
    const bot = emptyBot();
    const band = rules({ skipPriceAbove: 0.95, skipPriceBelow: 0.05 });
    expect(
      executeIntent(bot, band, {
        marketSlug: "m",
        title: "obscure custom market",
        outcome: "YES",
        side: "BUY",
        price: 0.99,
        reason: "test",
      })
    ).toBeNull();
    expect(
      executeIntent(bot, band, {
        marketSlug: "m",
        title: "obscure custom market",
        outcome: "YES",
        side: "BUY",
        price: 0.01,
        reason: "test",
      })
    ).toBeNull();
    expect(bot.tradeCount).toBe(0);
  });

  it("opens a long, deducts spend plus taker fee, and records the fill", () => {
    const bot = emptyBot();
    const fill = executeIntent(bot, rules({ chargeTakerFees: true }), {
      marketSlug: "will-x-happen",
      title: "obscure custom market",
      outcome: "YES",
      side: "BUY",
      price: 0.5,
      reason: "unit",
    });

    expect(fill).not.toBeNull();
    expect(fill?.side).toBe("BUY");
    expect(fill?.feeUsd).toBeGreaterThan(0);
    expect(bot.positions).toHaveLength(1);
    expect(bot.positions[0]?.shares).toBeGreaterThan(0);
    expect(bot.cash).toBeLessThan(bot.startingBankroll);
    expect(bot.feesPaid).toBe(fill?.feeUsd);
    expect(bot.tradeCount).toBe(1);
    expect(bot.equity).toBeCloseTo(bot.cash + bot.positions[0]!.markPrice * bot.positions[0]!.shares, 8);
  });

  it("does not sell when the bot has no matching position", () => {
    const bot = emptyBot();
    const fill = executeIntent(bot, rules(), {
      marketSlug: "missing",
      title: "obscure custom market",
      outcome: "YES",
      side: "SELL",
      price: 0.5,
      reason: "unit",
    });
    expect(fill).toBeNull();
    expect(bot.cash).toBe(bot.startingBankroll);
    expect(bot.tradeCount).toBe(0);
  });
});
