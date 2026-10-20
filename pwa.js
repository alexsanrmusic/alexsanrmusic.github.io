/* Alex Sanr — кнопка «Встановити застосунок» (PWA).
   Показується в шапці сайту. Ховається, якщо застосунок уже встановлено.
   Android / ПК (Chrome, Edge): встановлення в один клік.
   iPhone / iPad: показує підказку «Поділитися → На екран “Додому”». */
(function () {
  var script = document.currentScript;
  var base = script && script.src ? script.src : location.href;
  function url(p) { return new URL(p, base).href; }

  var T = {
    uk: { label: 'Застосунок', title: 'Встановити застосунок Alex Sanr',
          iosTitle: 'Встановити на iPhone',
          steps: ['Натисніть «Поділитися» (квадрат зі стрілкою) внизу екрана.', 'Виберіть «На екран “Додому”».', 'Натисніть «Додати».'],
          close: 'Закрити' },
    ru: { label: 'Приложение', title: 'Установить приложение Alex Sanr',
          iosTitle: 'Установить на iPhone',
          steps: ['Нажмите «Поделиться» (квадрат со стрелкой) внизу экрана.', 'Выберите «На экран “Домой”».', 'Нажмите «Добавить».'],
          close: 'Закрыть' },
    en: { label: 'App', title: 'Install the Alex Sanr app',
          iosTitle: 'Install on iPhone',
          steps: ['Tap the Share button (square with an arrow) at the bottom of the screen.', 'Choose “Add to Home Screen”.', 'Tap “Add”.'],
          close: 'Close' }
  };
  var code = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
  var t = T[code] || T.en;

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Сервіс-воркер (потрібен для встановлення)
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(url('sw.js')).catch(function () {});
    });
  }

  if (isStandalone()) return;

  var deferred = null, btn = null, pop = null;

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '.pwa-btn{display:inline-flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;border:1px solid var(--line,rgba(255,255,255,.16));border-radius:999px;background:rgba(255,255,255,.04);color:var(--fg,#e8ecff);font:inherit;font-size:14px;line-height:1;cursor:pointer;transition:border-color .2s,background .2s,transform .2s}' +
      '.pwa-btn:hover{border-color:var(--accent,#7c8cff);background:rgba(255,255,255,.08)}' +
      '.pwa-btn:active{transform:scale(.97)}' +
      '.pwa-btn:focus-visible{outline:2px solid var(--accent,#7c8cff);outline-offset:2px}' +
      '.pwa-btn[hidden]{display:none}' +
      '.pwa-btn img{width:30px;height:30px;border-radius:50%;display:block}' +
      '@media (max-width:520px){.pwa-btn{padding:3px}.pwa-btn span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}' +
      '.pwa-pop{position:fixed;z-index:1000;top:64px;right:16px;left:16px;margin-left:auto;max-width:330px;padding:16px 18px 14px;border-radius:16px;background:#141a36;border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.5);color:#e8ecff;font-size:14px;line-height:1.5}' +
      '.pwa-pop[hidden]{display:none}' +
      '.pwa-pop h3{margin:0 0 8px;font-size:15px}' +
      '.pwa-pop ol{margin:0 0 12px;padding-left:20px}' +
      '.pwa-pop li{margin:4px 0}' +
      '.pwa-pop button{font:inherit;font-size:13px;padding:7px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;cursor:pointer}';
    document.head.appendChild(s);
  }

  function build() {
    var header = document.querySelector('header');
    if (!header || btn) return;
    css();
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pwa-btn';
    btn.hidden = true;
    btn.title = t.title;
    btn.setAttribute('aria-label', t.title);
    btn.innerHTML = '<img src="' + url('icons/icon-192.png') + '" alt="" width="30" height="30"><span>' + t.label + '</span>';
    header.appendChild(btn);
    btn.addEventListener('click', onClick);
    if (isIOS || deferred) btn.hidden = false;   // на iPhone події встановлення немає — показуємо підказку
  }

  function showPop() {
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'pwa-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', t.iosTitle);
      pop.innerHTML = '<h3>' + t.iosTitle + '</h3><ol>' + t.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol><button type="button">' + t.close + '</button>';
      pop.querySelector('button').addEventListener('click', function () { pop.hidden = true; });
      document.body.appendChild(pop);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') pop.hidden = true; });
      pop.hidden = false;
    } else {
      pop.hidden = !pop.hidden;
    }
  }

  function onClick() {
    if (deferred) {
      var p = deferred;
      deferred = null;
      p.prompt();
      p.userChoice.then(function (r) { if (r.outcome === 'accepted') btn.hidden = true; }).catch(function () {});
      btn.hidden = true;
    } else if (isIOS) {
      showPop();
    }
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (btn) btn.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    deferred = null;
    if (btn) btn.hidden = true;
    if (pop) pop.hidden = true;
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
