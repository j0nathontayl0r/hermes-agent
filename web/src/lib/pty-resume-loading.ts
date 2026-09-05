import type { PtyConnectionState } from "@/lib/pty-reconnect";

/**
 * Hard cap so a wedged resume (never gets PTY payload) cannot leave the
 * wait notice up forever.
 */
export const PTY_RESUME_LOADING_MAX_MS = 30000;

export const PTY_RESUME_LOADING_MESSAGE =
  "Please wait while the conversation loads…";

export interface ResumeLoadingOverlayInput {
  hasResumeTarget: boolean;
  ptyState: PtyConnectionState;
  hydrating: boolean;
}

/**
 * Show a wait notice while a resumed chat is replaying. It clears once the
 * replay has been quiet for PTY_RESUME_QUIET_MS (or at the hard cap), so
 * the terminal is revealed already scrolled to the latest output.
 *
 * Reconnect / ended / closed states keep their own overlays and must not
 * stack this one on top.
 */
export function shouldShowResumeLoadingOverlay({
  hasResumeTarget,
  ptyState,
  hydrating,
}: ResumeLoadingOverlayInput): boolean {
  if (!hasResumeTarget || !hydrating) {
    return false;
  }
  if (
    ptyState === "reconnecting" ||
    ptyState === "closed" ||
    ptyState === "ended"
  ) {
    return false;
  }
  return ptyState === "connecting" || ptyState === "open";
}

/**
 * How long the resume replay must go quiet before the wait notice clears
 * and the terminal is revealed. The TUI replays a resumed transcript from
 * the top and xterm follows it down; revealing on the first byte showed
 * that whole scroll on every chat switch. Token streams pause for less
 * than this, so a session resumed mid-turn falls back to the hard cap.
 */
// ponytail: fixed quiet gap; a replay-complete marker from the TUI would be exact
export const PTY_RESUME_QUIET_MS = 500;

/** A non-empty rendered PTY chunk counts as replay activity. */
export function isResumeReplayChunk(chunkText: string): boolean {
  return chunkText.length > 0;
}
