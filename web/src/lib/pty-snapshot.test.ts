import { describe, expect, it } from "vitest";

import {
  PTY_SNAPSHOT_MAX_CHARS,
  PTY_SNAPSHOT_MAX_ENTRIES,
  loadPtySnapshot,
  normalizeSnapshotHtml,
  ptySnapshotKey,
  savePtySnapshot,
} from "./pty-snapshot";

function memStore(failSet = false) {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (failSet) throw new Error("QuotaExceededError");
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
}

const DOC = (rows: string) =>
  `<html><body><!--StartFragment--><pre style="background:#000">${rows}</pre><!--EndFragment--></body></html>`;

describe("normalizeSnapshotHtml", () => {
  it("keeps only the <pre> body and makes it inherit the container font", () => {
    const out = normalizeSnapshotHtml(DOC("<div><span>hi</span></div>"));
    expect(out).toBe(
      '<pre style="margin:0;font:inherit;line-height:inherit;white-space:pre"><div><span>hi</span></div></pre>',
    );
  });

  it("bakes the terminal font in when given", () => {
    const out = normalizeSnapshotHtml(DOC("<div>x</div>"), {
      family: "'JetBrains Mono', monospace",
      sizePx: 13,
      lineHeight: 1.2,
    });
    expect(out).toContain("font-family:'JetBrains Mono', monospace;font-size:13px;line-height:1.2");
  });

  it("rejects documents without a non-empty <pre>", () => {
    expect(normalizeSnapshotHtml("<html><body></body></html>")).toBeNull();
    expect(normalizeSnapshotHtml(DOC("   "))).toBeNull();
  });
});

describe("savePtySnapshot / loadPtySnapshot", () => {
  const key = (n: number) => ptySnapshotKey(`s${n}`, "");

  it("round-trips a snapshot", () => {
    const s = memStore();
    expect(savePtySnapshot(s, key(1), DOC("<div>a</div>"))).toBe(true);
    expect(loadPtySnapshot(s, key(1))).toContain("<div>a</div>");
    expect(loadPtySnapshot(s, key(2))).toBeNull();
  });

  it("keys are per profile and per session", () => {
    expect(ptySnapshotKey("s1", "")).not.toBe(ptySnapshotKey("s1", "work"));
    expect(ptySnapshotKey("s1", "")).not.toBe(ptySnapshotKey("s2", ""));
  });

  it("evicts the least recently saved beyond the cap, re-saving refreshes recency", () => {
    const s = memStore();
    for (let i = 1; i <= PTY_SNAPSHOT_MAX_ENTRIES; i++) savePtySnapshot(s, key(i), DOC(`<div>${i}</div>`));
    savePtySnapshot(s, key(1), DOC("<div>1 again</div>")); // 1 becomes most recent
    savePtySnapshot(s, key(99), DOC("<div>99</div>")); // evicts 2, not 1
    expect(loadPtySnapshot(s, key(2))).toBeNull();
    expect(loadPtySnapshot(s, key(1))).toContain("1 again");
    expect(loadPtySnapshot(s, key(99))).not.toBeNull();
  });

  it("skips oversized snapshots and leaves the store untouched", () => {
    const s = memStore();
    expect(savePtySnapshot(s, key(1), DOC("x".repeat(PTY_SNAPSHOT_MAX_CHARS)))).toBe(false);
    expect(s.m.size).toBe(0);
  });

  it("clears its own entries when storage refuses the write", () => {
    const s = memStore(true);
    expect(savePtySnapshot(s, key(1), DOC("<div>a</div>"))).toBe(false);
    expect(s.m.size).toBe(0);
  });

  it("tolerates a store that throws on read", () => {
    const s = { getItem: () => { throw new Error("blocked"); }, setItem: () => {}, removeItem: () => {} };
    expect(loadPtySnapshot(s, key(1))).toBeNull();
  });
});
