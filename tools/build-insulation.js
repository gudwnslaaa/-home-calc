// 창문 단열 계산기(/insulation/) 생성: node tools/build-insulation.js
const kit = require('./site-kit');
const im = require('./insul-math');

const EXTRA_STYLE = `<style>
.panes{display:grid;gap:10px}
.pn{display:grid;grid-template-columns:1.3fr 1fr 1fr 80px 44px;gap:8px;align-items:end;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}
.pn .x{height:44px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:1.1rem;cursor:pointer}
@media (max-width:560px){ .pn{grid-template-columns:1fr 1fr 70px 44px} .pn .nm{grid-column:1 / -1} }
.check{display:flex;align-items:center;gap:10px;margin-top:4px;font-size:.95rem;color:var(--ink);cursor:pointer;font-weight:500}
.check input{width:20px;height:20px;accent-color:#1c2024;margin:0}
.opt[hidden]{display:none}
.cut{margin-top:12px;font-size:.88rem;color:var(--muted)}
.cut li{margin:2px 0}
</style>`;

const faq = [
  ['뽁뽁이는 몇 롤 사야 하나요?', '유리 한 장마다 가로·세로를 재서 넣으면, 롤 폭으로 몇 조각을 잘라야 하는지 두 방향으로 계산해 덜 드는 쪽을 고르고, 그 조각들을 롤 길이에 나눠 담아 롤 수를 셉니다. 창틀이 아니라 유리 크기를 재는 게 핵심이에요.'],
  ['뽁뽁이는 어떻게 붙이나요?', '유리를 닦고 분무기로 물을 뿌린 뒤, 오돌토돌한 면을 유리 쪽으로 대고 붙이는 제품이 많습니다. 물 없이 붙이는 제품도 있으니 포장의 설명을 따르세요. 유리보다 조금 작게 잘라야 창틀에 걸려 들뜨지 않습니다.'],
  ['뽁뽁이만 붙이면 결로가 없어지나요?', '유리 표면이 덜 차가워져 결로가 줄어들 수 있지만, 실내 습도가 높고 환기를 안 하면 남을 수 있습니다. 질병관리청은 겨울철 실내 습도 40~60%를 권하고, 국토교통부는 하루 2~3번 환기를 권합니다.'],
  ['문풍지는 어디에 붙이나요?', '창짝과 창틀이 만나는 틈, 창짝끼리 겹치는 부분처럼 바람이 새는 곳에 붙입니다. 이 계산기는 유리 둘레를 기준으로 대략적인 길이를 잡으니, 실제로 바람이 새는 곳만 재서 넣으면 더 정확합니다.'],
];

