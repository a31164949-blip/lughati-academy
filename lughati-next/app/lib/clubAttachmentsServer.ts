import "server-only";
import { getFirebaseAdmin } from "../../firebase-admin";
import { mediaActor } from "./r2Media";
import { verifyVideoObject } from "./r2Video";
import { MAX_CLUB_ATTACHMENTS, type ClubAttachment } from "./clubAttachments";
export async function clubAttachmentTeacher(request: Request) {
  const actor = await mediaActor(request);
  if (!actor.teacher) throw new Error("FORBIDDEN");
  return actor;
}
export async function verifyClubAttachments(uid: string, input: unknown): Promise<ClubAttachment[]> {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > MAX_CLUB_ATTACHMENTS) throw new Error("INVALID_ATTACHMENT");
  const ids = input.map(item => typeof item?.id === "string" ? item.id : "");
  if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-f0-9-]{36}$/.test(id))) throw new Error("INVALID_ATTACHMENT");
  const { adminDb } = getFirebaseAdmin();
  const result: ClubAttachment[] = [];
  for (const id of ids) {
    const ref = adminDb.collection("clubAttachmentUploads").doc(id);
    const data = await adminDb.runTransaction(async tx => {
      const data = (await tx.get(ref)).data();
      if (!data || data.uid !== uid || Number(data.attempts || 0) >= 5) throw new Error("INVALID_ATTACHMENT");
      tx.update(ref, { attempts: Number(data.attempts || 0) + 1 });
      return data;
    });
    await verifyVideoObject(data.key, data.size, data.contentType);
    result.push({ id, name: data.name, size: data.size, contentType: data.contentType });
  }
  return result;
}
