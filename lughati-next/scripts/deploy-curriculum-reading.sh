#!/usr/bin/env bash
# Deploy image-based curriculum reading with on-device voice rehearsal.
# Does not update Firebase rules, student points, or the active release until checks pass.
set -Eeuo pipefail

SRC=/opt/lughati-release-home-cleanup/lughati-next
STAGE=/opt/lughati-release-curriculum-reading/lughati-next
REPO=/opt/lughati-guest-test/lughati-next
NGINX=/etc/nginx/sites-available/lughati
BACKUP=/etc/nginx/sites-available/lughati.before-curriculum-reading
SERVICE=/etc/systemd/system/lughati-curriculum-reading.service
DOMAIN=https://lughati-academy.duckdns.org
BRANCH=feature/external-grade-join-requests-20261119
SWITCHED=NO
COMPLETE=NO

rollback() {
  if [ "$COMPLETE" != YES ] && [ "$SWITCHED" = YES ]; then
    echo "=== ROLLING BACK TO SAFE RELEASE 3113 ==="
    if [ -s "$BACKUP" ]; then
      cp -a "$BACKUP" "$NGINX"
      nginx -t && systemctl reload nginx
    fi
  fi
}
trap rollback EXIT

echo "=== PRECHECK ==="
test "$(id -u)" = 0
test -s "$SRC/.next/BUILD_ID"
test -f "$SRC/.env.local"
test -f /etc/lughati/firebase.env
systemctl is-active --quiet lughati-home-cleanup.service
grep -qF 'proxy_pass http://127.0.0.1:3113;' "$NGINX"
for file in "$STAGE" "$BACKUP" "$SERVICE"; do
  if [ -e "$file" ]; then
    echo "ALREADY_EXISTS: $file"
    exit 1
  fi
done
if ss -ltn | grep -q ':3114 '; then
  echo "PORT_3114_BUSY"
  exit 1
fi

echo "=== COPY WORKING RELEASE ==="
mkdir -p "$STAGE"
rsync -a --exclude='.git' --exclude='.next' --exclude='node_modules' --exclude='.env*' \
  --exclude='*.before-*' --exclude='*.backup*' "$SRC/" "$STAGE/"
install -o root -g lughati -m 640 "$SRC/.env.local" "$STAGE/.env.local"

echo "=== FETCH EXACT THREE CURRICULUM FILES ==="
git -C "$REPO" fetch origin "$BRANCH"
mkdir -p "$STAGE/app/api/curriculum-reading" "$STAGE/app/teacher/curriculum-reading"
for file in \
  app/curriculum-reading/page.tsx \
  app/api/curriculum-reading/route.ts \
  app/teacher/curriculum-reading/page.tsx
do
  git -C "$REPO" show "FETCH_HEAD:lughati-next/$file" > "$STAGE/$file"
  test -s "$STAGE/$file"
  echo "FILE=PASS $file"
done

echo "=== VERIFY STUDENT SAFETY ==="
grep -qF 'const semesterGrandPrizeGoal = 1200' "$STAGE/app/journey/page.tsx" || {
  echo "WARNING: Current live bank goal is not 1200; do not change it here."
}
test -f "$STAGE/app/curriculum-reading/page.tsx"
grep -qF 'createSpeechRecorder' "$STAGE/app/curriculum-reading/page.tsx"
grep -qF 'getFirebaseAdmin' "$STAGE/app/api/curriculum-reading/route.ts"
echo "STUDENT_SAFETY_CHECK=PASS"

cd "$STAGE"
echo "=== INSTALL ==="
npm ci --ignore-scripts --no-audit --no-fund \
  > /tmp/lughati-curriculum-install.log 2>&1 || {
    tail -n 35 /tmp/lughati-curriculum-install.log
    exit 1
  }
echo "INSTALL=PASS"

echo "=== BUILD ==="
npx next build > /tmp/lughati-curriculum-build.log 2>&1 || {
  tail -n 45 /tmp/lughati-curriculum-build.log
  exit 1
}
test -s .next/BUILD_ID
install -d -o lughati -g lughati -m 750 .next/cache
chown -R lughati:lughati .next/cache
echo "BUILD=PASS"

echo "=== START PREVIEW 3114 ==="
cat > "$SERVICE" <<'UNIT'
[Unit]
Description=Lughati Academy Curriculum Reading Release
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=lughati
WorkingDirectory=/opt/lughati-release-curriculum-reading/lughati-next
Environment=NODE_ENV=production
EnvironmentFile=/etc/lughati/firebase.env
ExecStart=/usr/bin/node /opt/lughati-release-curriculum-reading/lughati-next/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3114
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl start lughati-curriculum-reading.service
READY=NO
for i in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3114/ -o /dev/null 2>/dev/null; then
    READY=YES
    break
  fi
  sleep 1
done
test "$READY" = YES
for route in / /journey /guest-competitions /reading-tracks /curriculum-reading /teacher/curriculum-reading; do
  curl -fsS --max-time 12 "http://127.0.0.1:3114$route" -o /dev/null
  echo "PREVIEW_PASS: $route"
done
# Test write security without attempting a write.
for method in PUT DELETE; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 12 -X "$method" \
    http://127.0.0.1:3114/api/curriculum-reading)
  test "$code" = 401 || test "$code" = 403 || {
    echo "CURRICULUM_WRITE_SECURITY_FAIL: $method $code"; exit 1;
  }
done
echo "CURRICULUM_WRITE_SECURITY=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
  http://127.0.0.1:3114/api/curriculum-reading)
test "$code" = 200 || {
  echo "CURRICULUM_READ_FAIL: $code"; exit 1;
}
echo "CURRICULUM_READ=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 12 \
  http://127.0.0.1:3114/api/guest-competition)
test "$code" = 403
echo "GUEST_SECURITY=PASS"
sleep 5
systemctl is-active --quiet lughati-curriculum-reading.service
echo "PREVIEW=PASS"

echo "=== SAVE ROLLBACK AND SWITCH ==="
cp -a "$NGINX" "$BACKUP"
python3 - <<'PY'
from pathlib import Path
p = Path("/etc/nginx/sites-available/lughati")
original = p.read_text()
old = "proxy_pass http://127.0.0.1:3113;"
new = "proxy_pass http://127.0.0.1:3114;"
if original.count(old) != 1:
    raise SystemExit("UNEXPECTED_NGINX_ROUTE: no switch")
p.write_text(original.replace(old, new, 1))
PY
SWITCHED=YES
nginx -t
systemctl reload nginx
for route in / /journey /guest-competitions /reading-tracks /curriculum-reading /teacher/curriculum-reading; do
  curl -fsS --max-time 15 "$DOMAIN$route" -o /dev/null
  echo "PUBLIC_PASS: $route"
done
systemctl is-active --quiet lughati-curriculum-reading.service
systemctl is-active --quiet lughati-home-cleanup.service
systemctl enable lughati-curriculum-reading.service
COMPLETE=YES
trap - EXIT
echo "CURRICULUM_READING_RELEASE=LIVE"
echo "ROLLBACK_TO_3113=READY"
