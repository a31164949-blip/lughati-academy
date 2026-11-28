#!/usr/bin/env bash
# Build and start an unexposed preview only. Do not switch Nginx or change data.
set -Eeuo pipefail
umask 077
base=5f4a37d6de06517c41b4f0961d02d4fae00da409
candidate=510219a83c47a44bbca16efeca3c09343cf5be22
source_site=/opt/lughati-reading-preview.gBK6uI/site
unit=lughati-reading-world.service
unit_file="/etc/systemd/system/$unit"
config=/etc/nginx/sites-enabled/lughati
created_unit=0
ready=0
cleanup() {
  if [ "$ready" -eq 0 ]; then
    if [ "$created_unit" -eq 1 ]; then
      systemctl stop "$unit" || true
      rm -f -- "$unit_file"
      systemctl daemon-reload || true
    fi
    echo READING_WORLD_PREVIEW=FAILED
  fi
}
trap cleanup EXIT
test "$(id -u)" -eq 0
test "$(systemctl show -p WorkingDirectory --value lughati-reading-challenge.service)" = "$source_site"
systemctl is-active --quiet lughati-reading-challenge.service
grep -Fq 'proxy_pass http://127.0.0.1:3120;' "$config"
test -s "$source_site/.next/BUILD_ID"
test ! -e "$unit_file"
test -z "$(ss -H -ltn 'sport = :3121')"

work=$(mktemp -d /opt/lughati-reading-world.XXXXXX)
site="$work/site"
echo "PREVIEW_WORK=$work"
git init --bare -q "$work/repo"
git -C "$work/repo" fetch --no-tags --depth=1 \
  https://github.com/a31164949-blip/lughati-academy.git "$base" "$candidate"
git -C "$work/repo" diff --binary --relative=lughati-next "$base" "$candidate" -- lughati-next/ >"$work/world.patch"
test -s "$work/world.patch"
mkdir "$site"
rsync -a --exclude=.git --exclude=.next --exclude=.turbo --exclude=node_modules/.cache "$source_site/" "$site/"
cd "$site"
git apply --check "$work/world.patch"
git apply "$work/world.patch"
grep -Fq '<AcademyBlogCard compact />' app/journey/page.tsx
grep -Fq '<AchievementGrandPrizeImage />' app/journey/page.tsx
node scripts/check-reading-world.cjs
node scripts/check-reading-challenge.cjs
export NEXT_PUBLIC_READING_CHALLENGE_START_DATE=2026-11-30
nice -n 15 ./node_modules/.bin/next build
test -s .next/BUILD_ID

chgrp lughati "$work"
chmod 710 "$work"
chgrp -R lughati "$site/.next"
chmod -R g+rX "$site/.next"
install -d -o lughati -g lughati -m 750 "$site/.next/cache"
chown -R lughati:lughati "$site/.next/cache"

created_unit=1
install -m 644 /dev/null "$unit_file"
cat >"$unit_file" <<UNIT
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
NoNewPrivileges=true
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl start "$unit"
url=http://127.0.0.1:3121
for i in {1..20}; do
  if curl -fsS --max-time 3 "$url/reading-world" -o "$work/hub.html" 2>/dev/null; then break; fi
  sleep 2
done
grep -Fq 'اختر مسار القراءة' "$work/hub.html"
for route in /curriculum-reading /reading-journey /reading-journey/fluency-levels; do
  grep -Fq "href=\"$route\"" "$work/hub.html"
  curl -fsS --max-time 10 "$url$route" -o /dev/null
done
curl -fsS --max-time 10 "$url/reading-world-reader.svg" -o "$work/reader.svg"
cmp "$work/reader.svg" "$site/public/reading-world-reader.svg"
for route in / /journey /teacher/fluency-promotions; do
  curl -fsS --max-time 10 "$url$route" -o /dev/null
done
code=$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "$url/api/fluency-promotion/review")
case "$code" in 401|403) ;; *) exit 1;; esac
grep -Fq 'proxy_pass http://127.0.0.1:3120;' "$config"
ready=1
echo READING_WORLD_PREVIEW=PASS
