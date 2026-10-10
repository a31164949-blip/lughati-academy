export function normalizeResourceClassroom(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.includes("جميع") || normalized === "all") return "all";
  if (normalized.endsWith("أ")) return "أ";
  if (normalized.endsWith("ب")) return "ب";
  return normalized;
}
export function canViewFamilyResource(item: Record<string, unknown>, studentId: string, classroom: string) {
  if (item.published !== true) return false;
  if (item.audience === "student" || (typeof item.targetStudentId === "string" && item.targetStudentId)) {
    return typeof item.targetStudentId === "string" && !!item.targetStudentId && item.targetStudentId === studentId;
  }
  if (item.audience != null && item.audience !== "classroom") return false;
  const target = normalizeResourceClassroom(String(item.classroom ?? ""));
  return target === "all" || target === normalizeResourceClassroom(classroom);
}
export function resourceNotificationId(resourceId: string, studentId: string) { return `family-resource-${resourceId}-${studentId}`; }
