// 견적서 작성기(/estimate/) 생성: node tools/build-estimate.js
// 항목·업체 정보는 이 기기(localStorage)에만 저장. 서버로 보내지 않음.
const kit = require('./site-kit');
const mm = require('./money-math');

const CATS = ['철거', '설비', '전기', '목공', '타일', '도장', '도배', '바닥', '욕실', '주방', '창호', '조명', '가구', '청소', '폐기물', '기타'];
// 공사별 항목 틀 (단가는 비워 둠)
const TEMPLATES = {
  bath: { name: '욕실 리모델링', items: [
    ['철거', '기존 욕실 철거·폐기물', '식', '인건비'], ['설비', '배관 정리', '식', '인건비'], ['욕실', '방수 시공', '식', '인건비'],
    ['타일', '벽 타일', '박스', '자재비'], ['타일', '바닥 타일', '박스', '자재비'], ['타일', '타일 시공', '품', '인건비'],
    ['욕실', '양변기', '개', '자재비'], ['욕실', '세면대·수전', '개', '자재비'], ['욕실', '욕실장·거울', '개', '자재비'],
    ['욕실', '천장재', '식', '자재비'], ['조명', '욕실 조명·환풍기', '개', '자재비'], ['청소', '준공 청소', '식', '경비']] },
  paper: { name: '도배 · 장판', items: [
    ['도배', '벽지', '롤', '자재비'], ['도배', '도배 시공', '품', '인건비'], ['바닥', '장판', 'm', '자재비'],
    ['바닥', '장판 시공', '식', '인건비'], ['철거', '기존 장판 철거·폐기', '식', '인건비'], ['가구', '짐 이동', '식', '경비']] },
  kitchen: { name: '주방', items: [
    ['철거', '기존 싱크대 철거', '식', '인건비'], ['주방', '싱크대 상·하부장', 'm', '자재비'], ['주방', '상판', 'm', '자재비'],
    ['주방', '싱크볼·수전', '개', '자재비'], ['설비', '배관·가스 연결', '식', '인건비'], ['타일', '주방 벽 타일', '박스', '자재비'],
    ['전기', '콘센트·조명', '개', '자재비']] },
  paint: { name: '페인트 도장', items: [
    ['도장', '바탕 정리·퍼티', '식', '인건비'], ['도장', '페인트', 'L', '자재비'], ['도장', '도장 시공', '품', '인건비'], ['기타', '보양', '식', '경비']] },
  site: { name: '현장 경비 (공통)', items: [
    ['기타', '자재 운반·양중', '식', '경비'], ['기타', '엘리베이터 보양', '식', '경비'], ['폐기물', '폐기물 처리', '식', '경비'], ['청소', '입주 청소', '식', '경비']] },
};
const UNITS = ['식', '㎡', '평', 'm', '개', '박스', '롤', 'L', '통', '장', '일', '인', '품', '회'];

const EXTRA_STYLE = `<style>
.items{display:grid;gap:10px}
.it{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--field)}
.it .r1{display:grid;grid-template-columns:110px 1fr 44px;gap:8px;align-items:end}
.it .r2{display:grid;grid-template-columns:90px 80px 1fr 100px;gap:8px;margin-top:8px;align-items:end}
.it .amt{margin-top:8px;font-size:.85rem;color:var(--muted);text-align:right}
.it .amt b{color:var(--ink);font-weight:600}
.it .x{height:44px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:1.1rem;cursor:pointer}
@media (max-width:560px){ .it .r1{grid-template-columns:96px 1fr 44px} .it .r2{grid-template-columns:1fr 1fr} }
.g2x{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:560px){ .g2x{grid-template-columns:1fr} }
textarea{width:100%;min-height:84px;border-radius:12px;border:1px solid var(--line);background:var(--field);color:var(--ink);padding:10px 12px;font:inherit;font-size:.92rem;resize:vertical;box-sizing:border-box}
.pay{display:grid;grid-template-columns:1fr 80px 1.6fr 44px;gap:8px;align-items:end;margin-top:8px}
.pay .x{height:44px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:1.1rem;cursor:pointer}
@media (max-width:560px){ .pay{grid-template-columns:1fr 70px 44px} .pay .cond{grid-column:1 / -1;order:4} }
.check{display:flex;align-items:center;gap:10px;font-size:.95rem;color:var(--ink);cursor:pointer;font-weight:500}
.check input{width:20px;height:20px;accent-color:#1c2024;margin:0}
.it{background:var(--soft)}
.it input,.it select{background:var(--card)}
.steps{position:sticky;top:0;z-index:20;display:flex;gap:6px;overflow-x:auto;margin:14px -4px 0;padding:8px 4px;background:var(--bg);scrollbar-width:none}
.steps::-webkit-scrollbar{display:none}
.steps a{flex:none;display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);text-decoration:none;font-size:.9rem;font-weight:600}
.steps a.go{background:var(--tape);border-color:var(--tape);color:#1c2024}
section[id^="s"]{scroll-margin-top:64px}
.brand-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.blabel{display:block;font-size:.86rem;color:var(--muted);margin-bottom:6px;font-weight:500}
.bslot{height:84px;border:1px dashed #b9beb6;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--field);overflow:hidden}
.bslot img{max-height:72px;max-width:90%;object-fit:contain}
.bslot span{color:var(--muted);font-size:.85rem}
.bbtns{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.bbtns .btn{font-size:.85rem;padding:8px 12px;min-height:40px;display:inline-flex;align-items:center;cursor:pointer}
#sheet .logo{max-height:56px;max-width:180px;display:block;margin-bottom:6px}
#sheet .co{position:relative;display:inline-block;padding-right:6px}
#sheet .seal{position:absolute;right:-30px;top:-14px;width:64px;height:64px;object-fit:contain;opacity:.92}
@media (max-width:560px){ .brand-row{grid-template-columns:1fr 1fr} }
.tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.kor{font-size:.85rem;color:var(--muted);margin-top:6px}
.imported{border-color:var(--accent)}
/* 견적서 미리보기 (흰 종이) */
#sheetWrap{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:50;overflow:auto;padding:16px}
#sheetWrap[hidden]{display:none}
.sheetbar{max-width:794px;margin:0 auto 10px;display:flex;gap:8px;justify-content:flex-end}
#sheet{max-width:794px;margin:0 auto;background:#fff;color:#111;padding:40px 36px;border-radius:6px;font-size:13px;line-height:1.55;box-sizing:border-box}
#sheet h1{font-size:26px;letter-spacing:.5em;text-align:center;margin:0 0 22px;color:#111}
#sheet table{width:100%;border-collapse:collapse}
#sheet td,#sheet th{border:1px solid #999;padding:6px 7px;vertical-align:top}
#sheet th{background:#f1f1f1;font-weight:600;white-space:nowrap}
#sheet .info td{border:0;padding:2px 0}
#sheet .num{text-align:right;white-space:nowrap}
#sheet .sum{margin:16px 0;padding:10px 12px;border:2px solid #111;font-size:15px}
#sheet .sum b{font-size:17px}
#sheet .memo{white-space:pre-wrap;border:1px solid #999;padding:8px 10px;margin-top:14px}
#sheet .grp td{background:#fafafa;font-weight:600}
#sheet .foot{margin-top:18px;color:#666;font-size:11px;text-align:right}
@media (max-width:560px){ #sheet{padding:22px 14px;font-size:11.5px} #sheet h1{font-size:21px} }
@media print{
  @page{size:A4;margin:12mm}
  body{background:#fff!important}
  body *{visibility:hidden}
  #sheetWrap,#sheetWrap *{visibility:visible}
  #sheetWrap{position:absolute;inset:0;background:#fff;padding:0;overflow:visible}
  .sheetbar{display:none}
  #sheet{max-width:none;padding:0;border-radius:0}
}
</style>`;

