// 평수 계산 공통 함수 — 생성 스크립트와 테스트에서 함께 씀 (사이트에는 올라가지 않음)
// 1평 = 400/121㎡ (≈ 3.305785㎡)
const M2_PER_PYEONG = 400 / 121;
const m2ToPyeong = (m2) => m2 * 121 / 400;
const pyeongToM2 = (py) => py * 400 / 121;
const round = (n, d = 2) => Math.round((n + Number.EPSILON) * 10 ** d) / 10 ** d;
module.exports = { M2_PER_PYEONG, m2ToPyeong, pyeongToM2, round };
