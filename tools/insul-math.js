// 창문 단열(뽁뽁이) 재단·롤 수 계산 — 페이지와 테스트가 함께 씀

// 유리 한 장(w×h, m)을 폭 rw 롤로 덮는 두 방향 중 덜 드는 쪽: 조각 길이 목록
function cutPane(w, h, rw, margin) {
  const m = margin || 0;
  const a = { n: Math.ceil(w / rw - 1e-9), len: h + m, dir: '세로로' };   // 세로 방향 조각을 가로로 이어 붙임
  const b = { n: Math.ceil(h / rw - 1e-9), len: w + m, dir: '가로로' };
  return a.n * a.len <= b.n * b.len + 1e-9 ? a : b;
}

// 조각 길이들을 롤 길이 L에 나눠 담기 (큰 조각부터, 남은 자리 중 가장 꽉 차는 곳에)
function packRolls(pieces, L) {
  const rolls = [];
  const sorted = pieces.slice().sort((x, y) => y - x);
  for (const p of sorted) {
    if (p > L + 1e-9) return null; // 롤보다 긴 조각
    let best = -1, bestLeft = Infinity;
    rolls.forEach((left, i) => { if (left + 1e-9 >= p && left - p < bestLeft) { best = i; bestLeft = left - p; } });
    if (best < 0) rolls.push(L - p); else rolls[best] -= p;
  }
  return rolls.length;
}

// panes: [{w,h,count}] → { pieces:[길이...], rolls, area, plan:[...] }
function bubble(panes, rw, L, margin) {
  const pieces = [], plan = [];
  let area = 0;
  panes.forEach((p) => {
    if (!(p.w > 0 && p.h > 0 && p.count > 0)) return;
    const c = cutPane(p.w, p.h, rw, margin);
    for (let i = 0; i < c.n * p.count; i++) pieces.push(c.len);
    area += p.w * p.h * p.count;
    plan.push({ ...p, ...c });
  });
  const rolls = pieces.length ? packRolls(pieces, L) : 0;
  return { pieces, rolls, area, plan, total: pieces.reduce((s, x) => s + x, 0) };
}

// 단열벽지(롤형): 벽 너비 W, 높이 H, 제품 폭 rw(m), 롤 길이 L(m)
function wallRolls(W, H, rw, L, margin) {
  if (!(W > 0 && H > 0 && rw > 0 && L > 0)) return { strips: 0, rolls: 0 };
  const len = H + (margin || 0);
  const per = Math.floor(L / len + 1e-9);
  const strips = Math.ceil(W / rw - 1e-9);
  if (per < 1) return { strips, rolls: null };
  return { strips, rolls: Math.ceil(strips / per) };
}

const FUNCS = [cutPane, packRolls, bubble, wallRolls];
module.exports = { cutPane, packRolls, bubble, wallRolls, inline: () => FUNCS.map((f) => f.toString()).join('\n') };
