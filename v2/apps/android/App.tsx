import React, { useEffect, useRef, useState } from 'react';
import {
  AppState, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import {
  HAVANA_V2_DEV_API_BASE_URL, fetchBackendHealth, getChatMessages, messageDeliveryLabel, newClientMessageId,
  reconcileChatMessages, startLabChatSession,
  type ChatMessage, type ChatServerEvent, type ChatSession,
} from '@havana/shared';

export default function App() {
  const [apiState, setApiState] = useState('conectando…');
  const [name, setName] = useState('Android');
  const [code, setCode] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('desconectado');
  const [joining, setJoining] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const scroll = useRef<React.ElementRef<typeof ScrollView> | null>(null);
  const activeSession = useRef<ChatSession | null>(null);
  const appLifecycle = useRef(AppState.currentState);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttempts = useRef(0);
  const disposed = useRef(false);
  const connectLatest = useRef<(next: ChatSession) => void>(() => {});
  const syncLatest = useRef<() => void>(() => {});
  const outbox = useRef<Map<string, ChatMessage>>(new Map());
  const acknowledgementTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function clearAck(id: string) {
    const timer = acknowledgementTimers.current.get(id);
    if (timer) clearTimeout(timer);
    acknowledgementTimers.current.delete(id);
  }

  function confirmMessage(message: ChatMessage) {
    if (!message.pending && message.senderId === activeSession.current?.actorId) {
      outbox.current.delete(message.clientMessageId);
      clearAck(message.clientMessageId);
    }
  }

  function markOutgoing(id: string, state: 'queued' | 'sending' | 'error') {
    const message = outbox.current.get(id);
    if (!message) return;
    outbox.current.set(id, { ...message, deliveryStatus: state, failed: state === 'error' });
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
  function flushOutbox(includeUncertain = false) {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const pending = [...outbox.current.values()].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    for (const item of pending) {
      if (!includeUncertain && item.deliveryStatus !== 'queued') continue;
      try {
        ws.send(JSON.stringify({ type: 'chat.send', clientMessageId: item.clientMessageId, text: item.text }));
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
    void getChatMessages(next)
      .then(history => {
        if (!disposed.current && activeSession.current?.actorId === next.actorId) {
          history.forEach(confirmMessage);
          setMessages(before => reconcileChatMessages(before, history));
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
    if (Date.parse(next.expiresAt) <= Date.now()) {
      clearRetryTimer();
      for (const timer of acknowledgementTimers.current.values()) clearTimeout(timer);
      acknowledgementTimers.current.clear();
      socket.current?.close();
      socket.current = null;
      activeSession.current = null;
      setSession(null);
      setConnection('desconectado');
      setError('Sesión de laboratorio caducada; vuelve a entrar con tu clave.');
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
        if (item.type === 'chat.message') {
          confirmMessage(item.message);
          setMessages(before => reconcileChatMessages(before, [item.message]));
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
    void fetchBackendHealth()
      .then(value => { if (!disposed.current) setApiState(value.ok ? 'conectada' : 'error'); })
      .catch(() => { if (!disposed.current) setApiState('error'); });

    const subscription = AppState.addEventListener('change', state => {
      appLifecycle.current = state;
      const currentSession = activeSession.current;
      if (state === 'active' && currentSession) {
        const ws = socket.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          connectLatest.current(currentSession);
        } else {
          syncLatest.current();
        }
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
    };
  }, []);

  async function join() {
    if (!name.trim() || !code.trim() || joining) return;
    setJoining(true);
    setError('');
    try {
      const next = await startLabChatSession(name.trim(), code.trim());
      setCode('');
      setMessages([]);
      setSession(next);
      activeSession.current = next;
      retryAttempts.current = 0;
      connect(next);
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
      setError('La cola de mensajes está llena. Reintenta cuando vuelva Internet.');
      return;
    }
    const clientMessageId = newClientMessageId();
    const item: ChatMessage = {
      seq: 0, clientMessageId, senderId: session.actorId, senderName: session.displayName,
      text, sentAt: new Date().toISOString(), pending: true, deliveryStatus: 'queued',
    };
    outbox.current.set(clientMessageId, item);
    setMessages(before => reconcileChatMessages(before, [item]));
    setDraft('');
    flushOutbox();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>HAVANA NICE</Text>
            <Text style={styles.title}>Chat V2</Text>
          </View>
          <Text style={styles.connection}>{session ? connection : `API ${apiState}`}</Text>
        </View>

        {!session ? (
          <View style={styles.login}>
            <Text style={styles.overline}>CHAT 2 · ESTADOS Y RECONEXIÓN</Text>
            <Text style={styles.loginTitle}>Conversemos.</Text>
            <Text style={styles.description}>Una conversación compartida entre Android y iPhone. Laboratorio privado.</Text>
            <Text style={styles.label}>Tu nombre</Text>
            <TextInput
              accessibilityLabel="Tu nombre" style={styles.input} value={name}
              onChangeText={setName} maxLength={28} autoCapitalize="words"
            />
            <Text style={styles.label}>Clave de laboratorio</Text>
            <TextInput
              accessibilityLabel="Clave de laboratorio" style={styles.input} value={code}
              onChangeText={setCode} secureTextEntry autoCapitalize="none" autoCorrect={false}
              placeholder="Clave privada" placeholderTextColor="#888"
            />
            <Pressable onPress={() => void join()} disabled={joining || !name.trim() || !code.trim()} style={styles.joinButton}>
              <Text style={styles.joinText}>{joining ? 'Conectando…' : 'Entrar al chat'}</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.footer}>FASE 0 ✓ · Fundación completada</Text>
          </View>
        ) : (
          <>
            <View style={styles.room}>
              <Text style={styles.roomTitle}>Conversación de laboratorio</Text>
              <Text style={styles.roomUser}>{session.displayName}</Text>
            </View>
            <ScrollView
              ref={scroll} style={styles.messageList} contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
            >
              {!messages.length ? <Text style={styles.empty}>¡Hola! Envía el primer mensaje. Aparecerá en los dos dispositivos.</Text> : null}
              {messages.map(message => {
                const mine = message.senderId === session.actorId;
                return (
                  <Pressable
                    key={message.senderId + ':' + message.clientMessageId}
                    onPress={() => { if (mine && message.pending && message.deliveryStatus === 'error') retryOutgoing(message.clientMessageId); }}
                    style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                  >
                    {!mine && <Text style={styles.sender}>{message.senderName}</Text>}
                    <Text style={[styles.bubbleText, mine && styles.mineText]}>{message.text}</Text>
                    <Text style={[styles.messageTime, mine && styles.mineMeta]}>
                      {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {mine ? ' · ' + messageDeliveryLabel(message) : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
            {connection !== 'en vivo' ? (
              <Pressable onPress={() => { retryAttempts.current = 0; connect(session); }} style={styles.reconnect}>
                <Text style={styles.reconnectText}>Reintentar conexión</Text>
              </Pressable>
            ) : null}
            <View style={styles.composer}>
              <TextInput
                accessibilityLabel="Escribir mensaje" style={styles.draft} value={draft}
                onChangeText={setDraft} maxLength={2000} multiline
                placeholder={connection === 'en vivo' ? 'Escribe un mensaje…' : 'Sin conexión: se enviará después…'} placeholderTextColor="#888"
              />
              <Pressable onPress={send} disabled={!draft.trim()} style={styles.sendButton}>
                <Text style={styles.sendText}>Enviar</Text>
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
  header: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#d6cab9' },
  brand: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  title: { fontSize: 29, fontWeight: '700', marginTop: 7 },
  connection: { fontSize: 12, color: '#69675e' },
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
});
