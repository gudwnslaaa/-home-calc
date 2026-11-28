// 가구 배치 계산 (cm 단위) — 페이지와 테스트가 함께 씀
// 가구: {x,y,w,d} (왼쪽 위 모서리 기준), 방: W × D

function overlaps(a, b) {
  return a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.d - 1e-9 && b.y < a.y + a.d - 1e-9;
}

// 문 열림 영역: 문이 달린 벽(top/bottom/left/right), 벽 시작점에서의 위치 pos, 폭 dw, 경첩 쪽(a=시작 쪽, b=끝 쪽)
function doorZone(door, W, D) {
  if (!door || door.slide || !(door.w > 0)) return null;
  const r = door.w, p = door.pos;
  let hx, hy, box;
  if (door.wall === 'top' || door.wall === 'bottom') {
    hx = door.hinge === 'b' ? p + r : p; hy = door.wall === 'top' ? 0 : D;
    box = { x: p, y: door.wall === 'top' ? 0 : D - r, w: r, d: r };
  } else {
    hy = door.hinge === 'b' ? p + r : p; hx = door.wall === 'left' ? 0 : W;
    box = { x: door.wall === 'left' ? 0 : W - r, y: p, w: r, d: r };
  }
  return { hx, hy, r, box };
}
function hitsDoor(f, z) {
  if (!z || !overlaps(f, z.box)) return false;
  const cx = Math.max(f.x, Math.min(z.hx, f.x + f.w));
  const cy = Math.max(f.y, Math.min(z.hy, f.y + f.d));
  return Math.hypot(cx - z.hx, cy - z.hy) < z.r - 1e-9;
}

// 가구마다 네 방향으로 가장 가까운 벽·가구까지 거리 → 좁은 틈 목록
function gaps(items, W, D) {
  const out = [];
  items.forEach((a, i) => {
    const dirs = [
      ['왼쪽', a.x, -1], ['오른쪽', W - (a.x + a.w), -1], ['위쪽', a.y, -1], ['아래쪽', D - (a.y + a.d), -1],
    ];
    items.forEach((b, j) => {
      if (i === j) return;
      const yOver = a.y < b.y + b.d && b.y < a.y + a.d;
      const xOver = a.x < b.x + b.w && b.x < a.x + a.w;
      if (yOver && b.x + b.w <= a.x + 1e-9 && a.x - (b.x + b.w) < dirs[0][1]) dirs[0] = ['왼쪽', a.x - (b.x + b.w), j];
      if (yOver && b.x >= a.x + a.w - 1e-9 && b.x - (a.x + a.w) < dirs[1][1]) dirs[1] = ['오른쪽', b.x - (a.x + a.w), j];
      if (xOver && b.y + b.d <= a.y + 1e-9 && a.y - (b.y + b.d) < dirs[2][1]) dirs[2] = ['위쪽', a.y - (b.y + b.d), j];
      if (xOver && b.y >= a.y + a.d - 1e-9 && b.y - (a.y + a.d) < dirs[3][1]) dirs[3] = ['아래쪽', b.y - (a.y + a.d), j];
    });
    dirs.forEach(([side, g, j]) => out.push({ i, side, gap: Math.round(g), with: j }));
  });
  return out;
}

// 전체 판정: 겹침, 문 걸림, 방 밖, 좁은 틈(기준 미만, 붙여 둔 5cm 미만은 제외)
function analyze(items, W, D, door, minPass) {
  const z = doorZone(door, W, D);
  const bad = new Set(), notes = [];
  items.forEach((a, i) => {
    if (a.x < -1e-9 || a.y < -1e-9 || a.x + a.w > W + 1e-9 || a.y + a.d > D + 1e-9) { bad.add(i); notes.push({ type: 'out', i }); }
    if (hitsDoor(a, z)) { bad.add(i); notes.push({ type: 'door', i }); }
    for (let j = i + 1; j < items.length; j++) if (overlaps(a, items[j])) { bad.add(i); bad.add(j); notes.push({ type: 'overlap', i, j }); }
  });
  const narrow = [];
  const seen = new Set();
  gaps(items, W, D).forEach((g) => {
    if (g.gap < 5 || g.gap >= minPass) return;
    if (g.with < 0 && g.gap < 30) return; // 벽과 30cm 미만은 통로가 아니라 자투리로 봄
    const key = g.with >= 0 ? [Math.min(g.i, g.with), Math.max(g.i, g.with), g.gap].join('-') : g.i + '-' + g.side;
    if (seen.has(key)) return;
    seen.add(key);
    narrow.push(g);
  });
  const used = items.reduce((s, a) => s + a.w * a.d, 0);
  return { bad: [...bad], notes, narrow, used, free: W * D - used, zone: z };
}

const FUNCS = [overlaps, doorZone, hitsDoor, gaps, analyze];
module.exports = { overlaps, doorZone, hitsDoor, gaps, analyze, inline: () => FUNCS.map((f) => f.toString()).join('\n') };
