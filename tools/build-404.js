// 없는 주소로 들어왔을 때 보여 줄 페이지(/404.html) 생성: node tools/build-404.js
const kit = require('./site-kit');
const html = kit.head({
  title: '페이지를 찾을 수 없어요 – 집 공사 계산기',
  desc: '주소가 바뀌었거나 없는 페이지입니다. 집 공사 계산기의 다른 계산기를 이용해 보세요.',
  url: 'https://jibcalc.com/',
}).replace('<link rel="canonical" href="https://jibcalc.com/">', '<meta name="robots" content="noindex">') + `  <header>
    ${kit.back('/', '집 공사 계산기 · 처음으로')}
    <h1>페이지를 찾을 수 없어요</h1>
    <p>주소가 바뀌었거나 없는 페이지예요. 아래에서 필요한 계산기를 골라 주세요.</p>
  </header>
  <section class="related" style="margin-top:24px">
    ${kit.related('')}
  </section>
${kit.foot('모든 계산 결과는 참고용 추정치입니다.')}
</body>
</html>
`;
kit.write('404.html', html);
console.log('생성 완료: /404.html');
