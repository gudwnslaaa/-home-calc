// 인건비·3.3% 계산기(/labor/) 생성: node tools/build-labor.js
const kit = require('./site-kit');
const mm = require('./money-math');

const EXTRA_STYLE = `<style>
.seg{display:flex;gap:6px;background:var(--field);border:1px solid var(--line);border-radius:12px;padding:4px;margin-bottom:12px}
.seg button{flex:1;min-height:44px;border:0;border-radius:9px;background:transparent;color:var(--muted);font:inherit;font-size:.9rem;cursor:pointer;line-height:1.25;padding:6px}
.seg button.on{background:var(--card);color:var(--ink);box-shadow:0 0 0 1px var(--line)}
.pane[hidden]{display:none}
.rowx{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
@media (max-width:560px){ .rowx{grid-template-columns:1fr 1fr} }
.note{font-size:.84rem;color:var(--muted);margin-top:8px}
</style>`;

const faq = [
  ['3.3%는 어떻게 계산하나요?', '사업소득으로 지급할 때 소득세 3%와 지방소득세(소득세의 10%, 지급액의 0.3%)를 합쳐 3.3%를 떼고 줍니다. 100만 원이면 33,000원을 떼고 967,000원을 지급합니다.'],
  ['일용직 일당도 3.3%를 떼나요?', '일용근로자라면 계산이 다릅니다. 하루 일당에서 15만 원을 빼고 남은 금액에 6%를 곱한 뒤, 그 세액의 55%를 공제한 만큼이 소득세입니다. 일당 15만 원 이하면 소득세가 없습니다.'],
  ['세금이 몇백 원이면 안 떼도 되나요?', '원천징수할 소득세가 1,000원 미만이면 떼지 않습니다(소액부징수). 일용직 일당을 며칠 치 한꺼번에 줄 때는 날짜별 세액을 합친 금액으로 판단합니다.'],
  ['일용직과 3.3% 중 어느 쪽인지는 누가 정하나요?', '계약서 이름이 아니라 실제로 어떻게 일했는지로 판단합니다. 지시·감독을 받으며 날짜별로 일했다면 일용근로, 독립적으로 일을 맡아 했다면 사업소득에 가깝습니다. 헷갈리면 세무서나 세무 대리인에게 확인하세요.'],
];

const html = kit.head({
  title: '인건비 계산기 – 3.3% 실수령액·일용직 일당 세금·공사 인건비 합계 계산',
  desc: '기공·조공 일당 × 일수 × 인원으로 공사 인건비를 계산하고, 3.3% 원천징수 후 실수령액과 일용직 일당 세금(15만 원 공제)을 함께 보여 줍니다. 실수령액으로 지급액 역산도 됩니다.',
  url: 'https://jibcalc.com/labor/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 처음으로')}
    <h1>인건비 · 3.3% 계산기</h1>
    <p>일당 × 일수 × 인원으로 인건비를 내고, 떼는 세금과 실제로 줄 돈을 계산합니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>지급 방식</h2>
    <div class="seg">
      <button type="button" class="on" data-m="biz">3.3% 떼고 지급<br><small>사업소득 · 프리랜서</small></button>
      <button type="button" data-m="daily">일용직 일당<br><small>일용근로소득</small></button>
    </div>
    <input type="hidden" id="mode" value="biz">

    <h2 style="margin-top:18px"><span class="num">2</span>일당과 일수</h2>
    <div class="rowx">
      <div><label for="wage">1인 일당 (원)</label><input id="wage" type="number" inputmode="numeric" min="0" step="1000" value="250000"></div>
      <div><label for="days">일한 날 (일)</label><input id="days" type="number" inputmode="numeric" min="0" step="1" value="5"></div>
      <div><label for="people">인원 (명)</label><input id="people" type="number" inputmode="numeric" min="1" step="1" value="1"></div>
    </div>
    <p class="note" id="modeNote"></p>

    <div class="pane" id="paneBiz">
      <h2 style="margin-top:18px"><span class="num">3</span>실수령액으로 거꾸로 (선택)</h2>
      <label for="net">“손에 이만큼 쥐여 주고 싶다” 1인 실수령액 (원)</label>
      <input id="net" type="number" inputmode="numeric" min="0" step="1000" placeholder="예: 1000000">
      <div class="detail" id="revOut" style="margin-top:8px"></div>
    </div>
  </section>

  <section class="card result" aria-live="polite">
    <h2>계산 결과</h2>
    <div class="big grid g3">
      <div class="stat"><div class="k">총 인건비</div><div class="v" id="rG">0<small>원</small></div></div>
      <div class="stat"><div class="k">떼는 세금</div><div class="v" id="rT">0<small>원</small></div></div>
      <div class="stat"><div class="k">실제 지급액</div><div class="v" id="rN">0<small>원</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
    <p class="note">고용보험 등 4대보험 공제는 넣지 않았어요. 견적에 넣을 인건비는 <a href="/estimate/" style="color:var(--accent)">견적서 작성기</a>로 이어서 정리하세요.</p>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>같은 일당 25만 원, 떼는 돈이 다릅니다</h2>
    <p>현장에서 “3.3% 떼고 준다”는 말을 흔히 쓰지만, 일용근로로 처리하면 계산이 달라집니다. 일당 25만 원으로 하루 일했다면 3.3%로는 8,250원을 떼지만, 일용근로로는 (25만 − 15만) × 6% × 45% = 소득세 2,700원에 지방소득세 270원, 합쳐 2,970원입니다. 일당이 17만 원이면 하루 소득세가 540원이라 1,000원이 안 돼 떼지 않지만, 닷새 치를 한꺼번에 주면 2,700원이 되어 떼야 합니다.</p>

    <h2>계산 방법</h2>
    <ul>
      <li><b>3.3% (사업소득):</b> 소득세 = 지급액 × 3%, 지방소득세 = 소득세 × 10%</li>
      <li><b>일용근로소득:</b> 하루 소득세 = (일당 − 150,000원) × 6% × (1 − 55%), 지방소득세 = 소득세 × 10%</li>
      <li><b>소액부징수:</b> 한 번에 지급하는 금액의 소득세가 1,000원 미만이면 0원</li>
      <li>세액의 10원 미만은 버리고, 1인 기준으로 계산한 뒤 인원수를 곱합니다.</li>
    </ul>

    <h2>지급한 뒤 챙길 것</h2>
    <p>원천징수한 세금은 지급한 달의 다음 달 10일까지 신고·납부하고, 지급명세서도 제출해야 합니다. 일용근로자 지급명세서는 지급일이 속한 달의 다음 달 말일까지 냅니다. 처음이라면 국세청 홈택스의 원천세 신고 메뉴를 보거나 세무 대리인에게 맡기세요.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('labor')}
  </section>
