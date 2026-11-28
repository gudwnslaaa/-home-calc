// 이사 체크리스트(/moving/) 생성: node tools/build-moving.js
const kit = require('./site-kit');

// [이사일 기준 날짜 차이, 할 일, 설명, 조건(tenant=세입자만), 링크]
const TASKS = [
  [-30, '이사 업체 견적 받기', '같은 조건(짐 양·층수·사다리차 여부)으로 여러 곳 견적을 받아 비교해요.', '', ''],
  [-30, '버릴 물건 고르기', '안 쓰는 가구·가전부터 골라 두면 짐도 이사 비용도 줄어요.', '', '/waste/'],
  [-28, '공사가 있다면 일정 짜기', '도배·바닥 등 공사가 있으면 이사 날짜에서 거꾸로 공사 순서를 잡아요.', '', '/schedule/'],
  [-21, '인터넷·TV 이전 신청', '이사 당일 바로 쓰려면 미리 날짜를 잡아 두는 게 좋아요.', '', ''],
  [-21, '학교·어린이집 옮길 준비', '아이가 있다면 옮길 곳에 필요한 서류와 시기를 문의해요.', '', ''],
  [-14, '대형폐기물 신고 · 폐가전 무상수거 예약', '구청·주민센터 대형폐기물 신고, 큰 가전은 무상 방문수거를 예약해요.', '', '/waste/'],
  [-14, '새 집 치수 재기 · 가구 배치 정하기', '방 크기, 문 폭, 창문 크기를 재고 가구가 들어가는지 확인해요.', '', '/room/'],
  [-10, '커튼·블라인드 · 조명 준비', '새 집 창문 치수로 맞춰 미리 주문해요.', '', ''],
  [-7, '관리사무소에 이사 날짜 알리기', '엘리베이터 사용과 이사 시간을 미리 예약해요.', '', ''],
  [-7, '도시가스 철거·연결 예약', '이사 나가는 집과 들어가는 집 모두 날짜를 잡아요.', '', ''],
  [-5, '전기·수도 요금 정산 신청', '나가는 날 기준으로 정산되게 각 공급사에 신청해요.', '', ''],
  [-5, '중요 서류·귀중품 따로 챙기기', '계약서, 통장, 보석, 상비약은 이삿짐과 섞지 말고 직접 들고 가요.', '', ''],
  [-3, '짐 싸기 시작', '자주 안 쓰는 물건부터 싸고, 상자마다 방 이름을 적어 두면 풀 때 편해요.', '', ''],
  [-2, '냉장고 음식 줄이기', '이사 전날 비울 수 있게 장보기를 멈춰요.', '', ''],
  [-1, '냉장고 비우기 · 세탁기 물 빼기', '냉장고는 전원을 끄고 물기를 닦아 두고, 세탁기는 남은 물을 빼 둬요.', '', ''],
  [-1, '이사 당일 가방 싸기', '세면도구, 충전기, 갈아입을 옷, 공구, 쓰레기봉투, 휴지를 한 가방에.', '', ''],
  [0, '계량기 숫자 사진 찍기', '나가는 집과 들어가는 집의 전기·수도·가스 계량기를 찍어 두면 정산할 때 확실해요.', '', ''],
  [0, '새 집 상태 사진 · 영상 남기기', '짐을 들이기 전에 벽·바닥·문의 흠집을 찍어 두세요.', '', ''],
  [0, '도어락 비밀번호 바꾸기', '들어간 날 바로 바꿔요.', '', ''],
  [0, '잔금 · 보증금 처리', '잔금을 치르고, 나가는 집은 보증금을 돌려받는지 확인해요.', '', ''],
  [0, '전입신고', '정부24에서 온라인으로 하거나 주민센터에 가서 할 수 있어요. 이사한 날 바로 하는 게 좋아요.', '', ''],
  [0, '확정일자 받기', '전월세라면 전입신고와 함께 임대차계약서에 확정일자를 받아 두세요. 인터넷등기소나 주민센터에서 할 수 있어요.', 'tenant', ''],
  [1, '우편물 주소 옮기기', '정부24 전입신고 때 함께 신청하거나 인터넷우체국의 주거이전 우편물 전송 서비스를 따로 신청해요.', '', ''],
  [3, '입주 청소 · 하자 확인', '청소하면서 수전·배수·문·창문이 제대로 되는지 확인하고 사진을 남겨요.', '', ''],
  [7, '은행·카드·보험 주소 바꾸기', '전입신고 하나로 모든 주소가 바뀌지는 않아요. 자주 쓰는 곳은 직접 바꿔요.', '', ''],
  [13, '전입신고 마감 (늦어도 이날까지)', '이사 후 14일 안에 해야 하고, 넘기면 과태료가 나올 수 있어요.', '', ''],
];

