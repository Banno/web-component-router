window.__karma__.loaded = function() {};

(async function() {
  for (const path in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(path)) {
      if (/spec.js$/.test(path)) {
        await import(path);
      }
    }
  }
  window.__karma__.start();
})();
