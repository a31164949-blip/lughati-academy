import type { DocumentData } from "firebase/firestore";
type PublicRow = { id: string; data: DocumentData };
const pending = new Map<string, Promise<{ documents: PublicRow[]; nextCursor: string | null }>>();
export async function readSharedContent(kind: "plan" | "latestDiary" | "diary" | "heroes" | "highlights", cursor = "") {
  const key = `${kind}:${cursor}`;
  let request = pending.get(key);
  if (!request) {
    request = (async () => {
      const response = await fetch(`/api/public-content?${new URLSearchParams({ kind, cursor })}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error("PUBLIC_CONTENT_FAILED");
      return data as { documents: PublicRow[]; nextCursor: string | null };
    })();
    pending.set(key, request);
    void request.finally(() => { if (pending.get(key) === request) pending.delete(key); }).catch(() => {});
  }
  const result = await request;
  return { ...result, docs: result.documents.map(row => ({ id: row.id, data: () => row.data })), empty: result.documents.length === 0 };
}
