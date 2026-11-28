// 손으로 만든 페이지의 기본 스타일·글꼴을 tools/base.css 로 바꿈: node tools/apply-theme.js
// (생성형 페이지는 site-kit 이 tile/index.html 의 스타일을 가져가므로, 이걸 먼저 돌리고 build-*.js 실행)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8');
const FONT_OLD = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=[^"]+" rel="stylesheet">/;
const FONT_NEW = '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;700&display=swap" rel="stylesheet">';
for (const rel of ['index.html', 'tile/index.html', 'wallpaper/index.html', 'paint/index.html', 'floor/index.html', 'about/index.html', 'privacy/index.html', 'contact/index.html']) {
  const file = path.join(ROOT, rel);
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/<style>[\s\S]*?<\/style>/, () => '<style>' + css + '</style>');
  s = s.replace(FONT_OLD, FONT_NEW);
  s = s.replace(/<meta name="theme-color" content="[^"]*">/, '<meta name="theme-color" content="#ffc400">');
  if (!s.includes('site.webmanifest')) s = s.replace('<meta name="theme-color" content="#ffc400">', '<meta name="theme-color" content="#ffc400">\n<link rel="manifest" href="/site.webmanifest">');
  // 경로 표시(BreadcrumbList) — 메인 제외
  if (rel !== 'index.html' && !s.includes('id="crumb"')) {
    const kit = require('./site-kit');
    const title = s.match(/<title>([^<]+)<\/title>/)[1];
    const url = s.match(/<link rel="canonical" href="([^"]+)">/)[1];
    s = s.replace('</head>', kit.crumbJsonLd(title.split(' – ')[0], url) + '</head>');
  }
  fs.writeFileSync(file, s);
  console.log('테마 적용:', rel);
}
