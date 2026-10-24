/* Alex Sanr — міні-плеєр + перехід між сторінками без перезавантаження (музика не зупиняється).
   Підключається через pwa.js (на albums.html — напряму). */
(function () {
  if (window.MP) return;
  var script = document.currentScript;
  var base = script && script.src ? script.src : location.href;
  function url(p) { return new URL(p, base).href; }
  var root = document.documentElement;
  var LBL = {
    uk: { prev: 'Попередній трек', next: 'Наступний трек', play: 'Грати', pause: 'Пауза', close: 'Закрити плеєр', seek: 'Перемотка', vol: 'Гучність', mute: 'Вимкнути звук', unmute: 'Увімкнути звук' },
    ru: { prev: 'Предыдущий трек', next: 'Следующий трек', play: 'Играть', pause: 'Пауза', close: 'Закрыть плеер', seek: 'Перемотка', vol: 'Громкость', mute: 'Выключить звук', unmute: 'Включить звук' },
    en: { prev: 'Previous track', next: 'Next track', play: 'Play', pause: 'Pause', close: 'Close player', seek: 'Seek', vol: 'Volume', mute: 'Mute', unmute: 'Unmute' }
  };
  var lg = LBL[window.I18N && window.I18N.lang] || LBL.uk;

  /* ---------- ядро ---------- */
  var audio = new Audio();
  audio.preload = 'metadata';
  audio.style.display = 'none';
  root.appendChild(audio);
  var MP = window.MP = { audio: audio, queue: [], idx: -1, cur: null, cues: null, active: -1, _page: [] };
  function emit(ev) { MP._page.slice().forEach(function (f) { try { f(ev); } catch (e) {} }); }
  // слухачі, які живуть лише доти, доки відкрита поточна сторінка
  MP.page = function (f) {
    MP._page.push(f);
    return function () { var i = MP._page.indexOf(f); if (i >= 0) MP._page.splice(i, 1); };
  };

  /* ---------- інтерфейс ---------- */
  var css = document.createElement('style');
  css.setAttribute('data-shared', '');
  css.textContent =
    '#mp-bar{position:fixed;z-index:900;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));max-width:720px;margin:0 auto;border-radius:16px;background:rgba(20,26,54,.94);border:1px solid var(--line,rgba(255,255,255,.16));box-shadow:0 12px 40px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:var(--fg,#e8ecff)}' +
    '#mp-bar[hidden]{display:none}' +
    '#mp-bar .mp-seek{display:block;width:100%;height:16px;border-radius:16px 16px 0 0;margin:0;padding:0;accent-color:var(--c1,#e0a82e);background:transparent;cursor:pointer}' +
    '#mp-bar .mp-row{display:flex;align-items:center;gap:10px;padding:4px 10px 10px}' +
    '#mp-bar .mp-cover{width:44px;height:44px;border-radius:10px;object-fit:cover;flex:none;background:rgba(255,255,255,.08)}' +
    '#mp-bar .mp-cover[hidden]{display:none}' +
    '#mp-bar .mp-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}' +
    '#mp-bar .mp-title,#mp-bar .mp-line{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#mp-bar .mp-title{font-size:14px}' +
    '#mp-bar .mp-line{font-size:13px;color:var(--muted,#9aa3c7)}' +
    '#mp-bar .mp-btn{flex:none;width:38px;height:38px;border:0;border-radius:50%;background:transparent;color:inherit;display:grid;place-items:center;cursor:pointer;padding:0}' +
    '#mp-bar .mp-btn svg{width:22px;height:22px;fill:currentColor}' +
    '#mp-bar .mp-btn:hover{background:rgba(255,255,255,.08)}' +
    '#mp-bar .mp-btn.mp-main{background:var(--c1,#e0a82e);color:#14121a}' +
    '#mp-bar .mp-btn:focus-visible{outline:2px solid var(--c1,#e0a82e);outline-offset:2px}' +
    '#mp-bar .mp-volpop{position:absolute;right:8px;bottom:calc(100% + 8px);display:flex;align-items:center;gap:6px;padding:6px 14px 6px 6px;border-radius:14px;background:rgba(20,26,54,.97);border:1px solid var(--line,rgba(255,255,255,.16));box-shadow:0 8px 28px rgba(0,0,0,.45)}' +
    '#mp-bar .mp-volpop[hidden]{display:none}' +
    '#mp-bar .mp-vslider{width:150px;height:24px;margin:0;accent-color:var(--c1,#e0a82e);background:transparent;cursor:pointer}' +
    '@media(max-width:480px){#mp-bar .mp-btn{width:34px;height:34px}#mp-bar .mp-row{gap:6px}}' +
    'html.mp-on body{padding-bottom:96px}';
  document.head.appendChild(css);

  var ICON = {
    prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zM9.5 12 18 6v12z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 18V6l8.5 6z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    vhigh: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9zM16.5 12A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
    vlow: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9zM16.5 12A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.5 2.5zM19 12c0 .9-.2 1.8-.5 2.6l1.5 1.5A8.9 8.9 0 0 0 21 12a9 9 0 0 0-7-8.8v2.1A7 7 0 0 1 19 12zM4.3 3 3 4.3 7.7 9H3v6h4l5 5v-6.7l4.2 4.2c-.7.5-1.4.9-2.2 1.1v2.1a9 9 0 0 0 3.6-1.8l2.1 2.1 1.3-1.3L4.3 3zM12 4 9.9 6.1 12 8.2z"/></svg>',
    close: '<svg viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  function btn(cls, label, icon) {
    return '<button type="button" class="mp-btn ' + cls + '" aria-label="' + label + '" title="' + label + '">' + icon + '</button>';
  }
  var bar = document.createElement('div');
  bar.id = 'mp-bar';
  bar.hidden = true;
  bar.innerHTML =
    '<input class="mp-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="' + lg.seek + '">' +
    '<div class="mp-row"><img class="mp-cover" alt="" width="44" height="44" hidden>' +
    '<div class="mp-info"><b class="mp-title"></b><span class="mp-line"></span></div>' +
    btn('mp-prev', lg.prev, ICON.prev) + btn('mp-main mp-toggle', lg.play, ICON.play) +
    btn('mp-next', lg.next, ICON.next) + btn('mp-vol', lg.vol, ICON.vhigh) + btn('mp-close', lg.close, ICON.close) + '</div>' +
    '<div class="mp-volpop" hidden>' + btn('mp-vmute', lg.mute, ICON.vhigh) +
    '<input class="mp-vslider" type="range" min="0" max="100" step="1" aria-label="' + lg.vol + '"></div>';
  root.appendChild(bar);
  var seek = bar.querySelector('.mp-seek'), cover = bar.querySelector('.mp-cover'),
      titleEl = bar.querySelector('.mp-title'), lineEl = bar.querySelector('.mp-line'),
      toggleBtn = bar.querySelector('.mp-toggle');

  function setIcon() {
    var p = audio.paused;
    toggleBtn.innerHTML = p ? ICON.play : ICON.pause;
    toggleBtn.setAttribute('aria-label', p ? lg.play : lg.pause);
    toggleBtn.title = p ? lg.play : lg.pause;
  }

  /* ---------- гучність ---------- */
  var volBtn = bar.querySelector('.mp-vol'), pop = bar.querySelector('.mp-volpop'),
      vmute = bar.querySelector('.mp-vmute'), vslider = bar.querySelector('.mp-vslider');
  // на iOS гучність браузером не змінюється (лише кнопками телефона) — там кнопка просто вмикає/вимикає звук
  var canVol = (function () {
    var o = audio.volume;
    try { audio.volume = 0.5; } catch (e) {}
    var ok = Math.abs(audio.volume - 0.5) < 0.01;
    try { audio.volume = o; } catch (e) {}
    return ok;
  })();
  try {
    var sv = JSON.parse(localStorage.getItem('mp-vol') || 'null');
    if (sv) { if (canVol && sv.v >= 0 && sv.v <= 1) audio.volume = sv.v; audio.muted = !!sv.m; }
  } catch (e) {}
  function volUi() {
    var off = audio.muted || audio.volume === 0;
    var ic = off ? ICON.mute : (canVol && audio.volume < 0.5 ? ICON.vlow : ICON.vhigh);
    volBtn.innerHTML = ic; vmute.innerHTML = ic;
    vslider.value = off ? 0 : Math.round(audio.volume * 100);
    vmute.setAttribute('aria-label', off ? lg.unmute : lg.mute);
    vmute.title = off ? lg.unmute : lg.mute;
    try { localStorage.setItem('mp-vol', JSON.stringify({ v: audio.volume, m: audio.muted })); } catch (e) {}
  }
  audio.addEventListener('volumechange', volUi);
  volUi();
  volBtn.addEventListener('click', function () {
    if (!canVol) { audio.muted = !audio.muted; return; }
    pop.hidden = !pop.hidden;
  });
  vmute.addEventListener('click', function () {
    if (audio.muted || audio.volume === 0) { audio.muted = false; if (audio.volume === 0) audio.volume = 0.5; }
    else audio.muted = true;
  });
  vslider.addEventListener('input', function () {
    var v = vslider.value / 100;
    audio.volume = v;
    audio.muted = v === 0;
  });
  document.addEventListener('click', function (e) { if (!pop.hidden && !bar.contains(e.target)) pop.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') pop.hidden = true; });

  /* ---------- субтитри ---------- */
  function parseSrt(txt) {
    var out = [];
    txt.replace(/^\uFEFF/, '').replace(/\r/g, '').split(/\n\s*\n/).forEach(function (blk) {
      var l = blk.trim().split('\n');
      var i = l[0].indexOf('-->') > -1 ? 0 : 1;
      var m = l[i] && l[i].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
      if (!m) return;
      out.push({
        s: +m[1] * 3600 + +m[2] * 60 + +m[3] + +('0.' + m[4]),
        e: +m[5] * 3600 + +m[6] * 60 + +m[7] + +('0.' + m[8]),
        t: l.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').trim()
      });
    });
    return out;
  }
  var slugCache = null;
  function slugs() {
    return slugCache || (slugCache = fetch(url('lyrics.json')).then(function (r) { return r.json(); })
      .then(function (j) { return (j && j._slugs) || {}; }).catch(function () { return {}; }));
  }
  // subtitles/<id-альбому>/<slug>.srt, запасний варіант — subtitles/<slug>.srt
  function loadCues(t) {
    slugs().then(function (sl) {
      var slug = sl[t.albumId] && sl[t.albumId][t.title];
      if (!slug) return null;
      var urls = ['subtitles/' + t.albumId + '/' + slug + '.srt', 'subtitles/' + slug + '.srt'];
      return urls.reduce(function (p, u) {
        return p.then(function (r) {
          return r || fetch(url(u)).then(function (x) { return x.ok ? x.text() : null; }).catch(function () { return null; });
        });
      }, Promise.resolve(null));
    }).then(function (txt) {
      if (MP.cur !== t) return;
      var c = txt && parseSrt(txt);
      MP.cues = c && c.length ? c : null;
      MP.active = -1;
      emit('cues');
      tick();
    });
  }

  /* ---------- відтворення ---------- */
  var raf = 0, seeking = false, lastSave = 0;
  function tick() {
    cancelAnimationFrame(raf);
    var tm = audio.currentTime, d = audio.duration, c = MP.cues, i = -1;
    if (!seeking && isFinite(d) && d > 0) seek.value = Math.round(tm / d * 1000);
    if (c) {
      for (var k = 0; k < c.length && c[k].s <= tm; k++) i = k;
      if (i >= 0 && tm > c[i].e + 0.6) i = -1;
    }
    if (i !== MP.active) {
      MP.active = i;
      lineEl.textContent = (c && c[i]) ? c[i].t : (MP.cur ? MP.cur.album : '');
      emit('line');
    }
    var now = Date.now();
    if (now - lastSave > 2000) { lastSave = now; save(); }
    raf = audio.paused ? 0 : requestAnimationFrame(tick);
  }
  function save() {
    try {
      if (!MP.cur) { sessionStorage.removeItem('mp'); return; }
      sessionStorage.setItem('mp', JSON.stringify({ q: MP.queue, i: MP.idx, t: audio.currentTime }));
    } catch (e) {}
  }
  function meta() {
    if (!('mediaSession' in navigator) || !MP.cur) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: MP.cur.title, artist: 'Alex Sanr', album: MP.cur.album,
        artwork: MP.cur.cover ? [{ src: MP.cur.cover, sizes: '512x512' }] : []
      });
    } catch (e) {}
  }
  function load(i, autoplay, time) {
    var t = MP.queue[i];
    if (!t) return;
    MP.idx = i; MP.cur = t; MP.cues = null; MP.active = -1;
    audio.src = t.src;
    if (time > 0) audio.addEventListener('loadedmetadata', function f() {
      audio.removeEventListener('loadedmetadata', f);
      try { audio.currentTime = time; } catch (e) {}
    });
    if (autoplay) audio.play().catch(function () {});
    titleEl.textContent = t.title;
    lineEl.textContent = t.album;
    cover.hidden = !t.cover;
    if (t.cover) cover.src = t.cover;
    seek.value = 0;
    bar.hidden = false;
    root.classList.add('mp-on');
    meta(); setIcon(); emit('track'); loadCues(t); save();
  }
  MP.play = function (queue, idx) { MP.queue = queue; load(idx, true); };
  MP.next = function () { if (MP.idx + 1 < MP.queue.length) load(MP.idx + 1, true); };
  MP.prev = function () {
    if (audio.currentTime > 3 || MP.idx <= 0) { audio.currentTime = 0; tick(); }
    else load(MP.idx - 1, true);
  };
  MP.close = function () {
    audio.pause(); audio.removeAttribute('src'); audio.load();
    MP.queue = []; MP.idx = -1; MP.cur = null; MP.cues = null; MP.active = -1;
    bar.hidden = true; pop.hidden = true; root.classList.remove('mp-on');
    try { sessionStorage.removeItem('mp'); } catch (e) {}
    if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = null; } catch (e) {} }
    emit('track');
  };

  audio.addEventListener('play', function () { setIcon(); tick(); meta(); });
  audio.addEventListener('pause', function () { setIcon(); cancelAnimationFrame(raf); save(); });
  audio.addEventListener('seeked', tick);
  audio.addEventListener('durationchange', tick);
  audio.addEventListener('ended', function () {
    if (MP.idx + 1 < MP.queue.length) MP.next(); else { setIcon(); save(); }
  });
  // Помилка звуку: з'ясовуємо причину, двічі пробуємо ще раз (збій мережі), і лише потім запасний плеєр Drive.
  // Причину видно на екрані, якщо відкрити сторінку з ?debug=1 (далі запам'ятовується до закриття вкладки).
  var DEBUG = (function () {
    try { if (/[?&]debug\b/.test(location.search)) sessionStorage.setItem('mpDebug', '1'); return !!sessionStorage.getItem('mpDebug'); }
    catch (e) { return false; }
  })();
  var noteEl = null, noteTimer = 0;
  function say(text) {
    if (window.console) console.warn('[MP] ' + text);
    if (!DEBUG) return;
    if (!noteEl) {
      noteEl = document.createElement('div');
      noteEl.style.cssText = 'position:fixed;z-index:901;left:8px;right:8px;bottom:calc(104px + env(safe-area-inset-bottom,0px));max-width:720px;margin:0 auto;padding:8px 12px;border-radius:10px;background:rgba(70,20,24,.96);color:#ffdede;font:12px/1.4 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.4)';
      root.appendChild(noteEl);
    }
    noteEl.textContent = text; noteEl.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { noteEl.hidden = true; }, 20000);
  }
  function probe(src) {
    var ctrl = window.AbortController ? new AbortController() : null;
    return fetch(src, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
      if (r.ok) { if (ctrl) ctrl.abort(); return null; }
      return r.json().then(function (j) {
        var e = j && j.error, why = e && ((e.errors && e.errors[0] && e.errors[0].reason) || e.status || e.message);
        return 'HTTP ' + r.status + (why ? ' · ' + why : '');
      }, function () { return 'HTTP ' + r.status; });
    }, function () { return 'мережа / запит не пройшов'; });
  }
  var retry = { t: null, n: 0 };
  audio.addEventListener('playing', function () { retry.n = 0; });
  audio.addEventListener('error', function () {
    var t = MP.cur;
    if (!audio.getAttribute('src') || !t) return;
    if (retry.t !== t) { retry.t = t; retry.n = 0; }
    var pos = audio.currentTime || 0;
    probe(t.src).then(function (why) {
      if (MP.cur !== t) return;
      var transient = !why || /HTTP 5|rate|мережа/i.test(why);
      if (transient && retry.n < 2) {
        retry.n++;
        say('Збій завантаження' + (why ? ' (' + why + ')' : '') + ' — повторна спроба ' + retry.n + ' з 2');
        setTimeout(function () {
          if (MP.cur !== t) return;
          audio.src = t.src;
          if (pos > 0) audio.addEventListener('loadedmetadata', function f() {
            audio.removeEventListener('loadedmetadata', f);
            try { audio.currentTime = pos; } catch (e) {}
          });
          audio.play().catch(function () {});
        }, 800 * retry.n);
        return;
      }
      say('Звук не завантажився: ' + (why || 'невідома помилка') + ' — вмикаю запасний плеєр Google');
      emit('error');
    });
  });
  window.addEventListener('pagehide', save);

  toggleBtn.addEventListener('click', function () { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); });
  bar.querySelector('.mp-prev').addEventListener('click', MP.prev);
  bar.querySelector('.mp-next').addEventListener('click', MP.next);
  bar.querySelector('.mp-close').addEventListener('click', MP.close);
  seek.addEventListener('pointerdown', function () { seeking = true; });
  seek.addEventListener('input', function () {
    var d = audio.duration;
    if (isFinite(d) && d > 0) audio.currentTime = seek.value / 1000 * d;
  });
  seek.addEventListener('change', function () { seeking = false; tick(); });
  seek.addEventListener('pointerup', function () { seeking = false; });

  if ('mediaSession' in navigator) {
    var ms = navigator.mediaSession;
    [['play', function () { audio.play(); }], ['pause', function () { audio.pause(); }],
     ['previoustrack', MP.prev], ['nexttrack', MP.next],
     ['seekto', function (d) { audio.currentTime = d.seekTime; }]].forEach(function (h) {
      try { ms.setActionHandler(h[0], h[1]); } catch (e) {}
    });
  }

  /* ---------- перехід між сторінками без перезавантаження ---------- */
  var SHARED = /(^|\/)(i18n|pwa|search|miniplayer)\.js(\?|$)/;
  var curKey = location.pathname + location.search;
  var navId = 0;
  function pjaxOk(u) {
    return u.origin === location.origin && (/\.html$/.test(u.pathname) || /\/$/.test(u.pathname)) &&
      !/\/tools\//.test(u.pathname) && !/\/404\.html$/.test(u.pathname);
  }
  function rm(n) { if (n && n.parentNode) n.parentNode.removeChild(n); }

  function swap(u, html, push) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var nh = doc.querySelector('header'), hdr = document.querySelector('header'), owned = window.__pgOwned;
    if (!doc.body || !nh || !hdr || !owned) throw new Error('shape');
    var hb = hdr.querySelector('a.brand'), nbr = nh.querySelector('a.brand');
    var hn = hdr.querySelector('nav'), nn = nh.querySelector('nav');
    if (!hb || !nbr) throw new Error('header');
    var scripts = [].slice.call(doc.querySelectorAll('script')).filter(function (s) { return !/json/.test(s.type); });
    scripts.forEach(function (s) {
      var src = s.getAttribute('src');
      if (src && !SHARED.test(src)) throw new Error('external script');
    });
    scripts = scripts.filter(function (s) { return !s.getAttribute('src'); });

    MP._page = [];
    if (push) history.pushState({ mp: 1 }, '', u.href);
    curKey = u.pathname + u.search;

    var keep = {}, kept = [], added = [], hold = [], waits = [];
    owned.head.forEach(function (n) { if (n.tagName === 'LINK') keep[n.href] = n; });
    [].forEach.call(doc.head.children, function (n) {
      var tag = n.tagName, c;
      if (tag === 'LINK' && /stylesheet/i.test(n.getAttribute('rel') || '')) {
        var abs = new URL(n.getAttribute('href'), u.href).href;
        if (keep[abs]) { kept.push(keep[abs]); return; }
        c = document.createElement('link');
        c.rel = 'stylesheet'; c.media = 'print'; c.href = abs;
        waits.push(new Promise(function (res) { c.onload = c.onerror = res; }));
        document.head.appendChild(c); hold.push(c); added.push(c);
      } else if (tag === 'STYLE') {
        c = document.createElement('style');
        c.media = 'print'; c.textContent = n.textContent;
        document.head.appendChild(c); hold.push(c); added.push(c);
      } else if (tag === 'SCRIPT' && /^application/.test(n.type)) {
        c = document.createElement('script');
        c.type = n.type; if (n.id) c.id = n.id; c.textContent = n.textContent;
        document.head.appendChild(c); added.push(c);
      } else if (tag === 'META' && n.getAttribute('name') === 'description') {
        var m = document.querySelector('meta[name="description"]');
        if (m) m.setAttribute('content', n.getAttribute('content') || '');
      } else if (tag === 'LINK' && n.getAttribute('rel') === 'canonical') {
        var cn = document.querySelector('link[rel="canonical"]');
        if (cn) cn.setAttribute('href', n.getAttribute('href'));
      }
    });

    return Promise.race([Promise.all(waits), new Promise(function (r) { setTimeout(r, 2500); })]).then(function () {
      hold.forEach(function (c) { c.media = 'all'; });
      owned.body.concat(owned.inner || []).forEach(rm);
      owned.head.forEach(function (n) { if (kept.indexOf(n) < 0) rm(n); });
      hb.setAttribute('href', nbr.getAttribute('href'));
      if (hn && nn) hn.innerHTML = nn.innerHTML;   // меню на головній інше (якорі), тому копіюємо повністю
      ['data-i18n-title', 'data-i18n-desc'].forEach(function (a) {
        var v = doc.documentElement.getAttribute(a);
        if (v === null) root.removeAttribute(a); else root.setAttribute(a, v);
      });
      document.title = doc.title;
      // Шапка стоїть всередині обгортки (.wrap) разом із вмістом сторінки: шапку залишаємо, решту міняємо.
      var skip = function (n) { return n.tagName === 'SCRIPT' && !/json/.test(n.type); };
      var topL = hdr, topN = nh, nb = [], ni = [], before = true;
      while (topL.parentNode && topL.parentNode !== document.body) topL = topL.parentNode;
      while (topN.parentNode && topN.parentNode !== doc.body) topN = topN.parentNode;
      var after = topL.nextSibling;
      [].slice.call(doc.body.children).forEach(function (n) {
        if (n === topN) { before = false; return; }
        if (skip(n)) return;
        var c = document.importNode(n, true);
        document.body.insertBefore(c, before ? topL : after);
        nb.push(c);
      });
      if (topL !== hdr) {
        var hp = hdr.parentNode, nhp = nh.parentNode, ib = true, iref = hdr.nextSibling;
        hp.className = nhp.className;
        [].slice.call(nhp.children).forEach(function (n) {
          if (n === nh) { ib = false; return; }
          if (skip(n)) return;
          var c = document.importNode(n, true);
          hp.insertBefore(c, ib ? hdr : iref);
          ni.push(c);
        });
      }
      owned.head = kept.concat(added);
      owned.body = nb;
      owned.inner = ni;
      window.scrollTo(0, 0);
      scripts.forEach(function (s) {
        var e = document.createElement('script');
        e.textContent = s.textContent;
        document.body.appendChild(e);
        document.body.removeChild(e);
      });
      if (window.I18N && window.I18N.apply) window.I18N.apply();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));   // закрити пошук / підказки
      if (u.hash) {
        var tg = document.getElementById(decodeURIComponent(u.hash.slice(1)));
        if (tg) tg.scrollIntoView();
      }
    });
  }

  function go(href, push) {
    var u = new URL(href, location.href);
    if (!pjaxOk(u) || !window.__pgOwned) {
      if (window.console) console.warn('[MP] повне завантаження сторінки (немає знімка від pwa.js?)');
      location.href = u.href; return;
    }
    var id = ++navId;
    fetch(u.href, { credentials: 'same-origin' }).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      if (!r.ok || ct.indexOf('text/html') < 0) throw new Error('bad response');
      return r.text();
    }).then(function (html) {
      if (id !== navId) return;
      return swap(u, html, push);
    }).catch(function (err) {
      if (window.console) console.warn('[MP] перехід без перезавантаження не вдався:', err);
      if (id === navId) location.href = u.href;
    });
  }
  MP.go = function (href) { go(href, true); };

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-pjax')) return;
    var u = new URL(a.href, location.href);
    if (!pjaxOk(u) || u.pathname + u.search === curKey) return;
    e.preventDefault();
    go(u.href, true);
  });
  window.addEventListener('popstate', function () {
    if (location.pathname + location.search !== curKey) go(location.href, false);
  });
  history.replaceState({ mp: 1 }, '');

  /* ---------- відновлення після повного перезавантаження сторінки ---------- */
  try {
    var s = JSON.parse(sessionStorage.getItem('mp') || 'null');
    if (s && s.q && s.q[s.i]) { MP.queue = s.q; load(s.i, false, s.t); }
  } catch (e) {}
})();
