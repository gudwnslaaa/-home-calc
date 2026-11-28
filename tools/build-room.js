// 방 가구 배치 도우미(/room/) 생성: node tools/build-room.js
const kit = require('./site-kit');
const rm = require('./room-math');

// 예시 크기(cm). 제품마다 다르므로 화면에서 고쳐 쓰게 함
const PRESETS = [
  ['싱글 침대', 100, 200], ['슈퍼싱글 침대', 110, 200], ['퀸 침대', 150, 200], ['킹 침대', 160, 200],
  ['옷장', 120, 60], ['서랍장', 80, 45], ['책상', 120, 60], ['의자', 50, 50],
  ['소파', 200, 90], ['TV장', 180, 40], ['식탁', 120, 80], ['냉장고', 90, 90], ['세탁기', 70, 70], ['화장대', 80, 40],
];

const EXTRA_STYLE = `<style>
.plan-wrap{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);margin-top:18px;padding:12px;position:relative}
#plan{width:100%;height:auto;display:block;touch-action:none;user-select:none;-webkit-user-select:none}
#plan .f{cursor:grab}
#plan .f.sel rect{stroke-width:3}
#plan .f text{pointer-events:none;font-family:inherit}
.presets{display:flex;flex-wrap:wrap;gap:6px}
.presets button{height:44px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:.86rem;cursor:pointer}
.presets button:hover{border-color:var(--ink);background:var(--accent-soft)}
.selbox{margin-top:12px;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--soft)}
.selbox[hidden]{display:none}
.selrow{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px}
.nudge{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;align-items:center}
.nudge button{min-width:48px;height:44px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;cursor:pointer}
.nudge button.wide{padding:0 12px}
.nudge .sp{flex:1}
.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:.82rem;color:var(--muted);margin-top:8px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.check{display:flex;align-items:center;gap:10px;font-size:.95rem;color:var(--ink);cursor:pointer;font-weight:500;margin-top:6px}
.check input{width:20px;height:20px;accent-color:#1c2024;margin:0}
.warns{margin:10px 0 0;padding-left:18px}
.warns li{margin:3px 0}
</style>`;

const faq = [
  ['퀸 침대와 슈퍼싱글 침대 크기는?', '매트리스 기준으로 퀸은 가로 1500 × 세로 2000mm, 슈퍼싱글은 1100 × 2000mm 제품이 많습니다. 다만 프레임은 매트리스보다 커서, 슈퍼싱글이라도 프레임 길이가 2170mm인 제품이 있습니다. 배치할 때는 프레임 치수를 넣으세요.'],
  ['가구 사이 통로는 얼마나 남겨야 하나요?', '정해진 기준은 없고 사람과 쓰임에 따라 다릅니다. 이 도우미는 ‘편하게 지나갈 폭’을 직접 정하게 하고, 그보다 좁은 틈을 표시해 줍니다. 기본값 60cm는 예시예요.'],
  ['방문이 가구에 걸리는지 확인할 수 있나요?', '문이 달린 벽, 위치, 폭, 경첩 쪽을 넣으면 문이 열리는 반원 영역을 그려 주고, 가구가 그 안에 들어가면 빨갛게 표시합니다. 미닫이 문은 ‘미닫이·열림 없음’을 켜세요.'],
  ['넣은 배치는 저장되나요?', '이 기기의 브라우저에만 저장되어 다시 들어오면 이어서 볼 수 있습니다. ‘평면도 그림 저장’으로 이미지를 받아 두면 가구 매장이나 가족에게 보여 주기 좋습니다.'],
];

