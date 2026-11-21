// 평수 변환값 검증: node tools/test-pyeong.js
const assert = require('assert');
const { m2ToPyeong, pyeongToM2, round } = require('./pyeong-math');

const cases = [
  ['1평 → ㎡ (소수 넷째 자리)', round(pyeongToM2(1), 4), 3.3058],
  ['1평 → ㎡ (소수 둘째 자리)', round(pyeongToM2(1), 2), 3.31],
  ['39㎡ → 평', round(m2ToPyeong(39)), 11.80],
  ['49㎡ → 평', round(m2ToPyeong(49)), 14.82],
  ['59㎡ → 평', round(m2ToPyeong(59)), 17.85],
  ['74㎡ → 평', round(m2ToPyeong(74)), 22.39],
  ['84㎡ → 평', round(m2ToPyeong(84)), 25.41],
  ['101㎡ → 평', round(m2ToPyeong(101)), 30.55],
  ['114㎡ → 평', round(m2ToPyeong(114)), 34.49],
  ['34평 → ㎡', round(pyeongToM2(34)), 112.40],
  ['25평 → ㎡', round(pyeongToM2(25)), 82.64],
  ['왕복 84㎡', round(pyeongToM2(m2ToPyeong(84))), 84],
  ['3.6m×3.0m 방 → 평', round(m2ToPyeong(3.6 * 3.0)), 3.27],
];
let fail = 0;
for (const [name, got, want] of cases) {
  try { assert.strictEqual(got, want); console.log('OK  ', name, got); }
  catch (e) { fail++; console.log('FAIL', name, 'got', got, 'want', want); }
}
if (fail) { console.log(fail + '개 실패'); process.exit(1); }
console.log('모두 통과:', cases.length + '개');
