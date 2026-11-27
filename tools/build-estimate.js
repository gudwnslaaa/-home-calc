// 견적서 작성기(/estimate/) 생성: node tools/build-estimate.js
// 항목·업체 정보는 이 기기(localStorage)에만 저장. 서버로 보내지 않음.
const kit = require('./site-kit');
const mm = require('./money-math');

const CATS = ['철거', '설비', '전기', '목공', '타일', '도장', '도배', '바닥', '욕실', '주방', '창호', '조명', '가구', '청소', '폐기물', '기타'];
const UNITS = ['식', '㎡', '평', 'm', '개', '박스', '롤', 'L', '통', '장', '일', '인', '품', '회'];

const EXTRA_STYLE = `<style>
.items{display:grid;gap:10px}
.it{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--field)}
.it .r1{display:grid;grid-template-columns:110px 1fr 36px;gap:8px;align-items:end}
.it .r2{display:grid;grid-template-columns:90px 80px 1fr 100px;gap:8px;margin-top:8px;align-items:end}
.it .amt{margin-top:8px;font-size:.85rem;color:var(--muted);text-align:right}
.it .amt b{color:var(--ink);font-weight:600}
.it .x{height:44px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:1.1rem;cursor:pointer}
@media (max-width:560px){ .it .r1{grid-template-columns:96px 1fr 36px} .it .r2{grid-template-columns:1fr 1fr} }
.g2x{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:560px){ .g2x{grid-template-columns:1fr} }
textarea{width:100%;min-height:84px;border-radius:12px;border:1px solid var(--line);background:var(--field);color:var(--ink);padding:10px 12px;font:inherit;font-size:.92rem;resize:vertical;box-sizing:border-box}
.tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.kor{font-size:.85rem;color:var(--muted);margin-top:6px}
.imported{border-color:var(--accent)}
/* 견적서 미리보기 (흰 종이) */
#sheetWrap{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:50;overflow:auto;padding:16px}
#sheetWrap[hidden]{display:none}
.sheetbar{max-width:794px;margin:0 auto 10px;display:flex;gap:8px;justify-content:flex-end}
#sheet{max-width:794px;margin:0 auto;background:#fff;color:#111;padding:40px 36px;border-radius:6px;font-size:13px;line-height:1.55;box-sizing:border-box}
#sheet h1{font-size:26px;letter-spacing:.5em;text-align:center;margin:0 0 22px;color:#111}
#sheet table{width:100%;border-collapse:collapse}
#sheet td,#sheet th{border:1px solid #999;padding:6px 7px;vertical-align:top}
#sheet th{background:#f1f1f1;font-weight:600;white-space:nowrap}
#sheet .info td{border:0;padding:2px 0}
#sheet .num{text-align:right;white-space:nowrap}
#sheet .sum{margin:16px 0;padding:10px 12px;border:2px solid #111;font-size:15px}
#sheet .sum b{font-size:17px}
#sheet .memo{white-space:pre-wrap;border:1px solid #999;padding:8px 10px;margin-top:14px}
#sheet .grp td{background:#fafafa;font-weight:600}
#sheet .foot{margin-top:18px;color:#666;font-size:11px;text-align:right}
@media (max-width:560px){ #sheet{padding:22px 14px;font-size:11.5px} #sheet h1{font-size:21px} }
@media print{
  @page{size:A4;margin:12mm}
  body{background:#fff!important}
  body *{visibility:hidden}
  #sheetWrap,#sheetWrap *{visibility:visible}
  #sheetWrap{position:absolute;inset:0;background:#fff;padding:0;overflow:visible}
  .sheetbar{display:none}
  #sheet{max-width:none;padding:0;border-radius:0}
}
</style>`;

