import { auth } from "../../firebase";
export async function invalidatePublicContent() {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch("/api/teacher/public-content-cache", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("CACHE_INVALIDATION_FAILED");
  } catch (error) {
    // The publication succeeded. The five-minute TTL is the fallback if invalidation fails.
    console.warn("تعذر تحديث العرض العام فورًا؛ سيُحدّث تلقائيًا خلال خمس دقائق.", error);
  }
}
