import fs from "fs";
import { PaperFill } from "../types";
import { getDataDir, getJournalFilePath } from "./paths";

/** Append-only durable trade log for long-run review (survives fill trim). */
export function appendTradeJournal(fill: PaperFill) {
  try {
    const dataDir = getDataDir();
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.appendFileSync(getJournalFilePath(), `${JSON.stringify(fill)}\n`);
  } catch (err) {
    console.error("trade journal write failed", err);
  }
}

export function readTradeJournal(opts?: {
  botId?: string;
  limit?: number;
}): PaperFill[] {
  const journal = getJournalFilePath();
  if (!fs.existsSync(journal)) return [];
  const limit = opts?.limit ?? 500;
  const lines = fs.readFileSync(journal, "utf8").split("\n").filter(Boolean);
  const out: PaperFill[] = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i -= 1) {
    try {
      const row = JSON.parse(lines[i]) as PaperFill;
      if (opts?.botId && row.botId !== opts.botId) continue;
      out.push(row);
    } catch {
      // skip corrupt line
    }
  }
  return out;
}
