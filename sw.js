// 집 공사 계산기 서비스 워커 — 신호가 약한 현장에서도 열리게 함
// 페이지(HTML)는 인터넷이 되면 항상 새로 받고(안 되면 저장본), 그 밖의 파일은 저장본을 먼저 쓰고 뒤에서 새로 받음
const CACHE = 'jibcalc-de26d355d02811b2';
const PRECACHE = ['/', '/common.css?v=de26d355', '/common.js?v=d02811b2', '/favicon.svg', '/img/logo-mark.svg',
  '/tile/', '/wallpaper/', '/paint/', '/floor/', '/insulation/', '/pyeong/', '/area/', '/room/', '/measure/',
  '/estimate/', '/labor/', '/vat/', '/moving/', '/order/', '/schedule/', '/waste/', '/404.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // 광고·글꼴 등 외부 요청은 건드리지 않음
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)); }
        return res;
      }).catch(() => caches.match(url.pathname).then((r) => r || caches.match('/404.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
