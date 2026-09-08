"use client";

import { useEffect, useState } from "react";

type Rules = {
  maxUsdPerTrade: number;
  maxPctBankroll: number;
  skipPriceAbove: number;
  skipPriceBelow: number;
  slippageBps: number;
  defaultTakerFeeRate: number;
  chargeTakerFees: boolean;
  promotionDays: number;
  minTradesForPromotion: number;
  maxDrawdownPctForPromotion: number;
};

const numberFields: Array<{ key: keyof Rules; label: string; step?: number }> = [
  { key: "maxUsdPerTrade", label: "Max USD per trade" },
  { key: "maxPctBankroll", label: "Max % of bankroll" },
  { key: "skipPriceAbove", label: "Skip price above", step: 0.01 },
  { key: "skipPriceBelow", label: "Skip price below", step: 0.01 },
  { key: "slippageBps", label: "Slippage (bps)" },
  { key: "defaultTakerFeeRate", label: "Default taker fee rate", step: 0.01 },
  { key: "promotionDays", label: "Promotion days" },
  { key: "minTradesForPromotion", label: "Min trades for promotion" },
  { key: "maxDrawdownPctForPromotion", label: "Max drawdown % for promotion" },
];

export default function RulesPage() {
  const [rules, setRules] = useState<Rules | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then(setRules)
      .catch(console.error);
  }, []);

  async function save() {
    if (!rules) return;
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rules),
    });
    setRules(await res.json());
    setMsg("Rules saved");
  }

  if (!rules) return <p className="text-[var(--muted)]">Loading rules…</p>;

  return (
    <div className="space-y-4 max-w-2xl">
      <section className="panel p-4">
        <h2 className="text-2xl font-semibold">Risk, fees & promotion</h2>
        <p className="text-sm text-[var(--muted)]">
          Paper fills use Polymarket taker fee formula{" "}
          <span className="font-mono">C × rate × p × (1−p)</span>. Crypto 0.07,
          sports/econ 0.05, politics/finance/tech 0.04, geopolitics 0. Default
          rate applies when category is unknown. Makers are free on Polymarket;
          our bots assume taker fills.
        </p>
      </section>
      <section className="panel p-4 space-y-3">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm">Charge taker fees</span>
          <input
            type="checkbox"
            checked={!!rules.chargeTakerFees}
            onChange={(e) =>
              setRules({ ...rules, chargeTakerFees: e.target.checked })
            }
          />
        </label>
        {numberFields.map((f) => (
          <label key={f.key} className="flex items-center justify-between gap-4">
            <span className="text-sm">{f.label}</span>
            <input
              className="btn w-32 text-right"
              type="number"
              step={f.step ?? 1}
              value={Number(rules[f.key])}
              onChange={(e) =>
                setRules({ ...rules, [f.key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
        <button className="btn btn-accent" onClick={save}>
          Save rules
        </button>
        {msg ? (
          <p className="font-mono text-sm text-[var(--accent)]">{msg}</p>
        ) : null}
      </section>
    </div>
  );
}
