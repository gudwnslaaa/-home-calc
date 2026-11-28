// 사이트 전체 다시 만들기: node tools/build-all.js
// 순서: 기본 스타일 → 생성형 페이지 → 목록·메뉴 → 공통 파일 버전 표시(항상 마지막)
const { execFileSync } = require('child_process');
const path = require('path');
const run = (f) => execFileSync(process.execPath, [path.join(__dirname, f)], { stdio: ['ignore', 'pipe', 'inherit'] });
run('apply-theme.js');
for (const b of ['vat', 'labor', 'estimate', 'area', 'pyeong', 'waste', 'measure', 'schedule', 'insulation', 'room', 'moving', 'order', '404']) run(`build-${b}.js`);
run('sync-lists.js');
process.stdout.write(run('stamp-assets.js'));
