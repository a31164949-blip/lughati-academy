#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
work=/opt/lughati-reading-world.awK7sD
site=$work/site
old_unit=lughati-reading-challenge.service
unit=lughati-reading-world.service
unitfile=/etc/systemd/system/$unit
conf=$(readlink -f /etc/nginx/sites-enabled/lughati)
test "$conf" = /etc/nginx/sites-available/lughati
test "$(id -u)" -eq 0
test -s "$site/.next/BUILD_ID"
test ! -e "$unitfile"
test -z "$(ss -H -ltn 'sport = :3121')"
systemctl is-active --quiet "$old_unit"
old='proxy_pass http://127.0.0.1:3120;'
test "$(grep -Fc "$old" "$conf")" -eq 1
cd "$site"
node scripts/check-reading-world.cjs
node scripts/check-reading-challenge.cjs

backup=$(mktemp /var/backups/lughati-nginx-3120.XXXXXX)
cp -p "$conf" "$backup"
switch_attempted=0
installed=0
done_ok=0
phase=start
cleanup() {
  if [ "$done_ok" -eq 0 ]; then
    if [ "$switch_attempted" -eq 1 ]; then
      if ! cp -p "$backup" "$conf" || ! nginx -t || ! systemctl reload nginx; then
        echo "ROLLBACK_NEEDS_ATTENTION backup=$backup"
        return
      fi
    fi
    if [ "$installed" -eq 1 ]; then
      systemctl disable --now "$unit" >/dev/null 2>&1 || true
      rm -f -- "$unitfile"
      systemctl daemon-reload || true
    fi
    echo "READING_WORLD_RELEASE=FAILED phase=$phase"
  fi
}
trap cleanup EXIT
installed=1
install -m 644 /dev/null "$unitfile"
cat >"$unitfile" <<UNIT
[Unit]
Description=Lughati Academy Reading World
After=network-online.target
[Service]
Type=simple
User=lughati
Group=lughati
WorkingDirectory=$site
Environment=NODE_ENV=production
EnvironmentFile=/etc/lughati/firebase.env
ExecStart=/usr/bin/env NEXT_PUBLIC_READING_CHALLENGE_START_DATE=2026-11-30 /usr/bin/node $site/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3121
Restart=on-failure
RestartSec=5
NoNewPrivileges=yes
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl start "$unit"

url=http://127.0.0.1:3121
phase=preview
for i in {1..20}; do
  if curl -fsS --max-time 3 "$url/reading-world" -o "$work/hub-recheck.html" 2>/dev/null; then break; fi
  sleep 2
done
test -s "$work/hub-recheck.html"
# The account gate initially renders a loading shell. Verify the exact link
# props in the Next flight data or HTML without changing that gate.
grep -Fq 'اختر مسار القراءة' "$work/hub-recheck.html"
routes=(/curriculum-reading /reading-journey /reading-journey/fluency-levels)
for route in "${routes[@]}"; do
  grep -Fq "href=\"$route\"" "$work/hub-recheck.html" ||
    grep -Fq "\\\"href\\\":\\\"$route\\\"" "$work/hub-recheck.html" ||
    grep -Fq "$route" "$work/hub-recheck.html"
  curl -fsS --max-time 10 "$url$route" -o /dev/null
  echo "PREVIEW_PATH_PASS $route"
done
curl -fsS --max-time 10 "$url/reading-world-reader.svg" -o "$work/reader.svg"
cmp "$work/reader.svg" "$site/public/reading-world-reader.svg"
echo ILLUSTRATION=PASS
for route in / /journey /teacher/fluency-promotions; do curl -fsS --max-time 10 "$url$route" -o /dev/null; done
code=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$url/api/fluency-promotion/review")
case "$code" in 401|403) ;; *) exit 1;; esac

phase=switch
cmp -s "$backup" "$conf"
switch_attempted=1
sed -i 's@proxy_pass http://127\.0\.0\.1:3120;@proxy_pass http://127.0.0.1:3121;@' "$conf"
nginx -t
systemctl reload nginx
domain=lughati-academy.duckdns.org
phase=live-smoke
for route in / /journey /reading-world "${routes[@]}" /reading-world-reader.svg; do
  curl -fsS --max-time 10 --resolve "$domain:443:127.0.0.1" "https://$domain$route" -o /dev/null
  echo "LIVE_PAGE_PASS $route"
done
systemctl enable "$unit"
systemctl is-active --quiet "$old_unit"
done_ok=1
echo READING_WORLD_RELEASE=LIVE
echo "ROLLBACK_BACKUP=$backup"
