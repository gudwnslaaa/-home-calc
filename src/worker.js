// www.jibcalc.com 으로 들어온 요청은 같은 경로·쿼리를 유지한 채 https://jibcalc.com 으로 301 이동.
// 그 외 요청은 정적 파일을 그대로 제공.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.jibcalc.com') {
      url.protocol = 'https:';
      url.hostname = 'jibcalc.com';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  }
};