const html = kit.head({
  title: '가구 배치 도우미 – 방 크기에 침대·옷장 넣어 보기, 침대 사이즈·통로 폭 확인',
  desc: '방 가로·세로를 넣고 퀸·슈퍼싱글 침대, 옷장, 책상, 소파를 끌어다 놓아 보세요. 문이 걸리는지, 가구 사이 통로가 몇 cm 남는지 바로 보여 주는 무료 가구 배치 도우미입니다.',
  url: 'https://jibcalc.com/room/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 처음으로')}
    <h1>가구 배치 도우미</h1>
    <p>사기 전에 넣어 보세요. 방에 가구를 끌어다 놓으면 문이 걸리는지, 통로가 몇 cm 남는지 바로 보입니다.</p>
  </header>

  <section class="card">
    <h2><span class="num">1</span>방과 문</h2>
    <div class="grid g2">
      <div><label for="rw">방 가로 (cm)</label><input id="rw" data-unit="none" type="number" inputmode="numeric" min="100" step="1" value="330"></div>
      <div><label for="rd">방 세로 (cm)</label><input id="rd" data-unit="none" type="number" inputmode="numeric" min="100" step="1" value="360"></div>
    </div>
    <div class="grid g2" style="margin-top:12px">
      <div><label for="dwall">문이 있는 벽</label>
        <select id="dwall"><option value="bottom" selected>아래쪽 벽</option><option value="top">위쪽 벽</option><option value="left">왼쪽 벽</option><option value="right">오른쪽 벽</option></select></div>
      <div><label for="dpos">벽 끝에서 문까지 (cm)</label><input id="dpos" data-unit="none" type="number" inputmode="numeric" min="0" step="1" value="230"></div>
      <div><label for="dw">문 폭 (cm)</label><input id="dw" data-unit="none" type="number" inputmode="numeric" min="50" step="1" value="90"></div>
      <div><label for="dh">경첩 쪽</label>
        <select id="dh"><option value="a">벽 시작 쪽</option><option value="b" selected>벽 끝 쪽</option></select></div>
    </div>
    <label class="check"><input id="dslide" type="checkbox"> 미닫이·열림 없음 (문 열림 영역 안 그림)</label>
    <p class="hint">위쪽·아래쪽 벽은 왼쪽 끝에서, 왼쪽·오른쪽 벽은 위쪽 끝에서 잰 거리예요. 그림을 보며 맞추세요.</p>
  </section>

  <section class="card">
    <h2><span class="num">2</span>가구 넣기</h2>
    <div class="presets" id="presets">
