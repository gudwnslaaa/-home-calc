// 교체 전 치수 기록 도우미(/measure/) 생성: node tools/build-measure.js
// 표준 치수는 단정하지 않음 — 어디를 어떻게 재는지 안내하고, 잰 값을 제품 설치 가능 범위와 비교하도록 함.
const kit = require('./site-kit');

const EXTRA_STYLE = `<style>
.tabs2{display:flex;gap:8px;margin-bottom:14px}
.tabs2 button{flex:1;padding:11px;border-radius:12px;border:1px solid var(--line);background:var(--field);color:var(--muted);font:inherit;font-weight:500;cursor:pointer}
.tabs2 button[aria-selected="true"]{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.fig{display:block;width:100%;max-width:360px;margin:4px auto 14px}
.fig text{font-family:inherit;font-size:11px;fill:var(--muted)}
.g3m{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.sub-h{font-size:.88rem;color:var(--ink);font-weight:500;margin:16px 0 8px}
.rec{margin-top:14px;padding:14px;border:1px dashed var(--line);border-radius:12px;font-size:.9rem;line-height:1.8;color:var(--ink);white-space:pre-line}
.warn2{margin-top:10px;font-size:.86rem;color:#9a4a00}
@media (max-width:560px){ .g3m{grid-template-columns:1fr 1fr 1fr;gap:6px} .g3m input{padding:10px 6px} }
</style>`;

const DOOR_SVG = `<svg class="fig" viewBox="0 0 360 230" role="img" aria-label="문틀 안쪽의 폭을 위·가운데·아래, 높이를 왼쪽·가운데·오른쪽에서 재는 위치">
  <rect x="110" y="20" width="140" height="190" rx="3" fill="none" stroke="currentColor" stroke-width="10" style="color:#8f969c"/>
  <rect x="115" y="25" width="130" height="185" fill="#f7f8f5"/>
  <g stroke="#c28e00" stroke-width="1.6" marker-start="url(#ah)" marker-end="url(#ah)">
    <line x1="118" y1="45" x2="242" y2="45"/><line x1="118" y1="115" x2="242" y2="115"/><line x1="118" y1="190" x2="242" y2="190"/>
  </g>
  <g stroke="#1f6fb2" stroke-width="1.6" marker-start="url(#ah2)" marker-end="url(#ah2)">
    <line x1="132" y1="28" x2="132" y2="207"/><line x1="180" y1="28" x2="180" y2="207"/><line x1="228" y1="28" x2="228" y2="207"/>
  </g>
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#c28e00"/></marker>
    <marker id="ah2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1f6fb2"/></marker>
  </defs>
  <text x="258" y="49">폭 ① 위</text><text x="258" y="119">폭 ② 가운데</text><text x="258" y="194">폭 ③ 아래</text>
  <text x="12" y="119">높이 ④⑤⑥</text><text x="12" y="134">왼쪽·가운데·오른쪽</text>
</svg>`;

const TOILET_SVG = `<svg class="fig" viewBox="0 0 360 200" role="img" aria-label="뒤쪽 벽 마감면에서 바닥 배수구 중심까지 거리를 재는 위치">
  <rect x="40" y="20" width="12" height="160" fill="#8f969c"/>
  <line x1="40" y1="180" x2="330" y2="180" stroke="#8f969c" stroke-width="6"/>
  <rect x="60" y="40" width="70" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="2" style="color:#5b636b"/>
  <path d="M70 110 h150 q20 0 20 20 q0 30 -40 40 h-110 z" fill="none" stroke="currentColor" stroke-width="2" style="color:#5b636b"/>
  <line x1="150" y1="176" x2="150" y2="188" stroke="#c28e00" stroke-width="2"/>
  <circle cx="150" cy="182" r="4" fill="#c28e00"/>
  <g stroke="#c28e00" stroke-width="1.6" marker-start="url(#bh)" marker-end="url(#bh)"><line x1="54" y1="194" x2="148" y2="194"/></g>
  <defs><marker id="bh" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#c28e00"/></marker></defs>
  <text x="62" y="16">뒤쪽 벽 (타일 마감면)</text>
  <text x="244" y="176">● 배수구 중심</text>
  <text x="200" y="198">← 이 거리를 기록</text>
</svg>`;

