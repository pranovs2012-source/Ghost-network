/* ==========================================================================
   ABYSSAL — Underwater Game Menu Template
   Vanilla JS: depth-based navigation (the ocean scrolls as you go deeper),
   canvas bubbles + marine snow, jellyfish, submersibles (SVG), settings (saved),
   dive chart, hangar, oxygen-driven demo dive, leaderboard.
   Edit the DATA section to chart your own ocean.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  var ZONES = [
    { name: 'Sunlight zone', to: 200, color: '#5ff7e6' },
    { name: 'Twilight zone', to: 1000, color: '#7fb8ff' },
    { name: 'Midnight zone', to: 4000, color: '#b38bff' },
    { name: 'Abyssal zone', to: 6000, color: '#ff8ad8' },
    { name: 'Hadal zone', to: Infinity, color: '#ff8a9a' }
  ];
  // pearls: 0–3 found, null = locked
  var SITES = [
    { name: 'Coral Gardens', depth: 40, pearls: 3, temp: '24 °C', life: 'Clownfish', desc: 'A riot of color just below the waves. The perfect first dive.' },
    { name: 'Kelp Cathedral', depth: 120, pearls: 3, temp: '18 °C', life: 'Sea otters', desc: 'Towering kelp columns filter the light like stained glass.' },
    { name: 'Sunken Galleon', depth: 310, pearls: 2, temp: '12 °C', life: 'Moray eels', desc: 'A merchant ship that never made port. Its hold is still sealed.' },
    { name: 'Twilight Shelf', depth: 650, pearls: 1, temp: '8 °C', life: 'Lanternfish', desc: 'The last of the sunlight fades into a deep, blue dusk.' },
    { name: 'Lantern Reef', depth: 1100, pearls: 0, temp: '5 °C', life: 'Comb jellies', desc: 'Every coral here glows. Turn off your lamp and look around.' },
    { name: 'Midnight Vents', depth: 2400, pearls: null, temp: '350 °C', life: 'Tube worms', desc: 'Black smokers boil the water. Requires a heat-shielded hull.' },
    { name: 'Glass Sponge Fields', depth: 4200, pearls: null, temp: '2 °C', life: 'Glass sponges', desc: 'Fragile silica forests older than any city on land.' },
    { name: 'The Hadal Trench', depth: 10900, pearls: null, temp: '1 °C', life: 'Unknown', desc: 'The deepest point ever charted. Nobody has come back with photos.' }
  ];
  // stats: 1–5
  var SUBS = [
    { name: 'Nautilette', cls: 'Scout', color: '#ffcf5a', desc: 'Small, quick and curious. Fits through the narrowest reef tunnels.', stats: { Depth: 2, Speed: 5, Lights: 3, Cargo: 2 } },
    { name: 'Brinewhale', cls: 'Heavy hauler', color: '#ff8a5c', desc: 'Slow, steady and practically unbreakable. Carries the whole team.', stats: { Depth: 4, Speed: 2, Lights: 3, Cargo: 5 } },
    { name: 'Kelpie', cls: 'Explorer', color: '#4fe39a', desc: 'Agile fins and a quiet motor. Fish barely notice it.', stats: { Depth: 3, Speed: 4, Lights: 2, Cargo: 3 } },
    { name: 'Lumen-9', cls: 'Research vessel', color: '#9fd4ff', desc: 'Built for the trenches. Floodlights strong enough to wake a whale.', stats: { Depth: 5, Speed: 2, Lights: 5, Cargo: 3 } }
  ];
  var LAMPS = [['Warm white', '#ffe9a8'], ['Cyan', '#5ff7e6'], ['Violet', '#c4a2ff'], ['Coral', '#ff9aa8'], ['Lime', '#c4ff7a']];
  var BOARD = {
    depth: [['Mara Okonkwo', 'Lumen-9', 9840], ['Theo Lindgren', 'Brinewhale', 8610], ['Isla Ferreira', 'Kelpie', 7205], ['Ren Takahashi', 'Lumen-9', 6990], ['You', 'Nautilette', 4120], ['Ama Boateng', 'Nautilette', 3300]],
    pearls: [['Isla Ferreira', 'Kelpie', 212], ['You', 'Nautilette', 187], ['Mara Okonkwo', 'Lumen-9', 164], ['Ren Takahashi', 'Lumen-9', 98], ['Theo Lindgren', 'Brinewhale', 71]]
  };
  var PLAYER_NAME = 'You';
  var MAX_DEPTH_M = 11000;  // what data-depth="1" means on the depth gauge
  var STORAGE_KEY = 'abyssal-settings';

  /* ======================= Helpers ======================= */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var screens = $$('[data-screen]');
  var current = 'main';
  var stack = [];
  var toastTimer;
  var depth = 0;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toast(msg) {
    var el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2800);
  }
  function fmt(n) { return n.toLocaleString('en-US'); }
  function zoneOf(m) { for (var i = 0; i < ZONES.length; i++) if (m < ZONES[i].to) return ZONES[i]; return ZONES[ZONES.length - 1]; }

  /* ======================= Settings (saved) ======================= */
  var DEFAULTS = { bubbles: 90, tint: 0, rays: true, jellies: true, master: 80, ambience: 60, pings: false, sens: 5, invert: false, oxygen: 'normal', sub: 0, lamp: LAMPS[0][1] };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* ignore */ }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } }

  /* ======================= SVG builders ======================= */
  function dark(c, pct) { return 'color-mix(in srgb, ' + c + ' ' + (pct || 55) + '%, #00111c)'; }
  function submarine(color, broken) {
    return '<svg viewBox="0 0 220 120" aria-hidden="true">' +
      '<path d="M40 70 L14 46 L26 70 L14 94Z" style="fill:' + dark(color) + '"/>' +
      '<rect x="20" y="66" width="22" height="8" rx="3" style="fill:' + dark(color, 40) + '"/>' +
      '<ellipse class="prop" cx="20" cy="70" rx="5" ry="18" style="fill:' + dark(color, 35) + '"/>' +
      '<path d="M120 24 V8 H138" fill="none" stroke-width="5" stroke-linecap="round" style="stroke:' + dark(color, 45) + '"/>' +
      '<rect x="82" y="22" width="52" height="32" rx="12" style="fill:' + dark(color, 75) + '"/>' +
      '<ellipse cx="112" cy="70" rx="84" ry="36" style="fill:' + color + '"/>' +
      '<path d="M36 66 Q112 52 192 66" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M44 86 Q112 104 186 84" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="8" stroke-linecap="round"/>' +
      [82, 112, 142].map(function (x) { return '<circle cx="' + x + '" cy="70" r="9" fill="#c8f8ff" stroke-width="3" style="stroke:' + dark(color, 45) + '"/><circle cx="' + (x - 3) + '" cy="67" r="2.5" fill="#fff"/>'; }).join('') +
      '<circle class="lamp" cx="194" cy="72" r="7"/>' +
      (broken ? '<path class="crack" d="M54 62 L64 74 L58 80 L70 96"/><path class="crack" d="M164 84 L156 92 L166 100"/>' +
        '<circle class="leak" cx="56" cy="58" r="4"/><circle class="leak" cx="164" cy="80" r="3"/><circle class="leak" cx="62" cy="52" r="5"/>' : '') +
      '</svg>';
  }
  function jellyfish() {
    var arms = '';
    [22, 36, 50, 64, 78].forEach(function (x, i) {
      arms += '<path class="jelly__arm" d="M' + x + ' 52 C' + (x - 8) + ' ' + (80 + i * 3) + ' ' + (x + 8) + ' 104 ' + (x - 2) + ' ' + (136 + (i % 2) * 14) + '"/>';
    });
    return '<svg viewBox="0 0 100 160" aria-hidden="true">' + arms +
      '<path class="jelly__bell" d="M10 50 C10 6 90 6 90 50 C80 56 70 49 60 55 C50 49 40 55 30 49 C22 55 15 50 10 50Z"/>' +
      '<ellipse class="jelly__inner" cx="50" cy="30" rx="18" ry="10"/></svg>';
  }
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';

  /* ======================= Jellyfish + fish schools ======================= */
  [{ x: 72, y: 16, s: 96, c: '#b38bff', d: 9, dx: -40 }, { x: 86, y: 46, s: 64, c: '#5ff7e6', d: 7, dx: 30 }, { x: 8, y: 28, s: 54, c: '#ff8ad8', d: 11, dx: 40 }].forEach(function (j) {
    var el = document.createElement('div');
    el.className = 'jelly';
    el.style.cssText = 'left:' + j.x + '%;top:' + j.y + '%;--s:' + j.s + 'px;--c:' + j.c + ';--d:' + j.d + 's;--dx:' + j.dx + 'px';
    el.innerHTML = jellyfish();
    $('#jellies').appendChild(el);
  });
  $$('.school').forEach(function (s) { s.innerHTML = new Array(7).join('<span></span>'); });

  /* ======================= Particles: bubbles rise, marine snow falls ======================= */
  var canvas = $('#particles'), ctx = canvas.getContext('2d'), parts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() { W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function makeParts(n) {
    parts = [];
    for (var i = 0; i < n; i++) {
      var bubble = i % 2 === 0;
      parts.push({ bubble: bubble, x: Math.random() * W, y: Math.random() * H, r: bubble ? 1.5 + Math.random() * 5 : .6 + Math.random() * 1.6, v: bubble ? .3 + Math.random() * .9 : .1 + Math.random() * .35, ph: Math.random() * 6.28 });
    }
  }
  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    var bubbleA = Math.max(0, 1 - depth * 1.1), snowA = .15 + depth * .85;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!reduceMotion) {
        p.y += p.bubble ? -p.v : p.v;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      }
      var x = p.x + Math.sin(t / 900 + p.ph) * (p.bubble ? 6 : 3);
      if (p.bubble) {
        ctx.globalAlpha = .55 * bubbleA;
        ctx.strokeStyle = '#dffcff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, 6.283); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .7 * bubbleA;
        ctx.beginPath(); ctx.arc(x - p.r * .35, p.y - p.r * .35, p.r * .25, 0, 6.283); ctx.fill();
      } else {
        ctx.globalAlpha = .6 * snowA; ctx.fillStyle = '#e8f6ff';
        ctx.beginPath(); ctx.arc(x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  window.addEventListener('resize', function () { resize(); if (reduceMotion) requestAnimationFrame(frame); });
  resize();

  /* ======================= Sounds (Web Audio, no files) ======================= */
  var actx = null;
  function audio() { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); return actx; }
  function bloop() {
    if (!settings.pings) return;
    try {
      var a = audio(), t = a.currentTime, o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(820, t + .12);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12 * settings.master / 100, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + .22);
    } catch (e) { /* no audio */ }
  }
  function ping() {
    if (!settings.pings) return;
    try {
      var a = audio(), t = a.currentTime, o = a.createOscillator(), g = a.createGain(), dl = a.createDelay(), fb = a.createGain();
      o.type = 'sine'; o.frequency.value = 1320;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.1 * settings.master / 100, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.2);
      dl.delayTime.value = .32; fb.gain.value = .35;
      o.connect(g); g.connect(a.destination); g.connect(dl); dl.connect(fb).connect(dl); dl.connect(a.destination);
      o.start(t); o.stop(t + 1.3);
    } catch (e) { /* no audio */ }
  }

  /* ======================= Navigation ======================= */
  function setDepth(d) {
    depth = d;
    root.style.setProperty('--depth', d);
    $('#gauge-value').textContent = fmt(Math.round(d * MAX_DEPTH_M / 10) * 10) + ' m';
    if (reduceMotion) requestAnimationFrame(frame);
  }
  function showScreen(id, opts) {
    opts = opts || {};
    var t = document.getElementById(id);
    if (!t || !t.hasAttribute('data-screen')) return;
    if (id === current && !opts.force) return;
    if (!opts.isBack && id !== current) stack.push(current);
    if (stack.length > 20) stack.shift();
    var prev = current;
    screens.forEach(function (s) { var on = s === t; s.hidden = !on; s.classList.toggle('is-active', on); });
    current = id;
    setDepth(Number(t.getAttribute('data-depth')) || 0);
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (prev !== id) onLeave(prev);
    onEnter(id);
    if (!opts.silent) {
      var f = t.querySelector('.dive-btn, .list-btn, h1');
      if (f) f.focus({ preventScroll: true });
      if (window.scrollY > 0) window.scrollTo(0, 0);
    }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    bloop();
    var a = btn.getAttribute('data-action');
    if (a === 'checkpoint') toast('Back to the last air pocket. Breathe easy.');
    if (a === 'redive') toast('New hull, fresh tanks. Diving again!');
    if (a === 'launch') { settings.sub = subIndex; save(); renderPlaySub(); toast(SUBS[subIndex].name + ' is fueled and ready to dive.'); }
    if (a === 'quit') toast('Surfacing. Thanks for diving with us.');
    if (btn.id === 'site-go') toast('Descending to ' + SITES[siteIndex].name + ' — ' + fmt(SITES[siteIndex].depth) + ' m.');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (e) {
    var screen = document.getElementById(current);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') { var back = $('.panel__head .round-btn', screen); if (back) back.click(); else showScreen('main'); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = $$('.dive-btn, .list-btn', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      e.preventDefault();
      var d = e.key === 'ArrowDown' ? 1 : -1;
      items[idx === -1 ? 0 : (idx + d + items.length) % items.length].focus();
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && current === 'characters' && !e.target.closest('[role="tab"], input')) {
      e.preventDefault();
      setSub(subIndex + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });

  /* ======================= Screen hooks ======================= */
  var diveTimer, pingTimer;
  var O2_RATE = { generous: .25, normal: .45, scarce: .8 };
  function onEnter(id) {
    if (id === 'play') {
      var m = 1100, o2 = 100, pearls = 0;
      diveTimer = setInterval(function () {
        m += Math.round(Math.random() * 3);
        o2 = Math.max(0, o2 - O2_RATE[settings.oxygen] * (Math.random() + .5));
        if (Math.random() < .05) pearls++;
        $('#h-depth').textContent = fmt(m);
        $('#h-pearls').textContent = pearls;
        var bar = $('#h-o2');
        bar.style.setProperty('--v', o2 + '%');
        bar.classList.toggle('is-low', o2 < 30);
        if (o2 <= 0) { toast('Out of oxygen!'); showScreen('gameover'); }
      }, 250);
      ping();
      pingTimer = setInterval(ping, 3000);
    }
    if (id === 'gameover') {
      countUp($('#go-depth'), 1184, ' m');
      countUp($('#go-pearls'), 14, '');
      countUp($('#go-score'), 27650, '');
    }
  }
  function onLeave(id) { if (id === 'play') { clearInterval(diveTimer); clearInterval(pingTimer); } }
  function countUp(el, to, suffix) {
    var start = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - start) / 1300);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))) + suffix;
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); onChange(t); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); bloop(); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n);
      });
    });
  }
  setupTabs($('#settings [role="tablist"]'), function (t) {
    $$('#settings [role="tabpanel"]').forEach(function (p) { p.hidden = p.id !== t.getAttribute('aria-controls'); });
  });
  var board = 'depth';
  setupTabs($('#leaderboard [role="tablist"]'), function (t) {
    board = t.getAttribute('data-board');
    $('#b-panel').setAttribute('aria-labelledby', t.id);
    renderBoard();
  });

  /* ======================= Settings form ======================= */
  var form = $('#settings-form');
  var FORM_KEYS = ['bubbles', 'tint', 'rays', 'jellies', 'master', 'ambience', 'pings', 'sens', 'invert', 'oxygen'];
  function paintRange(input) {
    input.style.setProperty('--fill', ((input.value - input.min) / (input.max - input.min) * 100) + '%');
    var out = form.querySelector('output[for="' + input.id + '"]');
    if (out) out.textContent = input.value;
  }
  function fillForm() {
    FORM_KEYS.forEach(function (k) {
      var f = form.elements[k];
      if (f instanceof RadioNodeList) f.value = settings[k];
      else if (f.type === 'checkbox') f.checked = !!settings[k];
      else f.value = settings[k];
    });
    $$('input[type="range"]', form).forEach(paintRange);
    apply();
  }
  function readForm() {
    FORM_KEYS.forEach(function (k) {
      var f = form.elements[k];
      if (f instanceof RadioNodeList) settings[k] = f.value;
      else if (f.type === 'checkbox') settings[k] = f.checked;
      else settings[k] = Number(f.value);
    });
  }
  var lastCount = -1;
  function apply() {
    root.style.setProperty('--tint', settings.tint + 'deg');
    root.style.setProperty('--lamp', settings.lamp);
    root.classList.toggle('no-rays', !settings.rays);
    root.classList.toggle('no-jellies', !settings.jellies);
    if (settings.bubbles !== lastCount) {
      var first = lastCount === -1;
      makeParts(settings.bubbles); lastCount = settings.bubbles;
      if (first || reduceMotion) requestAnimationFrame(frame);
    }
  }
  form.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); readForm(); apply(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); readForm(); save(); toast('Settings saved to your dive log.'); ping(); });
  $('#reset-settings').addEventListener('click', function () {
    FORM_KEYS.forEach(function (k) { settings[k] = DEFAULTS[k]; });
    fillForm();
    toast('Defaults restored. Save to keep them.');
  });

  /* ======================= Dive chart ======================= */
  var siteIndex = 0, cable = $('#sites'), lastZone = null;
  SITES.forEach(function (s, i) {
    var z = zoneOf(s.depth);
    if (z !== lastZone) {
      var lbl = document.createElement('p');
      lbl.className = 'zone-label';
      lbl.setAttribute('aria-hidden', 'true');
      lbl.textContent = z.name;
      cable.appendChild(lbl);
      lastZone = z;
    }
    if (s.pearls !== null) siteIndex = i;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'site-btn' + (s.pearls === null ? ' site-btn--locked' : '');
    b.setAttribute('role', 'radio');
    b.style.setProperty('--zc', z.color);
    b.innerHTML = '<span class="site-btn__node" aria-hidden="true">' + (s.pearls === null ? LOCK : '') + '</span>' +
      '<span class="site-btn__text"><span class="site-btn__name">' + s.name + '</span><span class="site-btn__depth">' + fmt(s.depth) + ' m' + (s.pearls === null ? '<span class="visually-hidden">, locked</span>' : '') + '</span></span>';
    b.addEventListener('click', function () {
      setSite(i);
      if (matchMedia('(max-width: 900px)').matches) $('#site').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    });
    b.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      setSite(siteIndex + d, true);
    });
    cable.appendChild(b);
  });
  function setSite(i, focus) {
    siteIndex = (i + SITES.length) % SITES.length;
    var s = SITES[siteIndex], z = zoneOf(s.depth);
    $$('.site-btn', cable).forEach(function (b, n) {
      var on = n === siteIndex;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $('#site-zone').textContent = z.name + (s.pearls === null ? ' · Locked' : s.pearls === 0 ? ' · Next dive' : '');
    $('#site-name').textContent = s.name;
    $('#site-desc').textContent = s.desc;
    $('#site-facts').innerHTML = '<div><dt>Depth</dt><dd>' + fmt(s.depth) + ' m</dd></div><div><dt>Water</dt><dd>' + s.temp + '</dd></div><div><dt>Look for</dt><dd>' + s.life + '</dd></div>';
    var n = s.pearls || 0, html = '';
    for (var p = 0; p < 3; p++) html += '<span class="pearl' + (p < n ? ' is-on' : '') + '" aria-hidden="true"></span>';
    $('#site-pearls').innerHTML = html + '<span class="visually-hidden">' + (s.pearls === null ? 'Not yet explored' : n + ' of 3 pearls found') + '</span>';
    var go = $('#site-go');
    go.disabled = s.pearls === null;
    go.textContent = s.pearls === null ? 'Hull upgrade required' : s.pearls === 0 ? 'Continue dive' : 'Dive again';
    var info = $('#site');
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
  }

  /* ======================= Hangar ======================= */
  var subIndex = Math.min(settings.sub, SUBS.length - 1);
  function setSub(i) {
    subIndex = (i + SUBS.length) % SUBS.length;
    var s = SUBS[subIndex];
    var stage = $('#hangar-sub');
    stage.innerHTML = submarine(s.color);
    stage.classList.remove('is-swap'); void stage.offsetWidth; stage.classList.add('is-swap');
    $('#sub-class').textContent = s.cls + ' · ' + (subIndex + 1) + ' of ' + SUBS.length;
    $('#sub-name').textContent = s.name;
    $('#sub-desc').textContent = s.desc;
    $('#sub-stats').innerHTML = Object.keys(s.stats).map(function (k) {
      var dots = '';
      for (var d = 0; d < 5; d++) dots += '<span class="dot' + (d < s.stats[k] ? ' is-on' : '') + '" aria-hidden="true"></span>';
      return '<div><dt>' + k + '</dt><dd>' + dots + '<span class="visually-hidden">' + s.stats[k] + ' of 5</span></dd></div>';
    }).join('');
    var info = $('#sub-info');
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
  }
  $('#sub-prev').addEventListener('click', function () { setSub(subIndex - 1); bloop(); });
  $('#sub-next').addEventListener('click', function () { setSub(subIndex + 1); bloop(); });
  LAMPS.forEach(function (l, i) {
    var id = 'lamp-' + i;
    var input = document.createElement('input');
    input.type = 'radio'; input.name = 'lamp'; input.id = id; input.value = l[1];
    input.checked = settings.lamp === l[1];
    var label = document.createElement('label');
    label.htmlFor = id;
    label.style.setProperty('--c', l[1]);
    label.innerHTML = '<span class="visually-hidden">' + l[0] + '</span>';
    input.addEventListener('change', function () { settings.lamp = l[1]; apply(); save(); });
    $('#lamps').appendChild(input);
    $('#lamps').appendChild(label);
  });
  function renderPlaySub() {
    $('#play-sub').innerHTML = submarine(SUBS[settings.sub % SUBS.length].color);
    $('#sinking-sub').innerHTML = submarine(SUBS[settings.sub % SUBS.length].color, true);
  }

  /* ======================= Leaderboard ======================= */
  function renderBoard() {
    $('#b-metric').textContent = board === 'depth' ? 'Depth' : 'Pearls';
    $('#b-body').innerHTML = BOARD[board].slice().sort(function (a, b) { return b[2] - a[2]; }).map(function (r, i) {
      return '<tr class="' + (r[0] === PLAYER_NAME ? 'is-you' : '') + '" style="animation-delay:' + (i * 0.06) + 's">' +
        '<td><span class="badge' + (i < 3 ? ' badge--' + (i + 1) : '') + '">' + (i + 1) + '</span></td>' +
        '<td>' + r[0] + (r[0] === PLAYER_NAME ? '<span class="visually-hidden"> (your dive)</span>' : '') + '</td>' +
        '<td class="col-sub">' + r[1] + '</td>' +
        '<td class="metric">' + fmt(r[2]) + (board === 'depth' ? ' m' : '') + '</td></tr>';
    }).join('');
  }

  /* ======================= Init ======================= */
  fillForm();
  setSite(siteIndex);
  setSub(subIndex);
  renderPlaySub();
  renderBoard();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
