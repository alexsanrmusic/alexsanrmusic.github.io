/* Alex Sanr — мова сайту (uk / ru / en).
   Вибір: ?lang=… у посиланні -> збережений вибір -> мова браузера -> English.
   Українська — мова самого HTML. Для ru/en текст підставляється зі словника нижче.
   Динамічні сторінки беруть рядки через I18N.t(ключ) та I18N.plural(ключ, n). */
(function () {
  var CODES = ['uk', 'ru', 'en'];
  var KEY = 'alexsanr-lang';
  var LOCALES = { uk: 'uk-UA', ru: 'ru-RU', en: 'en-GB' };

  // [uk, ru, en]
  var D = {
    'nav.home': ['Головна', 'Главная', 'Home'],
    'nav.about': ['Про проєкт', 'О проекте', 'About'],
    'nav.author': ['Про автора', 'Об авторе', 'About me'],
    'nav.releases': ['Релізи', 'Релизы', 'Releases'],
    'nav.albums': ['Альбоми', 'Альбомы', 'Albums'],
    'nav.lyrics': ['Тексти', 'Тексты', 'Lyrics'],
    'nav.contact': ['Контакти', 'Контакты', 'Contact'],
    'skip': ['До змісту', 'К содержимому', 'Skip to content'],
    'lang.label': ['Мова сайту', 'Язык сайта', 'Site language'],

    'index.title': ['Alex Sanr — AI-музичний проєкт з України', 'Alex Sanr — AI-музыкальный проект из Украины', 'Alex Sanr — AI music project from Ukraine'],
    'index.desc': ['Alex Sanr — AI-музичний проєкт з України. Пісні, альбоми та музичні історії.', 'Alex Sanr — AI-музыкальный проект из Украины. Песни, альбомы и музыкальные истории.', 'Alex Sanr — an AI music project from Ukraine. Songs, albums and musical stories.'],
    'hero.eyebrow': ['AI-музичний проєкт з України', 'AI-музыкальный проект из Украины', 'AI music project from Ukraine'],
    'hero.tagline': ['Коли ідея перетворюється на музику.', 'Когда идея превращается в музыку.', 'When an idea turns into music.'],
    'hero.lead': [
      'Авторські ідеї й тексти поєднуються з можливостями штучного інтелекту. Так з\'являються пісні, альбоми та музичні історії про життя, емоції та настрій.',
      'Авторские идеи и тексты соединяются с возможностями искусственного интеллекта. Так появляются песни, альбомы и музыкальные истории о жизни, эмоциях и настроении.',
      'Original ideas and lyrics meet the possibilities of artificial intelligence. This is how songs, albums and musical stories about life, emotions and mood come to be.'],
    'hero.listen': ['Слухати на YouTube', 'Слушать на YouTube', 'Listen on YouTube'],
    'hero.subscribe': ['Підписатися', 'Подписаться', 'Subscribe'],
    'hero.photo': ['Музиканти у студії звукозапису', 'Музыканты в студии звукозаписи', 'Musicians in a recording studio'],

    'about.h': ['Що на каналі', 'Что на канале', 'What is on the channel'],
    'about.1h': ['Авторські треки та альбоми', 'Авторские треки и альбомы', 'Original tracks and albums'],
    'about.1p': ['Власні пісні від ідеї до готового релізу.', 'Собственные песни от идеи до готового релиза.', 'My own songs, from the idea to the finished release.'],
    'about.2h': ['Тексти пісень', 'Тексты песен', 'Song lyrics'],
    'about.2p': ['Тексти про кохання, свобода, мрії та все, що поруч.', 'Тексты о любви, свободе, мечтах и обо всём, что рядом.', 'Lyrics about love, freedom, dreams and everything around us.'],
    'about.3h': ['Встановіть застосунок', 'Установите приложение', 'Install the app'],
    'about.3p': ['Альбоми, тексти й новинки з екрана телефона.', 'Альбомы, тексты и новинки с экрана телефона.', 'Albums, lyrics and new releases right from your phone screen.'],
    'about.4h': ['Експерименти', 'Эксперименты', 'Experiments'],
    'about.4p': ['Нове звучання та несподівані поєднання жанрів.', 'Новое звучание и неожиданные сочетания жанров.', 'New sounds and unexpected genre mixes.'],
    'tags.label': ['Жанри', 'Жанры', 'Genres'],
    'tags.pop': ['Українська поп-музика', 'Украинская поп-музыка', 'Ukrainian pop'],
    'tags.rap': ['Український реп', 'Украинский рэп', 'Ukrainian rap'],

    'author.h': ['Про автора', 'Об авторе', 'About the author'],
    'author.1': [
      'Під псевдонімом Alex Sanr я пишу пісні про кохання, сумніви, надії й прості миті, які часом виявляються найважливішими.',
      'Под псевдонимом Alex Sanr я пишу песни о любви, сомнениях, надеждах и простых мгновениях, которые порой оказываются самыми важными.',
      'Under the pseudonym Alex Sanr, I write songs about love, doubt, hope and the simple moments that sometimes turn out to be the most important.'],
    'author.2': [
      'Народження дітей змінило мій погляд на життя: я навчився цінувати час і людей поруч. Тому мені важливі не просто красиві звуки, а емоції та історії, у яких можна впізнати себе.',
      'Рождение детей изменило мой взгляд на жизнь: я научился ценить время и людей рядом. Поэтому мне важны не просто красивые звуки, а эмоции и истории, в которых можно узнать себя.',
      'The birth of my children changed the way I see life: I learned to value time and the people around me. That is why what matters to me is not just beautiful sound, but emotions and stories in which you can recognize yourself.'],
    'author.3': [
      'Тексти й ідеї — мої, а звучання я створюю за допомогою штучного інтелекту. Я не повчаю й не маю відповідей на все — просто ділюся тим, що мені близьке.',
      'Тексты и идеи — мои, а звучание я создаю с помощью искусственного интеллекта. Я не поучаю и не имею ответов на всё — просто делюсь тем, что мне близко.',
      'The lyrics and ideas are mine, and I create the sound with the help of artificial intelligence. I don\'t preach and I don\'t have all the answers — I simply share what is close to me.'],
    'author.sign': ['Це Alex Sanr. Моє життя. Мої почуття. Моя музика.', 'Это Alex Sanr. Моя жизнь. Мои чувства. Моя музыка.', 'This is Alex Sanr. My life. My feelings. My music.'],
    'author.start': ['Почни знайомство з моєю музикою — «Повернення з небуття» ↓', 'Начни знакомство с моей музыкой — «Возвращение из небытия» ↓', 'Start getting to know my music — “Return from Nonexistence” ↓'],
    'author.player': ['Alex Sanr — Повернення з небуття', 'Alex Sanr — Возвращение из небытия', 'Alex Sanr — Return from Nonexistence'],
    'author.open': ['Відкрити на YouTube →', 'Открыть на YouTube →', 'Open on YouTube →'],

    'home.albums': ['Альбоми', 'Альбомы', 'Albums'],
    'home.allAlbums': ['Усі альбоми →', 'Все альбомы →', 'All albums →'],
    'home.langPick': ['Мова альбомів', 'Язык альбомов', 'Album language'],

    'rel.h': ['Останні релізи', 'Последние релизы', 'Latest releases'],
    'rel.all': ['Усі відео →', 'Все видео →', 'All videos →'],
    'rel.empty1': ['Свіжі релізи — на ', 'Свежие релизы — на ', 'Fresh releases are on the '],
    'rel.empty2': ['YouTube-каналі', 'YouTube-канале', 'YouTube channel'],
    'listen.h': ['Слухай зараз', 'Слушай сейчас', 'Listen now'],
    'listen.player': ['Треки Alex Sanr на YouTube', 'Треки Alex Sanr на YouTube', 'Alex Sanr tracks on YouTube'],
    'shorts.empty1': ['Короткі відео — на ', 'Короткие видео — на ', 'Short videos are on the '],

    'contact.h': ['Контакти', 'Контакты', 'Contact'],
    'contact.collab': ['Співпраця та запити', 'Сотрудничество и запросы', 'Collaboration and enquiries'],
    'contact.collabP': ['Пишіть щодо спільних проєктів, використання музики та інших пропозицій.', 'Пишите по поводу совместных проектов, использования музыки и других предложений.', 'Write to me about joint projects, using the music and other proposals.'],
    'contact.copy': ['Копіювати', 'Копировать', 'Copy'],
    'contact.copied': ['Скопійовано', 'Скопировано', 'Copied'],
    'contact.selected': ['Виділено', 'Выделено', 'Selected'],
    'contact.write': ['Написати', 'Написать', 'Write'],
    'contact.pages': ['Мої сторінки', 'Мои страницы', 'My pages'],
    'contact.pagesP': ['Нові релізи та короткі відео виходять на цих каналах.', 'Новые релизы и короткие видео выходят на этих каналах.', 'New releases and short videos come out on these channels.'],

    'albums.title': ['Альбоми — Alex Sanr', 'Альбомы — Alex Sanr', 'Albums — Alex Sanr'],
    'install.title': ['Встановити застосунок — Alex Sanr', 'Установить приложение — Alex Sanr', 'Install the app — Alex Sanr'],
    'install.desc': ['Встановіть застосунок Alex Sanr на телефон або комп\'ютер: слухайте альбоми та читайте тексти без магазину застосунків.', 'Установите приложение Alex Sanr на телефон или компьютер: слушайте альбомы и читайте тексты без магазина приложений.', 'Install the Alex Sanr app on your phone or computer: listen to albums and read lyrics without an app store.'],
    'albums.desc': ['Альбоми Alex Sanr: слухайте онлайн, завантажуйте треки та дивіться кліпи.', 'Альбомы Alex Sanr: слушайте онлайн, скачивайте треки и смотрите клипы.', 'Alex Sanr albums: listen online, download tracks and watch the videos.'],
    'albums.h1': ['Альбоми', 'Альбомы', 'Albums'],
    'albums.lead': ['Слухайте онлайн, завантажуйте треки та дивіться кліпи.', 'Слушайте онлайн, скачивайте треки и смотрите клипы.', 'Listen online, download tracks and watch the videos.'],
    'albums.loading': ['Завантаження…', 'Загрузка…', 'Loading…'],
    'albums.noscript': ['Для перегляду альбомів потрібен JavaScript.', 'Для просмотра альбомов нужен JavaScript.', 'JavaScript is required to view the albums.'],
    'albums.empty': ['Альбомів цією мовою поки немає.', 'Альбомов на этом языке пока нет.', 'No albums in this language yet.'],
    'albums.error': ['Не вдалося завантажити список альбомів. Спробуйте оновити сторінку.', 'Не удалось загрузить список альбомов. Попробуйте обновить страницу.', 'Couldn\'t load the album list. Please try refreshing the page.'],
    'filters.label': ['Мова пісень:', 'Язык песен:', 'Song language:'],
    'filters.aria': ['Мова', 'Язык', 'Language'],
    'track.play': ['♪ Слухати', '♪ Слушать', '♪ Listen'],
    'track.close': ['■ Закрити', '■ Закрыть', '■ Close'],
    'track.download': ['⬇ Завантажити', '⬇ Скачать', '⬇ Download'],
    'track.clip': ['▶ Дивитись кліп', '▶ Смотреть клип', '▶ Watch the video'],
    'track.playAria': ['Слухати: {t}', 'Слушать: {t}', 'Listen: {t}'],
    'track.downloadAria': ['Завантажити: {t}', 'Скачать: {t}', 'Download: {t}'],
    'track.clipAria': ['Дивитись кліп: {t}', 'Смотреть клип: {t}', 'Watch the video: {t}'],
    'track.player': ['Плеєр Google Drive — {t}', 'Плеер Google Drive — {t}', 'Google Drive player — {t}'],
    'lyrics.label': ['Текст пісні', 'Текст песни', 'Lyrics'],

    'lyrics.title': ['Тексти пісень — Alex Sanr', 'Тексты песен — Alex Sanr', 'Song lyrics — Alex Sanr'],
    'lyrics.desc': ['Тексти пісень Alex Sanr українською, англійською та російською. Читайте онлайн і слухайте пісні на сайті.', 'Тексты песен Alex Sanr на украинском, английском и русском. Читайте онлайн и слушайте песни на сайте.', 'Alex Sanr\'s song lyrics in Ukrainian, English and Russian. Read online and listen to the songs on the site.'],
    'lyrics.h1': ['Тексти', 'Тексты', 'Lyrics'],
    'lyrics.lead': ['Тексти пісень Alex Sanr. Відкрийте альбом, а потім пісню, щоб прочитати текст, або одразу слухайте її на сторінці альбому.', 'Тексты песен Alex Sanr. Откройте альбом, а затем песню, чтобы прочитать текст, или сразу слушайте её на странице альбома.', 'Alex Sanr\'s song lyrics. Open an album, then a song to read the lyrics, or listen to it right away on the album page.'],
    'lyrics.noscript': ['Для читання текстів у списку потрібен JavaScript. Тексти є на окремих сторінках пісень:', 'Для чтения текстов в списке нужен JavaScript. Тексты есть на отдельных страницах песен:', 'JavaScript is needed to read the lyrics in the list. The lyrics are also on the individual song pages:'],
    'lyrics.songPage': ['Окрема сторінка пісні →', 'Отдельная страница песни →', 'Song page →'],
    'lyrics.listenAlbum': ['♪ Слухати альбом', '♪ Слушать альбом', '♪ Listen to the album'],

    'song.crumbs': ['Навігація', 'Навигация', 'Navigation'],
    'song.share': ['↗ Поділитися', '↗ Поделиться', '↗ Share'],
    'song.copied': ['Скопійовано', 'Скопировано', 'Copied'],
    'song.prev': ['← Попередня пісня', '← Предыдущая песня', '← Previous song'],
    'song.next': ['Наступна пісня →', 'Следующая песня →', 'Next song →'],
    'song.allLyrics': ['Усі тексти', 'Все тексты', 'All lyrics'],
    'song.album': ['Альбом «{a}»', 'Альбом «{a}»', 'Album “{a}”'],

    'lang.uk': ['Українська', 'Украинский', 'Ukrainian'],
    'lang.ru': ['Російська', 'Русский', 'Russian'],
    'lang.en': ['Англійська', 'Английский', 'English'],

    'e404.title': ['Сторінку не знайдено — Alex Sanr', 'Страница не найдена — Alex Sanr', 'Page not found — Alex Sanr'],
    'e404.p': ['Такої сторінки немає. Можливо, посилання застаріло.', 'Такой страницы нет. Возможно, ссылка устарела.', 'There is no such page. The link may be out of date.']
  };

  // Множина: [uk[1,2-4,5+], ru[1,2-4,5+], en[1,інше]]
  var P = {
    'texts': [['текст', 'тексти', 'текстів'], ['текст', 'текста', 'текстов'], ['text', 'texts']],
    'albums': [['альбом', 'альбоми', 'альбомів'], ['альбом', 'альбома', 'альбомов'], ['album', 'albums']],
    'tracks': [['трек', 'треки', 'треків'], ['трек', 'трека', 'треков'], ['track', 'tracks']],
    'languages': [['мова', 'мови', 'мов'], ['язык', 'языка', 'языков'], ['language', 'languages']]
  };

  function pickLang() {
    var q = null, saved = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    if (CODES.indexOf(q) >= 0) { try { localStorage.setItem(KEY, q); } catch (e) {} return q; }
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (CODES.indexOf(saved) >= 0) return saved;
    var nl = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
    return CODES.indexOf(nl) >= 0 ? nl : 'en';
  }

  var lang = pickLang();
  var idx = CODES.indexOf(lang);
  var root = document.documentElement;
  root.lang = lang;
  if (lang !== 'uk') root.classList.add('i18n-wait');
  // страховка: якщо скрипт не доїде до застосування, сторінку все одно покажемо
  setTimeout(function () { root.classList.remove('i18n-wait'); }, 1500);

  function t(key, vars) {
    var e = D[key];
    var s = e ? (e[idx] != null ? e[idx] : e[0]) : key;
    if (vars) for (var k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function plural(key, n) {
    var f = P[key][idx];
    n = Math.abs(n);
    if (lang === 'en') return n === 1 ? f[0] : f[1];
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return f[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return f[1];
    return f[2];
  }

  function apply() {
    if (lang !== 'uk') {
      var i, els = document.querySelectorAll('[data-i18n]');
      for (i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute('data-i18n'), els[i].dataset.vars ? JSON.parse(els[i].dataset.vars) : null);
      els = document.querySelectorAll('[data-i18n-attr]');
      for (i = 0; i < els.length; i++) {
        els[i].getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
          var p = pair.split(':');
          if (p.length === 2) this.setAttribute(p[0].trim(), t(p[1].trim(), this.dataset.vars ? JSON.parse(this.dataset.vars) : null));
        }, els[i]);
      }
      els = document.querySelectorAll('[data-i18n-plural]');
      for (i = 0; i < els.length; i++) els[i].textContent = plural(els[i].getAttribute('data-i18n-plural'), +els[i].dataset.n);
      els = document.querySelectorAll('[data-i18n-count]');
      for (i = 0; i < els.length; i++) els[i].textContent = els[i].dataset.n + ' ' + plural(els[i].getAttribute('data-i18n-count'), +els[i].dataset.n);
      var tk = root.getAttribute('data-i18n-title'); if (tk) document.title = t(tk);
      var dk = root.getAttribute('data-i18n-desc');
      if (dk) { var m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', t(dk)); }
    }
    root.classList.remove('i18n-wait');
  }

  function switcher() {
    var header = document.querySelector('header');
    if (!header || header.querySelector('.lang-switch')) return;
    var box = document.createElement('div');
    box.className = 'lang-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', t('lang.label'));
    [['uk', 'UA'], ['ru', 'RU'], ['en', 'EN']].forEach(function (x) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = x[1]; b.lang = x[0];
      b.setAttribute('aria-pressed', String(x[0] === lang));
      b.addEventListener('click', function () {
        try { localStorage.setItem(KEY, x[0]); } catch (e) {}
        var u = new URL(location.href);
        u.searchParams.delete('lang');
        location.replace(u.pathname + u.search + u.hash);
        if (location.href === u.href) location.reload();
      });
      box.appendChild(b);
    });
    header.appendChild(box);
  }

  var css = document.createElement('style');
  css.textContent =
    'html.i18n-wait body{visibility:hidden}' +
    '.lang-switch{order:2;display:inline-flex;gap:2px;padding:3px;border:1px solid var(--line,rgba(255,255,255,.16));border-radius:999px}' +
    '.lang-switch button{font:inherit;font-size:12px;font-weight:600;letter-spacing:.04em;padding:5px 10px;border:0;border-radius:999px;background:transparent;color:var(--muted,#9aa4c4);cursor:pointer}' +
    '.lang-switch button:hover{color:var(--fg,#edf0f9)}' +
    '.lang-switch button[aria-pressed="true"]{background:var(--accent,#ffc83d);color:var(--accent-ink,#0b0f1f)}' +
    '.lang-switch button:focus-visible{outline:2px solid var(--blue,#8ba4ff);outline-offset:2px}';
  document.head.appendChild(css);

  function ready() { switcher(); apply(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

  window.I18N = { lang: lang, locale: LOCALES[lang], t: t, plural: plural };
})();
