import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getDataDir,
  getJournalFilePath,
  getRepoRoot,
  getStateFilePath,
} from "@/lib/store/paths";

const ORIGINAL = {
  LAB_DATA_DIR: process.env.LAB_DATA_DIR,
  LAB_STATE_FILE: process.env.LAB_STATE_FILE,
  LAB_JOURNAL_FILE: process.env.LAB_JOURNAL_FILE,
  VERCEL: process.env.VERCEL,
};

afterEach(() => {
  restore("LAB_DATA_DIR");
  restore("LAB_STATE_FILE");
  restore("LAB_JOURNAL_FILE");
  restore("VERCEL");
});

function restore(key: keyof typeof ORIGINAL) {
  const value = ORIGINAL[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("repository path resolution", () => {
  it("finds the repo root by package.json and next.config.ts", () => {
    const root = getRepoRoot();
    expect(fs.existsSync(path.join(root, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, "next.config.ts"))).toBe(true);
  });

  it("defaults data files under the repo data directory", () => {
    delete process.env.LAB_DATA_DIR;
    delete process.env.LAB_STATE_FILE;
    delete process.env.LAB_JOURNAL_FILE;
    delete process.env.VERCEL;
    const root = getRepoRoot();
    expect(getDataDir()).toBe(path.join(root, "data"));
    expect(getStateFilePath()).toBe(path.join(root, "data", "lab-state.json"));
    expect(getJournalFilePath()).toBe(
      path.join(root, "data", "trade-journal.jsonl")
    );
  });

  it("honors absolute and repo-relative LAB_* overrides", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pptl-paths-"));
    process.env.LAB_DATA_DIR = tmp;
    process.env.LAB_STATE_FILE = path.join(tmp, "custom-state.json");
    process.env.LAB_JOURNAL_FILE = "relative-journal.jsonl";
    delete process.env.VERCEL;

    expect(getDataDir()).toBe(path.normalize(tmp));
    expect(getStateFilePath()).toBe(path.join(tmp, "custom-state.json"));
    expect(getJournalFilePath()).toBe(
      path.resolve(getRepoRoot(), "relative-journal.jsonl")
    );
  });
});
