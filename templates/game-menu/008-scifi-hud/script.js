/* ==========================================================================
   AXIOM FRONT — Sci-Fi HUD Game Menu Template
   Vanilla JS: navigation, boot sequence, keyboard control, systems config with
   key rebinding (saved locally), mission board, pilot dossiers with radar chart,
   rankings. Edit the DATA section to plug in your own content.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= DATA (edit me) ======================= */
  var MISSIONS = [
    { code: 'OP-01', name: 'First Light', status: 'done', threat: 1, terrain: 'Orbital dock', reward: '1,200 CR', x: 30, y: 40, text: 'Escort the supply convoy out of the dock before the blockade closes.' },
    { code: 'OP-04', name: 'Dust Choir', status: 'done', threat: 2, terrain: 'Desert canyon', reward: '2,400 CR', x: 62, y: 58, text: 'Silence the jamming array hidden in the canyon walls.' },
    { code: 'OP-07', name: 'Glass Tide', status: 'active', threat: 3, terrain: 'Frozen coast', reward: '3,800 CR', x: 44, y: 28, text: 'Secure the relay tower and extract the encrypted intel before the storm front hits.' },
    { code: 'OP-09', name: 'Iron Garden', status: 'new', threat: 4, terrain: 'Ruined arcology', reward: '5,000 CR', x: 70, y: 34, text: 'Push through the overgrown arcology and disable three defense nodes.' },
    { code: 'OP-11', name: 'Hollow Crown', status: 'new', threat: 5, terrain: 'Mountain fortress', reward: '7,500 CR', x: 24, y: 66, text: 'Lead the assault on the mountain fortress. Expect heavy armor.' },
    { code: 'OP-13', name: 'Zero Meridian', status: 'locked', threat: 5, terrain: 'Classified', reward: 'Classified', x: 50, y: 50, text: '' }
  ];

  var PILOTS = [
    { call: 'WARDEN', name: 'Cmdr. Ilse Varga', color: '#4fd1ff', bio: 'Twenty years in heavy frames. Has never lost a squadmate she could reach.', stats: { Armor: 90, Speed: 45, Aim: 70, Tech: 55, Lead: 95 } },
    { call: 'KESTREL', name: 'Lt. Tomas Reyes', color: '#59ffa8', bio: 'Scout pilot. Lives at full throttle and lands on fumes.', stats: { Armor: 35, Speed: 98, Aim: 72, Tech: 60, Lead: 50 } },
    { call: 'ORACLE', name: 'Dr. Mei Han', color: '#c39bff', bio: 'Electronic warfare specialist. Turns enemy turrets into allies.', stats: { Armor: 50, Speed: 55, Aim: 58, Tech: 99, Lead: 70 } },
    { call: 'ANVIL', name: 'Sgt. Dario Okafor', color: '#ffb347', bio: 'Siege frame operator. If it stands still, he can level it.', stats: { Armor: 96, Speed: 30, Aim: 88, Tech: 40, Lead: 62 } }
  ];

  var RANKS = {
    global: [['NOVA-1', 4.2, 312, 9840, 5], ['RAZORWING', 3.8, 290, 9610, 5], ['HALCYON', 3.1, 340, 9200, 4], ['GHOSTLINE', 2.9, 210, 8875, 4], ['WARDEN', 2.4, 188, 8130, 3], ['TALON-9', 2.2, 260, 7990, 3], ['DRIFT', 1.9, 150, 7420, 2]],
    squad: [['WARDEN', 2.4, 188, 8130, 3], ['KESTREL', 2.1, 176, 7710, 3], ['ORACLE', 1.7, 164, 7300, 2], ['ANVIL', 1.5, 155, 6980, 2]]
  };
  var PLAYER_NAME = 'WARDEN';
  var DEFAULT_BINDS = { 'Move forward': 'W', 'Strafe left': 'A', 'Move back': 'S', 'Strafe right': 'D', 'Boost': 'SHIFT', 'Fire': 'MOUSE 1', 'Scan': 'Q' };
  var STORAGE_KEY = 'axiom-front-systems';

  /* ======================= Helpers ======================= */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var screens = $$('[data-screen]');
  var current = 'main';
  var stack = [];
  var toastTimer;
  function toast(msg) {
    var el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2400);
  }

  /* ======================= Boot sequence + data streams + clock ======================= */
  var BOOT = ['> AXF-OS KERNEL ............ OK', '> NEURAL LINK .............. OK', '> WEAPON SYSTEMS ........... OK', '> TACTICAL NET ............. OK', '> WELCOME BACK, COMMANDER'];
  $('#boot').innerHTML = BOOT.map(function (l, i) { return '<div style="animation-delay:' + (i * 0.09) + 's">' + l + '</div>'; }).join('');
  function streamText() {
    var out = '';
    for (var i = 0; i < 80; i++) out += (Math.random() * 0xffffff | 0).toString(16).toUpperCase().padStart(6, '0') + '\n';
    return '<div>' + out + out + '</div>';
  }
  $('#stream-left').innerHTML = streamText();
  $('#stream-right').innerHTML = streamText();
  function tick() {
    var d = new Date();
    $('#clock').textContent = [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()].map(function (n) { return String(n).padStart(2, '0'); }).join(':') + ' UTC';
  }
  tick();
  setInterval(tick, 1000);

  /* ======================= Interface tones ======================= */
  var actx = null;
  function tone(freq, dur) {
    if (!settings.uiTones) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, actx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 1.5, actx.currentTime + dur);
      g.gain.setValueAtTime(0.05 * settings.master / 100, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g).connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch (e) { /* no audio */ }
  }

  /* ======================= Navigation ======================= */
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    if (id === current && !opts.force) return;
    if (!opts.isBack) stack.push(current);
    if (stack.length > 20) stack.shift();
    var prev = current;
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    current = id;
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    onLeave(prev);
    onEnter(id);
    if (!opts.silent) { var f = target.querySelector('.cmd, h1'); if (f) f.focus({ preventScroll: true }); }
  }
  function goBack() { var p = stack.pop(); if (p) showScreen(p, { isBack: true }); }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (!btn) return;
    e.preventDefault();
    tone(520, 0.08);
    var a = btn.getAttribute('data-action');
    if (a === 'restart') toast('MISSION RESTARTED');
    if (a === 'assign') toast(PILOTS[pilotIndex].call + ' ASSIGNED TO VX-04');
    if (a === 'quit') toast('SESSION TERMINATED — STAY SHARP, COMMANDER');
    if (btn.hasAttribute('data-back') && stack.length) { goBack(); return; }
    showScreen(btn.getAttribute('data-goto'));
  });

  document.addEventListener('keydown', function (e) {
    if (listening) return; // key rebinding in progress
    var screen = document.getElementById(current);
    if (e.key === 'Escape') {
      e.preventDefault();
      if (current === 'play') showScreen('pause');
      else if (current === 'pause') showScreen('play');
      else if (current !== 'main') { var back = $('.panel__head .sq-btn', screen); if (back) back.click(); else showScreen('main'); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = $$('.cmd', screen);
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      if (idx === -1 && document.activeElement !== document.body && !document.activeElement.matches('h1')) return;
      e.preventDefault();
      var d = e.key === 'ArrowDown' ? 1 : -1;
      items[idx === -1 ? 0 : (idx + d + items.length) % items.length].focus();
      tone(400, 0.04);
    }
    if (current === 'characters' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('[role="tab"]')) {
      e.preventDefault();
      setPilot(pilotIndex + (e.key === 'ArrowRight' ? 1 : -1), e.target.closest('.pilot'));
    }
  });

  /* ======================= Screen hooks ======================= */
  var playTimer;
  function onEnter(id) {
    if (id === 'play') {
      var ammo = 24, relay = 0;
      playTimer = setInterval(function () {
        ammo = ammo > 0 ? ammo - 1 : 48;
        $('#ammo').textContent = ammo;
        $('#dist').textContent = (200 + Math.round(Math.random() * 300)) + 'm';
        if (ammo % 8 === 0) { relay = (relay + 1) % 4; $('#relay').textContent = relay + '/3'; }
      }, 400);
    }
    if (id === 'gameover') { countUp($('#db-hostiles'), 37, ''); countUp($('#db-acc'), 64, '%'); countUp($('#db-score'), 18450, ''); }
  }
  function onLeave(id) { if (id === 'play') clearInterval(playTimer); }
  function countUp(el, to, suffix) {
    var start = performance.now();
    (function step(now) {
      var t = Math.min(1, (now - start) / 1100);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))).toLocaleString('en-US') + suffix;
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ======================= Tabs ======================= */
  function setupTabs(list, onChange) {
    var tabs = $$('[role="tab"]', list);
    function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); onChange(t); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); tone(700, 0.05); });
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
  var board = 'global';
  setupTabs($('#leaderboard [role="tablist"]'), function (t) {
    board = t.getAttribute('data-board');
    $('#r-panel').setAttribute('aria-labelledby', t.id);
    renderRanks();
  });

  /* ======================= Systems (saved) ======================= */
  var DEFAULTS = { master: 80, comms: 60, music: 70, uiTones: false, holo: 100, scan: true, streams: true, hue: 'cyan', sens: 8, binds: DEFAULT_BINDS };
  var settings = JSON.parse(JSON.stringify(DEFAULTS));
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch (e) { /* ignore */ }
  var form = $('#settings-form');
  function markDirty(dirty) { $('#cfg-status').textContent = dirty ? 'UNSAVED' : 'SYNCED'; }
  function paintRange(input) {
    input.style.setProperty('--fill', ((input.value - input.min) / (input.max - input.min) * 100) + '%');
    var out = form.querySelector('output[for="' + input.id + '"]');
    if (out) out.textContent = input.value;
  }
  function fillForm() {
    Object.keys(settings).forEach(function (k) {
      var f = form.elements[k];
      if (!f) return;
      if (f instanceof RadioNodeList) f.value = settings[k];
      else if (f.type === 'checkbox') f.checked = !!settings[k];
      else f.value = settings[k];
    });
    $$('input[type="range"]', form).forEach(paintRange);
    renderBinds();
    apply();
  }
  function readForm() {
    Object.keys(DEFAULTS).forEach(function (k) {
      var f = form.elements[k];
      if (!f) return;
      if (f instanceof RadioNodeList) settings[k] = f.value;
      else if (f.type === 'checkbox') settings[k] = f.checked;
      else settings[k] = Number(f.value);
    });
  }
  function apply() {
    var root = document.documentElement;
    root.setAttribute('data-hue', settings.hue);
    root.style.setProperty('--holo-boost', settings.holo / 100);
    document.body.classList.toggle('no-scan', !settings.scan);
    document.body.classList.toggle('no-streams', !settings.streams);
  }
  form.addEventListener('input', function (e) { if (e.target.type === 'range') paintRange(e.target); readForm(); apply(); markDirty(true); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); readForm();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (err) { /* ignore */ }
    markDirty(false); toast('CONFIGURATION COMMITTED'); tone(880, 0.15);
  });
  $('#reset-settings').addEventListener('click', function () {
    settings = JSON.parse(JSON.stringify(DEFAULTS)); fillForm(); markDirty(true); toast('FACTORY DEFAULTS LOADED — COMMIT TO SAVE');
  });

  /* Key rebinding: click a binding, press any key */
  var listening = null;
  function renderBinds() {
    $('#binds').innerHTML = Object.keys(settings.binds).map(function (action) {
      return '<tr><th scope="row">' + action + '</th><td><button type="button" class="bind-btn" data-action-name="' + action + '" aria-label="' + action + ': ' + settings.binds[action] + '. Press to rebind">' + settings.binds[action] + '</button></td></tr>';
    }).join('');
  }
  $('#binds').addEventListener('click', function (e) {
    var b = e.target.closest('.bind-btn');
    if (!b) return;
    if (listening) listening.classList.remove('is-listening');
    listening = b;
    b.classList.add('is-listening');
    b.textContent = 'PRESS KEY';
  });
  document.addEventListener('keydown', function (e) {
    if (!listening) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var action = listening.getAttribute('data-action-name');
    if (e.key !== 'Escape') {
      var key = e.key === ' ' ? 'SPACE' : e.key.length === 1 ? e.key.toUpperCase() : e.key.toUpperCase().replace('ARROW', '');
      settings.binds[action] = key;
      markDirty(true);
      toast(action.toUpperCase() + ' → ' + key);
    }
    var btn = listening;
    listening = null;
    renderBinds();
    var again = $('.bind-btn[data-action-name="' + btn.getAttribute('data-action-name') + '"]');
    if (again) again.focus();
  }, true);

  /* ======================= Missions ======================= */
  var list = $('#mission-list');
  var selected = MISSIONS.findIndex(function (m) { return m.status === 'active'; });
  MISSIONS.forEach(function (m, i) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mission';
    var status = { done: 'COMPLETE', active: 'IN PROGRESS', new: 'NEW', locked: 'LOCKED' }[m.status];
    b.innerHTML = '<span class="mission__code">' + m.code + '</span><span class="mission__name">' + (m.status === 'locked' ? '[REDACTED]' : m.name) + '</span>' +
      '<span class="mission__status' + (m.status === 'done' ? ' mission__status--done' : '') + '">' + status + '</span>';
    if (m.status === 'locked') b.disabled = true;
    else {
      b.setAttribute('aria-pressed', String(i === selected));
      b.addEventListener('click', function () { selectMission(i); tone(620, 0.06); });
    }
    li.appendChild(b);
    list.appendChild(li);
  });
  function selectMission(i) {
    selected = i;
    var m = MISSIONS[i];
    $$('.mission', list).forEach(function (b, n) { if (!b.disabled) b.setAttribute('aria-pressed', String(n === i)); });
    $('#b-code').textContent = m.code + ' · ' + (m.status === 'done' ? 'REPLAY' : 'BRIEFING');
    $('#b-title').textContent = m.name;
    $('#b-text').textContent = m.text;
    $('#b-terrain').textContent = m.terrain;
    $('#b-reward').textContent = m.reward;
    var t = '';
    for (var k = 0; k < 5; k++) t += '<i class="' + (k < m.threat ? 'on' + (m.threat >= 4 ? ' high' : '') : '') + '"></i>';
    $('#b-threat').innerHTML = t + '<span class="visually-hidden">Threat level ' + m.threat + ' of 5</span>';
    var marker = $('#globe-marker');
    marker.style.left = m.x + '%';
    marker.style.top = m.y + '%';
    var br = $('#briefing');
    br.classList.remove('is-swap'); void br.offsetWidth; br.classList.add('is-swap');
  }

  /* ======================= Pilots ======================= */
  var pilotIndex = 0;
  var HELMET = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 10c22 0 36 16 36 38v14c0 10-6 18-14 22l-6 6H34l-6-6c-8-4-14-12-14-22V48c0-22 14-38 36-38z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M22 46h56l-6 16H28z" fill="currentColor" opacity=".55"/><path d="M50 10v18M30 74h40" stroke="currentColor" stroke-width="2"/></svg>';
  var roster = $('#roster');
  PILOTS.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pilot';
    b.setAttribute('role', 'radio');
    b.style.setProperty('--pc', p.color);
    b.innerHTML = '<span class="pilot__hex" aria-hidden="true"></span><span class="pilot__call">' + p.call + '</span>';
    b.addEventListener('click', function () { setPilot(i); });
    roster.appendChild(b);
  });

  // Radar (spider) chart, animated between pilots
  var spider = $('#spider');
  var AXES = Object.keys(PILOTS[0].stats);
  var R = 80;
  function point(i, v) {
    var a = -Math.PI / 2 + i * 2 * Math.PI / AXES.length;
    return [Math.cos(a) * R * v, Math.sin(a) * R * v];
  }
  (function drawWeb() {
    var svg = '<desc id="spider-desc">Pilot attribute chart</desc>';
    [0.25, 0.5, 0.75, 1].forEach(function (r) {
      svg += '<polygon class="web" points="' + AXES.map(function (_, i) { return point(i, r).join(','); }).join(' ') + '"/>';
    });
    AXES.forEach(function (name, i) {
      var p = point(i, 1), l = point(i, 1.22);
      svg += '<line class="axis" x1="0" y1="0" x2="' + p[0] + '" y2="' + p[1] + '"/>';
      svg += '<text x="' + l[0] + '" y="' + (l[1] + 3) + '" text-anchor="middle">' + name.toUpperCase() + '</text>';
    });
    svg += '<polygon class="shape" id="spider-shape" points=""/>';
    spider.innerHTML = svg;
  })();
  var shownStats = AXES.map(function () { return 0; });
  function animateShape(target) {
    var from = shownStats.slice(), start = performance.now();
    (function step(now) {
      var t = Math.min(1, (now - start) / 500), e = 1 - Math.pow(1 - t, 3);
      shownStats = from.map(function (f, i) { return f + (target[i] - f) * e; });
      $('#spider-shape').setAttribute('points', shownStats.map(function (v, i) { return point(i, v / 100).join(','); }).join(' '));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
  function setPilot(i, focus) {
    pilotIndex = (i + PILOTS.length) % PILOTS.length;
    var p = PILOTS[pilotIndex];
    $$('.pilot', roster).forEach(function (b, n) {
      var on = n === pilotIndex;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    var d = $('#dossier');
    d.style.setProperty('--pc', p.color);
    $('#d-portrait').innerHTML = HELMET;
    $('#d-call').textContent = 'CALLSIGN // ' + p.call;
    $('#d-name').textContent = p.name;
    $('#d-bio').textContent = p.bio;
    $('#spider-text').textContent = AXES.map(function (k) { return k + ' ' + p.stats[k]; }).join(', ');
    $('#spider-desc').textContent = p.call + ' attributes: ' + $('#spider-text').textContent;
    animateShape(AXES.map(function (k) { return p.stats[k]; }));
    d.classList.remove('is-swap'); void d.offsetWidth; d.classList.add('is-swap');
    tone(480 + pilotIndex * 80, 0.06);
  }

  /* ======================= Rankings ======================= */
  function renderRanks() {
    $('#r-body').innerHTML = RANKS[board].slice().sort(function (a, b) { return b[3] - a[3]; }).map(function (r, i) {
      var chevrons = '';
      for (var c = 0; c < r[4]; c++) chevrons += '<i></i>';
      return '<tr class="' + (r[0] === PLAYER_NAME ? 'is-you' : '') + '" style="animation-delay:' + (i * 0.04) + 's">' +
        '<td class="pos">' + String(i + 1).padStart(2, '0') + '</td>' +
        '<td><span class="pilot-cell"><span class="insignia" aria-hidden="true">' + chevrons + '</span>' + r[0] + '<span class="visually-hidden">, rank tier ' + r[4] + (r[0] === PLAYER_NAME ? ', you' : '') + '</span></span></td>' +
        '<td class="col-kd">' + r[1].toFixed(1) + '</td><td class="col-ops">' + r[2] + '</td><td class="rating">' + r[3].toLocaleString('en-US') + '</td></tr>';
    }).join('');
  }

  /* ======================= Init ======================= */
  fillForm();
  selectMission(selected);
  setPilot(0);
  renderRanks();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent, force: true });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
