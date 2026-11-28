/* 모든 계산기 공통 기능
   1) cm로 입력해도 m로 자동 변환
   2) 입력값 기억(이 기기에서만) + 입력 초기화
   3) 결과 복사 · 공유하기 · 이미지 저장 · 견적서에 담기
   4) 휴대폰에서 화면 아래 결과 고정 바 */
(function () {
  'use strict';

  /* ---------- 공통 도구 ---------- */
  const store = (() => {
    try { const k = '__hc'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; }
    catch (e) { return null; }
  })();
  const KEY = 'hc:' + location.pathname;

  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((ok, fail) => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : fail(); } catch (e) { fail(e); }
      ta.remove();
    });
  }

  const result = document.querySelector('.result');
  if (!result) return; // 계산기 페이지가 아니면 여기서 끝

  /* ---------- 1) 단위 자동 변환 · 입력값 점검 ---------- */
  // m 칸에 넣은 숫자: 1000 이상은 mm, 30~999는 cm로 보고 m로 바꿈 (현장에서는 mm를 많이 씀)
  function isMeterInput(el) {
    if (!el || el.type !== 'number') return false;
    if (el.dataset.unit === 'none') return false; // 긴 길이(롤 길이 등)는 변환하지 않음
    if (el.dataset.unit === 'm') return true;
    const box = el.closest('div');
    const label = box && box.querySelector('label');
    return !!(label && label.textContent.includes('(m)'));
  }
  function toMeter(v) {
    if (v >= 1000) return { m: Math.round(v) / 1000, unit: 'mm' };
    if (v >= 30) return { m: Math.round(v) / 100, unit: 'cm' };
    return null;
  }
  // 칸 바로 아래에 짧은 안내 (변환·경고)
  function note(el, text, bad) {
    let n = el.nextElementSibling;
    if (!n || !n.classList || !n.classList.contains('fnote')) {
      if (!text) return;
      n = document.createElement('div');
      n.className = 'fnote';
      el.insertAdjacentElement('afterend', n);
    }
    if (!text) { n.remove(); el.classList.remove('bad'); el.removeAttribute('aria-invalid'); return; }
    n.textContent = text;
    n.classList.toggle('warn', !!bad);
    el.classList.toggle('bad', !!bad);
    if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  function check(el) {
    if (!el || el.type !== 'number' || el.value === '') { if (el && el.type === 'number') note(el, ''); return; }
    const v = parseFloat(el.value);
    const min = el.min !== '' ? parseFloat(el.min) : null;
    if (!(v === v)) return note(el, '숫자만 넣어 주세요', true);
    if (v < 0) return note(el, '0보다 큰 값을 넣어 주세요', true);
    if (min !== null && v < min) return note(el, min + ' 이상으로 넣어 주세요', true);
    if (isMeterInput(el) && v > 15 && v < 30) return note(el, v + 'm가 맞나요? 숫자를 다시 확인해 주세요', true);
    const n = el.nextElementSibling;
    if (n && n.classList && n.classList.contains('fnote') && n.classList.contains('warn')) note(el, '');
  }
  // 캡처 단계에서 먼저 바꿔서 계산기가 바뀐 값으로 계산하게 함
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (isMeterInput(el)) {
      const v = parseFloat(el.value);
      const c = toMeter(v);
      if (c) {
        el.value = c.m;
        note(el, `${Math.round(v)}${c.unit} → ${c.m}m로 바꿨어요`, false);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
    check(el);
  }, true);
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el || el.type !== 'number') return;
    // 타이핑 중에는 변환 안내만 미리 보여 줌 (값은 칸을 벗어날 때 바꿈)
    if (isMeterInput(el) && e.isTrusted) {
      const c = toMeter(parseFloat(el.value));
      if (c) { note(el, `칸을 벗어나면 ${c.unit}로 보고 ${c.m}m로 바꿔요`, false); return; }
    }
    check(el);
  }, true);

  /* ---------- 1-1) 처음 넣어 둔 예시 값 안내 ---------- */
  const TKEY = 'jibcalc-touched:' + location.pathname;
  let touched = false;
  try {
    // 이미 이 화면에 저장해 둔 값이 있으면(지난번에 쓴 사람) 예시가 아님
    const seg = location.pathname.replace(/\//g, '');
    touched = !!localStorage.getItem(TKEY) || Object.keys(localStorage).some((k) => k === 'hc:' + location.pathname || (seg && k.startsWith('jibcalc-' + seg + '-')));
  } catch (e) { touched = true; }
  if (/[?&](w|l|add)=/.test(location.search)) touched = true; // 다른 화면에서 치수를 받아 온 경우
  const markTouched = () => {
    if (touched) return;
    touched = true;
    try { localStorage.setItem(TKEY, '1'); } catch (e) {}
    const bn = result.querySelector('.example-note');
    if (bn) bn.remove();
  };
  if (result.dataset.plain) touched = true; // 직접 만든 결과판(자재 목록 등)은 예시 안내 없음
  if (!touched) {
    const bn = document.createElement('p');
    bn.className = 'example-note';
    bn.textContent = '처음 넣어 둔 예시 값으로 계산한 결과예요. 내 치수로 바꿔 보세요.';
    const h = result.querySelector('h2');
    if (h) h.insertAdjacentElement('afterend', bn); else result.prepend(bn);
  } else {
    try { localStorage.setItem(TKEY, '1'); } catch (e) {}
  }
  ['input', 'change', 'click'].forEach((t) => document.addEventListener(t, (e) => {
    if (!e.isTrusted) return;
    const el = e.target;
    if (t === 'click' && !(el.closest && el.closest('main, .wrap') && el.closest('button, .tabs, .presets, .seg, [data-mv]'))) return;
    if (el.closest && (el.closest('.result') || el.closest('.myhome'))) return; // 결과판 버튼·방 목록은 따로 처리
    markTouched();
  }, true));

  /* ---------- 2) 입력값 기억 ---------- */
  const containers = ['areas', 'holes', 'rooms'].filter((id) => document.getElementById(id));
  const esc = (s) => String(s).replace(/[&<>"'`$\\]/g, '');

  function snapshot() {
    const d = { f: {}, r: {} };
    document.querySelectorAll('input[id], select[id]').forEach((el) => {
      d.f[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    containers.forEach((c) => {
      d.r[c] = [...document.getElementById(c).querySelectorAll('.row')]
        .map((row) => [...row.querySelectorAll('input')].map((i) => i.value));
    });
    const tab = document.querySelector('.tabs button.on');
    if (tab) d.tab = tab.dataset.mode;
    return d;
  }

  let saveTimer;
  function save() {
    if (!store) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { store.setItem(KEY, JSON.stringify(snapshot())); } catch (e) { /* 저장 실패는 무시 */ }
    }, 300);
  }

  function restore() {
    if (!store || typeof window.addRow !== 'function') return;
    let d;
    try { d = JSON.parse(store.getItem(KEY)); } catch (e) { return; }
    if (!d) return;
    containers.forEach((c) => {
      if (!d.r || !Array.isArray(d.r[c])) return;
      document.getElementById(c).innerHTML = '';
      d.r[c].forEach((vals) => window.addRow(c, ...vals.slice(0, 3).map(esc)));
    });
    Object.entries(d.f || {}).forEach(([id, v]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    });
    if (d.tab) {
      const b = document.querySelector(`.tabs button[data-mode="${esc(d.tab)}"]`);
      if (b) b.click();
    }
    const any = document.querySelector('input[id], select[id]');
    if (any) any.dispatchEvent(new Event('change'));
  }

  /* ---------- 2-1) 주소값으로 방 크기 미리 채우기 (평수 계산기에서 넘어온 경우) ----------
     예) /wallpaper/?w=3.6&l=3  → 가로 3.6m, 세로 3m */
  function prefillFromUrl() {
    const qs = new URLSearchParams(location.search);
    const w = parseFloat(qs.get('w')), l = parseFloat(qs.get('l'));
    if (!(w > 0 && l > 0 && w < 1000 && l < 1000)) return false;
    const r = (n) => String(Math.round(n * 100) / 100);
    let target = null;
    if (document.getElementById('rw') && document.getElementById('rl')) {
      document.getElementById('rw').value = r(w);
      document.getElementById('rl').value = r(l);
      target = document.getElementById('rw');
    } else {
      const box = document.getElementById('areas') || document.getElementById('rooms');
      const row = box && box.querySelector('.row');
      if (!row) return false;
      const name = row.querySelector('input[type=text]');
      const nums = row.querySelectorAll('input[type=number]');
      if (name) name.value = box.id === 'areas' ? '방 바닥' : '방';
      nums[0].value = r(w);
      nums[1].value = r(l);
      target = nums[0];
    }
    target.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(() => toast(`평수 계산기의 방 크기(${r(w)}m × ${r(l)}m)를 넣었어요`), 300);
    return true;
  }

  if (!prefillFromUrl()) restore();
  ['input', 'change'].forEach((ev) => document.addEventListener(ev, save));
  document.addEventListener('click', (e) => { if (e.target.closest('.add, .del, .tabs button')) save(); });

  /* ---------- 2-1) 우리 집 방 목록 (계산기끼리 같이 씀) ---------- */
  const HKEY = 'jibcalc-home-rooms';
  const clean = (t) => String(t || '').replace(/[<>"'`$\\]/g, '').slice(0, 20);
  const readRooms = () => { try { const a = JSON.parse(localStorage.getItem(HKEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const writeRooms = (a) => { try { localStorage.setItem(HKEY, JSON.stringify(a.slice(0, 30))); } catch (e) {} };
  const $id = (id) => document.getElementById(id);
  const isRoomPage = location.pathname === '/room/';
  const rowBox = $id('areas') || $id('rooms');
  const hasRW = $id('rw') && ($id('rl') || $id('rd'));
  const shapeBox = $id('shapes') && typeof window.addShape === 'function' ? $id('shapes') : null; // 면적 계산기
  if (store && (rowBox || hasRW || shapeBox)) {
    const firstCard = document.querySelector('.wrap > section.card');
    const box = document.createElement('section');
    box.className = 'card myhome';
    firstCard.insertAdjacentElement('beforebegin', box);
    const fire = (el) => el.dispatchEvent(new Event('input', { bubbles: true }));
    function apply(r) {
      if (isRoomPage) { $id('rw').value = Math.round(r.w * 100); $id('rd').value = Math.round(r.l * 100); fire($id('rw')); }
      else if (shapeBox) {
        const f = { m: 1, cm: 100, mm: 1000 }[($id('unit') || {}).value] || 1;
        if (result.querySelector('.example-note')) shapeBox.innerHTML = ''; // 예시 도형은 지우고
        window.addShape('rect', [Math.round(r.w * f * 100) / 100, Math.round(r.l * f * 100) / 100]);
      }
      else if (hasRW) { $id('rw').value = r.w; $id('rl').value = r.l; if (r.h && $id('rh')) $id('rh').value = r.h; fire($id('rw')); }
      else {
        const rows = [...rowBox.querySelectorAll('.row')];
        const first = rows[0];
        const empty = (row) => [...row.querySelectorAll('input[type=number]')].every((i) => !i.value);
        let row = rows.find(empty) || (rows.length === 1 && result.querySelector('.example-note') ? first : null);
        if (!row && typeof window.addRow === 'function') { window.addRow(rowBox.id); row = [...rowBox.querySelectorAll('.row')].pop(); }
        if (!row) return;
        const t = row.querySelector('input[type=text]'), n = row.querySelectorAll('input[type=number]');
        if (t) t.value = clean(r.name);
        n[0].value = r.w; n[1].value = r.l;
        fire(n[0]);
      }
      markTouched();
      toast(`‘${clean(r.name)}’ ${r.w}m × ${r.l}m를 넣었어요`);
    }
    function current() {
      if (isRoomPage) return [{ name: '', w: (parseFloat($id('rw').value) || 0) / 100, l: (parseFloat($id('rd').value) || 0) / 100 }];
      if (shapeBox) { // 네모 도형만 방으로 저장
        const k = { m: 1, cm: 0.01, mm: 0.001 }[($id('unit') || {}).value] || 1;
        return [...shapeBox.querySelectorAll('.shp')].filter((el) => el.querySelector('.type').value === 'rect' && +el.querySelector('.sign').value > 0)
          .map((el) => { const v = el.querySelectorAll('.dims input'); return { name: '', w: (parseFloat(v[0].value) || 0) * k, l: (parseFloat(v[1].value) || 0) * k }; });
      }
      if (hasRW) return [{ name: '', w: parseFloat($id('rw').value) || 0, l: parseFloat($id('rl').value) || 0, h: $id('rh') ? parseFloat($id('rh').value) || 0 : 0 }];
      return [...rowBox.querySelectorAll('.row')].map((row) => {
        const t = row.querySelector('input[type=text]'), n = row.querySelectorAll('input[type=number]');
        return { name: t ? t.value.trim() : '', w: parseFloat(n[0].value) || 0, l: parseFloat(n[1].value) || 0 };
      });
    }
    function render(open) {
      const rooms = readRooms();
      box.innerHTML =
        '<details' + (open ? ' open' : '') + '><summary><b>우리 집 방</b> <span>' + (rooms.length ? rooms.length + '개 저장됨 · 눌러서 불러오기' : '한 번 저장하면 다른 계산기에서도 불러와요') + '</span></summary>' +
        '<div class="chips">' + (rooms.length ? rooms.map((r, i) =>
          '<span class="chip"><button type="button" data-load="' + i + '">' + clean(r.name) + ' <small>' + r.w + '×' + r.l + 'm</small></button><button type="button" class="x" data-del="' + i + '" aria-label="' + clean(r.name) + ' 지우기">×</button></span>').join('')
          : '<p class="hint" style="margin:0">아직 저장한 방이 없어요.</p>') + '</div>' +
        '<div class="save-row">' + (rowBox ? '' : '<input type="text" class="rname" placeholder="방 이름 (예: 안방)" aria-label="저장할 방 이름" maxlength="20">') +
        '<button type="button" class="btn" data-save="1">' + (rowBox ? '지금 넣은 면들을 방으로 저장' : '지금 치수를 방으로 저장') + '</button></div></details>';
    }
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const rooms = readRooms();
      if (b.dataset.load != null) { const r = rooms[+b.dataset.load]; if (r) apply(r); }
      else if (b.dataset.del != null) {
        if (b.dataset.arm !== '1') { b.dataset.arm = '1'; b.textContent = '지우기'; b.classList.add('arm'); setTimeout(() => { if (b.isConnected) { b.dataset.arm = ''; b.textContent = '×'; b.classList.remove('arm'); } }, 3000); return; }
        rooms.splice(+b.dataset.del, 1); writeRooms(rooms); render(true);
      } else if (b.dataset.save) {
        const nameInput = box.querySelector('.rname');
        const add = current().filter((r) => r.w > 0 && r.l > 0).map((r, i) => ({ name: clean(r.name || (nameInput && nameInput.value.trim()) || ('방 ' + (rooms.length + i + 1))), w: Math.round(r.w * 100) / 100, l: Math.round(r.l * 100) / 100, h: r.h ? Math.round(r.h * 100) / 100 : undefined }));
        if (!add.length) { toast('먼저 가로·세로를 넣어 주세요'); return; }
        add.forEach((r) => { const k = rooms.findIndex((x) => x.name === r.name); if (k >= 0) rooms[k] = r; else rooms.push(r); });
        writeRooms(rooms); render(true);
        toast(add.length > 1 ? `방 ${add.length}개를 저장했어요` : `‘${add[0].name}’을(를) 저장했어요`);
      }
    });
    render(false);
  }

  /* ---------- 2-2) 자재 목록에 담기 ---------- */
  const CKEY = 'jibcalc-order';
  const readCart = () => { try { const a = JSON.parse(localStorage.getItem(CKEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  function cartItem() {
    const stat = result.querySelectorAll('.stat')[parseInt(result.dataset.est, 10) || 0];
    if (!stat) return null;
    const v = stat.querySelector('.v');
    const unitEl = v.querySelector('small');
    const unit = unitEl ? unitEl.textContent.trim() : '';
    const qty = parseFloat(v.textContent.replace(unit, '').replace(/,/g, ''));
    if (!(qty > 0)) return null;
    const name = result.dataset.estName || stat.querySelector('.k').textContent.replace(/^(필요한|구매할)\s*/, '').trim();
    let room = '';
    if (rowBox) room = [...rowBox.querySelectorAll('.row')].map((row) => (row.querySelector('input[type=text]') || {}).value).filter(Boolean).join(', ');
    else if (hasRW) room = ($id('rw').value || '?') + '×' + ($id('rl') ? $id('rl').value : '?') + 'm';
    const detail = result.querySelector('.detail');
    const spec = detail ? detail.innerText.split('\n')[0].trim().slice(0, 80) : '';
    return { id: 'o' + Date.now(), name: clean(name), qty, unit: clean(unit), cat: clean(result.dataset.estCat || ''), room: clean(room).slice(0, 40) || '', spec: spec.replace(/[<>]/g, ''), page: pageName, href: location.pathname, t: Date.now() };
  }

  /* ---------- 3) 결과 복사 · 공유 ---------- */
  const pageName = document.title.split('–')[0].trim();
  function resultText() {
    const lines = [`[${pageName}]`];
    result.querySelectorAll('.stat').forEach((s) => {
      lines.push(`${s.querySelector('.k').textContent}: ${s.querySelector('.v').textContent.trim()}`);
    });
    const detail = result.querySelector('.detail');
    if (detail && detail.innerText.trim()) lines.push(detail.innerText.trim());
    const combo = result.querySelector('.combo');
    if (combo && combo.innerText.trim()) lines.push('추천 통 조합: ' + combo.innerText.trim().replace(/\s*\n\s*/g, ' · '));
    lines.push('', location.origin + location.pathname);
    return lines.join('\n');
  }

  let actions = null;
  if (!result.dataset.plain) {
  // 결과판 버튼: 주된 버튼 하나 + 더보기 (초기화는 입력 쪽으로 옮김)
  const hasEst = result.dataset.est != null;
  actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML =
    (hasEst ? '<button type="button" class="btn primary" data-a="cart">자재 목록에 담기</button>' +
              '<button type="button" class="btn" data-a="share">공유하기</button>'
            : '<button type="button" class="btn primary" data-a="share">공유하기</button>' +
              '<button type="button" class="btn" data-a="copy">결과 복사</button>') +
    '<button type="button" class="btn ghost" data-a="more" aria-expanded="false" aria-controls="moreActs">더보기</button>' +
    '<div class="more-acts" id="moreActs" hidden>' +
      (hasEst ? '<button type="button" class="btn" data-a="est">견적서에 바로 담기</button><button type="button" class="btn" data-a="copy">결과 복사</button>' : '') +
      '<button type="button" class="btn" data-a="image">이미지로 저장</button>' +
      '<button type="button" class="btn" data-a="report">계산이 이상해요</button>' +
    '</div>';
  result.appendChild(actions);
  // 계산 근거 한 줄
  const basis = document.createElement('p');
  basis.className = 'basis';
  basis.innerHTML = '참고용 추정치예요. 계산 방법은 아래 설명에 있어요 · 2026년 11월 점검';
  result.appendChild(basis);
  // 입력 초기화: 결과판 바로 위, 두 번 눌러야 지워짐
  const resetRow = document.createElement('div');
  resetRow.className = 'reset-row';
  resetRow.innerHTML = '<button type="button" class="btn ghost" data-a="reset-arm">입력 초기화</button>';
  result.insertAdjacentElement('beforebegin', resetRow);
  const resetBtn = resetRow.querySelector('button');
  let resetTimer = null;
  resetBtn.addEventListener('click', () => {
    if (resetBtn.dataset.a === 'reset-arm') {
      // 첫 번째: 확인 상태로만 바꿈. 각 페이지의 저장분 지우기는 data-a="reset"일 때만 반응함
      resetBtn.dataset.a = 'reset';
      resetBtn.textContent = '한 번 더 누르면 모두 지워져요';
      resetBtn.classList.add('arm');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { resetBtn.dataset.a = 'reset-arm'; resetBtn.textContent = '입력 초기화'; resetBtn.classList.remove('arm'); }, 4000);
      return;
    }
    if (store) { try { store.removeItem(KEY); store.removeItem(TKEY); } catch (err) {} }
    location.reload();
  });
  }
  function sendToEstimate() {
    const stat = result.querySelectorAll('.stat')[parseInt(result.dataset.est, 10) || 0];
    if (!stat) return;
    const v = stat.querySelector('.v');
    const unitEl = v.querySelector('small');
    const unit = unitEl ? unitEl.textContent.trim() : '';
    const qty = parseFloat(v.textContent.replace(unit, '').replace(/,/g, ''));
    if (!(qty > 0)) { toast('먼저 계산 결과가 나오게 값을 넣어 주세요'); return; }
    const name = result.dataset.estName || stat.querySelector('.k').textContent.replace(/^(필요한|구매할)\s*/, '').trim();
    const q = new URLSearchParams({ add: name, qty: String(qty), unit, cat: result.dataset.estCat || '' });
    location.href = '/estimate/?' + q.toString();
  }

  if (actions) actions.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    const a = btn && btn.dataset.a;
    if (a === 'more') {
      const box = actions.querySelector('.more-acts');
      box.hidden = !box.hidden;
      btn.setAttribute('aria-expanded', String(!box.hidden));
      btn.textContent = box.hidden ? '더보기' : '접기';
      return;
    }
    if (a === 'est') { sendToEstimate(); return; }
    if (a === 'cart') {
      if (btn.dataset.done === '1') { location.href = '/order/'; return; }
      const it = cartItem();
      if (!it) { toast('먼저 계산 결과가 나오게 값을 넣어 주세요'); return; }
      const cart = readCart(); cart.push(it);
      try { localStorage.setItem(CKEY, JSON.stringify(cart.slice(-100))); } catch (err) {}
      btn.dataset.done = '1'; btn.textContent = '담았어요 · 목록 보기 (' + cart.length + ')';
      toast(`${it.name} ${it.qty}${it.unit}을(를) 자재 목록에 담았어요`);
      setTimeout(() => { btn.dataset.done = ''; btn.textContent = '자재 목록에 담기'; }, 5000);
      return;
    }
    if (a === 'copy') {
      copyText(resultText()).then(() => toast('결과를 복사했어요. 카톡이나 메모에 붙여넣으세요'),
                                  () => toast('복사하지 못했어요. 화면을 길게 눌러 복사해 주세요'));
    } else if (a === 'share') {
      const data = { title: pageName, text: resultText(), url: location.origin + location.pathname };
      if (navigator.share) { try { await navigator.share(data); } catch (err) { /* 사용자가 취소 */ } }
      else copyText(resultText()).then(() => toast('결과와 주소를 복사했어요. 카톡에 붙여넣으세요'));
    } else if (a === 'image') {
      try { await saveImage(); } catch (err) { toast('이미지를 만들지 못했어요. 결과 복사를 이용해 주세요'); }
    } else if (a === 'report') {
      // 넣은 값과 결과를 복사해 두고 문의 페이지로 이동 (주소는 문의 페이지에만 둠)
      const vals = [...document.querySelectorAll('.wrap input, .wrap select')]
        .filter((el) => el.offsetParent && !el.closest('.result') && el.type !== 'hidden' && el.type !== 'text' && el.type !== 'date')
        .map((el) => {
          const lb = (el.id && document.querySelector('label[for="' + el.id + '"]')) || (el.closest('div') && el.closest('div').querySelector('label'));
          const name = (lb ? lb.textContent : el.getAttribute('aria-label') || '').trim();
          const val = el.type === 'checkbox' ? (el.checked ? '예' : '아니오') : (el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : el.value);
          return name ? name + ': ' + val : '';
        }).filter(Boolean).slice(0, 40);
      const body = '어떤 점이 이상한지 적어 주세요:\n\n\n--- 넣은 값 ---\n' + vals.join('\n') + '\n\n--- 계산 결과 ---\n' + resultText();
      const text = '[집 공사 계산기] 계산 확인 요청 - ' + pageName + '\n' + location.origin + location.pathname + '\n\n' + body;
      const go = () => { try { sessionStorage.setItem('jibcalc-report', '1'); } catch (err) {} location.href = '/contact/'; };
      copyText(text).then(() => { toast('넣은 값과 결과를 복사했어요. 문의 메일에 붙여넣어 주세요'); setTimeout(go, 1200); }, go);
    }
  });

  /* ---------- 3-1) 결과를 이미지로 저장 (기기 안에서만 그림) ---------- */
  function wrapLines(ctx, text, maxW) {
    const out = [];
    text.split('\n').forEach((para) => {
      let line = '';
      for (const ch of para) {
        if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch.trimStart(); }
        else line += ch;
      }
      out.push(line);
    });
    return out.filter((l, i, arr) => l.trim() || (i > 0 && arr[i - 1].trim()));
  }
  async function saveImage() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const css = getComputedStyle(document.documentElement);
    const v = (n, d) => (css.getPropertyValue(n).trim() || d);
    const C = { bg: '#1c2024', card: '#262b30', ink: '#f2f3ef', muted: '#aeb4b9', accent: v('--tape', '#ffc400') }; // 결과판과 같은 흑연색·노란색
    const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
    const W = 1080, P = 72;
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d');
    const statsData = [...result.querySelectorAll('.stat')].map((s) => [s.querySelector('.k').textContent.trim(), s.querySelector('.v').textContent.trim()]);
    const detail = result.querySelector('.detail');
    const extra = [...result.querySelectorAll('.rec, .combo')].map((x) => x.classList.contains('combo')
      ? (x.innerText.trim() ? '추천 통 조합: ' + x.innerText.trim().replace(/\s*\n\s*/g, ' · ') : '')
      : x.innerText.trim()).filter(Boolean).join('\n');
    const body = [detail ? detail.innerText.trim() : '', extra].filter(Boolean).join('\n');
    ctx.font = `400 34px ${font}`;
    const lines = wrapLines(ctx, body, W - P * 2).slice(0, 18);
    const statH = 200, H = P + 70 + 40 + statH + 40 + lines.length * 52 + 70 + P;
    cv.width = W; cv.height = H;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top';
    ctx.fillStyle = C.accent; ctx.font = `600 30px ${font}`; ctx.fillText('집 공사 계산기', P, P);
    ctx.fillStyle = C.ink; ctx.font = `600 52px ${font}`; ctx.fillText(pageName, P, P + 44);
    let y = P + 70 + 50;
    const gap = 24, n = Math.max(1, statsData.length), bw = (W - P * 2 - gap * (n - 1)) / n;
    statsData.forEach(([k, val], i) => {
      const x = P + i * (bw + gap);
      ctx.fillStyle = C.card;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, bw, statH, 28); ctx.fill(); } else ctx.fillRect(x, y, bw, statH);
      ctx.fillStyle = C.muted; ctx.font = `400 30px ${font}`; ctx.fillText(k, x + 32, y + 32);
      ctx.fillStyle = C.accent; let size = 76; ctx.font = `600 ${size}px ${font}`;
      while (ctx.measureText(val).width > bw - 64 && size > 36) { size -= 4; ctx.font = `600 ${size}px ${font}`; }
      ctx.fillText(val, x + 32, y + 86);
    });
    y += statH + 44;
    ctx.fillStyle = C.ink; ctx.font = `400 34px ${font}`;
    lines.forEach((l) => { ctx.fillText(l, P, y); y += 52; });
    ctx.fillStyle = C.muted; ctx.font = `400 28px ${font}`;
    ctx.fillText(location.host + location.pathname + '  ·  참고용 추정치', P, H - P - 28);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const name = pageName.replace(/\s+/g, '-') + '-결과.png';
    const file = new File([blob], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      try { await navigator.share({ files: [file], title: pageName }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('결과 이미지를 저장했어요');
  }

  /* ---------- 4) 휴대폰 결과 고정 바 ---------- */
  const stats = [...result.querySelectorAll('.stat')];
  if (!stats.length) return;
  const bar = document.createElement('button');
  bar.type = 'button';
  bar.className = 'sticky-bar';
  bar.setAttribute('aria-label', '계산 결과로 이동');
  document.body.appendChild(bar);

  function sync() {
    bar.innerHTML = stats.map((s) =>
      `<span><small>${s.querySelector('.k').textContent}</small><b>${s.querySelector('.v').innerHTML}</b></span>`).join('');
  }
  sync();
  new MutationObserver(sync).observe(result, { subtree: true, childList: true, characterData: true });
  bar.addEventListener('click', () => result.scrollIntoView({ behavior: 'smooth', block: 'center' }));

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      // 결과가 화면 아래쪽에 숨어 있을 때만 보여줌
      bar.classList.toggle('show', !entry.isIntersecting && entry.boundingClientRect.top > 0);
    }, { threshold: 0.15 }).observe(result);
  }
})();

/* ===== 전체 계산기 메뉴 · 검색 ===== */
/* tools:json */ const NAV = {"groups":[{"key":"mat","name":"자재 수량"},{"key":"size","name":"평수 · 면적 · 치수"},{"key":"money","name":"견적 · 비용"},{"key":"prep","name":"일정 · 정리"}],"tools":[{"key":"tile","group":"mat","href":"/tile/","name":"타일 수량 계산기","sub":"필요한 타일 장수 · 박스 수 · 예상 비용","kw":"타일 줄눈 박스 욕실 주방 벽타일 바닥타일"},{"key":"wallpaper","group":"mat","href":"/wallpaper/","name":"도배지 계산기","sub":"필요한 벽지 롤 수 · 실크 / 합지","kw":"도배 벽지 실크 합지 포인트벽지 천장 롤"},{"key":"paint","group":"mat","href":"/paint/","name":"페인트 계산기","sub":"필요한 페인트 양 · 1L / 4L / 18L 통 조합","kw":"페인트 도장 칠 셀프페인팅 벽 통"},{"key":"floor","group":"mat","href":"/floor/","name":"장판 · 마루 계산기","sub":"필요한 장판 길이 · 마루 박스 수","kw":"장판 마루 바닥재 강마루 걸레받이"},{"key":"insulation","group":"mat","href":"/insulation/","name":"창문 단열 · 뽁뽁이 계산기","sub":"뽁뽁이 롤 수 · 재단표 · 문풍지 · 단열벽지","kw":"뽁뽁이 단열 창문 문풍지 결로 단열벽지 겨울 외풍"},{"key":"order","group":"mat","href":"/order/","name":"자재 목록","sub":"계산기에서 담은 자재 모아 보기 · 복사 · 견적서로","kw":"자재 목록 주문 장바구니 담기 합계"},{"key":"pyeong","group":"size","href":"/pyeong/","name":"평수 계산기","sub":"㎡ ↔ 평 변환 · 방 크기로 평수 · 아파트 면적 해설","kw":"평수 평 제곱미터 아파트 전용면적"},{"key":"area","group":"size","href":"/area/","name":"면적 계산기","sub":"사각형·삼각형·원·ㄱ자 면적 · ㎡ / 평","kw":"면적 넓이 ㄱ자 삼각형 원"},{"key":"moving","group":"prep","href":"/moving/","name":"이사 체크리스트","sub":"이사 날짜로 한 달 전부터 할 일 · 체크 저장","kw":"이사 체크리스트 전입신고 확정일자 이사준비"},{"key":"waste","group":"prep","href":"/waste/","name":"폐기물 정리 도우미","sub":"공사·이사 전 버릴 것 · 무상수거 / 대형폐기물 / 공사 잔재","kw":"폐기물 대형폐기물 스티커 폐가전 버리기 무상수거"},{"key":"room","group":"size","href":"/room/","name":"가구 배치 도우미","sub":"침대·옷장 넣어 보기 · 문 걸림 · 통로 폭","kw":"가구 배치 침대 사이즈 퀸 슈퍼싱글 옷장 소파 평면도"},{"key":"measure","group":"size","href":"/measure/","name":"교체 전 치수 기록","sub":"방문·변기 바꾸기 전 재야 할 곳 · 기준 치수 정리","kw":"치수 방문 변기 교체 실측"},{"key":"schedule","group":"prep","href":"/schedule/","name":"공사·이사 일정표","sub":"이사 날짜로 공사 순서와 할 일을 거꾸로 계산","kw":"공사 일정 순서 이사 날짜 캘린더"},{"key":"estimate","group":"money","href":"/estimate/","name":"견적서 작성기","sub":"공종별 항목 · 부가세 자동 계산 · PDF 저장","kw":"견적서 견적 양식 PDF 계약금 잔금"},{"key":"labor","group":"money","href":"/labor/","name":"인건비 · 3.3% 계산기","sub":"일당 × 일수 · 3.3% 실수령액 · 일용직 세금","kw":"인건비 일당 3.3 원천징수 일용직 기공 조공 실수령"},{"key":"vat","group":"money","href":"/vat/","name":"부가세 계산기","sub":"공급가액 ↔ 합계 · VAT 별도 / 포함","kw":"부가세 VAT 공급가액 10%"}]}; /* /tools:json */

(function () {
  if (typeof NAV === 'undefined') return;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = (t) => String(t).toLowerCase().replace(/[\s·.,%/()-]/g, '');
  const match = (t, q) => !q || norm(t.name + ' ' + t.sub + ' ' + t.kw).includes(norm(q));
  const here = location.pathname.replace(/^(\/[a-z0-9-]+\/).*/, '$1');
  function listHtml(q) {
    return NAV.groups.map((g) => {
      const items = NAV.tools.filter((t) => t.group === g.key && match(t, q));
      if (!items.length) return '';
      return '<div class="nav-grp"><h3>' + esc(g.name) + '</h3>' + items.map((t) =>
        '<a href="' + t.href + '"' + (t.href === here ? ' aria-current="page"' : '') + '><b>' + esc(t.name) + '</b><span>' + esc(t.sub) + '</span></a>').join('') + '</div>';
    }).join('') || '<p class="nav-empty">찾는 계산기가 없어요. 다른 말로 찾아보세요.</p>';
  }

  // 0) 키보드 사용자를 위한 '본문 바로가기'
  const target = document.querySelector('.wrap > section.card:not(.myhome)') || document.querySelector('.home-search') || document.querySelector('.groups');
  if (target) {
    if (!target.id) target.id = 'main-start';
    target.setAttribute('tabindex', '-1');
    const sk = document.createElement('a');
    sk.className = 'skip'; sk.href = '#' + target.id; sk.textContent = '본문 바로가기';
    document.body.prepend(sk);
  }

  // 1) 모든 페이지 위쪽: '전체 계산기' 버튼 + 펼침 목록
  const header = document.querySelector('header');
  if (header && location.pathname !== '/') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-btn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = '<span aria-hidden="true">☰</span> 전체 계산기';
    header.prepend(btn);
    const panel = document.createElement('div');
    panel.className = 'nav-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '전체 계산기');
    panel.innerHTML = '<div class="nav-box"><div class="nav-top"><input type="search" placeholder="계산기 찾기 (예: 뽁뽁이, 부가세)" aria-label="계산기 찾기"><button type="button" class="nav-close" aria-label="닫기">×</button></div><div class="nav-list"></div><a class="nav-home" href="/">처음 화면으로</a></div>';
    document.body.appendChild(panel);
    const input = panel.querySelector('input');
    const list = panel.querySelector('.nav-list');
    const open = () => { list.innerHTML = listHtml(''); input.value = ''; panel.hidden = false; document.body.classList.add('nav-open'); setTimeout(() => input.focus(), 30); };
    const close = () => { panel.hidden = true; document.body.classList.remove('nav-open'); btn.focus(); };
    btn.addEventListener('click', open);
    panel.querySelector('.nav-close').addEventListener('click', close);
    panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
    document.addEventListener('keydown', (e) => {
      if (panel.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') { // 메뉴가 열려 있는 동안 초점이 밖으로 나가지 않게
        const f = [...panel.querySelectorAll('input, button, a[href]')].filter((el) => el.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    input.addEventListener('input', () => { list.innerHTML = listHtml(input.value); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = list.querySelector('a'); if (a) location.href = a.href; } });
  }

  // 2) 메인 화면: 계산기 찾기 칸 (묶음 목록을 걸러 보여 줌)
  const groups = document.querySelector('.groups');
  if (groups && location.pathname === '/') {
    const wrap = document.createElement('div');
    wrap.className = 'home-search';
    wrap.innerHTML = '<label for="toolSearch">어떤 계산기가 필요하세요?</label><input id="toolSearch" type="search" placeholder="예: 뽁뽁이, 침대 사이즈, 부가세, 전입신고">';
    groups.insertAdjacentElement('beforebegin', wrap);
    const input = wrap.querySelector('input');
    const empty = document.createElement('p');
    empty.className = 'nav-empty';
    empty.hidden = true;
    empty.textContent = '찾는 계산기가 없어요. 다른 말로 찾아보세요.';
    groups.insertAdjacentElement('afterend', empty);
    input.addEventListener('input', () => {
      const q = input.value;
      let shown = 0;
      groups.querySelectorAll('section').forEach((sec) => {
        let n = 0;
        sec.querySelectorAll('a.item').forEach((a) => {
          const t = NAV.tools.find((x) => x.href === a.getAttribute('href'));
          const ok = !t || match(t, q);
          a.hidden = !ok;
          if (ok) n++;
        });
        sec.hidden = n === 0;
        shown += n;
      });
      empty.hidden = shown > 0;
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = groups.querySelector('a.item:not([hidden])'); if (a) location.href = a.href; } });
  }
})();

/* ===== 내 데이터 내보내기 · 가져오기 (기기를 바꿀 때) ===== */
(function () {
  let store = null;
  try { store = window.localStorage; } catch (e) { return; }
  const mine = (k) => k.startsWith('jibcalc') || k.startsWith('hc:');
  function say(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function exportData() {
    const data = {};
    Object.keys(store).filter(mine).forEach((k) => { data[k] = store.getItem(k); });
    if (!Object.keys(data).length) { say('아직 저장된 내용이 없어요'); return; }
    const d = new Date();
    const name = '집공사계산기_백업_' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.json';
    const blob = new Blob([JSON.stringify({ app: 'jibcalc', v: 1, at: d.toISOString(), data }, null, 1)], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ files: [file], title: '집 공사 계산기 백업' }).catch(() => {});
      return;
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    say('백업 파일을 저장했어요. 새 기기에서 ‘가져오기’로 불러오세요');
  }
  function importData(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { say('파일이 너무 커요. 집 공사 계산기 백업 파일인지 확인해 주세요'); return; }
    const r = new FileReader();
    r.onload = () => {
      let obj = null;
      try { obj = JSON.parse(r.result); } catch (e) {}
      if (!obj || obj.app !== 'jibcalc' || typeof obj.data !== 'object') { say('집 공사 계산기 백업 파일이 아니에요'); return; }
      let n = 0;
      Object.entries(obj.data).forEach(([k, v]) => { if (mine(k) && typeof v === 'string' && v.length < 2000000) { try { store.setItem(k, v); n++; } catch (e) {} } });
      say(n ? '백업을 불러왔어요 (' + n + '개). 화면을 새로 고칠게요' : '불러올 내용이 없었어요');
      if (n) setTimeout(() => location.reload(), 1200);
    };
    r.readAsText(file);
  }
  window.jibcalcBackup = { exportData, importData };
  // [data-backup="export"] / [data-backup="import"] 버튼을 어디에 두든 동작
  const picker = document.createElement('input');
  picker.type = 'file'; picker.accept = '.json,application/json'; picker.hidden = true;
  picker.addEventListener('change', () => { importData(picker.files[0]); picker.value = ''; });
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-backup]');
    if (!b) return;
    if (b.dataset.backup === 'export') exportData();
    else {
      // 가져오면 지금 기기의 같은 항목을 덮어씀 → 한 번 더 확인
      if (b.dataset.arm !== '1') { b.dataset.arm = '1'; const t = b.textContent; b.textContent = '덮어써요. 한 번 더 누르면 파일 고르기'; setTimeout(() => { b.dataset.arm = ''; b.textContent = t; }, 4000); return; }
      b.dataset.arm = '';
      if (!picker.isConnected) document.body.appendChild(picker);
      picker.click();
    }
  });
})();

/* ===== 앱처럼 쓰기(오프라인) · 최근 쓴 계산기 ===== */
(function () {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
  let store = null;
  try { store = window.localStorage; } catch (e) { return; }
  const RKEY = 'jibcalc-recent';
  const path = location.pathname;
  const read = () => { try { return JSON.parse(store.getItem(RKEY)) || []; } catch (e) { return []; } };
  // 계산기 페이지 방문 기록 (메인·소개·평수 세부 페이지 등은 제외)
  if (/^\/[a-z0-9-]+\/$/.test(path) && !/^\/(about|privacy|contact)\/$/.test(path)) {
    const list = [path].concat(read().filter((p) => p !== path)).slice(0, 3);
    try { store.setItem(RKEY, JSON.stringify(list)); } catch (e) {}
  }
  // 메인 화면: 최근 쓴 계산기 보여 주기
  const box = document.getElementById('recent');
  if (box) {
    const items = read().map((p) => document.querySelector('.groups a.item[href="' + p + '"]')).filter(Boolean);
    if (items.length) {
      const list = box.querySelector('.list');
      items.forEach((a) => list.appendChild(a.cloneNode(true)));
      box.hidden = false;
    }
  }
})();
