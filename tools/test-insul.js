// node tools/test-insul.js
const m = require('./insul-math');
let ok = 0, bad = 0;
const eq = (n, g, w) => { const a = JSON.stringify(g), b = JSON.stringify(w); if (a === b) ok++; else { bad++; console.log('✗', n, a, '기대', b); } };

// 유리 0.9×1.2, 폭 1m: 세로 방향 1조각(1.2m) vs 가로 방향 2조각(0.9×2=1.8m) → 세로 1조각
eq('창 0.9x1.2', [m.cutPane(0.9, 1.2, 1).n, m.cutPane(0.9, 1.2, 1).len], [1, 1.2]);
// 유리 1.5×0.8: 세로 2조각 1.6m vs 가로 1조각 1.5m → 가로
eq('창 1.5x0.8', [m.cutPane(1.5, 0.8, 1).n, m.cutPane(1.5, 0.8, 1).len], [1, 1.5]);
// 담기: 1.2m ×4 를 5m 롤 → 4.8m 한 롤
eq('담기 1롤', m.packRolls([1.2, 1.2, 1.2, 1.2], 5), 1);
eq('담기 2롤', m.packRolls([1.2, 1.2, 1.2, 1.2, 1.2], 5), 2);
eq('담기 꽉', m.packRolls([3, 2, 2.5, 2.5], 5), 2);
eq('롤보다 긴 조각', m.packRolls([6], 5), null);
// 거실 큰 창 1.2×2.1 2장 + 방 창 0.9×1.2 2장, 폭 1m, 길이 5m, 여유 0
const r = m.bubble([{ w: 1.2, h: 2.1, count: 2 }, { w: 0.9, h: 1.2, count: 2 }], 1, 5, 0);
// 1.2×2.1: 세로 2조각×2.1=4.2 vs 가로 3조각×1.2=3.6 → 가로 3조각 1.2m; ×2장 → 6조각 1.2m; 방 창 1조각 1.2m×2 → 총 8조각 1.2m = 9.6m → 5m 롤에 4개씩 → 2롤
eq('거실+방 롤 수', r.rolls, 2);
eq('거실+방 총 길이', Math.round(r.total * 10) / 10, 9.6);
eq('면적', Math.round(r.area * 100) / 100, 7.2);
// 단열벽지: 벽 3.0m × 2.3m, 폭 1m, 10m 롤, 여유 0.05 → 3폭, 롤당 4폭 → 1롤
eq('단열벽지', m.wallRolls(3, 2.3, 1, 10, 0.05), { strips: 3, rolls: 1 });
eq('단열벽지 2롤', m.wallRolls(5.2, 2.3, 1, 10, 0.05), { strips: 6, rolls: 2 });
console.log(`통과 ${ok} / 실패 ${bad}`);
process.exit(bad ? 1 : 0);