const EXTRA_STYLE = `<style>
.day{margin-top:18px}
.day h3{display:flex;align-items:baseline;gap:10px;font-size:1rem;margin:0 0 8px}
.day h3 .dd{display:inline-block;min-width:58px;padding:2px 8px;border-radius:6px;background:var(--tape);color:#1c2024;font-size:.82rem;font-weight:700;text-align:center}
.day h3 .dd.past{background:#d6dad3}
.day h3 .dt{color:var(--muted);font-weight:500;font-size:.9rem}
.tk{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--card);margin-top:6px;cursor:pointer}
.tk input{width:22px;height:22px;margin:2px 0 0;accent-color:#1c2024;flex:none}
.tk b{font-weight:600}
.tk p{margin:2px 0 0;color:var(--muted);font-size:.88rem;line-height:1.6}
.tk a{font-size:.86rem}
.tk.done{background:var(--soft)}
.tk.done b{text-decoration:line-through;color:var(--muted)}
.tk .rm{margin-left:auto;border:0;background:transparent;color:var(--muted);font-size:1.1rem;cursor:pointer;padding:0 4px}
.check{display:flex;align-items:center;gap:10px;font-size:.95rem;color:var(--ink);cursor:pointer;font-weight:500;margin-top:10px}
.check input{width:20px;height:20px;accent-color:#1c2024;margin:0}
.addrow{display:grid;grid-template-columns:120px 1fr auto;gap:8px;align-items:end;margin-top:12px}
@media (max-width:560px){ .addrow{grid-template-columns:1fr 1fr} .addrow .btn{grid-column:1 / -1} }
@media print{
  body::before,header .back,.card:not(.list-card),.result,.related,article,footer,.ad-slot,.sticky-bar,.no-print{display:none!important}
  body{background:#fff}
  .list-card{border:0;box-shadow:none;padding:0}
  .tk{break-inside:avoid}
}
</style>`;

const faq = [
  ['전입신고는 언제까지 해야 하나요?', '이사한 날부터 14일 안에 해야 하고, 정당한 사유 없이 넘기면 5만 원 이하의 과태료가 나올 수 있습니다. 정부24에서 온라인으로 하거나 새 주소지 주민센터에서 할 수 있어요.'],
  ['전월세라면 무엇을 꼭 챙겨야 하나요?', '이사한 날 바로 전입신고를 하고 임대차계약서에 확정일자를 받아 두세요. 집을 넘겨받고 전입신고까지 마치면 다음 날 0시부터 대항력이 생기고, 확정일자까지 받으면 우선변제권도 갖추게 됩니다.'],
  ['전입신고만 하면 주소가 다 바뀌나요?', '아닙니다. 우편물은 주거이전 우편물 전송 서비스를 따로 신청해야 하고, 은행·카드·보험처럼 자주 쓰는 곳은 직접 확인하는 게 안전합니다.'],
  ['체크한 내용은 저장되나요?', '이 기기의 브라우저에 저장되어 다시 들어오면 이어서 볼 수 있어요. ‘인쇄’로 종이에 뽑아 냉장고에 붙여 두어도 좋습니다.'],
];

