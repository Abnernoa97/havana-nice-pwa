/* HAVANA NICE — MÚSICOS / PASSKEY V1
 * Based on the proven FAMILIA NOA WebAuthn flow, adapted to the
 * real HAVANA NICE musician session and existing Passkey Edge Functions.
 * Never authenticates automatically on page load.
 */
(() => {
  'use strict';

  const CREDENTIAL_KEY = 'hn-passkey-credential-id';
  const USERNAME_KEY = 'hn-passkey-username';
  const PASSKEY_KEY = 'hn-passkey-enabled';
  const PROFILE_KEY = 'hn_profile';

  let authBusy = false;
  let registrationBusy = false;
  let observer = null;

  const supported = () =>
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    !!window.isSecureContext;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function invoke(functionName, body) {
    const client = window.hnSupabase;
    if (!client) throw new Error('No se pudo conectar con HAVANA NICE.');
    const { data, error } = await client.functions.invoke(functionName, { body });
    if (error) throw new Error(error.message || 'No se pudo completar la operación.');
    if (data?.error) throw new Error(data.error);
    return data;
  }

  function profileFromSession() {
    try {
      const raw = sessionStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      const profile = JSON.parse(raw);
      return profile?.username ? profile : null;
    } catch (_) {
      return null;
    }
  }

  async function restoreNormalMusicianSession(username) {
    const client = window.hnSupabase;
    if (!client) throw new Error('No se pudo conectar con HAVANA NICE.');

    const { data, error } = await client.rpc('login_by_username', {
      p_username: username
    });

    if (error) throw new Error('No se pudo reconstruir la sesión del músico.');
    if (!data?.length) throw new Error('Este músico ya no tiene acceso activo.');

    const profile = data[0];
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify({
      id: profile.id,
      username: profile.username,
      role: profile.role
    }));

    return profile;
  }

  function setMessage(text) {
    const el = document.getElementById('passkeyMessage');
    if (el) el.textContent = text || '';
  }

  function addStyles() {
    if (document.getElementById('hn-passkey-style')) return;
    const style = document.createElement('style');
    style.id = 'hn-passkey-style';
    style.textContent = `
      .hn-passkey-login-wrap { margin-top: 12px; }
      .hn-passkey-login-button,
      .hn-passkey-setup-button {
        width: 100%;
        min-height: 48px;
        padding: 12px 16px;
        border: 1px solid rgba(229,189,98,.78);
        border-radius: 0;
        background: linear-gradient(105deg,rgba(229,189,98,.08),rgba(0,0,0,.30),rgba(229,189,98,.08));
        color: #fff1a8;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: .22em;
        text-transform: uppercase;
        backdrop-filter: blur(8px);
        transition: background .25s ease, border-color .25s ease, transform .15s ease, opacity .2s ease;
      }
      .hn-passkey-login-button:hover,
      .hn-passkey-setup-button:hover { border-color:#fff1a8; background:rgba(229,189,98,.12); }
      .hn-passkey-login-button:active,
      .hn-passkey-setup-button:active { transform:scale(.985); }
      .hn-passkey-login-button:disabled,
      .hn-passkey-setup-button:disabled { opacity:.5; cursor:wait; }
      #passkeyMessage {
        min-height: 18px;
        margin-top: 8px;
        color: rgba(244,241,232,.62);
        font-size: 8px;
        letter-spacing: .13em;
        line-height: 1.5;
        text-align: center;
        text-transform: uppercase;
      }
      .hn-passkey-setup-wrap { margin: 0 0 16px; }
      .hn-passkey-setup-button { min-height: 44px; font-size: 9px; letter-spacing:.18em; }
      .hn-passkey-status {
        margin-top: 7px;
        color: rgba(229,189,98,.72);
        font-size: 7px;
        letter-spacing:.16em;
        text-align:center;
        text-transform:uppercase;
      }
    `;
    document.head.appendChild(style);
  }

  async function authenticate() {
    if (authBusy || !supported()) return;
    const button = document.getElementById('hnPasskeyLogin');
    if (!button) return;

    authBusy = true;
    button.disabled = true;
    setMessage('Verificando huella / Face ID…');

    try {
      const credentialId = localStorage.getItem(CREDENTIAL_KEY) || '';
      const optionsPayload = credentialId ? { credentialId } : {};
      let optionsResult;

      try {
        optionsResult = await invoke('passkey-auth-options', optionsPayload);
      } catch (firstError) {
        // A stored credential can become stale after a device/browser reset.
        // Retry once with discoverable/all registered credentials.
        if (!credentialId) throw firstError;
        localStorage.removeItem(CREDENTIAL_KEY);
        optionsResult = await invoke('passkey-auth-options', {});
      }

      const { startAuthentication } = await import('https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@13.2.2/+esm');
      const response = await Promise.race([
        startAuthentication({ optionsJSON: optionsResult.options }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('La verificación tardó demasiado. Puedes entrar con tu nombre.')), 10000))
      ]);

      const verified = await invoke('passkey-auth-verify', { response });
      const username = verified?.user?.username;
      if (!username) throw new Error('No se pudo identificar al músico.');

      localStorage.setItem(PASSKEY_KEY, 'enabled');
      localStorage.setItem(USERNAME_KEY, username);
      localStorage.setItem(CREDENTIAL_KEY, response.id);

      // Rebuild exactly the same musician session used by normal login.
      const profile = await restoreNormalMusicianSession(username);
      setMessage('Acceso verificado.');

      // Use the existing app's session restoration path, not a second auth model.
      const enterHome = window.hnEnterHome;
      if (typeof enterHome === 'function') {
        enterHome(profile);
      } else {
        window.location.reload();
      }
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      if (name === 'NotAllowedError' || name === 'AbortError') {
        setMessage('Verificación cancelada. Puedes entrar con tu nombre.');
      } else {
        console.error('HAVANA NICE Passkey authentication error:', error);
        setMessage(error instanceof Error ? error.message : 'No se pudo entrar con huella / Face ID.');
      }
    } finally {
      authBusy = false;
      button.disabled = false;
    }
  }

  async function register(username) {
    if (registrationBusy || !supported() || !username) return;
    const button = document.getElementById('hnPasskeySetup');
    if (!button) return;

    registrationBusy = true;
    button.disabled = true;
    const status = document.getElementById('hnPasskeySetupStatus');
    if (status) status.textContent = 'Preparando…';

    try {
      const current = await invoke('passkey-status', { username });
      if (current?.enabled) {
        localStorage.setItem(PASSKEY_KEY, 'enabled');
        localStorage.setItem(USERNAME_KEY, current.user?.username || username);
        if (Array.isArray(current.credentialIds) && current.credentialIds[0]) {
          localStorage.setItem(CREDENTIAL_KEY, current.credentialIds[0]);
        }
        if (status) status.textContent = 'Huella / Face ID ya está activo en este dispositivo.';
        return;
      }

      const optionsResult = await invoke('passkey-options', {
        action: 'register',
        username
      });

      const { startRegistration } = await import('https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@13.2.2/+esm');
      const response = await startRegistration({ optionsJSON: optionsResult.options });

      const result = await invoke('passkey-register-verify', {
        username,
        response
      });

      if (!result?.verified) throw new Error('No se pudo registrar la credencial.');

      localStorage.setItem(PASSKEY_KEY, 'enabled');
      localStorage.setItem(USERNAME_KEY, username);
      localStorage.setItem(CREDENTIAL_KEY, response.id);
      if (status) status.textContent = 'Huella / Face ID activado en este dispositivo.';
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      if (name === 'NotAllowedError' || name === 'AbortError') {
        if (status) status.textContent = 'Activación cancelada.';
      } else {
        console.error('HAVANA NICE Passkey registration error:', error);
        if (status) status.textContent = error instanceof Error ? error.message : 'No se pudo activar la biometría.';
      }
    } finally {
      registrationBusy = false;
      button.disabled = false;
    }
  }

  async function checkStatus(username) {
    if (!username || !supported()) return false;
    try {
      const result = await invoke('passkey-status', { username });
      if (result?.enabled) {
        localStorage.setItem(PASSKEY_KEY, 'enabled');
        localStorage.setItem(USERNAME_KEY, result.user?.username || username);
        if (Array.isArray(result.credentialIds) && result.credentialIds[0]) {
          localStorage.setItem(CREDENTIAL_KEY, result.credentialIds[0]);
        }
      }
      return !!result?.enabled;
    } catch (_) {
      return false;
    }
  }

  function addLoginButton() {
    if (!supported()) return;
    if (document.getElementById('hnPasskeyLogin')) return;

    const loginButton = document.getElementById('loginButton');
    const area = loginButton?.parentElement;
    if (!loginButton || !area) return;

    const wrap = document.createElement('div');
    wrap.className = 'hn-passkey-login-wrap';
    wrap.innerHTML = `
      <button id="hnPasskeyLogin" class="hn-passkey-login-button" type="button">
        🔐 Entrar con huella / Face ID
      </button>
      <div id="passkeyMessage" aria-live="polite"></div>
    `;
    loginButton.after(wrap);
    document.getElementById('hnPasskeyLogin')?.addEventListener('click', () => void authenticate());
  }

  async function addSetupButton() {
    if (!supported()) return;
    if (document.getElementById('hnPasskeySetup')) return;

    const profile = profileFromSession();
    const home = document.getElementById('homeScreen');
    const modules = home?.querySelector('.modules');
    if (!profile || !home || !modules || !home.classList.contains('is-active')) return;

    const wrap = document.createElement('div');
    wrap.className = 'hn-passkey-setup-wrap';
    wrap.innerHTML = `
      <button id="hnPasskeySetup" class="hn-passkey-setup-button" type="button">
        🔐 Activar huella / Face ID
      </button>
      <div id="hnPasskeySetupStatus" class="hn-passkey-status" aria-live="polite"></div>
    `;
    modules.before(wrap);

    const button = document.getElementById('hnPasskeySetup');
    button?.addEventListener('click', () => void register(profile.username));

    const enabled = await checkStatus(profile.username);
    const status = document.getElementById('hnPasskeySetupStatus');
    if (enabled) {
      if (button) button.textContent = '✓ Huella / Face ID activo';
      if (status) status.textContent = 'Este dispositivo puede usar acceso biométrico.';
    }
  }

  function start() {
    if (!supported()) return;
    addStyles();
    addLoginButton();
    void addSetupButton();

    if (!observer) {
      observer = new MutationObserver(() => {
        addLoginButton();
        void addSetupButton();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
