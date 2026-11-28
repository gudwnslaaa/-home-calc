// 폐기물 정리 도우미(/waste/) 생성: node tools/build-waste.js
// 제도 내용은 지자체·한국전자제품자원순환공제조합(15990903.or.kr) 공개 안내 기준.
// 수수료는 지자체 조례마다 달라 금액을 적지 않고, 신청 경로만 안내한다.
const kit = require('./site-kit');

// type: big=대형가전(1개부터 무상수거) / small=중소형가전(5개 이상 묶음) / large=대형폐기물 신고 / debris=불연성 공사 잔재 / burn=가연성 소량
const GROUPS = [
  { title: '가전제품', note: '무상방문수거 대상', items: [
    ['냉장고', 'big'], ['김치냉장고', 'big'], ['세탁기', 'big'], ['에어컨 (실내기·실외기)', 'big'], ['TV·모니터 31인치 이상', 'big'],
    ['전자레인지', 'small'], ['전기오븐', 'small'], ['공기청정기', 'small'], ['정수기', 'small'], ['선풍기', 'small'], ['가습기', 'small'], ['TV·모니터 30인치 이하', 'small'],
  ] },
  { title: '가구·생활용품', note: '대형폐기물 신고 대상', items: [
    ['소파', 'large'], ['침대 프레임', 'large'], ['매트리스', 'large'], ['장롱·옷장', 'large'], ['서랍장', 'large'], ['책상', 'large'], ['책장', 'large'], ['식탁', 'large'], ['의자', 'large'],
  ] },
  { title: '공사하며 뜯어내는 것', note: '설비·바닥재와 공사 잔재', items: [
    ['싱크대', 'large'], ['세면대', 'large'], ['변기', 'large'], ['장판', 'large'], ['문짝·몰딩 등 폐목재', 'large'],
    ['깨진 타일·벽돌·시멘트 조각', 'debris'], ['깨진 유리·거울', 'debris'], ['뜯어낸 벽지·비닐 (소량)', 'burn'],
  ] },
];

const EXTRA_STYLE = `<style>
.group{margin-top:6px}
.group + .group{margin-top:22px}
.group h3{font-size:.95rem;font-weight:500;margin:0 0 8px;color:var(--ink)}
.group h3 small{color:var(--muted);font-weight:400;margin-left:6px;font-size:.8rem}
.items{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.it{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border:1px solid var(--line);border-radius:12px;background:var(--field)}
.it.on{border-color:var(--accent);background:var(--accent-soft)}
.it span{font-size:.9rem;line-height:1.3}
.step{display:flex;align-items:center;gap:6px;flex-shrink:0}
.step button{width:44px;height:44px;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:1rem;cursor:pointer;line-height:1}
.step b{min-width:18px;text-align:center;font-weight:600;font-size:.95rem}
.plan{margin-top:16px;display:grid;gap:12px}
.pl{border:1px solid var(--line);border-radius:14px;padding:14px;background:var(--field)}
.pl h4{margin:0 0 6px;font-size:.98rem;font-weight:600;color:var(--ink)}
.pl h4 .cnt{color:var(--accent);margin-left:6px}
.pl p,.pl li{font-size:.88rem;color:var(--muted);line-height:1.6;margin:0}
.pl ul{margin:6px 0 0;padding-left:18px}
.pl .links{margin-top:10px;display:flex;flex-wrap:wrap;gap:8px}
.pl a.btn{text-decoration:none;display:inline-block}
.region{display:flex;gap:8px;margin-top:10px}
.region input{flex:1}
.empty{color:var(--muted);font-size:.9rem;margin-top:14px}
@media (max-width:560px){ .items{grid-template-columns:1fr} }
</style>`;