const faq = [
  ['인테리어 견적서에는 무엇을 적어야 하나요?', '공종별 항목(철거·설비·목공·타일·도배 등), 품명과 규격, 수량과 단위, 단가와 금액, 그리고 공급가액·부가세·합계를 나눠 적는 게 기본입니다. 견적 유효기간, 결제 조건, 견적에 포함되지 않은 공사도 함께 적어 두면 나중에 다툼이 줄어듭니다.'],
  ['견적서를 PDF로 저장하려면?', '‘견적서 보기’를 누른 뒤 ‘인쇄 · PDF 저장’을 누르고, 인쇄 창에서 대상(프린터)을 ‘PDF로 저장’으로 고르면 됩니다. 휴대폰은 인쇄 화면에서 공유 버튼으로 PDF를 보낼 수 있어요.'],
  ['넣은 내용은 어디에 저장되나요?', '지금 쓰는 기기의 브라우저 안에만 저장되고 서버로 보내지 않습니다. 다른 기기에서는 보이지 않으니, 완성한 견적서는 PDF로 저장해 두세요. ‘입력 초기화’를 누르면 지워집니다.'],
  ['견적서를 여러 개 만들어 둘 수 있나요?', '‘견적서 관리’에서 이름을 붙여 저장하면 30개까지 이 기기에 보관하고 다시 불러올 수 있습니다. 욕실·도배·주방처럼 자주 하는 공사는 ‘공사별 항목 틀’로 항목을 한 번에 넣고 수량과 단가만 채우면 됩니다.'],
  ['계약금·중도금·잔금도 적을 수 있나요?', '‘대금 지급 일정’을 켜면 단계마다 비율과 지급 시기를 적을 수 있고, 합계 금액에 맞춰 단계별 금액이 계산되어 견적서 아래에 표로 들어갑니다. 비율은 정해진 기준이 없으니 서로 합의한 대로 넣으세요.'],
  ['공과잡비는 몇 %로 잡나요?', '정해진 비율은 없고 업체와 공사 규모에 따라 다릅니다. 이 계산기는 직접 넣은 비율만 적용하고, 0%로 두면 넣지 않습니다.'],
];

