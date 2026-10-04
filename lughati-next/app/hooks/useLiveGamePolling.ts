"use client";

import { useEffect, useRef } from "react";
import { startVisiblePolling } from "../lib/visiblePolling";

export function useLiveGamePolling(refresh: () => Promise<void>, enabled: boolean, roomCode?: string) {
  const latest = useRef(refresh);
  useEffect(() => { latest.current = refresh; });
  useEffect(() => {
    if (!enabled || !roomCode) return;
    return startVisiblePolling(() => latest.current(), document, {
      setTimeout: (callback, delay) => window.setTimeout(callback, delay),
      clearTimeout: (timer) => window.clearTimeout(timer),
    });
  }, [enabled, roomCode]);
}
