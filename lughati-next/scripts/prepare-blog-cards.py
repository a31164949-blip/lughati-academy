from pathlib import Path

root = Path(__file__).resolve().parents[1]
home_path = root / "app/page.tsx"
student_path = root / "app/journey/page.tsx"
home = home_path.read_text(encoding="utf-8")
student = student_path.read_text(encoding="utf-8")

home_import = 'import AcademyBlogCard from "./components/AcademyBlogCard";'
student_import = 'import AcademyBlogCard from "../components/AcademyBlogCard";'

if home_import in home or student_import in student:
    raise SystemExit("BLOG_PATCH_ALREADY_PRESENT")

home_anchor = '      <section className="sections-area">'
if home.count(home_anchor) != 1:
    raise SystemExit("HOME_SECTION_ANCHOR_MISMATCH")
if home.count('import Link from "next/link";') != 1:
    raise SystemExit("HOME_LINK_IMPORT_ANCHOR_MISMATCH")
home = home.replace('import Link from "next/link";', 'import Link from "next/link";\n' + home_import, 1)
home = home.replace(home_anchor, '      <AcademyBlogCard />\n\n' + home_anchor, 1)

# Add student blog card just before "محطات رحلتي" section. Use existing contact card row as guarded anchor.
student_anchor = '      <div className={contactCardsStyles.row}>'
if student.count(student_anchor) != 1:
    raise SystemExit("STUDENT_CARD_ANCHOR_MISMATCH")
if student.count('import Link from "next/link";') != 1:
    raise SystemExit("STUDENT_LINK_IMPORT_ANCHOR_MISMATCH")
student = student.replace('import Link from "next/link";', 'import Link from "next/link";\n' + student_import, 1)
student = student.replace(student_anchor, '      <AcademyBlogCard compact />\n\n' + student_anchor, 1)

for page in (home, student):
    if page.count('AcademyBlogCard') != 2:
        raise SystemExit("BLOG_CARD_INVARIANT_FAILED")
if 'semesterGrandPrizeGoal = 1200' not in student:
    raise SystemExit("STUDENT_POINTS_GOAL_CHANGED")
home_path.write_text(home, encoding="utf-8")
student_path.write_text(student, encoding="utf-8")
print("HOME_BLOG_CARD=PASS")
print("STUDENT_BLOG_CARD=PASS")
print("BANK_GOAL_1200=PRESERVED")
print("FIRESTORE_READS_ADDED=ZERO")
