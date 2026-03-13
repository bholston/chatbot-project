/**
 * Eli Chatbot — Floating Widget
 *
 * Embed on any page with a single script tag:
 *   <script src="https://YOUR-CHATBOT-DOMAIN/widget.js" defer></script>
 *
 * Optional data attributes on the script tag:
 *   data-position="right"   (default) | "left"
 *   data-bottom="24"        pixels from bottom edge (default: 24)
 *   data-side="24"          pixels from side edge (default: 24)
 */
(function () {
  "use strict";

  // ── Config ─────────────────────────────────────────────────────────────────
  var COLORS = {
    primary: "#10284D",   // dark navy — bubble + header background
    gold: "#f4e28f",      // gold — "E" letter + accents
    blue: "#206DD1",      // secondary blue — hover states
    overlay: "rgba(0,0,0,0.45)",
  };

  var BUBBLE_SIZE = 60;   // px
  var PANEL_W = 400;      // px
  var PANEL_H = 620;      // px

  // Derive the chatbot origin from this script's src
  var scriptEl =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var origin = (function () {
    try {
      return new URL(scriptEl.src).origin;
    } catch (e) {
      return window.location.origin;
    }
  })();

  var embedUrl = origin + "/embed";

  // Read optional data-* config from the script tag
  var position = (scriptEl.getAttribute("data-position") || "right").toLowerCase();
  var bottomPx = parseInt(scriptEl.getAttribute("data-bottom") || "24", 10);
  var sidePx = parseInt(scriptEl.getAttribute("data-side") || "24", 10);

  // ── Styles ──────────────────────────────────────────────────────────────────
  var css = [
    "#eli-widget-bubble {",
    "  position: fixed;",
    "  bottom: " + bottomPx + "px;",
    "  " + position + ": " + sidePx + "px;",
    "  width: " + BUBBLE_SIZE + "px;",
    "  height: " + BUBBLE_SIZE + "px;",
    "  border-radius: 50%;",
    "  background: " + COLORS.primary + ";",
    "  color: " + COLORS.gold + ";",
    "  font-family: sans-serif;",
    "  font-size: 26px;",
    "  font-weight: 700;",
    "  line-height: " + BUBBLE_SIZE + "px;",
    "  text-align: center;",
    "  cursor: pointer;",
    "  box-shadow: 0 4px 20px rgba(0,0,0,0.35);",
    "  z-index: 99998;",
    "  transition: transform 0.2s ease, box-shadow 0.2s ease;",
    "  user-select: none;",
    "  border: 2px solid " + COLORS.gold + ";",
    "}",
    "#eli-widget-bubble:hover {",
    "  transform: scale(1.08);",
    "  box-shadow: 0 6px 28px rgba(0,0,0,0.45);",
    "  background: " + COLORS.blue + ";",
    "}",
    "#eli-widget-bubble.eli-open {",
    "  transform: scale(0.9);",
    "}",

    "#eli-widget-panel {",
    "  position: fixed;",
    "  bottom: " + (bottomPx + BUBBLE_SIZE + 12) + "px;",
    "  " + position + ": " + sidePx + "px;",
    "  width: " + PANEL_W + "px;",
    "  height: " + PANEL_H + "px;",
    "  border-radius: 16px;",
    "  overflow: hidden;",
    "  box-shadow: 0 8px 40px rgba(0,0,0,0.55);",
    "  z-index: 99999;",
    "  display: flex;",
    "  flex-direction: column;",
    "  background: " + COLORS.primary + ";",
    "  border: 1px solid rgba(255,255,255,0.1);",
    "  transition: opacity 0.2s ease, transform 0.2s ease;",
    "  opacity: 0;",
    "  transform: translateY(16px) scale(0.97);",
    "  pointer-events: none;",
    "}",
    "#eli-widget-panel.eli-open {",
    "  opacity: 1;",
    "  transform: translateY(0) scale(1);",
    "  pointer-events: auto;",
    "}",

    "#eli-widget-panel iframe {",
    "  flex: 1;",
    "  width: 100%;",
    "  border: none;",
    "  background: transparent;",
    "}",

    // Mobile: full-screen panel
    "@media (max-width: 460px) {",
    "  #eli-widget-panel {",
    "    width: 100vw;",
    "    height: 100vh;",
    "    bottom: 0;",
    "    " + position + ": 0;",
    "    border-radius: 0;",
    "  }",
    "}",
  ].join("\n");

  // ── DOM ─────────────────────────────────────────────────────────────────────
  function init() {
    // Inject styles
    var style = document.createElement("style");
    style.id = "eli-widget-styles";
    style.textContent = css;
    document.head.appendChild(style);

    // Bubble button
    var bubble = document.createElement("div");
    bubble.id = "eli-widget-bubble";
    bubble.setAttribute("role", "button");
    bubble.setAttribute("aria-label", "Chat with Eli");
    bubble.setAttribute("tabindex", "0");
    bubble.textContent = "E";
    document.body.appendChild(bubble);

    // Panel
    var panel = document.createElement("div");
    panel.id = "eli-widget-panel";
    panel.setAttribute("aria-label", "Eli chat window");
    panel.setAttribute("role", "dialog");

    // iframe — lazy-loaded on first open
    var iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Eli Chatbot");
    iframe.setAttribute("allow", "clipboard-write");
    iframe.setAttribute("loading", "lazy");
    panel.appendChild(iframe);

    document.body.appendChild(panel);

    // ── Interaction ─────────────────────────────────────────────────────────
    var isOpen = false;
    var iframeLoaded = false;

    function openPanel() {
      if (!iframeLoaded) {
        iframe.src = embedUrl;
        iframeLoaded = true;
      }
      isOpen = true;
      panel.classList.add("eli-open");
      bubble.classList.add("eli-open");
      bubble.setAttribute("aria-expanded", "true");
    }

    function closePanel() {
      isOpen = false;
      panel.classList.remove("eli-open");
      bubble.classList.remove("eli-open");
      bubble.setAttribute("aria-expanded", "false");
    }

    bubble.addEventListener("click", function () {
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    bubble.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isOpen) {
          closePanel();
        } else {
          openPanel();
        }
      }
      if (e.key === "Escape" && isOpen) {
        closePanel();
        bubble.focus();
      }
    });

    // Close on Escape from anywhere
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) {
        closePanel();
        bubble.focus();
      }
    });

    // Optional: close panel when clicking outside on mobile
    document.addEventListener("click", function (e) {
      if (
        isOpen &&
        !panel.contains(e.target) &&
        e.target !== bubble
      ) {
        closePanel();
      }
    });
  }

  // Run after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
