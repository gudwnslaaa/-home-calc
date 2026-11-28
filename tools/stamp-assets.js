// 공통 파일 주소에 내용 기반 버전을 붙임: node tools/stamp-assets.js
// 오프라인 저장(sw.js)이 옛 common.css/js를 새 페이지와 섞어 쓰지 않도록, 내용이 바뀌면 주소도 바뀌게 함
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const ver = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 8);
const V = { css: ver('common.css'), js: ver('common.js') };
function walk(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    if (['tools', 'src', 'node_modules', '.git'].includes(n)) continue;
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p, out); else if (n.endsWith('.html')) out.push(p);
  }
  return out;
}
let n = 0;
for (const f of walk(ROOT)) {
  const s = fs.readFileSync(f, 'utf8');
  const t = s.replace(/href="\/common\.css(\?v=[0-9a-f]+)?"/g, `href="/common.css?v=${V.css}"`)
             .replace(/src="\/common\.js(\?v=[0-9a-f]+)?"/g, `src="/common.js?v=${V.js}"`);
  if (t !== s) { fs.writeFileSync(f, t); n++; }
}
// 서비스 워커 저장소 이름도 함께 바꿔 옛 저장분을 정리
const swp = path.join(ROOT, 'sw.js');
const sw = fs.readFileSync(swp, 'utf8').replace(/const CACHE = 'jibcalc-[^']+';/, `const CACHE = 'jibcalc-${V.css}${V.js}';`)
  .replace(/'\/common\.css(\?v=[0-9a-f]+)?'/, `'/common.css?v=${V.css}'`).replace(/'\/common\.js(\?v=[0-9a-f]+)?'/, `'/common.js?v=${V.js}'`);
fs.writeFileSync(swp, sw);
console.log(`버전 표시: css ${V.css}, js ${V.js} · ${n}개 파일 갱신`);
