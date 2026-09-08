import { describe, expect, it } from "vitest";
import { money, pnlColor } from "@/components/SortableTable";

describe("dashboard number helpers", () => {
  it("formats finite numbers as USD", () => {
    expect(money(1234.5)).toBe("$1,234.50");
    expect(money(Number.NaN)).toBe("$0.00");
  });

  it("colors pnl by sign and treats near-zero as muted", () => {
    expect(pnlColor(1)).toBe("var(--accent)");
    expect(pnlColor(-1)).toBe("var(--danger)");
    expect(pnlColor(0)).toBe("var(--muted)");
    expect(pnlColor(0.001)).toBe("var(--muted)");
  });
});