const html = kit.head({
  title: '이사 체크리스트 – 이사 날짜만 넣으면 한 달 전부터 할 일 날짜별 정리',
  desc: '이사 날짜를 넣으면 업체 견적, 인터넷 이전, 대형폐기물, 가스·전기 정산, 전입신고·확정일자까지 이사 한 달 전부터 2주 뒤까지 할 일을 날짜별로 정리해 줍니다. 체크하면 저장되고 인쇄도 됩니다.',
  url: 'https://jibcalc.com/moving/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 처음으로')}
    <h1>이사 체크리스트</h1>
    <p>이사 날짜만 넣으면 한 달 전부터 이사 후 2주까지 할 일이 날짜별로 정리됩니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>이사 날짜</h2>
    <div class="grid g2">
      <div><label for="move">이사하는 날</label><input id="move" type="date"></div>
    </div>
    <label class="check"><input id="tenant" type="checkbox" checked> 전월세로 들어가요 (확정일자 챙기기)</label>
    <label class="check"><input id="hideDone" type="checkbox"> 끝낸 일 숨기기</label>
  </section>

  <section class="card result" aria-live="polite">
    <h2>진행 상황</h2>
    <div class="big">
      <div class="stat"><div class="k">끝낸 일</div><div class="v" id="rDone">0<small>/ 0</small></div></div>
      <div class="stat"><div class="k">이사까지</div><div class="v" id="rLeft">-<small>일</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <section class="card list-card">
    <h2 style="display:flex;align-items:center;gap:10px"><span class="num">2</span>날짜별 할 일 <button type="button" class="btn no-print" id="printBtn" style="margin-left:auto">인쇄</button></h2>
    <div id="list"></div>
    <div class="addrow no-print">
      <div><label for="newDay">이사일 기준 (일)</label><input id="newDay" type="number" inputmode="numeric" step="1" value="-3" min="-90" max="60"></div>
      <div><label for="newText">내 할 일 추가</label><input id="newText" type="text" placeholder="예: 에어컨 이전 설치 예약"></div>
      <button type="button" class="btn primary" id="addBtn">추가</button>
    </div>
    <p class="hint no-print">‘이사일 기준’은 이사 전이면 음수(-7은 일주일 전), 이사 후면 양수로 넣어요. 날짜는 참고용 권장 시점이에요.</p>
  </section>

  <article>
    <h2>이사 당일 꼭 남길 것: 계량기와 새 집 사진</h2>
    <p>짐이 들어가면 바닥 흠집이 원래 있던 건지 이삿짐에 생긴 건지 가리기 어렵습니다. 들어가자마자 벽·바닥·문을 사진과 영상으로 남기고, 나가는 집과 들어가는 집의 전기·수도·가스 계량기 숫자도 찍어 두세요. 정산할 때 말다툼이 없어집니다.</p>

    <h2>전입신고와 확정일자</h2>
    <p>전입신고는 이사한 날부터 14일 안에 해야 합니다. 정부24에서 온라인으로 하거나 주민센터에 직접 가서 할 수 있어요. 전월세라면 이사한 날 바로 전입신고를 하고 임대차계약서에 확정일자도 받아 두는 게 좋습니다. 집을 넘겨받고 전입신고까지 마치면 다음 날 0시부터 대항력이 생기고, 확정일자까지 갖추면 보증금을 먼저 돌려받을 수 있는 우선변제권도 생깁니다.</p>

    <h2>공사와 이사가 겹친다면</h2>
    <p>도배나 바닥 공사를 하고 들어간다면 <a href="/schedule/">공사·이사 일정표</a>로 이사 날짜에서 거꾸로 공사 순서를 잡고, 버릴 물건은 <a href="/waste/">폐기물 정리 도우미</a>로 무상수거와 대형폐기물을 나눠 두세요. 새 집에 가구가 들어가는지는 <a href="/room/">가구 배치 도우미</a>로 미리 확인할 수 있어요.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('moving')}
  </section>
