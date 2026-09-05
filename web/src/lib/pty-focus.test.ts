import { describe, expect, it } from "vitest";

import { isTerminalFocusReport } from "./pty-focus";

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
