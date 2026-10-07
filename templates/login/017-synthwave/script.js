/* ==========================================================================
   NIGHTDRIVE — Synthwave Login Template
   Vanilla JS: navigation with VHS glitch, validation, equalizer password meter,
   palette switch, VCR clock and a cassette deck that plays a synthesized
   synthwave loop (Web Audio API — no audio files).
   Replace `fakeRequest` with your real API.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Content you can edit ---------- */
  // Chords are MIDI note numbers (57 = A3). One chord per bar.
  var TRACKS = [
    { name: 'Neon Horizon', bpm: 104, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] },
    { name: 'Palm Boulevard', bpm: 96, chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]] },
    { name: 'Midnight Arcade', bpm: 118, chords: [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]] }
  ];
  var PALETTES = ['sunset', 'midnight'];

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var screens = $$('[data-screen]');
  var card = $('#card');
  var toastEl = $('.toast');
  var toastTimer, resendInterval, glitchTimer;
  var PREFS_KEY = 'nightdrive-palette';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* ======================= Palette ======================= */
  var palette = 'sunset';
  try { var saved = localStorage.getItem(PREFS_KEY); if (PALETTES.indexOf(saved) > -1) palette = saved; } catch (e) { /* ignore */ }
  function setPalette(name) {
    palette = name;
    root.setAttribute('data-palette', name);
    $('#palette-name').textContent = name.charAt(0).toUpperCase() + name.slice(1);
    try { localStorage.setItem(PREFS_KEY, name); } catch (e) { /* ignore */ }
  }
  $('#palette').addEventListener('click', function () { setPalette(PALETTES[(PALETTES.indexOf(palette) + 1) % PALETTES.length]); });
  setPalette(palette);

  /* ======================= VCR clock ======================= */
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function vcr() {
    var d = new Date(), h = d.getHours();
    $('#vcr-time').textContent = (h < 12 ? 'AM ' : 'PM ') + pad(h % 12 || 12) + ':' + pad(d.getMinutes());
    $('#vcr-date').textContent = MONTHS[d.getMonth()] + ' ' + pad(d.getDate()) + ' 1986';
  }
  vcr();
  setInterval(vcr, 15000);

  /* ======================= Navigation ======================= */
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (!opts.silent) {
      if (!reduceMotion) {
        card.classList.remove('is-glitch'); void card.offsetWidth; card.classList.add('is-glitch');
        clearTimeout(glitchTimer);
        glitchTimer = setTimeout(function () { card.classList.remove('is-glitch'); }, 420);
      }
      var h = target.querySelector('h1');
      if (h) h.focus({ preventScroll: true });
      var top = card.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * .6) card.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (id === 'sent') startResendTimer();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-goto]');
    if (!t) return;
    e.preventDefault();
    showScreen(t.getAttribute('data-goto'));
  });
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3200);
  }

  /* ======================= Password tools ======================= */
  $$('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.querySelector('.visually-hidden').textContent = show ? 'Hide password' : 'Show password';
    });
  });
  var pw = $('#signup-password'), bars = $$('#meter span'), meterText = $('#signup-strength');
  var BAR_COLORS = ['#3ff5ff', '#3ff5ff', '#6fd8ff', '#9fbaff', '#c99bff', '#ee7df0', '#ff4fd8', '#ff6fb0', '#ff9a8a', '#ffb86b'];
  function updateMeter() {
    var v = pw.value, score = 0;
    if (v.length >= 8) score += 30;
    if (v.length >= 12) score += 10;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 20;
    if (/\d/.test(v)) score += 20;
    if (/[^A-Za-z0-9]/.test(v)) score += 20;
    if (v && score < 10) score = 10;
    var lit = Math.round(score / 10);
    bars.forEach(function (b, i) { b.classList.toggle('is-on', i < lit); b.style.setProperty('--c', BAR_COLORS[i]); });
    meterText.textContent = 'Strength: ' + (!v ? 'not set' : score < 40 ? 'weak' : score < 70 ? 'okay' : score < 90 ? 'strong' : 'maximum volume');
  }
  pw.addEventListener('input', updateMeter);

  /* ======================= Validation ======================= */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function errorEl(input) { return document.getElementById((input.id || input.form.id.replace('-form', '') + '-' + input.name) + '-error'); }
  function setError(input, msg) {
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    var el = errorEl(input);
    if (el) el.textContent = msg || '';
    return !msg;
  }
  function validateField(input) {
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'Please accept the club rules.');
    var v = input.value.trim();
    if (!v) return setError(input, 'This field is required.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'That email doesn’t look right.');
    if (input.minLength > 0 && v.length < input.minLength) return setError(input, 'Use at least ' + input.minLength + ' characters.');
    return setError(input, '');
  }
  function validateForm(form) {
    var first = null;
    $$('input[required]', form).forEach(function (input) { if (!validateField(input) && !first) first = input; });
    if (first) { first.focus(); form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
    return !first;
  }
  $$('.form input[required]').forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value) validateField(input); });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
    input.addEventListener('change', function () { if (input.type === 'checkbox') validateField(input); });
  });

  /* ======================= Submits (demo) ======================= */
  function fakeRequest(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function onSubmit(id, handler) {
    var form = document.getElementById(id);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      var btn = form.querySelector('[type="submit"]');
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      fakeRequest(1100).then(function () { btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); handler(form); });
    });
  }
  onSubmit('login-form', function () { toast('Engine started. Welcome back to the night. (demo)'); });
  onSubmit('signup-form', function (form) {
    toast('Pass printed for ' + form.elements.name.value.trim() + '. See you on the boulevard. (demo)');
    form.reset();
    updateMeter();
  });
  onSubmit('forgot-form', function (form) { $('.sent-email').textContent = form.elements.email.value.trim(); showScreen('sent'); });
  $('a[href="#terms"]').addEventListener('click', function (e) { e.preventDefault(); toast('Link this to your terms page.'); });

  /* ======================= Resend countdown ======================= */
  var resendBtn = $('#resend');
  function startResendTimer() {
    var s = 30;
    clearInterval(resendInterval);
    resendBtn.disabled = true;
    resendBtn.innerHTML = 'Resend in <span id="resend-timer">' + s + '</span>s';
    resendInterval = setInterval(function () {
      s--;
      if (s <= 0) { clearInterval(resendInterval); resendBtn.disabled = false; resendBtn.textContent = 'Resend link'; return; }
      $('#resend-timer').textContent = s;
    }, 1000);
  }
  resendBtn.addEventListener('click', function () { toast('Another link is on its way. (demo)'); startResendTimer(); });

  /* ======================= Cassette deck (Web Audio synth) ======================= */
  var deck = $('.deck'), playBtn = $('#play'), counterEl = $('#counter');
  var track = 0, playing = false, actx = null, master = null, noiseBuf = null;
  var schedTimer = null, counterTimer = null, nextTime = 0, step = 0, counter = 0;

  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function setupAudio() {
    if (actx) return;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = .22;
    master.connect(actx.destination);
    noiseBuf = actx.createBuffer(1, actx.sampleRate * .3, actx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function voice(type, f, t, len, vol, cutoff, attack) {
    var o = actx.createOscillator(), flt = actx.createBiquadFilter(), g = actx.createGain();
    o.type = type; o.frequency.value = f;
    flt.type = 'lowpass'; flt.frequency.value = cutoff;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (attack || .005));
    g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(flt).connect(g).connect(master);
    o.start(t); o.stop(t + len + .05);
    return o;
  }
  function kick(t) {
    var o = actx.createOscillator(), g = actx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .14);
    g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
    o.connect(g).connect(master); o.start(t); o.stop(t + .22);
  }
  function snare(t) {
    var s = actx.createBufferSource(), flt = actx.createBiquadFilter(), g = actx.createGain();
    s.buffer = noiseBuf; flt.type = 'highpass'; flt.frequency.value = 1400;
    g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16);
    s.connect(flt).connect(g).connect(master); s.start(t); s.stop(t + .18);
  }
  function schedule(n, t) {
    var tr = TRACKS[track], sixteenth = 60 / tr.bpm / 4;
    var chord = tr.chords[Math.floor(n / 16) % tr.chords.length], s = n % 16;
    var arp = [0, 1, 2, 3, 2, 1][s % 6], note = arp === 3 ? chord[0] + 12 : chord[arp];
    voice('square', freq(note + 12), t, sixteenth * 1.6, .045, 2600);
    if (s % 2 === 0) voice('sawtooth', freq(chord[0] - 12 + (s % 4 === 2 ? 12 : 0)), t, sixteenth * 1.8, .09, 520);
    if (s === 0) chord.forEach(function (m) {
      [-6, 6].forEach(function (detune) {
        var o = voice('sawtooth', freq(m), t, sixteenth * 16, .018, 1100, .35);
        o.detune.value = detune;
      });
    });
    if (s % 4 === 0) kick(t);
    if (s === 4 || s === 12) snare(t);
  }
  function scheduler() {
    while (nextTime < actx.currentTime + .12) {
      schedule(step, nextTime);
      nextTime += 60 / TRACKS[track].bpm / 4;
      step++;
    }
  }
  function setTrack(i) {
    track = (i + TRACKS.length) % TRACKS.length;
    $('#track-name').textContent = pad(track + 1) + ' · ' + TRACKS[track].name;
    $('#cassette-title').textContent = TRACKS[track].name.toUpperCase();
    step = 0;
  }
  function setPlaying(on) {
    playing = on;
    deck.classList.toggle('is-playing', on);
    playBtn.setAttribute('aria-pressed', String(on));
    playBtn.querySelector('.visually-hidden').textContent = on ? 'Pause music' : 'Play music';
    clearInterval(schedTimer); clearInterval(counterTimer);
    if (on) {
      try {
        setupAudio();
        if (actx.state === 'suspended') actx.resume();
        nextTime = actx.currentTime + .05;
        schedTimer = setInterval(scheduler, 25);
      } catch (e) { toast('Audio is not available in this browser.'); }
      counterTimer = setInterval(function () { counter = (counter + 1) % 1000; counterEl.textContent = String(counter).padStart(3, '0'); }, 700);
    }
  }
  playBtn.addEventListener('click', function () { setPlaying(!playing); });
  $('#next-track').addEventListener('click', function () { setTrack(track + 1); });
  $('#prev-track').addEventListener('click', function () { setTrack(track - 1); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && playing) setPlaying(false); });
  setTrack(0);

  /* ======================= Init ======================= */
  updateMeter();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    showScreen(el && el.hasAttribute('data-screen') ? id : 'login', { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
