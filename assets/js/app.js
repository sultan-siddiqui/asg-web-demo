/* ASG landing — app.
   i18n · loader · smooth scroll · scroll choreography · sectors rail · energy grid · project map · footprint */
(function () {
  'use strict';
  var D = document, H = D.documentElement, W = window;
  var C = W.ASG_CONTENT;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(W.gsap && W.ScrollTrigger);
  if (reduce || !hasGsap) H.classList.add('no-motion');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var lang = H.lang === 'ar' ? 'ar' : 'en';
  var isRTL = function () { return lang === 'ar'; };
  var introDone = false;

  /* merged data: Arabic arrays only carry text, the rest comes from English */
  function data(key) {
    var en = C.en[key], ar = C.ar[key];
    if (lang === 'en' || !ar) return en;
    if (Array.isArray(en)) return en.map(function (o, i) { return (o && typeof o === 'object' && !Array.isArray(o)) ? Object.assign({}, o, ar[i] || {}) : (ar[i] || o); });
    return Object.assign({}, en, ar);
  }
  function t(k) { var v = C[lang].t[k]; return v == null ? C.en.t[k] : v; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ARROW = '<svg class="arr" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 5h16M12 1l4 4-4 4"/></svg>';

  /* =================================================================== i18n */
  function splitWords(el) {
    var walk = D.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walk.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/(\s+)/), frag = D.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(D.createTextNode(' ')); return; }
        var w = D.createElement('span'); w.className = 'w';
        var i = D.createElement('span'); i.textContent = p; w.appendChild(i); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  function splitScrub(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="ww">' + esc(w) + '</span>'; }).join(' ');
  }

  function applyText() {
    H.lang = lang; H.dir = isRTL() ? 'rtl' : 'ltr';
    D.title = t('meta.title');
    themeLabel();
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    $$('[data-i18n-alt]').forEach(function (el) { el.setAttribute('alt', t(el.getAttribute('data-i18n-alt'))); });
    $$('[data-split]').forEach(splitWords);
    $$('[data-words]').forEach(splitScrub);
    renderAll();
  }

  /* =================================================================== theme */
  function isLight() { return H.getAttribute('data-theme') === 'light'; }
  var metaTheme = $('meta[name="theme-color"]');
  function themeLabel() {
    var b = $('[data-theme-toggle]'); if (!b) return;
    b.setAttribute('aria-label', t(isLight() ? 'theme.toDark' : 'theme.toLight'));
    b.setAttribute('aria-pressed', isLight() ? 'true' : 'false');
  }
  function setTheme(next, ev) {
    function apply() {
      H.setAttribute('data-theme', next);
      try { localStorage.setItem('asg-theme', next); } catch (e) {}
      if (metaTheme) metaTheme.setAttribute('content', next === 'light' ? '#f6f2ea' : '#0b0c0f');
      themeLabel();
      if (sparkDraw) sparkDraw();
    }
    /* circular reveal from the toggle where the browser supports view transitions */
    if (reduce || !D.startViewTransition) { apply(); return; }
    var r = ev && ev.currentTarget ? ev.currentTarget.getBoundingClientRect() : null;
    var x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : 0;
    var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var vt = D.startViewTransition(apply);
    vt.ready.then(function () {
      H.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 750, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  }
  $$('[data-theme-toggle]').forEach(function (b) { b.addEventListener('click', function (e) { setTheme(isLight() ? 'dark' : 'light', e); }); });
  if (metaTheme && isLight()) metaTheme.setAttribute('content', '#f6f2ea');

  /* =================================================================== renderers */
  function renderMarquee() {
    var items = t('marq'), html = '';
    items.forEach(function (w, i) { html += '<span' + (i % 2 ? ' class="o"' : '') + '>' + esc(w) + '</span><img src="assets/img/brand/asg-mark.webp" alt="">'; });
    $('#marq').innerHTML = '<div class="marq__item">' + html + '</div><div class="marq__item">' + html + '</div>';
  }

  function renderSectors() {
    var s = data('sectors');
    var html = '<div class="sx sx--intro" aria-hidden="true"><img src="assets/img/brand/asg-mark.webp" alt=""></div>';
    s.forEach(function (x, i) {
      html += '<article class="sx" style="--c:' + x.color + '" data-cursor="view">' +
        '<div class="sx__img"><img src="' + x.img + '" alt="" loading="lazy"></div>' +
        '<div class="sx__top"><span class="sx__code">' + esc(x.code) + '</span><img class="sx__logo" src="assets/img/brand/' + x.logo + '.png" alt="' + esc(x.name) + '" loading="lazy"></div>' +
        '<div class="sx__fact"><b>' + esc(x.fact[0]) + '</b><span>' + esc(x.fact[1]) + '</span></div>' +
        '<h3>' + esc(x.name) + '</h3><p>' + esc(x.line) + '</p>' +
        '<ul class="sx__caps" aria-label="' + esc(t('sectors.more')) + '">' + x.caps.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' +
        '</article>';
    });
    $('#sectorTrack').innerHTML = html;
    $('#ftrSectors').innerHTML = s.map(function (x) { return '<li><a href="#sectors">' + esc(x.name) + '</a></li>'; }).join('');
    $('#sectorSel').innerHTML = t('contact.opts').map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('');
  }

  var stage = 0, stageAuto = true;
  function renderStages() {
    var st = data('stages');
    $('#stageTabs').innerHTML = st.map(function (s, i) {
      return '<button class="stg' + (i === stage ? ' is-on' : '') + '" role="tab" aria-selected="' + (i === stage) + '" data-i="' + i + '"><b>' + esc(s.k) + '</b></button>';
    }).join('');
    paintStage();
    $('#linesList').innerHTML = data('lines').map(function (l) {
      return '<li><span class="v" dir="ltr">' + esc(l[0]) + '</span><span class="t">' + esc(l[1]) + '</span><span class="r">' + esc(l[2]) + '</span></li>';
    }).join('');
  }
  function paintStage() {
    var s = data('stages')[stage];
    $('#stagePanel').innerHTML = '<div><h3>' + esc(s.h) + '</h3><p>' + esc(s.p) + '</p></div><ul>' + s.d.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>';
    $$('.stg').forEach(function (b, i) { b.classList.toggle('is-on', i === stage); b.setAttribute('aria-selected', i === stage); });
    if (hasGsap && !reduce) gsap.fromTo('#stagePanel > *', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7, stagger: .08, ease: 'power3.out' });
  }
  function setStage(i, user) { if (user) stageAuto = false; stage = i; paintStage(); }

  function renderRegions() {
    $('#regions').innerHTML = data('regions').map(function (r, i) {
      return '<div class="rg' + (i === 0 ? ' is-open' : '') + '" tabindex="0" data-cursor="view"><img src="' + r.img + '" alt="" loading="lazy"><div class="rg__t"><b>' + esc(r.n) + '</b><span>' + esc(r.s) + '</span></div></div>';
    }).join('');
  }

  function renderOffices() {
    var o = data('offices');
    $('#offices').innerHTML = o.map(function (x) {
      return '<article class="off' + (x.hq ? ' off--hq' : '') + '" data-reveal>' +
        (x.hq ? '<span class="off__badge">' + esc(t('reach.hq')) + '</span>' : '') +
        '<h3 class="off__city">' + esc(x.city) + '</h3><span class="off__country">' + esc(x.country) + '</span>' +
        '<p class="off__addr">' + esc(x.addr) + '</p>' +
        '<div class="off__tel">' + x.tel.map(function (p) { return '<a href="tel:' + p.replace(/\s/g, '') + '">' + esc(p) + '</a>'; }).join('') + '</div>' +
        '<div class="off__time"><b data-tz="' + x.tz + '">--:--</b><span class="mono">' + esc(t('reach.local')) + '</span></div>' +
        '</article>';
    }).join('');
    $('#ftrOffices').innerHTML = o.map(function (x) { return '<li>' + esc(x.city) + ' · <span dir="ltr">' + esc(x.tel[0]) + '</span></li>'; }).join('');
    tickClocks();
  }
  function tickClocks() {
    $$('[data-tz]').forEach(function (el) {
      try { el.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: el.getAttribute('data-tz') }).format(new Date()); } catch (e) {}
    });
  }
  setInterval(tickClocks, 15000);

  function renderExecs() {
    var ph = C.en.execs;
    $('#execs').innerHTML = data('execs').map(function (e, i) {
      return '<li class="ex" data-reveal><div class="ex__ph"><img src="assets/img/team/' + ph[i][2] + '.jpg" alt="' + esc(e[0]) + '" loading="lazy" width="400" height="500"></div><b>' + esc(e[0]) + '</b><span>' + esc(e[1]) + '</span></li>';
    }).join('');
  }

  var LOGOS = [
    ['client1', 'Saudi Electricity Company'], ['client5', 'Saudi Aramco'], ['client11', 'NEOM'], ['client10', 'King Abdullah Economic City'],
    ['client21', 'Riyadh Metro — BACS'], ['client9', 'MODON'], ['client7', 'SWCC'], ['client4', 'National Information Center'],
    ['client6', 'King Faisal Specialist Hospital'], ['client12', 'Ministry of Education'],
    ['client19', 'Hitachi'], ['client20', 'GE'], ['client22', 'Mandarin Oriental'], ['client8', 'Shepheard Hotel'], ['client17', 'Accor'],
    ['client14', 'Ministry of Communications and IT'], ['client15', 'Tarshid'], ['client16', 'Diplomatic Quarter General Authority'], ['client18', 'CDE'], ['client13', 'Ministry of Saudi Arabia']
  ];
  function renderLogos() {
    var row = function (a) { var h = a.map(function (l) { return '<div class="lg"><img src="assets/img/clients/' + l[0] + '.jpg" alt="' + esc(l[1]) + '" loading="lazy"></div>'; }).join(''); return h + h; };
    $('#logos').innerHTML = '<div class="logos__row">' + row(LOGOS.slice(0, 10)) + '</div><div class="logos__row logos__row--rev">' + row(LOGOS.slice(10)) + '</div>';
  }

  function renderNews() {
    $('#newsGrid').innerHTML = data('news').map(function (n) {
      return '<a class="nw" href="' + n.url + '" target="_blank" rel="noopener" data-reveal data-cursor="view">' +
        '<div class="nw__ph"><img src="' + n.img + '" alt="" loading="lazy"><span class="nw__tag">' + esc(n.tag) + '</span></div>' +
        '<div class="nw__b"><span class="mono">' + esc(n.d) + '</span><h3>' + esc(n.h) + '</h3><p>' + esc(n.p) + '</p><span class="more">' + esc(t('news.read')) + ARROW + '</span></div></a>';
    }).join('');
  }

  function renderChips() {
    $('#asxChips').innerHTML = t('future.chips').map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('');
  }

  function renderAll() {
    renderMarquee(); renderFilm(); renderSectors(); renderStages(); renderRegions(); renderOffices(); renderExecs(); renderNews(); renderChips();
    if (!$('#logos').children.length) renderLogos();
    buildMap();
  }

  /* =================================================================== project map */
  var MAP = { lon0: 33.6, lon1: 57, lat0: 14.2, lat1: 32.8 }, mapK, mapCos = Math.cos(23.5 * Math.PI / 180);
  var mapFilter = 'all', mapSel = -1;
  var CATC = { power: '#F39019', water: '#2F86BF', build: '#D2493F', ind: '#5FA552' };
  var MAPLBL = {
    en: { ksa: 'Saudi Arabia', red: 'Red Sea', gulf: 'Arabian Gulf', egy: 'Egypt', yem: 'Yemen', omn: 'Oman', irq: 'Iraq', jed: 'Jeddah · HQ', ruh: 'Riyadh' },
    ar: { ksa: 'المملكة العربية السعودية', red: 'البحر الأحمر', gulf: 'الخليج العربي', egy: 'مصر', yem: 'اليمن', omn: 'عُمان', irq: 'العراق', jed: 'جدة · المقر الرئيسي', ruh: 'الرياض' }
  };
  function proj(lon, lat) { return [(lon - MAP.lon0) * mapK * mapCos, (MAP.lat1 - lat) * mapK]; }
  function ringPath(r) {
    var d = '';
    for (var i = 0; i < r.length; i += 2) { var p = proj(r[i], r[i + 1]); d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
    return d + 'Z';
  }
  function buildMap() {
    var svg = $('#pmap'); if (!svg || !W.ASG_GEO) return;
    var VW = 1000; mapK = VW / ((MAP.lon1 - MAP.lon0) * mapCos);
    var VH = (MAP.lat1 - MAP.lat0) * mapK;
    svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH.toFixed(0));
    var L = MAPLBL[lang], g = W.ASG_GEO, html = '<defs><radialGradient id="pg"><stop offset="0" stop-color="#f39019" stop-opacity=".35"/><stop offset="1" stop-color="#f39019" stop-opacity="0"/></radialGradient></defs>';
    for (var lo = 35; lo <= 56; lo += 5) { var a = proj(lo, MAP.lat1), b = proj(lo, MAP.lat0); html += '<line class="grat" x1="' + a[0] + '" y1="0" x2="' + b[0] + '" y2="' + VH + '"/>'; }
    for (var la = 15; la <= 32; la += 5) { var c = proj(MAP.lon0, la); html += '<line class="grat" x1="0" y1="' + c[1] + '" x2="' + VW + '" y2="' + c[1] + '"/>'; }
    Object.keys(g).forEach(function (k) { if (k !== 'SAU') g[k].forEach(function (r) { html += '<path class="land" d="' + ringPath(r) + '"/>'; }); });
    g.SAU.forEach(function (r) { html += '<path class="ksa" d="' + ringPath(r) + '"/>'; });
    function lbl(lon, lat, txt, anchor, size) { var p = proj(lon, lat); return '<text class="lbl" x="' + p[0] + '" y="' + p[1] + '" text-anchor="' + (anchor || 'middle') + '"' + (size ? ' style="font-size:' + size + 'px"' : '') + '>' + esc(txt) + '</text>'; }
    html += lbl(45, 23.4, L.ksa, 'middle', 15) + lbl(37.6, 20.4, L.red) + lbl(51.3, 27.4, L.gulf) + lbl(35.4, 29.6, L.egy) + lbl(47.5, 15.4, L.yem) + lbl(55.2, 19.6, L.omn) + lbl(43.5, 31.9, L.irq);
    var hq = proj(39.17, 21.54), ruh = proj(46.72, 24.69);
    var pr = data('projects');
    html += '<g class="links">';
    pr.forEach(function (p, i) {
      var q = proj(p.lon, p.lat), mx = (hq[0] + q[0]) / 2, my = (hq[1] + q[1]) / 2 - Math.hypot(q[0] - hq[0], q[1] - hq[1]) * 0.22;
      html += '<path class="link" data-i="' + i + '" d="M' + hq[0] + ' ' + hq[1] + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + '"/>';
    });
    html += '</g>';
    html += '<circle cx="' + hq[0] + '" cy="' + hq[1] + '" r="60" fill="url(#pg)"/>';
    html += '<g class="hq"><circle cx="' + hq[0] + '" cy="' + hq[1] + '" r="9" fill="none" stroke="#e3b65a" stroke-width="1.5"/><circle cx="' + hq[0] + '" cy="' + hq[1] + '" r="4" fill="#e3b65a"/></g>';
    html += '<text class="lbl" x="' + (hq[0] + (isRTL() ? 14 : -14)) + '" y="' + (hq[1] + 30) + '" text-anchor="' + (isRTL() ? 'start' : 'end') + '" style="fill:#e3b65a">' + esc(L.jed) + '</text>';
    html += '<text class="lbl" x="' + (ruh[0]) + '" y="' + (ruh[1] - 18) + '" text-anchor="middle">' + esc(L.ruh) + '</text>';
    pr.forEach(function (p, i) {
      var q = proj(p.lon, p.lat);
      html += '<g class="pin" data-i="' + i + '" data-c="' + p.c + '" style="--c:' + CATC[p.c] + '" tabindex="0" role="button" aria-label="' + esc(p.n) + '"><circle class="halo" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="13"/><circle class="dot" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="6.5"/></g>';
    });
    svg.innerHTML = html;
    applyFilter(mapFilter, true);
    if (mapSel >= 0) selectPin(mapSel, true);
  }
  function visiblePins() { return $$('.pin').filter(function (p) { return !p.classList.contains('is-off'); }); }
  function applyFilter(f, quiet) {
    mapFilter = f;
    $$('#pFilters .chip').forEach(function (c) { c.classList.toggle('is-on', c.dataset.f === f); });
    $$('.pin').forEach(function (p) { p.classList.toggle('is-off', f !== 'all' && p.dataset.c !== f); });
    $$('.link').forEach(function (l) { var pin = $('.pin[data-i="' + l.dataset.i + '"]'); l.style.opacity = pin.classList.contains('is-off') ? 0 : ''; });
    if (!quiet) { var v = visiblePins(); if (v.length) selectPin(+v[0].dataset.i); }
  }
  function selectPin(i, quiet) {
    mapSel = i;
    var p = data('projects')[i], cats = data('cats');
    $$('.pin').forEach(function (el) { el.classList.toggle('is-on', +el.dataset.i === i); });
    $$('.link').forEach(function (l) { l.style.strokeOpacity = +l.dataset.i === i ? 1 : ''; l.style.strokeWidth = +l.dataset.i === i ? 2 : ''; });
    var card = $('#pCard');
    card.innerHTML = '<span class="cat" style="--c:' + CATC[p.c] + '"><i></i>' + esc(cats[p.c]) + '</span><h3>' + esc(p.n) + '</h3><p>' + esc(p.s) + '</p>' +
      '<span class="coords mono">' + p.lat.toFixed(2) + '° N · ' + p.lon.toFixed(2) + '° E</span>' +
      '<div class="pmap__nav"><button type="button" data-step="-1" aria-label="Previous"><svg viewBox="0 0 14 10"><path d="M14 5H2M5 1L1 5l4 4"/></svg></button><button type="button" data-step="1" aria-label="Next"><svg viewBox="0 0 14 10"><path d="M0 5h12M9 1l4 4-4 4"/></svg></button></div>';
    if (!quiet && hasGsap && !reduce) gsap.fromTo(card.children, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: .05, duration: .6, ease: 'power3.out' });
  }
  D.addEventListener('click', function (e) {
    var pin = e.target.closest('.pin'); if (pin) { selectPin(+pin.dataset.i); return; }
    var chip = e.target.closest('#pFilters .chip'); if (chip) { applyFilter(chip.dataset.f); return; }
    var step = e.target.closest('[data-step]');
    if (step) {
      var v = visiblePins().map(function (p) { return +p.dataset.i; }), k = v.indexOf(mapSel);
      selectPin(v[(k + +step.dataset.step + v.length) % v.length]); return;
    }
    var stg = e.target.closest('.stg'); if (stg) { setStage(+stg.dataset.i, true); return; }
    var rg = e.target.closest('.rg'); if (rg) openRegion(rg);
  });
  D.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.pin')) { e.preventDefault(); selectPin(+e.target.closest('.pin').dataset.i); }
  });
  function openRegion(rg) { $$('.rg').forEach(function (r) { r.classList.toggle('is-open', r === rg); }); }
  D.addEventListener('mouseover', function (e) { var rg = e.target.closest && e.target.closest('.rg'); if (rg && fine) openRegion(rg); });
  D.addEventListener('focusin', function (e) { var rg = e.target.closest && e.target.closest('.rg'); if (rg) openRegion(rg); });

  /* =================================================================== film */
  var FILM_ID = 'gRiefDzSF2M', FILM_AR = 1280 / 548; /* picture area inside the letterboxed 16:9 video */
  var filmCap = -1, filmIfr = null, filmOn = false, filmPinned = false, filmTimer = null;
  function renderFilm() {
    var caps = t('film.caps');
    $('#filmCaps').innerHTML = caps.map(function (c, i) { return '<p class="cap" aria-hidden="' + (i ? 'true' : 'false') + '">' + c + '</p>'; }).join('');
    $$('#filmCaps .cap').forEach(splitWords);
    $('#filmDots').innerHTML = caps.map(function () { return '<i></i>'; }).join('');
    filmCap = -1; setCap(0, true);
  }
  function setCap(i, now) {
    var caps = $$('#filmCaps .cap'); if (!caps.length || i === filmCap) return;
    var prev = caps[filmCap], next = caps[i]; filmCap = i;
    $$('#filmDots i').forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    caps.forEach(function (c, k) { c.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    if (!hasGsap || reduce || now) { caps.forEach(function (c, k) { c.classList.toggle('is-on', k === i); }); if (hasGsap) gsap.set(next.querySelectorAll('.w > span'), { yPercent: 0, y: 0 }); return; }
    if (prev) gsap.to(prev.querySelectorAll('.w > span'), { yPercent: -110, duration: .5, stagger: .025, ease: 'power3.in', overwrite: true, onComplete: function () { if (prev !== caps[filmCap]) prev.classList.remove('is-on'); } });
    next.classList.add('is-on');
    gsap.fromTo(next.querySelectorAll('.w > span'), { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1, stagger: .05, delay: prev ? .45 : 0, ease: 'power4.out', overwrite: true });
  }
  function filmSize() {
    var m = $('.film__media'); if (!m) return;
    var w = m.clientWidth, h = m.clientHeight, cw, ch;
    if (!w || !h) return;
    if (w / h > FILM_AR) { cw = w; ch = w / FILM_AR; } else { ch = h; cw = h * FILM_AR; }
    var poster = $('.film__poster'); poster.style.width = cw + 'px'; poster.style.height = ch + 'px';
    if (filmIfr) { var ih = ch * 720 / 548; filmIfr.style.height = ih + 'px'; filmIfr.style.width = ih * 16 / 9 + 'px'; }
  }
  function ytCmd(ifr, fn) { try { ifr.contentWindow.postMessage(JSON.stringify({ event: 'command', func: fn, args: '' }), '*'); } catch (e) {} }
  function filmEmbed() {
    /* phones get the still with a slow drift: no background stream, no touch overlay; the full film is one tap away */
    if (filmIfr || reduce || matchMedia('(max-width: 900px), (hover: none)').matches) return;
    filmIfr = D.createElement('iframe');
    filmIfr.src = 'https://www.youtube-nocookie.com/embed/' + FILM_ID + '?autoplay=1&mute=1&loop=1&playlist=' + FILM_ID + '&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
    filmIfr.title = t('film.tag'); filmIfr.setAttribute('tabindex', '-1'); filmIfr.setAttribute('aria-hidden', 'true');
    filmIfr.allow = 'autoplay; encrypted-media; picture-in-picture';
    filmIfr.addEventListener('load', function () { try { filmIfr.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'film' }), '*'); } catch (e) {} });
    $('.film__yt').appendChild(filmIfr); filmSize();
  }
  /* the poster stays until YouTube reports the film is playing */
  addEventListener('message', function (e) {
    if (!filmIfr || e.source !== filmIfr.contentWindow) return;
    var d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    if (d && d.info && d.info.playerState === 1) $('.film').classList.add('is-playing');
  });
  function filmCycle(on) {
    clearInterval(filmTimer);
    if (on && !filmPinned) filmTimer = setInterval(function () { if (filmOn) setCap((filmCap + 1) % t('film.caps').length); }, 3400);
  }
  if ('IntersectionObserver' in W) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) filmEmbed(); }, { rootMargin: '800px 0px' }).observe($('.film'));
    new IntersectionObserver(function (en) {
      filmOn = en[0].isIntersecting;
      if (filmIfr && filmBox.hidden) ytCmd(filmIfr, filmOn ? 'playVideo' : 'pauseVideo');
    }).observe($('.film'));
  } else filmEmbed();
  addEventListener('resize', filmSize);

  /* the full film, with sound */
  var filmBox = $('#filmBox'), filmLast = null;
  function openFilm() {
    filmLast = D.activeElement;
    $('#filmPlayer').innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + FILM_ID + '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + esc(t('film.tag')) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    filmBox.hidden = false; requestAnimationFrame(function () { filmBox.classList.add('is-open'); });
    if (filmIfr) ytCmd(filmIfr, 'pauseVideo');
    if (lenis) lenis.stop();
    $('.lightbox__close').focus();
  }
  function closeFilm() {
    if (filmBox.hidden) return;
    filmBox.classList.remove('is-open');
    setTimeout(function () { filmBox.hidden = true; $('#filmPlayer').innerHTML = ''; }, 500);
    if (filmIfr && filmOn) ytCmd(filmIfr, 'playVideo');
    if (lenis) lenis.start();
    if (filmLast) filmLast.focus();
  }
  D.addEventListener('click', function (e) {
    if (e.target.closest('[data-film-close]')) { closeFilm(); return; }
    if (e.target.closest('[data-film-open]') || e.target.closest('.film__frame')) openFilm();
  });
  D.addEventListener('keydown', function (e) {
    if (filmBox.hidden) return;
    if (e.key === 'Escape') closeFilm();
    if (e.key === 'Tab') { e.preventDefault(); $('.lightbox__close').focus(); }
  });

  /* =================================================================== energy grid canvas */
  var gridCv = $('#gridCv'), gctx = gridCv && gridCv.getContext('2d'), gW = 0, gH = 0, gDpr = 1, gridOn = false, gPath = [], gParts = [];
  function gridSize() {
    if (!gridCv) return;
    gDpr = Math.min(W.devicePixelRatio || 1, 2);
    gW = gridCv.clientWidth; gH = gridCv.clientHeight;
    gridCv.width = gW * gDpr; gridCv.height = gH * gDpr;
    buildGridPath();
  }
  function tower(x, base, h) { return { x: x, base: base, h: h, top: base - h }; }
  var gT = [];
  function buildGridPath() {
    var Z = gW / 5, ground = gH * 0.8; gPath = []; gT = [];
    var pts = [];
    /* plant output */
    pts.push([Z * 0.62, ground - gH * 0.36]);
    /* transmission towers */
    var t1 = tower(Z * 1.15, ground, gH * 0.58), t2 = tower(Z * 1.75, ground, gH * 0.6), t3 = tower(Z * 2.25, ground, gH * 0.42);
    gT = [t1, t2, t3];
    function catenary(a, b, sag) { for (var i = 1; i <= 24; i++) { var u = i / 24; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(Math.PI * u) * sag]); } }
    var arm = function (tw) { return [tw.x, tw.top + tw.h * 0.12]; };
    catenary(pts[0], arm(t1), gH * 0.05);
    catenary(arm(t1), arm(t2), gH * 0.07);
    catenary(arm(t2), arm(t3), gH * 0.05);
    /* into substation, down to cable */
    var sub = [Z * 2.62, ground - gH * 0.18];
    catenary(arm(t3), sub, gH * 0.03);
    pts.push([Z * 2.85, ground - gH * 0.18]); pts.push([Z * 2.95, ground + gH * 0.08]);
    /* underground */
    for (var i = 1; i <= 20; i++) pts.push([Z * 2.95 + (Z * 1.05) * i / 20, ground + gH * 0.08]);
    pts.push([Z * 4.0, ground - gH * 0.2]);
    /* distribution poles */
    var p1 = [Z * 4.0, ground - gH * 0.2], p2 = [Z * 4.35, ground - gH * 0.21], p3 = [Z * 4.7, ground - gH * 0.2];
    catenary(p1, p2, gH * 0.02); catenary(p2, p3, gH * 0.02);
    pts.push([Z * 4.92, ground - gH * 0.16]);
    /* cumulative length */
    var acc = 0; gPath = pts.map(function (p, i) { if (i) acc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]); return { x: p[0], y: p[1], d: acc }; });
    gParts = []; for (var k = 0; k < 46; k++) gParts.push({ u: Math.random(), v: 0.045 + Math.random() * 0.05, s: 0.6 + Math.random() * 1.2 });
  }
  function at(u) {
    var L = gPath[gPath.length - 1].d * u;
    for (var i = 1; i < gPath.length; i++) if (gPath[i].d >= L) { var a = gPath[i - 1], b = gPath[i], f = (L - a.d) / ((b.d - a.d) || 1); return [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f]; }
    return [gPath[gPath.length - 1].x, gPath[gPath.length - 1].y];
  }
  var gT0 = performance.now(), gLast = gT0;
  function drawGrid(now) {
    requestAnimationFrame(drawGrid);
    if (!gridOn || !gctx || !gPath.length) return;
    var dt = Math.min(0.05, (now - gLast) / 1000); gLast = now;
    var c = gctx, Z = gW / 5, ground = gH * 0.8, LT = isLight();
    var INK = LT ? '28,25,20' : '239,233,222', HI = LT ? '168,116,15' : '240,211,143';
    c.setTransform(gDpr, 0, 0, gDpr, 0, 0);
    if (isRTL()) c.setTransform(-gDpr, 0, 0, gDpr, gW * gDpr, 0);
    c.clearRect(0, 0, gW, gH);

    /* active-zone glow */
    var zx = Z * stage + Z / 2, gr = c.createRadialGradient(zx, gH * 0.55, 0, zx, gH * 0.55, Z * 0.9);
    gr.addColorStop(0, 'rgba(243,144,25,.16)'); gr.addColorStop(1, 'rgba(243,144,25,0)');
    c.fillStyle = gr; c.fillRect(0, 0, gW, gH);
    /* zone dividers */
    c.strokeStyle = 'rgba(' + INK + ',.08)'; c.lineWidth = 1; c.setLineDash([2, 6]);
    for (var z = 1; z < 5; z++) { c.beginPath(); c.moveTo(Z * z, 16); c.lineTo(Z * z, gH - 16); c.stroke(); }
    c.setLineDash([]);
    /* ground */
    c.strokeStyle = 'rgba(' + INK + ',.25)'; c.beginPath(); c.moveTo(0, ground); c.lineTo(gW, ground); c.stroke();
    c.fillStyle = 'rgba(168,152,127,.05)'; c.fillRect(Z * 2.9, ground, Z * 1.15, gH * 0.15);

    var on = function (i) { return stage === i ? 'rgba(' + HI + ',.95)' : 'rgba(' + INK + ',' + (LT ? '.42' : '.38') + ')'; };
    c.lineWidth = 1.2;
    /* 0 · generation: cooling towers + solar */
    c.strokeStyle = on(0);
    [[Z * 0.22, gH * 0.34], [Z * 0.44, gH * 0.28]].forEach(function (ct) {
      var x = ct[0], h = ct[1], w = Z * 0.13;
      c.beginPath(); c.moveTo(x - w, ground); c.quadraticCurveTo(x - w * 0.45, ground - h * 0.6, x - w * 0.6, ground - h);
      c.lineTo(x + w * 0.6, ground - h); c.quadraticCurveTo(x + w * 0.45, ground - h * 0.6, x + w, ground); c.stroke();
    });
    c.strokeRect(Z * 0.56, ground - gH * 0.36, Z * 0.12, gH * 0.36);
    for (var sp = 0; sp < 4; sp++) { var sx = Z * 0.08 + sp * Z * 0.12; c.beginPath(); c.moveTo(sx, ground - 4); c.lineTo(sx + Z * 0.08, ground - 16); c.lineTo(sx + Z * 0.1, ground - 10); c.lineTo(sx + Z * 0.02, ground); c.stroke(); }
    /* steam */
    c.strokeStyle = 'rgba(' + INK + ',.12)';
    for (var st = 0; st < 3; st++) { var off = ((now / 1000 * 10) + st * 12) % 36; c.beginPath(); c.arc(Z * 0.44 + Math.sin(off / 6) * 4, ground - gH * 0.28 - off, 6 + off * 0.3, 0, Math.PI * 2); c.stroke(); }

    /* 1 · transmission towers (lattice) */
    gT.forEach(function (tw, i) {
      c.strokeStyle = on(i < 2 ? 1 : 2);
      var w = tw.h * 0.16, top = tw.top, x = tw.x;
      c.beginPath();
      c.moveTo(x - w, tw.base); c.lineTo(x - w * 0.18, top); c.lineTo(x + w * 0.18, top); c.lineTo(x + w, tw.base);
      var n = 7; for (var k = 0; k < n; k++) {
        var y1 = tw.base - tw.h * k / n, y2 = tw.base - tw.h * (k + 1) / n;
        var w1 = w - (w - w * 0.18) * k / n, w2 = w - (w - w * 0.18) * (k + 1) / n;
        c.moveTo(x - w1, y1); c.lineTo(x + w2, y2); c.moveTo(x + w1, y1); c.lineTo(x - w2, y2);
      }
      var ay = top + tw.h * 0.12; c.moveTo(x - w * 1.1, ay); c.lineTo(x + w * 1.1, ay);
      c.moveTo(x - w * 0.8, ay + tw.h * 0.12); c.lineTo(x + w * 0.8, ay + tw.h * 0.12);
      c.stroke();
    });
    /* 2 · substation yard */
    c.strokeStyle = on(2);
    var sx0 = Z * 2.5, sw = Z * 0.42;
    c.strokeRect(sx0, ground - gH * 0.12, sw * 0.3, gH * 0.12); c.strokeRect(sx0 + sw * 0.38, ground - gH * 0.16, sw * 0.3, gH * 0.16);
    c.beginPath(); c.moveTo(sx0 - 6, ground - gH * 0.24); c.lineTo(sx0 + sw, ground - gH * 0.24); c.moveTo(sx0, ground); c.lineTo(sx0, ground - gH * 0.24); c.moveTo(sx0 + sw * 0.8, ground); c.lineTo(sx0 + sw * 0.8, ground - gH * 0.24); c.stroke();
    c.setLineDash([3, 3]); c.strokeRect(sx0 - 10, ground - gH * 0.27, sw + 20, gH * 0.27); c.setLineDash([]);
    /* 3 · cable trench */
    c.strokeStyle = on(3); c.setLineDash([6, 5]);
    c.beginPath(); c.moveTo(Z * 2.95, ground + gH * 0.08); c.lineTo(Z * 4.0, ground + gH * 0.08); c.stroke(); c.setLineDash([]);
    [3.3, 3.65].forEach(function (j) { c.strokeRect(Z * j - 5, ground + gH * 0.08 - 5, 10, 10); });
    /* 4 · distribution poles + city */
    c.strokeStyle = on(4);
    [4.0, 4.35, 4.7].forEach(function (px) { c.beginPath(); c.moveTo(Z * px, ground); c.lineTo(Z * px, ground - gH * 0.24); c.moveTo(Z * px - 10, ground - gH * 0.21); c.lineTo(Z * px + 10, ground - gH * 0.21); c.stroke(); });
    [[4.78, .1, .14], [4.88, .07, .22], [4.95, .05, .12]].forEach(function (b, i) {
      var bx = Z * b[0], bw = Z * b[1], bh = gH * b[2]; c.strokeRect(bx, ground - bh, bw, bh);
      for (var wy = ground - bh + 8; wy < ground - 6; wy += 9) for (var wx = bx + 5; wx < bx + bw - 4; wx += 8) {
        var lit = (Math.sin(wx * 13.1 + wy * 7.3 + Math.floor(now / 900) * (i + 1)) > 0.2);
        c.fillStyle = lit ? (stage === 4 ? 'rgba(' + HI + ',.9)' : 'rgba(' + HI + ',.35)') : 'rgba(' + INK + ',.06)'; c.fillRect(wx, wy, 3, 3);
      }
    });

    /* conductor */
    c.strokeStyle = LT ? 'rgba(184,134,11,.5)' : 'rgba(227,182,90,.38)'; c.lineWidth = 1;
    c.beginPath(); gPath.forEach(function (p, i) { if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.stroke();

    /* current */
    c.globalCompositeOperation = LT ? 'source-over' : 'lighter';
    gParts.forEach(function (p) {
      if (!reduce) p.u = (p.u + p.v * dt) % 1;
      var q = at(p.u), zone = Math.min(4, Math.floor(q[0] / Z)), hot = zone === stage;
      var r = (hot ? 3.4 : 2) * p.s, g2 = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 4);
      g2.addColorStop(0, LT ? (hot ? 'rgba(210,117,8,1)' : 'rgba(210,117,8,.75)') : (hot ? 'rgba(255,230,170,1)' : 'rgba(243,170,70,.8)')); g2.addColorStop(1, 'rgba(243,144,25,0)');
      c.fillStyle = g2; c.beginPath(); c.arc(q[0], q[1], r * 4, 0, Math.PI * 2); c.fill();
    });
    c.globalCompositeOperation = 'source-over';

    /* labels */
    c.setTransform(gDpr, 0, 0, gDpr, 0, 0);
    c.font = '400 11px "Readex Pro", sans-serif';
    var kv = ['', '380 kV', '380 kV', '1–380 kV', 'MV / LV'];
    for (var zi = 0; zi < 5; zi++) { if (!kv[zi]) continue; var lx = isRTL() ? gW - (Z * zi + 14) : Z * zi + 14; c.textAlign = isRTL() ? 'right' : 'left'; c.fillStyle = zi === stage ? 'rgba(' + HI + ',.95)' : 'rgba(' + INK + ',.4)'; c.fillText(kv[zi], lx, 26); }
  }
  if (gridCv) {
    gridSize(); addEventListener('resize', gridSize);
    if ('IntersectionObserver' in W) new IntersectionObserver(function (e) { gridOn = e[0].isIntersecting; }).observe(gridCv); else gridOn = true;
    requestAnimationFrame(drawGrid);
    setInterval(function () { if (stageAuto && gridOn) setStage((stage + 1) % 5); }, 5200);
  }

  /* =================================================================== sparkline (12.44B) */
  var sparkDraw = null;
  function spark(cv) {
    if (!cv) return; var c = cv.getContext('2d'), dpr = Math.min(W.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; c.scale(dpr, dpr);
    var pts = [.08, .12, .1, .2, .24, .22, .34, .4, .38, .52, .6, .66, .78, .86, .92];
    var o = { p: reduce ? 1 : 0 };
    function draw() {
      c.clearRect(0, 0, w, h); var n = Math.max(2, Math.ceil(pts.length * o.p));
      var lt = isLight(), g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(243,144,25,0)'); g.addColorStop(1, lt ? 'rgba(184,134,11,.95)' : 'rgba(240,211,143,.9)');
      c.beginPath(); for (var i = 0; i < n; i++) { var x = w * 0.35 + (w * 0.62) * i / (pts.length - 1), y = h * 0.9 - pts[i] * h * 0.62; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.strokeStyle = g; c.lineWidth = 1.6; c.stroke();
      var lx = w * 0.35 + (w * 0.62) * (n - 1) / (pts.length - 1), ly = h * 0.9 - pts[n - 1] * h * 0.62;
      c.lineTo(lx, h); c.lineTo(w * 0.35, h); c.closePath(); var f = c.createLinearGradient(0, h * .2, 0, h); f.addColorStop(0, 'rgba(243,144,25,.14)'); f.addColorStop(1, 'rgba(243,144,25,0)'); c.fillStyle = f; c.fill();
      c.beginPath(); c.arc(lx, ly, 3.5, 0, Math.PI * 2); c.fillStyle = lt ? '#b8860b' : '#f0d38f'; c.fill();
    }
    draw(); sparkDraw = draw;
    if (hasGsap && !reduce) ScrollTrigger.create({ trigger: cv, start: 'top 80%', once: true, onEnter: function () { gsap.to(o, { p: 1, duration: 2.2, ease: 'power2.out', onUpdate: draw }); } });
  }

  /* =================================================================== counters + meter */
  function fmt(v, dec) { return dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'); }
  function count(el) {
    var to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    if (reduce || !hasGsap) { el.textContent = fmt(to, dec); return; }
    var o = { v: 0 };
    gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v, dec); } });
  }
  var meterVal = $('#meterVal'), mv = 104382.6;
  setInterval(function () { if (!meterVal) return; mv += 0.1 + Math.random() * 0.3; var s = mv.toFixed(1); meterVal.textContent = ('00000000' + s).slice(-8); }, 600);

  /* =================================================================== smooth scroll */
  var lenis = null;
  if (hasGsap && !reduce && W.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: function (x) { return Math.min(1, 1.001 - Math.pow(2, -10 * x)); }, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    W.__lenis = lenis;
  }
  function scrollTo(target, opts) {
    if (lenis) lenis.scrollTo(target, Object.assign({ offset: 0, duration: 1.4 }, opts || {}));
    else { var el = typeof target === 'number' ? null : (typeof target === 'string' ? $(target) : target); W.scrollTo({ top: el ? el.getBoundingClientRect().top + scrollY : target, behavior: reduce ? 'auto' : 'smooth' }); }
  }
  D.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href'); if (id.length < 2) { e.preventDefault(); scrollTo(0); return; }
    var el = $(id); if (!el) return;
    e.preventDefault(); closeMenu(); scrollTo(el);
  });

  /* =================================================================== header, menu, progress */
  var hdr = $('#hdr'), prog = $('.prog'), progC = $('.prog circle'), lastY = 0, acc = 0;
  function onScroll() {
    var y = W.scrollY, d = y - lastY; lastY = y;
    hdr.classList.toggle('is-solid', y > 40);
    if (!H.classList.contains('menu-open')) {
      acc = (Math.sign(d) === Math.sign(acc)) ? acc + d : d;
      if (acc > 120 && y > 300) hdr.classList.add('is-hidden');
      if (acc < -60 || y < 200) hdr.classList.remove('is-hidden');
    }
    var max = D.documentElement.scrollHeight - innerHeight, p = max > 0 ? y / max : 0;
    if (progC) progC.style.strokeDashoffset = 1 - p;
    prog.classList.toggle('is-on', y > innerHeight * 0.8);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  addEventListener('mousemove', function (e) { if (e.clientY < 70) hdr.classList.remove('is-hidden'); }, { passive: true });
  prog.addEventListener('click', function () { scrollTo(0); });

  var burger = $('.burger'), menu = $('#menu');
  function openMenu() { H.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', t('menu.close')); menu.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop(); $$('.menu__list a').forEach(function (a, i) { a.style.transitionDelay = (.25 + i * .05) + 's'; }); }
  function closeMenu() { if (!H.classList.contains('menu-open')) return; H.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', t('menu.open')); menu.setAttribute('aria-hidden', 'true'); if (lenis) lenis.start(); $$('.menu__list a').forEach(function (a) { a.style.transitionDelay = '0s'; }); }
  burger.addEventListener('click', function () { H.classList.contains('menu-open') ? closeMenu() : openMenu(); });
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* active nav */
  var navLinks = $$('.hdr__nav a');
  if ('IntersectionObserver' in W) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + x.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'sectors', 'energy', 'projects', 'leadership', 'impact', 'news', 'contact'].forEach(function (id) { var el = D.getElementById(id); if (el) io.observe(el); });
  }

  /* =================================================================== cursor + magnetic */
  if (fine && hasGsap && !reduce) {
    H.classList.add('has-cursor');
    var cur = $('.cur'), dot = $('.cur__dot'), ring = $('.cur__ring'), lbl = $('.cur__ring span');
    var dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    var rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    addEventListener('pointermove', function (e) { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    D.addEventListener('pointerover', function (e) {
      var v = e.target.closest('[data-cursor="view"], [data-cursor="play"]'), l = e.target.closest('a,button,.pin,input,select,textarea,label');
      cur.classList.toggle('is-view', !!v); cur.classList.toggle('is-link', !v && !!l);
      lbl.textContent = v && v.getAttribute('data-cursor') === 'play' ? t('film.cursor') : (lang === 'ar' ? 'استكشف' : 'View');
    });
    D.addEventListener('pointerover', function (e) {
      var m = e.target.closest('[data-magnetic]'); if (!m || m._mag) return; m._mag = 1;
      var mx = gsap.quickTo(m, 'x', { duration: .5, ease: 'power3' }), my = gsap.quickTo(m, 'y', { duration: .5, ease: 'power3' });
      m.addEventListener('pointermove', function (ev) { var r = m.getBoundingClientRect(); mx((ev.clientX - r.left - r.width / 2) * .25); my((ev.clientY - r.top - r.height / 2) * .35); });
      m.addEventListener('pointerleave', function () { mx(0); my(0); });
    });
    /* tilt */
    D.addEventListener('pointermove', function (e) {
      var b = e.target.closest && e.target.closest('[data-tilt]'); $$('[data-tilt]').forEach(function (x) { if (x !== b && x._t) { gsap.to(x, { rotateX: 0, rotateY: 0, duration: .8 }); x._t = 0; } });
      if (!b) return; var r = b.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      b._t = 1; gsap.to(b, { rotateY: px * 5, rotateX: -py * 5, transformPerspective: 900, duration: .6, ease: 'power2.out' });
    });
  }

  /* =================================================================== form (demo) */
  var toastT;
  function toast(msg) { var el = $('.toast'); el.textContent = msg; el.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('is-on'); }, 3800); }
  $('#form').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, ok = true;
    ['name', 'email'].forEach(function (n) { var i = f.elements[n], bad = !i.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)); i.classList.toggle('is-err', bad); if (bad) ok = false; });
    if (!ok) { f.querySelector('.is-err').focus(); return; }
    toast(t('contact.sent')); f.reset();
  });

  /* =================================================================== scroll choreography */
  var ctx = null, mm = null;
  /* anything already above the fold after a rebuild is shown at its final state */
  function revealPassed() {
    if (!hasGsap || reduce) return;
    var lim = innerHeight * 0.86;
    $$('[data-reveal]').forEach(function (el) { if (el.getBoundingClientRect().top < lim) gsap.set(el, { autoAlpha: 1, y: 0 }); });
    $$('[data-split]').forEach(function (el) { if (el.getBoundingClientRect().top < lim) { el.classList.add('is-in'); gsap.set(el.querySelectorAll('.w > span'), { yPercent: 0, y: 0 }); } });
    $$('[data-count]').forEach(function (el) { if (el.getBoundingClientRect().top < lim) el.textContent = fmt(parseFloat(el.dataset.count), +(el.dataset.dec || 0)); });
    $$('.about__big .ww').forEach(function (w) { if (w.getBoundingClientRect().top < innerHeight * 0.45) w.style.opacity = 1; });
  }
  function initScroll() {
    if (!hasGsap || reduce) {
      $$('[data-count]').forEach(function (el) { el.textContent = fmt(parseFloat(el.dataset.count), +(el.dataset.dec || 0)); });
      $$('.sb').forEach(function (s) { s.style.setProperty('--p', 1); });
      $$('.about__big .ww').forEach(function (w) { w.style.opacity = 1; });
      spark($('.stat__spark'));
      return;
    }
    ctx = gsap.context(function () {
      /* split headings (hero handled by intro) */
      $$('[data-split]').forEach(function (el) {
        if (el.closest('.hero')) { if (introDone) { el.classList.add('is-in'); gsap.set(el.querySelectorAll('.w > span'), { yPercent: 0, y: 0 }); } return; }
        var words = el.querySelectorAll('.w > span');
        gsap.fromTo(words, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, ease: 'power4.out', stagger: .045, scrollTrigger: { trigger: el, start: 'top 86%', once: true }, onComplete: function () { el.classList.add('is-in'); } });
      });
      /* reveals */
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 90%', once: true,
        onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: .08, overwrite: true }); }
      });
      /* counters */
      $$('[data-count]').forEach(function (el) { ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { count(el); } }); });
      /* scrub words */
      var ww = $$('.about__big .ww');
      if (ww.length) gsap.to(ww, { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: '.about__big', start: 'top 80%', end: 'bottom 45%', scrub: true } });
      /* parallax */
      $$('[data-parallax]').forEach(function (img) {
        gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.to('.purpose__mark', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.purpose', start: 'top bottom', end: 'bottom top', scrub: true } });
      /* hero scroll-out */
      ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: function (s) { if (W.ASG_GLOBE) ASG_GLOBE.scroll(s.progress); } });
      gsap.to('.hero__in', { yPercent: -18, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      /* souk bars */
      ScrollTrigger.create({ trigger: '.souks', start: 'top 85%', once: true, onEnter: function () { $$('.sb').forEach(function (s, i) { setTimeout(function () { s.style.setProperty('--p', 1); }, i * 120); }); } });
      /* map draw */
      var ksa = $$('#pmap .ksa'), pins = $$('#pmap .pin'), links = $$('#pmap .link');
      ScrollTrigger.create({ trigger: '#pmap', start: 'top 75%', once: true, onEnter: function () {
        ksa.forEach(function (p) { var L = p.getTotalLength(); gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', onComplete: function () { p.style.strokeDasharray = 'none'; } }); });
        gsap.from(pins, { scale: 0, transformOrigin: '50% 50%', duration: .6, stagger: .05, delay: .8, ease: 'back.out(2)' });
        gsap.from(links, { opacity: 0, duration: .8, stagger: .04, delay: 1.2 });
        if (mapSel < 0) setTimeout(function () { selectPin(0); }, 1400);
      } });
      gsap.to(links, { strokeDashoffset: -80, duration: 6, ease: 'none', repeat: -1 });
    });
    /* sectors rail (desktop) */
    mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', function () {
          filmPinned = true; filmCycle(false);
          gsap.timeline({ scrollTrigger: { trigger: '.film', start: 'top top', end: '+=170%', pin: '.film__pin', scrub: 1, anticipatePin: 1,
              onUpdate: function (st) { setCap(Math.min(3, Math.floor(st.progress * 4.4))); } } })
            .fromTo('.film__frame', { clipPath: 'inset(13% 15% round 28px)' }, { clipPath: 'inset(0% 0% round 0px)', ease: 'none', duration: .45 })
            .fromTo('.film__media', { scale: 1.2 }, { scale: 1, ease: 'none', duration: .45 }, 0)
            .fromTo('.film__ui', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, ease: 'none', duration: .2 }, .3)
            .to({}, { duration: .55 });
          var track = $('#sectorTrack'), pin = $('.sectors__pin'), bar = $('.sectors__prog .bar i');
          var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
          gsap.to(track, { x: function () { return (isRTL() ? 1 : -1) * dist(); }, ease: 'none',
            scrollTrigger: { trigger: '.sectors', start: 'top top', end: function () { return '+=' + dist(); }, pin: pin, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
              onUpdate: function (s) { bar.style.transform = 'scaleX(' + s.progress + ')'; } } });
          $$('.sx__img img', track).forEach(function (img) { gsap.fromTo(img, { xPercent: isRTL() ? 6 : -6 }, { xPercent: isRTL() ? -6 : 6, ease: 'none', scrollTrigger: { trigger: '.sectors', start: 'top top', end: function () { return '+=' + dist(); }, scrub: true } }); });
          return function () { filmPinned = false; filmCycle(true); };
    });
    spark($('.stat__spark'));
    ScrollTrigger.sort();
  }

  /* =================================================================== intro */
  function heroIntro(delay) {
    delay = delay || 0;
    if (!hasGsap || reduce) { $$('.hero [data-split]').forEach(function (e) { e.classList.add('is-in'); }); introDone = true; if (W.ASG_GLOBE) ASG_GLOBE.intro(); return; }
    var tl = gsap.timeline({ delay: delay, onComplete: function () { introDone = true; $$('.hero [data-split]').forEach(function (e) { e.classList.add('is-in'); }); } });
    tl.add(function () { if (W.ASG_GLOBE) ASG_GLOBE.intro(2.6); }, 0)
      .fromTo('.hero .bands i', { scaleX: 0 }, { scaleX: 1, duration: 1.2, stagger: .08, ease: 'power3.inOut' }, 0)
      .fromTo('.hero__h1 .w > span', { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.3, stagger: .06, ease: 'power4.out' }, .2)
      .fromTo(['.hero .eyebrow', '.hero .lead', '.hero .btns'], { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: .12, ease: 'power3.out' }, .6)
      .fromTo(['.hud', '.scroll-cue', '.hdr'], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, stagger: .1 }, 1)
      .fromTo('.ot', { autoAlpha: 0, scale: .8 }, { autoAlpha: 1, scale: 1, duration: .8, stagger: .15, ease: 'back.out(2)' }, 1.4);
  }

  function runLoader() {
    var el = $('.loader');
    if (H.classList.contains('no-loader') || !hasGsap || reduce || !el) { if (el) el.remove(); heroIntro(.1); return; }
    var num = $('.loader__count span'), o = { v: 0 }, done = false;
    var tl = gsap.timeline();
    tl.fromTo('.loader__mark img', { scale: .6, rotate: -60, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1.6, ease: 'power3.out' }, 0)
      .to('.loader__mark circle', { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, 0)
      .to(o, { v: 100, duration: 2.2, ease: 'power2.inOut', onUpdate: function () { num.textContent = Math.round(o.v); } }, 0)
      .fromTo('.loader__line', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .8 }, .3)
      .add(finish);
    function finish() {
      if (done) return; done = true; tl.kill();
      try { sessionStorage.setItem('asg-seen', '1'); } catch (e) {}
      gsap.timeline()
        .to('.loader__bands i', { scaleX: 1, duration: .7, stagger: .06, ease: 'power3.inOut' })
        .to('.loader__in', { autoAlpha: 0, y: -30, duration: .5 }, '-=.4')
        .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'power4.inOut' }, '-=.1')
        .add(function () { el.remove(); }, '+=0')
        .add(function () { heroIntro(0); }, '-=.9');
    }
    $('.loader__skip').addEventListener('click', finish);
    setTimeout(finish, 6000); /* never let the intro hold the page */
  }

  /* =================================================================== language switch */
  function setLang(next, animate) {
    if (next === lang) return;
    try { localStorage.setItem('asg-lang', next); } catch (e) {}
    var url = new URL(location.href); url.searchParams.set('lang', next); history.replaceState(null, '', url);
    /* keep the reader where they are: remember the section in view */
    var anchor = null, off = 0;
    $$('main > section, main > div').some(function (s) { var r = s.getBoundingClientRect(); if (r.bottom > 0) { anchor = s; off = r.top; return true; } return false; });
    function swap() {
      if (ctx) { ctx.revert(); ctx = null; }
      if (mm) { mm.revert(); mm = null; }
      lang = next; applyText();
      gridSize();
      initScroll();
      ScrollTrigger.refresh();
      if (anchor) { var y = anchor.getBoundingClientRect().top + scrollY - off; if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else W.scrollTo(0, y); }
      ScrollTrigger.update(); revealPassed();
      if (W.ASG_GLOBE) ASG_GLOBE.resize();
    }
    if (!animate || !hasGsap || reduce) { swap(); return; }
    var w = $('.wipe');
    gsap.timeline()
      .set('.wipe i', { transformOrigin: 'bottom' })
      .to('.wipe i', { scaleY: 1, duration: .55, stagger: { each: .06, from: isRTL() ? 'end' : 'start' }, ease: 'power3.in' })
      .add(swap)
      .set('.wipe i', { transformOrigin: 'top' })
      .to('.wipe i', { scaleY: 0, duration: .65, stagger: { each: .06, from: next === 'ar' ? 'end' : 'start' }, ease: 'power3.out' }, '+=.08');
    void w;
  }
  $$('[data-lang-toggle]').forEach(function (b) { b.addEventListener('click', function () { setLang(lang === 'ar' ? 'en' : 'ar', true); }); });

  /* =================================================================== boot */
  filmCycle(true);
  if (hasGsap) ScrollTrigger.clearScrollMemory('manual');
  else if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  W.scrollTo(0, 0);
  applyText();
  initScroll();
  runLoader();
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { if (hasGsap) ScrollTrigger.refresh(); gridSize(); });
  addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
