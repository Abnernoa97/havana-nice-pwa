/* HAVANA NICE — CHAT DE INFORMACIÓN / REFINED VISUAL V1 */
(() => {
  'use strict';
  if (window.__hnChatVisualV1) return;
  window.__hnChatVisualV1 = true;

  const style = document.createElement('style');
  style.id = 'hn-chat-visual-v1';
  style.textContent = `
    /* Home module: elegant emerald distinction, never neon */
    .hn-chat-module {
      background: linear-gradient(135deg, rgba(9,31,22,.94), rgba(5,18,13,.96)) !important;
      border-color: rgba(92,143,112,.52) !important;
      box-shadow: 0 12px 30px rgba(0,0,0,.18), inset 0 0 0 1px rgba(213,181,104,.05) !important;
    }
    .hn-chat-module:hover,
    .hn-chat-module:focus-visible {
      background: linear-gradient(135deg, rgba(12,39,27,.96), rgba(6,22,15,.98)) !important;
      border-color: rgba(125,169,139,.68) !important;
    }

    /* Chat screen */
    #hn-chat-screen {
      background: linear-gradient(180deg, rgba(3,13,9,.18), rgba(3,13,9,.72));
    }
    #hn-chat-screen .hn-chat-head-title {
      letter-spacing: .055em;
      text-shadow: 0 2px 18px rgba(0,0,0,.32);
    }
    #hn-chat-screen .hn-chat-head-sub {
      color: rgba(194,211,201,.55);
    }

    /* Message cards: deep emerald glass instead of bright green */
    #hn-chat-screen .hn-chat-bubble {
      border: 1px solid rgba(95,137,112,.34) !important;
      border-radius: 16px !important;
      background: linear-gradient(145deg, rgba(12,30,22,.94), rgba(6,17,12,.95)) !important;
      box-shadow: 0 8px 24px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.025) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    #hn-chat-screen .hn-chat-row.mine .hn-chat-bubble {
      border-color: rgba(103,153,121,.58) !important;
      background: linear-gradient(145deg, rgba(18,54,38,.96), rgba(8,30,20,.97)) !important;
      box-shadow: 0 9px 26px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.035) !important;
    }
    #hn-chat-screen .hn-chat-bubble.hn-chat-selected {
      border-color: rgba(218,190,112,.78) !important;
      box-shadow: 0 0 0 1px rgba(218,190,112,.12), 0 10px 28px rgba(0,0,0,.22) !important;
    }

    #hn-chat-screen .hn-chat-sender,
    #hn-chat-screen .hn-chat-audio-icon,
    #hn-chat-screen .hn-chat-recording-status,
    #hn-chat-screen .hn-chat-reply-label,
    #hn-chat-screen .hn-chat-quoted-sender {
      color: #d8bd72;
    }
    #hn-chat-screen .hn-chat-text { color: rgba(246,244,238,.94); }
    #hn-chat-screen .hn-chat-time { color: rgba(215,222,217,.46); }

    /* Media: rounded editorial cards */
    #hn-chat-screen .hn-chat-media-grid { gap: 7px; margin-top: 5px; }
    #hn-chat-screen .hn-chat-media-item {
      border: 1px solid rgba(102,145,119,.34) !important;
      border-radius: 13px !important;
      background: #07110c !important;
      box-shadow: 0 5px 16px rgba(0,0,0,.18);
    }
    #hn-chat-screen .hn-chat-photo-button,
    #hn-chat-screen .hn-chat-media-item img,
    #hn-chat-screen .hn-chat-media-item video {
      border-radius: 12px !important;
    }

    /* Composer: friendlier, softer controls */
    #hn-chat-screen .hn-chat-compose {
      border-top-color: rgba(104,144,118,.22);
    }
    #hn-chat-screen .hn-chat-input {
      border: 1px solid rgba(101,142,116,.44) !important;
      border-radius: 18px !important;
      background: linear-gradient(145deg, rgba(9,22,16,.92), rgba(3,12,8,.94)) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
    }
    #hn-chat-screen .hn-chat-input:focus {
      border-color: rgba(166,143,77,.72) !important;
      box-shadow: 0 0 0 2px rgba(166,143,77,.08), inset 0 1px 0 rgba(255,255,255,.03);
    }
    #hn-chat-screen .hn-chat-mic,
    #hn-chat-screen .hn-chat-attach {
      border-color: rgba(199,171,96,.66) !important;
      background: rgba(7,17,12,.82) !important;
      color: #d9bf78 !important;
      transition: transform .18s ease, background .18s ease, border-color .18s ease;
    }
    #hn-chat-screen .hn-chat-mic:hover,
    #hn-chat-screen .hn-chat-attach:hover {
      background: rgba(25,55,39,.88) !important;
      transform: translateY(-1px);
    }
    #hn-chat-screen .hn-chat-send {
      border-radius: 14px !important;
      border-color: rgba(199,171,96,.62) !important;
      background: linear-gradient(145deg, rgba(16,45,31,.94), rgba(6,22,15,.96)) !important;
      color: #e2c984 !important;
    }

    /* Reply / recording panels */
    #hn-chat-screen .hn-chat-reply,
    #hn-chat-screen .hn-chat-recording {
      background: rgba(5,16,11,.86) !important;
      border-color: rgba(104,144,118,.22) !important;
    }
    #hn-chat-screen .hn-chat-reply-line { background: #bda260 !important; }

    @media (max-width: 600px) {
      #hn-chat-screen .hn-chat-bubble { border-radius: 15px !important; }
      #hn-chat-screen .hn-chat-media-item { border-radius: 12px !important; }
    }
  `;
  document.head.appendChild(style);
})();
