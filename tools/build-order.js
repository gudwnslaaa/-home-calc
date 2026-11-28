// 자재 목록(/order/) 생성: node tools/build-order.js
// 각 계산기에서 '자재 목록에 담기'로 모은 항목을 한곳에서 보고, 복사·인쇄·견적서로 보냄
const kit = require('./site-kit');

const EXTRA_STYLE = `<style>
.ol{display:grid;gap:10px}
.oi{border:1px solid var(--line);border-radius:12px;background:var(--card);padding:12px 14px}
.oi .top{display:flex;gap:10px;align-items:flex-start}
.oi .top b{font-size:1.02rem}
.oi .meta{color:var(--muted);font-size:.84rem;margin-top:2px;line-height:1.5}
.oi .meta a{font-size:.84rem}
.oi .q{display:flex;gap:8px;align-items:center;margin-top:10px}
.oi .q input{width:110px}
.oi .q span{color:var(--muted)}
.oi .x{margin-left:auto;min-width:44px;min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:1.1rem;cursor:pointer}
.oi .x.arm{color:#b3261e;border-color:#b3261e;font-size:.85rem}
.sum-list{margin:0;padding-left:18px}
.sum-list li{margin:2px 0}
.empty{padding:22px;border:1px dashed #b9beb6;border-radius:12px;text-align:center;color:var(--muted)}
.empty a{display:inline-block;margin:6px 6px 0}
@media print{
  body::before,header .back,.nav-btn,.no-print,.related,article,footer,.ad-slot,.sticky-bar,.reset-row,.actions,.basis{display:none!important}
  body{background:#fff} .card{border:0;box-shadow:none;padding:0}
  .result{--card:#fff;--ink:#111;--muted:#555;--line:#ccc;--soft:#fff;--accent:#111;background:#fff;color:#111}
  .result::before{display:none}
  .oi{break-inside:avoid}
}
</style>`;

const faq = [
  ['자재 목록에는 어떻게 담나요?', '타일·도배지·페인트·장판·뽁뽁이 계산기에서 결과가 나오면 ‘자재 목록에 담기’를 누르세요. 방마다 계산해서 담으면 여기에 차곡차곡 모입니다.'],
  ['같은 자재는 합쳐서 보여 주나요?', '이름과 단위가 같은 자재는 ‘합계’에 모아서 보여 줍니다. 박스·롤·통처럼 낱개 단위는 방마다 따로 계산해 올림한 값의 합이라, 한꺼번에 계산하면 조금 줄어들 수 있어요.'],
  ['목록은 어디에 저장되나요?', '이 기기의 브라우저에만 저장됩니다. 가게에 보낼 때는 ‘목록 복사’로 카톡에 붙여 넣거나 인쇄하세요.'],
];

const html = kit.head({
  title: '자재 목록 – 계산기에서 담은 타일·도배지·페인트·장판 수량 한곳에 모아 보기',
  desc: '방마다 계산한 자재 수량을 한곳에 모아 보고, 같은 자재는 합계로 정리합니다. 목록을 복사해 카톡으로 보내거나 인쇄하고, 견적서로 한 번에 보낼 수 있어요.',
  url: 'https://jibcalc.com/order/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 처음으로')}
    <h1>자재 목록</h1>
    <p>계산기에서 ‘자재 목록에 담기’를 누른 항목이 여기에 모여요. 가게에 보내거나 견적서로 옮기세요.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>담은 자재</h2>
    <div class="ol" id="ol"></div>
  </section>

  <section class="card result" data-plain="1" aria-live="polite">
    <h2>합계</h2>
    <div class="big">
      <div class="stat"><div class="k">담은 항목</div><div class="v" id="rN">0<small>개</small></div></div>
      <div class="stat"><div class="k">자재 종류</div><div class="v" id="rK">0<small>가지</small></div></div>
    </div>
    <div class="detail"><ul class="sum-list" id="rSum"></ul></div>
    <div class="actions no-print" style="margin-top:14px">
      <button type="button" class="btn primary" id="copyBtn">목록 복사 (카톡에 붙여넣기)</button>
      <button type="button" class="btn" id="estBtn">견적서로 모두 보내기</button>
      <button type="button" class="btn" id="printBtn">인쇄</button>
      <button type="button" class="btn ghost" id="clearBtn">목록 비우기</button>
    </div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>방마다 계산하고, 한 번에 주문하기</h2>
    <p>집 전체를 고칠 때는 방마다 크기와 자재가 달라서 계산기를 여러 번 쓰게 됩니다. 계산할 때마다 ‘자재 목록에 담기’를 눌러 두면 여기서 한 장으로 볼 수 있어요. 같은 타일을 여러 방에 쓴다면 합계를 보고 한 번에 주문하세요. 같은 생산 묶음(로트)으로 받아야 색 차이가 없습니다.</p>
    <p>시공하는 분이라면 ‘견적서로 모두 보내기’로 자재 항목을 견적서에 옮긴 뒤 단가만 채우면 됩니다.</p>
    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('order')}
  </section>
