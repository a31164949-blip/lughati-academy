#!/usr/bin/env bash
# Isolated release: blog navigation cards only. Never mutates student data.
set -Eeuo pipefail
echo "BLOG_DEPLOY_BLOCKED: Correct blog URL has not been confirmed." >&2
exit 1
SRC=/opt/lughati-release-prize-layout/lughati-next
STAGE=/opt/lughati-release-blog-cards/lughati-next
REPO=/opt/lughati-guest-test/lughati-next
NGINX=/etc/nginx/sites-available/lughati
BACKUP=/etc/nginx/sites-available/lughati.before-blog-cards
SERVICE=/etc/systemd/system/lughati-blog-cards.service
DOMAIN=https://lughati-academy.duckdns.org
BRANCH=feature/external-grade-join-requests-20261119
SWITCHED=NO
DONE=NO
rollback() {
  if [ "$SWITCHED" = YES ] && [ "$DONE" != YES ] && [ -s "$BACKUP" ]; then
    echo "=== AUTOMATIC ROLLBACK TO 3117 ==="
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
systemctl is-active --quiet lughati-prize-layout.service
test "$(grep -Fc 'proxy_pass http://127.0.0.1:3117;' "$NGINX")" = 1
for path in "$STAGE" "$SERVICE" "$BACKUP"; do
  if [ -e "$path" ]; then echo "ALREADY_EXISTS: $path"; exit 1; fi
done
if ss -ltn | grep -q ':3118 '; then echo "PORT_3118_BUSY"; exit 1; fi

echo "=== COPY CURRENT LIVE RELEASE ==="
mkdir -p "$STAGE"
rsync -a --exclude='.git' --exclude='.next' --exclude='node_modules' --exclude='.env*' \
  --exclude='*.before-*' --exclude='*.backup*' "$SRC/" "$STAGE/"
install -o root -g lughati -m 640 "$SRC/.env.local" "$STAGE/.env.local"

echo "=== ADD BLOG CARD, NO DATA CHANGES ==="
git -C "$REPO" fetch origin "$BRANCH"
for file in app/components/AcademyBlogCard.tsx scripts/prepare-blog-cards.py; do
  mkdir -p "$STAGE/$(dirname "$file")"
  git -C "$REPO" show "FETCH_HEAD:lughati-next/$file" > "$STAGE/$file"
  test -s "$STAGE/$file"
  echo "FILE_PASS: $file"
done
cd "$STAGE"
python3 scripts/prepare-blog-cards.py
echo "=== INSTALL ==="
npm ci --ignore-scripts --no-audit --no-fund > /tmp/lughati-blog-cards-install.log 2>&1 || {
  tail -n 30 /tmp/lughati-blog-cards-install.log; exit 1;
}
echo "INSTALL=PASS"
echo "=== BUILD ==="
npx next build > /tmp/lughati-blog-cards-build.log 2>&1 || {
  tail -n 45 /tmp/lughati-blog-cards-build.log; exit 1;
}
test -s .next/BUILD_ID
install -d -o lughati -g lughati -m 750 .next/cache
chown -R lughati:lughati .next/cache
echo "BUILD=PASS"

echo "=== START PREVIEW 3118 ==="
cat > "$SERVICE" <<'UNIT'
[Unit]
Description=Lughati Academy Blog Cards Release
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=lughati
WorkingDirectory=/opt/lughati-release-blog-cards/lughati-next
Environment=NODE_ENV=production
EnvironmentFile=/etc/lughati/firebase.env
ExecStart=/usr/bin/node /opt/lughati-release-blog-cards/lughati-next/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3118
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl start lughati-blog-cards.service
READY=NO
for i in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3118/ -o /dev/null 2>/dev/null; then READY=YES; break; fi
  sleep 1
done
test "$READY" = YES
for path in / /journey /teacher /teacher/achievement-prize /curriculum-reading /teacher/curriculum-reading /guest-competitions; do
  curl -fsS --max-time 15 "http://127.0.0.1:3118$path" -o /dev/null
  echo "PREVIEW_PASS: $path"
done
curl -fsS --max-time 15 http://127.0.0.1:3118/ -o /tmp/lughati-blog-cards-home-preview.html
if ! grep -q 'exquisite-moxie-f87356.netlify.app' /tmp/lughati-blog-cards-home-preview.html; then
  echo "HOME_BLOG_LINK_MISSING"; exit 1;
fi
echo "HOME_BLOG_LINK=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 -X PUT http://127.0.0.1:3118/api/achievement-prize)
test "$code" = 401 || test "$code" = 403
echo "PRIZE_WRITE_SECURITY=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:3118/api/achievement-prize)
test "$code" = 200
echo "PRIZE_READ=PASS"
for method in GET POST; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 -X "$method" http://127.0.0.1:3118/api/curriculum-reading/submissions)
  test "$code" = 401 || test "$code" = 403
done
echo "AUDIO_SECURITY=PASS"
code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:3118/api/guest-competition)
test "$code" = 403
echo "GUEST_SECURITY=PASS"
systemctl is-active --quiet lughati-blog-cards.service
echo "PREVIEW=PASS"

echo "=== BACKUP AND SWITCH ==="
cp -a "$NGINX" "$BACKUP"
python3 - <<'PY'
from pathlib import Path
p=Path("/etc/nginx/sites-available/lughati")
s=p.read_text()
old="proxy_pass http://127.0.0.1:3117;"
new="proxy_pass http://127.0.0.1:3118;"
if s.count(old) != 1:
    raise SystemExit("UNEXPECTED_NGINX_ROUTE")
p.write_text(s.replace(old,new,1))
PY
SWITCHED=YES
nginx -t
systemctl reload nginx
for path in / /journey /teacher/achievement-prize /curriculum-reading /teacher/curriculum-reading /guest-competitions; do
  curl -fsS --max-time 15 "$DOMAIN$path" -o /dev/null
  echo "PUBLIC_PASS: $path"
done
systemctl is-active --quiet lughati-blog-cards.service
systemctl is-active --quiet lughati-prize-layout.service
systemctl enable lughati-blog-cards.service
DONE=YES
trap - EXIT
echo "BLOG_CARDS_RELEASE=LIVE"
echo "ROLLBACK_TO_3117=READY"
