// 부가세·원천징수 계산 (페이지에 그대로 넣어 쓰고, 테스트도 이 파일로 함)
// 단수 처리: 원천징수 세액은 10원 미만 절사, 소득세가 1,000원 미만이면 소액부징수(소득세·지방소득세 0)

function floor10(n) { return Math.floor(n / 10 + 1e-9) * 10; }

// 부가세(10%) — mode 'add': 공급가액을 넣으면 합계, 'split': 합계(부가세 포함)를 넣으면 공급가액·세액으로 나눔
function vat(amount, mode) {
  const a = Math.max(0, Math.round(amount || 0));
  if (mode === 'split') {
    const supply = Math.round(a / 1.1);
    return { supply, tax: a - supply, total: a };
  }
  const tax = Math.floor(a * 0.1 + 1e-9);
  return { supply: a, tax, total: a + tax };
}

// 사업소득 3.3% (소득세 3% + 지방소득세 = 소득세의 10%)
function biz33(gross) {
  const g = Math.max(0, Math.round(gross || 0));
  let it = floor10(g * 0.03);
  if (it < 1000) it = 0;
  const lt = floor10(it * 0.1);
  return { gross: g, incomeTax: it, localTax: lt, net: g - it - lt };
}
// 실수령액 → 지급액 역산 (실수령액 ÷ 0.967 을 반올림하고, 절사 때문에 모자라면 1원씩 올림)
function biz33Gross(net) {
  const t = Math.max(0, Math.round(net || 0));
  let g = Math.round(t / 0.967);
  while (biz33(g).net < t) g++;
  return biz33(g);
}

// 일용근로소득: 하루마다 (일당 - 15만원) × 6% × 45%, 지급할 때 날짜별 세액을 합쳐 소액부징수 판단
function daily(wage, days) {
  const w = Math.max(0, Math.round(wage || 0));
  const d = Math.max(0, Math.round(days || 0));
  const perDay = Math.max(0, w - 150000) * 0.06 * 0.45;
  let it = floor10(perDay * d);
  if (it < 1000) it = 0;
  const lt = floor10(it * 0.1);
  const gross = w * d;
  return { gross, perDay, incomeTax: it, localTax: lt, net: gross - it - lt };
}

// 금액을 한글로 (견적서 '일금 ○○원정' 표기)
function hangul(n) {
  n = Math.floor(Math.max(0, n || 0));
  if (n === 0) return '영';
  const d = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const s = ['', '십', '백', '천'];
  const b = ['', '만', '억', '조'];
  let out = '', i = 0;
  while (n > 0 && i < b.length) {
    const chunk = n % 10000;
    if (chunk) {
      let c = '', x = chunk, j = 0;
      while (x > 0) { const k = x % 10; if (k) c = d[k] + s[j] + c; x = Math.floor(x / 10); j++; }
      out = c + b[i] + out;
    }
    n = Math.floor(n / 10000); i++;
  }
  return out;
}

const FUNCS = [floor10, vat, biz33, biz33Gross, daily, hangul];
const inline = () => FUNCS.map((f) => f.toString()).join('\n');

module.exports = { floor10, vat, biz33, biz33Gross, daily, hangul, inline };
