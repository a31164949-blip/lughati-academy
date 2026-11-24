from pathlib import Path

root = Path(__file__).resolve().parents[1]
journey_path = root / "app/journey/page.tsx"
teacher_path = root / "app/teacher/page.tsx"
journey = journey_path.read_text()
teacher = teacher_path.read_text()

original = '''          const bankMilestones = [50, 150, 300, 500, 750, 1000];
          const nextGoal =
            bankMilestones.find((goal) => goal > points) ??
            Math.ceil((points + 1) / 500) * 500;
          const goalProgress = Math.min(
            100,
            Math.max(0, (points / Math.max(1, nextGoal)) * 100)
          );'''
replacement = '''          const semesterGrandPrizeGoal = 1200;
          const nextGoal = semesterGrandPrizeGoal;
          const goalProgress = Math.min(
            100,
            Math.max(0, (points / semesterGrandPrizeGoal) * 100)
          );'''
if original in journey:
    if journey.count(original) != 1:
        raise SystemExit("UNEXPECTED_BANK_GOAL_DUPLICATE")
    journey = journey.replace(original, replacement)
elif "const semesterGrandPrizeGoal = 1200;" not in journey:
    raise SystemExit("BANK_GOAL_ANCHOR_MISSING")

if "AchievementGrandPrizeImage" not in journey:
    insertion = 'import AchievementGrandPrizeImage from "../components/AchievementGrandPrizeImage";\n'
    if journey.count('import Link from "next/link";') != 1:
        raise SystemExit("JOURNEY_IMPORT_ANCHOR_MISSING")
    journey = journey.replace('import Link from "next/link";', 'import Link from "next/link";\n' + insertion.rstrip(), 1)

old_title = '<span>⭐ الهدف القادم</span>'
if old_title in journey:
    journey = journey.replace(old_title, '<span>🏁 الهدف النهائي للفصل الدراسي الأول</span>', 1)
elif '<span>🏁 الهدف النهائي للفصل الدراسي الأول</span>' not in journey:
    raise SystemExit("GOAL_LABEL_MISSING")

# Replace ONLY the bank prize area. Do not alter points, history, weekly bonuses or City.
prize_anchor = '              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "8px" }}>'
if journey.count(prize_anchor) != 1:
    raise SystemExit("BANK_PRIZE_INSERT_ANCHOR_MISSING")
if '<AchievementGrandPrizeImage />' not in journey:
    prize = '''              <div style={{ margin: "10px 0", padding: "12px", borderRadius: "16px", background: "#ffffff", border: "1px solid #c9e7e0", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <AchievementGrandPrizeImage />
                <div style={{ flex: "1 1 200px", color: "#155e43" }}>
                  <strong style={{ display: "block", fontSize: "15px" }}>🎁 الجائزة الكبرى: سيارة زرقاء بالريموت</strong>
                  <span style={{ display: "block", marginTop: "3px", fontSize: "12px" }}>اجمع 1200 نقطة حتى نهاية الفصل الدراسي الأول لتبلغ هدف الجائزة الكبرى. تسليم الجائزة بعد التحقق من الرصيد واعتماد المعلم.</span>
                  <span style={{ display: "block", marginTop: "5px", fontSize: "12px", fontWeight: 900 }}>تبقّى لك {Math.max(0, semesterGrandPrizeGoal - points)} نقطة</span>
                </div>
              </div>

'''
    journey = journey.replace(prize_anchor, prize + prize_anchor, 1)

card = '''  { title: "🏎️ بنك الإنجاز والجائزة الكبرى", description: "اعتماد صورة السيارة الزرقاء المعروضة للطلاب عند هدف 1200 نقطة، دون تغيير أرصدتهم.", href: "/teacher/achievement-prize" },
'''
teacher_anchor = 'const sections = [\n'
if teacher.count(teacher_anchor) != 1:
    raise SystemExit("TEACHER_SECTIONS_MISSING")
if 'href: "/teacher/achievement-prize"' not in teacher:
    teacher = teacher.replace(teacher_anchor, teacher_anchor + card, 1)

for token in ('semesterGrandPrizeGoal = 1200', 'AchievementGrandPrizeImage', 'تبقّى لك {Math.max(0, semesterGrandPrizeGoal - points)}'):
    if token not in journey:
        raise SystemExit("BANK_INVARIANT_FAILED: " + token)
if 'href: "/teacher/achievement-prize"' not in teacher:
    raise SystemExit("TEACHER_CARD_INVARIANT_FAILED")

journey_path.write_text(journey)
teacher_path.write_text(teacher)
print("BANK_GOAL_1200=PASS")
print("BANK_PRIZE_IMAGE_COMPONENT=PASS")
print("TEACHER_PRIZE_CARD=PASS")
print("STUDENT_POINTS_UNCHANGED=YES")
