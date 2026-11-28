// 공사·이사 일정표(/schedule/) 생성: node tools/build-schedule.js
// 공정별 기간은 '예시값'이며 사용자가 직접 바꾸도록 함. 법정 기한은 전입신고(이사한 날부터 14일 이내, 주민등록법 제16조)만 사용.
const kit = require('./site-kit');

// [키, 이름, 기본 일수(예시), 기본 선택, 설명]
const STEPS = [
  ['demo', '철거', 1, true, '기존 마감재·설비 뜯어내기'],
  ['mep', '설비·전기', 2, false, '배관, 전기 배선, 콘센트 위치 변경'],
  ['wood', '목공', 3, false, '천장·벽 보강, 몰딩, 문틀'],
  ['bath', '욕실·타일', 4, true, '방수, 타일, 도기 설치'],
  ['paint', '도장(페인트)', 2, false, '문·몰딩·벽 페인트'],
  ['wall', '도배', 1, true, '초배·벽지'],
  ['floor', '바닥(장판·마루)', 2, true, '바닥재 시공'],
  ['fit', '가구·조명 설치', 1, true, '붙박이장, 싱크대, 조명'],
  ['air', '환기·여유', 3, true, '냄새 빼기와 일정 밀림 대비'],
  ['clean', '입주청소', 1, true, '공사 먼지 마무리 청소'],
];

const EXTRA_STYLE = `<style>
.steps{display:grid;gap:8px}
.srow{display:grid;grid-template-columns:auto 1fr 92px;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:12px;background:var(--field)}
.srow.off{opacity:.55}
.srow input[type=checkbox]{width:20px;height:20px;accent-color:var(--accent)}
.srow .nm{font-size:.92rem;line-height:1.3}
.srow .nm small{display:block;color:var(--muted);font-size:.78rem}
.srow .days{display:flex;align-items:center;gap:6px}
.srow .days input{width:56px;text-align:center;padding:8px 6px}
.srow .days span{color:var(--muted);font-size:.85rem}
.opts{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:.9rem}
.opts label{display:flex;align-items:center;gap:6px;color:var(--ink);margin:0}
.opts input{width:18px;height:18px;accent-color:var(--accent)}
.tl{list-style:none;margin:16px 0 0;padding:0;border-left:2px solid var(--line)}
.tl li{position:relative;padding:0 0 14px 16px}
.tl li::before{content:"";position:absolute;left:-7px;top:5px;width:12px;height:12px;border-radius:50%;background:var(--card);border:2px solid var(--muted)}
.tl li.w::before{border-color:var(--accent);background:var(--accent)}
.tl li.m::before{border-color:#1f6fb2;background:#1f6fb2}
.tl .d{font-size:.8rem;color:var(--muted)}
.tl .t{font-size:.95rem;color:var(--ink);font-weight:500}
.tl .s{font-size:.84rem;color:var(--muted);margin-top:2px}
.tl .s a{color:var(--accent)}
.ph{font-size:.8rem;color:var(--muted);margin:14px 0 6px;letter-spacing:.02em}
.ics{margin-top:12px}
@media (max-width:560px){ .srow{grid-template-columns:auto 1fr 84px} }
</style>`;

