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
    console.error("[hire.mn Widget] Could not detect widget origin from script src.");
    return;
  }

  console.log("[hire.mn Widget] Initializing from:", ORIGIN);

  // ── Wrapper div (fixed, bottom-right) ────────────────────────────────────
  var wrapper = document.createElement("div");
  wrapper.id = "hiremn-widget-root";
  wrapper.style.cssText =
    "position:fixed !important;" +
    "bottom:0 !important;" +
    "right:0 !important;" +
    "z-index:2147483647 !important;" +
    "pointer-events:none !important;" +
    "overflow:visible !important;" +
    "width:420px;" +
    "height:680px;" +
    "max-width:100vw;" +
    "max-height:100vh;" +
    "background:transparent !important;";

  // ── iframe ────────────────────────────────────────────────────────────────
  var iframe = document.createElement("iframe");
  iframe.src = ORIGIN + "/embed";
  iframe.id  = "hiremn-widget-iframe";
  iframe.title = "hire.mn AI Assistant";
  iframe.allow = "clipboard-write";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("scrolling", "no");
  iframe.style.cssText =
    "width:100% !important;" +
    "height:100% !important;" +
    "border:none !important;" +
    "background:transparent !important;" +
    "pointer-events:all !important;" +
    "display:block !important;" +
    "color-scheme:light !important;";

  // ── Responsive sizing ─────────────────────────────────────────────────────
  function resize() {
    var mobile = window.innerWidth <= 480;
    var docHeight = document.documentElement.clientHeight;
    var viewportHeight = window.innerHeight;
    var dvh = viewportHeight; // Use innerHeight which respects mobile viewport
    
    if (mobile) {
      wrapper.style.width = "100vw";
      wrapper.style.height = dvh + "px"; // Use exact px instead of dvh
      wrapper.style.maxHeight = "100vh";
      wrapper.style.bottom = "0";
      wrapper.style.right = "0";
      wrapper.style.left = "0";
      wrapper.style.top = "0"; // Ensure it fills from top
    } else {
      wrapper.style.width = "420px";
      wrapper.style.height = "680px";
      wrapper.style.maxHeight = "100vh";
      wrapper.style.left = "auto";
      wrapper.style.top = "auto";
    }
  }
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", function() {
    setTimeout(resize, 100);
  });

  // Error handling
  iframe.addEventListener("error", function (e) {
    console.error("[hire.mn Widget] iframe failed to load:", e);
    wrapper.style.display = "none";
  });

  // Enable pointer events once iframe has loaded
  iframe.addEventListener("load", function () {
    console.log("[hire.mn Widget] iframe loaded successfully");
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
  console.log("[hire.mn Widget] Widget appended to DOM");
})();
