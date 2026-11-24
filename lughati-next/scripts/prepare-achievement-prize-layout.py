from pathlib import Path

root = Path(__file__).resolve().parents[1]
page_path = root / "app/journey/page.tsx"
page = page_path.read_text(encoding="utf-8")

bank_start = page.find('aria-label="بنك إنجازي"')
if bank_start < 0 or page.count('aria-label="بنك إنجازي"') != 1:
    raise SystemExit("BANK_SECTION_MISSING_OR_DUPLICATE")
if 'const semesterGrandPrizeGoal = 1200;' not in page:
    raise SystemExit("EXPECTED_GOAL_1200_MISSING")
if page.count('<AchievementGrandPrizeImage />') != 1:
    raise SystemExit("EXPECTED_PRIZE_IMAGE_MISSING")

start_marker = '              <div style={{ margin: "10px 0", padding: "12px", borderRadius: "16px", background: "#ffffff", border: "1px solid #c9e7e0", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>'
end_marker = '              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "8px" }}>'
start = page.find(start_marker, bank_start)
end = page.find(end_marker, bank_start)
if start < 0 or end < start or page.count(start_marker) != 1:
    raise SystemExit("UNEXPECTED_OLD_PRIZE_LAYOUT")
old = page[start:end]
for required in ('<AchievementGrandPrizeImage />', 'semesterGrandPrizeGoal - points', 'الجائزة الكبرى'):
    if required not in old:
        raise SystemExit("PRIZE_REGION_INVARIANT_MISSING: " + required)

new = '''              {/* الجائزة الكبرى — تخطيط متجاوب مشابه للتصميم المعتمد، دون أي تغيير في النقاط */}
              <div
                style={{
                  margin: "14px 0",
                  padding: "clamp(12px,2vw,18px)",
                  borderRadius: "25px",
                  background: "linear-gradient(135deg,#f5fdf7 0%,#ffffff 55%,#effaf3 100%)",
                  border: "2px solid #86c69b",
                  boxShadow: "0 8px 20px rgba(21,100,76,.08)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
                  alignItems: "stretch",
                  gap: "clamp(12px,2vw,22px)",
                  direction: "rtl",
                }}
              >
                <div style={{ minWidth: 0, width: "100%", minHeight: "220px" }}>
                  <AchievementGrandPrizeImage />
                </div>
                <div style={{
                  minWidth: 0, display: "flex", flexDirection: "column", alignItems: "stretch",
                  justifyContent: "center", textAlign: "center", gap: "14px",
                  padding: "clamp(2px,1.5vw,12px)", color: "#155e43",
                }}>
                  <strong style={{
                    display: "block", fontSize: "clamp(16px,2.2vw,23px)",
                    lineHeight: 1.6, borderRadius: "999px",
                    padding: "10px 14px", color: "#ffffff",
                    background: "linear-gradient(135deg,#0f6c43,#238b58)",
                    boxShadow: "0 5px 12px rgba(15,108,67,.16)",
                  }}>
                    🎁 الجائزة الكبرى: سيارة زرقاء بالريموت
                  </strong>
                  <p style={{
                    margin: 0, lineHeight: 1.9, color: "#355348",
                    fontSize: "clamp(13px,1.6vw,17px)", fontWeight: 700,
                  }}>
                    اجمع 1200 نقطة حتى نهاية الفصل الدراسي الأول لتبلغ هدف الجائزة الكبرى.
                    تُسلَّم الجائزة بعد التحقق من الرصيد واعتماد المعلم.
                  </p>
                  <div style={{ height: "1px", background: "#b7d7bd", margin: "2px 0" }} />
                  <div style={{
                    background: "linear-gradient(90deg,#fff9d9,#e5f7e8)",
                    border: "1px solid #b6d493", borderRadius: "999px",
                    padding: "11px 15px", fontSize: "clamp(16px,2vw,21px)",
                    fontWeight: 950, color: "#176c46", lineHeight: 1.5,
                  }}>
                    🎯 {points >= semesterGrandPrizeGoal
                      ? "أكملت هدف 1200 نقطة! بانتظار اعتماد المعلم."
                      : <>تبقّى لك <strong style={{ fontSize: "1.2em" }}>{Math.max(0, semesterGrandPrizeGoal - points)}</strong> نقطة</>}
                  </div>
                </div>
              </div>

'''
page = page[:start] + new + page[end:]

if 'semesterGrandPrizeGoal = 1200' not in page or page.count('<AchievementGrandPrizeImage />') != 1:
    raise SystemExit("FINAL_INVARIANT_FAILURE")
page_path.write_text(page, encoding="utf-8")
print("PRIZE_LAYOUT_TWO_COLUMNS=PASS")
print("PRIZE_IMAGE_CENTERED=PASS")
print("BANK_GOAL_1200=PRESERVED")
print("STUDENT_POINTS_UNCHANGED=YES")