const faq = [
  ['방문을 바꾸려면 어디를 재야 하나요?', '문짝이 아니라 문틀 안쪽을 잽니다. 폭은 위·가운데·아래, 높이는 왼쪽·가운데·오른쪽 세 곳씩 재고, 그중 가장 작은 값을 기준으로 잡습니다. 문틀 두께와 문이 열리는 방향, 손잡이 위치도 함께 적어 두면 맞는 문을 고르기 쉽습니다.'],
  ['변기 교체 전에 꼭 재야 하는 것은?', '배수가 바닥으로 되는지 벽으로 되는지 먼저 확인하고, 뒤쪽 벽 마감면에서 배수구 중심까지의 거리를 잽니다. 새 변기의 상세 정보에 적힌 설치 가능 배수 거리 범위에 이 값이 들어가는지 확인해야 합니다. 기존 변기 옆면이나 뒷면의 모델명을 적어 두면 판매처에 문의할 때 도움이 됩니다.'],
  ['잰 값이 위·아래가 다르면 문제가 있나요?', '세 곳의 차이가 크다면 문틀이 틀어졌을 수 있습니다. 이 경우 문짝만 바꿔도 틈이 남을 수 있어, 문틀까지 손볼지 시공자와 상의하는 것이 좋습니다.'],
];