${PRESETS.map(([n, w, d]) => `      <button type="button" data-n="${n}" data-w="${w}" data-d="${d}">+ ${n}</button>`).join('\n')}
      <button type="button" data-n="가구" data-w="80" data-d="50">+ 직접 만들기</button>
    </div>
    <p class="hint">버튼의 크기는 흔한 <b>예시 크기</b>예요. 넣은 뒤 실제 제품 치수(프레임 포함 바깥 치수)로 고쳐 쓰세요.</p>
    <div class="grid g2" style="margin-top:12px">
      <div><label for="minPass">편하게 지나갈 폭 (cm)</label><input id="minPass" data-unit="none" type="number" inputmode="numeric" min="10" step="5" value="60"></div>
    </div>
  </section>

  <div class="plan-wrap">
    <svg id="plan" role="img" aria-label="방 평면도"></svg>
    <div class="legend"><span><i style="background:#fff3c4;border:1px solid #1c2024"></i>가구</span><span><i style="background:#ffd9d2;border:1px solid #b3261e"></i>겹침·문 걸림</span><span><i style="background:#e8efe6;border:1px dashed #5b636b"></i>문 열림 영역</span></div>
    <div class="selbox" id="selbox" hidden>
      <div class="selrow">
        <div><label for="sn">이름</label><input id="sn" type="text"></div>
        <div><label for="sw">가로 (cm)</label><input id="sw" data-unit="none" type="number" inputmode="numeric" min="5" step="1"></div>
        <div><label for="sd">세로 (cm)</label><input id="sd" data-unit="none" type="number" inputmode="numeric" min="5" step="1"></div>
      </div>
      <div class="nudge">
        <button type="button" data-mv="-5,0" aria-label="왼쪽으로 5cm">←</button>
        <button type="button" data-mv="0,-5" aria-label="위로 5cm">↑</button>
        <button type="button" data-mv="0,5" aria-label="아래로 5cm">↓</button>
        <button type="button" data-mv="5,0" aria-label="오른쪽으로 5cm">→</button>
        <span class="sp"></span>
        <button type="button" class="wide" id="rotBtn">90° 돌리기</button>
        <button type="button" class="wide" id="dupBtn">복사</button>
        <button type="button" class="wide" id="delBtn">빼기</button>
      </div>
    </div>
    <p class="hint" style="margin:8px 4px 2px">가구를 눌러 고르고 끌어서 옮기세요. 고른 가구는 화살표로 5cm씩 움직일 수 있어요.</p>
  </div>

  <section class="card result" aria-live="polite">
    <h2>배치 결과</h2>
    <div class="big">
      <div class="stat"><div class="k">가구가 차지하는 바닥</div><div class="v" id="rUsed">0<small>%</small></div></div>
      <div class="stat"><div class="k">걸리는 곳</div><div class="v" id="rBad">0<small>곳</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
    <ul class="warns detail" id="rWarn"></ul>
    <div class="actions" style="margin-top:12px"><button type="button" class="btn primary" id="pngBtn">평면도 그림 저장</button></div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <article>
    <h2>침대는 매트리스가 아니라 프레임 치수로</h2>
    <p>매트리스 크기는 퀸이 1500 × 2000mm, 슈퍼싱글이 1100 × 2000mm인 제품이 많습니다. 하지만 방에 들어가는 건 프레임이에요. 헤드보드가 있는 프레임은 매트리스보다 길어서, 같은 슈퍼싱글이라도 프레임 길이가 2170mm인 제품이 있습니다. 판매 페이지에서 ‘프레임 전체 크기’를 찾아 넣어야 실제와 맞습니다.</p>

    <h2>먼저 큰 가구, 그다음 문과 통로</h2>
    <p>침대·옷장·소파처럼 큰 가구 자리부터 잡고, 문이 열리는 영역과 지나다닐 길을 비워 둔 뒤 작은 가구를 채우면 실패가 줄어듭니다. 옷장은 문을 여는 공간까지, 서랍장은 서랍을 빼는 공간까지 앞쪽을 비워 두세요. 이 도우미에서 가구 앞에 빈 상자를 하나 넣어 두면 그 공간을 확인할 수 있어요.</p>

    <h2>방 크기를 그대로 다른 계산기로</h2>
    <p>배치를 정했다면 같은 방 크기로 <a href="/floor/" id="lnkFloor">장판·마루</a>, <a href="/wallpaper/" id="lnkWall">도배지</a> 수량을 바로 계산하고, <a href="/pyeong/">평수</a>도 확인해 보세요. 이사 날짜에 맞춰 할 일을 정리하려면 <a href="/moving/">이사 체크리스트</a>도 있어요.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('room')}
  </section>
${kit.foot('가구 크기 기본값은 예시입니다. 실제 제품 치수와 방 실측값으로 확인하세요.')}
<script>
${rm.inline()}
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const KEY = 'jibcalc-room-v1';
let store = null; try { store = window.localStorage; } catch (e) {}
let items = [], sel = -1, drag = null;
const num = (id, d) => { const v = parseFloat($(id).value); return v > 0 ? v : d; };
const snap = v => Math.round(v / 5) * 5;
function room(){ return { W: Math.min(3000, num('rw', 330)), D: Math.min(3000, num('rd', 360)) }; }
function door(){ return { wall: $('dwall').value, pos: Math.max(0, parseFloat($('dpos').value) || 0), w: num('dw', 90), hinge: $('dh').value, slide: $('dslide').checked }; }
function clamp(it){ const { W, D } = room(); it.x = Math.max(0, Math.min(W - it.w, it.x)); it.y = Math.max(0, Math.min(D - it.d, it.y)); }

