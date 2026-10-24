export const COUNCIL_SEEN_EVENT = 'academy-council-topic-seen';
const key = (accountId: string, topicId: string) => 'council-seen:' + accountId + ':' + topicId;
export function councilTopicSeen(accountId: string, topicId: string) {
  try { return localStorage.getItem(key(accountId, topicId)) === '1'; } catch { return false; }
}
export function markCouncilTopicSeen(accountId: string, topicId: string) {
  try { localStorage.setItem(key(accountId, topicId), '1'); } catch { /* Reading works without storage. */ }
  window.dispatchEvent(new Event(COUNCIL_SEEN_EVENT));
}