const html = kit.head({
  title: '교체 전 치수 기록 – 방문·변기 교체할 때 재야 할 곳과 재는 법',
  desc: '방문 교체 전 문틀 안쪽 폭·높이를 세 곳씩 재서 기준 치수를 잡고, 변기 교체 전 배수 방식과 벽에서 배수구 중심까지 거리를 기록해 두세요. 그림으로 재는 위치를 안내합니다.',
  url: 'https://jibcalc.com/measure/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 처음으로')}
    <h1>교체 전 치수 기록</h1>
    <p>방문·변기를 바꾸기 전에 어디를 재야 하는지 그림으로 안내하고, 잰 값을 정리해 드립니다.</p>
  </header>

  <div class="tabs2" role="tablist">
    <button type="button" role="tab" id="tDoor" aria-selected="true">방문</button>
    <button type="button" role="tab" id="tToilet" aria-selected="false">변기</button>
  </div>

  <section class="card" id="pDoor">
    <h2><span class="num">1</span>문틀 안쪽 재기 (mm)</h2>
    ${DOOR_SVG}
    <div class="sub-h">폭 (문틀 안쪽 왼쪽 ↔ 오른쪽)</div>
    <div class="g3m">
      <div><label for="dw1">① 위</label><input id="dw1" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
      <div><label for="dw2">② 가운데</label><input id="dw2" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
      <div><label for="dw3">③ 아래</label><input id="dw3" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
    </div>
    <div class="sub-h">높이 (바닥 ↔ 문틀 위쪽 안쪽)</div>
    <div class="g3m">
      <div><label for="dh1">④ 왼쪽</label><input id="dh1" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
      <div><label for="dh2">⑤ 가운데</label><input id="dh2" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
      <div><label for="dh3">⑥ 오른쪽</label><input id="dh3" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
    </div>
    <div class="grid g2" style="margin-top:14px">
      <div><label for="dt">문틀 두께 (벽 방향, mm)</label><input id="dt" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
      <div><label for="dopen">열리는 방향 (문을 밀어서 열 때)</label>
        <select id="dopen"><option value="">선택</option><option value="경첩 왼쪽">경첩이 왼쪽</option><option value="경첩 오른쪽">경첩이 오른쪽</option></select></div>
    </div>
    <p class="hint">줄자는 문틀에 바짝 대고 수평·수직으로 재세요. 바닥재를 새로 깔 계획이라면 바닥이 높아지는 만큼 높이가 줄어든다는 점도 함께 적어 두세요.</p>
  </section>

  <section class="card" id="pToilet" hidden>
    <h2><span class="num">1</span>변기 배수 위치 재기 (mm)</h2>
    ${TOILET_SVG}
    <div class="grid g2">
      <div><label for="tType">배수 방식</label>
        <select id="tType"><option value="바닥 배수" selected>바닥 배수</option><option value="벽 배수">벽 배수</option></select></div>
      <div><label for="tDist">뒤쪽 벽 마감면 ~ 배수구 중심</label><input id="tDist" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
    </div>
    <div class="grid g2" style="margin-top:14px">
      <div><label for="tFront">변기 앞 여유 (변기 앞 끝 ~ 맞은편 벽·문)</label><input id="tFront" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
      <div><label for="tSide">좌우 폭 (옆 벽 ~ 옆 벽·세면대)</label><input id="tSide" type="number" inputmode="numeric" min="0" placeholder="mm"></div>
    </div>
    <div style="margin-top:14px"><label for="tModel">지금 변기 모델명 (옆면·뒷면 스티커)</label><input id="tModel" type="text" placeholder="예) 제조사 모델명"></div>
    <p class="hint">배관이 바닥으로 들어가면 바닥 배수, 뒤쪽 벽으로 들어가면 벽 배수예요. 거리는 벽지·타일을 붙인 마감면에서 잽니다. 변기를 떼지 않고 잴 때는 새 제품 설명서나 판매처가 안내하는 기준점을 먼저 확인하세요.</p>
  </section>

  <section class="card result" aria-live="polite">
    <h2>측정 기록</h2>
    <div class="big">
      <div class="stat"><div class="k" id="k1">기준 폭</div><div class="v" id="v1">-</div></div>
      <div class="stat"><div class="k" id="k2">기준 높이</div><div class="v" id="v2">-</div></div>
    </div>
    <div class="detail" id="rDetail">잰 값을 넣어 주세요.</div>
    <div class="rec" id="rec"></div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>교체 전에 치수부터 기록하는 이유</h2>
    <p>방문과 변기는 크기가 조금만 달라도 설치가 안 되거나, 틈이 생기거나, 추가 공사가 필요해집니다. 매장이나 온라인에서 고르기 전에 우리 집 치수를 정확히 적어 두면 맞지 않는 제품을 살 일이 크게 줄어듭니다.</p>

    <h2>방문: 문짝 말고 문틀 안쪽</h2>
    <p>새 문은 문틀 안에 들어가야 하므로 문짝이 아니라 문틀 안쪽을 잽니다. 오래된 문틀은 조금씩 틀어져 있어서 한 곳만 재면 실제 설치 때 걸릴 수 있어요. 폭은 위·가운데·아래, 높이는 왼쪽·가운데·오른쪽 세 곳을 재고 가장 작은 값을 기준으로 잡습니다. 문이 처져 바닥을 긁는다면 교체 전에 경첩 나사가 풀렸는지 먼저 확인해 보세요. 경첩 조정만으로 해결되는 경우도 있습니다.</p>
    <p>현관문은 방화 성능 등 조건이 따로 있을 수 있으니, 공동주택이라면 관리사무소에 먼저 문의하세요.</p>

    <h2>변기: 배수 방식과 배수 거리</h2>
    <p>변기는 배관이 바닥으로 빠지는 바닥 배수와 뒤쪽 벽으로 빠지는 벽 배수가 있고, 둘은 서로 다른 제품을 씁니다. 바닥 배수라면 뒤쪽 벽 마감면에서 배수구 중심까지의 거리가 새 변기의 설치 가능 범위에 들어가야 합니다. 변기 앞 여유 공간과 좌우 폭도 함께 적어 두면 큰 변기를 골랐다가 문이 안 닫히는 일을 막을 수 있어요.</p>
    <p>욕실 바닥에 물이 새는 흔적이 있다면 변기만 바꿔서는 해결되지 않을 수 있습니다. 누수 원인을 먼저 점검하세요.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('measure')}
  </section>
${kit.foot('측정 안내는 참고용입니다. 설치 가능 여부는 제품 설명서와 판매처·시공자에게 꼭 확인하세요.')}
<script>
const $ = id => document.getElementById(id);
const num = id => { const v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : null; };
const mm = v => Math.round(v).toLocaleString('ko-KR') + 'mm';
let tab = 'door';

