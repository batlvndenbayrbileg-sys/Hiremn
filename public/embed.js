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
  // Note: the 3D Spline mascot has ~25px overflow on all sides plus a -4px
  // bottom offset, so the iframe must be tall/wide enough to contain it,
  // otherwise the mascot gets clipped at the iframe edge.
  var BUTTON_SIZE = "320px";
  var BUTTON_HEIGHT = "170px";

  // ── Wrapper div (fixed, bottom-right with extra margin) ────────────────────────────────────
  var wrapper = document.createElement("div");
  wrapper.id = "hiremn-widget-root";
  wrapper.style.cssText =
    "position:fixed !important;" +
    "bottom:10px !important;" +
    "right:20px !important;" +
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // MAIN METHOD: Fetch test results from API and send to AI for analysis
    // ═══════════════════════════════════════════════════════════════════════
    analyzeFromAPI: function(options) {
      var apiUrl = options.apiUrl;           // Required: hire.mn API endpoint
      var headers = options.headers || {};   // Optional: Auth headers, etc.
      var testName = options.testName || "Тест";
      var prompt = options.prompt || "Миний тестийн үр дүнг задлан шинжилж, дэлгэрэнгүй тайлбар болон зөвлөгөө өгнө үү.";
      
      if (!apiUrl) {
        console.error("[HireMnChat] apiUrl is required");
        return Promise.reject(new Error("apiUrl is required"));
      }
      
      // Open chatbot first
      iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, "*");
      
      // Show loading state
      iframe.contentWindow.postMessage({ 
        type: "HIREMN_LOADING", 
        message: "Тестийн үр дүнг татаж байна..." 
      }, "*");
      
      // Fetch from hire.mn API
      return fetch(apiUrl, {
        method: "GET",
        headers: Object.assign({
          "Content-Type": "application/json"
        }, headers)
      })
      .then(function(response) {
        if (!response.ok) {
          throw new Error("API error: " + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        // Send the fetched data to chatbot for AI analysis
        iframe.contentWindow.postMessage({
          type: "HIREMN_AI_ANALYSIS",
          payload: {
            reportTitle: testName,
            reportData: data,
            analysisResults: data.results || data.scores || data,
            prompt: prompt,
            fromAPI: true
          }
        }, "*");
        return data;
      })
      .catch(function(error) {
        console.error("[HireMnChat] API fetch error:", error);
        iframe.contentWindow.postMessage({ 
          type: "HIREMN_ERROR", 
          message: "Өгөгдөл татахад алдаа гарлаа: " + error.message 
        }, "*");
        throw error;
      });
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // EASIEST METHOD FOR HIRE.MN — give it the exam code, it does the rest.
    // Usage from hire.mn report page:
    //   window.HireMnChat.analyzeReport("ABC123");
    //   window.HireMnChat.analyzeReport("ABC123", { token: "Bearer ..." });
    // It will:
    //   1) open the chatbot
    //   2) fetch /api/v1/exam/exam/{code} + /api/v1/userAnswer/code/code/{code}
    //   3) send the structured data to the AI for analysis & recommendations
    // ═══════════════════════════════════════════════════════════════════════
    analyzeReport: function(code, options) {
      options = options || {};
      var API_BASE = options.apiBase || "https://api.hire.mn";
      var headers = {};
      if (options.token) {
        headers["Authorization"] = options.token.indexOf("Bearer ") === 0
          ? options.token
          : "Bearer " + options.token;
      }
      if (options.headers) {
        Object.keys(options.headers).forEach(function(k) { headers[k] = options.headers[k]; });
      }

      if (!code) {
        console.error("[HireMnChat] analyzeReport: code is required");
        return Promise.reject(new Error("code is required"));
      }

      // Open chatbot
      iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, "*");
      iframe.contentWindow.postMessage({
        type: "HIREMN_LOADING",
        message: "Тайлангаа AI-д шилжүүлж байна..."
      }, "*");

      var fetchOpts = {
        method: "GET",
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
        // credentials omitted intentionally — API returns Access-Control-Allow-Origin: *
        // which is incompatible with credentials: "include". Auth uses Bearer token instead.
        credentials: options.credentials || "omit"
      };

      // Fetch exam metadata + user answers in parallel
      var examUrl = API_BASE + "/api/v1/exam/exam/" + encodeURIComponent(code);
      var answerUrl = API_BASE + "/api/v1/userAnswer/code/code/" + encodeURIComponent(code);

      console.log("[HireMnChat] Fetching:", { examUrl: examUrl, answerUrl: answerUrl, hasToken: !!options.token });

      function fetchWithDiagnostics(url, label) {
        return fetch(url, fetchOpts).then(function(r) {
          console.log("[HireMnChat] " + label + " status:", r.status);
          if (!r.ok) {
            return r.text().then(function(text) {
              console.error("[HireMnChat] " + label + " error body:", text);
              return { __error: true, status: r.status, body: text, label: label };
            });
          }
          return r.json().catch(function(e) {
            console.error("[HireMnChat] " + label + " JSON parse failed:", e);
            return { __error: true, status: r.status, body: "Invalid JSON", label: label };
          });
        }).catch(function(err) {
          console.error("[HireMnChat] " + label + " network error:", err);
          return { __error: true, status: 0, body: String(err && err.message || err), label: label };
        });
      }

      return Promise.all([
        fetchWithDiagnostics(examUrl, "exam"),
        fetchWithDiagnostics(answerUrl, "userAnswer")
      ]).then(function(results) {
        var examRes = results[0];
        var answerRes = results[1];
        var examData = (examRes && !examRes.__error) ? examRes : null;
        var answerData = (answerRes && !answerRes.__error) ? answerRes : null;

        if (!examData && !answerData) {
          var details = [];
          if (examRes && examRes.__error) details.push("exam: HTTP " + examRes.status);
          if (answerRes && answerRes.__error) details.push("userAnswer: HTTP " + answerRes.status);
          throw new Error("Тайлангийн өгөгдөл олдсонгүй (" + details.join(", ") + ")");
        }

        var testName = (examData && (examData.name || examData.title || examData.testName)) ||
                       (options.testName) ||
                       "Тест";

        iframe.contentWindow.postMessage({
          type: "HIREMN_AI_ANALYSIS",
          payload: {
            reportTitle: testName,
            reportData: { exam: examData, answers: answerData, code: code },
            analysisResults: (examData && (examData.results || examData.scores)) ||
                             (answerData && (answerData.results || answerData.scores)) ||
                             examData || answerData,
            prompt: options.prompt ||
              "Миний тестийн үр дүнг дэлгэрэнгүй задлан шинжилж: 1) Гол дүгнэлт, 2) Давуу/сул тал, 3) Практик зөвлөмж, 4) Цаашид сайжруулах алхмууд гарган гаргаж өгнө үү."
          }
        }, "*");

        return { exam: examData, answers: answerData };
      }).catch(function(error) {
        console.error("[HireMnChat] analyzeReport error:", error);
        iframe.contentWindow.postMessage({
          type: "HIREMN_ERROR",
          message: "Тайлан татахад алдаа гарлаа: " + error.message
        }, "*");
        throw error;
      });
    },

    // Open chatbot and trigger AI analysis with pre-loaded data
    openWithAnalysis: function(data) {
      iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, "*");
      
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
          wrapper.style.left = "0";
          wrapper.style.right = "0";
          wrapper.style.top = "0";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
        } else {
          wrapper.style.width = "420px";
          wrapper.style.height = "680px";
          wrapper.style.bottom = "20px";
          wrapper.style.right = "50px";
          wrapper.style.left = "auto";
          wrapper.style.top = "auto";
          iframe.style.width = "420px";
          iframe.style.height = "680px";
        }
      } else {
        // Closed - futuristic floating button
        wrapper.style.width = BUTTON_SIZE;
        wrapper.style.height = BUTTON_HEIGHT;
        wrapper.style.bottom = "10px";
        wrapper.style.right = "20px";
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
