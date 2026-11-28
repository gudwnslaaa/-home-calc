// 면적 계산기(/area/) 생성: node tools/build-area.js
// 도형 여러 개를 더하거나 빼서 ㎡·평으로 계산. 계산은 모두 브라우저 안에서만.
const kit = require('./site-kit');

const EXTRA_STYLE = `<style>
.shapes{display:grid;gap:10px}
.shp{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--field)}
.shp .top{display:grid;grid-template-columns:1fr 96px 44px;gap:8px;align-items:end}
.shp .dims{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.shp .dims > div[hidden]{display:none}
.shp .sub{margin-top:8px;font-size:.82rem;color:var(--muted)}
.shp .sub b{color:var(--ink);font-weight:500}
.shp.minus{border-style:dashed}
.shp .x{height:44px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:1.1rem;cursor:pointer}
.unitrow{display:flex;gap:10px;align-items:end;margin-bottom:12px}
.unitrow > div{flex:1;max-width:220px}
.more{font-size:.85rem;color:var(--muted);margin-top:6px}
@media (max-width:560px){ .shp .dims{grid-template-columns:1fr 1fr} }
</style>`;

const faq = [
  ['면적은 어떻게 계산하나요?', '직사각형은 가로 × 세로, 삼각형은 밑변 × 높이 ÷ 2, 사다리꼴은 (윗변 + 아랫변) × 높이 ÷ 2, 원은 반지름 × 반지름 × 원주율(약 3.14)로 구합니다. ㄱ자처럼 꺾인 공간은 직사각형 여러 개로 나눠 각각 구한 뒤 더하면 됩니다.'],
  ['㎡를 평으로 바꾸려면?', '1평은 400/121㎡(약 3.3058㎡)입니다. ㎡에 121을 곱하고 400으로 나누면 평이 나오고, 대략 0.3025를 곱해도 거의 같은 값입니다.'],
  ['기둥이나 붙박이장 자리는 어떻게 빼나요?', '도형을 하나 더 추가하고 ‘빼기’로 바꾼 뒤 그 부분의 크기를 넣으면 전체 면적에서 빠집니다.'],
];

const html = kit.head({
  title: '면적 계산기 – 사각형·삼각형·원·ㄱ자 면적을 ㎡와 평으로 계산',
  desc: '직사각형, 삼각형, 사다리꼴, 원 면적을 m·cm 단위로 계산하고 ㎡와 평으로 바로 바꿔 줍니다. ㄱ자 방처럼 꺾인 공간은 도형을 더하고, 기둥 자리는 빼서 한 번에 계산하세요.',
  url: 'https://jibcalc.com/area/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 · 전체 보기')}
    <h1>면적 계산기</h1>
    <p>도형을 더하고 빼서 면적을 ㎡와 평으로 계산합니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>도형 넣기</h2>
    <div class="unitrow">
      <div><label for="unit">길이 단위</label>
        <select id="unit"><option value="m" selected>m (미터)</option><option value="cm">cm (센티미터)</option><option value="mm">mm (밀리미터)</option></select></div>
    </div>
    <div class="shapes" id="shapes"></div>
    <button class="add" type="button" id="addShape">+ 도형 추가</button>
    <p class="hint">ㄱ자 방은 직사각형 두 개로 나눠 넣고, 기둥·붙박이장처럼 빠지는 자리는 ‘빼기’로 넣으세요.</p>
  </section>

  <section class="card result" aria-live="polite">
    <h2>계산 결과</h2>
    <div class="big">
      <div class="stat"><div class="k">전체 면적</div><div class="v" id="rM2">0<small>㎡</small></div></div>
      <div class="stat"><div class="k">평수</div><div class="v" id="rPy">0<small>평</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
    <p class="more">면적을 알았다면 <a href="/tile/" style="color:var(--accent)">타일</a> · <a href="/floor/" style="color:var(--accent)">장판·마루</a> · <a href="/paint/" style="color:var(--accent)">페인트</a> 계산기로 자재 수량도 뽑아 보세요.</p>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>도형별 면적 공식</h2>
    <ul>
      <li><b>직사각형:</b> 가로 × 세로</li>
      <li><b>삼각형:</b> 밑변 × 높이 ÷ 2 (높이는 밑변에서 꼭짓점까지 수직으로 잰 길이)</li>
      <li><b>사다리꼴:</b> (윗변 + 아랫변) × 높이 ÷ 2</li>
      <li><b>원:</b> 반지름 × 반지름 × 원주율 (지름을 넣으면 계산기가 반으로 나눕니다)</li>
    </ul>
    <p>이 계산기는 원주율을 자바스크립트의 기본값(3.14159…)으로 계산하고, 결과는 소수 둘째 자리까지 보여 줍니다.</p>

    <h2>꺾인 방, 이렇게 나누세요</h2>
    <p>ㄱ자나 ㄷ자 방은 한 번에 재려고 하면 헷갈립니다. 큰 직사각형 하나와 튀어나온 부분을 따로 재서 더하거나, 전체를 큰 직사각형으로 보고 비어 있는 모서리를 빼는 두 가지 방법이 있어요. 둘 중 재기 쉬운 쪽을 고르면 됩니다.</p>

    <h2>㎡와 평</h2>
    <p>1평은 400/121㎡, 약 3.3058㎡입니다. 거꾸로 1㎡는 약 0.3025평이에요. 평과 ㎡를 자주 오가야 한다면 <a href="/pyeong/">평수 계산기</a>의 변환표도 함께 보세요.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('area')}
  </section>
