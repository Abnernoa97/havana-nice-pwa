/*
 * HAVANA NICE — ENTRY SHELL v1
 *
 * Structural separation only.
 * This module defines the ENTRY/LOGIN boundary without moving or rebuilding
 * any existing markup, CSS, authentication, or visual states.
 *
 * IMPORTANT:
 * - Existing login/session logic remains the source of truth.
 * - No authentication behavior is changed.
 * - No existing DOM is replaced.
 * - No visual styles are changed.
 */
(function () {
  "use strict";

  function getEntryScreen() {
    return document.getElementById("login-screen") || document.querySelector(".login-screen");
  }

  function isEntryVisible() {
    const entry = getEntryScreen();
    return !!entry && entry.classList.contains("is-active");
  }

  // Public, read-only boundary API for the next separation steps.
  window.HavanaNiceEntry = Object.freeze({
    getScreen: getEntryScreen,
    isVisible: isEntryVisible
  });

  document.documentElement.dataset.hnEntryShell = "ready";
})();
