// 평수 계산기 페이지 생성 스크립트 (사이트에는 올라가지 않음)
// 실행: node tools/build-pyeong.js  → pyeong/index.html, pyeong/<면적>/index.html 생성
// 디자인은 tile/index.html 의 <style> 블록을 그대로 가져와 4개 계산기와 똑같이 맞춤.
const fs = require('fs');
const path = require('path');
const { m2ToPyeong, round } = require('./pyeong-math');
const kit = require('./site-kit');

const ROOT = path.join(__dirname, '..');
const tileHtml = fs.readFileSync(path.join(ROOT, 'tile/index.html'), 'utf8');
const BASE_STYLE = tileHtml.match(/<style>[\s\S]*?<\/style>/)[0];

const AREAS = [39, 49, 59, 74, 84, 101, 114];
// 흔히 부르는 평형: 출처에서 확인된 면적만 적음 (KB국민은행 '부동산은 처음이라', 2023.4.6 등)
// 그 외 면적은 전용률 가정 범위로 계산한 값만 보여줌
const COMMON = {
  59: { label: '24~25평형', title: '24·25평형' },
  74: { label: '약 30평형', title: '30평형' },
  84: { label: '33~34평형', title: '34평형' },
  114: { label: '약 43평형', title: '43평형' },
};
const RATIO_LOW = 0.70, RATIO_HIGH = 0.80; // 전용률 가정 범위

const f2 = (n) => round(n, 2).toFixed(2);
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const f0 = (n) => Math.round(n).toLocaleString('ko-KR');

const ICON_PYEONG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="13" height="13" rx="2"/><path d="M4 3.5h13M4 2v3M17 2v3M20.5 7v13M19 7h3M19 20h3"/></svg>';
const RELATED = require('./site-kit').related('pyeong');

// 평수 페이지 전용 추가 스타일 (기존 색·모양 변수만 사용)
const EXTRA_STYLE = `<style>
.swap{display:flex;align-items:end;gap:10px}
.swap > div{flex:1}
.swap .eq{color:var(--muted);font-size:1.2rem;padding-bottom:12px}
.cta{margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
.cta p{margin:0 0 10px;font-size:.92rem;color:var(--ink);font-weight:500}
.cta .links{display:flex;flex-wrap:wrap;gap:8px}
.cta a.btn{text-decoration:none;display:inline-block}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.chips a{display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);
  color:var(--ink);text-decoration:none;font-size:.92rem;transition:border-color .2s,color .2s}
.chips a:hover{border-color:var(--accent);color:var(--accent)}
.chips a.on{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.area-map{margin:16px 0 8px;font-size:.9rem}
.lay{border-radius:14px;padding:12px 14px}
.lay .tag{display:block;font-size:.8rem;color:var(--muted);margin-bottom:8px}
.lay.contract{border:1px dashed #9aa198;background:#f7f8f5}
.lay.supply{border:1px solid #c3c8c0;background:#ffffff}
.lay.excl{border:1px solid var(--accent);background:var(--accent-soft);color:var(--ink)}
.lay.excl b{display:block;color:var(--accent);font-weight:600}
.lay.excl small,.side small,.lay.service small{display:block;color:var(--muted);font-size:.8rem;margin-top:2px}
.side{margin-top:8px;padding:8px 12px;border-radius:8px;background:var(--soft);color:var(--ink)}
.lay.service{margin-top:10px;border:1px dashed #c9a63a;color:#6b5200;background:#fff8dc}
.bar{display:flex;border-radius:12px;overflow:hidden;margin:12px 0 4px;font-size:.85rem;min-height:46px}
.bar span{display:flex;align-items:center;justify-content:center;text-align:center;padding:6px 8px;line-height:1.35}
.bar .b1{background:var(--tape);color:#1c2024;font-weight:700}
.bar .b2{background:#d6dad3;color:var(--ink)}
.bar-cap{display:flex;justify-content:space-between;font-size:.8rem;color:var(--muted)}
.tagline{display:inline-block;font-size:.75rem;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:1px 8px;margin-left:6px;vertical-align:2px}
.notebox{margin-top:14px;font-size:.85rem;color:var(--muted);background:var(--field);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.notebox b{color:var(--ink);font-weight:500}
@media (max-width:560px){ .swap{flex-direction:column;align-items:stretch} .swap .eq{text-align:center;padding:0} }
</style>`;