const faq = [
  ['인테리어 견적서에는 무엇을 적어야 하나요?', '공종별 항목(철거·설비·목공·타일·도배 등), 품명과 규격, 수량과 단위, 단가와 금액, 그리고 공급가액·부가세·합계를 나눠 적는 게 기본입니다. 견적 유효기간, 결제 조건, 견적에 포함되지 않은 공사도 함께 적어 두면 나중에 다툼이 줄어듭니다.'],
  ['견적서를 PDF로 저장하려면?', '‘견적서 보기’를 누른 뒤 ‘인쇄 · PDF 저장’을 누르고, 인쇄 창에서 대상(프린터)을 ‘PDF로 저장’으로 고르면 됩니다. 휴대폰은 인쇄 화면에서 공유 버튼으로 PDF를 보낼 수 있어요.'],
  ['넣은 내용은 어디에 저장되나요?', '지금 쓰는 기기의 브라우저 안에만 저장되고 서버로 보내지 않습니다. 다른 기기에서는 보이지 않으니, 완성한 견적서는 PDF로 저장해 두세요. ‘입력 초기화’를 누르면 지워집니다.'],
  ['공과잡비는 몇 %로 잡나요?', '정해진 비율은 없고 업체와 공사 규모에 따라 다릅니다. 이 계산기는 직접 넣은 비율만 적용하고, 0%로 두면 넣지 않습니다.'],
];

const html = kit.head({
  title: '견적서 작성기 – 인테리어·공사 견적서 양식 무료 작성, 부가세 자동 계산·PDF 저장',
  desc: '공종별 항목과 수량·단가를 넣으면 공급가액·부가세·합계와 한글 금액이 자동으로 계산되는 무료 인테리어 견적서 양식입니다. 로그인 없이 바로 작성하고 PDF로 저장하세요.',
  url: 'https://jibcalc.com/estimate/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 · 전체 보기')}
    <h1>견적서 작성기</h1>
    <p>항목만 넣으면 합계·부가세·한글 금액까지 정리된 견적서가 나옵니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>견적 항목</h2>
    <datalist id="catList">${CATS.map((c) => `<option value="${c}">`).join('')}</datalist>
    <datalist id="unitList">${UNITS.map((u) => `<option value="${u}">`).join('')}</datalist>
    <div class="items" id="items"></div>
    <button class="add" type="button" id="addItem">+ 항목 추가</button>
    <p class="hint">처음 보이는 세 줄은 쓰는 법을 보여 주는 예시예요. 지우고 새로 넣으세요. 타일·도배·페인트·바닥 계산기 결과에서 ‘견적서에 담기’를 누르면 수량이 여기로 들어와요.</p>
  </section>

  <section class="card">
    <h2><span class="num">2</span>금액 조정</h2>
    <div class="grid g2">
      <div><label for="vatm">부가세</label>
        <select id="vatm"><option value="add" selected>별도 (10% 더하기)</option><option value="incl">포함 (단가에 이미 포함)</option><option value="none">없음</option></select></div>
      <div><label for="misc">공과잡비·관리비 (%)</label><input id="misc" type="number" inputmode="decimal" min="0" step="0.5" value="0"></div>
      <div><label for="disc">할인 (원)</label><input id="disc" type="number" inputmode="numeric" min="0" step="1000" value="0"></div>
      <div><label for="cut">끝자리 정리</label>
        <select id="cut"><option value="0" selected>안 함</option><option value="1000">천 원 미만 버림</option><option value="10000">만 원 미만 버림</option><option value="100000">십만 원 미만 버림</option></select></div>
    </div>
  </section>

  <section class="card">
    <h2><span class="num">3</span>견적서에 들어갈 정보 <small style="color:var(--muted);font-weight:400">(선택)</small></h2>
    <div class="g2x">
      <div><label for="coName">업체명</label><input id="coName" type="text" placeholder="예: OO인테리어"></div>
      <div><label for="coTel">담당자 · 연락처</label><input id="coTel" type="text" placeholder="예: 홍길동 010-0000-0000"></div>
      <div><label for="cuName">고객명</label><input id="cuName" type="text" placeholder="예: OOO 고객님"></div>
      <div><label for="site">공사 현장</label><input id="site" type="text" placeholder="예: OO아파트 101동 (32평)"></div>
      <div><label for="edate">견적일</label><input id="edate" type="date"></div>
      <div><label for="valid">유효기간 (일)</label><input id="valid" type="number" inputmode="numeric" min="0" step="1" value="30"></div>
    </div>
    <label for="memo" style="margin-top:10px">특이사항 · 결제 조건</label>
    <textarea id="memo" placeholder="예) 계약금·중도금·잔금 비율, 견적에 포함되지 않은 공사, 자재 변경 시 금액 조정 등"></textarea>
  </section>

  <section class="card result" aria-live="polite">
    <h2>견적 합계</h2>
    <div class="big grid g3">
      <div class="stat"><div class="k">공급가액</div><div class="v" id="rS">0<small>원</small></div></div>
      <div class="stat"><div class="k">부가세</div><div class="v" id="rT">0<small>원</small></div></div>
      <div class="stat"><div class="k">합계</div><div class="v" id="rA">0<small>원</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
    <div class="tools">
      <button type="button" class="btn primary" id="viewBtn">견적서 보기 · PDF 저장</button>
      <button type="button" class="btn" id="tsvBtn">엑셀용 표 복사</button>
    </div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <div id="sheetWrap" hidden>
    <div class="sheetbar"><button type="button" class="btn primary" id="printBtn">인쇄 · PDF 저장</button><button type="button" class="btn" id="closeBtn">닫기</button></div>
    <div id="sheet"></div>
  </div>

  <article>
    <h2>견적서, 금액보다 먼저 보는 것</h2>
    <p>고객은 합계를 먼저 보지만, 나중에 문제가 되는 건 대개 ‘어디까지가 견적에 들어 있었나’입니다. 철거 후 폐기물 처리, 자재 운반, 엘리베이터 보양 같은 항목이 빠져 있으면 공사 중간에 추가 금액 이야기가 나오고 서로 얼굴을 붉히게 돼요. 항목을 공종별로 나누고, 빠진 공사는 특이사항에 “별도”라고 적어 두는 것만으로도 분쟁이 크게 줄어듭니다.</p>

    <h2>이 견적서 작성기로 할 수 있는 것</h2>
    <ul>
      <li>공종·품명·수량·단위·단가를 넣으면 항목별 금액과 공종별 소계를 자동 계산</li>
      <li>부가세 별도·포함·없음 선택, 공과잡비(%)·할인·끝자리 정리</li>
      <li>합계를 ‘일금 ○○원정’ 한글 표기로 함께 표시</li>
      <li>흰 종이 양식으로 보기 → 인쇄 또는 PDF 저장, 엑셀에 붙여 넣을 표 복사</li>
    </ul>
    <p>수량을 뽑을 땐 <a href="/tile/">타일</a>, <a href="/wallpaper/">도배지</a>, <a href="/paint/">페인트</a>, <a href="/floor/">장판·마루</a> 계산기를, 인건비는 <a href="/labor/">인건비·3.3% 계산기</a>를, 부가세만 따로 확인할 땐 <a href="/vat/">부가세 계산기</a>를 쓰세요.</p>

    <h2>고객 입장에서 견적서를 비교할 때</h2>
    <p>업체마다 항목을 묶는 방식이 달라 합계만 비교하면 틀리기 쉽습니다. 같은 공종끼리 줄을 맞춰 보고, ‘VAT 별도’인지, 폐기물·운반·청소가 들어 있는지부터 확인하세요. 받은 견적서를 이 양식에 옮겨 적어 보면 빠진 항목이 바로 눈에 띕니다.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('estimate')}
  </section>
