(function () {
  // Determine the host from the script src so it always points to your deployment
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];
  var src = currentScript.src || "";
  var host = src ? src.replace(/\/embed\.js.*$/, "") : "https://your-app.vercel.app";

  // Wrapper — sits fixed in bottom-right, sized to contain the open widget
  var wrapper = document.createElement("div");
  wrapper.id = "hiremn-widget-wrapper";
  wrapper.style.cssText = [
    "position:fixed",
    "bottom:0",
    "right:0",
    "width:420px",
    "height:640px",
    "max-width:100vw",
    "max-height:100vh",
    "z-index:2147483647",
    "pointer-events:none",
    "border:none",
    "overflow:hidden",
  ].join(";");

  // iframe — transparent bg, full size of wrapper
  var iframe = document.createElement("iframe");
  iframe.src = host + "/widget";
  iframe.id = "hiremn-widget-iframe";
  iframe.title = "hire.mn AI Assistant";
  iframe.allow = "clipboard-write";
  iframe.style.cssText = [
    "width:100%",
    "height:100%",
    "border:none",
    "background:transparent",
    "pointer-events:all",
    "display:block",
  ].join(";");
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("frameborder", "0");

  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);
})();
