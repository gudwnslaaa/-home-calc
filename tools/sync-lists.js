// 손으로 만든 페이지(메인·타일·도배·페인트·바닥)의 계산기 목록을 site-kit TOOLS 기준으로 다시 씀
// node tools/sync-lists.js
const fs = require('fs');
const path = require('path');
const kit = require('./site-kit');

function replaceList(html, newList) {
  const start = html.indexOf('<div class="list">');
  if (start < 0) throw new Error('list 없음');
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0, m, end = -1;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) { end = m.index + 6; break; }
  }
  return html.slice(0, start) + newList + html.slice(end);
}

const pages = { 'index.html': null, 'tile/index.html': 'tile', 'wallpaper/index.html': 'wallpaper', 'paint/index.html': 'paint', 'floor/index.html': 'floor' };
for (const [rel, key] of Object.entries(pages)) {
  const file = path.join(kit.ROOT, rel);
  const html = fs.readFileSync(file, 'utf8');
  const list = key ? kit.related(key)
    : '<div class="list">\n' + kit.TOOLS.map((t) => '    ' + kit.itemHtml(t)).join('\n') + '\n  </div>';
  fs.writeFileSync(file, replaceList(html, list));
  console.log('목록 갱신:', rel);
}
