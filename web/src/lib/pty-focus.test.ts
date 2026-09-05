// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { isTerminalFocusReport, shouldRestoreTerminalFocus } from "./pty-focus";

describe("shouldRestoreTerminalFocus", () => {
  const body = document.body;
  const host = document.createElement("div");
  const textarea = document.createElement("textarea");
  const sidebarInput = document.createElement("input");
  host.appendChild(textarea);
  body.appendChild(host);
  body.appendChild(sidebarInput);

  it("restores when nothing holds focus (OS app-switch drops focus onto <body>)", () => {
    expect(shouldRestoreTerminalFocus(null, host)).toBe(true);
    expect(shouldRestoreTerminalFocus(body, host)).toBe(true);
  });

  it("restores when the terminal itself already had focus", () => {
    expect(shouldRestoreTerminalFocus(textarea, host)).toBe(true);
  });

  it("does not steal focus from another control on the page", () => {
    expect(shouldRestoreTerminalFocus(sidebarInput, host)).toBe(false);
  });

  it("restores when the terminal host is not mounted yet", () => {
    expect(shouldRestoreTerminalFocus(sidebarInput, null)).toBe(true);
  });
});

describe("isTerminalFocusReport", () => {
  it("matches xterm's DECSET 1004 focus-in and focus-out reports", () => {
    expect(isTerminalFocusReport("\x1b[I")).toBe(true);
    expect(isTerminalFocusReport("\x1b[O")).toBe(true);
  });

  it("leaves typed input and other CSI sequences alone", () => {
    expect(isTerminalFocusReport("I")).toBe(false);
    expect(isTerminalFocusReport("\x1b[A")).toBe(false); // cursor up
    expect(isTerminalFocusReport("\x1b[<0;10;5M")).toBe(false); // SGR mouse
    expect(isTerminalFocusReport("hi\x1b[I")).toBe(false); // not a lone report
    expect(isTerminalFocusReport("")).toBe(false);
  });
});
