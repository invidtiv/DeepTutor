"use client";

import { useEffect, useState } from "react";
import { fetchAuthStatus } from "@/lib/auth";

export interface AuthStatusState {
  /** Whether auth is enabled on the backend. */
  enabled: boolean;
  /** Whether the current session is authenticated. */
  authenticated: boolean;
  /** Whether the authenticated user is an admin. */
  isAdmin: boolean;
  /** True until the first status fetch resolves. */
  loading: boolean;
}

const INITIAL: AuthStatusState = {
  enabled: false,
  authenticated: false,
  isAdmin: false,
  loading: true,
};

/**
 * Resolve auth state at runtime from the backend (`/api/v1/auth/status`).
 *
 * The frontend bundle is URL- and auth-agnostic (see web/lib/api.ts): the auth
 * toggle is a runtime setting read from `data/user/settings/auth.json`, never
 * baked into the build. Components that need to know whether auth is on — to
 * show the Sign-out / Admin affordances — use this hook instead of a build-time
 * constant, so it works identically on Docker (read-only rootfs), the PyPI
 * `deeptutor start` launcher, and source dev.
 */
export function useAuthStatus(): AuthStatusState {
  const [state, setState] = useState<AuthStatusState>(INITIAL);

  useEffect(() => {
    let alive = true;
    fetchAuthStatus().then((status) => {
      if (!alive) return;
      setState({
        enabled: Boolean(status?.enabled),
        authenticated: Boolean(status?.authenticated),
        isAdmin: status?.role === "admin",
        loading: false,
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
