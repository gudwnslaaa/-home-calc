// 부가세 계산기(/vat/) 생성: node tools/build-vat.js
const kit = require('./site-kit');
const mm = require('./money-math');

const EXTRA_STYLE = `<style>
.seg{display:flex;gap:6px;background:var(--field);border:1px solid var(--line);border-radius:12px;padding:4px;margin-bottom:12px}
.seg button{flex:1;height:40px;border:0;border-radius:9px;background:transparent;color:var(--muted);font:inherit;font-size:.92rem;cursor:pointer}
.seg button.on{background:var(--card);color:var(--ink);box-shadow:0 0 0 1px var(--line)}
.quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.quick button{height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--muted);font:inherit;font-size:.85rem;cursor:pointer}
.kor{margin-top:6px;font-size:.85rem;color:var(--muted)}
table.vt{width:100%;border-collapse:collapse;font-size:.9rem;margin:10px 0}
table.vt th,table.vt td{border-bottom:1px solid var(--line);padding:8px 6px;text-align:right}
table.vt th:first-child,table.vt td:first-child{text-align:left}
</style>`;

const faq = [
  ['부가세는 어떻게 계산하나요?', '일반과세자는 공급가액의 10%가 부가가치세입니다. 공급가액 100만 원이면 부가세 10만 원, 합계 110만 원입니다. 반대로 부가세가 포함된 합계에서 공급가액을 구하려면 1.1로 나눕니다.'],
  ['견적서의 ‘VAT 별도’는 무슨 뜻인가요?', '적힌 금액이 공급가액이라 부가세 10%가 따로 붙는다는 뜻입니다. 300만 원(VAT 별도)이면 실제로 낼 돈은 330만 원입니다. ‘VAT 포함’이면 적힌 금액 안에 부가세가 이미 들어 있습니다.'],
  ['합계에서 나눈 공급가액이 1원씩 차이 나요.', '1.1로 나누면 소수점이 생기는 금액이 많아 반올림 방법에 따라 1원 차이가 날 수 있습니다. 이 계산기는 공급가액을 원 단위로 반올림하고 나머지를 세액으로 봅니다. 세금계산서는 발행 프로그램의 계산을 따르세요.'],
  ['간이과세자나 면세 품목도 10%인가요?', '아닙니다. 이 계산기는 일반과세자 10% 기준입니다. 간이과세자와 면세 품목은 계산 방식이 다르니 국세청 안내나 세무 대리인에게 확인하세요.'],
];

const QUICK = [100000, 500000, 1000000, 3000000, 5000000, 10000000];
const TABLE = [1000000, 3000000, 5000000, 10000000, 20000000, 30000000];
const won = (n) => n.toLocaleString('ko-KR');