${kit.foot('결과는 참고용입니다. 소득 구분과 신고는 국세청 안내나 세무 대리인의 판단을 따르세요.')}
<script>
${mm.inline()}
const $ = id => document.getElementById(id);
const won = n => Math.round(n).toLocaleString('ko-KR');
function setMode(m){
  $('mode').value = m;
  document.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  $('paneBiz').hidden = m !== 'biz';
  $('modeNote').textContent = m === 'biz'
    ? '지급액의 3.3%(소득세 3% + 지방소득세 0.3%)를 떼고 줍니다.'
    : '일당에서 15만 원을 뺀 금액에 6%, 그 세액의 55%를 공제합니다. 일당 15만 원 이하면 세금이 없어요.';
  calc();
}
function calc(){
  const m = $('mode').value;
  const w = parseFloat($('wage').value) || 0;
  const d = Math.max(0, Math.round(parseFloat($('days').value) || 0));
  const p = Math.max(1, Math.round(parseFloat($('people').value) || 1));
  const one = m === 'biz' ? biz33(w * d) : daily(w, d);
  const tax = (one.incomeTax + one.localTax) * p;
  $('rG').innerHTML = won(one.gross * p) + '<small>원</small>';
  $('rT').innerHTML = won(tax) + '<small>원</small>';
  $('rN').innerHTML = won(one.net * p) + '<small>원</small>';
  let h = '1인: ' + won(w) + '원 × ' + d + '일 = <b>' + won(one.gross) + '원</b>';
  if (m === 'biz') {
    h += '<br>소득세 ' + won(one.incomeTax) + '원 + 지방소득세 ' + won(one.localTax) + '원 → 1인 실수령 <b>' + won(one.net) + '원</b>';
  } else {
    h += '<br>하루 소득세 ' + won(Math.floor(one.perDay)) + '원 × ' + d + '일' + (one.incomeTax === 0 && one.perDay > 0 ? ' → 1,000원 미만이라 떼지 않음' : '') +
      '<br>소득세 ' + won(one.incomeTax) + '원 + 지방소득세 ' + won(one.localTax) + '원 → 1인 실수령 <b>' + won(one.net) + '원</b>';
    if (w > 150000) {
      const b = biz33(w * d);
      h += '<br>같은 금액을 3.3%로 떼면 1인 ' + won(b.incomeTax + b.localTax) + '원을 떼요.';
    }
  }
  if (p > 1) h += '<br>' + p + '명 합계 실제 지급액 <b>' + won(one.net * p) + '원</b>';
  $('rDetail').innerHTML = w > 0 && d > 0 ? h : '일당과 일수를 넣어 주세요.';

  const n = parseFloat($('net').value) || 0;
  if (m === 'biz' && n > 0) {
    const r = biz33Gross(n);
    $('revOut').innerHTML = '실수령 ' + won(n) + '원을 주려면 지급액 <b>' + won(r.gross) + '원</b> (세금 ' + won(r.incomeTax + r.localTax) + '원, 실수령 ' + won(r.net) + '원)';
  } else $('revOut').innerHTML = '';
}
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
document.addEventListener('input', calc);
document.addEventListener('change', () => setMode($('mode').value));
setMode('biz');
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('labor/index.html', html);
console.log('생성 완료: /labor/');
