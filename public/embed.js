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
  var BUTTON_SIZE = "140px";
  // Tooltip
  var tooltip = document.createElement("div");
  tooltip.innerHTML = '<strong style="display:block;margin-bottom:4px">hire.mn Туслагч</strong>Тест сонгох, мэргэжлийн зөвлөгөө авах<div style="position:absolute;right:-7px;top:50%;transform:translateY(-50%);width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:7px solid #1A1A1A"></div>';
  Object.assign(tooltip.style, {
    position: "fixed", bottom: "148px", right: "20px",
    background: "linear-gradient(135deg,#1A1A1A,#2D2D2D)",
    color: "#fff", padding: "12px 16px", borderRadius: "14px",
    fontSize: "13px", lineHeight: "1.6", maxWidth: "200px",
    pointerEvents: "none", opacity: "0",
    transition: "opacity 0.2s ease, transform 0.2s ease",
    transform: "translateX(8px)", zIndex: "2147483646",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
  });
  document.body.appendChild(tooltip);

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
          wrapper.style.width = "380px";
          wrapper.style.height = "720px";
          wrapper.style.bottom = "12px";
          wrapper.style.right = "12px";
          wrapper.style.left = "auto";
          wrapper.style.top = "auto";
          iframe.style.width = "380px";
          iframe.style.height = "720px";
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