const html = kit.head({
  title: '부가세 계산기 – 공급가액·부가세 10%·합계 금액 바로 계산 (VAT 포함/별도)',
  desc: '공급가액을 넣으면 부가세 10%와 합계를, 부가세 포함 금액을 넣으면 공급가액과 세액을 나눠 줍니다. 견적서 VAT 별도·포함 금액 확인과 한글 금액 표기까지 한 번에.',
  url: 'https://jibcalc.com/vat/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 · 전체 보기')}
    <h1>부가세 계산기</h1>
    <p>VAT 별도 금액엔 10%를 더하고, 포함 금액은 공급가액과 세액으로 나눕니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>금액 넣기</h2>
    <div class="seg" role="tablist">
      <button type="button" class="on" data-m="add">VAT 별도 금액 (공급가액)</button>
      <button type="button" data-m="split">VAT 포함 금액 (합계)</button>
    </div>
    <input type="hidden" id="mode" value="add">
    <label for="amt" id="amtLabel">공급가액 (원)</label>
    <input id="amt" type="number" inputmode="numeric" min="0" step="1" value="1000000">
    <div class="kor" id="amtKor"></div>
    <div class="quick">${QUICK.map((q) => `<button type="button" data-q="${q}">${q >= 10000 ? won(q / 10000) + '만' : won(q)}</button>`).join('')}</div>
    <p class="hint">일반과세자 10% 기준이에요. 금액은 어디로도 보내지 않고 이 화면에서만 계산해요.</p>
  </section>

  <section class="card result" aria-live="polite">
    <h2>계산 결과</h2>
    <div class="big grid g3">
      <div class="stat"><div class="k">공급가액</div><div class="v" id="rS">0<small>원</small></div></div>
      <div class="stat"><div class="k">부가세</div><div class="v" id="rT">0<small>원</small></div></div>
      <div class="stat"><div class="k">합계</div><div class="v" id="rA">0<small>원</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>견적서 금액, 먼저 이것부터 보세요</h2>
    <p>공사 견적서를 받으면 합계 옆에 ‘VAT 별도’인지 ‘VAT 포함’인지부터 확인하세요. 같은 300만 원이라도 별도면 330만 원을 내야 하고, 포함이면 300만 원이 끝입니다. 업체 두 곳을 비교할 때 한쪽만 별도로 적혀 있으면 10%만큼 싸 보이는 착시가 생겨요.</p>
    <p>시공하는 쪽이라면 견적서에 공급가액·부가세·합계를 한 줄씩 따로 적어 두는 게 오해를 줄입니다. 항목을 넣으면 이 셋을 자동으로 나눠 주는 <a href="/estimate/">견적서 작성기</a>도 있어요.</p>

    <h2>자주 쓰는 금액 미리 보기</h2>
    <table class="vt">
      <thead><tr><th>공급가액</th><th>부가세</th><th>합계</th></tr></thead>
      <tbody>
${TABLE.map((t) => { const r = mm.vat(t, 'add'); return `        <tr><td>${won(r.supply)}원</td><td>${won(r.tax)}원</td><td>${won(r.total)}원</td></tr>`; }).join('\n')}
      </tbody>
    </table>

    <h2>계산 방법</h2>
    <ul>
      <li><b>VAT 별도 → 합계:</b> 공급가액 × 0.1 = 부가세, 공급가액 + 부가세 = 합계 (부가세의 원 미만은 버림)</li>
      <li><b>VAT 포함 → 나누기:</b> 합계 ÷ 1.1 = 공급가액 (원 단위 반올림), 합계 − 공급가액 = 부가세</li>
    </ul>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('vat')}
  </section>
${kit.foot('결과는 참고용입니다. 세금계산서 발행과 신고는 국세청 홈택스나 세무 대리인의 계산을 따르세요.')}
<script>
${mm.inline()}
const $ = id => document.getElementById(id);
const won = n => n.toLocaleString('ko-KR');
function setMode(m){
  $('mode').value = m;
  document.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  $('amtLabel').textContent = m === 'add' ? '공급가액 (원)' : '부가세 포함 합계 (원)';
  calc();
}
function calc(){
  const m = $('mode').value;
  const a = parseFloat($('amt').value) || 0;
  const r = vat(a, m);
  $('amtKor').textContent = a > 0 ? '일금 ' + hangul(a) + '원' : '';
  $('rS').innerHTML = won(r.supply) + '<small>원</small>';
  $('rT').innerHTML = won(r.tax) + '<small>원</small>';
  $('rA').innerHTML = won(r.total) + '<small>원</small>';
  $('rDetail').innerHTML = a > 0
    ? (m === 'add' ? won(r.supply) + '원 × 10% = 부가세 <b>' + won(r.tax) + '원</b>' : won(r.total) + '원 ÷ 1.1 = 공급가액 <b>' + won(r.supply) + '원</b>') +
      '<br>합계 한글 표기: <b>일금 ' + hangul(r.total) + '원정</b> (₩' + won(r.total) + ')'
    : '금액을 넣어 주세요.';
}
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
document.querySelectorAll('.quick button').forEach(b => b.addEventListener('click', () => { $('amt').value = b.dataset.q; calc(); }));
document.addEventListener('input', calc);
document.addEventListener('change', () => setMode($('mode').value));
calc();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('vat/index.html', html);
console.log('생성 완료: /vat/');