${kit.foot('견적서 양식과 계산은 참고용입니다. 실제 계약 조건은 업체와 고객이 함께 확인하세요.')}
<script>
${mm.inline()}
const $ = id => document.getElementById(id);
const won = n => Math.round(n).toLocaleString('ko-KR');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'jibcalc-estimate-v1';
const FIELDS = ['vatm', 'misc', 'disc', 'cut', 'coName', 'coTel', 'cuName', 'site', 'edate', 'valid', 'memo'];
let store = null;
try { store = window.localStorage; } catch (e) {}

function addItem(v = {}, mark){
  const el = document.createElement('div');
  el.className = 'it' + (mark ? ' imported' : '');
  el.innerHTML =
    '<div class="r1">' +
      '<div><label>공종</label><input class="cat" list="catList" type="text" placeholder="예: 타일"></div>' +
      '<div><label>품명 · 규격</label><input class="name" type="text" placeholder="예: 욕실 벽 300×600 포세린"></div>' +
      '<button type="button" class="x" aria-label="항목 삭제">×</button>' +
    '</div>' +
    '<div class="r2">' +
      '<div><label>수량</label><input class="qty" type="number" inputmode="decimal" min="0" step="any"></div>' +
      '<div><label>단위</label><input class="unit" list="unitList" type="text" placeholder="식"></div>' +
      '<div><label>단가 (원)</label><input class="price" type="number" inputmode="numeric" min="0" step="any"></div>' +
      '<div><label>구분</label><select class="kind"><option>자재비</option><option>인건비</option><option>경비</option></select></div>' +
    '</div>' +
    '<div class="amt"></div>';
  el.querySelector('.cat').value = v.cat || '';
  el.querySelector('.name').value = v.name || '';
  el.querySelector('.qty').value = v.qty ?? '';
  el.querySelector('.unit').value = v.unit || '';
  el.querySelector('.price').value = v.price ?? '';
  if (v.kind) el.querySelector('.kind').value = v.kind;
  el.querySelector('.x').addEventListener('click', () => { el.remove(); calc(); });
  $('items').appendChild(el);
  return el;
}