const faq = [
  ['인테리어 공사 순서는 어떻게 되나요?', '보통 철거 → 설비·전기 → 목공 → 욕실·타일 → 도장 → 도배 → 바닥 → 가구·조명 설치 → 입주청소 순서로 진행합니다. 먼지와 물을 많이 쓰는 공정을 먼저, 마감재를 나중에 하는 것이 기본 원칙이고, 실제 순서는 공사 범위와 업체 일정에 따라 달라질 수 있습니다.'],
  ['입주청소는 언제 하는 게 좋나요?', '모든 공사가 끝난 뒤, 가구와 짐이 들어오기 전에 하는 것이 좋습니다. 공사 중 생긴 먼지가 가라앉을 시간을 조금 두고 청소하면 다시 쌓이는 먼지를 줄일 수 있습니다.'],
  ['전입신고는 언제까지 해야 하나요?', '주민등록법에 따라 이사한 날부터 14일 이내에 새 주소지 주민센터를 방문하거나 정부24에서 신고해야 합니다. 기한을 넘기면 과태료가 부과될 수 있습니다.'],
  ['아파트 공사 전에 관리사무소에 꼭 알려야 하나요?', '공사 가능 시간, 이웃 동의, 엘리베이터 사용과 보양 같은 기준은 단지 관리규약과 관리사무소 안내를 따릅니다. 벽을 허물거나 발코니를 확장하는 등 구조를 바꾸는 공사는 별도의 허가·신고가 필요할 수 있으니 공사 계획이 잡히면 먼저 문의하세요.'],
];

const html = kit.head({
  title: '공사·이사 일정표 – 이사 날짜로 인테리어 공사 순서와 할 일 계산',
  desc: '이사 날짜만 넣으면 철거부터 도배, 바닥, 입주청소까지 인테리어 공사 순서를 거꾸로 계산해 날짜별 일정표를 만들어 드립니다. 관리사무소 신고, 폐기물 정리, 전입신고 기한까지 함께 챙기세요.',
  url: 'https://jibcalc.com/schedule/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 처음으로')}
    <h1>공사·이사 일정표</h1>
    <p>이사 날짜로 공사 순서와 할 일을 거꾸로 계산합니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>이사 날짜</h2>
    <div class="grid g2">
      <div><label for="move">이사(입주)하는 날</label><input id="move" type="date"></div>
      <div><label for="lead">견적·계약은 공사 며칠 전부터</label><input id="lead" type="number" inputmode="numeric" min="0" max="120" value="28"></div>
    </div>
  </section>

  <section class="card">
    <h2><span class="num">2</span>할 공사 고르기</h2>
    <div class="steps">
${STEPS.map(([k, n, d, on, s]) => `      <div class="srow${on ? '' : ' off'}" data-k="${k}"><input type="checkbox" id="c_${k}"${on ? ' checked' : ''} aria-label="${n} 포함"><label class="nm" for="c_${k}">${n}<small>${s}</small></label><div class="days"><input id="d_${k}" type="number" inputmode="numeric" min="0" max="60" value="${d}" aria-label="${n} 기간(일)"><span>일</span></div></div>`).join('\n')}
    </div>
    <div class="opts">
      <label><input type="checkbox" id="skipSun" checked>일요일은 공사 쉬기</label>
    </div>
    <p class="hint">기간은 흔한 예시값이에요. 공사 범위와 업체 일정에 맞게 숫자를 바꾸세요. 관리규약상 공사를 못 하는 요일이 있다면 그만큼 여유를 더 잡으세요.</p>
  </section>

  <section class="card result" aria-live="polite">
    <h2>일정표</h2>
    <div class="big">
      <div class="stat"><div class="k">공사 시작</div><div class="v" id="sStart">-</div></div>
      <div class="stat"><div class="k">공사 기간</div><div class="v" id="sDays">0<small>일</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
    <ol class="tl" id="tl"></ol>
    <div class="ics"><button class="btn" type="button" id="icsBtn">캘린더 파일(.ics)로 저장</button></div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>공사 순서, 왜 이렇게 정할까</h2>
    <p>인테리어 공사는 먼지와 물이 많이 나오는 작업을 먼저 하고, 깨끗하게 남아야 하는 마감 작업을 나중에 하는 것이 기본입니다. 철거와 설비, 목공처럼 구조를 건드리는 일이 앞에 오고, 도배와 바닥처럼 눈에 보이는 마감은 뒤에 옵니다. 바닥을 먼저 깔면 도배나 페인트 작업 중에 바닥이 상하기 쉽기 때문에, 보통 벽을 마무리한 다음 바닥을 시공합니다.</p>
    <p>이 일정표는 이사 날짜에서 거꾸로 계산합니다. 마지막 공정이 끝나는 날과 이사 날 사이에 환기·여유 기간을 두었는데, 자재 냄새를 빼는 시간이자 일정이 하루 이틀 밀렸을 때 버틸 수 있는 여유이기도 합니다.</p>

    <h2>공사 전에 챙길 것</h2>
    <ul>
      <li><b>자재 수량 계산:</b> 계약 전에 <a href="/pyeong/">평수</a>, <a href="/wallpaper/">도배지</a>, <a href="/tile/">타일</a>, <a href="/floor/">장판·마루</a>, <a href="/paint/">페인트</a> 수량을 미리 뽑아 두면 견적을 비교하기 쉽습니다.</li>
      <li><b>관리사무소 문의:</b> 공사 가능 시간, 이웃 동의서, 엘리베이터 사용·보양 기준은 단지마다 다르니 공사 일정이 잡히면 먼저 확인하세요.</li>
      <li><b>버릴 물건 정리:</b> 철거 전에 가전·가구를 비워야 공사가 막히지 않습니다. <a href="/waste/">폐기물 정리 도우미</a>로 무상수거와 대형폐기물 신고를 나눠 두세요.</li>
    </ul>

    <h2>이사 후에 챙길 것</h2>
    <p>전입신고는 이사한 날부터 14일 이내에 해야 합니다. 세입자라면 확정일자도 함께 받아 두는 것이 보증금 보호에 도움이 됩니다. 공과금과 각종 주소 변경도 이 시기에 몰아서 처리하면 빠뜨리기 쉬운 것을 줄일 수 있습니다.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('schedule')}
  </section>
