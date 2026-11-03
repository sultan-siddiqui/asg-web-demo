/* ASG hero globe — the exact ASG mark, built from vector paths traced off the official logo.
   Formation: an energy core ignites, the grid lines draw the sphere, then every ribbon swirls
   in around the centre and locks into place. Afterwards the globe keeps moving: three depth
   layers turn with the pointer and an idle sway, a light sweep crosses it, and current runs
   along the ribbons. */
(function () {
  'use strict';
  var host = document.getElementById('globe');
  var M = window.ASG_MARK;
  if (!host || !M) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var VB = '0 0 ' + M.w + ' ' + M.h, CX = M.w / 2, CY = M.h / 2;

  function svg(cls) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', VB); s.setAttribute('class', 'gm ' + cls); s.setAttribute('aria-hidden', 'true');
    return s;
  }
  function path(d, fill, cls, id) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', fill);
    if (cls) p.setAttribute('class', cls);
    if (id) p.setAttribute('id', id);
    return p;
  }

  /* stage with three depth layers */
  var stage = document.createElement('div'); stage.className = 'gm-stage';
  var core = document.createElement('div'); core.className = 'gm-core';
  var lSvg = svg('gm-l'), rSvg = svg('gm-r'), fSvg = svg('gm-f');
  stage.appendChild(core); stage.appendChild(lSvg); stage.appendChild(rSvg); stage.appendChild(fSvg);
  host.appendChild(stage);

  var lines = M.l.map(function (l) { var p = path(l[1], l[0], 'gm-line'); lSvg.appendChild(p); return p; });
  var ribs = M.r.map(function (r, i) { var p = path(r[1], r[0], 'gm-rib', 'gmr' + i); rSvg.appendChild(p); return p; });

  /* light sweep, clipped to the mark */
  var defs = document.createElementNS(NS, 'defs');
  defs.innerHTML =
    '<clipPath id="gmClip">' + M.r.map(function (r) { return '<path d="' + r[1] + '"/>'; }).join('') + '</clipPath>' +
    '<linearGradient id="gmSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff8e6" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="gmSpark"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe2a8"/><stop offset="1" stop-color="#f39019" stop-opacity="0"/></radialGradient>';
  fSvg.appendChild(defs);
  var sheenG = document.createElementNS(NS, 'g'); sheenG.setAttribute('clip-path', 'url(#gmClip)');
  var sheen = document.createElementNS(NS, 'rect');
  sheen.setAttribute('x', -M.w * 0.5); sheen.setAttribute('y', -M.h * 0.25); sheen.setAttribute('width', M.w * 0.32); sheen.setAttribute('height', M.h * 1.5);
  sheen.setAttribute('fill', 'url(#gmSheen)'); sheen.setAttribute('transform', 'rotate(28 ' + CX + ' ' + CY + ')');
  sheenG.appendChild(sheen); fSvg.appendChild(sheenG);

  /* current along the biggest ribbons */
  var big = M.r.map(function (r, i) { return [r[2], i]; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 9);
  var sparkG = document.createElementNS(NS, 'g'); sparkG.setAttribute('class', 'gm-sparks');
  big.forEach(function (b, k) {
    for (var n = 0; n < 2; n++) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 9); c.setAttribute('fill', 'url(#gmSpark)');
      var dur = 9 + (k % 4) * 2.5;
      c.innerHTML = '<animateMotion dur="' + dur + 's" repeatCount="indefinite" begin="-' + (n * dur / 2 + k * 0.7).toFixed(1) + 's"><mpath href="#gmr' + b[1] + '"/></animateMotion>';
      sparkG.appendChild(c);
    }
  });
  fSvg.appendChild(sparkG);

  /* ---------- motion ---------- */
  var hasG = !!window.gsap;
  var formed = reduce || !hasG;
  var mx = 0, my = 0, tx = 0, ty = 0, scrollP = 0, t0 = performance.now(), visible = true;
  addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });

  if (!formed) {
    gsap.set(lines, { opacity: 0 });
    gsap.set(ribs, { opacity: 0 });
    gsap.set([core, sparkG], { opacity: 0 });
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    var t = (now - t0) / 1000;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    var sway = reduce ? 0 : Math.sin(t * 0.45) * 9;
    var ry = mx * 22 + sway, rx = -my * 16 + (reduce ? 0 : Math.cos(t * 0.35) * 3);
    var s = 1 - scrollP * 0.16;
    stage.style.transform = 'translate3d(0,' + (scrollP * -60 + (reduce ? 0 : Math.sin(t * 0.8) * 8)).toFixed(1) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + (scrollP * 24).toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
    var spread = 40 + scrollP * 220;
    lSvg.style.transform = 'translateZ(' + (-spread) + 'px)';
    rSvg.style.transform = 'translateZ(' + (spread * 0.6) + 'px)';
    fSvg.style.transform = 'translateZ(' + (spread * 0.75) + 'px)';
  }
  requestAnimationFrame(loop);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(host);

  function sweep() {
    if (reduce || !hasG) return;
    gsap.fromTo(sheen, { attr: { x: -M.w * 0.5 } }, { attr: { x: M.w * 1.2 }, duration: 2.4, ease: 'power2.inOut', repeat: -1, repeatDelay: 3.6 });
  }

  function form(dur) {
    if (formed) { sweep(); return; }
    formed = true;
    var origin = CX + ' ' + CY;
    var tl = gsap.timeline();
    /* 1 · the core ignites */
    tl.fromTo(core, { opacity: 0, scale: .1 }, { opacity: 1, scale: 1, duration: .9, ease: 'power3.out' }, 0)
    /* 2 · grid lines draw the sphere outward from the centre */
      .fromTo(lines, { opacity: 0, scale: .55, svgOrigin: origin }, { opacity: 1, scale: 1, svgOrigin: origin, duration: 1.1, ease: 'expo.out', stagger: { each: .012, from: 'center' } }, .25)
    /* 3 · ribbons swirl in around the centre and lock into place */
      .fromTo(ribs, { opacity: 0, rotation: function (i) { return -110 + i * 1.5; }, scale: 1.35, svgOrigin: origin },
        { opacity: 1, rotation: 0, scale: 1, svgOrigin: origin, duration: 1.7, ease: 'expo.out', stagger: .045 }, .6)
      .to(core, { opacity: .55, duration: 1 }, 1.4)
      .fromTo(sparkG, { opacity: 0 }, { opacity: 1, duration: 1 }, 2.2)
      .add(sweep, 2.2);
    if (dur) tl.timeScale(2.6 / dur);
  }

  window.ASG_GLOBE = {
    intro: form,
    scroll: function (p) { scrollP = p; },
    resize: function () {}
  };
  if (formed) sweep();
})();
