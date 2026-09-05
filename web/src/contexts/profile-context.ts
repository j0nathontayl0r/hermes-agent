import { createContext } from "react";

export interface ProfileContextValue {
  /** Profile every management surface reads/writes ("" = the dashboard
   *  process's own profile). */
  profile: string;
  /** The profile the dashboard process itself runs under. */
  currentProfile: string;
  /** Known profile names (includes "default"). */
  profiles: string[];
  setProfile: (name: string) => void;
  /** False until the provider has aligned `profile` with the sticky active
   *  profile on load (or given up). Consumers that spawn per-profile
   *  processes wait for it so they don't spawn once for "" and again for
   *  the settled value. */
  ready: boolean;
}

export const ProfileContext = createContext<ProfileContextValue>({
  profile: "",
  currentProfile: "default",
  profiles: [],
  setProfile: () => {},
  ready: true,
});
