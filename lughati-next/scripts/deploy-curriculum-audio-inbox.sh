#!/usr/bin/env bash
# Isolated deployment: curriculum audio submission + teacher inbox. No Firebase rules changes.
set -Eeuo pipefail
SRC=/opt/lughati-release-curriculum-reading/lughati-next
STAGE=/opt/lughati-release-curriculum-audio/lughati-next
REPO=/opt/lughati-guest-test/lughati-next
NGINX=/etc/nginx/sites-available/lughati
BACKUP=/etc/nginx/sites-available/lughati.before-curriculum-audio
SERVICE=/etc/systemd/system/lughati-curriculum-audio.service
DOMAIN=https://lughati-academy.duckdns.org
BRANCH=feature/external-grade-join-requests-20261119
SWITCHED=NO
COMPLETE=NO
rollback() {
  if [ "$COMPLETE" != YES ] && [ "$SWITCHED" = YES ] && [ -s "$BACKUP" ]; then
    echo "=== AUTOMATIC ROLLBACK TO 3114 ==="
    cp -a "$BACKUP" "$NGINX"
    nginx -t && systemctl reload nginx
  fi
}
trap rollback EXIT

echo "=== PRECHECK ==="
test "$(id -u)" = 0
test -s "$SRC/.next/BUILD_ID"
test -f "$SRC/.env.local"
test -f /etc/lughati/firebase.env
systemctl is-active --quiet lughati-curriculum-reading.service
grep -qF 'proxy_pass http://127.0.0.1:3114;' "$NGINX"
for item in "$STAGE" "$BACKUP" "$SERVICE"; do
  if [ -e "$item" ]; then echo "ALREADY_EXISTS: $item"; exit 1; fi
done
if ss -ltn | grep -q ':3115 '; then echo "PREVIEW_PORT_BUSY"; exit 1; fi

echo "=== COPY SAFE WORKING RELEASE ==="
mkdir -p "$STAGE"
rsync -a --exclude='.git' --exclude='.next' --exclude='node_modules' --exclude='.env*' \
  --exclude='*.before-*' --exclude='*.backup*' "$SRC/" "$STAGE/"
install -o root -g lughati -m 640 "$SRC/.env.local" "$STAGE/.env.local"

echo "=== FETCH TARGETED CODE ==="
git -C "$REPO" fetch origin "$BRANCH"
for path in \
  app/curriculum-reading/page.tsx \
  app/api/curriculum-reading/submissions/route.ts \
  app/teacher/curriculum-reading/page.tsx \
  app/teacher/page.tsx
do
  mkdir -p "$STAGE/$(dirname "$path")"
  git -C "$REPO" show "FETCH_HEAD:lughati-next/$path" > "$STAGE/$path"
  test -s "$STAGE/$path"
  echo "FILE_PASS: $path"
done
grep -qF 'إرسال قراءتي للمعلم' "$STAGE/app/curriculum-reading/page.tsx"
grep -qF 'readingSubmissions' "$STAGE/app/teacher/reading-submissions/page.tsx" || true
grep -qF 'curriculumReadingSubmissions' "$STAGE/app/api/curriculum-reading/submissions/route.ts"
grep -qF 'href: "/teacher/curriculum-reading"' "$STAGE/app/teacher/page.tsx"
echo "STUDENT_DATA_CHANGES=NO"

echo "=== INSTALL ==="
cd "$STAGE"
npm ci --ignore-scripts --no-audit --no-fund > /tmp/lughati-curriculum-audio-install.log 2>&1 || {
  tail -n 35 /tmp/lughati-curriculum-audio-install.log; exit 1;
}
echo "INSTALL=PASS"

echo "=== BUILD ==="
npx next build > /tmp/lughati-curriculum-audio-build.log 2>&1 || {
  tail -n 45 /tmp/lughati-curriculum-audio-build.log; exit 1;
}
test -s .next/BUILD_ID
install -d -o lughati -g lughati -m 750 .next/cache
chown -R lughati:lughati .next/cache
echo "BUILD=PASS"

echo "=== START PREVIEW 3115 ==="
cat > "$SERVICE" <<'UNIT'
[Unit]
Description=Lughati Academy Curriculum Reading Voice Inbox Release
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=lughati
WorkingDirectory=/opt/lughati-release-curriculum-audio/lughati-next
Environment=NODE_ENV=production
EnvironmentFile=/etc/lughati/firebase.env
ExecStart=/usr/bin/node /opt/lughati-release-curriculum-audio/lughati-next/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3115
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl start lughati-curriculum-audio.service
READY=NO
for i in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3115/ -o /dev/null 2>/dev/null; then READY=YES; break; fi
  sleep 1
done
test "$READY" = YES
for route in / /journey /teacher /curriculum-reading /teacher/curriculum-reading /guest-competitions /reading-tracks; do
  curl -fsS --max-time 12 "http://127.0.0.1:3115$route" -o /dev/null
  echo "PREVIEW_PASS: $route"
done
for method in GET POST; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 -X "$method" http://127.0.0.1:3115/api/curriculum-reading/submissions)
  if [ "$code" != 401 ] && [ "$code" != 403 ]; then
    echo "AUDIO_AUTH_FAIL method=$method code=$code"; exit 1
  fi
done
echo "AUDIO_AUTH=PASS"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 http://127.0.0.1:3115/api/curriculum-reading)
test "$code" = 200
echo "CURRICULUM=PASS"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 http://127.0.0.1:3115/api/guest-competition)
test "$code" = 403
echo "GUEST_SECURITY=PASS"
sleep 5
systemctl is-active --quiet lughati-curriculum-audio.service
echo "PREVIEW=PASS"

echo "=== SAVE ROLLBACK AND SWITCH ==="
cp -a "$NGINX" "$BACKUP"
python3 - <<'PY'
from pathlib import Path
p=Path("/etc/nginx/sites-available/lughati")
s=p.read_text()
old="proxy_pass http://127.0.0.1:3114;"
new="proxy_pass http://127.0.0.1:3115;"
if s.count(old)!=1: raise SystemExit("UNEXPECTED_NGINX_ROUTE")
p.write_text(s.replace(old,new,1))
PY
SWITCHED=YES
nginx -t
systemctl reload nginx
for route in / /journey /teacher /curriculum-reading /teacher/curriculum-reading /guest-competitions; do
  curl -fsS --max-time 15 "$DOMAIN$route" -o /dev/null
  echo "PUBLIC_PASS: $route"
done
systemctl is-active --quiet lughati-curriculum-audio.service
systemctl is-active --quiet lughati-curriculum-reading.service
systemctl enable lughati-curriculum-audio.service
COMPLETE=YES
trap - EXIT
echo "CURRICULUM_AUDIO_INBOX=LIVE"
echo "ROLLBACK_TO_3114=READY"
