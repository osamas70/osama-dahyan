/* PWA bootstrap: register the Service Worker ONLY on the live
   published site — never in dev, never on file://, never inside a
   preview iframe (registering there hijacks the parent/measures wrong). */
(function () {
  if (!('serviceWorker' in navigator)) return;

  var host = location.hostname || '';
  var isDev =
    location.protocol === 'file:' ||
    host === '' ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    /\.local$/i.test(host);

  var inFrame = false;
  try {
    inFrame = window.self !== window.top;
  } catch (e) {
    inFrame = true; // cross-origin frame: assume embedded preview
  }
  if (isDev || inFrame) return;
  if (location.protocol !== 'https:') return; // SW requires a secure context

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (reg) {
      function pokeUpdate(sw) {
        if (!sw) return;
        sw.addEventListener('statechange', function () {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage('SKIP_WAITING');
          }
        });
      }
      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
      reg.addEventListener('updatefound', function () { pokeUpdate(reg.installing); });
    }).catch(function () { /* offline-first still works from cache on next visit */ });
  });

  var refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
})();

/* Visible "install app" button (runs on every page via pwa.js).
   Android/Desktop: uses beforeinstallprompt. iPhone: shows manual steps. */
(function () {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) return;
  var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  var deferred = null;
  var btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.type = 'button';
  btn.textContent = '⬇ ثبّت التطبيق';

  function iosSheet() {
    var ov = document.createElement('div');
    ov.className = 'pwa-sheet open';
    ov.innerHTML = '<div class="pwa-sheet-card"><h3>تثبيت التطبيق على الأيفون</h3><ol><li>اضغط زر <b>المشاركة</b> في سفاري</li><li>اختر <b>إضافة إلى الشاشة الرئيسية</b></li><li>اضغط <b>إضافة</b></li></ol><button class="btn btn-primary" style="width:100%">فهمت</button></div>';
    ov.addEventListener('click', function () { document.body.removeChild(ov); });
    document.body.appendChild(ov);
  }

  btn.addEventListener('click', function () {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; btn.style.display = 'none'; });
    } else if (isIos) {
      iosSheet();
    }
  });
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    btn.style.display = 'block';
  });
  window.addEventListener('appinstalled', function () { deferred = null; btn.style.display = 'none'; });
  if (isIos) btn.style.display = 'block';
  document.body.appendChild(btn);
})();
