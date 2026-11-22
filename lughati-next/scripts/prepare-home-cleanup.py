#!/usr/bin/env python3
"""Prepare a homepage + student-journey cleanup in an ISOLATED release directory.

Never touches Firestore, secrets, running services, or nginx.
Run only from the copied release root, never in /opt/lughati/lughati-next.
This intentionally patches the currently deployed files, preserving local
security fixes rather than replacing them with older GitHub copies.
"""
from pathlib import Path
import sys

root = Path.cwd().resolve()
if root.name != "lughati-next" or "lughati-release-home-cleanup" not in str(root):
    raise SystemExit("ABORT: run only inside /opt/lughati-release-home-cleanup/lughati-next")
home_path = root / "app/page.tsx"
journey_path = root / "app/journey/page.tsx"
if not home_path.is_file() or not journey_path.is_file():
    raise SystemExit("ABORT: missing homepage or student journey")
home = home_path.read_text()
journey = journey_path.read_text()

def remove_exact(s, needle, title):
    if s.count(needle) != 1:
        raise ValueError(f"{title}: expected one occurrence, found {s.count(needle)}")
    return s.replace(needle, "", 1)

def between(s, begin, end, title):
    a = s.find(begin)
    b = s.find(end, a + len(begin)) if a >= 0 else -1
    if a < 0 or b < 0 or s.count(begin) != 1:
        raise ValueError(f"{title}: anchors not unique/available")
    return s[:a] + s[b:]

def card(s, title, href, collection_header):
    collection = s.find(collection_header)
    index = s.find('href: "' + href + '"', collection)
    if collection < 0 or index < 0:
        raise ValueError(f"{title}: missing")
    start = s.rfind("  {", collection, index)
    end = s.find("  },", index)
    if start < collection or end < 0:
        raise ValueError(f"{title}: bad boundaries")
    snippet = s[start:end + 5]
    if 'title: "' + title + '"' not in snippet:
        raise ValueError(f"{title}: wrong section")
    return s[:start] + s[end + 5:]

# Homepage: remove the old display widgets, not their data or protected pages.
for title, href in (
    ("رحلة الدعم", "/support"),
    ("أبطال الأكاديمية", "/heroes"),
    ("معرض الطلاب", "/gallery"),
):
    home = card(home, title, href, "const sections:")

home = between(home, '      {/* أسبوع الوطن */}', '      <ReadingSupportRegistration />', "pulse ticker")
# Preserve class/academy stories unless explicitly requested to remove that feature.
home = home.replace('      <ReadingSupportRegistration />', '      <AcademyStories />', 1)
if home.count('<AcademyStories />') != 1:
    raise ValueError("Stories widget check failed")

home = between(home, '{(pointsChampion || weeklyEngagement.length > 0) && (', '<ExternalGradeJoinCard />', "champions and honors")
head = '{ACADEMY_FRIENDS_ACTIVE ? <AcademyContinuationCard />'
a = home.find(head)
b = home.find('      <AcademicJourney', a)
if a < 0 or b < 0:
    raise ValueError("Grade-two enrollment block missing")
end = home.rfind('</section>}', a, b)
if end < a:
    raise ValueError("Grade-two enrollment end missing")
home = home[:a] + home[end + len('</section>}'):]
for needle, title in (
    ('      <ClassDiary />', 'class diary'),
    ('      <HeartMessages />', 'cooperation messages'),
    ('      <WeeklyPicks />', 'weekly picks'),
):
    home = remove_exact(home, needle, title)
home = between(home, '      <section className="support-banner">', '      {/* الهوية الرسمية للأكاديمية */}', "support banner")

# Remove the API fetching effects for removed widgets to reduce Firebase usage.
load_start = '  /*\n  /*\n * تحميل الإعلانات.'
load_end = '  /*\n   * التاريخ.'
home = between(home, load_start, load_end, "removed homepage API fetches")
timer_start = '  useEffect(() => {\n    if (\n      !academyBoardSettings.enabled ||'
timer_end = '  return (\n    <main'
home = between(home, timer_start, timer_end, "removed board timer")
for import_line in (
    'import HeartMessages from "./components/HeartMessages";\n',
    'import AcademyContinuationCard from "./components/AcademyContinuationCard";\n',
    'import { ACADEMY_FRIENDS_ACTIVE } from "./lib/academyFriends";\n',
    'import WeeklyPicks from "./components/WeeklyPicks";\n',
    'import ClassDiary from "./components/ClassDiary";\n',
    'import ReadingSupportRegistration from "./components/ReadingSupportRegistration";\n',
):
    home = home.replace(import_line, "", 1)

# Student dashboard: remove cards only, preserve the reading, quiz, homework,
# upload, teacher-contact, points and existing authentication flows.
for title, href in (
    ("أوراق التفكير", "/thinking-worksheets"),
    ("الدروس", "/lessons"),
    ("رحلة الدعم", "/support"),
    ("لوحة الشرف", "/honor-board"),
    ("أبطال الأكاديمية", "/heroes"),
    ("معرض الطلاب", "/gallery"),
    ("نتعاون من أجل تقدّمي", "/parent/support"),
):
    journey = card(journey, title, href, "const journeyCards =")
journey = remove_exact(journey, '        <AcademyStories />', "student pulse stories")
journey = journey.replace('import AcademyStories from "../components/AcademyStories";\n', "", 1)

for required in (
    "<ExternalGradeJoinCard />", "<AcademyStories />",
    "<NationalIdentity />", "<AcademyWelcome />", "/login",
    "/parent", "/teacher-login",
):
    if required not in home:
        raise ValueError(f"Homepage element lost: {required}")
for required in (
    'href: "/homeworks"', 'href: "/reading-journey"',
    'href: "/curriculum-reading"', 'href: "/quizzes/take"',
    'href: "/quizzes"', 'href: "/student-contact"', 'href: "/upload"',
):
    if required not in journey:
        raise ValueError(f"Student element lost: {required}")
for forbidden in (
    "/api/public-announcements", "/api/public-academy-board",
    "/api/public-weekly-engagement", "<ClassDiary />",
    "<HeartMessages />", "<AcademyContinuationCard />",
    'className="academy-pulse"', 'className="academy-champions"',
):
    if forbidden in home:
        raise ValueError(f"Homepage old widget remains: {forbidden}")

# All checks completed before either write.
home_path.write_text(home)
journey_path.write_text(journey)
print("HOME_CLEANUP=PASS")
print("STUDENT_CLEANUP=PASS")
print("FIRESTORE_CHANGED=NO")