${kit.foot('날짜는 권장 시점이에요. 기관별 신청 기한과 방법은 해당 기관 안내를 따르세요.')}
<script>
const TASKS = ${JSON.stringify(TASKS.map(([d, t, p, c, l], i) => ({ id: 'b' + i, d, t, p, c, l })))};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'jibcalc-moving-v1';
let store = null; try { store = window.localStorage; } catch (e) {}
let state = { done: {}, mine: [] };
const W = ['일', '월', '화', '수', '목', '금', '토'];
function iso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function fmt(d){ return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + W[d.getDay()] + ')'; }
function today(){ const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
function label(n){ return n === 0 ? '이사 당일' : n < 0 ? 'D' + n : 'D+' + n; }

function all(){
  const tenant = $('tenant').checked;
  return TASKS.filter(t => t.c !== 'tenant' || tenant).concat(state.mine).sort((a, b) => a.d - b.d);
}
function render(){
  const mv = $('move').value ? new Date($('move').value + 'T00:00:00') : null;
  const list = all();
  const now = today();
  const groups = {};
  list.forEach(t => (groups[t.d] = groups[t.d] || []).push(t));
  const hide = $('hideDone').checked;
  let html = '';
  Object.keys(groups).map(Number).sort((a, b) => a - b).forEach(d => {
    const items = groups[d].filter(t => !(hide && state.done[t.id]));
    if (!items.length) return;
    const date = mv ? new Date(mv.getTime() + d * 86400000) : null;
    const past = date && date < now;
    html += '<div class="day"><h3><span class="dd' + (past ? ' past' : '') + '">' + label(d) + '</span>' + (date ? '<span class="dt">' + fmt(date) + '</span>' : '') + '</h3>' +
      items.map(t => '<label class="tk' + (state.done[t.id] ? ' done' : '') + '"><input type="checkbox" data-id="' + t.id + '"' + (state.done[t.id] ? ' checked' : '') + '><span><b>' + esc(t.t) + '</b>' +
        (t.p ? '<p>' + esc(t.p) + '</p>' : '') + (t.l ? '<a href="' + t.l + '">관련 도구 열기</a>' : '') + '</span>' +
        (t.mine ? '<button type="button" class="rm" data-rm="' + t.id + '" aria-label="내 할 일 지우기">×</button>' : '') + '</label>').join('') + '</div>';
  });
  $('list').innerHTML = html || '<p class="hint">모두 끝냈어요.</p>';
  const doneN = list.filter(t => state.done[t.id]).length;
  $('rDone').innerHTML = doneN + '<small>/ ' + list.length + '</small>';
  if (mv) {
    const left = Math.round((mv - now) / 86400000);
    $('rLeft').innerHTML = left > 0 ? left + '<small>일</small>' : left === 0 ? '오늘<small></small>' : '지남<small></small>';
    const next = list.filter(t => !state.done[t.id]).find(t => new Date(mv.getTime() + t.d * 86400000) >= now) || list.find(t => !state.done[t.id]);
    const overdue = list.filter(t => !state.done[t.id] && new Date(mv.getTime() + t.d * 86400000) < now).length;
    $('rDetail').innerHTML = (next ? '다음 할 일: <b>' + esc(next.t) + '</b> (' + fmt(new Date(mv.getTime() + next.d * 86400000)) + ')' : '모두 끝냈어요') +
      (overdue ? '<br>날짜가 지났는데 아직 안 한 일 <b>' + overdue + '개</b>' : '');
  } else { $('rLeft').innerHTML = '-<small>일</small>'; $('rDetail').innerHTML = '이사 날짜를 넣어 주세요.'; }
  save();
}
function save(){ if (!store) return; try { store.setItem(KEY, JSON.stringify({ move: $('move').value, tenant: $('tenant').checked, hideDone: $('hideDone').checked, done: state.done, mine: state.mine })); } catch (e) {} }
function load(){
  let d = null; try { d = store && JSON.parse(store.getItem(KEY)); } catch (e) {}
  if (!d) return false;
  $('move').value = d.move || ''; $('tenant').checked = d.tenant !== false; $('hideDone').checked = !!d.hideDone;
  state.done = d.done || {}; state.mine = Array.isArray(d.mine) ? d.mine.filter(m => m && m.t).map(m => ({ id: String(m.id), d: Math.max(-90, Math.min(60, parseInt(m.d, 10) || 0)), t: String(m.t).slice(0, 60), p: '', l: '', mine: true })) : [];
  return true;
}
$('list').addEventListener('change', e => { const id = e.target.dataset.id; if (!id) return; if (e.target.checked) state.done[id] = 1; else delete state.done[id]; render(); });
$('list').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; e.preventDefault(); state.mine = state.mine.filter(m => m.id !== b.dataset.rm); delete state.done[b.dataset.rm]; render(); });
$('addBtn').addEventListener('click', () => {
  const t = $('newText').value.trim(); if (!t) { $('newText').focus(); return; }
  const d = Math.max(-90, Math.min(60, parseInt($('newDay').value, 10) || 0));
  state.mine.push({ id: 'm' + Date.now(), d, t: t.slice(0, 60), p: '', l: '', mine: true });
  $('newText').value = ''; render();
});
$('newText').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('addBtn').click(); } });
$('printBtn').addEventListener('click', () => window.print());
['move', 'tenant', 'hideDone'].forEach(id => $(id).addEventListener('change', render));
document.addEventListener('click', e => { if (e.target.closest('[data-a="reset"]') && store) { try { store.removeItem(KEY); } catch (err) {} } }, true);
if (!load()) { const t = today(); t.setDate(t.getDate() + 30); $('move').value = iso(t); }
render();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('moving/index.html', html);
console.log('생성 완료: /moving/');
