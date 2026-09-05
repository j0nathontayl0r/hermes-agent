// xterm.js emits these single-chunk reports on textarea focus/blur once the
// PTY child enables DECSET 1004 focus reporting (hermes-ink does, on entry
// and after every editor round-trip). ChatPage swallows them — see the
// forwardPtyData comment there.
// eslint-disable-next-line no-control-regex -- intentional ESC byte in xterm focus report parser
const FOCUS_REPORT_RE = /^\x1b\[[IO]$/;

export function isTerminalFocusReport(data: string): boolean {
  return FOCUS_REPORT_RE.test(data);
}
