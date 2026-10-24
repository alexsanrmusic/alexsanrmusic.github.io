/* Alex Sanr — пошук по сайту (лупа в шапці).
   Шукає за назвою пісні, назвою альбому та рядками тексту.
   Дані (lyrics.json, albums.json) вантажаться лише при першому відкритті пошуку. */
(function () {
  var script = document.currentScript;
  var base = script && script.src ? script.src : location.href;
  function url(p) { return new URL(p, base).href; }
  function tr(key, vars) { return window.I18N ? window.I18N.t(key, vars) : key; }

  var FLAGS = { uk: '🇺🇦', en: '🇬🇧', ru: '🇷🇺' };
  var MAX = 8;
  var btn = null, panel = null, input = null, list = null, meta = null;
  var index = null, loading = null, timer = null, active = -1;

  // ---------- нормалізація ----------
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[’ʼ'`]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- дані ----------
  function load() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = Promise.all([
      fetch(url('albums.json')).then(function (r) { return r.json(); }),
      fetch(url('lyrics.json')).then(function (r) { return r.json(); })
    ]).then(function (res) {
      var albums = (res[0] && res[0].albums) || [], lyr = res[1] || {}, slugs = lyr._slugs || {};
      var items = [];
      albums.forEach(function (a) {
        var texts = lyr[a.id] || {};
        a.tracks.forEach(function (t, i) {
          var text = texts[t.title] || '';
          var slug = slugs[a.id] && slugs[a.id][t.title];
          items.push({
            title: t.title, album: a.title, lang: a.lang, text: text,
            href: slug ? url('songs/' + a.id + '/' + slug + '.html') : url('albums.html?album=' + encodeURIComponent(a.id) + '&track=' + (i + 1)),
            nTitle: norm(t.title), nAlbum: norm(a.title), nText: norm(text),
            lines: text ? text.split('\n') : []
          });
        });
      });
      index = items;
      return items;
    }).catch(function () { loading = null; return []; });
    return loading;
  }

  // ---------- пошук ----------
  function search(q) {
    var tokens = norm(q).split(' ').filter(Boolean);
    if (!tokens.length || norm(q).length < 2) return null;
    var out = [];
    index.forEach(function (it, pos) {
      var hay = it.nTitle + ' ' + it.nAlbum + ' ' + it.nText, score = 0, ok = true;
      for (var i = 0; i < tokens.length; i++) {
        if (hay.indexOf(tokens[i]) < 0) { ok = false; break; }
        if (it.nTitle.indexOf(tokens[i]) >= 0) score += 3;
        else if (it.nAlbum.indexOf(tokens[i]) >= 0) score += 1;
        else score += 1;
      }
      if (!ok) return;
      if (it.nTitle.indexOf(norm(q)) === 0) score += 2;
      out.push({ it: it, score: score, pos: pos });
    });
    out.sort(function (a, b) { return b.score - a.score || a.pos - b.pos; });
    return { tokens: tokens, hits: out };
  }

  function tokenRegex(tokens) {
    var parts = tokens.map(function (tk) {
      return tk.split('').map(function (ch) {
        var c = ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (ch === 'е') c = '[еёЕЁ]';
        return c;
      }).join('[’ʼ\'`]?');
    });
    try { return new RegExp('(' + parts.join('|') + ')', 'giu'); } catch (e) { return null; }
  }
  function mark(s, re) {
    if (!re) return esc(s);
    return esc(s).replace(re, '<mark>$1</mark>');
  }
  function snippet(it, tokens) {
    if (!it.lines.length) return '';
    var best = '', bestN = 0;
    for (var i = 0; i < it.lines.length; i++) {
      var n = norm(it.lines[i]), c = 0;
      if (!n) continue;
      for (var k = 0; k < tokens.length; k++) if (n.indexOf(tokens[k]) >= 0) c++;
      if (c > bestN) { bestN = c; best = it.lines[i]; if (c === tokens.length) break; }
    }
    return best.trim();
  }

  // ---------- інтерфейс ----------
  function css() {
    var s = document.createElement('style');
    s.textContent =
      '.hdr-tools{order:2;display:inline-flex;align-items:center;gap:10px}' +
      '.sx-btn{display:inline-grid;place-items:center;width:36px;height:36px;padding:0;border-radius:50%;border:1px solid var(--line,rgba(255,255,255,.16));background:rgba(255,255,255,.04);color:var(--fg,#e8ecff);cursor:pointer;transition:border-color .2s,background .2s}' +
      '.sx-btn:hover,.sx-btn[aria-expanded="true"]{border-color:var(--accent,#ffc83d);background:rgba(255,255,255,.08)}' +
      '.sx-btn:focus-visible{outline:2px solid var(--blue,#8ba4ff);outline-offset:2px}' +
      '.sx-btn svg{width:17px;height:17px;display:block}' +
      '.sx-panel{position:fixed;z-index:1001;left:50%;transform:translateX(-50%);width:min(640px,calc(100vw - 24px));max-height:calc(100vh - 90px);overflow:auto;box-sizing:border-box;padding:14px;border-radius:18px;background:#141a36;border:1px solid rgba(255,255,255,.18);box-shadow:0 24px 60px rgba(0,0,0,.55);color:#e8ecff;font-family:inherit}' +
      '.sx-panel[hidden]{display:none}' +
      '.sx-field{display:flex;align-items:center;gap:10px;padding:0 14px;border:1.5px solid var(--accent,#ffc83d);border-radius:12px;background:#0b0f1f}' +
      '.sx-field svg{flex:none;width:18px;height:18px;color:#9aa4c4}' +
      '.sx-field input{flex:1;min-width:0;padding:12px 0;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:16px}' +
      '.sx-meta{margin:12px 4px 6px;color:#9aa4c4;font-size:13px;min-height:1.2em}' +
      '.sx-list{list-style:none;margin:0;padding:0}' +
      '.sx-r{display:block;padding:10px 12px;border-radius:12px;color:inherit;text-decoration:none}' +
      '.sx-r:hover,.sx-r.on{background:rgba(255,255,255,.07)}' +
      '.sx-r:focus-visible{outline:2px solid var(--blue,#8ba4ff)}' +
      '.sx-r b{display:block;font-weight:600;font-size:15px;overflow-wrap:anywhere}' +
      '.sx-r small{display:block;margin-top:1px;color:#9aa4c4;font-size:12px}' +
      '.sx-r p{margin:3px 0 0;color:#c8d0ee;font-size:14px;overflow-wrap:anywhere}' +
      '.sx-r mark{background:var(--accent,#ffc83d);color:#0b0f1f;border-radius:3px;padding:0 2px}';
    document.head.appendChild(s);
  }

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

  function build() {
    var header = document.querySelector('header');
    if (!header || btn) return;
    css();
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sx-btn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = ICON;
    btn.title = tr('search.label');
    btn.setAttribute('aria-label', tr('search.label'));
    btn.addEventListener('click', function () { if (panel && !panel.hidden) close(); else open(); });

    var box = header.querySelector('.lang-switch');
    var wrap = document.createElement('div');
    wrap.className = 'hdr-tools';
    if (box) { header.insertBefore(wrap, box); wrap.appendChild(btn); wrap.appendChild(box); }
    else { wrap.appendChild(btn); header.appendChild(wrap); }
  }

  function makePanel() {
    panel = document.createElement('div');
    panel.className = 'sx-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', tr('search.label'));
    panel.innerHTML = '<div class="sx-field">' + ICON + '<input type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"></div>' +
      '<div class="sx-meta" aria-live="polite"></div><ul class="sx-list"></ul>';
    input = panel.querySelector('input');
    meta = panel.querySelector('.sx-meta');
    list = panel.querySelector('.sx-list');
    input.placeholder = tr('search.placeholder');
    input.setAttribute('aria-label', tr('search.label'));
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 80); });
    input.addEventListener('keydown', onKey);
    document.body.appendChild(panel);
    document.addEventListener('mousedown', function (e) {
      if (panel.hidden) return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); } });
    window.addEventListener('resize', place);
  }

  function place() {
    if (!panel || panel.hidden) return;
    var h = document.querySelector('header');
    var bottom = h ? h.getBoundingClientRect().bottom : 60;
    panel.style.top = Math.max(8, Math.round(bottom) + 8) + 'px';
  }

  function open() {
    if (!panel) makePanel();
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    place();
    meta.textContent = tr('search.hint');
    input.focus();
    load().then(function () { if (input.value) run(); });
  }
  function close() {
    if (!panel) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  function setActive(i) {
    var rows = list.querySelectorAll('.sx-r');
    if (!rows.length) { active = -1; return; }
    active = (i + rows.length) % rows.length;
    for (var k = 0; k < rows.length; k++) rows[k].classList.toggle('on', k === active);
    rows[active].scrollIntoView({ block: 'nearest' });
  }
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') {
      var rows = list.querySelectorAll('.sx-r');
      var r = rows[active >= 0 ? active : 0];
      if (r) { e.preventDefault(); if (window.MP && window.MP.go) window.MP.go(r.href); else location.href = r.href; }
    }
  }

  function run() {
    if (!index) { meta.textContent = tr('search.loading'); load().then(run); return; }
    var q = input.value, res = search(q);
    list.textContent = '';
    active = -1;
    if (!res) { meta.textContent = tr('search.hint'); return; }
    if (!res.hits.length) { meta.textContent = tr('search.none'); return; }
    var re = tokenRegex(res.tokens);
    var html = '';
    res.hits.slice(0, MAX).forEach(function (h) {
      var it = h.it, sn = snippet(it, res.tokens);
      html += '<li><a class="sx-r" href="' + esc(it.href) + '"><b>' + mark(it.title, re) + '</b><small>' +
        (FLAGS[it.lang] || '') + ' ' + mark(it.album, re) + '</small>' +
        (sn ? '<p>…' + mark(sn, re) + '…</p>' : '') + '</a></li>';
    });
    list.innerHTML = html;
    var extra = res.hits.length - MAX;
    meta.textContent = tr('search.found', { n: res.hits.length }) + (extra > 0 ? ' · ' + tr('search.more', { n: extra }) : '');
    setActive(0);
  }

  // i18n.js додає перемикач мов на DOMContentLoaded, тому чекаємо на цю подію (defer-скрипт виконується раніше)
  if (document.readyState === 'complete') build();
  else { document.addEventListener('DOMContentLoaded', build); window.addEventListener('load', build); }
})();