${kit.foot('결과는 참고용입니다. 시공 수량은 각 자재 계산기와 현장 실측으로 다시 확인하세요.')}
<script>
const $ = id => document.getElementById(id);
const SHAPES = {
  rect: { name: '직사각형', f: ['가로', '세로'], area: v => v[0] * v[1], txt: v => v[0] + ' × ' + v[1] },
  tri: { name: '삼각형', f: ['밑변', '높이'], area: v => v[0] * v[1] / 2, txt: v => v[0] + ' × ' + v[1] + ' ÷ 2' },
  trap: { name: '사다리꼴', f: ['윗변', '아랫변', '높이'], area: v => (v[0] + v[1]) * v[2] / 2, txt: v => '(' + v[0] + ' + ' + v[1] + ') × ' + v[2] + ' ÷ 2' },
  circle: { name: '원', f: ['지름'], area: v => Math.PI * (v[0] / 2) ** 2, txt: v => 'π × (' + v[0] + ' ÷ 2)²' },
};
const fmt = (n, d = 2) => n.toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d });
const toPy = m2 => m2 * 121 / 400;
let seq = 0;

function addShape(type = 'rect', vals = [], sign = 1){
  const id = ++seq;
  const el = document.createElement('div');
  el.className = 'shp';
  el.innerHTML =
    '<div class="top">' +
      '<div><label for="s' + id + '">도형</label><select id="s' + id + '" class="type">' + Object.entries(SHAPES).map(([k, s]) => '<option value="' + k + '"' + (k === type ? ' selected' : '') + '>' + s.name + '</option>').join('') + '</select></div>' +
      '<div><label for="g' + id + '">계산</label><select id="g' + id + '" class="sign"><option value="1"' + (sign > 0 ? ' selected' : '') + '>더하기</option><option value="-1"' + (sign < 0 ? ' selected' : '') + '>빼기</option></select></div>' +
      '<button type="button" class="x" aria-label="도형 삭제">×</button>' +
    '</div>' +
    '<div class="dims">' + [0, 1, 2].map(i => '<div><label for="v' + id + '_' + i + '" class="lb"></label><input id="v' + id + '_' + i + '" type="number" inputmode="decimal" min="0" step="any" value="' + (vals[i] ?? '') + '"></div>').join('') + '</div>' +
    '<div class="sub"></div>';
  el.querySelector('.x').addEventListener('click', () => { el.remove(); calc(); });
  $('shapes').appendChild(el);
  calc();
}

function calc(){
  const k = { m: 1, cm: 0.01, mm: 0.001 }[$('unit').value];
  const u = $('unit').value;
  let total = 0, parts = [];
  document.querySelectorAll('.shp').forEach(el => {
    const s = SHAPES[el.querySelector('.type').value];
    const sign = +el.querySelector('.sign').value;
    el.classList.toggle('minus', sign < 0);
    const boxes = el.querySelectorAll('.dims > div');
    boxes.forEach((b, i) => {
      b.hidden = i >= s.f.length;
      b.querySelector('.lb').textContent = s.f[i] ? s.f[i] + ' (' + u + ')' : '';
    });
    const raw = s.f.map((_, i) => parseFloat(boxes[i].querySelector('input').value) || 0);
    const v = raw.map(x => x * k);
    const a = v.every(x => x > 0) ? s.area(v) : 0;
    total += sign * a;
    el.querySelector('.sub').innerHTML = a > 0
      ? s.name + ' ' + s.txt(raw) + ' = <b>' + fmt(a) + '㎡</b> (' + fmt(toPy(a)) + '평)' + (sign < 0 ? ' · 빼기' : '')
      : '치수를 넣어 주세요.';
    if (a > 0) parts.push((sign < 0 ? '− ' : '+ ') + fmt(a) + '㎡');
  });
  total = Math.max(0, total);
  $('rM2').innerHTML = fmt(total) + '<small>㎡</small>';
  $('rPy').innerHTML = fmt(toPy(total)) + '<small>평</small>';
  $('rDetail').innerHTML = parts.length
    ? '도형 ' + parts.length + '개: ' + parts.join(' ').replace(/^\\+ /, '') + ' = <b>' + fmt(total) + '㎡</b>' + (total >= 1 ? '<br>정사각형이라면 한 변 약 <b>' + fmt(Math.sqrt(total)) + 'm</b>인 넓이예요.' : '')
    : '도형의 치수를 넣어 주세요.';
}

// 단위를 바꾸면 넣은 값도 같이 바꿈
let lastUnit = $('unit').value;
$('unit').addEventListener('change', () => {
  const f = { m: 1, cm: 0.01, mm: 0.001 };
  const r = f[lastUnit] / f[$('unit').value];
  document.querySelectorAll('.dims input').forEach(i => { const v = parseFloat(i.value); if (isFinite(v)) i.value = +(v * r).toFixed(4); });
  lastUnit = $('unit').value;
  calc();
});
document.addEventListener('input', calc);
document.addEventListener('change', e => { if (e.target.id !== 'unit') calc(); });
$('addShape').addEventListener('click', () => addShape('rect'));

addShape('rect', [3.6, 3.0]);
addShape('rect', [1.2, 1.5]);
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('area/index.html', html);
console.log('생성 완료: /area/');
