import { useEffect, useRef, useState } from 'react';
import {
  fetchBackendHealth, getChatMessages, messageDeliveryLabel, newClientMessageId,
  openChatSocket, reconcileChatMessages, startLabChatSession,
  type BackendHealth, type ChatMessage, type ChatServerEvent, type ChatSession,
} from '@havana/shared';

export default function App() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [name, setName] = useState('iPhone');
  const [code, setCode] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [connection, setConnection] = useState('desconectado');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const activeSession = useRef<ChatSession | null>(null);
  const outbox = useRef<Map<string, ChatMessage>>(new Map());
  const ackTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const disposed = useRef(false);
  const bottom = useRef<HTMLDivElement | null>(null);
  const connectLatest = useRef<(next: ChatSession) => void>(() => {});
  const refreshLatest = useRef<() => void>(() => {});

  function clearAck(id: string) {
    const t = ackTimers.current.get(id);
    if (t) clearTimeout(t);
    ackTimers.current.delete(id);
  }
  function markOutgoing(id: string, state: 'queued' | 'sending' | 'error') {
    const original = outbox.current.get(id);
    if (!original) return;
    outbox.current.set(id, { ...original, deliveryStatus: state, failed: state === 'error' });
    setMessages(before => before.map(m =>
      m.clientMessageId === id && m.senderId === original.senderId && m.pending
        ? { ...m, deliveryStatus: state, failed: state === 'error' } : m
    ));
  }
  function confirm(message: ChatMessage) {
    if (!message.pending && message.senderId === activeSession.current?.actorId) {
      outbox.current.delete(message.clientMessageId);
      clearAck(message.clientMessageId);
    }
  }
  function pausePending() {
    for (const timer of ackTimers.current.values()) clearTimeout(timer);
    ackTimers.current.clear();
    for (const id of outbox.current.keys()) markOutgoing(id, 'queued');
  }
  function clearRetry() {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
  }
  function flushOutbox() {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const batch = [...outbox.current.values()].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    // Send one at a time to preserve creation order even with slow D1 ACKs.
    if (batch.some(item => item.deliveryStatus === 'sending')) return;
    const item = batch[0];
    if (!item || item.deliveryStatus !== 'queued') return;
    {
      try {
        ws.send(JSON.stringify({ type: 'chat.send', clientMessageId: item.clientMessageId, text: item.text }));
        markOutgoing(item.clientMessageId, 'sending');
        clearAck(item.clientMessageId);
        ackTimers.current.set(item.clientMessageId, setTimeout(() => {
          ackTimers.current.delete(item.clientMessageId);
          markOutgoing(item.clientMessageId, 'error');
        }, 12000));
      } catch {
        markOutgoing(item.clientMessageId, 'error');
      }
    }
  }
  function refresh(next: ChatSession) {
    void getChatMessages(next).then(history => {
      if (disposed.current || activeSession.current?.actorId !== next.actorId) return;
      history.forEach(confirm);
      setMessages(before => reconcileChatMessages(before, history));
      flushOutbox();
    }).catch(e => {
      if (!disposed.current) setError(e instanceof Error ? e.message : 'Error al sincronizar');
      flushOutbox();
    });
  }
  function reconnect(next: ChatSession) {
    if (disposed.current) return;
    if (Date.parse(next.expiresAt) <= Date.now()) {
      clearRetry();
      const old = socket.current;
      socket.current = null;
      old?.close();
      activeSession.current = null;
      setSession(null);
      setConnection('desconectado');
      setError('Sesión caducada. Vuelve a entrar al laboratorio.');
      return;
    }
    activeSession.current = next;
    clearRetry();
    const old = socket.current;
    if (old) pausePending();
    socket.current = null;
    old?.close();
    setConnection('conectando…');
    const ws = openChatSocket(next);
    socket.current = ws;
    function retry() {
      if (disposed.current || socket.current !== ws || retryTimer.current ||
          document.visibilityState !== 'visible' || !navigator.onLine) return;
      pausePending();
      retryCount.current++;
      const delay = Math.min(20000, 1000 * 2 ** Math.min(5, retryCount.current - 1));
      setConnection('reconectando…');
      retryTimer.current = setTimeout(() => {
        retryTimer.current = null;
        if (activeSession.current && document.visibilityState === 'visible') {
          connectLatest.current(activeSession.current);
        }
      }, delay);
    }
    ws.onopen = () => {
      if (disposed.current || socket.current !== ws) return;
      retryCount.current = 0;
      clearRetry();
      setConnection('en vivo');
      setError('');
      refresh(next);
    };
    ws.onmessage = event => {
      if (disposed.current || socket.current !== ws) return;
      try {
        const value = JSON.parse(String(event.data)) as ChatServerEvent;
        if (value.type === 'chat.message') {
          confirm(value.message);
          setMessages(before => reconcileChatMessages(before, [value.message]));
          flushOutbox();
        } else if (value.type === 'chat.error') {
          setError(value.error);
        }
      } catch {
        setError('Evento inválido');
      }
    };
    ws.onclose = () => {
      if (disposed.current || socket.current !== ws) return;
      pausePending();
      setConnection('desconectado');
      retry();
    };
    ws.onerror = () => {
      if (disposed.current || socket.current !== ws) return;
      setConnection('sin conexión');
      retry();
    };
  }
  connectLatest.current = reconnect;
  refreshLatest.current = () => { if (activeSession.current) refresh(activeSession.current); };

  useEffect(() => {
    disposed.current = false;
    void fetchBackendHealth().then(data => {
      if (!disposed.current) setHealth(data);
    }).catch(() => { if (!disposed.current) setError('No se pudo conectar a la API'); });
    const resume = () => {
      const next = activeSession.current;
      if (!next || document.visibilityState !== 'visible') return;
      if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
        connectLatest.current(next);
      } else {
        refreshLatest.current();
      }
    };
    const offline = () => {
      pausePending();
      setConnection('sin conexión');
      clearRetry();
      const old = socket.current;
      socket.current = null;
      old?.close();
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', offline);
    return () => {
      disposed.current = true;
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', offline);
      clearRetry();
      for (const timer of ackTimers.current.values()) clearTimeout(timer);
      ackTimers.current.clear();
      socket.current?.close();
      socket.current = null;
    };
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length]);

  async function join() {
    if (!name.trim() || !code.trim() || joining) return;
    setJoining(true);
    setError('');
    try {
      const next = await startLabChatSession(name.trim(), code.trim());
      setCode('');
      setMessages([]);
      outbox.current.clear();
      setSession(next);
      activeSession.current = next;
      retryCount.current = 0;
      reconnect(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar');
    } finally {
      setJoining(false);
    }
  }
  function send() {
    const text = draft.trim();
    if (!session || !text) return;
    if (outbox.current.size >= 100) {
      setError('La cola está llena. Reintenta cuando tengas conexión.');
      return;
    }
    const clientMessageId = newClientMessageId();
    const message: ChatMessage = {
      seq: 0, clientMessageId, senderId: session.actorId, senderName: session.displayName,
      text, sentAt: new Date().toISOString(), pending: true, deliveryStatus: 'queued',
    };
    outbox.current.set(clientMessageId, message);
    setMessages(before => reconcileChatMessages(before, [message]));
    setDraft('');
    flushOutbox();
  }
  function retryMessage(id: string) {
    if (!outbox.current.has(id)) return;
    clearAck(id);
    markOutgoing(id, 'queued');
    flushOutbox();
  }

  return (
    <main className="chat-app">
      <header className="chat-header">
        <div>
          <span className="brand">HAVANA NICE</span>
          <h1>Chat <span>V2</span></h1>
        </div>
        <div className="header-status">
          <span className={connection === 'en vivo' ? 'online-dot' : 'offline-dot'} />
          {session ? connection : health?.ok ? 'API conectada' : 'Laboratorio'}
        </div>
      </header>

      {!session ? (
        <section className="join-panel">
          <span className="overline">CHAT 2 · ESTADOS Y RECONEXIÓN</span>
          <h2>Conversemos.</h2>
          <p>Android y iPhone conectados. Acceso privado de laboratorio.</p>
          <form onSubmit={event => { event.preventDefault(); void join(); }}>
            <label htmlFor="chat-name">Tu nombre</label>
            <input id="chat-name" maxLength={28} autoComplete="nickname" value={name} onChange={event => setName(event.target.value)} />
            <label htmlFor="chat-code">Clave de laboratorio</label>
            <input id="chat-code" type="password" autoComplete="off" value={code} onChange={event => setCode(event.target.value)} placeholder="Clave privada" />
            <button disabled={joining || !name.trim() || !code.trim()}>{joining ? 'Conectando…' : 'Entrar al chat'}</button>
          </form>
          {error && <p className="chat-error" role="alert">{error}</p>}
          <small>FASE 0 ✓ · {health?.database === 'ok' ? 'D1 conectado' : 'Comprobando conexión'}</small>
        </section>
      ) : (
        <>
          <div className="room-title">
            <span>Conversación de laboratorio</span>
            <span className="room-user">{session.displayName}</span>
          </div>
          <section className="chat-messages" aria-label="Mensajes">
            {messages.length === 0 && <p className="empty-chat">¡Hola! Escribe el primer mensaje.</p>}
            {messages.map(message => {
              const mine = message.senderId === session.actorId;
              return <article className={mine ? 'bubble mine' : 'bubble theirs'} key={message.senderId + ':' + message.clientMessageId}>
                {!mine && <span className="sender">{message.senderName}</span>}
                <div>{message.text}</div>
                <span className="message-meta">
                  {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {mine ? ' · ' + messageDeliveryLabel(message) : ''}
                </span>
                {mine && message.pending && message.deliveryStatus === 'error' && (
                  <button type="button" className="retry-message" onClick={() => retryMessage(message.clientMessageId)}>
                    Reintentar envío
                  </button>
                )}
              </article>;
            })}
            <div ref={bottom} />
          </section>
          {error && <div className="inline-error" role="alert">{error}</div>}
          {connection !== 'en vivo' && <button className="reconnect" onClick={() => reconnect(session)}>Reintentar conexión</button>}
          <form className="chat-composer" onSubmit={event => { event.preventDefault(); send(); }}>
            <input aria-label="Escribir mensaje" value={draft} maxLength={2000} onChange={event => setDraft(event.target.value)} placeholder={connection === 'en vivo' ? 'Escribe un mensaje…' : 'Sin conexión: se enviará después…'} />
            <button aria-label="Enviar" disabled={!draft.trim()} type="submit">Enviar</button>
          </form>
        </>
      )}
    </main>
  );
}
