#!/usr/bin/env bash
# Publish the achievement bank 1200-point goal & teacher-selected RC car image.
# Isolated release based on current stable 3115. Does not touch Firestore rules or student balances.
set -Eeuo pipefail
SRC=/opt/lughati-release-curriculum-audio/lughati-next
STAGE=/opt/lughati-release-achievement-prize/lughati-next
REPO=/opt/lughati-guest-test/lughati-next
NGINX=/etc/nginx/sites-available/lughati
BACKUP=/etc/nginx/sites-available/lughati.before-achievement-prize
SERVICE=/etc/systemd/system/lughati-achievement-prize.service
BRANCH=feature/external-grade-join-requests-20261119
DOMAIN=https://lughati-academy.duckdns.org
SWITCHED=NO
COMPLETE=NO
rollback() {
  if [ "$SWITCHED" = YES ] && [ "$COMPLETE" != YES ] && [ -s "$BACKUP" ]; then
    echo "=== ROLLBACK TO 3115 ==="
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
systemctl is-active --quiet lughati-curriculum-audio.service
test "$(grep -Fc 'proxy_pass http://127.0.0.1:3115;' "$NGINX")" = 1
for path in "$STAGE" "$SERVICE" "$BACKUP"; do
  if [ -e "$path" ]; then echo "ALREADY_EXISTS: $path"; exit 1; fi
done
if ss -ltn | grep -q ':3116 '; then echo "PORT_3116_BUSY"; exit 1; fi

echo "=== COPY ACTIVE RELEASE WITHOUT TOUCHING IT ==="
mkdir -p "$STAGE"
rsync -a --exclude='.git' --exclude='.next' --exclude='node_modules' --exclude='.env*' \
  --exclude='*.before-*' --exclude='*.backup*' "$SRC/" "$STAGE/"
install -o root -g lughati -m 640 "$SRC/.env.local" "$STAGE/.env.local"

echo "=== APPLY GUARDED ACHIEVEMENT PATCH ==="
git -C "$REPO" fetch origin "$BRANCH"
for file in \
  app/api/achievement-prize/route.ts \
  app/components/AchievementGrandPrizeImage.tsx \
  app/teacher/achievement-prize/page.tsx \
  scripts/prepare-achievement-grand-prize.py
do
  mkdir -p "$STAGE/$(dirname "$file")"
  git -C "$REPO" show "FETCH_HEAD:lughati-next/$file" > "$STAGE/$file"
  test -s "$STAGE/$file"
  echo "FILE_PASS: $file"
done
cd "$STAGE"
python3 scripts/prepare-achievement-grand-prize.py

echo "=== INSTALL ==="
npm ci --ignore-scripts --no-audit --no-fund > /tmp/lughati-achievement-prize-install.log 2>&1 || {
  tail -n 35 /tmp/lughati-achievement-prize-install.log; exit 1;
}
echo "INSTALL=PASS"
echo "=== BUILD ==="
npx next build > /tmp/lughati-achievement-prize-build.log 2>&1 || {
  tail -n 45 /tmp/lughati-achievement-prize-build.log; exit 1;
}
test -s .next/BUILD_ID
install -d -o lughati -g lughati -m 750 .next/cache
chown -R lughati:lughati .next/cache
echo "BUILD=PASS"

echo "=== START PREVIEW 3116 ==="
cat > "$SERVICE" <<'UNIT'
[Unit]
Description=Lughati Academy Achievement Grand Prize Release
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=lughati
WorkingDirectory=/opt/lughati-release-achievement-prize/lughati-next
Environment=NODE_ENV=production
EnvironmentFile=/etc/lughati/firebase.env
ExecStart=/usr/bin/node /opt/lughati-release-achievement-prize/lughati-next/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3116
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl start lughati-achievement-prize.service
READY=NO
for i in $(seq 1 30); do
  if curl -fsS --max-time 4 http://127.0.0.1:3116/ -o /dev/null 2>/dev/null; then READY=YES; break; fi
  sleep 1
done
test "$READY" = YES
for path in / /journey /teacher /teacher/achievement-prize /curriculum-reading /teacher/curriculum-reading /guest-competitions; do
  curl -fsS --max-time 15 "http://127.0.0.1:3116$path" -o /dev/null
  echo "PREVIEW_PASS: $path"
done
for method in PUT; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 -X "$method" http://127.0.0.1:3116/api/achievement-prize)
  test "$code" = 401 || test "$code" = 403 || { echo "PRIZE_WRITE_AUTH_FAILED: $code"; exit 1; }
done
echo "PRIZE_WRITE_AUTH=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:3116/api/achievement-prize)
test "$code" = 200 || { echo "PRIZE_READ_FAILED: $code"; exit 1; }
echo "PRIZE_READ=PASS"
for method in GET POST; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 -X "$method" http://127.0.0.1:3116/api/curriculum-reading/submissions)
  test "$code" = 401 || test "$code" = 403 || { echo "AUDIO_AUTH_FAILED: $code"; exit 1; }
done
echo "AUDIO_SECURITY=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:3116/api/guest-competition)
test "$code" = 403
echo "GUEST_SECURITY=PASS"
sleep 5
systemctl is-active --quiet lughati-achievement-prize.service
echo "PREVIEW=PASS"

echo "=== BACKUP AND SWITCH ==="
cp -a "$NGINX" "$BACKUP"
python3 - <<'PY'
from pathlib import Path
p=Path("/etc/nginx/sites-available/lughati")
s=p.read_text()
old="proxy_pass http://127.0.0.1:3115;"
new="proxy_pass http://127.0.0.1:3116;"
if s.count(old) != 1: raise SystemExit("UNEXPECTED_NGINX_ROUTE")
p.write_text(s.replace(old,new,1))
PY
SWITCHED=YES
nginx -t
systemctl reload nginx
for path in / /journey /teacher/achievement-prize /curriculum-reading /teacher/curriculum-reading /guest-competitions; do
  curl -fsS --max-time 15 "$DOMAIN$path" -o /dev/null
  echo "PUBLIC_PASS: $path"
done
systemctl is-active --quiet lughati-achievement-prize.service
systemctl is-active --quiet lughati-curriculum-audio.service
systemctl enable lughati-achievement-prize.service
COMPLETE=YES
trap - EXIT
echo "ACHIEVEMENT_1200_RELEASE=LIVE"
echo "ROLLBACK_TO_3115=READY"
