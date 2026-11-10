/* Alex Sanr — зимове оформлення: гірлянда (на всіх сторінках) і сніг (головна та альбоми).
   Вмикається саме: з 1 грудня по 27 лютого. Далі нічого прибирати не треба.
   Кнопка «❄» зліва внизу вмикає/вимикає все оформлення, вибір запам'ятовується.
   Перегляд поза сезоном: додайте ?winter=1 до адреси (?winter=0 — вимкнути перегляд). */
(function () {
  try {
    if (window.__winter) return;
    var KEY = 'alexsanr-winter';
    var force = (/[?&]winter=(0|1)\b/.exec(location.search) || [])[1];
    var d = new Date(), m = d.getMonth(), day = d.getDate();
    var season = m === 11 || m === 0 || (m === 1 && day <= 27);
    if (force === '1') season = true;
    if (force === '0' || !season) return;
    window.__winter = 1;

    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var root = document.documentElement;
    function lang() { return (window.I18N && I18N.lang) || root.lang || 'uk'; }
    var T = {
      uk: { off: 'Вимкнути зимове оформлення', on: 'Увімкнути зимове оформлення' },
      ru: { off: 'Выключить зимнее оформление', on: 'Включить зимнее оформление' },
      en: { off: 'Turn winter decorations off', on: 'Turn winter decorations on' }
    };
    function tr(k) { return (T[lang()] || T.uk)[k]; }

    var enabled = true;
    try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) {}

    /* ---------- стилі ---------- */
    var css =
      '.wt-gar{position:fixed;z-index:120;top:0;left:0;right:0;height:30px;overflow:hidden;pointer-events:none;display:flex;justify-content:center}' +
      '.wt-gar i{flex:none;position:relative;width:38px;height:12px;border-bottom:2px solid #3a466f;border-radius:0 0 50% 50% / 0 0 100% 100%;margin-top:-1px}' +
      '.wt-gar b{position:absolute;left:50%;bottom:-13px;width:8px;height:12px;margin-left:-4px;border-radius:50% 50% 55% 55% / 40% 40% 60% 60%;background:var(--c);opacity:.92}' +
      '.wt-gar b:before{content:"";position:absolute;left:1px;top:-4px;width:6px;height:5px;border-radius:1px;background:#3a466f}' +
      '.wt-gar b:after{content:"";position:absolute;left:-9px;top:-7px;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle,var(--c) 0%,transparent 68%);opacity:.5}' +
      '.wt-anim .wt-gar b:after{animation:wt-tw var(--d) ease-in-out var(--l) infinite}' +
      '@keyframes wt-tw{0%,100%{opacity:.18}50%{opacity:.7}}' +
      '.wt-snow{position:fixed;z-index:60;left:0;top:0;width:100%;height:100%;pointer-events:none}' +
      '.wt-btn{position:fixed;z-index:880;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:38px;height:38px;border-radius:50%;border:1px solid var(--line,#272f4f);background:rgba(21,27,50,.88);color:#cfe0ff;font:18px/1 system-ui,sans-serif;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;opacity:.75;transition:opacity .15s,border-color .15s}' +
      '.wt-btn:hover,.wt-btn:focus-visible{opacity:1;border-color:var(--accent,#ffc83d)}' +
      '.wt-btn[aria-pressed=false]{opacity:.5;color:#7d88ad}' +
      '.wt-btn[aria-pressed=false]:after{content:"";position:absolute;width:24px;height:2px;background:#7d88ad;transform:rotate(-45deg)}' +
      'html.mp-on .wt-btn{bottom:calc(112px + env(safe-area-inset-bottom,0px))}' +
      '.wt-off .wt-gar,.wt-off .wt-snow{display:none}';
    var st = document.createElement('style');
    st.setAttribute('data-shared', '');
    st.textContent = css;
    document.head.appendChild(st);
    if (!reduce) root.classList.add('wt-anim');

    /* ---------- гірлянда ---------- */
    var gar = document.createElement('div');
    gar.className = 'wt-gar';
    gar.setAttribute('aria-hidden', 'true');
    var COLORS = ['#ffc83d', '#8ba4ff', '#ff6b81', '#5fe3a1'];
    var built = 0;
    function buildGarland() {
      var n = Math.ceil(window.innerWidth / 38) + 1;
      if (n === built) return;
      built = n;
      var h = '';
      for (var i = 0; i < n; i++) {
        h += '<i><b style="--c:' + COLORS[i % 4] + ';--d:' + (2 + (i * 7 % 5) * 0.45).toFixed(2) + 's;--l:-' + ((i * 13 % 10) * 0.31).toFixed(2) + 's"></b></i>';
      }
      gar.innerHTML = h;
    }
    buildGarland();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildGarland, 150); });
    document.body.appendChild(gar);

    /* ---------- сніг (canvas, ~30 кадрів/с, зупиняється у фоні) ---------- */
    var cv = null, ctx = null, flakes = [], raf = 0, last = 0, W = 0, H = 0;
    function snowPage() {
      var p = location.pathname.replace(/\/+$/, '');
      return p === '' || /\/index\.html$/.test(p) || /\/albums\.html$/.test(p) || p === location.pathname.replace(/[^/]*$/, '').replace(/\/+$/, '');
    }
    function resize() {
      if (!cv) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function mk(top) {
      return { x: Math.random() * W, y: top ? -10 : Math.random() * H, r: 1.2 + Math.random() * 2.2, v: 14 + Math.random() * 22, ph: Math.random() * 6.28, sw: 8 + Math.random() * 14, a: 0.45 + Math.random() * 0.45 };
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return;
      var dt = Math.min((t - last) / 1000, 0.1); last = t;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.v * dt; f.ph += dt * 0.8;
        var x = f.x + Math.sin(f.ph) * f.sw;
        if (f.y > H + 10) { flakes[i] = f = mk(true); f.x = Math.random() * W; }
        ctx.globalAlpha = f.a;
        ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, 6.2832); ctx.fill();
      }
    }
    function snowStart() {
      if (reduce || raf) return;
      if (!cv) {
        cv = document.createElement('canvas');
        cv.className = 'wt-snow';
        cv.setAttribute('aria-hidden', 'true');
        ctx = cv.getContext('2d');
        if (!ctx) { cv = null; return; }
        document.body.appendChild(cv);
        window.addEventListener('resize', resize);
      }
      resize();
      var n = W < 600 ? 30 : 38;
      flakes = []; for (var i = 0; i < n; i++) flakes.push(mk(false));
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function snowStop() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (cv && ctx) ctx.clearRect(0, 0, W, H);
    }

    /* ---------- кнопка і керування ---------- */
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wt-btn';
    btn.textContent = '❄';
    function sync() {
      root.classList.toggle('wt-off', !enabled);
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      var s = enabled ? tr('off') : tr('on');
      btn.setAttribute('aria-label', s); btn.title = s;
      if (enabled && snowPage()) snowStart(); else snowStop();
    }
    btn.addEventListener('click', function () {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) {}
      sync();
    });
    document.body.appendChild(btn);
    sync();

    /* перехід між сторінками без перезавантаження (міні-плеєр) — оновлюємо сніг і мову підказки */
    function onNav() { setTimeout(sync, 60); }
    window.addEventListener('popstate', onNav);
    var ps = history.pushState;
    history.pushState = function () { var r = ps.apply(this, arguments); onNav(); return r; };
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else if (enabled && snowPage()) snowStart();
    });
  } catch (e) {}
})();