const html = kit.head({
  title: '견적서 작성기 – 인테리어·공사 견적서 양식 무료 작성, 부가세 자동 계산·PDF 저장',
  desc: '공종별 항목과 수량·단가를 넣으면 공급가액·부가세·합계와 한글 금액이 자동으로 계산되는 무료 인테리어 견적서 양식입니다. 로그인 없이 바로 작성하고 PDF로 저장하세요.',
  url: 'https://jibcalc.com/estimate/',
  jsonld: kit.faqJsonLd(faq),
  extraStyle: EXTRA_STYLE,
}) + `  <header>
    ${kit.back('/', '집 공사 계산기 · 전체 보기')}
    <h1>견적서 작성기</h1>
    <p>항목만 넣으면 합계·부가세·한글 금액까지 정리된 견적서가 나옵니다.</p>
  </header>

  <nav class="steps" aria-label="견적서 단계">
    <a href="#s1">1 항목</a><a href="#s2">2 조정</a><a href="#s3">3 정보</a><a href="#s4">4 대금</a><a href="#s5" class="go">합계 · 보내기</a>
  </nav>

  <section class="card">
    <h2>견적서 관리</h2>
    <div class="g2x">
      <div><label for="savedList">저장한 견적서</label><select id="savedList"><option value="">저장한 견적서가 없어요</option></select></div>
      <div><label for="saveName">저장할 이름</label><input id="saveName" type="text" placeholder="예: OO아파트 욕실"></div>
    </div>
    <div class="tools">
      <button type="button" class="btn primary" id="saveBtn">지금 견적서 저장</button>
      <button type="button" class="btn" id="loadBtn">불러오기</button>
      <button type="button" class="btn ghost" id="delBtn">삭제</button>
      <button type="button" class="btn ghost" id="newBtn">새 견적서</button>
    </div>
    <div class="tools" style="margin-top:8px"><button type="button" class="btn ghost" data-backup="export">모든 견적서 파일로 내보내기</button><button type="button" class="btn ghost" data-backup="import">백업 가져오기</button></div>
    <p class="hint">견적서는 이 기기 브라우저에만 저장돼요. 새 견적서를 누르면 업체 정보는 그대로 두고 항목·고객 정보만 비워요.</p>
  </section>

  <section class="card" id="s1">
    <h2><span class="num">1</span>견적 항목</h2>
    <div class="g2x" style="margin-bottom:12px;align-items:end">
      <div><label for="tpl">공사별 항목 틀</label><select id="tpl">${Object.entries(TEMPLATES).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join('')}</select></div>
      <div><button type="button" class="btn" id="tplBtn" style="width:100%">항목 틀 넣기 (단가는 직접)</button></div>
    </div>
    <datalist id="catList">${CATS.map((c) => `<option value="${c}">`).join('')}</datalist>
    <datalist id="unitList">${UNITS.map((u) => `<option value="${u}">`).join('')}</datalist>
    <div class="items" id="items"></div>
    <button class="add" type="button" id="addItem">+ 항목 추가</button>
    <p class="hint">처음 보이는 세 줄은 쓰는 법을 보여 주는 예시예요. 지우고 새로 넣으세요. 타일·도배·페인트·바닥 계산기 결과에서 ‘견적서에 담기’를 누르면 수량이 여기로 들어와요.</p>
  </section>

  <section class="card" id="s2">
    <h2><span class="num">2</span>금액 조정</h2>
    <div class="grid g2">
      <div><label for="vatm">부가세</label>
        <select id="vatm"><option value="add" selected>별도 (10% 더하기)</option><option value="incl">포함 (단가에 이미 포함)</option><option value="none">없음</option></select></div>
      <div><label for="misc">공과잡비·관리비 (%)</label><input id="misc" type="number" inputmode="decimal" min="0" step="0.5" value="0"></div>
      <div><label for="disc">할인 (원)</label><input id="disc" type="number" inputmode="numeric" min="0" step="1000" value="0"></div>
      <div><label for="cut">끝자리 정리</label>
        <select id="cut"><option value="0" selected>안 함</option><option value="1000">천 원 미만 버림</option><option value="10000">만 원 미만 버림</option><option value="100000">십만 원 미만 버림</option></select></div>
    </div>
  </section>

  <section class="card" id="s3">
    <h2><span class="num">3</span>견적서에 들어갈 정보 <small style="color:var(--muted);font-weight:400">(선택)</small></h2>
    <div class="g2x">
      <div><label for="coName">업체명</label><input id="coName" type="text" placeholder="예: OO인테리어"></div>
      <div><label for="coTel">담당자 · 연락처</label><input id="coTel" type="text" placeholder="예: 홍길동 010-0000-0000"></div>
      <div><label for="cuName">고객명</label><input id="cuName" type="text" placeholder="예: OOO 고객님"></div>
      <div><label for="site">공사 현장</label><input id="site" type="text" placeholder="예: OO아파트 101동 (32평)"></div>
      <div><label for="edate">견적일</label><input id="edate" type="date"></div>
      <div><label for="valid">유효기간 (일)</label><input id="valid" type="number" inputmode="numeric" min="0" step="1" value="30"></div>
    </div>
    <div class="brand-row">
      <div><span class="blabel">업체 로고</span><div class="bslot" id="logoSlot"><span>없음</span></div>
        <div class="bbtns"><label class="btn" for="logoFile">로고 올리기</label><input id="logoFile" type="file" accept="image/*" hidden><button type="button" class="btn ghost" data-brand-del="logo">빼기</button></div></div>
      <div><span class="blabel">직인 · 도장</span><div class="bslot" id="sealSlot"><span>없음</span></div>
        <div class="bbtns"><label class="btn" for="sealFile">직인 올리기</label><input id="sealFile" type="file" accept="image/*" hidden><button type="button" class="btn ghost" data-brand-del="seal">빼기</button></div></div>
    </div>
    <p class="hint">한 번 올리면 이 기기에 저장되어 모든 견적서(PDF·이미지)에 찍혀요. 배경이 투명한 PNG가 가장 깔끔해요.</p>
    <label for="memo" style="margin-top:10px">특이사항 · 결제 조건</label>
    <textarea id="memo" placeholder="예) 계약금·중도금·잔금 비율, 견적에 포함되지 않은 공사, 자재 변경 시 금액 조정 등"></textarea>
  </section>

  <section class="card" id="s4">
    <h2><span class="num">4</span>대금 지급 일정 <small style="color:var(--muted);font-weight:400">(선택)</small></h2>
    <label class="check"><input id="usePay" type="checkbox"> 계약금·중도금·잔금을 견적서에 함께 적기</label>
    <div id="payBox" hidden>
      <div id="pays"></div>
      <button class="add" type="button" id="addPay">+ 지급 단계 추가</button>
      <p class="hint">처음 넣어 둔 비율은 예시예요. 정해진 비율은 없으니 업체와 고객이 합의한 대로 고치세요. 마지막 단계에서 원 단위 끝수를 맞춥니다. 계약서는 공정거래위원회의 <a href="https://www.ftc.go.kr" target="_blank" rel="noopener">실내건축·창호공사 표준계약서</a>를 함께 쓰면 좋아요.</p>
    </div>
  </section>

  <section class="card result" id="s5" aria-live="polite">
    <h2>견적 합계</h2>
    <div class="big grid g3">
      <div class="stat"><div class="k">공급가액</div><div class="v" id="rS">0<small>원</small></div></div>
      <div class="stat"><div class="k">부가세</div><div class="v" id="rT">0<small>원</small></div></div>
      <div class="stat"><div class="k">합계</div><div class="v" id="rA">0<small>원</small></div></div>
    </div>
    <div class="detail" id="rDetail"></div>
    <div class="tools">
      <button type="button" class="btn primary" id="imgBtn">견적서 이미지로 보내기</button>
      <button type="button" class="btn" id="viewBtn">견적서 보기 · PDF 저장</button>
      <button type="button" class="btn" id="tsvBtn">엑셀용 표 복사</button>
    </div>
  </section>

  <!-- 애드센스 승인 후 광고 코드를 여기에 넣으세요 -->
  <div class="ad-slot"></div>

  <div id="sheetWrap" hidden>
    <div class="sheetbar"><button type="button" class="btn primary" id="imgBtn2">이미지로 보내기</button><button type="button" class="btn" id="printBtn">인쇄 · PDF 저장</button><button type="button" class="btn" id="closeBtn">닫기</button></div>
    <div id="sheet"></div>
  </div>

  <article>
    <h2>견적서, 금액보다 먼저 보는 것</h2>
    <p>고객은 합계를 먼저 보지만, 나중에 문제가 되는 건 대개 ‘어디까지가 견적에 들어 있었나’입니다. 철거 후 폐기물 처리, 자재 운반, 엘리베이터 보양 같은 항목이 빠져 있으면 공사 중간에 추가 금액 이야기가 나오고 서로 얼굴을 붉히게 돼요. 항목을 공종별로 나누고, 빠진 공사는 특이사항에 “별도”라고 적어 두는 것만으로도 분쟁이 크게 줄어듭니다.</p>

    <h2>이 견적서 작성기로 할 수 있는 것</h2>
    <ul>
      <li>공종·품명·수량·단위·단가를 넣으면 항목별 금액과 공종별 소계를 자동 계산</li>
      <li>부가세 별도·포함·없음 선택, 공과잡비(%)·할인·끝자리 정리</li>
      <li>합계를 ‘일금 ○○원정’ 한글 표기로 함께 표시</li>
      <li>계약금·중도금·잔금 비율과 지급 시기를 적으면 단계별 금액 자동 계산</li>
      <li>욕실·도배 장판·주방·도장·현장 경비 항목 틀, 견적서 여러 개 저장·불러오기</li>
      <li>흰 종이 양식으로 보기 → 인쇄 또는 PDF 저장, 엑셀에 붙여 넣을 표 복사</li>
    </ul>
    <p>수량을 뽑을 땐 <a href="/tile/">타일</a>, <a href="/wallpaper/">도배지</a>, <a href="/paint/">페인트</a>, <a href="/floor/">장판·마루</a> 계산기를, 인건비는 <a href="/labor/">인건비·3.3% 계산기</a>를, 부가세만 따로 확인할 땐 <a href="/vat/">부가세 계산기</a>를 쓰세요.</p>

    <h2>고객 입장에서 견적서를 비교할 때</h2>
    <p>업체마다 항목을 묶는 방식이 달라 합계만 비교하면 틀리기 쉽습니다. 같은 공종끼리 줄을 맞춰 보고, ‘VAT 별도’인지, 폐기물·운반·청소가 들어 있는지부터 확인하세요. 받은 견적서를 이 양식에 옮겨 적어 보면 빠진 항목이 바로 눈에 띕니다.</p>

    <h2>자주 묻는 질문</h2>
${faq.map(([q, a]) => `    <h3>${q}</h3>\n    <p>${a}</p>`).join('\n')}
  </article>

  <section class="related">
    <h2>다른 계산기도 필요하신가요?</h2>
    ${kit.related('estimate')}
  </section>
${kit.foot('견적서 양식과 계산은 참고용입니다. 실제 계약 조건은 업체와 고객이 함께 확인하세요.')}
<script>
${mm.inline()}
const $ = id => document.getElementById(id);
const won = n => Math.round(n).toLocaleString('ko-KR');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'jibcalc-estimate-v1';
const FIELDS = ['vatm', 'misc', 'disc', 'cut', 'coName', 'coTel', 'cuName', 'site', 'edate', 'valid', 'memo'];
let store = null;
try { store = window.localStorage; } catch (e) {}

function addItem(v = {}, mark){
  const el = document.createElement('div');
  el.className = 'it' + (mark ? ' imported' : '');
  el.innerHTML =
    '<div class="r1">' +
      '<div><label>공종</label><input class="cat" aria-label="공종" list="catList" type="text" placeholder="예: 타일"></div>' +
      '<div><label>품명 · 규격</label><input class="name" aria-label="품명 · 규격" type="text" placeholder="예: 욕실 벽 300×600 포세린"></div>' +
      '<button type="button" class="x" aria-label="항목 삭제">×</button>' +
    '</div>' +
    '<div class="r2">' +
      '<div><label>수량</label><input class="qty" aria-label="수량" type="number" inputmode="decimal" min="0" step="any"></div>' +
      '<div><label>단위</label><input class="unit" aria-label="단위" list="unitList" type="text" placeholder="식"></div>' +
      '<div><label>단가 (원)</label><input class="price" aria-label="단가 (원)" type="number" inputmode="numeric" min="0" step="any"></div>' +
      '<div><label>구분</label><select class="kind" aria-label="구분"><option>자재비</option><option>인건비</option><option>경비</option></select></div>' +
    '</div>' +
    '<div class="amt"></div>';
  el.querySelector('.cat').value = v.cat || '';
  el.querySelector('.name').value = v.name || '';
  el.querySelector('.qty').value = v.qty ?? '';
  el.querySelector('.unit').value = v.unit || '';
  el.querySelector('.price').value = v.price ?? '';
  if (v.kind) el.querySelector('.kind').value = v.kind;
  el.querySelector('.x').addEventListener('click', () => { el.remove(); calc(); });
  $('items').appendChild(el);
  return el;
}

function addPay(v = {}){
  const el = document.createElement('div');
  el.className = 'pay';
  el.innerHTML =
    '<div><label>단계</label><input class="pn" type="text" aria-label="단계" placeholder="예: 계약금"></div>' +
    '<div><label>비율 (%)</label><input class="pp" type="number" inputmode="decimal" min="0" max="100" step="1" aria-label="비율 (%)"></div>' +
    '<div class="cond"><label>지급 시기 · 조건</label><input class="pc" type="text" aria-label="지급 시기 · 조건" placeholder="예: 계약할 때"></div>' +
    '<button type="button" class="x" aria-label="단계 삭제">×</button>';
  el.querySelector('.pn').value = v.n || '';
  el.querySelector('.pp').value = v.p ?? '';
  el.querySelector('.pc').value = v.c || '';
  el.querySelector('.x').addEventListener('click', () => { el.remove(); calc(); });
  $('pays').appendChild(el);
}
function readPays(){
  return [...document.querySelectorAll('.pay')].map(el => ({ n: el.querySelector('.pn').value.trim(), p: el.querySelector('.pp').value, c: el.querySelector('.pc').value.trim() }));
}
function payPlan(total){
  const rows = readPays().filter(r => r.n || parseFloat(r.p) > 0);
  const sum = rows.reduce((s, r) => s + (parseFloat(r.p) || 0), 0);
  let used = 0;
  const out = rows.map((r, i) => {
    const pct = parseFloat(r.p) || 0;
    let amt = Math.floor(total * pct / 100);
    if (i === rows.length - 1 && Math.abs(sum - 100) < 1e-9) amt = total - used;
    used += amt;
    return { ...r, pct, amt };
  });
  return { rows: out, sum };
}

function readItems(){
  return [...document.querySelectorAll('.it')].map(el => {
    const g = c => el.querySelector(c).value;
    const qty = parseFloat(g('.qty')) || 0, price = parseFloat(g('.price')) || 0;
    return { el, cat: g('.cat').trim(), name: g('.name').trim(), qty: g('.qty'), unit: g('.unit').trim(), price: g('.price'), kind: g('.kind'), amount: Math.round(qty * price) };
  });
}

function compute(){
  const items = readItems();
  const base = items.reduce((s, i) => s + i.amount, 0);
  const miscPct = Math.max(0, parseFloat($('misc').value) || 0);
  const misc = Math.round(base * miscPct / 100);
  const disc = Math.max(0, parseFloat($('disc').value) || 0);
  const cut = parseInt($('cut').value, 10) || 0;
  const vm = $('vatm').value;
  let pre = Math.max(0, base + misc - disc);   // 조정 후 금액 (부가세 포함 여부는 vm 기준)
  let supply, tax, total, cutAmt = 0;
  if (vm === 'add') {
    supply = cut ? Math.floor(pre / cut) * cut : pre; cutAmt = pre - supply;
    const r = vat(supply, 'add'); tax = r.tax; total = r.total;
  } else if (vm === 'incl') {
    total = cut ? Math.floor(pre / cut) * cut : pre; cutAmt = pre - total;
    const r = vat(total, 'split'); supply = r.supply; tax = r.tax;
  } else {
    supply = cut ? Math.floor(pre / cut) * cut : pre; cutAmt = pre - supply; tax = 0; total = supply;
  }
  const byCat = {}, byKind = {};
  items.forEach(i => { if (!i.amount) return; const c = i.cat || '기타'; byCat[c] = (byCat[c] || 0) + i.amount; byKind[i.kind] = (byKind[i.kind] || 0) + i.amount; });
  return { items, base, miscPct, misc, disc, cut, cutAmt, vm, supply, tax, total, byCat, byKind };
}

function calc(){
  const c = compute();
  c.items.forEach(i => { i.el.querySelector('.amt').innerHTML = i.amount ? '금액 <b>' + won(i.amount) + '원</b>' : ''; });
  $('rS').innerHTML = won(c.supply) + '<small>원</small>';
  $('rT').innerHTML = won(c.tax) + '<small>원</small>';
  $('rA').innerHTML = won(c.total) + '<small>원</small>';
  const parts = [];
  if (c.base) {
    parts.push('항목 ' + c.items.filter(i => i.amount).length + '개 합계 ' + won(c.base) + '원');
    const kinds = Object.entries(c.byKind).map(([k, v]) => k + ' ' + won(v) + '원');
    if (kinds.length > 1) parts.push(kinds.join(' · '));
    const cats = Object.entries(c.byCat);
    if (cats.length > 1) parts.push('공종별: ' + cats.map(([k, v]) => k + ' ' + won(v)).join(' · '));
    if (c.misc) parts.push('공과잡비 ' + c.miscPct + '% +' + won(c.misc) + '원');
    if (c.disc) parts.push('할인 −' + won(c.disc) + '원');
    if (c.cutAmt) parts.push('끝자리 정리 −' + won(c.cutAmt) + '원');
    if (c.vm === 'incl') parts.push('단가에 부가세 포함으로 계산');
    if (c.vm === 'none') parts.push('부가세 없음');
    parts.push('합계 한글 표기: <b>일금 ' + hangul(c.total) + '원정</b>');
    if ($('usePay').checked) {
      const pp = payPlan(c.total);
      if (pp.rows.length) parts.push('대금: ' + pp.rows.map(r => esc(r.n || '단계') + ' ' + r.pct + '% ' + won(r.amt) + '원').join(' · ') +
        (Math.abs(pp.sum - 100) > 1e-9 ? ' <span style="color:#ffb3a0">(비율 합계가 ' + pp.sum + '%예요. 100%로 맞춰 주세요)</span>' : ''));
    }
  }
  $('payBox').hidden = !$('usePay').checked;
  $('rDetail').innerHTML = parts.length ? parts.join('<br>') : '항목의 수량과 단가를 넣어 주세요.';
  save();
}

function save(){
  if (!store) return;
  const d = current();
  try { store.setItem(KEY, JSON.stringify(d)); } catch (e) {}
}
function load(){
  let d = null;
  try { d = store && JSON.parse(store.getItem(KEY)); } catch (e) {}
  if (!d) return false;
  FIELDS.forEach(id => { if (d.f && d.f[id] != null) $(id).value = d.f[id]; });
  (d.items || []).forEach(v => addItem(v));
  setPays(d.pay);
  return true;
}

// 다른 계산기에서 '견적서에 담기'로 넘어온 항목
function importFromUrl(){
  const q = new URLSearchParams(location.search);
  const name = (q.get('add') || '').slice(0, 60);
  const qty = parseFloat(q.get('qty'));
  if (!name || !(qty > 0)) return;
  const el = addItem({ cat: (q.get('cat') || '').slice(0, 20), name, qty: +qty.toFixed(2), unit: (q.get('unit') || '').slice(0, 10), kind: '자재비' }, true);
  history.replaceState(null, '', location.pathname);
  setTimeout(() => { el.scrollIntoView({ block: 'center' }); el.querySelector('.price').focus({ preventScroll: true }); }, 200);
}

// 로고·직인: 올린 그림을 최대 480px PNG로 줄여 이 기기에 저장
const BKEY = 'jibcalc-estimate-brand';
function brand(){ try { const b = JSON.parse(store.getItem(BKEY)) || {}; const ok = v => typeof v === 'string' && v.startsWith('data:image/png;base64,') ? v : ''; return { logo: ok(b.logo), seal: ok(b.seal) }; } catch (e) { return { logo: '', seal: '' }; } }
function showBrand(){
  const b = brand();
  [['logo', 'logoSlot'], ['seal', 'sealSlot']].forEach(([k, id]) => { $(id).innerHTML = b[k] ? '<img src="' + b[k] + '" alt="">' : '<span>없음</span>'; });
}
function shrink(file){
  return new Promise((res, rej) => {
    if (!file || !String(file.type).startsWith('image/')) return rej();
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 480 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(); };
    img.src = url;
  });
}
[['logoFile', 'logo'], ['sealFile', 'seal']].forEach(([id, k]) => $(id).addEventListener('change', async () => {
  try {
    const d = await shrink($(id).files[0]);
    const b = brand(); b[k] = d;
    store.setItem(BKEY, JSON.stringify(b)); showBrand(); flash(k === 'logo' ? '로고를 넣었어요' : '직인을 넣었어요');
  } catch (e) { flash('그림을 넣지 못했어요. JPG나 PNG 파일인지 확인해 주세요'); }
  $(id).value = '';
}));
document.querySelectorAll('[data-brand-del]').forEach(btn => btn.addEventListener('click', () => {
  const b = brand(); b[btn.dataset.brandDel] = ''; try { store.setItem(BKEY, JSON.stringify(b)); } catch (e) {} showBrand();
}));

function sheetHtml(){
  const c = compute();
  const rows = c.items.filter(i => i.name || i.amount);
  const d = $('edate').value ? new Date($('edate').value + 'T00:00:00') : new Date();
  const fmtD = x => x.getFullYear() + '년 ' + (x.getMonth() + 1) + '월 ' + x.getDate() + '일';
  const validDays = parseInt($('valid').value, 10);
  const until = validDays > 0 ? new Date(d.getTime() + validDays * 86400000) : null;
  let body = '', lastCat = null, no = 0;
  const sorted = rows.slice().sort((a, b) => 0); // 입력 순서 유지
  sorted.forEach(i => {
    const cat = i.cat || '기타';
    if (cat !== lastCat) { body += '<tr class="grp"><td colspan="6">' + esc(cat) + (c.byCat[cat] ? ' <span style="float:right">소계 ' + won(c.byCat[cat]) + '</span>' : '') + '</td></tr>'; lastCat = cat; }
    no++;
    body += '<tr><td class="num">' + no + '</td><td>' + esc(i.name) + '</td><td class="num">' + esc(i.qty) + '</td><td>' + esc(i.unit) + '</td><td class="num">' + (i.price !== '' ? won(+i.price) : '') + '</td><td class="num">' + (i.amount ? won(i.amount) : '') + '</td></tr>';
  });
  const extra = [];
  if (c.misc) extra.push(['공과잡비·관리비 (' + c.miscPct + '%)', won(c.misc)]);
  if (c.disc) extra.push(['할인', '−' + won(c.disc)]);
  if (c.cutAmt) extra.push(['끝자리 정리', '−' + won(c.cutAmt)]);
  extra.push(['공급가액', won(c.supply)]);
  if (c.vm !== 'none') extra.push(['부가세 (10%)', won(c.tax)]);
  extra.push(['합계', won(c.total)]);
  const memo = $('memo').value.trim();
  const br = brand();
  return (br.logo ? '<img class="logo" src="' + br.logo + '" alt="">' : '') + '<h1>견 적 서</h1>' +
    '<table class="info"><tr><td style="width:55%">' +
      ($('cuName').value ? '<b>' + esc($('cuName').value) + '</b> 귀하<br>' : '') +
      ($('site').value ? '현장: ' + esc($('site').value) + '<br>' : '') +
      '견적일: ' + fmtD(d) + (until ? '<br>유효기간: ' + fmtD(until) + '까지' : '') +
    '</td><td style="text-align:right">' +
      ($('coName').value ? '<span class="co"><b>' + esc($('coName').value) + '</b>' + (br.seal ? '<img class="seal" src="' + br.seal + '" alt="직인">' : '') + '</span><br>' : (br.seal ? '<img class="seal" style="position:static" src="' + br.seal + '" alt="직인"><br>' : '')) +
      ($('coTel').value ? esc($('coTel').value) : '') +
    '</td></tr></table>' +
    '<div class="sum">합계 금액: <b>일금 ' + hangul(c.total) + '원정</b> (₩' + won(c.total) + ')' + (c.vm === 'add' || c.vm === 'incl' ? ' · 부가세 포함' : '') + '</div>' +
    '<table><thead><tr><th style="width:34px">No</th><th>품명 · 규격</th><th style="width:56px">수량</th><th style="width:44px">단위</th><th style="width:90px">단가</th><th style="width:100px">금액</th></tr></thead><tbody>' + (body || '<tr><td colspan="6" style="text-align:center;color:#888">항목이 없습니다</td></tr>') +
      extra.map(([k, v]) => '<tr><td colspan="5" class="num"' + (k === '합계' ? ' style="font-weight:700"' : '') + '>' + k + '</td><td class="num"' + (k === '합계' ? ' style="font-weight:700"' : '') + '>' + v + '</td></tr>').join('') +
    '</tbody></table>' +
    payHtml(c.total) +
    (memo ? '<div class="memo"><b>특이사항</b>\\n' + esc(memo) + '</div>' : '') +
    '<div class="foot">jibcalc.com 견적서 작성기로 만들었습니다</div>';
}

function payHtml(total){
  if (!$('usePay').checked) return '';
  const pp = payPlan(total);
  if (!pp.rows.length) return '';
  return '<table style="margin-top:14px"><thead><tr><th>대금 지급</th><th style="width:60px">비율</th><th style="width:110px">금액</th><th>지급 시기 · 조건</th></tr></thead><tbody>' +
    pp.rows.map(r => '<tr><td>' + esc(r.n) + '</td><td class="num">' + r.pct + '%</td><td class="num">' + won(r.amt) + '</td><td>' + esc(r.c) + '</td></tr>').join('') + '</tbody></table>';
}

function tsv(){
  const c = compute();
  const lines = [['공종', '품명·규격', '수량', '단위', '단가', '금액', '구분'].join('\\t')];
  c.items.filter(i => i.name || i.amount).forEach(i => lines.push([i.cat, i.name, i.qty, i.unit, i.price, i.amount || '', i.kind].map(x => String(x).replace(/[\\t\\n]/g, ' ')).join('\\t')));
  if (c.misc) lines.push(['', '공과잡비·관리비 ' + c.miscPct + '%', '', '', '', c.misc, ''].join('\\t'));
  if (c.disc) lines.push(['', '할인', '', '', '', -c.disc, ''].join('\\t'));
  if (c.cutAmt) lines.push(['', '끝자리 정리', '', '', '', -c.cutAmt, ''].join('\\t'));
  lines.push(['', '공급가액', '', '', '', c.supply, ''].join('\\t'));
  lines.push(['', '부가세', '', '', '', c.tax, ''].join('\\t'));
  lines.push(['', '합계', '', '', '', c.total, ''].join('\\t'));
  if ($('usePay').checked) payPlan(c.total).rows.forEach(r => lines.push(['대금', r.n, r.pct + '%', '', '', r.amt, r.c].map(x => String(x).replace(/[\\t\\n]/g, ' ')).join('\\t')));
  return lines.join('\\n');
}
function flash(msg){
  let t = document.querySelector('.est-toast');
  if (!t) { t = document.createElement('div'); t.className = 'est-toast'; t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--card);color:var(--ink);border:1px solid var(--line);padding:10px 16px;border-radius:12px;z-index:60;font-size:.9rem'; document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, 2200);
}

const TEMPLATES = ${JSON.stringify(Object.fromEntries(Object.entries(TEMPLATES).map(([k, t]) => [k, t.items])))};
$('tplBtn').addEventListener('click', () => {
  const list = TEMPLATES[$('tpl').value] || [];
  // 비어 있는 첫 줄은 지우고 넣기
  readItems().forEach(i => { if (!i.name && !i.qty && !i.price) i.el.remove(); });
  let first = null;
  list.forEach(([cat, name, unit, kind]) => { const el = addItem({ cat, name, unit, kind }); first = first || el; });
  calc();
  if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
  flash($('tpl').selectedOptions[0].textContent + ' 항목 ' + list.length + '개를 넣었어요. 수량과 단가를 채워 주세요');
});

// 여러 견적서 저장·불러오기
const SKEY = 'jibcalc-estimates-v1';
const readSaved = () => { try { return JSON.parse(store.getItem(SKEY)) || {}; } catch (e) { return {}; } };
function refreshSaved(sel){
  const all = readSaved();
  const names = Object.keys(all).sort((a, b) => (all[b].t || 0) - (all[a].t || 0));
  $('savedList').innerHTML = names.length
    ? names.map(n => '<option value="' + esc(n) + '">' + esc(n) + ' (' + new Date(all[n].t).toLocaleDateString('ko-KR') + ')</option>').join('')
    : '<option value="">저장한 견적서가 없어요</option>';
  if (sel && all[sel]) $('savedList').value = sel;
}
function current(){
  const d = { f: {}, items: readItems().map(({ el, amount, ...rest }) => rest), pay: { on: $('usePay').checked, rows: readPays() } };
  FIELDS.forEach(id => d.f[id] = $(id).value);
  return d;
}
const PAY_DEFAULT = [{ n: '계약금', p: 10, c: '계약할 때' }, { n: '중도금', p: 50, c: '철거·자재 입고 후' }, { n: '잔금', p: 40, c: '공사 완료·검수 후' }];
function setPays(pay){
  $('pays').innerHTML = '';
  $('usePay').checked = !!(pay && pay.on);
  ((pay && pay.rows && pay.rows.length) ? pay.rows : PAY_DEFAULT).forEach(addPay);
}
function apply(d){
  $('items').innerHTML = '';
  FIELDS.forEach(id => { if (d.f && d.f[id] != null) $(id).value = d.f[id]; });
  (d.items || []).forEach(v => addItem(v));
  setPays(d.pay);
  calc();
}
$('saveBtn').addEventListener('click', () => {
  if (!store) return flash('이 브라우저에서는 저장할 수 없어요');
  const name = ($('saveName').value.trim() || $('site').value.trim() || $('cuName').value.trim() || ('견적서 ' + $('edate').value)).slice(0, 40);
  const all = readSaved();
  if (!all[name] && Object.keys(all).length >= 30) return flash('저장은 30개까지예요. 안 쓰는 견적서를 지워 주세요');
  all[name] = { t: Date.now(), d: current() };
  try { store.setItem(SKEY, JSON.stringify(all)); } catch (e) { return flash('저장 공간이 부족해요'); }
  refreshSaved(name); $('saveName').value = name;
  flash('‘' + name + '’으로 저장했어요');
});
$('loadBtn').addEventListener('click', () => {
  const n = $('savedList').value, all = readSaved();
  if (!n || !all[n]) return flash('불러올 견적서를 골라 주세요');
  apply(all[n].d); $('saveName').value = n;
  flash('‘' + n + '’을 불러왔어요');
});
$('delBtn').addEventListener('click', () => {
  const n = $('savedList').value, all = readSaved();
  if (!n || !all[n]) return flash('지울 견적서를 골라 주세요');
  if ($('delBtn').dataset.confirm !== n) { $('delBtn').dataset.confirm = n; $('delBtn').textContent = '한 번 더 누르면 삭제'; setTimeout(() => { $('delBtn').dataset.confirm = ''; $('delBtn').textContent = '삭제'; }, 3000); return; }
  delete all[n];
  try { store.setItem(SKEY, JSON.stringify(all)); } catch (e) {}
  $('delBtn').dataset.confirm = ''; $('delBtn').textContent = '삭제';
  refreshSaved(); flash('‘' + n + '’을 지웠어요');
});
$('newBtn').addEventListener('click', () => {
  $('items').innerHTML = '';
  ['cuName', 'site', 'memo', 'saveName'].forEach(id => $(id).value = '');
  ['misc', 'disc'].forEach(id => $(id).value = '0'); $('cut').value = '0';
  setPays({ on: $('usePay').checked }); addItem(); calc();
  flash('새 견적서를 시작해요. 업체 정보는 그대로 두었어요');
});

$('addItem').addEventListener('click', () => { addItem(); calc(); });
$('addPay').addEventListener('click', () => { addPay(); calc(); });
$('viewBtn').addEventListener('click', () => { $('sheet').innerHTML = sheetHtml(); $('sheetWrap').hidden = false; document.body.style.overflow = 'hidden'; });
$('closeBtn').addEventListener('click', () => { $('sheetWrap').hidden = true; document.body.style.overflow = ''; });
$('printBtn').addEventListener('click', () => window.print());
$('tsvBtn').addEventListener('click', () => {
  const text = tsv();
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
    () => flash('표를 복사했어요. 엑셀이나 구글 시트에 붙여 넣으세요'),
    () => flash('복사하지 못했어요. 견적서 보기에서 PDF로 저장해 주세요'));
});
// '입력 초기화'를 누르면 견적서 저장분도 지움 (common.js 버튼)
document.addEventListener('click', e => { const b = e.target.closest('[data-a="reset"]'); if (b && store) { try { store.removeItem(KEY); } catch (err) {} } }, true);
document.addEventListener('input', calc);
document.addEventListener('change', calc);

let usedExamples = false;
if (!load()) {
  usedExamples = true;
  setPays(null);
  addItem({ cat: '철거', name: '욕실 벽·바닥 타일 철거', qty: 1, unit: '식', price: 500000, kind: '인건비' });
  addItem({ cat: '타일', name: '벽 타일 300×600', qty: 12, unit: '박스', price: 28000, kind: '자재비' });
  addItem({ cat: '타일', name: '타일 시공', qty: 2, unit: '품', price: 300000, kind: '인건비' });
}
if (!$('edate').value) { const t = new Date(); $('edate').value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
// 자재 목록에서 '견적서로 모두 보내기'로 넘어온 항목
function importInbox(){
  if (!store) return;
  let list = null;
  try { list = JSON.parse(store.getItem('jibcalc-estimate-inbox')); store.removeItem('jibcalc-estimate-inbox'); } catch (e) {}
  if (!Array.isArray(list) || !list.length) return;
  // 처음 보이던 예시 줄은 지우고, 빈 줄도 정리
  if (usedExamples) $('items').innerHTML = '';
  readItems().forEach(i => { if (!i.name && !i.qty && !i.price) i.el.remove(); });
  let first = null;
  list.slice(0, 60).forEach(v => { const el = addItem({ cat: String(v.cat || '').slice(0, 20), name: String(v.name || '').slice(0, 60), qty: +v.qty || '', unit: String(v.unit || '').slice(0, 10), kind: '자재비' }, true); first = first || el; });
  setTimeout(() => { if (first) first.scrollIntoView({ block: 'center' }); flash('자재 ' + list.length + '개를 넣었어요. 단가를 채워 주세요'); }, 250);
}

// 견적서를 이미지로 그려서 공유(휴대폰) 또는 저장
async function sheetImage(){
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const c = compute();
  const rows = c.items.filter(i => i.name || i.amount);
  const W = 1080, P = 64, font = getComputedStyle(document.body).fontFamily;
  const cv = document.createElement('canvas'), x = cv.getContext('2d');
  const F = (w, sz) => w + ' ' + sz + 'px ' + font;
  const fit = (t, maxW, sz, w) => { x.font = F(w || 400, sz); let s = String(t); while (s.length > 1 && x.measureText(s).width > maxW) s = s.slice(0, -1); return s === String(t) ? s : s.slice(0, -1) + '…'; };
  const pay = $('usePay').checked ? payPlan(c.total).rows : [];
  const memo = $('memo').value.trim();
  const memoLines = memo ? memo.split('\\n').slice(0, 8) : [];
  const H = 380 + rows.length * 46 + Object.keys(c.byCat).length * 40 + 6 * 44 + (pay.length ? 70 + pay.length * 42 : 0) + (memoLines.length ? 60 + memoLines.length * 34 : 0) + 120;
  cv.width = W; cv.height = H;
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#ffc400'; x.fillRect(0, 0, W, 14);
  const br = brand();
  const loadImg = src => new Promise(r => { if (!src) return r(null); const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; });
  const [logoImg, sealImg] = await Promise.all([loadImg(br.logo), loadImg(br.seal)]);
  if (logoImg) { const h = 64, w = Math.min(220, logoImg.width * h / logoImg.height); x.drawImage(logoImg, P, 34, w, w * logoImg.height / logoImg.width); }
  x.fillStyle = '#111'; x.textAlign = 'center'; x.font = F(700, 46); x.fillText('견 적 서', W / 2, 96);
  x.textAlign = 'left'; x.font = F(400, 26);
  let y = 150;
  const d = $('edate').value ? new Date($('edate').value + 'T00:00:00') : new Date();
  const fd = t => t.getFullYear() + '. ' + (t.getMonth() + 1) + '. ' + t.getDate() + '.';
  const vd = parseInt($('valid').value, 10);
  const left = [($('cuName').value ? $('cuName').value + ' 귀하' : ''), ($('site').value ? '현장: ' + $('site').value : ''), '견적일: ' + fd(d) + (vd > 0 ? ' (유효 ' + vd + '일)' : '')].filter(Boolean);
  const right = [$('coName').value, $('coTel').value].filter(Boolean);
  left.forEach((t, i) => { const w = i === 0 && $('cuName').value ? 700 : 400; x.fillText(fit(t, 560, 26, w), P, y + i * 36); });
  x.textAlign = 'right'; right.forEach((t, i) => { x.font = F(i === 0 ? 700 : 400, 26); x.fillText(fit(t, 380, 26, i === 0 ? 700 : 400), W - P - (sealImg ? 92 : 0), y + i * 36); }); x.textAlign = 'left';
  if (sealImg) { x.globalAlpha = 0.92; x.drawImage(sealImg, W - P - 80, y - 54, 80, 80); x.globalAlpha = 1; }
  y += Math.max(left.length, right.length) * 36 + 20;
  x.strokeStyle = '#111'; x.lineWidth = 3; x.strokeRect(P, y, W - P * 2, 70);
  x.font = F(700, 28); x.fillText(fit('합계  일금 ' + hangul(c.total) + '원정  (₩' + won(c.total) + ')', W - P * 2 - 40, 28, 700), P + 20, y + 46);
  y += 100;
  const cols = [P, P + 470, P + 600, P + 780, W - P];
  x.fillStyle = '#f1f1f1'; x.fillRect(P, y, W - P * 2, 44); x.fillStyle = '#111'; x.font = F(700, 23);
  x.fillText('품명 · 규격', cols[0] + 12, y + 30); x.textAlign = 'right'; x.fillText('수량', cols[2] - 12, y + 30); x.fillText('단가', cols[3] - 12, y + 30); x.fillText('금액', cols[4] - 12, y + 30); x.textAlign = 'left';
  y += 44;
  let last = null;
  x.lineWidth = 1; x.strokeStyle = '#ccc';
  rows.forEach(i => {
    const cat = i.cat || '기타';
    if (cat !== last) { x.fillStyle = '#fafafa'; x.fillRect(P, y, W - P * 2, 40); x.fillStyle = '#111'; x.font = F(700, 22); x.fillText(cat, cols[0] + 12, y + 28); x.textAlign = 'right'; x.fillText('소계 ' + won(c.byCat[cat] || 0), cols[4] - 12, y + 28); x.textAlign = 'left'; y += 40; last = cat; }
    x.font = F(400, 23); x.fillStyle = '#111';
    x.fillText(fit(i.name, cols[1] - cols[0] + 110, 23), cols[0] + 12, y + 31);
    x.textAlign = 'right';
    x.fillText((i.qty || '') + (i.unit ? ' ' + i.unit : ''), cols[2] - 12, y + 31);
    x.fillText(i.price !== '' ? won(+i.price) : '', cols[3] - 12, y + 31);
    x.fillText(i.amount ? won(i.amount) : '', cols[4] - 12, y + 31);
    x.textAlign = 'left';
    x.beginPath(); x.moveTo(P, y + 46); x.lineTo(W - P, y + 46); x.stroke();
    y += 46;
  });
  const extra = [];
  if (c.misc) extra.push(['공과잡비·관리비 (' + c.miscPct + '%)', won(c.misc)]);
  if (c.disc) extra.push(['할인', '−' + won(c.disc)]);
  if (c.cutAmt) extra.push(['끝자리 정리', '−' + won(c.cutAmt)]);
  extra.push(['공급가액', won(c.supply)]);
  if (c.vm !== 'none') extra.push(['부가세 (10%)', won(c.tax)]);
  extra.push(['합계', won(c.total)]);
  y += 10;
  extra.forEach(([k, v]) => { const b = k === '합계'; x.font = F(b ? 700 : 400, b ? 27 : 24); x.textAlign = 'right'; x.fillText(k, cols[3] - 12, y + 30); x.fillText(v, cols[4] - 12, y + 30); x.textAlign = 'left'; y += 44; });
  if (pay.length) {
    y += 20; x.font = F(700, 24); x.fillText('대금 지급', P, y + 28); y += 46;
    pay.forEach(r => { x.font = F(400, 23); x.fillText(fit(r.n + ' ' + r.pct + '%  ' + (r.c || ''), 640, 23), P + 12, y + 28); x.textAlign = 'right'; x.fillText(won(r.amt) + '원', W - P - 12, y + 28); x.textAlign = 'left'; y += 42; });
  }
  if (memoLines.length) {
    y += 24; x.font = F(700, 24); x.fillText('특이사항', P, y + 26); y += 40;
    x.font = F(400, 22); memoLines.forEach(l => { x.fillText(fit(l, W - P * 2 - 20, 22), P + 12, y + 26); y += 34; });
  }
  y += 50;
  x.fillStyle = '#777'; x.font = F(400, 20); x.textAlign = 'right'; x.fillText('jibcalc.com 견적서 작성기', W - P, y);
  // 남는 아래 여백 잘라 내기
  const out = document.createElement('canvas'); out.width = W; out.height = Math.min(H, y + 40);
  out.getContext('2d').drawImage(cv, 0, 0);
  const blob = await new Promise(r => out.toBlob(r, 'image/png'));
  const name = '견적서' + ($('site').value ? '_' + $('site').value.replace(/[\\\\/:*?"<>|\\s]+/g, '_').slice(0, 20) : '') + '.png';
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: '견적서' }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  flash('견적서 이미지를 저장했어요');
}
['imgBtn', 'imgBtn2'].forEach(id => $(id).addEventListener('click', () => sheetImage().catch(() => flash('이미지를 만들지 못했어요. PDF 저장을 이용해 주세요'))));

showBrand();
refreshSaved();
importFromUrl();
importInbox();
calc();
</script>
<script src="/common.js"></script>
</body>
</html>
`;

kit.write('estimate/index.html', html);
console.log('생성 완료: /estimate/');
