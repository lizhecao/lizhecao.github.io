(() => {
  'use strict';
  const standaloneQuery = window.matchMedia('(display-mode: standalone)');
  let installPrompt = null;
  const state = {
    standalone: Boolean(navigator.standalone || standaloneQuery.matches),
    offlineReady: false,
    canInstall: false,
    error: null
  };
  const publish = () => {
    document.documentElement.dataset.appMode = state.standalone ? 'standalone' : 'browser';
    window.dispatchEvent(new CustomEvent('blockplay:pwa', { detail: { ...state } }));
  };
  window.blockPlayPWA = {
    getState: () => ({ ...state }),
    install: async () => {
      if (!installPrompt) return null;
      const prompt = installPrompt;
      installPrompt = null;
      state.canInstall = false;
      await prompt.prompt();
      const result = await prompt.userChoice;
      publish();
      return result;
    }
  };
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    state.canInstall = true;
    publish();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    state.canInstall = false;
    state.standalone = true;
    publish();
  });
  standaloneQuery.addEventListener?.('change', () => {
    state.standalone = Boolean(navigator.standalone || standaloneQuery.matches);
    publish();
  });
  publish();
  const register = async () => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) { state.error = '当前浏览器不支持离线保存，请用 Safari 或 Chrome 打开。'; publish(); return; }
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      const installing = registration.installing || registration.waiting;
      if (installing && installing.state !== 'activated') await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('offline install timeout')), 30000);
        const check = () => { if(installing.state === 'activated'){clearTimeout(timer);resolve();} else if(installing.state === 'redundant'){clearTimeout(timer);reject(new Error('offline install failed'));} };
        installing.addEventListener('statechange', check); check();
      });
      const active = registration.active;
      if (!active) throw new Error('offline worker unavailable');
      const result = await new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => {channel.port1.close();reject(new Error('offline check timeout'));}, 5000);
        channel.port1.onmessage = event => {clearTimeout(timer);channel.port1.close();resolve(event.data);};
        active.postMessage({ type: 'CHECK_OFFLINE' }, [channel.port2]);
      });
      if (result.version !== '20261009-v13' || !result.offlineReady) throw new Error('offline files incomplete');
      state.offlineReady = true;
      publish();
    } catch (error) {
      state.error = '离线保存未完成，请联网后重新打开。';
      publish();
      console.warn('Offline app setup failed:', error);
    }
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
})();
