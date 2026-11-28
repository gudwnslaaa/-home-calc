# 계산기별 링크 미리보기 그림(1200×630) 만들기: python3 tools/make-og.py
# 실행에는 playwright(chromium)가 필요. 결과: img/og/<key>.jpg
import json, subprocess, os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
data = json.loads(subprocess.check_output(['node', '-e', "const k=require('./tools/site-kit');console.log(JSON.stringify({tools:k.TOOLS,icons:k.ICONS}))"], cwd=ROOT))
from playwright.sync_api import sync_playwright
from PIL import Image
out = ROOT / 'img' / 'og'; out.mkdir(parents=True, exist_ok=True)
TPL = '''<html><head><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;700&display=swap" rel="stylesheet"><style>
body{margin:0;width:1200px;height:630px;background:#1c2024;color:#f2f3ef;font-family:"IBM Plex Sans KR","Apple SD Gothic Neo","Noto Sans KR",sans-serif;position:relative;overflow:hidden}
.tape{position:absolute;left:0;right:0;top:0;height:46px;background-color:#ffc400;
 background-image:repeating-linear-gradient(90deg,#1c2024 0 2px,transparent 2px 100px),repeating-linear-gradient(90deg,#1c2024 0 2px,transparent 2px 20px);
 background-size:100% 30px,100% 14px;background-repeat:no-repeat}
.ico{position:absolute;left:90px;top:150px;width:120px;height:120px;border-radius:24px;background:#ffc400;color:#1c2024;display:flex;align-items:center;justify-content:center}
.ico svg{width:72px;height:72px}
h1{position:absolute;left:90px;top:300px;margin:0;font-size:84px;line-height:1.15;font-weight:700;letter-spacing:-2px;max-width:1040px}
p{position:absolute;left:92px;top:420px;margin:0;font-size:36px;color:#aeb4b9;max-width:1020px}
.brand{position:absolute;left:92px;bottom:56px;font-size:30px;font-weight:700;color:#ffc400}
.free{position:absolute;right:90px;bottom:52px;font-size:28px;color:#1c2024;background:#ffc400;padding:8px 22px;border-radius:12px;font-weight:700}
</style></head><body><div class="tape"></div><div class="ico">{ICON}</div><h1>{NAME}</h1><p>{SUB}</p>
<div class="brand">jibcalc.com · 집 공사 계산기</div><div class="free">무료 · 가입 없음</div></body></html>'''
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630})
    for t in data['tools']:
        name = t['name'].replace(' · ', '·')
        html = TPL.replace('{ICON}', data['icons'].get(t['key'], '')).replace('{NAME}', name).replace('{SUB}', t['sub'])
        pg.set_content(html); pg.wait_for_timeout(600)
        pg.screenshot(path='/tmp/og.png')
        Image.open('/tmp/og.png').convert('RGB').save(out / f"{t['key']}.jpg", quality=86, optimize=True)
        print('만듦', t['key'])
    b.close()
