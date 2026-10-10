export const INACTIVITY_DAYS = 14;
export const ACCESS_MESSAGE = "أُوقفت مزايا الأكاديمية الإضافية مؤقتًا لعدم انتظام المشاركة والمتابعة المنزلية التي تساعد ابنكم على الاستفادة منها. ستستمر متابعة الطالب داخل الفصل، وتبقى الخطة والواجبات والقراءة ومواد الدعم متاحة. نرجو التواصل مع المعلم لمعالجة أسباب التعثر؛ وعند استمرار تأخر الواجبات ستتم إحالة الطالب إلى الموجّه الطلابي بالتنسيق مع الأسرة لتقديم الدعم المناسب.";
export type AccessState = { extrasSuspended: boolean; accountSuspended: boolean; automatic: boolean; until: number | null; message: string };
export function evaluateAccess(input: { now: number; enrolledAt: number | null; latestActivity: number | null; mode?: string; until?: number | null; resumedAt?: number | null }): AccessState {
  const manual = (input.mode === "extras" || input.mode === "account") && (input.until == null || input.until > input.now);
  const baseline = Math.max(input.enrolledAt ?? input.now, input.latestActivity ?? 0, input.resumedAt ?? 0);
  const automatic = !manual && input.now - baseline >= INACTIVITY_DAYS * 86400000;
  return { extrasSuspended: manual || automatic, accountSuspended: manual && input.mode === "account", automatic, until: manual ? input.until ?? null : null, message: ACCESS_MESSAGE };
}