${kit.foot('수량은 각 계산기의 참고용 추정치입니다. 주문 전에 제품 규격과 현장 실측을 다시 확인하세요.')}
<script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CKEY = 'jibcalc-order';
let store = null; try { store = window.localStorage; } catch (e) {}
const read = () => { try { const a = JSON.parse(store.getItem(CKEY)); return Array.isArray(a) ? a.filter(x => x && x.name) : []; } catch (e) { return []; } };
const write = a => { try { store.setItem(CKEY, JSON.stringify(a)); } catch (e) {} };
const fmt = n => (Math.round(n * 100) / 100).toLocaleString('ko-KR');
function sums(list){
  const m = new Map();
  list.forEach(x => { const k = x.name + '|' + x.unit; m.set(k, { name: x.name, unit: x.unit, qty: (m.get(k) ? m.get(k).qty : 0) + (+x.qty || 0), n: (m.get(k) ? m.get(k).n : 0) + 1 }); });
  return [...m.values()];
}
function render(){
  const list = read();
  $('ol').innerHTML = list.length ? list.map((x, i) =>
    '<div class="oi"><div class="top"><div><b>' + esc(x.name) + '</b>' +
      '<div class="meta">' + (x.room ? esc(x.room) + ' · ' : '') + '<a href="' + esc(x.href) + '">' + esc(x.page) + '</a>' + (x.spec ? '<br>' + esc(x.spec) : '') + '</div></div>' +
      '<button type="button" class="x" data-del="' + i + '" aria-label="' + esc(x.name) + ' 빼기">×</button></div>' +
    '<div class="q"><input type="number" inputmode="decimal" min="0" step="any" value="' + esc(x.qty) + '" data-qty="' + i + '" aria-label="' + esc(x.name) + ' 수량"><span>' + esc(x.unit) + '</span></div></div>').join('')
    : '<div class="empty">아직 담은 자재가 없어요.<br><a href="/tile/">타일</a><a href="/wallpaper/">도배지</a><a href="/paint/">페인트</a><a href="/floor/">장판·마루</a><a href="/insulation/">뽁뽁이</a> 계산기에서 담아 보세요.</div>';
  renderSums(list);
}
function renderSums(list){
  const s = sums(list);
  $('rN').innerHTML = list.length + '<small>개</small>';
  $('rK').innerHTML = s.length + '<small>가지</small>';
  $('rSum').innerHTML = s.map(x => '<li><b>' + esc(x.name) + '</b> ' + fmt(x.qty) + esc(x.unit) + (x.n > 1 ? ' (' + x.n + '곳 합계)' : '') + '</li>').join('') || '<li>담은 자재가 없어요</li>';
}
function text(){
  const list = read();
  const lines = ['[자재 목록] jibcalc.com', ''];
  sums(list).forEach(x => lines.push('· ' + x.name + ' ' + fmt(x.qty) + x.unit + (x.n > 1 ? ' (' + x.n + '곳 합계)' : '')));
  lines.push('', '— 방별 —');
  list.forEach(x => lines.push('· ' + (x.room ? x.room + ' : ' : '') + x.name + ' ' + fmt(x.qty) + x.unit + (x.spec ? ' (' + x.spec + ')' : '')));
  return lines.join('\\n');
}
function toast2(msg){ let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); }
// 수량을 고치면 목록은 그대로 두고 합계만 다시 계산 (입력 중 커서 유지)
$('ol').addEventListener('input', e => { const i = e.target.dataset.qty; if (i == null) return; const a = read(); if (a[i]) { a[i].qty = parseFloat(e.target.value) || 0; write(a); renderSums(a); } });
$('ol').addEventListener('click', e => {
  const b = e.target.closest('[data-del]'); if (!b) return;
  if (b.dataset.arm !== '1') { b.dataset.arm = '1'; b.textContent = '빼기'; b.classList.add('arm'); setTimeout(() => { if (b.isConnected) { b.dataset.arm = ''; b.textContent = '×'; b.classList.remove('arm'); } }, 3000); return; }
  const a = read(); a.splice(+b.dataset.del, 1); write(a); render();
});
$('copyBtn').addEventListener('click', () => {
  if (!read().length) return toast2('담은 자재가 없어요');
  (navigator.clipboard ? navigator.clipboard.writeText(text()) : Promise.reject()).then(() => toast2('목록을 복사했어요. 카톡에 붙여 넣으세요'), () => toast2('복사하지 못했어요. 인쇄를 이용해 주세요'));
});
$('estBtn').addEventListener('click', () => {
  const list = read(); if (!list.length) return toast2('담은 자재가 없어요');
  try { store.setItem('jibcalc-estimate-inbox', JSON.stringify(list.map(x => ({ cat: x.cat, name: x.name + (x.room ? ' (' + x.room + ')' : ''), qty: x.qty, unit: x.unit, kind: '자재비' })))); } catch (e) {}
  location.href = '/estimate/';
});
$('printBtn').addEventListener('click', () => window.print());
$('clearBtn').addEventListener('click', () => {
  const b = $('clearBtn');
  if (b.dataset.arm !== '1') { b.dataset.arm = '1'; b.textContent = '한 번 더 누르면 비워요'; setTimeout(() => { b.dataset.arm = ''; b.textContent = '목록 비우기'; }, 3000); return; }
  write([]); b.dataset.arm = ''; b.textContent = '목록 비우기'; render();
});
window.addEventListener('storage', e => { if (e.key === CKEY) render(); });
render();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('order/index.html', html);
console.log('생성 완료: /order/');
