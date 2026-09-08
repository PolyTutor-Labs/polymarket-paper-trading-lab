import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getRepoRoot } from "@/lib/store/paths";

describe("security quality gate", () => {
  it("runs the Task 8 secret scan and exits 0", () => {
    const script = path.join(
      getRepoRoot(),
      "scripts",
      "security",
      "check_secrets.py"
    );
    const output = execFileSync("python3", [script], {
      encoding: "utf8",
      cwd: getRepoRoot(),
    });
    expect(output).toMatch(/Secret scan:\s*PASS/i);
  });
});
