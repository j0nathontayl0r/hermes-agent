// Per-chat snapshots of the terminal, shown while a resumed chat replays.
//
// The dashboard chat is the real TUI over a PTY, so switching chats means a
// different TUI resumes and repaints its transcript (10–20 s for a long
// session). ChatPage saves the last-seen screen of each chat as HTML (xterm's
// serialize addon) when leaving it, and paints that snapshot over the terminal
// while the next replay runs behind the wait notice. Best-effort: a missing or
// stale snapshot just falls back to the notice alone.
//
// Storage is browser localStorage (per origin, ~5 MB): a small LRU of whole
// snapshots, each capped in size, so one long chat cannot starve the rest.

export const PTY_SNAPSHOT_PREFIX = "hermes.pty.snapshot.";
const INDEX_KEY = `${PTY_SNAPSHOT_PREFIX}index`;
export const PTY_SNAPSHOT_MAX_ENTRIES = 4;
export const PTY_SNAPSHOT_MAX_CHARS = 800_000;
// Rows of scrollback to keep above the live screen — enough to fill any
// viewport, small enough to stay under the size cap for typical transcripts.
export const PTY_SNAPSHOT_SCROLLBACK_ROWS = 300;

export type SnapshotStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function ptySnapshotKey(resume: string, profile: string): string {
  return `${PTY_SNAPSHOT_PREFIX}${profile}\0${resume}`;
}

function readIndex(store: SnapshotStore): string[] {
  try {
    const raw = store.getItem(INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Reduce the serialize addon's clipboard-style document to the bare <pre>
 * so it can be dropped into a container that supplies the terminal's font,
 * and neutralise <pre>'s own margin/font so it inherits them.
 */
export interface SnapshotFont {
  family: string;
  sizePx: number;
  lineHeight: number;
}

export function normalizeSnapshotHtml(html: string, font?: SnapshotFont): string | null {
  const m = /<pre\b[^>]*>([\s\S]*?)<\/pre>/i.exec(html);
  if (!m || m[1].trim() === "") return null;
  // The font is baked in at save time (xterm's options then), so rendering
  // the snapshot later needs nothing from the live terminal.
  const fontCss = font
    ? `font-family:${font.family.replace(/["<>]/g, "")};font-size:${font.sizePx}px;line-height:${font.lineHeight}`
    : "font:inherit;line-height:inherit";
  return `<pre style="margin:0;${fontCss};white-space:pre">${m[1]}</pre>`;
}

/** Save (most-recent-last LRU); returns false when skipped or storage refused. */
export function savePtySnapshot(
  store: SnapshotStore,
  key: string,
  html: string,
  font?: SnapshotFont,
): boolean {
  const body = normalizeSnapshotHtml(html, font);
  if (!body || body.length > PTY_SNAPSHOT_MAX_CHARS) return false;
  const index = readIndex(store).filter((k) => k !== key);
  index.push(key);
  while (index.length > PTY_SNAPSHOT_MAX_ENTRIES) {
    const evicted = index.shift();
    if (evicted) {
      try {
        store.removeItem(evicted);
      } catch {
        /* ignore */
      }
    }
  }
  try {
    store.setItem(key, body);
    store.setItem(INDEX_KEY, JSON.stringify(index));
    return true;
  } catch {
    // Quota or blocked storage: drop every snapshot so the index can't
    // point at entries that were never written. ponytail: no retry loop.
    for (const k of index) {
      try {
        store.removeItem(k);
      } catch {
        /* ignore */
      }
    }
    try {
      store.removeItem(INDEX_KEY);
    } catch {
      /* ignore */
    }
    return false;
  }
}

export function loadPtySnapshot(store: SnapshotStore, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}
