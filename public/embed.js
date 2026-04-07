;(function () {
  "use strict";

  // Prevent double-init
  if (window.__HireMnWidget) return;
  window.__HireMnWidget = true;

  // Auto-detect host from the script tag src
  var scripts = document.getElementsByTagName("script");
  var me = scripts[scripts.length - 1];
  var ORIGIN = me.src ? me.src.replace(/\/embed\.js(\?.*)?$/, "") : "";

  if (!ORIGIN) {
    console.warn("[hire.mn] Could not detect widget origin from script src.");
    return;
  }

  // ── Wrapper div (fixed, bottom-right) ────────────────────────────────────
  var wrapper = document.createElement("div");
  wrapper.id = "hiremn-widget-root";
  wrapper.style.cssText =
    "position:fixed;bottom:0;right:0;z-index:2147483647;" +
    "pointer-events:none;overflow:hidden;" +
    "width:420px;height:680px;max-width:100vw;max-height:100%;";

  // ── iframe ────────────────────────────────────────────────────────────────
  var iframe = document.createElement("iframe");
  iframe.src = ORIGIN + "/embed";
  iframe.id  = "hiremn-widget-iframe";
  iframe.title = "hire.mn AI Assistant";
  iframe.allow = "clipboard-write";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("scrolling", "no");
  iframe.style.cssText =
    "width:100%;height:100%;border:none;background:transparent;" +
    "pointer-events:all;display:block;color-scheme:light;";

  // ── Responsive sizing ─────────────────────────────────────────────────────
  function resize() {
    var mobile = window.innerWidth <= 480;
    wrapper.style.width  = mobile ? "100vw" : "420px";
    wrapper.style.height = mobile ? "100dvh" : "680px";
    wrapper.style.maxHeight = mobile ? "100%" : "100%";
  }
  resize();
  window.addEventListener("resize", resize);

  // Enable pointer events once iframe has loaded
  iframe.addEventListener("load", function () {
    wrapper.style.pointerEvents = "none"; // wrapper stays pass-through
    iframe.style.pointerEvents  = "all";  // iframe itself is interactive
  });

  // ── PostMessage bridge: open test links in parent tab ─────────────────────
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;
    if (e.data && e.data.type === "HIREMN_OPEN_URL" && e.data.url) {
      window.open(e.data.url, "_blank", "noopener,noreferrer");
    }
  });

  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);
})();
