import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, AppState, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import {
  HAVANA_V2_DEV_API_BASE_URL, fetchBackendHealth, getChatSnapshot, getOlderChatMessages, searchChatMessages, lastReadByOther, messageDeliveryLabel, newClientMessageId,
  reconcileChatMessages, reconcileReactions, reconcileUpdatedMessage, startNamedChatSession, restoreNamedChatSession,
  type ChatMessage, type ChatServerEvent, type ChatSession, type ChatReaction, type ChatEmoji, type ChatReadReceipt,
} from '@havana/shared';
import { loadNativeLocalChat, saveNativeLocalChat } from './chatStorage';
import SwipeableBubble, {type BubbleAnchor} from './SwipeableBubble';

export default function App() {
  const {width: viewportWidth, height: viewportHeight} = useWindowDimensions();
  const [apiState, setApiState] = useState('conectando…');
  const [name, setName] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [restoringAccess,setRestoringAccess] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('desconectado');
  const [joining, setJoining] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typing, setTyping] = useState('');
  const [receipts,setReceipts] = useState<ChatReadReceipt[]>([]);
  const [hasMore,setHasMore] = useState(false);
  const [loadingOlder,setLoadingOlder] = useState(false);
  const [searchText,setSearchText] = useState('');
  const [searchOpen,setSearchOpen] = useState(false);
  const [keyboardOpen,setKeyboardOpen] = useState(false);
  const [results,setResults] = useState<ChatMessage[] | null>(null);
  const [searching,setSearching] = useState(false);
  const [editing,setEditing] = useState<ChatMessage | null>(null);
  const [menuMessage,setMenuMessage] = useState<ChatMessage | null>(null);
  const [menuAnchor,setMenuAnchor] = useState<BubbleAnchor | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const scroll = useRef<React.ElementRef<typeof ScrollView> | null>(null);
  const autoScroll = useRef(true);
  const activeSession = useRef<ChatSession | null>(null);
  const appLifecycle = useRef(AppState.currentState);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttempts = useRef(0);
  const disposed = useRef(false);
  const connectLatest = useRef<(next: ChatSession) => void>(() => {});
  const syncLatest = useRef<() => void>(() => {});
  const outbox = useRef<Map<string, ChatMessage>>(new Map());
  const acknowledgementTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const typingLast = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());
  const latestDraft = useRef('');
  const restoredStorage = useRef(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Android 16: keep the legacy navigation padding only when the IME is hidden.
  // The keyboard avoidance wrapper is responsible for lifting the composer.
  useEffect(() => {
    const show=Keyboard.addListener('keyboardDidShow',()=>setKeyboardOpen(true));
    const hide=Keyboard.addListener('keyboardDidHide',()=>setKeyboardOpen(false));
    return ()=>{show.remove();hide.remove();};
  },[]);

  function toggleSearch() {
    setSearchOpen(open=>!open);
    setSearchText('');
    setResults(null);
  }

  function revokeCurrentAccess() {
    const previous = socket.current;
    socket.current = null;
    previous?.close();
    clearRetryTimer();
    activeSession.current = null;
    outbox.current.clear();
    setMessages([]);
    setSession(null);
    setName('');
    setConnection('desconectado');
    setError('Acceso revocado. Consulta al administrador.');
    void saveNativeLocalChat(null);
  }

  function persistLocal() {
    if (!restoredStorage.current) return;
    const value = activeSession.current ? {
      session: activeSession.current,
      outbox: [...outbox.current.values()].map(m => ({...m,pending:true,deliveryStatus:'queued' as const})),
      draft: latestDraft.current,
    } : null;
    storageQueue.current = storageQueue.current.catch(() => {}).then(() => saveNativeLocalChat(value)).catch(() => {});
  }

  function sendReadReceipt(seq:number) {
    if(seq>0 && appLifecycle.current==='active' && socket.current?.readyState===WebSocket.OPEN) {
      socket.current.send(JSON.stringify({type:'chat.read',seq}));
    }
  }
  async function loadOlder() {
    if(!session || loadingOlder || !hasMore) return;
    const seqs=messages.filter(m=>m.seq>0).map(m=>m.seq);
    if(!seqs.length)return;
    setLoadingOlder(true);
    autoScroll.current=false;
    try {
      const data=await getOlderChatMessages(session,Math.min(...seqs));
      setHasMore(data.hasMore);
      setMessages(before=>reconcileChatMessages(data.messages,before));
      setReactions(before=>[...data.reactions.filter(x=>!before.some(y=>y.messageSeq===x.messageSeq&&y.actorId===x.actorId&&y.emoji===x.emoji)),...before]);
    } catch(e){setError(e instanceof Error?e.message:'No se pudo cargar el historial');}
    finally {setLoadingOlder(false);}
  }
  async function searchHistory(){
    if(!session||searchText.trim().length<2){setResults(null);return;}
    setSearching(true);
    try{setResults(await searchChatMessages(session,searchText.trim()));}
    catch(e){setError(e instanceof Error?e.message:'No se pudo buscar');}
    finally{setSearching(false);}
  }
  function replyToMessage(message:ChatMessage) {
    if(message.seq<1 || message.deletedAt)return;
    setMenuMessage(null);
    setEditing(null);
    setReplyTo(message);
  }
  function showMessageMenu(message:ChatMessage,anchor:BubbleAnchor) {
    if(message.seq<=0 || message.deletedAt)return;
    setMenuAnchor(anchor);
    setMenuMessage(message);
  }
  function manageOwn(message:ChatMessage,deleting=false){
    if(!session||message.senderId!==session.actorId||message.seq<1||
      message.deletedAt||connection!=='en vivo')return;
    if(Date.now()-Date.parse(message.sentAt)>(deleting?48*60*60*1000:900000)){
      setError(deleting?'El plazo para eliminar terminó':'El plazo de edición de 15 minutos terminó');return;
    }
    if(!deleting){setReplyTo(null);setEditing(message);setDraft(message.text);return;}
    setError('');
    socket.current?.send(JSON.stringify({type:'chat.delete',seq:message.seq}));
  }
  function clearAck(id: string) {
    const timer = acknowledgementTimers.current.get(id);
    if (timer) clearTimeout(timer);
    acknowledgementTimers.current.delete(id);
  }

  function confirmMessage(message: ChatMessage) {
    if (!message.pending && message.senderId === activeSession.current?.actorId) {
      outbox.current.delete(message.clientMessageId);
      clearAck(message.clientMessageId);
      persistLocal();
    }
  }

  function markOutgoing(id: string, state: 'queued' | 'sending' | 'error') {
    const message = outbox.current.get(id);
    if (!message) return;
    outbox.current.set(id, { ...message, deliveryStatus: state, failed: state === 'error' });
    persistLocal();
    setMessages(existing => existing.map(m =>
      m.clientMessageId === id && m.senderId === message.senderId && m.pending
        ? { ...m, deliveryStatus: state, failed: state === 'error' }
        : m
    ));
  }

  function pauseOutgoing() {
    for (const timer of acknowledgementTimers.current.values()) clearTimeout(timer);
    acknowledgementTimers.current.clear();
    for (const id of outbox.current.keys()) markOutgoing(id, 'queued');
  }

  // Each retry retains the original clientMessageId. D1 UNIQUE(sender_id, id)
  // prevents duplicates if the server stored a message before connection loss.
  function flushOutbox() {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const pending = [...outbox.current.values()].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    // Preserve sender order: wait for server ACK before transmitting next item.
    if (pending.some(item => item.deliveryStatus === 'sending')) return;
    const item = pending[0];
    if (!item || item.deliveryStatus !== 'queued') return;
    {
      try {
        ws.send(JSON.stringify({ type: 'chat.send', clientMessageId: item.clientMessageId, text: item.text, replyToSeq: item.replyToSeq || null }));
        markOutgoing(item.clientMessageId, 'sending');
        clearAck(item.clientMessageId);
        const id = item.clientMessageId;
        acknowledgementTimers.current.set(id, setTimeout(() => {
          acknowledgementTimers.current.delete(id);
          markOutgoing(id, 'error');
        }, 12000));
      } catch {
        markOutgoing(item.clientMessageId, 'error');
      }
    }
  }

  function retryOutgoing(id: string) {
    if (!outbox.current.has(id)) return;
    clearAck(id);
    markOutgoing(id, 'queued');
    flushOutbox();
  }


  function clearRetryTimer() {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
  }

  function syncMessages(next: ChatSession) {
    void getChatSnapshot(next)
      .then(({ messages:history, reactions:historyReactions, receipts:readHistory,hasMore:more }) => {
        if (!disposed.current && activeSession.current?.actorId === next.actorId) {
          history.forEach(confirmMessage);
          setReactions(historyReactions);
          setReceipts(readHistory);
          setHasMore(more);
          setMessages(before => reconcileChatMessages(before, history));
          sendReadReceipt(Math.max(0,...history.map(m=>m.seq)));
          flushOutbox();
        }
      })
      .catch(reason => {
        if (!disposed.current && activeSession.current?.actorId === next.actorId) {
          setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el historial');
          // A temporary history failure must not block queued outgoing messages.
          flushOutbox();
        }
      });
  }

  // React Native's Android WebSocket supports Authorization at handshake time.
  // Do not put secrets in the URL or Sec-WebSocket-Protocol.
  function connect(next: ChatSession) {
    if (disposed.current) return;
    activeSession.current = next;
    persistLocal();
    if (Date.parse(next.expiresAt) <= Date.now()) {
      clearRetryTimer();
      for (const timer of acknowledgementTimers.current.values()) clearTimeout(timer);
      acknowledgementTimers.current.clear();
      socket.current?.close();
      socket.current = null;
      activeSession.current = null;
      persistLocal();
      setSession(null);
      setConnection('desconectado');
      setError('Tu acceso no está disponible. Escribe tu nombre para solicitar la entrada.');
      return;
    }
    clearRetryTimer();
    const previous = socket.current;
    if (previous) pauseOutgoing();
    socket.current = null; // previous close events cannot race with a new connection
    previous?.close();
    setConnection('conectando…');
    setError('');

    type NativeWebSocketConstructor = new (
      url: string,
      protocols: string[],
      options: { headers: Record<string, string> },
    ) => WebSocket;
    const NativeWebSocket = WebSocket as unknown as NativeWebSocketConstructor;

    function retry() {
      if (disposed.current || appLifecycle.current !== 'active' || socket.current !== ws ||
        !activeSession.current || retryTimer.current) return;
      pauseOutgoing();
      retryAttempts.current += 1;
      const delay = Math.min(20000, 1000 * 2 ** Math.min(retryAttempts.current - 1, 5));
      setConnection('reconectando…');
      retryTimer.current = setTimeout(() => {
        retryTimer.current = null;
        const sessionToRetry = activeSession.current;
        if (sessionToRetry && appLifecycle.current === 'active') {
          connectLatest.current(sessionToRetry);
        }
      }, delay);
    }

    let ws: WebSocket;
    try {
      ws = new NativeWebSocket(
        `${HAVANA_V2_DEV_API_BASE_URL.replace(/^http/, 'ws')}/ws`,
        ['havana-v2'],
        { headers: { Authorization: `Bearer ${next.token}` } },
      );
    } catch {
      setConnection('sin conexión');
      // Constructor errors are exceptional; avoid an indefinite retry loop.
      setError('No se pudo iniciar la conexión. Comprueba la red y pulsa Reconectar.');
      return;
    }
    socket.current = ws;
    ws.onopen = () => {
      if (disposed.current || socket.current !== ws) return;
      retryAttempts.current = 0;
      clearRetryTimer();
      setConnection('en vivo');
      setError('');
      syncMessages(next); // also recovers messages missed in background
    };
    ws.onmessage = event => {
      if (disposed.current || socket.current !== ws) return;
      try {
        const item = JSON.parse(String(event.data)) as ChatServerEvent;
        if (item.type === 'chat.ready') {
          setOnlineCount(item.users?.length || 1);
        } else if (item.type === 'chat.presence') {
          setOnlineCount(item.users.length);
        } else if (item.type === 'chat.typing') {
          if (item.actorId !== next.actorId) {
            setTyping(item.active ? item.senderName + ' está escribiendo…' : '');
            if (typingTimer.current) clearTimeout(typingTimer.current);
      if (draftTimer.current) clearTimeout(draftTimer.current);
            if (item.active) typingTimer.current = setTimeout(() => setTyping(''), 4300);
          }
        } else if (item.type === 'chat.updated') {
          setMessages(before=>reconcileUpdatedMessage(before,item.message));
          if(item.message.deletedAt){
            setReactions(before=>before.filter(r=>r.messageSeq!==item.message.seq));
            setMenuMessage(current=>current?.seq===item.message.seq?null:current);
          }
          setError('');
        } else if (item.type === 'chat.read') {
          setReceipts(before=>[...before.filter(x=>x.actorId!==item.actorId),
            {actorId:item.actorId,displayName:item.displayName,seq:Math.max(item.seq,
              before.find(x=>x.actorId===item.actorId)?.seq||0)}]);
        } else if (item.type === 'chat.reaction') {
          setReactions(before => reconcileReactions(before, item));
        } else if (item.type === 'chat.message') {
          confirmMessage(item.message);
          setMessages(before => reconcileChatMessages(before, [item.message]));
          sendReadReceipt(item.message.seq);
          flushOutbox();
        } else if (item.type === 'chat.revoked') {
          revokeCurrentAccess();
        } else if (item.type === 'chat.error') {
          setError(item.error);
        }
      } catch {
        setError('Evento no válido');
      }
    };
    ws.onerror = () => {
      if (disposed.current || socket.current !== ws) return;
      retry();
    };
    ws.onclose = event => {
      if (disposed.current || socket.current !== ws) return;
      pauseOutgoing();
      if (appLifecycle.current === 'active') {
        retry();
      } else {
        setConnection('pausado');
      }
    };
  }

  // Stable listeners are mounted once. Reconnect on Android foreground,
  // with a short exponential backoff after unexpected network drops.
  connectLatest.current = connect;
  syncLatest.current = () => {
    if (activeSession.current) syncMessages(activeSession.current);
  };

  useEffect(() => {
    disposed.current = false;
    void loadNativeLocalChat().then(async saved => {
      if (disposed.current) return;
      if (activeSession.current) {restoredStorage.current=true;persistLocal();return;}
      if (!saved?.session || Date.parse(saved.session.expiresAt) <= Date.now()) return;
      let approved:ChatSession | null = saved.session;
      try {approved = await restoreNamedChatSession(saved.session);}
      catch {approved = saved.session;} // Offline: retain local identity and retry once online
      if (disposed.current) return;
      if (!approved) {
        await saveNativeLocalChat(null);
        setName('');
        setError('Acceso no autorizado. Consulta al administrador.');
        return;
      }
      activeSession.current = approved;
      outbox.current = new Map(saved.outbox.map(m => [m.clientMessageId,{...m,pending:true,deliveryStatus:'queued' as const}]));
      setMessages([...outbox.current.values()]);
      setSession(approved);
      latestDraft.current = saved.draft || '';
      setDraft(latestDraft.current);
      setName(approved.displayName);
      connectLatest.current(approved);
    }).catch(() => {}).finally(() => {restoredStorage.current=true;setRestoringAccess(false);});
    void fetchBackendHealth()
      .then(value => { if (!disposed.current) setApiState(value.ok ? 'conectada' : 'error'); })
      .catch(() => { if (!disposed.current) setApiState('error'); });

    const subscription = AppState.addEventListener('change', state => {
      appLifecycle.current = state;
      const currentSession = activeSession.current;
      if (state === 'active' && currentSession) {
        void restoreNamedChatSession(currentSession).then(valid => {
          if (disposed.current || activeSession.current?.token !== currentSession.token) return;
          if (!valid) {revokeCurrentAccess();return;}
          const ws = socket.current;
          if (!ws || ws.readyState !== WebSocket.OPEN) connectLatest.current(valid);
          else syncLatest.current();
        }).catch(() => {
          // Without a network connection, preserve the existing local session.
          if (activeSession.current?.token === currentSession.token)
            connectLatest.current(currentSession);
        });
      } else if (state === 'background') {
        clearRetryTimer();
        pauseOutgoing();
        const old = socket.current;
        socket.current = null;
        old?.close();
        if (currentSession) setConnection('pausado');
      }
    });

    return () => {
      disposed.current = true;
      subscription.remove();
      clearRetryTimer();
      socket.current?.close();
      socket.current = null;
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  useEffect(() => {
    latestDraft.current = draft;
    if(!restoredStorage.current || !activeSession.current)return;
    if(draftTimer.current)clearTimeout(draftTimer.current);
    draftTimer.current=setTimeout(()=>{draftTimer.current=null;persistLocal();},350);
    return ()=>{if(draftTimer.current)clearTimeout(draftTimer.current);};
  },[draft]);


  async function join() {
    if (!name.trim() || joining) return;
    setJoining(true);
    setError('');
    try {
      const next = await startNamedChatSession(name.trim());
      setMessages([]);
      setReceipts([]);
      setResults(null);
      setHasMore(false);
      setSession(next);
      activeSession.current = next;
      persistLocal();
      retryAttempts.current = 0;
      connect(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo entrar');
    } finally {
      setJoining(false);
    }
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

  function send() {
    const text = draft.trim();
    if(editing) {
      if(socket.current?.readyState===WebSocket.OPEN && text && text!==editing.text) {
        socket.current.send(JSON.stringify({type:'chat.edit',seq:editing.seq,text}));
      }
      setEditing(null);setDraft('');
      return;
    }
    if (!session || !text) return;
    if (outbox.current.size >= 100) {
      setError('La cola de mensajes está llena. Reintenta cuando vuelva Internet.');
      return;
    }
    const clientMessageId = newClientMessageId();
    const item: ChatMessage = {
      seq: 0, clientMessageId, senderId: session.actorId, senderName: session.displayName,
      text, sentAt: new Date().toISOString(), pending: true, deliveryStatus: 'queued', replyToSeq: replyTo?.seq || null,
    };
    outbox.current.set(clientMessageId, item);
    persistLocal();
    setReplyTo(null);
    setMessages(before => reconcileChatMessages(before, [item]));
    setDraft('');
    autoScroll.current = true;
    flushOutbox();
  }

  // The menu is positioned beside the touched bubble, clamped to the visible
  // Android window. On short screens it moves below the bubble if needed.
  const menuWidth=Math.min(288,Math.max(180,viewportWidth-24));
  const menuOwn=!!menuMessage && menuMessage.senderId===session?.actorId && !menuMessage.pending;
  const menuAge=menuMessage ? Date.now()-Date.parse(menuMessage.sentAt) : Infinity;
  const allowDelete=menuOwn && connection==='en vivo' && menuAge<48*60*60*1000;
  const allowEdit=menuOwn && connection==='en vivo' && menuAge<15*60*1000;
  const menuHeight=118;
  const preferredTop=menuAnchor && menuAnchor.y>menuHeight+16
    ? menuAnchor.y-menuHeight-8
    : (menuAnchor?.y??(viewportHeight-menuHeight)/2)+(menuAnchor?.height??0)+8;
  const menuTop=Math.max((StatusBar.currentHeight??0)+8,
    Math.min(preferredTop,viewportHeight-menuHeight-14));
  const preferredLeft=menuAnchor
    ? (menuOwn ? menuAnchor.x+menuAnchor.width-menuWidth : menuAnchor.x)
    : (viewportWidth-menuWidth)/2;
  const menuLeft=Math.max(12,Math.min(preferredLeft,viewportWidth-menuWidth-12));

  return (
    <SafeAreaView style={[styles.screen,keyboardOpen && styles.screenKeyboard]}>
      <StatusBar barStyle="dark-content" />
      {/* Android 16 edge-to-edge can draw the composer behind the IME even with
            adjustResize. Height mode keeps the native chat input and Enviar
            visible above the keyboard without changing the PWA or storage. */}
      <KeyboardAvoidingView style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>HAVANA NICE</Text>
            <Text style={styles.title}>Chat V2</Text>
          </View>
          <View style={styles.headerActions}>
            <Text style={styles.connection}>
              {session ? (typing || `${connection} · ${onlineCount} en línea`) : `API ${apiState}`}
            </Text>
            {session ? <Pressable accessibilityRole="button" accessibilityLabel="Buscar mensajes"
              accessibilityState={{expanded:searchOpen}}
              onPress={toggleSearch} style={styles.headerSearchButton}>
              <Text style={styles.headerSearchText}>{searchOpen?'Cerrar':'Buscar'}</Text>
            </Pressable> : null}
          </View>
        </View>

        {restoringAccess ? <View style={styles.login}><Text style={styles.description}>Abriendo HAVANA NICE…</Text></View> : !session ? (
          <View style={styles.login}>
            <Text style={styles.overline}>ACCESO HAVANA NICE</Text>
            <Text style={styles.loginTitle}>Bienvenido.</Text>
            <Text style={styles.description}>Escribe tu nombre autorizado la primera vez. En este teléfono se recordará tu acceso.</Text>
            <Text style={styles.label}>Tu nombre</Text>
            <TextInput
              accessibilityLabel="Tu nombre" style={styles.input} value={name}
              onChangeText={setName} maxLength={28} autoCapitalize="none" autoCorrect={false} placeholder="Tu nombre"
            />
            <Pressable onPress={() => void join()} disabled={joining || !name.trim()} style={styles.joinButton}>
              <Text style={styles.joinText}>{joining ? 'Conectando…' : 'Entrar al chat'}</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.footer}>Si no estás autorizado, consulta al administrador.</Text>
          </View>
        ) : (
          <>
            {searchOpen ? <View style={styles.searchRow}>
              <TextInput accessibilityLabel="Buscar mensajes" style={styles.searchInput}
                value={searchText} onChangeText={value=>{setSearchText(value);if(!value.trim())setResults(null);}}
                placeholder="Buscar mensajes…" onSubmitEditing={()=>void searchHistory()} returnKeyType="search"
                placeholderTextColor="#8a8174" />
              <Pressable onPress={()=>void searchHistory()} disabled={searching||searchText.trim().length<2}>
                <Text style={styles.searchAction}>{searching?'…':'Buscar'}</Text>
              </Pressable>
              {results!==null ? <Pressable onPress={()=>{setResults(null);setSearchText('');}}>
                <Text style={styles.searchAction}>Cerrar</Text>
              </Pressable> : null}
            </View> : null}
            <ScrollView
              ref={scroll} style={styles.messageList} contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => {if(autoScroll.current)scroll.current?.scrollToEnd({animated:true});}}
            >
              {results===null&&hasMore ? <Pressable style={styles.loadMore} disabled={loadingOlder}
                onPress={()=>void loadOlder()}><Text style={styles.loadMoreText}>{loadingOlder?'Cargando…':'Cargar mensajes anteriores'}</Text></Pressable>:null}
              {results!==null?<Text style={styles.searchCount}>{results.length} resultado(s)</Text>:null}
              {!messages.length ? <Text style={styles.empty}>¡Hola! Envía el primer mensaje. Aparecerá en los dos dispositivos.</Text> : null}
              {(results??messages).map(message => {
                const mine = message.senderId === session.actorId;
                return (
                  <SwipeableBubble
                    key={message.senderId + ':' + message.clientMessageId}
                    style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                    onReply={() => replyToMessage(message)}
                    onLongPress={(anchor) => showMessageMenu(message,anchor)}
                    onPress={() => {if(mine && message.pending && message.deliveryStatus==='error')retryOutgoing(message.clientMessageId);}}
                  >
                    {!mine && <Text style={styles.sender}>{message.senderName}</Text>}
                    {message.replyToSeq ? (
                      <Text style={[styles.replyLabel,mine && styles.mineMeta]}>
                        ↪ {messages.find(m=>m.seq===message.replyToSeq)?.text.slice(0,70)||'Mensaje anterior'}
                      </Text>
                    ) : null}
                    <Text style={[styles.bubbleText,mine && styles.mineText,message.deletedAt && styles.deletedText]}>
                      {message.deletedAt?'Mensaje eliminado':message.text}
                    </Text>
                    {message.seq>0 && !message.deletedAt && reactions.some(r=>r.messageSeq===message.seq) ? (
                      <View style={styles.reactionBadges}>
                        {(['❤️','😂','👍'] as ChatEmoji[]).filter(emoji=>reactions.some(r=>r.messageSeq===message.seq&&r.emoji===emoji)).map(emoji=>(
                          <Text key={emoji} style={styles.reactionBadge}>
                            {emoji}{reactions.filter(r=>r.messageSeq===message.seq&&r.emoji===emoji).length}
                          </Text>
                        ))}
                      </View>
                    ):null}
                    <Text style={[styles.messageTime,mine && styles.mineMeta]}>
                      {new Date(message.sentAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                      {message.editedAt&&!message.deletedAt?' · editado':''}
                      {mine?' · '+messageDeliveryLabel(message):''}
                      {mine&&!message.pending&&lastReadByOther(receipts,session.actorId)>=message.seq?' · leído':''}
                    </Text>
                  </SwipeableBubble>
                );
              })}
            </ScrollView>
            <Modal animationType="fade" transparent statusBarTranslucent visible={!!menuMessage}
              onRequestClose={()=>setMenuMessage(null)}>
              <Pressable style={styles.whatsappBackdrop} onPress={()=>setMenuMessage(null)}>
                {menuMessage ? <Pressable
                    accessibilityLabel="Opciones del mensaje"
                    style={[styles.whatsappContext,{
                      left:menuLeft,top:menuTop,width:menuWidth,
                    }]} onPress={()=>{}}>
                  <View style={styles.whatsappEmojiBar}>
                    {(['👍','❤️','😂'] as ChatEmoji[]).map(emoji=>(
                      <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={emoji}
                        disabled={connection!=='en vivo'}
                        style={[styles.whatsappEmoji,connection!=='en vivo'&&styles.disabledMenuAction,
                          reactions.some(r=>r.messageSeq===menuMessage.seq&&r.actorId===session.actorId&&r.emoji===emoji)
                            &&styles.selectedMenuReaction]}
                        onPress={()=>{react(menuMessage.seq,emoji);setMenuMessage(null);}}>
                        <Text style={styles.whatsappEmojiText}>{emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.whatsappActionBar}>
                    <Pressable accessibilityRole="button" style={styles.whatsappAction}
                      onPress={()=>replyToMessage(menuMessage)}>
                      <Text style={styles.whatsappActionText}>Responder</Text>
                    </Pressable>
                    {allowEdit ? <Pressable accessibilityRole="button" style={styles.whatsappAction}
                      onPress={()=>{const m=menuMessage;setMenuMessage(null);manageOwn(m);}}>
                      <Text style={styles.whatsappActionText}>Editar</Text>
                    </Pressable> : null}
                    {allowDelete ? <Pressable accessibilityRole="button" style={styles.whatsappAction}
                      onPress={()=>{
                        const m=menuMessage;setMenuMessage(null);
                        Alert.alert('Borrar mensaje','¿Borrar este mensaje para todos?',[
                          {text:'Cancelar',style:'cancel'},
                          {text:'Borrar',style:'destructive',onPress:()=>manageOwn(m,true)},
                        ]);
                      }}>
                      <Text style={styles.whatsappDeleteText}>Borrar</Text>
                    </Pressable> : null}
                  </View>
                </Pressable>:null}
              </Pressable>
            </Modal>
            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
            {connection !== 'en vivo' ? (
              <Pressable onPress={() => { retryAttempts.current = 0; connect(session); }} style={styles.reconnect}>
                <Text style={styles.reconnectText}>Reintentar conexión</Text>
              </Pressable>
            ) : null}
            {editing ? <View style={styles.replyPreview}>
              <Text style={styles.replyPreviewText}>Editando mensaje</Text>
              <Pressable onPress={()=>{setEditing(null);setDraft('');}}>
                <Text style={styles.replyCancel}>Cancelar</Text>
              </Pressable>
            </View>:null}
            {replyTo && !editing ? (
              <View style={styles.replyPreview}>
                <Text style={styles.replyPreviewText}>Respondiendo: {replyTo.text.slice(0,65)}</Text>
                <Pressable onPress={() => setReplyTo(null)}><Text style={styles.replyCancel}>Cancelar</Text></Pressable>
              </View>
            ) : null}
            <View style={styles.composer}>
              <TextInput
                accessibilityLabel="Escribir mensaje" style={styles.draft} value={draft}
                onChangeText={typeText} maxLength={2000} multiline
                placeholder={connection === 'en vivo' ? 'Escribe un mensaje…' : 'Sin conexión: se enviará después…'} placeholderTextColor="#888"
              />
              <Pressable onPress={send} disabled={!draft.trim()} style={styles.sendButton}>
                <Text style={styles.sendText}>{editing?'Guardar':'Enviar'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // RN SafeAreaView does not include Android's bottom navigation safe area.
  // Reserve room for three-button navigation even with Android 16 edge-to-edge.
  screen: { flex: 1, backgroundColor: '#F3EDDF', paddingBottom: Platform.OS === 'android' ? 42 : 0 },
  screenKeyboard: {paddingBottom:0},
  header: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#d6cab9' },
  brand: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  title: { fontSize: 29, fontWeight: '700', marginTop: 7 },
  connection: { fontSize: 12, color: '#69675e' },
  headerActions: {alignItems:'flex-end',gap:7,maxWidth:'58%'},
  headerSearchButton: {paddingHorizontal:9,paddingVertical:5,borderRadius:12,borderWidth:1,borderColor:'#d6cbbc'},
  headerSearchText: {fontSize:12,color:'#79563f',fontWeight:'700'},
  login: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  loginTitle: { fontSize: 40, fontWeight: '700', marginTop: 12 },
  description: { color: '#68655e', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 25 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#fffaf2', borderWidth: 1, borderColor: '#d4cabc', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, marginBottom: 16, color: '#171713' },
  joinButton: { padding: 17, borderRadius: 14, backgroundColor: '#1a1a16', alignItems: 'center' },
  joinText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: { color: '#746b60', fontSize: 12, marginTop: 18 },
  error: { color: '#a8322f', fontSize: 14, marginTop: 12 },
  room: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14 },
  roomTitle: { fontSize: 13, fontWeight: '700' },
  roomUser: { fontSize: 13, color: '#69675e' },
  searchRow: {flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:18,paddingVertical:6},
  searchInput: {flex:1,borderWidth:1,borderColor:'#d6cbbc',borderRadius:16,paddingHorizontal:12,
    paddingVertical:5,color:'#23231d',fontSize:13,backgroundColor:'#fffaf4',height:36},
  searchAction:{fontSize:12,fontWeight:'700',color:'#79563f'},
  loadMore:{alignSelf:'center',padding:10,marginBottom:10},
  loadMoreText:{fontSize:12,fontWeight:'700',color:'#815d48'},
  searchCount:{fontSize:12,color:'#68655e',textAlign:'center',paddingBottom:9},
  messageList: { flex: 1 },
  messages: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18, flexGrow: 1 },
  empty: { color: '#746d60', fontSize: 14, textAlign: 'center', marginTop: 65, lineHeight: 21 },
  bubble: { maxWidth: '85%', paddingHorizontal: 14, paddingTop: 11, paddingBottom: 8, borderRadius: 18, marginBottom: 11, minWidth: 90 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#252621', borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fffaf4', borderBottomLeftRadius: 5 },
  sender: { color: '#2d2d29', fontWeight: '700', fontSize: 12, marginBottom: 5 },
  bubbleText: { color: '#1b1b18', fontSize: 15, lineHeight: 22 },
  mineText: { color: '#fff' },
  messageTime: { color: '#8a857b', fontSize: 10, textAlign: 'right', marginTop: 5 },
  mineMeta: { color: '#c1c1bd' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopColor: '#d6cab9', borderTopWidth: 1, gap: 8 },
  draft: { flex: 1, maxHeight: 95, minHeight: 45, backgroundColor: '#fffaf4', borderRadius: 23, borderWidth: 1, borderColor: '#ded4c7', paddingHorizontal: 14, paddingVertical: 11, color: '#171713', fontSize: 16 },
  sendButton: { backgroundColor: '#252621', borderRadius: 22, paddingHorizontal: 15, height: 45, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reconnect: { padding: 11, alignItems: 'center', borderTopWidth: 1, borderColor: '#d6cab9' },
  reconnectText: { fontWeight: '700', color: '#8a5a3c' },
  errorBanner: { color: '#a8322f', fontSize: 12, paddingHorizontal: 20, paddingVertical: 4 },
  deletedText:{fontStyle:'italic',opacity:.72},
  reactionBadges:{flexDirection:'row',gap:4,alignSelf:'flex-end',marginTop:5},
  reactionBadge:{fontSize:11,color:'#403c34',backgroundColor:'#e8e5dc',paddingHorizontal:5,paddingVertical:1,borderRadius:9,overflow:'hidden'},
  whatsappBackdrop:{flex:1,backgroundColor:'rgba(20,19,16,.16)'},
  whatsappContext:{position:'absolute',alignItems:'stretch',gap:8},
  whatsappEmojiBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-evenly',
    backgroundColor:'#fff',borderRadius:32,paddingHorizontal:7,minHeight:54,elevation:8},
  whatsappEmoji:{width:64,minHeight:46,borderRadius:25,alignItems:'center',justifyContent:'center'},
  whatsappEmojiText:{fontSize:27},
  disabledMenuAction:{opacity:.35},
  selectedMenuReaction:{backgroundColor:'#e3eee5'},
  whatsappActionBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-evenly',
    backgroundColor:'#fff',borderRadius:15,minHeight:55,elevation:8},
  whatsappAction:{paddingHorizontal:7,paddingVertical:14,alignItems:'center',justifyContent:'center'},
  whatsappActionText:{fontSize:14,fontWeight:'600',color:'#25251f'},
  whatsappDeleteText:{fontSize:14,fontWeight:'600',color:'#b3261e'},
  replyLabel: {fontSize:12,color:'#686b66',marginBottom:5},
  actions: { flexDirection:'row',alignItems:'center',gap:5,marginTop:6 },
  actionButton: {paddingVertical:5,paddingHorizontal:3},
  actionText: {fontSize:11,color:'#8d8b81'},
  replyPreview: {flexDirection:'row',justifyContent:'space-between',paddingHorizontal:18,paddingVertical:8,borderTopWidth:1,borderColor:'#d9cebd'},
  replyPreviewText: {fontSize:12,color:'#565247',flex:1},
  replyCancel: {fontSize:12,color:'#8a5a3c',fontWeight:'700'},
});
