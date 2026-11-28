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

  /* ---------- 1) cm → m 자동 변환 ---------- */
  function isMeterInput(el) {
    if (!el || el.type !== 'number') return false;
    if (el.dataset.unit === 'none') return false; // 긴 길이(롤 길이 등)는 변환하지 않음
    if (el.dataset.unit === 'm') return true;
    const box = el.closest('div');
    const label = box && box.querySelector('label');
    return !!(label && label.textContent.includes('(m)'));
  }
  // 캡처 단계에서 먼저 바꿔서 계산기가 바뀐 값으로 계산하게 함
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!isMeterInput(el)) return;
    const v = parseFloat(el.value);
    if (v >= 30) {
      const m = Math.round(v) / 100;
      el.value = m;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      toast(`${v}cm로 보고 ${m}m로 바꿨어요`);
    }
  }, true);

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

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML =
    '<button type="button" class="btn primary" data-a="copy">결과 복사</button>' +
    '<button type="button" class="btn" data-a="share">공유하기</button>' +
    '<button type="button" class="btn" data-a="image">이미지로 저장</button>' +
    '<button type="button" class="btn ghost" data-a="reset">입력 초기화</button>';
  // 결과 수량을 견적서 작성기로 보냄: <section class="result" data-est="통계 순서" data-est-name="품명" data-est-cat="공종">
  if (result.dataset.est != null) {
    actions.insertAdjacentHTML('afterbegin', '<button type="button" class="btn" data-a="est">견적서에 담기</button>');
  }
  result.appendChild(actions);
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

  actions.addEventListener('click', async (e) => {
    const a = e.target.closest('button') && e.target.closest('button').dataset.a;
    if (a === 'est') { sendToEstimate(); return; }
    if (a === 'copy') {
      copyText(resultText()).then(() => toast('결과를 복사했어요. 카톡이나 메모에 붙여넣으세요'),
                                  () => toast('복사하지 못했어요. 화면을 길게 눌러 복사해 주세요'));
    } else if (a === 'share') {
      const data = { title: pageName, text: resultText(), url: location.origin + location.pathname };
      if (navigator.share) { try { await navigator.share(data); } catch (err) { /* 사용자가 취소 */ } }
      else copyText(data.url).then(() => toast('계산기 주소를 복사했어요'));
    } else if (a === 'image') {
      try { await saveImage(); } catch (err) { toast('이미지를 만들지 못했어요. 결과 복사를 이용해 주세요'); }
    } else if (a === 'reset') {
      if (store) { try { store.removeItem(KEY); } catch (err) {} }
      location.reload();
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