const html = kit.head({
  title: '뽁뽁이 계산기 – 창문 단열 뽁뽁이 롤 수·문풍지·단열벽지 수량 계산',
  desc: '창문 유리 크기를 넣으면 단열 뽁뽁이가 몇 롤 필요한지, 어떻게 잘라야 하는지 재단표까지 알려 줍니다. 문풍지 길이와 결로 잦은 벽에 바를 단열벽지 롤 수도 함께 계산하세요.',
  url: 'https://jibcalc.com/insulation/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 · 전체 보기')}
    <h1>창문 단열 · 뽁뽁이 계산기</h1>
    <p>유리 크기만 넣으면 뽁뽁이 롤 수와 자를 크기, 문풍지·단열벽지 수량까지 나옵니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>유리 크기 (가로 × 세로, m)</h2>
    <div class="panes" id="panes"></div>
    <button class="add" type="button" id="addPane">+ 유리 추가</button>
    <p class="hint">창틀이 아니라 <b>유리 한 장</b>의 크기를 재세요. 미닫이 창은 보통 유리가 두 장이니 장수에 2를 넣으면 돼요. cm로 넣어도 m로 바뀝니다.</p>
  </section>

  <section class="card">
    <h2><span class="num">2</span>뽁뽁이 규격</h2>
    <div class="grid g3">
      <div><label for="bw">롤 폭 (m)</label><input id="bw" type="number" inputmode="decimal" step="0.05" min="0.1" value="1"></div>
      <div><label for="bl">롤 길이 (m)</label>
        <select id="bl"><option value="2">2m</option><option value="5" selected>5m</option><option value="10">10m</option><option value="20">20m</option><option value="custom">직접 입력</option></select></div>
      <div><label for="bm">조각마다 여유 (cm)</label><input id="bm" type="number" inputmode="decimal" min="0" value="0"></div>
    </div>
    <div id="blBox" class="opt" hidden style="margin-top:12px"><label for="blc">롤 길이 직접 입력 (m)</label><input id="blc" data-unit="none" type="number" inputmode="decimal" min="0.5" step="0.5" value="5"></div>
    <div class="grid g2" style="margin-top:12px">
      <div><label for="bp">한 롤 가격 (원)</label><input id="bp" type="number" inputmode="numeric" min="0" placeholder="선택"></div>
    </div>
    <p class="hint">폭 1m 제품이 많지만 길이와 폭은 제품마다 달라요. 판매 페이지의 규격을 넣으세요. 뽁뽁이는 유리에 딱 맞거나 조금 작게 자르는 게 좋아서 여유는 기본 0으로 두었어요.</p>
  </section>

  <section class="card">
    <h2><span class="num">3</span>함께 계산할 것 (선택)</h2>
    <label class="check"><input id="useSeal" type="checkbox" checked> 문풍지</label>
    <div id="sealBox" class="opt">
      <div class="grid g2" style="margin-top:10px">
        <div><label for="sl">문풍지 한 개 길이 (m)</label><input id="sl" data-unit="none" type="number" inputmode="decimal" min="0.5" step="0.5" value="2"></div>
        <div><label for="sx">붙일 길이 직접 입력 (m)</label><input id="sx" data-unit="none" type="number" inputmode="decimal" min="0" step="0.1" placeholder="비우면 유리 둘레로 계산"></div>
      </div>
    </div>
    <div class="divider"></div>
    <label class="check"><input id="useWall" type="checkbox"> 결로 잦은 벽에 단열벽지</label>
    <div id="wallBox" class="opt" hidden>
      <div class="grid g2" style="margin-top:10px">
        <div><label for="ww">벽 너비 (m)</label><input id="ww" data-unit="m" type="number" inputmode="decimal" step="0.01" min="0" value="3"></div>
        <div><label for="wh">벽 높이 (m)</label><input id="wh" data-unit="m" type="number" inputmode="decimal" step="0.01" min="0" value="2.3"></div>
        <div><label for="wrw">제품 폭 (cm)</label><input id="wrw" type="number" inputmode="decimal" min="10" value="100"></div>
        <div><label for="wrl">제품 한 롤 길이 (m)</label><input id="wrl" data-unit="none" type="number" inputmode="decimal" min="0.5" step="0.5" value="10"></div>
      </div>
      <p class="hint">제품 폭과 길이는 예시값이에요. 사려는 제품의 규격으로 바꿔 넣으세요. 한 장씩 파는 시트형이라면 벽 면적을 장당 면적으로 나누면 됩니다.</p>
    </div>
  </section>

  <section class="card result" data-est="0" data-est-name="단열 뽁뽁이" data-est-cat="기타" aria-live="polite">
    <h2>계산 결과</h2>
    <div class="big">
      <div class="stat"><div class="k">뽁뽁이</div><div class="v" id="rRoll">0<small>롤</small></div></div>
      <div class="stat"><div class="k">문풍지</div><div class="v" id="rSeal">0<small>개</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
    <ol class="cut" id="rCut"></ol>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>재는 곳은 창틀이 아니라 유리</h2>
    <p>뽁뽁이를 사러 가기 전에 가장 많이 틀리는 게 창틀 크기를 재는 일입니다. 뽁뽁이는 유리에 붙이니까 유리 한 장 한 장의 가로·세로를 재야 해요. 거실 큰 창은 유리 두 장, 이중창이면 안쪽 창의 유리 두 장을 따로 셉니다. 재단표에 나온 크기대로 미리 잘라 두면 붙이는 시간이 확 줄어듭니다.</p>

    <h2>롤 수는 이렇게 셉니다</h2>
    <p>유리 한 장을 롤 폭으로 덮으려면 세로로 길게 잘라 옆으로 이어 붙이거나, 가로로 길게 잘라 위아래로 이어 붙여야 합니다. 이 계산기는 두 방향을 모두 계산해 뽁뽁이가 덜 드는 쪽을 고르고, 잘라야 할 조각들을 롤 길이에 나눠 담아 몇 롤이 필요한지 셉니다. 남는 자투리는 작은 창이나 현관문 유리에 쓰면 됩니다.</p>

    <h2>붙이는 순서</h2>
    <ul>
      <li>유리를 닦아 먼지와 기름기를 없앱니다.</li>
      <li>재단표대로 뽁뽁이를 자릅니다. 창틀에 걸리지 않게 유리보다 살짝 작게 자르는 게 좋아요.</li>
      <li>분무기로 유리에 물을 뿌리고, 오돌토돌한 면을 유리 쪽으로 대고 붙인 뒤 손바닥으로 기포를 밀어냅니다. 물 없이 붙이는 제품은 포장 설명을 따르세요.</li>
      <li>창짝과 창틀 사이 바람이 새는 틈에 문풍지를 붙입니다.</li>
    </ul>

    <h2>결로까지 줄이려면</h2>
    <p>결로는 차가운 유리나 벽에 습한 실내 공기가 닿을 때 생깁니다. 뽁뽁이로 유리 표면 온도를 올리는 것과 함께 습도를 낮추는 게 짝을 이뤄야 효과가 납니다. 질병관리청은 겨울철 실내 온도 18~20℃, 습도 40~60%를 권하고, 국토교통부는 하루 2~3번 환기와 요리·샤워 뒤 환기를 권합니다. 북쪽 벽이나 붙박이장 뒤처럼 결로가 반복되는 벽은 단열벽지를 바르기 전에 곰팡이부터 닦고 완전히 말리세요. 벽지 전체를 새로 바를 계획이라면 <a href="/wallpaper/">도배지 계산기</a>도 함께 보세요.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('insulation')}
  </section>