function readItems(){
  return [...document.querySelectorAll('.it')].map(el => {
    const g = c => el.querySelector(c).value;
    const qty = parseFloat(g('.qty')) || 0, price = parseFloat(g('.price')) || 0;
    return { el, cat: g('.cat').trim(), name: g('.name').trim(), qty: g('.qty'), unit: g('.unit').trim(), price: g('.price'), kind: g('.kind'), amount: Math.round(qty * price) };
  });
}

function compute(){
  const items = readItems();
  const base = items.reduce((s, i) => s + i.amount, 0);
  const miscPct = Math.max(0, parseFloat($('misc').value) || 0);
  const misc = Math.round(base * miscPct / 100);
  const disc = Math.max(0, parseFloat($('disc').value) || 0);
  const cut = parseInt($('cut').value, 10) || 0;
  const vm = $('vatm').value;
  let pre = Math.max(0, base + misc - disc);   // 조정 후 금액 (부가세 포함 여부는 vm 기준)
  let supply, tax, total, cutAmt = 0;
  if (vm === 'add') {
    supply = cut ? Math.floor(pre / cut) * cut : pre; cutAmt = pre - supply;
    const r = vat(supply, 'add'); tax = r.tax; total = r.total;
  } else if (vm === 'incl') {
    total = cut ? Math.floor(pre / cut) * cut : pre; cutAmt = pre - total;
    const r = vat(total, 'split'); supply = r.supply; tax = r.tax;
  } else {
    supply = cut ? Math.floor(pre / cut) * cut : pre; cutAmt = pre - supply; tax = 0; total = supply;
  }
  const byCat = {}, byKind = {};
  items.forEach(i => { if (!i.amount) return; const c = i.cat || '기타'; byCat[c] = (byCat[c] || 0) + i.amount; byKind[i.kind] = (byKind[i.kind] || 0) + i.amount; });
  return { items, base, miscPct, misc, disc, cut, cutAmt, vm, supply, tax, total, byCat, byKind };
}

function calc(){
  const c = compute();
  c.items.forEach(i => { i.el.querySelector('.amt').innerHTML = i.amount ? '금액 <b>' + won(i.amount) + '원</b>' : ''; });
  $('rS').innerHTML = won(c.supply) + '<small>원</small>';
  $('rT').innerHTML = won(c.tax) + '<small>원</small>';
  $('rA').innerHTML = won(c.total) + '<small>원</small>';
  const parts = [];
  if (c.base) {
    parts.push('항목 ' + c.items.filter(i => i.amount).length + '개 합계 ' + won(c.base) + '원');
    const kinds = Object.entries(c.byKind).map(([k, v]) => k + ' ' + won(v) + '원');
    if (kinds.length > 1) parts.push(kinds.join(' · '));
    const cats = Object.entries(c.byCat);
    if (cats.length > 1) parts.push('공종별: ' + cats.map(([k, v]) => k + ' ' + won(v)).join(' · '));
    if (c.misc) parts.push('공과잡비 ' + c.miscPct + '% +' + won(c.misc) + '원');
    if (c.disc) parts.push('할인 −' + won(c.disc) + '원');
    if (c.cutAmt) parts.push('끝자리 정리 −' + won(c.cutAmt) + '원');
    if (c.vm === 'incl') parts.push('단가에 부가세 포함으로 계산');
    if (c.vm === 'none') parts.push('부가세 없음');
    parts.push('합계 한글 표기: <b>일금 ' + hangul(c.total) + '원정</b>');
  }
  $('rDetail').innerHTML = parts.length ? parts.join('<br>') : '항목의 수량과 단가를 넣어 주세요.';
  save();
}

