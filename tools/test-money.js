// node tools/test-money.js
const m = require('./money-math');
let ok = 0, bad = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) ok++; else { bad++; console.log('✗', name, '→', g, '기대', w); }
};

// 부가세
eq('공급가 100만 → 합계', m.vat(1000000, 'add'), { supply: 1000000, tax: 100000, total: 1100000 });
eq('합계 110만 → 공급가', m.vat(1100000, 'split'), { supply: 1000000, tax: 100000, total: 1100000 });
eq('합계 1만 → 나누기', m.vat(10000, 'split'), { supply: 9091, tax: 909, total: 10000 });
eq('공급가 12,345', m.vat(12345, 'add').tax, 1234);

// 3.3% (국세청·세무 안내 예시: 100만원 → 967,000원 / 816,000원 → 24,480 + 2,440)
eq('100만 3.3%', m.biz33(1000000), { gross: 1000000, incomeTax: 30000, localTax: 3000, net: 967000 });
eq('81.6만 3.3%', m.biz33(816000), { gross: 816000, incomeTax: 24480, localTax: 2440, net: 789080 });
eq('3만원 소액부징수', m.biz33(30000).incomeTax, 0);
eq('실수령 967,000 역산', m.biz33Gross(967000).gross, 1000000);
eq('실수령 20만 역산 ≥ 목표', m.biz33Gross(200000).net >= 200000, true);
for (const n of [1, 999, 50000, 123457, 3000000]) eq('역산 ' + n, m.biz33Gross(n).net >= n && m.biz33Gross(n).gross - Math.round(n / 0.967) < 20, true);

// 일용근로 (국세청 예시: 일급 20만원 → 소득세 1,350원)
eq('일당 20만 1일', m.daily(200000, 1).incomeTax, 1350);
eq('일당 20만 1일 지방', m.daily(200000, 1).localTax, 130);
eq('일당 15만 → 0', m.daily(150000, 5).incomeTax, 0);
eq('일당 16만 1일 → 270원 소액부징수', m.daily(160000, 1).incomeTax, 0);
eq('일당 16만 4일 일괄 → 1,080', m.daily(160000, 4).incomeTax, 1080);
eq('일당 25만 10일', m.daily(250000, 10), { gross: 2500000, perDay: 2700, incomeTax: 27000, localTax: 2700, net: 2470300 });

// 한글 금액
eq('한글 1,230,000', m.hangul(1230000), '일백이십삼만');
eq('한글 10,005', m.hangul(10005), '일만오');
eq('한글 350,000,000', m.hangul(350000000), '삼억오천만');

console.log(`통과 ${ok} / 실패 ${bad}`);
process.exit(bad ? 1 : 0);
