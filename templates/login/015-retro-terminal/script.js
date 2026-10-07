/* ==========================================================================
   MAINFRAME/77 — Retro Terminal Login Template
   Vanilla JS: boot sequence, navigation + function keys, validation,
   ASCII strength meter, working command line, phosphor color switcher.
   Replace `fakeRequest` with your real API.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Content you can edit ---------- */
  var SYSTEM_NAME = 'MAINFRAME/77';
  var BOOT_LINES = [
    'MF-77 BIOS v4.12  (c) 1977-2077 Mainframe Systems',
    'CPU0 ........................ OK',
    'MEMORY TEST  65536K .......... OK',
    'MOUNTING /dev/vault0 ......... OK',
    'LOADING secure-shell ......... OK',
    'ESTABLISHING LINK ............ OK',
    '',
    'READY.'
  ];
  var PHOSPHORS = ['green', 'amber', 'ice'];

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var screens = $$('[data-screen]');
  var toastEl = $('.toast');
  var toastTimer, resendInterval;
  var PREFS_KEY = 'mainframe77-phosphor';
  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* ======================= Boot + clock ======================= */
  $('#boot').textContent = BOOT_LINES.join('\n');
  var clock = $('#clock');
  function tick() { var d = new Date(); clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  tick();
  setInterval(tick, 1000);
  var last = new Date(Date.now() - 1000 * 60 * 60 * 26);
  $('#last-login').textContent = last.toDateString().toUpperCase() + ' ' + pad(last.getHours()) + ':' + pad(last.getMinutes());

  /* ======================= Phosphor color (F4) ======================= */
  var phosphor = 'green';
  try { var saved = localStorage.getItem(PREFS_KEY); if (PHOSPHORS.indexOf(saved) > -1) phosphor = saved; } catch (e) { /* ignore */ }
  var phosphorLabel = $('#phosphor-label');
  function setPhosphor(name) {
    if (PHOSPHORS.indexOf(name) < 0) return false;
    phosphor = name;
    root.setAttribute('data-phosphor', name);
    phosphorLabel.textContent = 'PHOSPHOR: ' + name.toUpperCase();
    try { localStorage.setItem(PREFS_KEY, name); } catch (e) { /* ignore */ }
    return true;
  }
  function cyclePhosphor() { setPhosphor(PHOSPHORS[(PHOSPHORS.indexOf(phosphor) + 1) % PHOSPHORS.length]); }
  $('#phosphor').addEventListener('click', cyclePhosphor);
  setPhosphor(phosphor);

  /* ======================= Navigation ======================= */
  var fkeys = $$('.fkeys [data-goto]');
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    fkeys.forEach(function (b) {
      var on = b.getAttribute('data-goto') === id;
      b.classList.toggle('is-current', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (!opts.silent) {
      var h = target.querySelector('h1');
      if (h) h.focus({ preventScroll: true });
      if (target.getBoundingClientRect().top < 0) target.scrollIntoView({ block: 'start' });
    }
    if (id === 'sent') startResendTimer();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-goto]');
    if (!t) return;
    e.preventDefault();
    showScreen(t.getAttribute('data-goto'));
  });
  var FKEYS = { F1: 'login', F2: 'signup', F3: 'forgot' };
  document.addEventListener('keydown', function (e) {
    if (FKEYS[e.key]) { e.preventDefault(); showScreen(FKEYS[e.key]); }
    else if (e.key === 'F4') { e.preventDefault(); cyclePhosphor(); }
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
      btn.textContent = show ? '[hide]' : '[show]';
    });
  });
  var pw = $('#signup-password'), meter = $('#signup-strength');
  function updateMeter() {
    var v = pw.value, score = 0;
    if (v.length >= 8) score += 30;
    if (v.length >= 12) score += 10;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 20;
    if (/\d/.test(v)) score += 20;
    if (/[^A-Za-z0-9]/.test(v)) score += 20;
    if (v && score < 10) score = 10;
    var bars = Math.round(score / 10);
    var word = !v ? 'EMPTY' : score < 40 ? 'WEAK' : score < 70 ? 'OK' : score < 90 ? 'STRONG' : 'MAXIMUM';
    meter.textContent = 'strength [' + '#'.repeat(bars) + '-'.repeat(10 - bars) + '] ' + String(score).padStart(3, ' ') + '% ' + word;
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
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'policy not accepted');
    var v = input.value.trim();
    if (!v) return setError(input, 'field required');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'invalid address format');
    if (input.minLength > 0 && v.length < input.minLength) return setError(input, 'minimum ' + input.minLength + ' characters');
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
      fakeRequest(1000).then(function () { btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); handler(form); });
    });
  }
  onSubmit('login-form', function () { toast('ACCESS GRANTED. Welcome back, operator. (demo)'); });
  onSubmit('signup-form', function (form) {
    toast('Operator "' + form.elements.username.value.trim() + '" created. (demo)');
    form.reset();
    updateMeter();
  });
  onSubmit('forgot-form', function (form) {
    var email = form.elements.email.value.trim();
    $('.sent-email').textContent = email;
    var token = Math.random().toString(16).slice(2, 10).toUpperCase();
    $('#sent-log').textContent = [
      '> lookup ' + email + ' ......... [ OK ]',
      '> generating token 0x' + token + ' .. [ OK ]',
      '> queueing mail ................ [ OK ]',
      '> transmission complete.'
    ].join('\n');
    showScreen('sent');
  });

  /* ======================= Resend countdown ======================= */
  var resendBtn = $('#resend');
  function startResendTimer() {
    var s = 30;
    clearInterval(resendInterval);
    resendBtn.disabled = true;
    resendBtn.innerHTML = 'resend available in <span id="resend-timer">' + s + '</span>s';
    resendInterval = setInterval(function () {
      s--;
      if (s <= 0) { clearInterval(resendInterval); resendBtn.disabled = false; resendBtn.textContent = '> resend token'; return; }
      $('#resend-timer').textContent = s;
    }, 1000);
  }
  resendBtn.addEventListener('click', function () { toast('Token re-sent. (demo)'); startResendTimer(); });

  // Demo policy link: link it to your real page and delete this.
  $('a[href="#terms"]').addEventListener('click', function (e) { e.preventDefault(); toast('Link this to your acceptable use policy.'); });

  /* ======================= Command line ======================= */
  var cmdForm = $('#cmd-form'), cmdInput = $('#cmd'), cmdOut = $('#cmd-out');
  var history_ = [], histPos = 0;
  var COMMANDS = {
    help: function () {
      return [
        'available commands:',
        '  login          sign in (F1)',
        '  register       new account (F2)',
        '  reset          recover password (F3)',
        '  theme <color>  green|amber|ice (F4)',
        '  whoami  date  clear  help'
      ].join('\n');
    },
    login: function () { showScreen('login'); return 'opening secure access...'; },
    register: function () { showScreen('signup'); return 'launching useradd...'; },
    reset: function () { showScreen('forgot'); return 'launching passwd --reset...'; },
    theme: function (arg) {
      if (!arg) return 'current phosphor: ' + phosphor + '. usage: theme green|amber|ice';
      return setPhosphor(arg) ? 'phosphor set to ' + arg : 'theme: unknown color "' + arg + '"';
    },
    whoami: function () { return 'guest (unauthenticated) on ' + SYSTEM_NAME; },
    date: function () { return new Date().toString(); },
    clear: function () { return ''; }
  };
  COMMANDS.signup = COMMANDS.register;
  COMMANDS.forgot = COMMANDS.reset;
  COMMANDS.ls = function () { return 'permission denied: authenticate first'; };
  COMMANDS.sudo = function () { return 'nice try. this incident will be reported.'; };

  cmdForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var raw = cmdInput.value.trim();
    cmdInput.value = '';
    if (!raw) return;
    history_.push(raw);
    histPos = history_.length;
    var parts = raw.toLowerCase().split(/\s+/), fn = COMMANDS[parts[0]];
    var out = fn ? fn(parts[1]) : parts[0] + ': command not found. type "help".';
    cmdOut.textContent = parts[0] === 'clear' ? '' : '$ ' + raw + '\n' + out;
    // Keep focus on the prompt so the user can keep typing commands.
    cmdInput.focus({ preventScroll: true });
  });
  cmdInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && histPos > 0) { e.preventDefault(); cmdInput.value = history_[--histPos]; }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histPos = Math.min(history_.length, histPos + 1);
      cmdInput.value = history_[histPos] || '';
    }
  });

  /* ======================= Init ======================= */
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    showScreen(el && el.hasAttribute('data-screen') ? id : 'login', { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
