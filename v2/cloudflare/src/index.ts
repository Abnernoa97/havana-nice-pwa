export interface Env {
  HAVANA_ENV: string;
  DB: D1Database;
  CHAT_ROOMS: DurableObjectNamespace;
}

export class ChatRoom {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({
        ok: true,
        durableObject: 'ChatRoom',
        environment: this.env.HAVANA_ENV || 'development',
      });
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return Response.json(
        { error: 'WebSocket upgrade required' },
        { status: 426 },
      );
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    server.addEventListener('message', (event) => {
      server.send(JSON.stringify({
        type: 'echo',
        data: event.data,
        at: new Date().toISOString(),
      }));
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      let schemaVersion: string | null = null;
      let database = 'error';

      try {
        const row = await env.DB
          .prepare('SELECT value FROM system_meta WHERE key = ?')
          .bind('schema_version')
          .first<{ value: string }>();
        schemaVersion = row?.value ?? null;
        database = 'ok';
      } catch {
        database = 'error';
      }

      return json({
        ok: database === 'ok',
        app: 'havana-nice-v2',
        environment: env.HAVANA_ENV || 'development',
        database,
        schemaVersion,
        realtime: 'configured',
        media: 'pending-r2-enable',
      }, database === 'ok' ? 200 : 503);
    }

    if (url.pathname === '/realtime/health') {
      const id = env.CHAT_ROOMS.idFromName('foundation-health');
      const stub = env.CHAT_ROOMS.get(id);
      return stub.fetch('https://internal/health');
    }

    if (url.pathname === '/ws') {
      const id = env.CHAT_ROOMS.idFromName('main-chat');
      const stub = env.CHAT_ROOMS.get(id);
      return stub.fetch(request);
    }

    return json({ error: 'Not found' }, 404);
  },
};
