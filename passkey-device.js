/* HAVANA NICE — MÚSICOS / DEVICE PASSKEY
 * Platform authenticator flow adapted from FAMILIA NOA.
 * Supports fingerprint, Face ID, device PIN/pattern/passkey where the
 * device/browser exposes it. Never starts authentication automatically.
 */
(() => {
  'use strict';

  const CRED_KEY = 'hn-passkey-credential-id';
  const ENABLED_KEY = 'hn-passkey-enabled';
  const PROFILE_KEY = 'hn_profile';
  const PASSKEY_CDN = 'https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@13.2.2/+esm';
  let authBusy = false;
  let registerBusy = false;

  function supported() {
    return !!(window.PublicKeyCredential && window.isSecureContext && navigator.credentials);
  }

  function invoke(name, body) {
    const client = window.hnSupabase;
    if (!client) return Promise.reject(new Error('No se pudo conectar con HAVANA NICE.'));
    return client.functions.invoke(name, { body }).then(({ data, error }) => {
      if (error) throw new Error(error.message || 'No se pudo completar la operación.');
      if (data?.error) throw new Error(data.error);
      return data || {};
    });
  }

  function profile() {
    try {
      const value = sessionStorage.getItem(PROFILE_KEY);
      const parsed = value ? JSON.parse(value) : null;
      return parsed?.username ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function message(text) {
    const el = document.getElementById('loginMessage');
    if (el) el.textContent = text || '';
  }

  function status(text) {
    const el = document.getElementById('hnPasskeyStatus');
    if (el) el.textContent = text || '';
  }

  async function normalSession(username) {
    const client = window.hnSupabase;
    if (!client) throw new Error('No se pudo conectar con HAVANA NICE.');
    const { data, error } = await client.rpc('login_by_username', { p_username: username });
    if (error) throw new Error('No se pudo reconstruir la sesión del músico.');
    if (!data?.length) throw new Error('Este músico ya no tiene acceso activo.');
    const p = data[0];
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify({ id: p.id, username: p.username, role: p.role }));
    return p;
  }

  function enter(profileValue) {
    if (typeof window.hnEnterHome === 'function') {
      window.hnEnterHome(profileValue);
      return;
    }
    const name = document.getElementById('welcomeName');
    const role = document.getElementById('welcomeRole');
    if (name) name.textContent = profileValue.username || '';
    if (role) role.textContent = profileValue.role || 'Músico de HAVANA NICE';
    document.getElementById('loginScreen')?.classList.remove('is-active');
    document.getElementById('homeScreen')?.classList.add('is-active');
  }

  async function authenticate() {
    if (authBusy || !supported()) return;
    const button = document.getElementById('hnPasskeyLogin');
    if (!button) return;
    authBusy = true;
    button.disabled = true;
    message('Verificando huella / Face ID / clave del dispositivo…');
    try {
      const credentialId = localStorage.getItem(CRED_KEY) || '';
      let optionsResult = await invoke('passkey-auth-options', credentialId ? { credentialId } : {});
      const { startAuthentication } = await import(PASSKEY_CDN);
      let response;
      try {
        response = await Promise.race([
          startAuthentication({ optionsJSON: optionsResult.options || optionsResult }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('PASSKEY_TIMEOUT')), 15000))
        ]);
      } catch (firstError) {
        if (!credentialId) throw firstError;
        localStorage.removeItem(CRED_KEY);
        optionsResult = await invoke('passkey-auth-options', {});
        response = await Promise.race([
          startAuthentication({ optionsJSON: optionsResult.options || optionsResult }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('PASSKEY_TIMEOUT')), 15000))
        ]);
      }
      const verified = await invoke('passkey-auth-verify', { response });
      const username = verified?.user?.username;
      if (!username) throw new Error('No se pudo identificar al músico.');
      const p = await normalSession(username);
      localStorage.setItem(ENABLED_KEY, '1');
      localStorage.setItem(CRED_KEY, response.id);
      message('Acceso verificado.');
      enter(p);
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
        message('Verificación cancelada. Puedes entrar con tu nombre.');
      } else if (error?.message === 'PASSKEY_TIMEOUT') {
        message('La verificación tardó demasiado. Puedes entrar con tu nombre.');
      } else {
        console.error('HAVANA NICE device passkey error:', error);
        message('No se pudo usar la huella / Face ID. Puedes entrar con tu nombre.');
      }
    } finally {
      authBusy = false;
      button.disabled = false;
    }
  }

  async function register() {
    const p = profile();
    if (registerBusy || !supported() || !p?.username) return;
    const button = document.getElementById('hnPasskeySetup');
    if (!button) return;
    registerBusy = true;
    button.disabled = true;
    status('Preparando acceso del dispositivo…');
    try {
      const current = await invoke('passkey-status', { username: p.username });
      if (current?.enabled && current.credentialIds?.[0]) {
        localStorage.setItem(ENABLED_KEY, '1');
        localStorage.setItem(CRED_KEY, current.credentialIds[0]);
        button.textContent = '✓ HUella / FACE ID ACTIVO';
        status('Este dispositivo ya tiene un acceso biométrico registrado.');
        return;
      }
      const optionsResult = await invoke('passkey-options', { action: 'register', username: p.username });
      const { startRegistration } = await import(PASSKEY_CDN);
      const response = await Promise.race([
        startRegistration({ optionsJSON: optionsResult.options || optionsResult }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PASSKEY_TIMEOUT')), 15000))
      ]);
      const result = await invoke('passkey-register-verify', { username: p.username, response });
      if (!result?.verified) throw new Error('No se pudo registrar la credencial.');
      localStorage.setItem(ENABLED_KEY, '1');
      localStorage.setItem(CRED_KEY, response.id);
      button.textContent = '✓ HUella / FACE ID ACTIVO';
      status('Acceso del dispositivo activado.');
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') status('Activación cancelada.');
      else if (error?.message === 'PASSKEY_TIMEOUT') status('La activación tardó demasiado.');
      else {
        console.error('HAVANA NICE device passkey registration error:', error);
        status('No se pudo activar el acceso del dispositivo.');
      }
    } finally {
      registerBusy = false;
      button.disabled = false;
    }
  }

  function renderLogin() {
    if (!supported() || document.getElementById('hnPasskeyLogin')) return;
    const area = document.querySelector('.login-area');
    const loginButton = document.getElementById('loginButton');
    if (!area || !loginButton || localStorage.getItem(ENABLED_KEY) !== '1' || !localStorage.getItem(CRED_KEY)) return;
    const button = document.createElement('button');
    button.id = 'hnPasskeyLogin';
    button.type = 'button';
    button.className = 'login-button';
    button.style.marginTop = '10px';
    button.textContent = '🔐 ENTRAR CON HUELLA / FACE ID / CLAVE DEL DISPOSITIVO';
    button.addEventListener('click', () => void authenticate());
    loginButton.after(button);
  }

  function renderSetup() {
    if (!supported() || document.getElementById('hnPasskeySetup')) return;
    const p = profile();
    const home = document.getElementById('homeScreen');
    const modules = home?.querySelector('.modules');
    if (!p || !home?.classList.contains('is-active') || !modules) return;
    const wrap = document.createElement('div');
    wrap.id = 'hnPasskeySetupWrap';
    wrap.style.cssText = 'margin:0 0 14px;';
    wrap.innerHTML = '<button id="hnPasskeySetup" type="button" class="login-button" style="height:46px;margin-top:0;font-size:9px;letter-spacing:.18em;">🔐 ACTIVAR HUELLA / FACE ID</button><div id="hnPasskeyStatus" aria-live="polite" style="min-height:16px;margin-top:7px;color:rgba(229,189,98,.72);font-size:7px;letter-spacing:.14em;text-align:center;text-transform:uppercase;"></div>';
    modules.before(wrap);
    document.getElementById('hnPasskeySetup')?.addEventListener('click', () => void register());
    void syncSetupState(p.username);
  }

  async function syncSetupState(username) {
    try {
      const result = await invoke('passkey-status', { username });
      if (result?.enabled && result.credentialIds?.[0]) {
        localStorage.setItem(ENABLED_KEY, '1');
        localStorage.setItem(CRED_KEY, result.credentialIds[0]);
        const button = document.getElementById('hnPasskeySetup');
        if (button) button.textContent = '✓ HUella / FACE ID ACTIVO';
        status('Acceso del dispositivo disponible.');
      }
    } catch (_) {}
  }

  function init() {
    if (!supported()) return;
    renderLogin();
    renderSetup();
    const observer = new MutationObserver(() => {
      renderLogin();
      renderSetup();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  window.HNDevicePasskey = { supported, authenticate, register };
})();
