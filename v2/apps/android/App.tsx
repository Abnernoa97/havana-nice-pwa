import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import {
  fetchBackendHealth, getChatMessages, newClientMessageId,
  openChatSocket, reconcileChatMessages, startLabChatSession,
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

  useEffect(() => {
    void fetchBackendHealth()
      .then(value => setApiState(value.ok ? 'conectada' : 'error'))
      .catch(() => setApiState('error'));
    return () => socket.current?.close();
  }, []);

  function connect(next: ChatSession) {
    socket.current?.close();
    setConnection('conectando…');
    const ws = openChatSocket(next);
    socket.current = ws;
    ws.onopen = () => {
      setConnection('en vivo');
      setError('');
      void getChatMessages(next)
        .then(history => setMessages(before => reconcileChatMessages(before, history)))
        .catch(reason => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el historial'));
    };
    ws.onmessage = event => {
      try {
        const item = JSON.parse(String(event.data)) as ChatServerEvent;
        if (item.type === 'chat.message') {
          setMessages(before => reconcileChatMessages(before, [item.message]));
        } else if (item.type === 'chat.error') {
          setError(item.error);
        }
      } catch {
        setError('Evento no válido');
      }
    };
    ws.onclose = () => setConnection('desconectado');
    ws.onerror = () => setConnection('sin conexión');
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
    } finally {
      setJoining(false);
    }
  }

  function send() {
    const text = draft.trim();
    if (!session || !text || !socket.current || socket.current.readyState !== WebSocket.OPEN) return;
    const clientMessageId = newClientMessageId();
    setMessages(before => reconcileChatMessages(before, [{
      seq: 0, clientMessageId, senderId: session.actorId, senderName: session.displayName,
      text, sentAt: new Date().toISOString(), pending: true,
    }]));
    socket.current.send(JSON.stringify({ type: 'chat.send', clientMessageId, text }));
    setDraft('');
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
            <Text style={styles.overline}>CHAT 1 · TEXTO EN TIEMPO REAL</Text>
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
                  <View key={message.senderId + ':' + message.clientMessageId} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                    {!mine && <Text style={styles.sender}>{message.senderName}</Text>}
                    <Text style={[styles.bubbleText, mine && styles.mineText]}>{message.text}</Text>
                    <Text style={[styles.messageTime, mine && styles.mineMeta]}>
                      {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.pending ? ' · enviando' : ''}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
            {connection !== 'en vivo' ? (
              <Pressable onPress={() => connect(session)} style={styles.reconnect}>
                <Text style={styles.reconnectText}>Reconectar</Text>
              </Pressable>
            ) : null}
            <View style={styles.composer}>
              <TextInput
                accessibilityLabel="Escribir mensaje" style={styles.draft} value={draft}
                onChangeText={setDraft} maxLength={2000} multiline
                placeholder="Escribe un mensaje…" placeholderTextColor="#888"
              />
              <Pressable onPress={send} disabled={!draft.trim() || connection !== 'en vivo'} style={styles.sendButton}>
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
  screen: { flex: 1, backgroundColor: '#F3EDDF' },
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
