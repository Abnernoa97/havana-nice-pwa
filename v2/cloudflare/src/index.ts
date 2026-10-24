export interface Env {
  HAVANA_ENV: string;
}

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers || {}),
    },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({
        ok: true,
        app: 'havana-nice-v2',
        environment: env.HAVANA_ENV || 'development',
        architecture: 'cloudflare-first',
      });
    }

    return json({ error: 'Not found' }, { status: 404 });
  },
};