const faq = [
  ['냉장고나 세탁기도 대형폐기물 스티커를 붙여야 하나요?', '냉장고, 세탁기, 에어컨처럼 무상방문수거 대상인 가전은 폐가전 방문수거 배출예약시스템(1599-0903, 15990903.or.kr)에 예약하면 1대부터 수수료 없이 수거됩니다. 다만 철거·분리가 끝난 상태여야 하고, 사다리차가 필요한 곳은 수거가 어려울 수 있습니다.'],
  ['소형 가전이 1~2개뿐이면 어떻게 버리나요?', '중소형 가전은 보통 5개 이상 모아야 방문수거가 됩니다. 5개가 안 되면 주민센터 소형가전 수거함이나 지자체 별도 신청 등 지역마다 방법이 다르니, 사는 곳의 구청·시청 안내를 확인하세요.'],
  ['대형폐기물 수수료는 얼마인가요?', '수수료는 지자체 조례에 따라 품목·크기별로 정해져 지역마다 다릅니다. 구청·시청 누리집이나 지자체가 연결한 신청 앱에서 품목을 고르면 금액이 안내됩니다.'],
  ['인테리어하고 남은 타일 조각은 어디에 버리나요?', '깨진 타일, 벽돌 같은 불연성 폐기물은 소량이면 지자체가 정한 불연성 폐기물 전용 봉투(마대)에 담아 배출합니다. 양이 많으면 지자체에 신고한 뒤 처리업체에 맡겨야 하고, 한 공사에서 5톤 이상 나오면 건설폐기물로 따로 처리해야 합니다.'],
];

const html = kit.head({
  title: '폐기물 정리 도우미 – 대형폐기물·폐가전 무상수거·공사 잔재 버리는 법',
  desc: '공사나 이사 전에 버릴 물건을 고르면 폐가전 무상방문수거, 대형폐기물 신고, 타일·벽돌 같은 공사 잔재까지 어떻게 버리는지 한 번에 정리해 드립니다.',
  url: 'https://jibcalc.com/waste/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 처음으로')}
    <h1>폐기물 정리 도우미</h1>
    <p>버릴 물건을 고르면, 어디로 어떻게 버리는지 정리해 드립니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>버릴 물건 고르기</h2>
${GROUPS.map((g, gi) => `    <div class="group"><h3>${g.title}<small>${g.note}</small></h3><div class="items">
${g.items.map(([n, t], i) => `      <div class="it" data-type="${t}" data-name="${n}"><span>${n}</span><div class="step"><button type="button" class="minus" aria-label="${n} 빼기">−</button><b class="cnt">0</b><button type="button" class="plus" aria-label="${n} 추가">+</button></div></div>`).join('\n')}
    </div></div>`).join('\n')}
    <p class="hint">목록에 없는 물건은 비슷한 품목으로 골라 보세요. 지자체 신청 화면에서도 비슷한 품목으로 신청하도록 안내하는 경우가 많습니다.</p>
  </section>

  <section class="card result" aria-live="polite">
    <h2>버리는 방법 정리</h2>
    <div class="big">
      <div class="stat"><div class="k">무상수거 가전</div><div class="v" id="sFree">0<small>개</small></div></div>
      <div class="stat"><div class="k">대형폐기물 신고</div><div class="v" id="sLarge">0<small>개</small></div></div>
    </div>
    <div class="detail" id="rDetail">버릴 물건을 골라 주세요.</div>
    <div id="plan" class="plan"></div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>공사 전에 버릴 것부터 정리해야 하는 이유</h2>
    <p>인테리어 공사는 철거부터 시작하는데, 버릴 가구와 가전이 집 안에 남아 있으면 작업 공간이 없어 일정이 밀리기 쉽습니다. 폐가전 방문수거는 접수 순서에 따라 방문일이 정해지고, 대형폐기물도 배출일 전에 신고를 마쳐야 하니 공사 날짜보다 여유 있게 준비하는 게 좋습니다.</p>

    <h2>세 갈래로 나누면 쉬워요</h2>
    <h3>1. 가전은 무상방문수거부터</h3>
    <p>냉장고, 세탁기, 에어컨, 31인치 이상 TV·모니터 같은 가전은 1대만 있어도 폐가전 방문수거 배출예약시스템(전화 1599-0903, 누리집 15990903.or.kr)으로 예약하면 수수료 없이 수거됩니다. 전자레인지, 공기청정기처럼 작은 가전은 보통 5개 이상 모아야 방문수거가 되고, 지역에 따라 소형 가전까지 수거 범위를 넓힌 곳도 있습니다. 에어컨처럼 벽에 달린 제품은 철거와 분리가 끝난 상태여야 합니다.</p>
    <h3>2. 가구·설비는 대형폐기물 신고</h3>
    <p>소파, 침대, 장롱 같은 가구와 공사 때 뜯어낸 싱크대, 세면대, 변기, 장판 등은 대형폐기물로 신고하고 수수료를 낸 뒤 배출합니다. 신청은 구청·시청 누리집, 지자체가 연결한 신청 앱, 또는 종량제봉투 판매소의 스티커 구입 등 지역마다 방법이 다릅니다. 신고한 품목과 실제 내놓은 물건이 다르거나 수수료가 모자라면 수거되지 않을 수 있으니, 침대처럼 프레임과 매트리스가 나뉘는 물건은 각각 신고하세요.</p>
    <h3>3. 공사 잔재는 따로</h3>
    <p>깨진 타일, 벽돌, 시멘트 조각 같은 불에 타지 않는 폐기물은 종량제 봉투가 아니라 지자체가 정한 불연성 폐기물 전용 봉투(마대)에 담아 배출합니다. 양이 많으면 지자체에 신고한 뒤 처리업체에 맡기고, 한 공사에서 나오는 폐기물이 5톤 이상이면 건설폐기물로 따로 처리해야 합니다. 인테리어 업체에 공사를 맡겼다면 계약할 때 철거 폐기물 처리가 포함되는지 먼저 확인하세요.</p>

    <h2>버리기 전에 한 번 더</h2>
    <p>아직 쓸 수 있는 가구나 가전은 중고 거래나 기부로 먼저 처분하면 수수료도 아끼고 짐도 빨리 줄일 수 있습니다. 지자체에 따라 재사용 가능한 물품을 따로 수거하는 곳도 있으니 신고 전에 확인해 보세요.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
    <p class="hint">제도와 수거 기준은 지자체마다 다르고 바뀔 수 있습니다. 배출 전에 사는 곳의 구청·시청 안내를 꼭 확인하세요.</p>
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('waste')}
  </section>
