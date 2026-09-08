import fs from "fs";
import path from "path";
import { PaperFill } from "../types";
import { getJournalFilePath } from "./paths";

/** Append-only durable trade log for long-run review (survives fill trim). */
export function appendTradeJournal(fill: PaperFill) {
  try {
    const journal = getJournalFilePath();
    const dir = path.dirname(journal);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(journal, `${JSON.stringify(fill)}\n`);
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
