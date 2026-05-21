; (function () {
  "use strict";

  if (window.__HireMnWidget) return;
  window.__HireMnWidget = true;

  var scripts = document.getElementsByTagName("script");
  var me = scripts[scripts.length - 1];
  var ORIGIN = me.src ? me.src.replace(/\/embed\.js(\?.*)?$/, "") : "";

  if (!ORIGIN) {
    console.error("[hire.mn Widget] Could not detect widget origin from script src.");
    return;
  }

  var BUTTON_SIZE = "210px";
  var BUTTON_HEIGHT = "180px";

  var wrapper = document.createElement("div");
  wrapper.id = "hiremn-widget-root";
  wrapper.style.cssText =
    "position:fixed !important;" +
    "bottom:20px !important;" +
    "right:20px !important;" +
    "z-index:2147483647 !important;" +
    "pointer-events:none !important;" +
    "overflow:visible !important;" +
    "width:" + BUTTON_SIZE + " !important;" +
    "height:" + BUTTON_HEIGHT + " !important;" +
    "background:transparent !important;";

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

  var chatIsOpen = false;

  window.HireMnChat = {
    open: function () {
      iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, ORIGIN);
    },

    close: function () {
      iframe.contentWindow.postMessage({ type: "HIREMN_CLOSE" }, ORIGIN);
    },

    isOpen: function () {
      return chatIsOpen;
    },

    analyzeFromAPI: function (options) {
      var apiUrl = options.apiUrl;
      var headers = options.headers || {};
      var testName = options.testName || "Тест";
      var prompt = options.prompt || "Миний тестийн үр дүнг задлан шинжилж, дэлгэрэнгүй тайлбар болон зөвлөгөө өгнө үү.";

      if (!apiUrl) {
        console.error("[HireMnChat] apiUrl is required");
        return Promise.reject(new Error("apiUrl is required"));
      }

      iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, ORIGIN);
      iframe.contentWindow.postMessage({
        type: "HIREMN_LOADING",
        message: "Тестийн үр дүнг татаж байна..."
      }, ORIGIN);

      return fetch(apiUrl, {
        method: "GET",
        headers: Object.assign({ "Content-Type": "application/json" }, headers)
      })
        .then(function (response) {
          if (!response.ok) throw new Error("API error: " + response.status);
          return response.json();
        })
        .then(function (data) {
          iframe.contentWindow.postMessage({
            type: "HIREMN_AI_ANALYSIS",
            payload: {
              reportTitle: testName,
              reportData: data,
              analysisResults: data.results || data.scores || data,
              prompt: prompt,
              fromAPI: true
            }
          }, ORIGIN);
          return data;
        })
        .catch(function (error) {
          console.error("[HireMnChat] API fetch error:", error);
          iframe.contentWindow.postMessage({
            type: "HIREMN_ERROR",
            message: "Өгөгдөл татахад алдаа гарлаа: " + error.message
          }, ORIGIN);
          throw error;
        });
    },

    analyzeReport: function (code, options) {
      options = options || {};
      var API_BASE = options.apiBase || "https://api.hire.mn";
      var headers = {};
      if (options.token) {
        headers["Authorization"] = options.token.indexOf("Bearer ") === 0
          ? options.token
          : "Bearer " + options.token;
      }
      if (options.headers) {
        Object.keys(options.headers).forEach(function (k) { headers[k] = options.headers[k]; });
      }

      if (!code) {
        console.error("[HireMnChat] analyzeReport: code is required");
        return Promise.reject(new Error("code is required"));
      }

     iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, ORIGIN);
iframe.contentWindow.postMessage({
  type: "HIREMN_LOADING",
  message: "Тайлангаа AI-д шилжүүлж байна..."
}, ORIGIN);

// Алхам 1: PDF-г browser-аас fetch хийнэ (cookie автоматаар явна)
var reportUrl = API_BASE + "/api/report/" + encodeURIComponent(code);

return fetch(reportUrl, {
  credentials: "include",
  headers: Object.assign({ Accept: "application/pdf,*/*" }, headers),
})
  .then(function (res) {
    if (!res.ok) throw new Error("Report fetch error: " + res.status);
    return res.arrayBuffer();
  })
  .then(function (buffer) {
    // Алхам 2: ArrayBuffer → base64
    var bytes = new Uint8Array(buffer);
    var binary = "";
    for (var i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    var base64 = btoa(binary);

    // Алхам 3: Серверт явуулж текст гарна
    return fetch(ORIGIN + "/api/extract-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf: base64, code: code }),
    });
  })
  .then(function (r) {
    if (!r.ok) throw new Error("Extract error: " + r.status);
    return r.json();
  })
        .then(function (r) {
          if (!r.ok) throw new Error("Extract error: " + r.status);
          return r.json();
        })
        .then(function (result) {
          if (!result.success || !result.data) {
            throw new Error("Тайлангийн өгөгдөл олдсонгүй");
          }
          var reportContent = result.source === "pdf"
            ? result.data.text
            : JSON.stringify(result.data);

          iframe.contentWindow.postMessage({
            type: "HIREMN_AI_ANALYSIS",
            payload: {
              reportTitle: options.testName || "Тест",
              reportData: { content: reportContent, code: code, source: result.source },
              analysisResults: reportContent,
              prompt: options.prompt ||
                "Миний тестийн үр дүнг дэлгэрэнгүй задлан шинжилж өгнө үү:\n" +
                "1) Гол дүгнэлт — ямар хүн бэ, ямар онцлогтой вэ\n" +
                "2) Хүчтэй болон сул талуудыг тодорхой тайлбарла\n" +
                "3) Ажил мэргэжил болон хамт олондоо хэрхэн хандах практик зөвлөмж\n" +
                "4) Цаашид хөгжихийн тулд хийж болох тодорхой алхмууд"
            }
          }, ORIGIN);

          return result.data;
        })
        .catch(function (error) {
          console.error("[HireMnChat] analyzeReport error:", error);
          iframe.contentWindow.postMessage({
            type: "HIREMN_ERROR",
            message: "Тайлан татахад алдаа гарлаа: " + error.message
          }, ORIGIN);
          throw error;
        });
    },

    openWithAnalysis: function (data) {
      iframe.contentWindow.postMessage({ type: "HIREMN_OPEN" }, ORIGIN);
      setTimeout(function () {
        iframe.contentWindow.postMessage({
          type: "HIREMN_AI_ANALYSIS",
          payload: {
            reportTitle: data.reportTitle || "",
            reportData: data.reportData || {},
            userInfo: data.userInfo || {},
            analysisResults: data.analysisResults || {},
            prompt: data.prompt || "Миний тестийн үр дүнг задлан шинжилж, надад зөвлөгөө өгнө үү."
          }
        }, ORIGIN);
      }, 500);
    },

    sendMessage: function (message) {
      iframe.contentWindow.postMessage({
        type: "HIREMN_SEND_MESSAGE",
        message: message
      }, ORIGIN);
    }
  };

  window.addEventListener("message", function (e) {
    if (!e.data || !e.data.type) return;
    if (e.origin !== ORIGIN) return;

    if (e.data.type === "HIREMN_RESIZE") {
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
          wrapper.style.right = "20px";
          wrapper.style.left = "auto";
          wrapper.style.top = "auto";
          iframe.style.width = "420px";
          iframe.style.height = "680px";
        }
      } else {
        wrapper.style.width = BUTTON_SIZE;
        wrapper.style.height = BUTTON_HEIGHT;
        wrapper.style.bottom = "20px";
        wrapper.style.right = "20px";
        wrapper.style.left = "auto";
        wrapper.style.top = "auto";
        iframe.style.width = BUTTON_SIZE;
        iframe.style.height = BUTTON_HEIGHT;
      }
    }

    if (e.data.type === "HIREMN_OPEN_URL" && e.data.url) {
      window.open(e.data.url, "_blank", "noopener,noreferrer");
    }
  });

  iframe.addEventListener("error", function () {
    console.error("[hire.mn Widget] iframe failed to load");
    wrapper.style.display = "none";
  });

  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);
})();