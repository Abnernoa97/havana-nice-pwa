import { useEffect, useRef, useState } from 'react';
import {
  fetchBackendHealth, getChatMessages, newClientMessageId, openChatSocket,
  reconcileChatMessages, startLabChatSession,
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
  const bottom = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void fetchBackendHealth().then(setHealth).catch(() => setError('No se pudo conectar a la API'));
    return () => socket.current?.close();
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length]);

  function connect(next: ChatSession) {
    socket.current?.close();
    setConnection('conectando…');
    const ws = openChatSocket(next);
    socket.current = ws;
    ws.onopen = () => {
      setConnection('en vivo');
      setError('');
      void getChatMessages(next).then(history => {
        setMessages(old => reconcileChatMessages(old, history));
      }).catch(e => setError(String(e instanceof Error ? e.message : e)));
    };
    ws.onmessage = event => {
      try {
        const value = JSON.parse(String(event.data)) as ChatServerEvent;
        if (value.type === 'chat.message') {
          setMessages(old => reconcileChatMessages(old, [value.message]));
        } else if (value.type === 'chat.error') {
          setError(value.error);
        }
      } catch { setError('Evento de chat inválido'); }
    };
    ws.onclose = () => setConnection('desconectado');
    ws.onerror = () => setConnection('error de conexión');
  }

  async function join() {
    if (!name.trim() || !code.trim() || joining) return;
    setJoining(true);
    setError('');
    try {
      const next = await startLabChatSession(name.trim(), code.trim());
      setCode('');
      setMessages([]);
      setSession(next);
      connect(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar');
    } finally { setJoining(false); }
  }

  function send() {
    const text = draft.trim();
    if (!session || !text || !socket.current || socket.current.readyState !== WebSocket.OPEN) return;
    const clientMessageId = newClientMessageId();
    setMessages(old => reconcileChatMessages(old, [{
      seq: 0, clientMessageId, senderId: session.actorId, senderName: session.displayName,
      text, sentAt: new Date().toISOString(), pending: true,
    }]));
    socket.current.send(JSON.stringify({ type: 'chat.send', clientMessageId, text }));
    setDraft('');
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
          <span className="overline">CHAT 1 · TEXTO EN TIEMPO REAL</span>
          <h2>Conversemos.</h2>
          <p>Una sola conversación para Android y iPhone. Acceso privado de laboratorio.</p>
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
            {messages.length === 0 && <p className="empty-chat">¡Hola! Escribe el primer mensaje. Aparecerá en ambos dispositivos.</p>}
            {messages.map(message => {
              const mine = message.senderId === session.actorId;
              return <article className={mine ? 'bubble mine' : 'bubble theirs'} key={message.senderId + ':' + message.clientMessageId}>
                {!mine && <span className="sender">{message.senderName}</span>}
                <div>{message.text}</div>
                <span className="message-meta">
                  {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.pending ? ' · enviando' : ''}
                </span>
              </article>;
            })}
            <div ref={bottom} />
          </section>
          {error && <div className="inline-error" role="alert">{error}</div>}
          {connection !== 'en vivo' && <button className="reconnect" onClick={() => connect(session)}>Reconectar al chat</button>}
          <form className="chat-composer" onSubmit={event => { event.preventDefault(); send(); }}>
            <input aria-label="Escribir mensaje" value={draft} maxLength={2000} onChange={event => setDraft(event.target.value)} placeholder="Escribe un mensaje…" />
            <button aria-label="Enviar" disabled={!draft.trim() || connection !== 'en vivo'} type="submit">Enviar</button>
          </form>
        </>
      )}
    </main>
  );
}
