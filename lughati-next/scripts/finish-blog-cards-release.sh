#!/usr/bin/env bash
# Finish an already-built blog card release safely. Does not rebuild or edit site content.
set -Eeuo pipefail
STAGE=/opt/lughati-release-blog-cards-fixed/lughati-next
NGINX=/etc/nginx/sites-available/lughati
BACKUP=/etc/nginx/sites-available/lughati.before-blog-cards
BASE=http://127.0.0.1:3118
DOMAIN=https://lughati-academy.duckdns.org
SWITCHED=NO
DONE=NO
rollback() {
  if [ "$SWITCHED" = YES ] && [ "$DONE" != YES ] && [ -s "$BACKUP" ]; then
    echo "=== ROLLBACK TO 3117 ==="
    cp -a "$BACKUP" "$NGINX"
    nginx -t && systemctl reload nginx
  fi
}
trap rollback EXIT
echo "=== VERIFY UNCHANGED RUNNING SITE ==="
test "$(id -u)" = 0
test -s "$STAGE/.next/BUILD_ID"
test -s "$STAGE/app/components/AcademyBlogCard.tsx"
test -s "$STAGE/app/page.tsx"
test -s "$STAGE/app/journey/page.tsx"
test "$(grep -Fc 'proxy_pass http://127.0.0.1:3117;' "$NGINX")" = 1
test ! -e "$BACKUP"
systemctl is-active --quiet lughati-prize-layout.service
systemctl is-active --quiet lughati-blog-cards.service
grep -Fq 'https://a31164949.blogspot.com/' "$STAGE/app/components/AcademyBlogCard.tsx"
grep -Fq '<AcademyBlogCard />' "$STAGE/app/page.tsx"
grep -Fq '<AcademyBlogCard compact />' "$STAGE/app/journey/page.tsx"
echo "PAGE_SOURCE_CARDS=PASS"
if ! grep -rlq 'a31164949.blogspot.com' "$STAGE/.next/static"; then
  echo "BLOG_LINK_IN_CLIENT_BUILD_MISSING"; exit 1
fi
echo "BLOG_CLIENT_BUILD_LINK=PASS"

echo "=== PREVIEW ROUTES ==="
for path in / /journey /teacher /teacher/achievement-prize /curriculum-reading /teacher/curriculum-reading /guest-competitions; do
  curl -fsS --max-time 20 "$BASE$path" -o /dev/null
  echo "PREVIEW_PASS: $path"
done

echo "=== AUTHORIZATION CHECKS ==="
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -X PUT "$BASE/api/achievement-prize")
if [ "$code" != 401 ] && [ "$code" != 403 ]; then echo "PRIZE_AUTH_FAIL: $code"; exit 1; fi
echo "PRIZE_WRITE_SECURITY=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$BASE/api/achievement-prize")
test "$code" = 200
echo "PRIZE_READ=PASS"
for method in GET POST; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -X "$method" "$BASE/api/curriculum-reading/submissions")
  if [ "$code" != 401 ] && [ "$code" != 403 ]; then echo "AUDIO_AUTH_FAIL: $method $code"; exit 1; fi
done
echo "AUDIO_SECURITY=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$BASE/api/guest-competition")
test "$code" = 403
echo "GUEST_SECURITY=PASS"
echo "PREVIEW=PASS"

echo "=== BACKUP AND SWITCH ==="
cp -a "$NGINX" "$BACKUP"
python3 - <<'PY'
from pathlib import Path
p=Path("/etc/nginx/sites-available/lughati")
s=p.read_text()
old="proxy_pass http://127.0.0.1:3117;"
new="proxy_pass http://127.0.0.1:3118;"
if s.count(old) != 1: raise SystemExit("UNEXPECTED_NGINX_CONFIG")
p.write_text(s.replace(old,new,1))
PY
SWITCHED=YES
nginx -t
systemctl reload nginx

for path in / /journey /teacher/achievement-prize /curriculum-reading /teacher/curriculum-reading /guest-competitions; do
  curl -fsS --max-time 20 "$DOMAIN$path" -o /dev/null
  echo "PUBLIC_PASS: $path"
done
systemctl is-active --quiet lughati-blog-cards.service
systemctl is-active --quiet lughati-prize-layout.service
systemctl enable lughati-blog-cards.service
DONE=YES
trap - EXIT
echo "BLOG_CARDS_RELEASE=LIVE"
echo "ROLLBACK_TO_3117=READY"
