
// snitchApiLogger.js
// Toggleable API logger for Snitch: activate with ?devlog=true
(function () {
  try {
    const params = new URLSearchParams(window.location.search);
    const devlog = params.get('devlog') === 'true';
    const exportLogs = params.has('exportLogs') || params.has('exportlogs') || params.get('exportLogs') === 'true';
    if (!devlog) return;

    const STORAGE_KEY = 'snitchApiLogs';
    function now() { return new Date().toISOString(); }
    function pushLog(entry) {
      try {
        const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        arr.push(entry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      } catch (e) {
        console.warn('[SNITCH LOGGER] failed to push log', e);
      }
    }
    function log(method, url, status, duration) {
      const entry = { ts: now(), method, url, status: status || null, duration: duration || null };
      console.log(`[SNITCH LOGGER] [${method}] ${url} ${status ? '→ ' + status : ''} (${entry.ts})`);
      pushLog(entry);
    }

    // fetch interception
    const origFetch = window.fetch;
    window.fetch = async function(input, init) {
      const start = performance.now();
      let method = 'GET';
      let url = input;
      try {
        if (init && init.method) method = init.method;
        if (typeof input === 'object' && input && input.url) url = input.url;
        const res = await origFetch.apply(this, arguments);
        const dur = Math.round(performance.now() - start);
        log(method, String(url), res.status, dur);
        return res;
      } catch (e) {
        const dur = Math.round(performance.now() - start);
        log(method, String(url), 'ERROR', dur);
        throw e;
      }
    };

    // XMLHttpRequest interception
    (function() {
      const XHR = window.XMLHttpRequest;
      function newXHR() {
        const real = new XHR();
        let method = null;
        let url = null;
        let start = 0;
        real.open = function(m, u) {
          method = m;
          url = u;
          return XHR.prototype.open.apply(this, arguments);
        };
        real.send = function() {
          start = performance.now();
          const onLoadEnd = () => {
            try {
              const dur = Math.round(performance.now() - start);
              log(method || 'XHR', url || '', this.status, dur);
            } catch (e) {}
          };
          this.addEventListener('loadend', onLoadEnd);
          return XHR.prototype.send.apply(this, arguments);
        };
        return real;
      }
      window.XMLHttpRequest = newXHR;
    })();

    // Axios interception if present
    try {
      const axios = window.axios;
      if (axios && axios.interceptors) {
        axios.interceptors.request.use(cfg => {
          cfg.__snitch_start = performance.now();
          return cfg;
        });
        axios.interceptors.response.use(res => {
          const dur = Math.round(performance.now() - (res.config.__snitch_start || performance.now()));
          log((res.config.method||'GET').toUpperCase(), res.config.url, res.status, dur);
          return res;
        }, err => {
          try {
            const cfg = err.config || {};
            const dur = Math.round(performance.now() - (cfg.__snitch_start || performance.now()));
            log((cfg.method||'ERR').toUpperCase(), cfg.url || err.request?.url || '', err.response?.status || 'ERROR', dur);
          } catch (e) {}
          return Promise.reject(err);
        });
      }
    } catch (e) {}

    // Expose helper functions
    window.getSnitchLogs = function() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch (e) { return []; }
    };
    window.clearSnitchLogs = function() {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[SNITCH LOGGER] cleared logs');
    };
    window.exportSnitchLogs = function() {
      try {
        const data = window.getSnitchLogs();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'snitch_api_logs.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) { console.error('[SNITCH LOGGER] export failed', e); }
    };

    if (exportLogs) {
      // delay to allow any initial requests to complete
      setTimeout(() => { window.exportSnitchLogs(); }, 1500);
    }

    console.log('[SNITCH LOGGER] active — logging to console and localStorage (snitchApiLogs). Use window.exportSnitchLogs() to download.');
  } catch (e) {
    console.error('[SNITCH LOGGER] init failed', e);
  }
})();