${kit.foot('안내는 참고용입니다. 수수료와 배출 방법은 사는 곳의 구청·시청 안내를 따르세요.')}
<script>
const $ = id => document.getElementById(id);
const items = [...document.querySelectorAll('.it')];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

items.forEach(el => {
  const cnt = el.querySelector('.cnt');
  const set = v => { v = Math.max(0, Math.min(99, v)); cnt.textContent = v; el.classList.toggle('on', v > 0); render(); };
  el.querySelector('.plus').addEventListener('click', () => set(+cnt.textContent + 1));
  el.querySelector('.minus').addEventListener('click', () => set(+cnt.textContent - 1));
});

function pick(type){
  return items.filter(el => el.dataset.type === type && +el.querySelector('.cnt').textContent > 0)
    .map(el => ({ name: el.dataset.name, n: +el.querySelector('.cnt').textContent }));
}
const sum = arr => arr.reduce((a, b) => a + b.n, 0);
const list = arr => arr.map(x => esc(x.name) + (x.n > 1 ? ' ' + x.n + '개' : '')).join(', ');

let regionVal = '';
function regionBox(){
  return '<div class="region"><input id="region" type="text" value="' + esc(regionVal) + '" placeholder="사는 곳 (예: 송파구, 수원시)" aria-label="사는 지역"><a class="btn" id="regionGo" href="#" target="_blank" rel="noopener">신청 방법 찾기</a></div>';
}

