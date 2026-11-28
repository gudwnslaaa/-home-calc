// 손으로 만든 페이지(메인·타일·도배·페인트·바닥·소개·개인정보·문의)의 계산기 목록을 site-kit TOOLS 기준으로 다시 씀
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

// 메인: 묶음별 목록. 표시용 주석 사이를 통째로 바꿈
const S = '<!-- tools:start -->', E = '<!-- tools:end -->';
function homeBlock() {
  const parts = kit.GROUPS.map((g) => {
    const items = kit.TOOLS.filter((t) => t.group === g.key);
    return `    <section><h2 class="grp-title">${g.name}</h2>\n    <div class="list">\n${items.map((t) => '      ' + kit.itemHtml(t)).join('\n')}\n    </div></section>`;
  });
  return `${S}\n  <div class="groups">\n${parts.join('\n')}\n  </div>\n  ${E}`;
}
{
  const file = path.join(kit.ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(S)) html = html.slice(0, html.indexOf(S)) + homeBlock() + html.slice(html.indexOf(E) + E.length);
  else html = replaceList(html, homeBlock());
  fs.writeFileSync(file, html);
  console.log('목록 갱신: index.html');
}

const pages = { 'tile/index.html': 'tile', 'wallpaper/index.html': 'wallpaper', 'paint/index.html': 'paint', 'floor/index.html': 'floor', 'about/index.html': '', 'privacy/index.html': '', 'contact/index.html': '' };
for (const [rel, key] of Object.entries(pages)) {
  const file = path.join(kit.ROOT, rel);
  const html = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, replaceList(html, kit.related(key)));
  console.log('목록 갱신:', rel);
}

// common.js 안의 메뉴·검색용 계산기 목록 갱신
{
  const file = path.join(kit.ROOT, 'common.js');
  let js = fs.readFileSync(file, 'utf8');
  const A = '/* tools:json */', B = '/* /tools:json */';
  const data = JSON.stringify({ groups: kit.GROUPS, tools: kit.TOOLS.map(({ key, group, href, name, sub, kw }) => ({ key, group, href, name, sub, kw: kw || '' })) });
  const line = `${A} const NAV = ${data}; ${B}`;
  const MARK = '/* ===== 앱처럼 쓰기(오프라인) · 최근 쓴 계산기 ===== */';
  if (js.includes(A)) js = js.slice(0, js.indexOf(A)) + line + js.slice(js.indexOf(B) + B.length);
  else js = js.replace(MARK, '/* ===== 전체 계산기 메뉴 · 검색 ===== */\n' + line + '\n\n' + MARK);
  fs.writeFileSync(file, js);
  console.log('메뉴 목록 갱신: common.js');
}