${kit.foot('일정은 참고용 예시입니다. 실제 공사 기간은 업체와, 공사 가능 시간은 관리사무소와 확인하세요.')}
<script>
const $ = id => document.getElementById(id);
const STEPS = ${JSON.stringify(STEPS.map(([k, n, d, on, s]) => ({ k, n, s })))};
const WD = ['일','월','화','수','목','금','토'];
const fmt = d => (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + WD[d.getDay()] + ')';
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const ymd = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
let events = [];

// 기본 이사일: 오늘부터 6주 뒤
(function(){ const d = addDays(new Date(), 42); $('move').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

// 끝나는 날(end)에서 거꾸로 n 근무일을 세어 시작일을 구함
function backWork(end, n, skipSun){
  let d = new Date(end), left = n;
  while (true) {
    if (!(skipSun && d.getDay() === 0)) { left--; if (left <= 0) return d; }
    d = addDays(d, -1);
  }
}
function prevDay(d, skipSun){ let x = addDays(d, -1); while (skipSun && x.getDay() === 0) x = addDays(x, -1); return x; }

function render(){
  document.querySelectorAll('.srow').forEach(r => r.classList.toggle('off', !$('c_' + r.dataset.k).checked));
  const mv = $('move').value;
  const tl = $('tl');
  if (!mv) { tl.innerHTML = ''; $('rDetail').textContent = '이사 날짜를 넣어 주세요.'; return; }
  const move = new Date(mv + 'T00:00:00');
  const skipSun = $('skipSun').checked;
  const picked = STEPS.filter(s => $('c_' + s.k).checked).map(s => ({ ...s, days: Math.max(0, Math.round(+$('d_' + s.k).value || 0)) })).filter(s => s.days > 0);

  // 이사 전날부터 거꾸로 배치 (환기·여유는 달력일로, 나머지는 근무일로)
  let cursorEnd = addDays(move, -1);
  const placed = [];
  for (let i = picked.length - 1; i >= 0; i--) {
    const s = picked[i];
    const calendar = s.k === 'air';
    let end = cursorEnd;
    if (!calendar) while (skipSun && end.getDay() === 0) end = addDays(end, -1);
    const start = calendar ? addDays(end, -(s.days - 1)) : backWork(end, s.days, skipSun);
    placed.unshift({ ...s, start, end });
    cursorEnd = calendar ? addDays(start, -1) : prevDay(start, skipSun);
  }
  const work = placed.filter(p => p.k !== 'air' && p.k !== 'clean');
  const first = placed[0];
  const workStart = first ? first.start : move;
  const totalDays = first ? Math.round((move - workStart) / 864e5) : 0;
  $('sStart').textContent = first ? (workStart.getMonth() + 1) + '/' + workStart.getDate() : '-';
  $('sDays').innerHTML = totalDays + '<small>일</small>';

  const lead = Math.max(0, Math.round(+$('lead').value || 0));
  const items = [];
  const add = (date, title, sub, cls) => items.push({ date, title, sub, cls });
  if (first) {
    add(addDays(workStart, -lead), '견적 받기·업체 계약', '자재 수량을 미리 계산해 견적과 비교하세요. <a href="/pyeong/">평수</a> · <a href="/wallpaper/">도배</a> · <a href="/tile/">타일</a> · <a href="/floor/">바닥</a>', '');
    add(addDays(workStart, -Math.min(lead, 14)), '관리사무소 공사 문의·이웃 안내', '공사 가능 시간, 동의서, 엘리베이터 보양 기준 확인', '');
    add(addDays(workStart, -Math.min(lead, 10)), '버릴 물건 정리·수거 예약', '<a href="/waste/">폐기물 정리 도우미</a>로 무상수거·대형폐기물 신고 나누기', '');
  }
  placed.forEach(p => {
    const range = p.start.getTime() === p.end.getTime() ? '' : ' ~ ' + fmt(p.end);
    add(p.start, p.n + ' (' + p.days + '일)', (range ? fmt(p.start) + range + ' · ' : '') + p.s, 'w');
  });
  add(move, '이사·입주', '', 'm');
  add(addDays(move, 13), '전입신고 (늦어도 이날까지)', '법정 기한은 이사한 날부터 14일 이내라 하루 일찍 잡았어요 · 정부24 또는 주민센터. 세입자라면 확정일자도 함께', '');
  items.sort((a, b) => a.date - b.date);

  events = items;
  tl.innerHTML = '<div class="ph">날짜순 할 일</div>' + items.map(x => '<li class="' + x.cls + '"><div class="d">' + fmt(x.date) + '</div><div class="t">' + x.title + '</div>' + (x.sub ? '<div class="s">' + x.sub + '</div>' : '') + '</li>').join('');
  $('rDetail').innerHTML = first
    ? '이사 <b>' + fmt(move) + '</b> 기준, 공사는 <b>' + fmt(workStart) + '</b>에 시작해야 해요. 공정 ' + work.length + '개' + (skipSun ? ' · 일요일 제외' : '') + '.'
    : '할 공사를 하나 이상 골라 주세요.';
}

document.addEventListener('input', render);
document.addEventListener('change', render);

// .ics 저장 (기기 안에서 파일만 만듦)
$('icsBtn').addEventListener('click', () => {
  const strip = s => s.replace(/<[^>]+>/g, '').replace(/[,;\\\\]/g, ' ');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//jibcalc//schedule//KO','CALSCALE:GREGORIAN'];
  events.forEach((e, i) => {
    lines.push('BEGIN:VEVENT','UID:jibcalc-' + ymd(e.date) + '-' + i + '@jibcalc.com','DTSTAMP:' + ymd(new Date()) + 'T000000Z','DTSTART;VALUE=DATE:' + ymd(e.date),'DTEND;VALUE=DATE:' + ymd(addDays(e.date, 1)),'SUMMARY:' + strip(e.title),'DESCRIPTION:' + strip(e.sub || ''),'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\\r\\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = '공사-이사-일정표.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

render();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('schedule/index.html', html);
console.log('생성 완료: /schedule/');
