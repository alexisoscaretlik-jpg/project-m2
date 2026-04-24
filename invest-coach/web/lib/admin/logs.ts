// Tail the last N bytes of each service's log file.

import { existsSync, readFileSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECTS = homedir() + "/Projects";

export const LOG_FILES = [
  { label: "trader — stderr",    path: `${PROJECTS}/trading-agent-v2/logs/stderr.log` },
  { label: "trader — stdout",    path: `${PROJECTS}/trading-agent-v2/logs/stdout.log` },
  { label: "nightly analyst",    path: `${PROJECTS}/trading-agent-v2/logs/learn.log` },
  { label: "kevin watcher",      path: `${PROJECTS}/trading-agent-v2/logs/kevin-watcher.log` },
  { label: "m2 — stdout",        path: `${PROJECTS}/project-m2/invest-coach/web/logs/stdout.log` },
  { label: "m2 — stderr",        path: `${PROJECTS}/project-m2/invest-coach/web/logs/stderr.log` },
  { label: "tweet fetch",        path: `${PROJECTS}/project-m2/invest-coach/web/logs/fetch-tweets.log` },
  { label: "digest trigger",     path: `${PROJECTS}/project-m2/invest-coach/web/logs/digest-trigger.log` },
];

export type LogTail = {
  label: string;
  path: string;
  exists: boolean;
  bytes: number;
  lastLines: string[];
  mtime: string | null;
};

function tailLines(path: string, maxLines = 15, maxBytes = 32 * 1024): string[] {
  try {
    const stat = statSync(path);
    const size = stat.size;
    if (size === 0) return [];
    const start = Math.max(0, size - maxBytes);
    const len = size - start;

    const fd = openSync(path, "r");
    const buf = Buffer.alloc(len);
    readSync(fd, buf, 0, len, start);
    closeSync(fd);

    const text = buf.toString("utf8");
    // Drop a possibly partial first line if we started mid-stream.
    const lines = text.split("\n");
    const usable = start === 0 ? lines : lines.slice(1);
    return usable.filter((l) => l.length > 0).slice(-maxLines);
  } catch {
    return [];
  }
}

export function readLogs(): LogTail[] {
  return LOG_FILES.map(({ label, path }) => {
    if (!existsSync(path)) {
      return { label, path, exists: false, bytes: 0, lastLines: [], mtime: null };
    }
    try {
      const s = statSync(path);
      return {
        label,
        path,
        exists: true,
        bytes: s.size,
        lastLines: tailLines(path),
        mtime: s.mtime.toISOString(),
      };
    } catch {
      return { label, path, exists: false, bytes: 0, lastLines: [], mtime: null };
    }
  });
}
