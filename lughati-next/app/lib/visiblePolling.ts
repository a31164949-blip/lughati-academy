// Schedule after completion so slow requests cannot pile up.
export function startVisiblePolling(
  refresh: () => Promise<void>,
  visibility: Pick<Document, "hidden" | "addEventListener" | "removeEventListener">,
  clock: { setTimeout: (callback: () => void, delay: number) => number; clearTimeout: (id: number) => void },
  delay = 10000,
) {
  let active = true;
  let pending = false;
  let timer: number | undefined;
  const clear = () => { if (timer !== undefined) clock.clearTimeout(timer); timer = undefined; };
  const schedule = () => {
    clear();
    if (active && !visibility.hidden) timer = clock.setTimeout(() => { void tick(); }, delay);
  };
  async function tick() {
    if (!active || visibility.hidden || pending) return;
    pending = true;
    try { await refresh(); } finally { pending = false; schedule(); }
  }
  const onVisibility = () => {
    clear();
    if (!visibility.hidden) void tick();
  };
  visibility.addEventListener("visibilitychange", onVisibility);
  schedule();
  return () => { active = false; clear(); visibility.removeEventListener("visibilitychange", onVisibility); };
}
