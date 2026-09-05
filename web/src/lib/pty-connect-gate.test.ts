import { describe, expect, it } from "vitest";

import { shouldOpenPty } from "./pty-connect-gate";

describe("shouldOpenPty", () => {
  const base = { hasActivated: true, profileReady: true, resumeParam: null, resolvedResume: null };

  it("opens a fresh chat once activated and the profile scope is settled", () => {
    expect(shouldOpenPty(base)).toBe(true);
    expect(shouldOpenPty({ ...base, hasActivated: false })).toBe(false);
    expect(shouldOpenPty({ ...base, profileReady: false })).toBe(false);
  });

  it("holds a resume until its latest-descendant lookup has resolved for that id", () => {
    expect(shouldOpenPty({ ...base, resumeParam: "a" })).toBe(false);
    expect(shouldOpenPty({ ...base, resumeParam: "a", resolvedResume: "a" })).toBe(true);
    // URL rewritten to the descendant: the old resolution must not leak through.
    expect(shouldOpenPty({ ...base, resumeParam: "b", resolvedResume: "a" })).toBe(false);
  });
});
