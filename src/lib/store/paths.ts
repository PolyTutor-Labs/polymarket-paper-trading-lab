import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const REPO_MARKERS = ["package.json", "next.config.ts"] as const;

function moduleDir(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

function walkForRepoRoot(start: string): string | null {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (
      REPO_MARKERS.every((marker) => fs.existsSync(path.join(dir, marker)))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function findRepoRoot(start = process.cwd()): string {
  return (
    walkForRepoRoot(start) ??
    walkForRepoRoot(moduleDir()) ??
    path.resolve(process.cwd())
  );
}

function resolveUserPath(value: string, root: string): string {
  const trimmed = value.trim();
  if (!trimmed) return root;
  return path.isAbsolute(trimmed)
    ? path.normalize(trimmed)
    : path.resolve(root, trimmed);
}

/** Repository root (package.json + next.config.ts), not a developer home path. */
export function getRepoRoot(): string {
  return findRepoRoot();
}

/** Local JSON/journal directory. Override with LAB_DATA_DIR (absolute or repo-relative). */
export function getDataDir(): string {
  const root = getRepoRoot();
  const fromEnv = process.env.LAB_DATA_DIR;
  if (fromEnv && fromEnv.trim()) return resolveUserPath(fromEnv, root);
  return path.join(root, "data");
}

/**
 * Writable lab-state.json path.
 * On Vercel the serverless FS is ephemeral, so default to the OS temp dir.
 */
export function getStateFilePath(): string {
  const fromEnv = process.env.LAB_STATE_FILE;
  if (fromEnv && fromEnv.trim()) {
    return resolveUserPath(fromEnv, getRepoRoot());
  }
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "lab-state.json");
  }
  return path.join(getDataDir(), "lab-state.json");
}

/** Committed snapshot under ./data used to seed first boot on Vercel. */
export function getCommittedStateFilePath(): string {
  return path.join(getRepoRoot(), "data", "lab-state.json");
}

export function getJournalFilePath(): string {
  const fromEnv = process.env.LAB_JOURNAL_FILE;
  if (fromEnv && fromEnv.trim()) {
    return resolveUserPath(fromEnv, getRepoRoot());
  }
  return path.join(getDataDir(), "trade-journal.jsonl");
}
