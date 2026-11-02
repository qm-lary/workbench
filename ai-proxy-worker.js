/**
 * 会火工作台 · hello AI 中转（Cloudflare Worker）
 *
 * 用途：有些模型服务（智谱、OpenAI 等）不让浏览器直接调，会因为没有跨域头被拦。
 * 这个 Worker 只做一件事：把页面发来的请求原样转给上游，再补上跨域头。
 * 免费额度 10 万次/天，够个人用。
 *
 * 部署（5 分钟）：
 * 1. 打开 https://dash.cloudflare.com → Workers & Pages → Create → Worker，把本文件内容粘进去，Deploy。
 * 2. 在 Worker 的 Settings → Variables 里加：
 *      UPSTREAM = 上游地址，例如 https://open.bigmodel.cn/api/paas/v4
 *                 （注意：不要带 /chat/completions，末尾不要斜杠）
 *      ALLOW_ORIGIN = 你的工作台地址，例如 https://你的用户名.github.io
 *                     自用图省事可以填 *
 *      API_KEY = 可选。填了就把 key 放在 Worker 上，页面里的 Key 留空即可，
 *                这样 key 不会出现在浏览器里（更安全）。不填则用页面传来的 Key。
 * 3. 复制 Worker 的地址（形如 https://xxx.workers.dev），
 *    在工作台「hello AI → 连接设置 → 接口地址」里填它，模型名照上游文档填。
 *
 * 安全提醒：
 * - 不要把 API_KEY 写进代码里再公开仓库，用 Variables。
 * - ALLOW_ORIGIN 别长期留 *，至少有 key 的时候要收紧到你自己的域名。
 * - 这个代理只管大模型对话，别拿它转发别的东西。
 */

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Max-Age': '86400'
    };

    const reply = (obj, status) =>
      new Response(JSON.stringify(obj), {
        status: status || 200,
        headers: { ...cors, 'content-type': 'application/json; charset=utf-8' }
      });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ error: 'only POST' }, 405);

    const upstream = (env.UPSTREAM || '').replace(/\/+$/, '');
    if (!upstream) return reply({ error: 'UPSTREAM 没配' }, 500);

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '') || 'chat/completions';
    const auth = request.headers.get('authorization') || (env.API_KEY ? 'Bearer ' + env.API_KEY : '');
    const body = await request.text();

    let res;
    try {
      res = await fetch(upstream + '/' + path + url.search, {
        method: 'POST',
        headers: Object.assign(
          { 'content-type': 'application/json' },
          auth ? { authorization: auth } : {}
        ),
        body
      });
    } catch (e) {
      return reply({ error: '上游连不上：' + (e && e.message ? e.message : e) }, 502);
    }

    const out = new Response(res.body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'text/event-stream' } });
    Object.keys(cors).forEach((k) => out.headers.set(k, cors[k]));
    return out;
  }
};