function freeSpot(w, d){
  const { W, D } = room();
  for (let y = 0; y + d <= D; y += 10) for (let x = 0; x + w <= W; x += 10) {
    const c = { x, y, w, d };
    if (!items.some(o => overlaps(c, o))) return { x, y };
  }
  return { x: 0, y: 0 };
}
function addItem(n, w, d){
  const p = freeSpot(w, d);
  items.push({ n, w, d, x: p.x, y: p.y });
  sel = items.length - 1;
  render();
}

function el(tag, attrs, parent){ const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function render(){
  const { W, D } = room();
  const dr = door();
  const pad = Math.max(W, D) * 0.07;
  const svg = $('plan');
  svg.setAttribute('viewBox', [-pad, -pad, W + pad * 2, D + pad * 2].join(' '));
  svg.innerHTML = '';
  const fs = Math.max(W, D) / 34;
  // 바닥과 50cm 격자
  el('rect', { x: 0, y: 0, width: W, height: D, fill: '#fbfbf9' }, svg);
  const g = el('g', { stroke: '#e3e6df', 'stroke-width': 1 }, svg);
  for (let x = 50; x < W; x += 50) el('line', { x1: x, y1: 0, x2: x, y2: D }, g);
  for (let y = 50; y < D; y += 50) el('line', { x1: 0, y1: y, x2: W, y2: y }, g);
  // 문 열림 영역
  const z = doorZone(dr, W, D);
  if (z) {
    const sx = z.box.x === z.hx ? 1 : -1, sy = z.box.y === z.hy ? 1 : -1;
    let path;
    if (dr.wall === 'top' || dr.wall === 'bottom') {
      const ex = z.hx + sx * z.r, ey = z.hy, oy = z.hy + sy * z.r;
      path = 'M' + z.hx + ' ' + z.hy + ' L' + ex + ' ' + ey + ' A' + z.r + ' ' + z.r + ' 0 0 ' + (sx * sy > 0 ? 1 : 0) + ' ' + z.hx + ' ' + oy + ' Z';
    } else {
      const ex = z.hx, ey = z.hy + sy * z.r, ox = z.hx + sx * z.r;
      path = 'M' + z.hx + ' ' + z.hy + ' L' + ex + ' ' + ey + ' A' + z.r + ' ' + z.r + ' 0 0 ' + (sx * sy > 0 ? 0 : 1) + ' ' + ox + ' ' + z.hy + ' Z';
    }
    el('path', { d: path, fill: '#e8efe6', stroke: '#5b636b', 'stroke-dasharray': '6 5', 'stroke-width': 1.5 }, svg);
  }
  // 벽 (문 자리는 비움)
  const wall = el('g', { stroke: '#1c2024', 'stroke-width': Math.max(6, fs * 0.45), 'stroke-linecap': 'square', fill: 'none' }, svg);
  const segs = { top: [[0, 0], [W, 0]], bottom: [[0, D], [W, D]], left: [[0, 0], [0, D]], right: [[W, 0], [W, D]] };
  for (const k in segs) {
    const [[x1, y1], [x2, y2]] = segs[k];
    if (k === dr.wall) {
      const horiz = k === 'top' || k === 'bottom';
      const a = dr.pos, b = dr.pos + dr.w;
      if (horiz) { if (a > 0) el('line', { x1: 0, y1, x2: Math.min(a, W), y2 }, wall); if (b < W) el('line', { x1: b, y1, x2: W, y2 }, wall); }
      else { if (a > 0) el('line', { x1, y1: 0, x2, y2: Math.min(a, D) }, wall); if (b < D) el('line', { x1, y1: b, x2, y2: D }, wall); }
    } else el('line', { x1, y1, x2, y2 }, wall);
  }
  // 치수
  el('text', { x: W / 2, y: -pad * 0.35, 'text-anchor': 'middle', 'font-size': fs, fill: '#5b636b' }, svg).textContent = W + 'cm';
  const t = el('text', { x: -pad * 0.35, y: D / 2, 'text-anchor': 'middle', 'font-size': fs, fill: '#5b636b', transform: 'rotate(-90 ' + (-pad * 0.35) + ' ' + (D / 2) + ')' }, svg); t.textContent = D + 'cm';
  // 가구
  const res = analyze(items, W, D, dr, num('minPass', 60));
  const badSet = new Set(res.bad);
  items.forEach((it, i) => {
    const gI = el('g', { class: 'f' + (i === sel ? ' sel' : ''), 'data-i': i, tabindex: 0, role: 'button', 'aria-label': it.n + ' ' + it.w + '×' + it.d + 'cm' }, svg);
    el('rect', { x: it.x, y: it.y, width: it.w, height: it.d, rx: 3, fill: badSet.has(i) ? '#ffd9d2' : (i === sel ? '#ffe58a' : '#fff3c4'), stroke: badSet.has(i) ? '#b3261e' : '#1c2024', 'stroke-width': 1.5 }, gI);
    const f2 = Math.min(fs, it.w / 5, it.d / 2.4);
    const tx = el('text', { x: it.x + it.w / 2, y: it.y + it.d / 2 - f2 * 0.15, 'text-anchor': 'middle', 'font-size': f2, 'font-weight': 600, fill: '#1c2024' }, gI); tx.textContent = it.n;
    const ts = el('text', { x: it.x + it.w / 2, y: it.y + it.d / 2 + f2 * 1.05, 'text-anchor': 'middle', 'font-size': f2 * 0.8, fill: '#5b636b' }, gI); ts.textContent = it.w + '×' + it.d;
  });
  // 좁은 틈 표시선
  res.narrow.forEach(n => {
    const a = items[n.i];
    let x1, y1, x2, y2;
    const cx = a.x + a.w / 2, cy = a.y + a.d / 2;
    if (n.side === '왼쪽') { x1 = a.x - n.gap; x2 = a.x; y1 = y2 = cy; }
    if (n.side === '오른쪽') { x1 = a.x + a.w; x2 = x1 + n.gap; y1 = y2 = cy; }
    if (n.side === '위쪽') { y1 = a.y - n.gap; y2 = a.y; x1 = x2 = cx; }
    if (n.side === '아래쪽') { y1 = a.y + a.d; y2 = y1 + n.gap; x1 = x2 = cx; }
    el('line', { x1, y1, x2, y2, stroke: '#b3261e', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
    el('text', { x: (x1 + x2) / 2 + (x1 === x2 ? fs * 0.3 : 0), y: (y1 + y2) / 2 - (y1 === y2 ? fs * 0.3 : 0), 'font-size': fs * 0.8, fill: '#b3261e', 'font-weight': 600, 'text-anchor': x1 === x2 ? 'start' : 'middle' }, svg).textContent = n.gap + 'cm';
  });
  results(res, W, D);
  selPanel();
  save();
}

function results(res, W, D){
  const area = W * D;
  $('rUsed').innerHTML = (area ? Math.round(res.used / area * 100) : 0) + '<small>%</small>';
  const badCount = res.notes.length + res.narrow.length;
  $('rBad').innerHTML = badCount + '<small>곳</small>';
  $('rDetail').innerHTML = '방 ' + (area / 10000).toFixed(2) + '㎡ (' + (area / 10000 * 121 / 400).toFixed(2) + '평) · 가구 ' + items.length + '개 · 남는 바닥 <b>' + (res.free / 10000).toFixed(2) + '㎡</b>';
  const nm = i => items[i] ? items[i].n : '';
  // 받침 있으면 이/과, 없으면 가/와
  const js = (w, a, b) => { const c = (w || '').charCodeAt(w.length - 1); return w + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? a : b); };
  const lines = [];
  res.notes.forEach(n => {
    if (n.type === 'overlap') lines.push('<b>' + js(nm(n.i), '과', '와') + '</b> <b>' + js(nm(n.j), '이', '가') + '</b> 겹쳐요');
    if (n.type === 'door') lines.push('<b>' + js(nm(n.i), '이', '가') + '</b> 문 열리는 자리에 걸려요');
    if (n.type === 'out') lines.push('<b>' + js(nm(n.i), '이', '가') + '</b> 방보다 커요');
  });
  res.narrow.forEach(n => lines.push('<b>' + nm(n.i) + '</b> ' + n.side + (n.with >= 0 ? ' ↔ <b>' + nm(n.with) + '</b>' : ' ↔ 벽') + ' 사이 ' + n.gap + 'cm (기준 ' + num('minPass', 60) + 'cm보다 좁아요)'));
  $('rWarn').innerHTML = lines.length ? lines.map(l => '<li>' + l + '</li>').join('') : (items.length ? '<li>걸리는 곳 없이 들어가요</li>' : '<li>위에서 가구를 넣어 보세요</li>');
  // 다른 계산기 링크에 방 크기
  const q = '?w=' + (W / 100) + '&l=' + (D / 100);
  $('lnkFloor').href = '/floor/' + q; $('lnkWall').href = '/wallpaper/' + q;
}

function selPanel(){
  const it = items[sel];
  $('selbox').hidden = !it;
  if (!it) return;
  if (document.activeElement !== $('sn')) $('sn').value = it.n;
  if (document.activeElement !== $('sw')) $('sw').value = it.w;
  if (document.activeElement !== $('sd')) $('sd').value = it.d;
}

// 끌어서 옮기기
function pt(e){ const svg = $('plan'); const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
$('plan').addEventListener('pointerdown', e => {
  const g = e.target.closest('.f');
  if (!g) { sel = -1; render(); return; }
  sel = +g.dataset.i;
  const p = pt(e), it = items[sel];
  drag = { dx: p.x - it.x, dy: p.y - it.y, id: e.pointerId };
  $('plan').setPointerCapture(e.pointerId);
  render();
});
$('plan').addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const p = pt(e), it = items[sel];
  it.x = snap(p.x - drag.dx); it.y = snap(p.y - drag.dy); clamp(it);
  render();
});
const endDrag = () => { drag = null; };
$('plan').addEventListener('pointerup', endDrag);
$('plan').addEventListener('pointercancel', endDrag);
$('plan').addEventListener('keydown', e => {
  const g = e.target.closest('.f'); if (!g) return;
  sel = +g.dataset.i;
  const mv = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[e.key];
  if (mv) { e.preventDefault(); move(mv[0], mv[1]); setTimeout(() => { const n = document.querySelector('#plan .f[data-i="' + sel + '"]'); if (n) n.focus(); }, 0); }
});
function move(dx, dy){ const it = items[sel]; if (!it) return; it.x += dx; it.y += dy; clamp(it); render(); }
document.querySelectorAll('[data-mv]').forEach(b => b.addEventListener('click', () => { const [dx, dy] = b.dataset.mv.split(',').map(Number); move(dx, dy); }));
$('rotBtn').addEventListener('click', () => { const it = items[sel]; if (!it) return; const cx = it.x + it.w / 2, cy = it.y + it.d / 2; [it.w, it.d] = [it.d, it.w]; it.x = snap(cx - it.w / 2); it.y = snap(cy - it.d / 2); clamp(it); render(); });
$('dupBtn').addEventListener('click', () => { const it = items[sel]; if (!it) return; addItem(it.n, it.w, it.d); });
$('delBtn').addEventListener('click', () => { if (sel < 0) return; items.splice(sel, 1); sel = -1; render(); });
['sn', 'sw', 'sd'].forEach(id => $(id).addEventListener('input', () => {
  const it = items[sel]; if (!it) return;
  if (id === 'sn') it.n = $('sn').value.slice(0, 20) || '가구';
  else { const v = parseFloat($(id).value); if (v >= 5 && v <= 3000) { it[id === 'sw' ? 'w' : 'd'] = v; clamp(it); } }
  render();
}));
document.querySelectorAll('#presets button').forEach(b => b.addEventListener('click', () => addItem(b.dataset.n, +b.dataset.w, +b.dataset.d)));
// cm 칸에 1000 이상을 넣으면 mm로 보고 cm로 바꿈
['rw', 'rd', 'dpos', 'dw', 'sw', 'sd'].forEach(id => $(id).addEventListener('change', () => {
  const v = parseFloat($(id).value);
  if (v >= 1000) { $(id).value = Math.round(v / 10); $(id).dispatchEvent(new Event('input', { bubbles: true }));
    let n = $(id).nextElementSibling; if (!n || !n.classList.contains('fnote')) { n = document.createElement('div'); n.className = 'fnote'; $(id).insertAdjacentElement('afterend', n); }
    n.textContent = Math.round(v) + 'mm → ' + Math.round(v / 10) + 'cm로 바꿨어요'; }
}, true));
['rw', 'rd', 'dwall', 'dpos', 'dw', 'dh', 'dslide', 'minPass'].forEach(id => $(id).addEventListener(id === 'dslide' || id === 'dwall' || id === 'dh' ? 'change' : 'input', () => { items.forEach(clamp); render(); }));

// 평면도를 PNG로
$('pngBtn').addEventListener('click', () => {
  const svg = $('plan').cloneNode(true);
  const vb = svg.getAttribute('viewBox').split(' ').map(Number);
  const scale = 1600 / vb[2];
  svg.setAttribute('width', 1600); svg.setAttribute('height', Math.round(vb[3] * scale));
  svg.setAttribute('xmlns', NS);
  svg.querySelectorAll('text').forEach(t => t.setAttribute('font-family', 'Apple SD Gothic Neo, Malgun Gothic, sans-serif'));
  const data = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = 1600; c.height = Math.round(vb[3] * scale) + 80;
    const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(img, 0, 0);
    x.fillStyle = '#5b636b'; x.font = '28px sans-serif';
    x.fillText('jibcalc.com 가구 배치 도우미 · 가구 크기는 실제 치수로 확인하세요', 30, c.height - 30);
    c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '가구배치.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
});

function save(){
  if (!store) return;
  const f = {}; ['rw', 'rd', 'dwall', 'dpos', 'dw', 'dh', 'minPass'].forEach(id => f[id] = $(id).value); f.dslide = $('dslide').checked;
  try { store.setItem(KEY, JSON.stringify({ f, items })); } catch (e) {}
}
function load(){
  let d = null; try { d = store && JSON.parse(store.getItem(KEY)); } catch (e) {}
  if (!d || !Array.isArray(d.items)) return false;
  Object.entries(d.f || {}).forEach(([id, v]) => { const e = $(id); if (!e) return; if (e.type === 'checkbox') e.checked = !!v; else e.value = v; });
  items = d.items.filter(it => it && it.w > 0 && it.d > 0).map(it => ({ n: String(it.n || '가구').slice(0, 20), w: +it.w, d: +it.d, x: +it.x || 0, y: +it.y || 0 }));
  return true;
}
document.addEventListener('click', e => { if (e.target.closest('[data-a="reset"]') && store) { try { store.removeItem(KEY); } catch (err) {} } }, true);
// 다른 계산기에서 ?w=&l=(m)로 오면 방 크기로
(function(){
  const q = new URLSearchParams(location.search); const w = parseFloat(q.get('w')), l = parseFloat(q.get('l'));
  const loaded = load();
  if (w > 0 && l > 0 && w < 30 && l < 30) { $('rw').value = Math.round(w * 100); $('rd').value = Math.round(l * 100); history.replaceState(null, '', location.pathname); }
  if (!loaded) { items = [{ n: '퀸 침대', w: 150, d: 200, x: 0, y: 0 }, { n: '옷장', w: 120, d: 60, x: 210, y: 0 }, { n: '책상', w: 120, d: 60, x: 0, y: 300 }]; }
  items.forEach(clamp);
  render();
})();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('room/index.html', html);
console.log('생성 완료: /room/');