function save(){
  if (!store) return;
  const d = { f: {}, items: readItems().map(({ el, amount, ...rest }) => rest) };
  FIELDS.forEach(id => d.f[id] = $(id).value);
  try { store.setItem(KEY, JSON.stringify(d)); } catch (e) {}
}
function load(){
  let d = null;
  try { d = store && JSON.parse(store.getItem(KEY)); } catch (e) {}
  if (!d) return false;
  FIELDS.forEach(id => { if (d.f && d.f[id] != null) $(id).value = d.f[id]; });
  (d.items || []).forEach(v => addItem(v));
  return true;
}

// 다른 계산기에서 '견적서에 담기'로 넘어온 항목
function importFromUrl(){
  const q = new URLSearchParams(location.search);
  const name = (q.get('add') || '').slice(0, 60);
  const qty = parseFloat(q.get('qty'));
  if (!name || !(qty > 0)) return;
  const el = addItem({ cat: (q.get('cat') || '').slice(0, 20), name, qty: +qty.toFixed(2), unit: (q.get('unit') || '').slice(0, 10), kind: '자재비' }, true);
  history.replaceState(null, '', location.pathname);
  setTimeout(() => { el.scrollIntoView({ block: 'center' }); el.querySelector('.price').focus({ preventScroll: true }); }, 200);
}

function sheetHtml(){
  const c = compute();
  const rows = c.items.filter(i => i.name || i.amount);
  const d = $('edate').value ? new Date($('edate').value + 'T00:00:00') : new Date();
  const fmtD = x => x.getFullYear() + '년 ' + (x.getMonth() + 1) + '월 ' + x.getDate() + '일';
  const validDays = parseInt($('valid').value, 10);
  const until = validDays > 0 ? new Date(d.getTime() + validDays * 86400000) : null;
  let body = '', lastCat = null, no = 0;
  const sorted = rows.slice().sort((a, b) => 0); // 입력 순서 유지
  sorted.forEach(i => {
    const cat = i.cat || '기타';
    if (cat !== lastCat) { body += '<tr class="grp"><td colspan="6">' + esc(cat) + (c.byCat[cat] ? ' <span style="float:right">소계 ' + won(c.byCat[cat]) + '</span>' : '') + '</td></tr>'; lastCat = cat; }
    no++;
    body += '<tr><td class="num">' + no + '</td><td>' + esc(i.name) + '</td><td class="num">' + esc(i.qty) + '</td><td>' + esc(i.unit) + '</td><td class="num">' + (i.price !== '' ? won(+i.price) : '') + '</td><td class="num">' + (i.amount ? won(i.amount) : '') + '</td></tr>';
  });
  const extra = [];
  if (c.misc) extra.push(['공과잡비·관리비 (' + c.miscPct + '%)', won(c.misc)]);
  if (c.disc) extra.push(['할인', '−' + won(c.disc)]);
  if (c.cutAmt) extra.push(['끝자리 정리', '−' + won(c.cutAmt)]);
  extra.push(['공급가액', won(c.supply)]);
  if (c.vm !== 'none') extra.push(['부가세 (10%)', won(c.tax)]);
  extra.push(['합계', won(c.total)]);
  const memo = $('memo').value.trim();
  return '<h1>견 적 서</h1>' +
    '<table class="info"><tr><td style="width:55%">' +
      ($('cuName').value ? '<b>' + esc($('cuName').value) + '</b> 귀하<br>' : '') +
      ($('site').value ? '현장: ' + esc($('site').value) + '<br>' : '') +
      '견적일: ' + fmtD(d) + (until ? '<br>유효기간: ' + fmtD(until) + '까지' : '') +
    '</td><td style="text-align:right">' +
      ($('coName').value ? '<b>' + esc($('coName').value) + '</b><br>' : '') +
      ($('coTel').value ? esc($('coTel').value) : '') +
    '</td></tr></table>' +
    '<div class="sum">합계 금액: <b>일금 ' + hangul(c.total) + '원정</b> (₩' + won(c.total) + ')' + (c.vm === 'add' || c.vm === 'incl' ? ' · 부가세 포함' : '') + '</div>' +
    '<table><thead><tr><th style="width:34px">No</th><th>품명 · 규격</th><th style="width:56px">수량</th><th style="width:44px">단위</th><th style="width:90px">단가</th><th style="width:100px">금액</th></tr></thead><tbody>' + (body || '<tr><td colspan="6" style="text-align:center;color:#888">항목이 없습니다</td></tr>') +
      extra.map(([k, v]) => '<tr><td colspan="5" class="num"' + (k === '합계' ? ' style="font-weight:700"' : '') + '>' + k + '</td><td class="num"' + (k === '합계' ? ' style="font-weight:700"' : '') + '>' + v + '</td></tr>').join('') +
    '</tbody></table>' +
    (memo ? '<div class="memo"><b>특이사항</b>\\n' + esc(memo) + '</div>' : '') +
    '<div class="foot">jibcalc.com 견적서 작성기로 만들었습니다</div>';
}

