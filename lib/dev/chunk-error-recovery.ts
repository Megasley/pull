/** Inline dev script source — runs before React so Turbopack chunk errors can auto-recover. */
export const DEV_CHUNK_RECOVERY_SCRIPT = `
(function () {
  var KEY = "pull:chunk-reload-ts";
  var COOLDOWN_MS = 8000;

  function isChunkLoadError(reason) {
    var message =
      reason && typeof reason === "object" && "message" in reason
        ? String(reason.message)
        : String(reason || "");
    return /ChunkLoadError|Loading chunk .* failed/i.test(message);
  }

  function maybeReload() {
    var last = Number(sessionStorage.getItem(KEY) || "0");
    if (Date.now() - last < COOLDOWN_MS) return;
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  }

  window.addEventListener("unhandledrejection", function (event) {
    if (isChunkLoadError(event.reason)) {
      maybeReload();
    }
  });
})();
`.trim();
