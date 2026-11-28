// 생성형 페이지들이 함께 쓰는 머리말·꼬리말·계산기 목록 (사이트에는 올라가지 않음)
// 디자인은 tile/index.html 의 <style> 을 그대로 가져와 기존 계산기와 똑같이 맞춤.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const tileHtml = fs.readFileSync(path.join(ROOT, 'tile/index.html'), 'utf8');
const BASE_STYLE = tileHtml.match(/<style>[\s\S]*?<\/style>/)[0];

const ICONS = {
  tile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" fill="currentColor"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.6" fill="currentColor"/></svg>',
  wallpaper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="5.5" rx="2.75"/><path d="M6 8.5V20h8l3-3V8.5"/><path d="M14 20v-3h3"/><path d="M9.5 12v4.5"/></svg>',
  paint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="15" height="6" rx="2"/><path d="M18 6h2a1 1 0 0 1 1 1v3.8a1 1 0 0 1-1 1h-8v2.7"/><rect x="10" y="14.5" width="4" height="6.5" rx="1.5" fill="currentColor"/></svg>',
  floor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9.33h18M3 14.67h18M10.5 4v5.33M15.5 9.33v5.33M7.5 9.33v5.33M12.5 14.67V20"/></svg>',
  pyeong: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="13" height="13" rx="2"/><path d="M4 3.5h13M4 2v3M17 2v3M20.5 7v13M19 7h3M19 20h3"/></svg>',
  area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V9h7V4h9v16z"/><path d="M4 20l7-7"/></svg>',
  waste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/></svg>',
  measure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6 8v3M9.5 8v4.5M13 8v3M16.5 8v4.5M20 8v3"/></svg>',
  schedule: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M7.5 14h3M7.5 17h6"/></svg>',
  insulation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/><circle cx="8" cy="7.5" r="1"/><circle cx="16" cy="16.5" r="1"/><circle cx="16" cy="7.5" r="1"/><circle cx="8" cy="16.5" r="1"/></svg>',
  estimate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5h9l4 4V21.5H6z"/><path d="M15 2.5v4h4"/><path d="M9 11h7M9 14.5h7M9 18h4"/></svg>',
  labor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13a8 8 0 0 1 16 0"/><path d="M3 13h18v2.5H3z"/><path d="M12 5v4"/><path d="M8 19h8"/></svg>',
  vat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M8 7h8"/><path d="M9 16.5l6-6"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="16" r="1"/></svg>',
};

// 사이트 전체 도구 목록 — 순서가 곧 메인·관련 목록 순서
const TOOLS = [
  { key: 'tile', group: 'mat', href: '/tile/', name: '타일 수량 계산기', sub: '필요한 타일 장수 · 박스 수 · 예상 비용' },
  { key: 'wallpaper', group: 'mat', href: '/wallpaper/', name: '도배지 계산기', sub: '필요한 벽지 롤 수 · 실크 / 합지' },
  { key: 'paint', group: 'mat', href: '/paint/', name: '페인트 계산기', sub: '필요한 페인트 양 · 1L / 4L / 18L 통 조합' },
  { key: 'floor', group: 'mat', href: '/floor/', name: '장판 · 마루 계산기', sub: '필요한 장판 길이 · 마루 박스 수' },
  { key: 'insulation', group: 'mat', href: '/insulation/', name: '창문 단열 · 뽁뽁이 계산기', sub: '뽁뽁이 롤 수 · 재단표 · 문풍지 · 단열벽지' },
  { key: 'pyeong', group: 'size', href: '/pyeong/', name: '평수 계산기', sub: '㎡ ↔ 평 변환 · 방 크기로 평수 · 아파트 면적 해설' },
  { key: 'area', group: 'size', href: '/area/', name: '면적 계산기', sub: '사각형·삼각형·원·ㄱ자 면적 · ㎡ / 평' },
  { key: 'waste', group: 'prep', href: '/waste/', name: '폐기물 정리 도우미', sub: '공사·이사 전 버릴 것 · 무상수거 / 대형폐기물 / 공사 잔재' },
  { key: 'measure', group: 'size', href: '/measure/', name: '교체 전 치수 기록', sub: '방문·변기 바꾸기 전 재야 할 곳 · 기준 치수 정리' },
  { key: 'schedule', group: 'prep', href: '/schedule/', name: '공사·이사 일정표', sub: '이사 날짜로 공사 순서와 할 일을 거꾸로 계산' },
  { key: 'estimate', group: 'money', href: '/estimate/', name: '견적서 작성기', sub: '공종별 항목 · 부가세 자동 계산 · PDF 저장' },
  { key: 'labor', group: 'money', href: '/labor/', name: '인건비 · 3.3% 계산기', sub: '일당 × 일수 · 3.3% 실수령액 · 일용직 세금' },
  { key: 'vat', group: 'money', href: '/vat/', name: '부가세 계산기', sub: '공급가액 ↔ 합계 · VAT 별도 / 포함' },
];

// 메인 화면 묶음 (순서대로 보여 줌)
const GROUPS = [
  { key: 'mat', name: '자재 수량' },
  { key: 'size', name: '평수 · 면적 · 치수' },
  { key: 'money', name: '견적 · 비용' },
  { key: 'prep', name: '일정 · 정리' },
];

const itemHtml = (t) => `<a class="item" href="${t.href}"><div class="ico">${ICONS[t.key]}</div><div class="txt"><b>${t.name}</b><span class="sub">${t.sub}</span></div><div class="go">→</div></a>`;
const related = (exclude) => `<div class="list">${TOOLS.filter((t) => t.key !== exclude).map(itemHtml).join('')}</div>`;

// 검색 결과에 '집 공사 계산기 › 페이지' 경로로 보이게 하는 표시
function crumbJsonLd(name, url) {
  if (!url || url === 'https://jibcalc.com/') return '';
  name = name.split(' | ')[0].trim();
  return `<script type="application/ld+json" id="crumb">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: '집 공사 계산기', item: 'https://jibcalc.com/' },
    { '@type': 'ListItem', position: 2, name, item: url }] })}</script>\n`;
}

function head({ title, desc, url, jsonld = '', extraStyle = '' }) {
  jsonld = crumbJsonLd(title.split(' – ')[0], url) + jsonld;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="집 공사 계산기">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://jibcalc.com/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${url}">
${jsonld}<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
${BASE_STYLE}
${extraStyle}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#ffc400">
<link rel="stylesheet" href="/common.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2109467057955554" crossorigin="anonymous"></script>
</head>
<body>
<div class="wrap">
`;
}

const back = (href, text) => `<p style="margin-bottom:10px"><a href="${href}" style="color:var(--muted);text-decoration:none;font-size:.88rem;display:inline-flex;align-items:center;gap:8px"><img src="/img/logo-mark.svg" alt="" width="22" height="22">${text}</a></p>`;

const foot = (note) => `  <footer>
    <div class="foot-links"><a href="/about/">소개</a><a href="/privacy/">개인정보처리방침</a><a href="/contact/">문의</a></div>
    ${note}
  </footer>
</div>
`;

const faqJsonLd = (faq) => `<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) }, null, 2)}
</script>
`;

const write = (rel, html) => {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
};

module.exports = { crumbJsonLd, ROOT, BASE_STYLE, ICONS, TOOLS, GROUPS, itemHtml, related, head, back, foot, faqJsonLd, write };