function tsv(){
  const c = compute();
  const lines = [['공종', '품명·규격', '수량', '단위', '단가', '금액', '구분'].join('\\t')];
  c.items.filter(i => i.name || i.amount).forEach(i => lines.push([i.cat, i.name, i.qty, i.unit, i.price, i.amount || '', i.kind].map(x => String(x).replace(/[\\t\\n]/g, ' ')).join('\\t')));
  if (c.misc) lines.push(['', '공과잡비·관리비 ' + c.miscPct + '%', '', '', '', c.misc, ''].join('\\t'));
  if (c.disc) lines.push(['', '할인', '', '', '', -c.disc, ''].join('\\t'));
  if (c.cutAmt) lines.push(['', '끝자리 정리', '', '', '', -c.cutAmt, ''].join('\\t'));
  lines.push(['', '공급가액', '', '', '', c.supply, ''].join('\\t'));
  lines.push(['', '부가세', '', '', '', c.tax, ''].join('\\t'));
  lines.push(['', '합계', '', '', '', c.total, ''].join('\\t'));
  return lines.join('\\n');
}
function flash(msg){
  let t = document.querySelector('.est-toast');
  if (!t) { t = document.createElement('div'); t.className = 'est-toast'; t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--card);color:var(--ink);border:1px solid var(--line);padding:10px 16px;border-radius:12px;z-index:60;font-size:.9rem'; document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, 2200);
}

$('addItem').addEventListener('click', () => { addItem(); calc(); });
$('viewBtn').addEventListener('click', () => { $('sheet').innerHTML = sheetHtml(); $('sheetWrap').hidden = false; document.body.style.overflow = 'hidden'; });
$('closeBtn').addEventListener('click', () => { $('sheetWrap').hidden = true; document.body.style.overflow = ''; });
$('printBtn').addEventListener('click', () => window.print());
$('tsvBtn').addEventListener('click', () => {
  const text = tsv();
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
    () => flash('표를 복사했어요. 엑셀이나 구글 시트에 붙여 넣으세요'),
    () => flash('복사하지 못했어요. 견적서 보기에서 PDF로 저장해 주세요'));
});
// '입력 초기화'를 누르면 견적서 저장분도 지움 (common.js 버튼)
document.addEventListener('click', e => { const b = e.target.closest('[data-a="reset"]'); if (b && store) { try { store.removeItem(KEY); } catch (err) {} } }, true);
document.addEventListener('input', calc);
document.addEventListener('change', calc);

if (!load()) {
  addItem({ cat: '철거', name: '욕실 벽·바닥 타일 철거', qty: 1, unit: '식', price: 500000, kind: '인건비' });
  addItem({ cat: '타일', name: '벽 타일 300×600', qty: 12, unit: '박스', price: 28000, kind: '자재비' });
  addItem({ cat: '타일', name: '타일 시공', qty: 2, unit: '품', price: 300000, kind: '인건비' });
}
if (!$('edate').value) { const t = new Date(); $('edate').value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
importFromUrl();
calc();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('estimate/index.html', html);
console.log('생성 완료: /estimate/');
