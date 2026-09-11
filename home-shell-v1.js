/*
 * HAVANA NICE — HOME SHELL v1
 *
 * Structural separation only.
 * This module owns the HOME shell boundary without moving or rebuilding
 * any existing markup, CSS, feature modules, or approved visual states.
 *
 * IMPORTANT:
 * - No feature module is lazy-loaded here.
 * - No existing DOM is replaced.
 * - No visual styles are changed.
 * - Existing login/session logic remains the source of truth.
 */
(function () {
  "use strict";

  function getScreen(id) {
    return document.getElementById(id);
  }

  function getHomeScreen() {
    return getScreen("home-screen") || document.querySelector(".home-screen");
  }

  function getEntryScreen() {
    return getScreen("login-screen") || document.querySelector(".login-screen");
  }

  function isHomeVisible() {
    const home = getHomeScreen();
    return !!home && home.classList.contains("is-active");
  }

  // Public, read-only shell API for the next separation steps.
  // Existing app behavior is intentionally untouched in v1.
  window.HavanaNiceHome = Object.freeze({
    getScreen: getHomeScreen,
    getEntryScreen,
    isHomeVisible
  });

  document.documentElement.dataset.hnHomeShell = "ready";
})();
