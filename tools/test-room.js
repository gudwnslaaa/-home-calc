// node tools/test-room.js
const m = require('./room-math');
let ok = 0, bad = 0;
const eq = (n, g, w) => { const a = JSON.stringify(g), b = JSON.stringify(w); if (a === b) ok++; else { bad++; console.log('✗', n, a, '기대', b); } };
const W = 330, D = 360;
const bed = { x: 0, y: 0, w: 150, d: 200 };
const ward = { x: 0, y: 300, w: 120, d: 60 };
eq('겹침 없음', m.overlaps(bed, ward), false);
eq('겹침', m.overlaps(bed, { x: 140, y: 190, w: 50, d: 50 }), true);
eq('맞닿음은 겹침 아님', m.overlaps(bed, { x: 150, y: 0, w: 50, d: 50 }), false);
// 문: 아래 벽, 왼쪽에서 230cm, 폭 90, 경첩 끝쪽(b) → 경첩 (320,360), 영역 상자 x230~320, y270~360
const door = { wall: 'bottom', pos: 230, w: 90, hinge: 'b' };
const z = m.doorZone(door, W, D);
eq('문 경첩', [z.hx, z.hy], [320, 360]);
eq('문 걸림', m.hitsDoor({ x: 250, y: 300, w: 40, d: 40 }, z), true);
eq('문 모서리 밖(원 밖)', m.hitsDoor({ x: 230, y: 270, w: 5, d: 5 }, z), false);
eq('미닫이는 영역 없음', m.doorZone({ ...door, slide: true }, W, D), null);
// 틈: 침대 아래쪽 ↔ 옷장 위쪽 = 300-200 = 100
const g = m.gaps([bed, ward], W, D);
eq('침대 아래 틈', g.find((x) => x.i === 0 && x.side === '아래쪽').gap, 100);
eq('침대 오른쪽 벽', g.find((x) => x.i === 0 && x.side === '오른쪽').gap, 180);
const r = m.analyze([bed, { x: 0, y: 245, w: 120, d: 60 }], W, D, door, 60);
eq('좁은 틈 45·55cm', r.narrow.map((x) => x.gap), [45, 55]);
eq('사용 면적', r.used, 150 * 200 + 120 * 60);
const r2 = m.analyze([bed, { x: 100, y: 150, w: 100, d: 100 }], W, D, door, 60);
eq('겹침 표시', r2.bad.sort(), [0, 1]);
const r3 = m.analyze([{ x: 300, y: 0, w: 50, d: 50 }], W, D, null, 60);
eq('방 밖', r3.notes[0].type, 'out');
console.log(`통과 ${ok} / 실패 ${bad}`);
process.exit(bad ? 1 : 0);