${kit.foot('결과는 참고용입니다. 뽁뽁이·단열벽지 규격은 제품마다 다르니 판매 페이지의 값으로 다시 확인하세요.')}
<script>
${im.inline()}
const $ = id => document.getElementById(id);
const fmt = (n, d = 0) => n.toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'jibcalc-insulation-v1';
let store = null; try { store = window.localStorage; } catch (e) {}
const m = v => { v = parseFloat(v) || 0; return v >= 1000 ? v / 1000 : v >= 30 ? v / 100 : v; }; // 1000 이상 mm, 30 이상 cm

function addPane(v = {}){
  const el = document.createElement('div');
  el.className = 'pn';
  el.innerHTML =
    '<div class="nm"><label>이름</label><input class="name" type="text" aria-label="이름" placeholder="예) 거실 큰 창"></div>' +
    '<div><label>가로 (m)</label><input class="w" type="number" inputmode="decimal" step="0.01" min="0" aria-label="가로 (m)"></div>' +
    '<div><label>세로 (m)</label><input class="h" type="number" inputmode="decimal" step="0.01" min="0" aria-label="세로 (m)"></div>' +
    '<div><label>장수</label><input class="c" type="number" inputmode="numeric" step="1" min="1" aria-label="장수"></div>' +
    '<button type="button" class="x" aria-label="유리 삭제">×</button>';
  el.querySelector('.name').value = v.name || '';
  el.querySelector('.w').value = v.w ?? '';
  el.querySelector('.h').value = v.h ?? '';
  el.querySelector('.c').value = v.c ?? 1;
  el.querySelector('.x').addEventListener('click', () => { el.remove(); calc(); });
  el.querySelectorAll('.w,.h').forEach(i => i.addEventListener('change', () => { const x = parseFloat(i.value); if (x >= 30) { i.value = m(x); calc(); } }));
  $('panes').appendChild(el);
}
function panes(){
  return [...document.querySelectorAll('.pn')].map(el => ({
    name: el.querySelector('.name').value.trim(), w: m(el.querySelector('.w').value), h: m(el.querySelector('.h').value),
    count: Math.max(0, Math.round(parseFloat(el.querySelector('.c').value) || 0)),
  }));
}
function calc(){
  $('blBox').hidden = $('bl').value !== 'custom';
  $('sealBox').hidden = !$('useSeal').checked;
  $('wallBox').hidden = !$('useWall').checked;
  const rw = parseFloat($('bw').value) || 0;
  const L = $('bl').value === 'custom' ? (parseFloat($('blc').value) || 0) : parseFloat($('bl').value);
  const margin = (parseFloat($('bm').value) || 0) / 100;
  const list = panes();
  const r = rw > 0 && L > 0 ? bubble(list, rw, L, margin) : { pieces: [], rolls: 0, area: 0, plan: [], total: 0 };
  const parts = [];
  let warn = '';
  if (r.rolls === null) { warn = '롤 길이보다 긴 조각이 있어요. 더 긴 롤을 고르거나 유리 크기를 확인하세요.'; }
  $('rRoll').innerHTML = (r.rolls || 0) + '<small>롤</small>';
  if (r.area > 0) {
    parts.push('유리 면적 <b>' + fmt(r.area, 2) + '㎡</b> · 자를 조각 ' + r.pieces.length + '개, 총 <b>' + fmt(r.total, 1) + 'm</b> (폭 ' + rw + 'm · 롤 ' + L + 'm 기준)');
    const price = parseFloat($('bp').value) || 0;
    if (price > 0 && r.rolls) parts.push('예상 뽁뽁이 비용 <b>' + fmt(r.rolls * price) + '원</b>');
  }
  // 문풍지
  let seal = 0;
  if ($('useSeal').checked) {
    const per = parseFloat($('sl').value) || 0;
    const manual = parseFloat($('sx').value);
    const need = manual > 0 ? manual : list.reduce((s, p) => s + (p.w > 0 && p.h > 0 ? 2 * (p.w + p.h) * p.count : 0), 0);
    seal = per > 0 ? Math.ceil(need / per - 1e-9) : 0;
    if (need > 0) parts.push('문풍지 붙일 길이 <b>' + fmt(need, 1) + 'm</b>' + (manual > 0 ? '' : ' (유리 둘레 기준 대략값)') + ' → ' + per + 'm짜리 ' + seal + '개');
  }
  $('rSeal').innerHTML = seal + '<small>개</small>';
  // 단열벽지
  if ($('useWall').checked) {
    const w = wallRolls(m($('ww').value), m($('wh').value), (parseFloat($('wrw').value) || 0) / 100, parseFloat($('wrl').value) || 0, 0.05);
    if (w.rolls === null) parts.push('단열벽지: 벽 높이가 한 롤 길이보다 길어요. 규격을 확인하세요.');
    else if (w.rolls) parts.push('단열벽지 <b>' + w.rolls + '롤</b> (' + w.strips + '폭, 폭마다 위아래 여유 5cm 포함)');
  }
  if (warn) parts.push('<span style="color:#ffb3a0">' + warn + '</span>');
  $('rDetail').innerHTML = parts.length ? parts.join('<br>') : '유리 크기를 넣어 주세요.';
  // 재단표
  $('rCut').innerHTML = r.plan.length ? r.plan.map(p =>
    '<li>' + esc(p.name || '유리') + ' ' + fmt(p.w, 2) + '×' + fmt(p.h, 2) + 'm ' + p.count + '장 → ' + p.dir + ' <b>' + fmt(p.len, 2) + 'm</b>짜리 ' + (p.n * p.count) + '조각' + (p.n > 1 ? ' (한 장에 ' + p.n + '조각 이어 붙임)' : '') + '</li>').join('') : '';
  save();
}
function save(){
  if (!store) return;
  const d = { panes: [...document.querySelectorAll('.pn')].map(el => ({ name: el.querySelector('.name').value, w: el.querySelector('.w').value, h: el.querySelector('.h').value, c: el.querySelector('.c').value })), f: {} };
  ['bw', 'bl', 'blc', 'bm', 'bp', 'sl', 'sx', 'ww', 'wh', 'wrw', 'wrl'].forEach(id => d.f[id] = $(id).value);
  ['useSeal', 'useWall'].forEach(id => d.f[id] = $(id).checked);
  try { store.setItem(KEY, JSON.stringify(d)); } catch (e) {}
}
function load(){
  let d = null; try { d = store && JSON.parse(store.getItem(KEY)); } catch (e) {}
  if (!d || !Array.isArray(d.panes) || !d.panes.length) return false;
  d.panes.forEach(addPane);
  Object.entries(d.f || {}).forEach(([id, v]) => { const el = $(id); if (!el) return; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; });
  return true;
}
$('addPane').addEventListener('click', () => { addPane(); calc(); });
document.addEventListener('click', e => { if (e.target.closest('[data-a="reset"]') && store) { try { store.removeItem(KEY); } catch (err) {} } }, true);
document.addEventListener('input', calc);
document.addEventListener('change', calc);
if (!load()) {
  addPane({ name: '거실 큰 창', w: 1.2, h: 2.1, c: 2 });
  addPane({ name: '안방 창', w: 0.9, h: 1.2, c: 2 });
}
calc();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('insulation/index.html', html);
console.log('생성 완료: /insulation/');
