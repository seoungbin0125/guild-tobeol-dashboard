#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
echo "버전: $(node -e "console.log(require('./package.json').version)")"
node - <<'NODE'
const data = require('./data/latest.json');
const members = data.members.filter((member) => member.guild === '반짝');
console.log(`반짝 길드원: ${members.length}명`);
console.log(`수집 기준: ${data.dataSource || '-'}`);
console.log(`반짝 URL: ${(data.sourceUrls || {})['반짝'] || '-'}`);
console.log('TOP 5:');
for (const m of members.slice(0, 5)) console.log(`${m.rank}. ${m.nickname} ${m.job} Lv.${m.level} ${m.powerText}`);
NODE
