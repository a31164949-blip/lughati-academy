#!/usr/bin/env bash
# Release homepage and student-dashboard cleanup with isolated build and rollback.
set -Eeuo pipefail

SRC=/opt/lughati-release-simple-login/lughati-next
STAGE=/opt/lughati-release-home-cleanup/lughati-next
REPO=/opt/lughati-guest-test/lughati-next
NGINX=/etc/nginx/sites-available/lughati
BACKUP=/etc/nginx/sites-available/lughati.before-home-cleanup
SERVICE=/etc/systemd/system/lughati-home-cleanup.service
DOMAIN=https://lughati-academy.duckdns.org
SWITCHED=NO
COMPLETE=NO

rollback() {
  if [ "$COMPLETE" != YES ] && [ "$SWITCHED" = YES ]; then
    echo "=== AUTOMATIC ROLLBACK TO PORT 3112 ==="
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
systemctl is-active --quiet lughati-simple-login.service
systemctl is-active --quiet lughati.service
grep -qF 'proxy_pass http://127.0.0.1:3112;' "$NGINX"
if [ -e "$STAGE" ] || [ -e "$BACKUP" ] || [ -e "$SERVICE" ]; then
  echo "STAGE_OR_BACKUP_ALREADY_EXISTS: aborting without overwriting"
  exit 1
fi
if ss -ltn | grep -q ':3113 '; then
  echo "PREVIEW_PORT_3113_BUSY"
  exit 1
fi

echo "=== COPY CURRENT RELEASE SAFELY ==="
mkdir -p "$STAGE"
rsync -a --exclude='.git' --exclude='.next' --exclude='node_modules' --exclude='.env*' \
  --exclude='*.before-*' --exclude='*.backup*' "$SRC/" "$STAGE/"
install -o root -g lughati -m 640 "$SRC/.env.local" "$STAGE/.env.local"

echo "=== FETCH GUARDED PATCH ==="
git -C "$REPO" fetch origin feature/external-grade-join-requests-20261119
git -C "$REPO" show FETCH_HEAD:lughati-next/scripts/prepare-home-cleanup.py \
  > "$STAGE/scripts/prepare-home-cleanup.py"
cd "$STAGE"
python3 scripts/prepare-home-cleanup.py

echo "=== INSTALL ==="
npm ci --ignore-scripts --no-audit --no-fund \
  > /tmp/lughati-home-cleanup-install.log 2>&1 || {
    tail -n 30 /tmp/lughati-home-cleanup-install.log
    exit 1
  }
echo "INSTALL=PASS"

echo "=== BUILD WITHOUT FIRESTORE RULE DEPLOYMENT ==="
npx next build > /tmp/lughati-home-cleanup-build.log 2>&1 || {
  tail -n 35 /tmp/lughati-home-cleanup-build.log
  exit 1
}
test -s "$STAGE/.next/BUILD_ID"
install -d -o lughati -g lughati -m 750 "$STAGE/.next/cache"
chown -R lughati:lughati "$STAGE/.next/cache"
echo "BUILD=PASS"

echo "=== START SEPARATE RELEASE ==="
cat > "$SERVICE" <<'EOF'
[Unit]
Description=Lughati Academy Home Cleanup Release
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=lughati
WorkingDirectory=/opt/lughati-release-home-cleanup/lughati-next
Environment=NODE_ENV=production
EnvironmentFile=/etc/lughati/firebase.env
ExecStart=/usr/bin/node /opt/lughati-release-home-cleanup/lughati-next/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3113
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl start lughati-home-cleanup.service
READY=NO
for i in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3113/ -o /dev/null 2>/dev/null; then
    READY=YES
    break
  fi
  sleep 1
done
test "$READY" = YES
for route in / /journey /guest-competitions /reading-tracks /curriculum-reading; do
  curl -fsS --max-time 12 "http://127.0.0.1:3113$route" -o /dev/null
  echo "PREVIEW_PASS: $route"
done
unauthorized=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 \
  http://127.0.0.1:3113/api/guest-competition)
test "$unauthorized" = 403
echo "GUEST_SECURITY=PASS"
sleep 10
systemctl is-active --quiet lughati-home-cleanup.service
echo "PREVIEW=PASS"

echo "=== SAVE ROLLBACK AND SWITCH ==="
cp -a "$NGINX" "$BACKUP"
python3 - <<'PY'
from pathlib import Path
p=Path("/etc/nginx/sites-available/lughati")
old="proxy_pass http://127.0.0.1:3112;"
new="proxy_pass http://127.0.0.1:3113;"
value=p.read_text()
if value.count(old)!=1:
    raise SystemExit("UNEXPECTED_NGINX_ROUTE")
p.write_text(value.replace(old,new,1))
PY
SWITCHED=YES
nginx -t
systemctl reload nginx
for route in / /journey /guest-competitions /reading-tracks /curriculum-reading; do
  curl -fsS --max-time 15 "$DOMAIN$route" -o /dev/null
  echo "PUBLIC_PASS: $route"
done
systemctl is-active --quiet lughati-home-cleanup.service
systemctl is-active --quiet lughati-simple-login.service
systemctl enable lughati-home-cleanup.service
COMPLETE=YES
trap - EXIT
echo "HOMEPAGE_AND_STUDENT_RELEASE=LIVE"
echo "ROLLBACK_TO_3112=READY"
