// Whether ChatPage may pull keyboard focus back into the xterm textarea.
//
// Only when nothing else on the page is holding focus: `document.activeElement`
// is null / <body> (first activation after mount, or a return from another OS
// app or browser tab where focus fell back to <body>), or already inside the
// terminal host. If the user had clicked into the sidebar (model picker,
// tool-call entry) we must not yank focus away from wherever they left it —
// that's a surprise and an a11y foot-gun.
export function shouldRestoreTerminalFocus(
  active: Element | null,
  host: Element | null,
): boolean {
  if (active === null || active === document.body || host === null) {
    return true;
  }
  return host.contains(active);
}

// xterm.js emits these single-chunk reports on textarea focus/blur once the
// PTY child enables DECSET 1004 focus reporting (hermes-ink does, on entry
// and after every editor round-trip). ChatPage swallows them — see the
// forwardPtyData comment there.
// eslint-disable-next-line no-control-regex -- intentional ESC byte in xterm focus report parser
const FOCUS_REPORT_RE = /^\x1b\[[IO]$/;

export function isTerminalFocusReport(data: string): boolean {
  return FOCUS_REPORT_RE.test(data);
}
