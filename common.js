/* 모든 계산기 공통 기능
   1) cm로 입력해도 m로 자동 변환
   2) 입력값 기억(이 기기에서만) + 입력 초기화
   3) 결과 복사 · 공유하기
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

  restore();
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
    '<button type="button" class="btn ghost" data-a="reset">입력 초기화</button>';
  result.appendChild(actions);

  actions.addEventListener('click', async (e) => {
    const a = e.target.closest('button') && e.target.closest('button').dataset.a;
    if (a === 'copy') {
      copyText(resultText()).then(() => toast('결과를 복사했어요. 카톡이나 메모에 붙여넣으세요'),
                                  () => toast('복사하지 못했어요. 화면을 길게 눌러 복사해 주세요'));
    } else if (a === 'share') {
      const data = { title: pageName, text: resultText(), url: location.origin + location.pathname };
      if (navigator.share) { try { await navigator.share(data); } catch (err) { /* 사용자가 취소 */ } }
      else copyText(data.url).then(() => toast('계산기 주소를 복사했어요'));
    } else if (a === 'reset') {
      if (store) { try { store.removeItem(KEY); } catch (err) {} }
      location.reload();
    }
  });

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
