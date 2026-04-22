; (function () {
  "use strict";

  // Prevent double-init
  if (window.__HireMnWidget) return;
  window.__HireMnWidget = true;

  // Auto-detect host from the script tag src
  var scripts = document.getElementsByTagName("script");
  var me = scripts[scripts.length - 1];
  var ORIGIN = me.src ? me.src.replace(/\/embed\.js(\?.*)?$/, "") : "";

  if (!ORIGIN) {
    console.error("[hire.mn Widget] Could not detect widget origin from script src.");
    return;
  }

  // Button size with padding for shadow/pulse effects
  var BUTTON_SIZE = "160px";

  // ── Wrapper div (fixed, bottom-right) ────────────────────────────────────
  var wrapper = document.createElement("div");
  wrapper.id = "hiremn-widget-root";
  wrapper.style.cssText =
    "position:fixed !important;" +
    "bottom:12px !important;" +
    "right:12px !important;" +
    "z-index:2147483647 !important;" +
    "pointer-events:none !important;" +
    "overflow:visible !important;" +
    "width:" + BUTTON_SIZE + " !important;" +
    "height:" + BUTTON_SIZE + " !important;" +
    "background:transparent !important;";

  // ── iframe ────────────────────────────────────────────────────────────────
  var iframe = document.createElement("iframe");
  iframe.src = ORIGIN + "/embed";
  iframe.id = "hiremn-widget-iframe";
  iframe.title = "hire.mn AI Assistant";
  iframe.allow = "clipboard-write";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("scrolling", "no");
  iframe.style.cssText =
    "position:absolute !important;" +
    "bottom:0 !important;" +
    "right:0 !important;" +
    "width:" + BUTTON_SIZE + " !important;" +
    "height:" + BUTTON_SIZE + " !important;" +
    "border:none !important;" +
    "background:transparent !important;" +
    "pointer-events:auto !important;" +
    "display:block !important;" +
    "overflow:visible !important;" +
    "color-scheme:light !important;" +
    "transition:width 0.3s ease, height 0.3s ease !important;";

  // ── PostMessage for size changes from widget ─────────────────────────────
  window.addEventListener("message", function (e) {
    if (!e.data || !e.data.type) return;

    if (e.data && e.data.type === "HIREMN_RESIZE") {
      var isOpen = e.data.isOpen;
      var mobile = window.innerWidth <= 480;

      if (isOpen) {
        if (mobile) {
          wrapper.style.width = "100vw";
          wrapper.style.height = "100vh";
          wrapper.style.bottom = "0";
          wrapper.style.right = "0";
          wrapper.style.left = "0";
          wrapper.style.top = "0";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
        } else {
          wrapper.style.width = "420px";
          wrapper.style.height = "800px";
          wrapper.style.bottom = "12px";
          wrapper.style.right = "12px";
          wrapper.style.left = "auto";
          wrapper.style.top = "auto";
          iframe.style.width = "420px";
          iframe.style.height = "800px";
        }
      } else {
        // Closed - button size with padding
        wrapper.style.width = BUTTON_SIZE;
        wrapper.style.height = BUTTON_SIZE;
        wrapper.style.bottom = "12px";
        wrapper.style.right = "12px";
        wrapper.style.left = "auto";
        wrapper.style.top = "auto";
        iframe.style.width = BUTTON_SIZE;
        iframe.style.height = BUTTON_SIZE;
      }
    }

    if (e.data && e.data.type === "HIREMN_OPEN_URL" && e.data.url) {
      window.open(e.data.url, "_blank", "noopener,noreferrer");
    }
  });

  // Error handling
  iframe.addEventListener("error", function (e) {
    console.error("[hire.mn Widget] iframe failed to load:", e);
    wrapper.style.display = "none";
  });

  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);
})();
