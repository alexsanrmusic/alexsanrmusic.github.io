/* GoatCounter — статистика без cookies (alexsanrmusic.goatcounter.com).
   Перегляди рахуємо вручну: першу сторінку — тут, переходи без перезавантаження — у miniplayer.js (swap). */
(function () {
  try {
    if (window.__gcLoaded) return;
    window.__gcLoaded = 1;
    window.goatcounter = { no_onload: true };
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://gc.zgo.at/count.js';
    g.setAttribute('data-goatcounter', 'https://alexsanrmusic.goatcounter.com/count');
    g.onload = function () { try { window.goatcounter.count(); } catch (e) {} };
    document.head.appendChild(g);
  } catch (e) {}
})();
/* miniplayer: знімок вузлів поточної сторінки (для переходів без перезавантаження) і підключення miniplayer.js */
(function () {
  try {
    var cs = document.currentScript, h = document.head, b = document.body;
    var hd = b.querySelector('header'), hp = hd && hd.parentNode;
    window.__pgOwned = {
      head: [].slice.call(h.querySelectorAll('style:not([data-shared]),link[rel="stylesheet"],script[type^="application"]')),
      body: [].slice.call(b.children).filter(function (n) { return !n.contains(hd); }),
      inner: hp && hp !== b ? [].slice.call(hp.children).filter(function (n) { return n !== hd; }) : []
    };
    if (!window.MP && cs && cs.src) {
      var m = document.createElement('script');
      m.src = cs.src.replace(/pwa\.js(\?.*)?$/, 'miniplayer.js');
      h.appendChild(m);
    }
  } catch (e) {}
})();
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
          steps: ['Натисніть «Поділитися» {share} — внизу екрана або в меню «⋯».', 'Прокрутіть і виберіть «На екран “Додому”».', 'Натисніть «Додати».'],
          shareBtn: 'Відкрити «Поділитися»',
          inappTitle: 'Відкрийте в Safari',
          inapp: 'У цьому вбудованому браузері встановити застосунок не можна. Відкрийте сайт у Safari (меню «⋯» → «Відкрити в браузері»), і з’явиться підказка.',
          close: 'Закрити' },
    ru: { label: 'Приложение', title: 'Установить приложение Alex Sanr',
          iosTitle: 'Установить на iPhone',
          steps: ['Нажмите «Поделиться» {share} — внизу экрана или в меню «⋯».', 'Прокрутите и выберите «На экран “Домой”».', 'Нажмите «Добавить».'],
          shareBtn: 'Открыть «Поделиться»',
          inappTitle: 'Откройте в Safari',
          inapp: 'В этом встроенном браузере установить приложение нельзя. Откройте сайт в Safari (меню «⋯» → «Открыть в браузере»), и появится подсказка.',
          close: 'Закрыть' },
    en: { label: 'App', title: 'Install the Alex Sanr app',
          iosTitle: 'Install on iPhone',
          steps: ['Tap Share {share} at the bottom of the screen or in the “⋯” menu.', 'Scroll and choose “Add to Home Screen”.', 'Tap “Add”.'],
          shareBtn: 'Open Share',
          inappTitle: 'Open in Safari',
          inapp: 'You can’t install the app from this in-app browser. Open the site in Safari (“⋯” menu → “Open in Browser”) and the hint will appear.',
          close: 'Close' }
  };
  var code = (window.I18N && window.I18N.lang) || ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
  var t = T[code] || T.en;

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Вбудовані браузери (Instagram, Facebook, TikTok, Telegram…): додати на екран «Додому» там не можна
  var inApp = isIOS && (/FBAN|FBAV|Instagram|TikTok|musical_ly|Bytedance|Telegram|Snapchat|Line\/|GSA\/|Twitter/i.test(navigator.userAgent) || !/Safari\//i.test(navigator.userAgent));
  var HINT_KEY = 'pwaIosHint', HINT_DAYS = 14;
  function hintSeen() { try { localStorage.setItem(HINT_KEY, String(Date.now())); } catch (e) {} }
  function hintDue() {
    try { return Date.now() - (+localStorage.getItem(HINT_KEY) || 0) > HINT_DAYS * 864e5; } catch (e) { return true; }
  }

  // Сервіс-воркер (потрібен для встановлення)
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(url('sw.js')).catch(function () {});
    });
  }

  if (isStandalone()) return;

  // Усередині Telegram Mini App кнопку встановлення не показуємо
  try {
    if (/tgWebApp/.test(location.hash + location.search) || /[?&](ref|utm_source)=telegram(&|$)/i.test(location.search) || window.TelegramWebviewProxy || (window.Telegram && window.Telegram.WebView) || /Telegram/i.test(navigator.userAgent)) sessionStorage.setItem('tg', '1');
    if (sessionStorage.getItem('tg') === '1') return;
  } catch (e) {}

  var deferred = null, btn = null, pop = null, brand = null, nav = null;

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '.pwa-wrap .brand{order:1}.pwa-wrap .pwa-btn{order:2}.pwa-wrap nav{order:3;flex-basis:100%}' +
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
      '.pwa-pop button{font:inherit;font-size:13px;padding:7px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;cursor:pointer}' +
      '.pwa-pop p{margin:0 0 12px}' +
      '@media (max-width:520px){.pwa-pop{top:auto;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:none;margin-left:0}}';
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
    brand = header.querySelector('.brand');
    nav = header.querySelector('nav');
    header.appendChild(btn);
    btn.addEventListener('click', onClick);
    if (isIOS || deferred) { btn.hidden = false; relayout(); }   // на iPhone події встановлення немає — показуємо підказку
  }


  // Всё влезает в одну строку: кнопка справа от меню. Не влезает: меню уходит на вторую строку,
  // а кнопка остаётся в первой строке справа.
  function layout() {
    if (!btn || btn.hidden || !brand) return;
    var header = btn.parentNode;
    header.classList.remove('pwa-wrap');
    var top = brand.getBoundingClientRect().top;
    var wrapped = btn.getBoundingClientRect().top > top + 6 || (nav && nav.getBoundingClientRect().top > top + 6);
    if (wrapped) header.classList.add('pwa-wrap');
  }
  var layoutTimer = null;
  function relayout() { clearTimeout(layoutTimer); layoutTimer = setTimeout(layout, 60); }
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  var SHARE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="vertical-align:-3px"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';

  function popHTML() {
    var closeBtn = '<button type="button" class="pwa-close">' + t.close + '</button>';
    if (inApp) return '<h3>' + t.inappTitle + '</h3><p>' + t.inapp + '</p>' + closeBtn;
    var shareBtn = navigator.share ? '<button type="button" class="pwa-share">' + t.shareBtn + '</button> ' : '';
    return '<h3>' + t.iosTitle + '</h3><ol>' + t.steps.map(function (s) { return '<li>' + s.replace('{share}', SHARE_SVG) + '</li>'; }).join('') + '</ol>' + shareBtn + closeBtn;
  }

  // auto = true: показати саме (разом із відміткою «вже показували»); інакше — перемикання кнопкою в шапці
  function showPop(auto) {
    if (!pop) {
      pop = document.createElement('div');
      pop.className = 'pwa-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', inApp ? t.inappTitle : t.iosTitle);
      pop.innerHTML = popHTML();
      pop.querySelector('.pwa-close').addEventListener('click', function () { pop.hidden = true; hintSeen(); });
      var sb = pop.querySelector('.pwa-share');
      // Відкриває системне меню «Поділитися» Safari — в ньому має бути пункт «На екран “Додому”» (залежить від версії iOS)
      if (sb) sb.addEventListener('click', function () {
        try { navigator.share({ title: document.title, url: location.href.split('#')[0] }).catch(function () {}); } catch (e) {}
        hintSeen();
      });
      document.body.appendChild(pop);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { pop.hidden = true; hintSeen(); } });
      pop.hidden = false;
    } else {
      pop.hidden = auto ? false : !pop.hidden;
    }
    if (auto) hintSeen();
  }

  function onClick() {
    if (deferred) {
      var p = deferred;
      deferred = null;
      p.prompt();
      p.userChoice.then(function (r) { if (r.outcome === 'accepted') btn.hidden = true; }).catch(function () {});
      btn.hidden = true;
    } else if (isIOS) {
      // iPhone/iPad (Safari, Chrome…): одразу відкриваємо системне меню «Поділитися» — у ньому «На екран “Додому”».
      // Окреме вікно з підказкою — лише якщо меню відкрити не можна (вбудований браузер, немає Web Share).
      if (navigator.share && !inApp) {
        try {
          navigator.share({ title: document.title, url: location.href.split('#')[0] }).catch(function () {});
          return;
        } catch (e) {}
      }
      showPop();
    }
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (btn) { btn.hidden = false; relayout(); }
  });
  window.addEventListener('appinstalled', function () {
    deferred = null;
    if (btn) btn.hidden = true;
    if (pop) pop.hidden = true;
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
