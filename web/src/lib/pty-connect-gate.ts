export interface PtyConnectGateInput {
  /** The chat tab has been shown at least once (sticky). */
  hasActivated: boolean;
  /** ProfileProvider has settled the management-profile scope. */
  profileReady: boolean;
  /** `?resume=` as currently in the URL, if any. */
  resumeParam: string | null;
  /** The resume id whose latest-descendant lookup has completed. */
  resolvedResume: string | null;
}

/**
 * Whether ChatPage may open `/api/pty` now.
 *
 * Every PTY connect spawns a TUI process on the server that outlives the
 * socket by 30 min, so connecting before the identity inputs settle costs
 * real processes: on a cold load the profile scope flips once the provider
 * hears back from the API, and `?resume=` can be rewritten to a newer
 * descendant session. Each flip rebuilt the terminal — three TUIs per page
 * load. Wait for both instead.
 */
export function shouldOpenPty({
  hasActivated,
  profileReady,
  resumeParam,
  resolvedResume,
}: PtyConnectGateInput): boolean {
  if (!hasActivated || !profileReady) return false;
  return resumeParam === null || resolvedResume === resumeParam;
}