function render(){
  const big = pick('big'), small = pick('small'), large = pick('large'), debris = pick('debris'), burn = pick('burn');
  const nBig = sum(big), nSmall = sum(small), nLarge = sum(large);
  $('sFree').innerHTML = (nBig + (nSmall >= 5 || nBig > 0 ? nSmall : 0)) + '<small>개</small>';
  $('sLarge').innerHTML = nLarge + '<small>개</small>';

  const blocks = [];
  if (nBig || nSmall) {
    let body = '';
    if (nBig) body += '<p>대형 가전: ' + list(big) + '</p>';
    if (nSmall) body += '<p>중소형 가전: ' + list(small) + '</p>';
    const tips = ['예약: 전화 1599-0903 또는 누리집 15990903.or.kr', '벽에 단 에어컨·TV는 철거와 분리를 마친 상태여야 수거됩니다.', '방문일은 접수 순서대로 정해지니 공사 날짜보다 여유 있게 예약하세요.'];
    if (nSmall && nSmall < 5) tips.splice(1, 0, nBig
      ? '중소형 가전이 5개가 안 되지만, 대형 가전과 함께 낼 때 같이 받아 주는지 예약할 때 문의해 보세요.'
      : '중소형 가전은 보통 5개 이상이어야 방문수거가 됩니다. 5개 미만이면 주민센터 수거함 등 지역 안내를 따르세요.');
    blocks.push('<div class="pl"><h4>폐가전 무상방문수거<span class="cnt">' + (nBig + nSmall) + '개</span></h4>' + body + '<ul>' + tips.map(t => '<li>' + t + '</li>').join('') + '</ul><div class="links"><a class="btn primary" href="https://www.15990903.or.kr" target="_blank" rel="noopener">방문수거 예약하기</a></div></div>');
  }
  if (nLarge) {
    const tips = ['구청·시청 누리집, 지자체가 연결한 신청 앱, 또는 종량제봉투 판매소 스티커로 신고하고 수수료를 냅니다.', '받은 신고필증이나 신고번호를 물건에 붙이거나 적어서 정해진 날·장소에 내놓습니다.', '신고한 품목과 실제 물건이 다르면 수거되지 않을 수 있어요.'];
    if (large.some(x => x.name === '매트리스') && large.some(x => x.name === '침대 프레임')) tips.push('침대 프레임과 매트리스는 따로 신고하세요.');
    blocks.push('<div class="pl"><h4>대형폐기물 신고<span class="cnt">' + nLarge + '개</span></h4><p>' + list(large) + '</p><ul>' + tips.map(t => '<li>' + t + '</li>').join('') + '</ul><p style="margin-top:10px">수수료는 지역마다 달라요. 사는 곳을 넣으면 신청 방법을 찾아 드립니다.</p>' + regionBox() + '</div>');
  }
  if (debris.length) {
    blocks.push('<div class="pl"><h4>불연성 공사 잔재</h4><p>' + list(debris) + '</p><ul><li>소량이면 지자체가 정한 불연성 폐기물 전용 봉투(마대)에 담아 배출합니다. 종량제 봉투에 넣으면 안 돼요.</li><li>양이 많으면 지자체에 신고한 뒤 처리업체에 맡깁니다. 한 공사에서 5톤 이상이면 건설폐기물로 처리해야 해요.</li><li>업체에 공사를 맡겼다면 철거 폐기물 처리가 견적에 들어 있는지 먼저 확인하세요.</li></ul></div>');
  }
  if (burn.length) {
    blocks.push('<div class="pl"><h4>가연성 소량 폐기물</h4><p>' + list(burn) + '</p><ul><li>소량이면 종량제 봉투에 담아 배출합니다. 공사 폐기물이 많다면 지역의 공사장 생활폐기물 신고 기준을 확인하세요.</li></ul></div>');
  }
  $('plan').innerHTML = blocks.join('');
  const total = nBig + nSmall + nLarge + sum(debris) + sum(burn);
  $('rDetail').innerHTML = total
    ? '고른 물건 <b>' + total + '개</b>를 버리는 방법별로 나눴어요. 쓸 만한 물건은 중고 거래나 기부를 먼저 고려해 보세요.'
    : '버릴 물건을 골라 주세요.';
  const go = $('regionGo');
  if (go) {
    const upd = () => { regionVal = $('region').value; const r = regionVal.trim(); go.href = 'https://search.naver.com/search.naver?query=' + encodeURIComponent((r ? r + ' ' : '') + '대형폐기물 배출 신고'); };
    $('region').addEventListener('input', upd); upd();
  }
}
render();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('waste/index.html', html);
console.log('생성 완료: /waste/');
