import { useEffect, useRef, useState } from 'react';
import {
  fetchBackendHealth, getChatSnapshot, getOlderChatMessages, searchChatMessages, lastReadByOther, messageDeliveryLabel, newClientMessageId,
  openChatSocket, reconcileChatMessages, startLabChatSession,
  type BackendHealth, type ChatMessage, type ChatServerEvent, type ChatSession,
  reconcileReactions, reconcileUpdatedMessage, type ChatReaction, type ChatEmoji, type ChatReadReceipt,
} from '@havana/shared';
import { loadLocalChat, saveLocalChat } from './local';

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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [typing, setTyping] = useState('');
  const [receipts, setReceipts] = useState<ChatReadReceipt[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const activeSession = useRef<ChatSession | null>(null);
  const outbox = useRef<Map<string, ChatMessage>>(new Map());
  const ackTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const disposed = useRef(false);
  const bottom = useRef<HTMLDivElement | null>(null);
  const scrollOlderOnce=useRef(false);
  const typingLast = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());
  const latestDraft = useRef('');
  const restoredStorage = useRef(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectLatest = useRef<(next: ChatSession) => void>(() => {});
  const refreshLatest = useRef<() => void>(() => {});

  function persist() {
    if (!restoredStorage.current) return;
    const value = activeSession.current ? {
      session: activeSession.current,
      outbox: [...outbox.current.values()].map(m => ({...m, deliveryStatus:'queued' as const, pending:true})),
      draft: latestDraft.current,
    } : null;
    storageQueue.current = storageQueue.current.catch(() => {}).then(() => saveLocalChat(value)).catch(() => {});
  }
  function sendReadReceipt(seq: number) {
    if (seq > 0 && document.visibilityState === 'visible' && socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({type:'chat.read',seq}));
    }
  }
  async function loadOlder() {
    if (!session || !hasMore || loadingOlder || !messages.length) return;
    const oldest = Math.min(...messages.filter(m=>m.seq>0).map(m=>m.seq));
    if (!Number.isFinite(oldest)) return;
    setLoadingOlder(true);
    scrollOlderOnce.current=true;
    try {
      const data=await getOlderChatMessages(session,oldest);
      setMessages(prev=>reconcileChatMessages(data.messages,prev));
      setHasMore(data.hasMore);
      setReactions(prev=>[...data.reactions.filter(x=>!prev.some(y=>y.messageSeq===x.messageSeq&&y.actorId===x.actorId&&y.emoji===x.emoji)),...prev]);
    } catch(e) { setError(e instanceof Error?e.message:'No se pudo cargar más mensajes'); }
    finally { setLoadingOlder(false); }
  }
  async function runSearch() {
    if(!session || searchQuery.trim().length < 2) {setSearchResults(null);return;}
    setSearching(true);
    try {setSearchResults(await searchChatMessages(session,searchQuery.trim()));}
    catch(e){setError(e instanceof Error?e.message:'Error de búsqueda');}
    finally {setSearching(false);}
  }
  function updateOwn(message: ChatMessage, deleting = false) {
    if(message.senderId!==session?.actorId || message.seq<1 || message.deletedAt || connection!=='en vivo') return;
    if (Date.now()-Date.parse(message.sentAt)>15*60*1000) {setError('Solo puedes editar durante 15 minutos');return;}
    if(!deleting){setEditing(message);setDraft(message.text);setReplyTo(null);return;}
    if(socket.current?.readyState===WebSocket.OPEN)socket.current.send(JSON.stringify({type:'chat.delete',seq:message.seq}));
  }
  function clearAck(id: string) {
    const t = ackTimers.current.get(id);
    if (t) clearTimeout(t);
    ackTimers.current.delete(id);
  }
  function markOutgoing(id: string, state: 'queued' | 'sending' | 'error') {
    const original = outbox.current.get(id);
    if (!original) return;
    outbox.current.set(id, { ...original, deliveryStatus: state, failed: state === 'error' });
    persist();
    setMessages(before => before.map(m =>
      m.clientMessageId === id && m.senderId === original.senderId && m.pending
        ? { ...m, deliveryStatus: state, failed: state === 'error' } : m
    ));
  }
  function confirm(message: ChatMessage) {
    if (!message.pending && message.senderId === activeSession.current?.actorId) {
      outbox.current.delete(message.clientMessageId);
      clearAck(message.clientMessageId);
      persist();
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
        ws.send(JSON.stringify({ type: 'chat.send', clientMessageId: item.clientMessageId, text: item.text, replyToSeq: item.replyToSeq || null }));
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
    void getChatSnapshot(next).then(({messages:history,reactions:reactionHistory,receipts:readHistory,hasMore:more}) => {
      if (disposed.current || activeSession.current?.actorId !== next.actorId) return;
      history.forEach(confirm);
      setReactions(reactionHistory);
      setReceipts(readHistory);
      setHasMore(more);
      setMessages(before => reconcileChatMessages(before, history));
      sendReadReceipt(Math.max(0,...history.map(m=>m.seq)));
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
    persist();
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
        if (value.type === 'chat.ready') {
          setOnlineUsers(value.users?.length || 1);
        } else if (value.type === 'chat.presence') {
          setOnlineUsers(value.users.length);
        } else if (value.type === 'chat.typing') {
          if (value.actorId !== next.actorId) {
            setTyping(value.active ? `${value.senderName} está escribiendo…` : '');
            if (typingTimer.current) clearTimeout(typingTimer.current);
      if (draftTimer.current) clearTimeout(draftTimer.current);
            if (value.active) typingTimer.current = setTimeout(() => setTyping(''), 4200);
          }
        } else if (value.type === 'chat.updated') {
          setMessages(before=>reconcileUpdatedMessage(before,value.message));
        } else if (value.type === 'chat.read') {
          setReceipts(before=>[
            ...before.filter(r=>r.actorId!==value.actorId),
            {actorId:value.actorId,displayName:value.displayName,seq:Math.max(
              value.seq,before.find(r=>r.actorId===value.actorId)?.seq||0)},
          ]);
        } else if (value.type === 'chat.reaction') {
          setReactions(before => reconcileReactions(before, value));
        } else if (value.type === 'chat.message') {
          confirm(value.message);
          setMessages(before => reconcileChatMessages(before, [value.message]));
          sendReadReceipt(value.message.seq);
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
    void loadLocalChat().then(saved => {
      restoredStorage.current = true;
      if(disposed.current)return;
      if(activeSession.current){persist();return;}
      if (!saved || !saved.session || Date.parse(saved.session.expiresAt) <= Date.now()) return;
      activeSession.current = saved.session;
      outbox.current = new Map((saved.outbox || []).map(m => [m.clientMessageId,{...m,pending:true,deliveryStatus:'queued' as const}]));
      setMessages([...outbox.current.values()]);
      setSession(saved.session);
      latestDraft.current = saved.draft || '';
      setDraft(latestDraft.current);
      setName(saved.session.displayName);
      connectLatest.current(saved.session);
    }).catch(() => {restoredStorage.current=true;});
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
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  useEffect(() => {
    latestDraft.current = draft;
    if(!restoredStorage.current || !activeSession.current)return;
    if(draftTimer.current)clearTimeout(draftTimer.current);
    draftTimer.current=setTimeout(()=>{draftTimer.current=null;persist();},350);
    return ()=>{if(draftTimer.current)clearTimeout(draftTimer.current);};
  },[draft]);


  useEffect(() => {
    if(scrollOlderOnce.current){scrollOlderOnce.current=false;return;}
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
      setReceipts([]);
      setSearchResults(null);
      setHasMore(false);
      outbox.current.clear();
      setSession(next);
      activeSession.current = next;
      persist();
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
    if(editing) {
      if (socket.current?.readyState===WebSocket.OPEN && text && text!==editing.text) {
        socket.current.send(JSON.stringify({type:'chat.edit',seq:editing.seq,text}));
      }
      setEditing(null);setDraft('');
      return;
    }
    if (!session || !text) return;
    if (outbox.current.size >= 100) {
      setError('La cola está llena. Reintenta cuando tengas conexión.');
      return;
    }
    const clientMessageId = newClientMessageId();
    const message: ChatMessage = {
      seq: 0, clientMessageId, senderId: session.actorId, senderName: session.displayName,
      text, sentAt: new Date().toISOString(), pending: true, deliveryStatus: 'queued', replyToSeq: replyTo?.seq || null,
    };
    outbox.current.set(clientMessageId, message);
    persist();
    setReplyTo(null);
    setMessages(before => reconcileChatMessages(before, [message]));
    setDraft('');
    flushOutbox();
  }
  function react(seq: number, emoji: ChatEmoji) {
    if (seq > 0 && socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({type:'chat.react',messageSeq:seq,emoji}));
    }
  }
  function typeText(value: string) {
    setDraft(value);
    const now = Date.now();
    if (now - typingLast.current > 1700 && socket.current?.readyState === WebSocket.OPEN) {
      typingLast.current = now;
      socket.current.send(JSON.stringify({type:'chat.typing',active:!!value.trim()}));
    }
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
            <span className="room-user">{typing || `${onlineUsers} en línea · ${session.displayName}`}</span>
          </div>
          <div className="chat-search">
            <input aria-label="Buscar en el chat" placeholder="Buscar mensajes…" value={searchQuery}
              onChange={e=>{setSearchQuery(e.target.value);if(!e.target.value.trim())setSearchResults(null);}}
              onKeyDown={e=>{if(e.key==='Enter')void runSearch();}}/>
            <button type="button" disabled={searching||searchQuery.trim().length<2} onClick={()=>void runSearch()}>{searching?'…':'Buscar'}</button>
            {searchResults&&<button type="button" onClick={()=>{setSearchResults(null);setSearchQuery('');}}>Cerrar</button>}
          </div>
          <section className="chat-messages" aria-label="Mensajes">
            {searchResults===null&&hasMore&&<button type="button" className="load-older" disabled={loadingOlder}
              onClick={()=>void loadOlder()}>{loadingOlder?'Cargando…':'Cargar mensajes anteriores'}</button>}
            {searchResults!==null&&<p className="search-count">{searchResults.length} resultado(s) en historial</p>}
            {messages.length === 0 && <p className="empty-chat">¡Hola! Escribe el primer mensaje.</p>}
            {(searchResults??messages).map(message => {
              const mine = message.senderId === session.actorId;
              return <article className={mine ? 'bubble mine' : 'bubble theirs'} key={message.senderId + ':' + message.clientMessageId}>
                {!mine && <span className="sender">{message.senderName}</span>}
                {message.replyToSeq && <div className="reply-original">↪ {messages.find(m=>m.seq===message.replyToSeq)?.text.slice(0,55)||`Mensaje #${message.replyToSeq}`}</div>}
                <div>{message.deletedAt?'Mensaje eliminado':message.text}</div>
                <span className="message-meta">
                  {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.editedAt&&!message.deletedAt?' · editado':''}{mine ? ' · ' + messageDeliveryLabel(message) : ''}{mine&&!message.pending&&lastReadByOther(receipts,session.actorId)>=message.seq?' · leído':''}
                </span>
                {message.seq > 0 && !message.deletedAt && <div className="bubble-tools">
                  <button type="button" onClick={() => setReplyTo(message)}>Responder</button>
                  {mine && connection==='en vivo' && Date.now()-Date.parse(message.sentAt)<15*60*1000 && <>
                    <button type="button" onClick={()=>updateOwn(message)}>Editar</button>
                    <button type="button" onClick={()=>{if(window.confirm('¿Eliminar este mensaje?'))updateOwn(message,true);}}>Eliminar</button>
                  </>}
                  {(['❤️','😂','👍'] as ChatEmoji[]).map(emoji => <button type="button" key={emoji} onClick={() => react(message.seq, emoji)}>{emoji} {reactions.filter(r => r.messageSeq === message.seq && r.emoji === emoji).length || ''}</button>)}
                </div>}
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
          {editing && <div className="reply-preview">Editando mensaje <button type="button" onClick={()=>{setEditing(null);setDraft('');}}>Cancelar</button></div>}
          {replyTo && !editing && <div className="reply-preview">Respondiendo a: {replyTo.text.slice(0,65)} <button type="button" onClick={() => setReplyTo(null)}>Cancelar</button></div>}
          <form className="chat-composer" onSubmit={event => { event.preventDefault(); send(); }}>
            <input aria-label="Escribir mensaje" value={draft} maxLength={2000} onChange={event => typeText(event.target.value)} placeholder={connection === 'en vivo' ? 'Escribe un mensaje…' : 'Sin conexión: se enviará después…'} />
            <button aria-label="Enviar" disabled={!draft.trim()} type="submit">{editing?'Guardar':'Enviar'}</button>
          </form>
        </>
      )}
    </main>
  );
}