function head({ title, desc, url, jsonld = '' }) {
  jsonld = require('./site-kit').crumbJsonLd(title.split(' – ')[0], url) + jsonld;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="집 공사 계산기">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://jibcalc.com/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">
${jsonld}<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
${BASE_STYLE}
${EXTRA_STYLE}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#ffc400">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/common.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2109467057955554" crossorigin="anonymous"></script>
</head>
<body>
<div class="wrap">
`;
}

const BACK = (href, text) => `<p style="margin-bottom:10px"><a href="${href}" style="color:var(--muted);text-decoration:none;font-size:.88rem;display:inline-flex;align-items:center;gap:8px"><img src="/img/logo-mark.svg" alt="" width="22" height="22">${text}</a></p>`;

const FOOT = `  <footer>
    <div class="foot-links"><a href="/about/">소개</a><a href="/privacy/">개인정보처리방침</a><a href="/contact/">문의</a></div>
    결과는 참고용 추정치입니다. 아파트 공급면적은 단지마다 다르니 분양 공고나 건축물대장으로 확인하세요.
  </footer>
</div>
`;

const PY_TABLE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 24, 25, 30, 32, 33, 34, 40, 45, 50, 60, 100];
const SIZES = [1, 3, 5, 10];
function convTable() {
  const rows = [];
  for (let i = 0; i < PY_TABLE.length; i += 2) {
    const a = PY_TABLE[i], b = PY_TABLE[i + 1];
    rows.push(`<tr><td>${a}평</td><td>${f2(a * 400 / 121)}㎡</td><td>${b ? b + '평' : ''}</td><td>${b ? f2(b * 400 / 121) + '㎡' : ''}</td></tr>`);
  }
  return `<table><thead><tr><th>평</th><th>㎡</th><th>평</th><th>㎡</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
const sizeChips = (current) => `<div class="chips">${SIZES.map((n) =>
  `<a href="/pyeong/size-${n}/"${n === current ? ' class="on" aria-current="page"' : ''}>${n}평 크기 · ${f2(n * 400 / 121)}㎡</a>`).join('')}</div>`;
const chips = (current) => `<div class="chips">${AREAS.map((n) =>
  `<a href="/pyeong/${n}/"${n === current ? ' class="on" aria-current="page"' : ''}>${n}㎡ · ${f1(m2ToPyeong(n))}평</a>`).join('')}</div>`;

const AREA_MAP = `<div class="area-map" role="img" aria-label="계약면적 안에 공급면적, 그 안에 전용면적이 들어 있고 서비스면적은 따로인 구조">
      <div class="lay contract"><span class="tag">계약면적 = 공급면적 + 기타공용면적</span>
        <div class="lay supply"><span class="tag">공급면적 = 전용면적 + 주거공용면적 · 흔히 말하는 "○○평형"</span>
          <div class="lay excl"><b>전용면적</b><small>현관문 안쪽, 우리 집만 쓰는 방·거실·주방·욕실</small></div>
          <div class="side">+ 주거공용면적<small>계단, 복도, 엘리베이터처럼 같은 동 사람들이 함께 쓰는 곳</small></div>
        </div>
        <div class="side">+ 기타공용면적<small>지하주차장, 관리사무소, 커뮤니티 시설 등 단지 전체가 쓰는 곳</small></div>
      </div>
      <div class="lay service">서비스면적 (발코니)<small>위 어느 면적에도 들어가지 않지만, 확장하면 실제로 쓰는 공간이 넓어짐</small></div>
    </div>`;

/* ---------------- 메인: /pyeong/ ---------------- */
function mainPage() {
  const faq = [
    ['1평은 몇 ㎡인가요?', '1평은 400/121㎡, 약 3.3058㎡입니다. ㎡를 평으로 바꿀 때는 ㎡에 121을 곱하고 400으로 나누면 되고, 대략 0.3025를 곱해도 거의 같은 값이 나옵니다.'],
    ['아파트 84㎡는 몇 평인가요?', '전용면적 84㎡는 약 25.41평입니다. 흔히 33~34평형이라고 부르는 것은 전용면적에 계단·복도 같은 주거공용면적을 더한 공급면적 기준이기 때문입니다.'],
    ['공급면적은 어디서 정확히 확인하나요?', '공급면적은 단지와 타입마다 다릅니다. 분양 공고문이나 건축물대장(집합건축물대장 전유부)에서 확인할 수 있습니다.'],
  ];
  const jsonld = `<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }, null, 2)}
</script>
`;
  return head({
    title: '평수 계산기 – 평수 변환(㎡ ↔ 평)·평수 변환표·방 크기로 평수 계산',
    desc: '제곱미터와 평을 바로 바꾸는 평수 변환 계산기입니다. 1평부터 100평까지 평수 변환표, 방 가로·세로로 평수 계산, 전용·공급면적 차이와 84㎡가 34평형으로 불리는 이유까지 정리했습니다.',
    url: 'https://jibcalc.com/pyeong/',
    jsonld,
  }) + `  <header>
    ${BACK('/', '집 공사 계산기 · 전체 보기')}
    <h1>평수 계산기</h1>
    <p>㎡와 평을 바로 바꾸고, 방 크기로 평수를 계산합니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>㎡ ↔ 평 바로 변환</h2>
    <div class="swap">
      <div><label for="m2">제곱미터 (㎡)</label><input id="m2" type="number" inputmode="decimal" min="0" step="any" value="84"></div>
      <div class="eq" aria-hidden="true">⇄</div>
      <div><label for="py">평</label><input id="py" type="number" inputmode="decimal" min="0" step="any" value="25.41"></div>
    </div>
    <p class="hint">어느 칸에 넣어도 다른 칸이 바로 바뀝니다. 1평 = 400/121㎡ ≈ 3.3058㎡ (소수 둘째 자리까지 표시)</p>
  </section>

  <section class="card">
    <h2><span class="num">2</span>방 크기로 평수 계산</h2>
    <div class="grid g3">
      <div><label for="rw">가로</label><input id="rw" type="number" inputmode="decimal" min="0" step="any" value="3.6"></div>
      <div><label for="rl">세로</label><input id="rl" type="number" inputmode="decimal" min="0" step="any" value="3.0"></div>
      <div><label for="unit">단위</label>
        <select id="unit"><option value="m" selected>m (미터)</option><option value="cm">cm (센티미터)</option></select></div>
    </div>
    <p class="hint">줄자로 cm 단위로 쟀다면 단위를 cm로 바꾸고 그대로 넣으세요.</p>
  </section>

  <section class="card result" aria-live="polite">
    <h2>계산 결과</h2>
    <div class="big">
      <div class="stat"><div class="k">방 면적</div><div class="v" id="rM2">0<small>㎡</small></div></div>
      <div class="stat"><div class="k">평수</div><div class="v" id="rPy">0<small>평</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
    <div class="cta">
      <p>이 방 도배·타일·장판 계산하기</p>
      <div class="links">
        <a class="btn primary" id="goWall" href="/wallpaper/">도배지 계산</a>
        <a class="btn" id="goTile" href="/tile/">바닥 타일 계산</a>
        <a class="btn" id="goFloor" href="/floor/">장판·마루 계산</a>
      </div>
    </div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>아파트 면적, 한 장으로 보기</h2>
    <p>아파트 광고나 매물에는 같은 집인데도 ㎡와 평, 전용과 공급이 섞여 나와 헷갈리기 쉽습니다. 면적은 안쪽부터 바깥쪽으로 겹겹이 커진다고 생각하면 쉽습니다.</p>
    ${AREA_MAP}
    <ul>
      <li><b>전용면적</b>: 매물·분양에서 말하는 59㎡, 84㎡가 이것입니다. 실제로 생활하는 공간입니다.</li>
      <li><b>공급면적</b>: 전용면적에 주거공용면적을 더한 값으로, "34평 아파트"처럼 말할 때 보통 이 기준입니다.</li>
      <li><b>계약면적</b>: 공급면적에 기타공용면적까지 더한 값으로, 분양 계약서에 적힙니다.</li>
      <li><b>서비스면적</b>: 발코니처럼 면적 계산에서 빠지는 공간입니다. 같은 84㎡라도 발코니가 넓으면 확장 후 더 넓게 쓸 수 있습니다.</li>
    </ul>

    <h2>84㎡가 34평형으로 불리는 이유</h2>
    <p>84㎡를 평으로 바꾸면 <b>약 25.41평</b>입니다. 그런데 흔히 33~34평형이라고 부르는 건, 평형을 말할 때 전용면적이 아니라 <b>공급면적</b>을 기준으로 삼기 때문입니다. 전용 25.4평에 계단·복도·엘리베이터 몫인 주거공용면적이 더해지면 33~34평 안팎이 됩니다.</p>
    <div class="bar" role="img" aria-label="전용면적 약 25.4평과 주거공용면적 약 8~9평을 더하면 공급면적 약 33~34평">
      <span class="b1" style="flex:25.4">전용 약 25.4평</span>
      <span class="b2" style="flex:8.5">주거공용 약 8~9평</span>
    </div>
    <div class="bar-cap"><span>전용면적 84㎡</span><span>공급면적 약 33~34평 → "34평형"</span></div>
    <div class="notebox"><b>주의:</b> 주거공용면적은 단지 설계(계단식·복도식, 동 구조 등)에 따라 달라서, 같은 전용 84㎡라도 32평형, 33평형, 34평형처럼 단지마다 다르게 표시됩니다. 정확한 값은 <b>분양 공고문</b>이나 <b>건축물대장(집합건축물대장 전유부)</b>에서 확인하세요.</div>

    <h2>평수 계산 공식</h2>
    <p>평 = ㎡ × 121 ÷ 400, ㎡ = 평 × 400 ÷ 121 입니다. 빠르게 어림할 때는 ㎡에 0.3025를 곱하면 거의 같은 값이 나옵니다. 방 평수는 가로(m) × 세로(m)로 ㎡를 구한 뒤 평으로 바꾸면 됩니다.</p>

    <h2>평수 변환표</h2>
    <p>자주 찾는 평수를 ㎡로 바꾼 값입니다. 1평 = 400/121㎡로 계산해 소수 둘째 자리까지 적었습니다.</p>
    ${convTable()}

    <h2>3평, 5평은 실제로 어느 정도일까</h2>
    <p>숫자만으로는 감이 잘 오지 않는 작은 평수를 방 치수로 풀어 봤습니다.</p>
    ${sizeChips(null)}

    <h2>많이 찾는 아파트 면적</h2>
    <p>전용면적별로 평수와 흔히 부르는 평형을 따로 정리했습니다.</p>
    ${chips(null)}

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${RELATED}
  </section>
${FOOT}
<script>
const $ = id => document.getElementById(id);
// 1평 = 400/121㎡
const toPy = m2 => m2 * 121 / 400;
const toM2 = py => py * 400 / 121;
const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const fmt = (n, d = 2) => n.toLocaleString('ko-KR', {maximumFractionDigits: d, minimumFractionDigits: d});

// 1) ㎡ ↔ 평: 입력한 칸을 기준으로 다른 칸을 바꿈
function conv(from){
  if (from === 'py'){
    const v = parseFloat($('py').value);
    $('m2').value = isFinite(v) && v >= 0 ? r2(toM2(v)) : '';
  } else {
    const v = parseFloat($('m2').value);
    $('py').value = isFinite(v) && v >= 0 ? r2(toPy(v)) : '';
  }
}
['input','change'].forEach(ev => {
  $('m2').addEventListener(ev, () => conv('m2'));
  $('py').addEventListener(ev, () => conv('py'));
});

// 2) 방 크기 → ㎡·평
function calcRoom(){
  const k = $('unit').value === 'cm' ? 0.01 : 1;
  const w = (parseFloat($('rw').value) || 0) * k;
  const l = (parseFloat($('rl').value) || 0) * k;
  const area = Math.max(0, w * l);
  $('rM2').innerHTML = \`\${fmt(area)}<small>㎡</small>\`;
  $('rPy').innerHTML = \`\${fmt(toPy(area))}<small>평</small>\`;
  $('rDetail').innerHTML = area > 0
    ? \`가로 <b>\${fmt(w)}m</b> × 세로 <b>\${fmt(l)}m</b> = <b>\${fmt(area)}㎡</b> = <b>\${fmt(toPy(area))}평</b>\`
    : '가로와 세로를 넣어 주세요.';
  // 기존 계산기로 가로·세로를 넘김 (m 단위)
  const ok = w > 0 && l > 0;
  const q = ok ? \`?w=\${r2(w)}&l=\${r2(l)}\` : '';
  $('goWall').href = '/wallpaper/' + q;
  $('goTile').href = '/tile/' + q;
  $('goFloor').href = '/floor/' + q;
}
['rw','rl','unit'].forEach(id => ['input','change'].forEach(ev => $(id).addEventListener(ev, calcRoom)));

// 단위를 바꾸면 이미 넣은 값도 같이 바꿔 줌
let lastUnit = $('unit').value;
$('unit').addEventListener('change', () => {
  const u = $('unit').value;
  if (u === lastUnit) return;
  const k = u === 'cm' ? 100 : 0.01;
  ['rw','rl'].forEach(id => { const v = parseFloat($(id).value); if (isFinite(v)) $(id).value = r2(v * k); });
  lastUnit = u;
  calcRoom();
});

conv('m2');
calcRoom();
</script>
<script src="/common.js"></script>
</body>
</html>
`;
}

/* ---------------- 면적별: /pyeong/<n>/ ---------------- */
function areaPage(n) {
  const py = m2ToPyeong(n);
  const c = COMMON[n];
  const lo = py / RATIO_HIGH, hi = py / RATIO_LOW; // 공급면적(평) 추정 범위
  const title = c
    ? `${n}제곱미터 몇 평? 전용 ${f1(py)}평과 ${c.title} 차이 | 집 공사 계산기`
    : `${n}제곱미터 몇 평? 전용 ${f1(py)}평, 공급면적으로는 몇 평형일까 | 집 공사 계산기`;
  const desc = c
    ? `전용면적 ${n}㎡는 약 ${f2(py)}평입니다. 흔히 ${c.label}이라고 부르는 이유와 전용·공급면적 차이, 계산 과정을 정리했습니다.`
    : `전용면적 ${n}㎡는 약 ${f2(py)}평입니다. 공급면적 기준 평형은 단지마다 달라 대략 ${Math.round(lo)}~${Math.round(hi)}평 범위로 추정되며, 계산 과정과 확인 방법을 정리했습니다.`;
  const url = `https://jibcalc.com/pyeong/${n}/`;
  const others = AREAS.filter((x) => x !== n);

  const secondStat = c
    ? `<div class="stat"><div class="k">흔히 부르는 평형 <span class="tagline">대략값</span></div><div class="v">${c.label.replace('평형', '')}<small>평형</small></div></div>`
    : `<div class="stat"><div class="k">공급면적 추정 <span class="tagline">대략값</span></div><div class="v">${Math.round(lo)}~${Math.round(hi)}<small>평</small></div></div>`;

  const whyText = c
    ? `<p>${n}㎡를 평으로 바꾸면 약 ${f2(py)}평인데, 흔히 <b>${c.label}</b>이라고 부릅니다. 평형은 보통 전용면적이 아니라 전용면적에 계단·복도·엘리베이터 몫(주거공용면적)을 더한 <b>공급면적</b> 기준으로 말하기 때문입니다. 다만 이 값은 많이 쓰이는 대략적인 호칭이고, 실제 공급면적은 단지마다 다릅니다.</p>`
    : `<p>${n}㎡는 흔히 부르는 평형이 단지마다 달라 하나로 정하기 어렵습니다. 대신 공급면적 중 전용면적이 차지하는 비율(전용률)을 ${RATIO_LOW * 100}~${RATIO_HIGH * 100}%로 가정하면, 공급면적은 대략 <b>${Math.round(lo)}~${Math.round(hi)}평</b> 범위로 추정할 수 있습니다. 어디까지나 계산상의 추정치입니다.</p>`;

  const ratioRows = [0.70, 0.75, 0.80].map((r) => {
    const s = n / r;
    return `<tr><td>${Math.round(r * 100)}%</td><td>약 ${f0(s)}㎡</td><td>약 ${f1(m2ToPyeong(s))}평</td></tr>`;
  }).join('');

  return head({ title, desc, url }) + `  <header>
    ${BACK('/pyeong/', '평수 계산기로 돌아가기')}
    <h1>${n}㎡는 몇 평?</h1>
    <p>전용면적 ${n}㎡를 평으로 바꾸고, 흔히 말하는 평형과의 차이를 정리했습니다.</p>
  </header>

  <section class="card">
    <h2>한눈에 보기</h2>
    <div class="big">
      <div class="stat"><div class="k">전용 ${n}㎡</div><div class="v">${f2(py)}<small>평</small></div></div>
      ${secondStat}
    </div>
    <div class="notebox"><b>대략값입니다.</b> 공급면적과 평형은 단지·타입마다 다릅니다. 정확한 값은 분양 공고문이나 건축물대장(집합건축물대장 전유부)에서 확인하세요.</div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>${n}㎡ → 평 계산 과정</h2>
    <p>1평은 400/121㎡(약 3.3058㎡)이므로, ${n} × 121 ÷ 400 = <b>${f2(py)}평</b>입니다. 반대로 ${f2(py)}평을 ㎡로 바꾸면 다시 ${n}㎡가 됩니다.</p>

    <h2>왜 평형은 다르게 부를까</h2>
    ${whyText}
    ${AREA_MAP}

    <h2>전용률에 따라 공급면적은 이렇게 달라집니다</h2>
    <p>전용 ${n}㎡가 같아도 주거공용면적이 얼마나 붙느냐에 따라 공급면적이 달라집니다. 아래는 전용률을 가정해 계산한 값입니다.</p>
    <table>
      <thead><tr><th>전용률 가정</th><th>공급면적</th><th>평으로</th></tr></thead>
      <tbody>${ratioRows}</tbody>
    </table>
    <p>계산식: 공급면적 = 전용면적 ÷ 전용률. 실제 전용률은 단지마다 다르니 표는 감을 잡는 용도로만 보세요.</p>

    <h2>다른 면적도 보기</h2>
    ${chips(n)}
    <p style="margin-top:18px"><a class="btn primary" href="/pyeong/" style="text-decoration:none;display:inline-block">평수 계산기로 직접 계산하기</a></p>
  </article>

  <section class="related">
    <h2>방 크기를 알았다면 자재도 계산해 보세요</h2>
    ${RELATED}
  </section>
${FOOT}<script src="/common.js"></script>
</body>
</html>
`;
}

function sizePage(n) {
  const m2 = n * 400 / 121;
  const side = Math.sqrt(m2);
  const widths = [1.8, 2.4, 2.7, 3.0, 3.6, 4.2, 4.8, 5.4].filter((w) => m2 / w >= w * 0.6 && m2 / w <= w * 3);
  const ex = widths.slice(0, 3).map((w) => `가로 ${w.toFixed(1)}m × 세로 ${(m2 / w).toFixed(2)}m`);
  const sideCm = Math.round(side * 100);
  const q = `?w=${side.toFixed(2)}&l=${side.toFixed(2)}`;
  const title = `${n}평 크기는 어느 정도? ${f2(m2)}㎡를 방 치수로 보기 | 집 공사 계산기`;
  const desc = `${n}평은 약 ${f2(m2)}㎡입니다. 정사각형이면 한 변 약 ${side.toFixed(2)}m, 직사각형 방 치수 예시와 계산 방법, 도배·장판 수량까지 바로 이어서 계산해 보세요.`;
  const url = `https://jibcalc.com/pyeong/size-${n}/`;
  return head({ title, desc, url }) + `  <header>
    ${BACK('/pyeong/', '평수 계산기로 돌아가기')}
    <h1>${n}평 크기는 어느 정도?</h1>
    <p>${n}평을 ㎡와 실제 방 치수로 바꿔 봤습니다.</p>
  </header>

  <section class="card">
    <h2>한눈에 보기</h2>
    <div class="big">
      <div class="stat"><div class="k">${n}평</div><div class="v">${f2(m2)}<small>㎡</small></div></div>
      <div class="stat"><div class="k">정사각형이면 한 변</div><div class="v">${side.toFixed(2)}<small>m</small></div></div>
    </div>
    <div class="notebox"><b>방 치수로 보면</b> ${ex.join(' · ')} 정도가 ${n}평 안팎입니다.</div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>${n}평 → ㎡ 계산</h2>
    <p>1평은 400/121㎡(약 3.3058㎡)이므로 ${n} × 400 ÷ 121 = <b>${f2(m2)}㎡</b>입니다. 정사각형 방이라면 한 변이 약 ${sideCm}cm인 넓이예요.</p>

    <h2>1평이 3.3058㎡인 이유</h2>
    <p>평은 사방 6자(尺)인 정사각형 넓이에서 온 단위입니다. 1자를 10/33m로 정해 두었기 때문에 한 변은 60/33m(약 1.82m)이고, 넓이는 (60/33)² = 400/121㎡가 됩니다. ${n}평은 이 정사각형 ${n}개를 이어 붙인 넓이라고 생각하면 쉽습니다.</p>

    <h2>이 크기 방, 자재는 얼마나?</h2>
    <p>정사각형 방(한 변 ${side.toFixed(2)}m)으로 보고 바로 계산해 볼 수 있어요. 실제 방은 가로·세로를 재서 넣으세요.</p>
    <p><a class="btn primary" href="/wallpaper/${q}" style="text-decoration:none;display:inline-block">도배지 계산</a> <a class="btn" href="/floor/${q}" style="text-decoration:none;display:inline-block">장판·마루 계산</a> <a class="btn" href="/tile/${q}" style="text-decoration:none;display:inline-block">바닥 타일 계산</a></p>

    <h2>다른 크기도 보기</h2>
    ${sizeChips(n)}
    <p style="margin-top:18px"><a class="btn" href="/area/" style="text-decoration:none;display:inline-block">꺾인 방은 면적 계산기로</a> <a class="btn" href="/pyeong/" style="text-decoration:none;display:inline-block">평수 계산기로 돌아가기</a></p>
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${RELATED}
  </section>
${FOOT}<script src="/common.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(path.join(ROOT, 'pyeong'), { recursive: true });
for (const n of SIZES) {
  fs.mkdirSync(path.join(ROOT, `pyeong/size-${n}`), { recursive: true });
  fs.writeFileSync(path.join(ROOT, `pyeong/size-${n}/index.html`), sizePage(n));
}
fs.writeFileSync(path.join(ROOT, 'pyeong/index.html'), mainPage());
for (const n of AREAS) {
  fs.mkdirSync(path.join(ROOT, `pyeong/${n}`), { recursive: true });
  fs.writeFileSync(path.join(ROOT, `pyeong/${n}/index.html`), areaPage(n));
}
console.log('생성 완료: /pyeong/ +', AREAS.map((n) => `/pyeong/${n}/`).join(' '), '+', SIZES.map((n) => `/pyeong/size-${n}/`).join(' '));
module.exports = { AREAS, ICON_PYEONG };
