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

  // Futuristic button size with glow ring space
  var BUTTON_SIZE = "240px";
  var BUTTON_HEIGHT = "90px";

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
    "height:" + BUTTON_HEIGHT + " !important;" +
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
    "height:" + BUTTON_HEIGHT + " !important;" +
    "border:none !important;" +
    "background:transparent !important;" +
    "pointer-events:auto !important;" +
    "display:block !important;" +
    "overflow:visible !important;" +
    "color-scheme:light !important;" +
    "transition:width 0.3s ease, height 0.3s ease !important;";

  // ══════════════════════════════════════════════════════════════════════════
  // EXTERNAL API - hire.mn developers can use these methods
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * HireMnChat API
   * 
   * Usage from hire.mn website:
   * 
   * // Open chatbot and send AI analysis request with report data
   * window.HireMnChat.openWithAnalysis({
   *   reportTitle: "Personality Test Results",
   *   reportData: { ... },           // Report content/data
   *   userInfo: { name: "...", email: "..." },
   *   analysisResults: { ... },      // Pre-computed analysis if any
   *   prompt: "Миний тестийн үр дүнг тайлбарлана уу"  // Optional custom prompt
   * });
   * 
   * // Just open the chatbot
   * window.HireMnChat.open();
   * 
   * // Close the chatbot
   * window.HireMnChat.close();
   * 
   * // Check if chatbot is open
   * window.HireMnChat.isOpen();
   */
  
  var chatIsOpen = false;
  
  window.HireMnChat = {
    // Open chatbot
    open: function() {
      iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, "*");
    },
    
    // Close chatbot
    close: function() {
      iframe.contentWindow.postMessage({ type: "HIREMN_CLOSE" }, "*");
    },
    
    // Check if open
    isOpen: function() {
      return chatIsOpen;
    },
    
    // Open chatbot and trigger AI analysis with data
    openWithAnalysis: function(data) {
      // Open the chatbot first
      iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, "*");
      
      // Then send the analysis data (with small delay to ensure widget is open)
      setTimeout(function() {
        iframe.contentWindow.postMessage({
          type: "HIREMN_AI_ANALYSIS",
          payload: {
            reportTitle: data.reportTitle || "",
            reportData: data.reportData || {},
            userInfo: data.userInfo || {},
            analysisResults: data.analysisResults || {},
            prompt: data.prompt || "Миний тестийн үр дүнг задлан шинжилж, надад зөвлөгөө өгнө үү."
          }
        }, "*");
      }, 500);
    },
    
    // Send a message to the chatbot
    sendMessage: function(message) {
      iframe.contentWindow.postMessage({
        type: "HIREMN_SEND_MESSAGE",
        message: message
      }, "*");
    }
  };

  // ── PostMessage for size changes from widget ─────────────────────────────
  window.addEventListener("message", function (e) {
    if (!e.data || !e.data.type) return;

    if (e.data && e.data.type === "HIREMN_RESIZE") {
      chatIsOpen = e.data.isOpen;
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
          wrapper.style.height = "680px";
          wrapper.style.bottom = "12px";
          wrapper.style.right = "12px";
          wrapper.style.left = "auto";
          wrapper.style.top = "auto";
          iframe.style.width = "420px";
          iframe.style.height = "680px";
        }
      } else {
        // Closed - futuristic floating button
        wrapper.style.width = BUTTON_SIZE;
        wrapper.style.height = BUTTON_HEIGHT;
        wrapper.style.bottom = "12px";
        wrapper.style.right = "12px";
        wrapper.style.left = "auto";
        wrapper.style.top = "auto";
        iframe.style.width = BUTTON_SIZE;
        iframe.style.height = BUTTON_HEIGHT;
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
