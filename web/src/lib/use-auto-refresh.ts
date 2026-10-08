"use client";

import * as React from "react";

const INTERVAL_MS = 30_000;

// Re-runs `load` when the user comes back to the tab and periodically while it
// is visible, so changes made by roommates show up without a manual reload.
// Real push (sockets) isn't viable while the frontend is on Vercel.
export function useAutoRefresh(load: () => unknown) {
  const loadRef = React.useRef(load);
  React.useEffect(() => {
    loadRef.current = load;
  }, [load]);

  React.useEffect(() => {
    const run = () => {
      if (document.visibilityState === "visible") loadRef.current();
    };
    const timer = window.setInterval(run, INTERVAL_MS);
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);
}