function setTab(t){
  tab = t;
  $('tDoor').setAttribute('aria-selected', t === 'door');
  $('tToilet').setAttribute('aria-selected', t === 'toilet');
  $('pDoor').hidden = t !== 'door';
  $('pToilet').hidden = t !== 'toilet';
  render();
}
$('tDoor').addEventListener('click', () => setTab('door'));
$('tToilet').addEventListener('click', () => setTab('toilet'));

function render(){
  if (tab === 'door') {
    const W = ['dw1','dw2','dw3'].map(num).filter(v => v), H = ['dh1','dh2','dh3'].map(num).filter(v => v);
    const w = W.length ? Math.min(...W) : null, h = H.length ? Math.min(...H) : null;
    $('k1').textContent = '기준 폭'; $('k2').textContent = '기준 높이';
    $('v1').innerHTML = w ? Math.round(w).toLocaleString('ko-KR') + '<small>mm</small>' : '-';
    $('v2').innerHTML = h ? Math.round(h).toLocaleString('ko-KR') + '<small>mm</small>' : '-';
    let d = '';
    if (!W.length && !H.length) d = '잰 값을 넣어 주세요.';
    else {
      d = '세 곳 중 <b>가장 작은 값</b>을 기준으로 잡았어요.';
      const dw = W.length > 1 ? Math.max(...W) - Math.min(...W) : 0, dh = H.length > 1 ? Math.max(...H) - Math.min(...H) : 0;
      if (dw || dh) d += '<div class="warn2">위치별 차이: 폭 ' + mm(dw) + ' · 높이 ' + mm(dh) + '. 차이가 크다면 문틀이 틀어졌을 수 있으니 문틀 교체 여부를 시공자와 상의하세요.</div>';
    }
    $('rDetail').innerHTML = d;
    const t = num('dt'), o = $('dopen').value;
    const lines = ['[방문 치수 기록]'];
    if (w) lines.push('문틀 안쪽 폭: ' + mm(w) + (W.length > 1 ? ' (잰 값 ' + W.map(mm).join(' / ') + ')' : ''));
    if (h) lines.push('문틀 안쪽 높이: ' + mm(h) + (H.length > 1 ? ' (잰 값 ' + H.map(mm).join(' / ') + ')' : ''));
    if (t) lines.push('문틀 두께: ' + mm(t));
    if (o) lines.push('열리는 방향: ' + o);
    $('rec').textContent = lines.length > 1 ? lines.join('\\n') : '';
    $('rec').style.display = lines.length > 1 ? 'block' : 'none';
  } else {
    const type = $('tType').value, dist = num('tDist'), front = num('tFront'), side = num('tSide'), model = $('tModel').value.trim();
    $('k1').textContent = '배수 방식'; $('k2').textContent = '배수 거리';
    $('v1').innerHTML = '<span style="font-size:1.1rem">' + type + '</span>';
    $('v2').innerHTML = dist ? Math.round(dist).toLocaleString('ko-KR') + '<small>mm</small>' : '-';
    $('rDetail').innerHTML = dist
      ? '새 변기 상세 정보의 <b>' + type + ' · 설치 가능 배수 거리 범위</b>에 ' + mm(dist) + '가 들어가는지 확인하세요. 범위를 맞출 수 있는 제품(배수 거리 조절형)도 있으니 판매처에 이 기록을 보여 주면 빠릅니다.'
      : '배수 방식을 고르고 거리를 넣어 주세요.';
    const lines = ['[변기 치수 기록]', '배수 방식: ' + type];
    if (dist) lines.push('뒤쪽 벽 마감면 ~ 배수구 중심: ' + mm(dist));
    if (front) lines.push('변기 앞 여유 공간: ' + mm(front));
    if (side) lines.push('좌우 폭: ' + mm(side));
    if (model) lines.push('지금 변기 모델명: ' + model);
    $('rec').textContent = lines.join('\\n');
    $('rec').style.display = 'block';
  }
}
document.addEventListener('input', render);
document.addEventListener('change', render);
render();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('measure/index.html', html);
console.log('생성 완료: /measure/');
