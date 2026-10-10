// Scoreboard subscriptions have no work to do while their page is hidden.
export function startVisibleSubscription(subscribe: () => () => void, visibility: Pick<Document, "hidden" | "addEventListener" | "removeEventListener">) {
  let unsubscribe: (() => void) | undefined;
  const update = () => {
    if (visibility.hidden) { unsubscribe?.(); unsubscribe = undefined; }
    else if (!unsubscribe) unsubscribe = subscribe();
  };
  visibility.addEventListener("visibilitychange", update);
  update();
  return () => { visibility.removeEventListener("visibilitychange", update); unsubscribe?.(); unsubscribe = undefined; };
}
