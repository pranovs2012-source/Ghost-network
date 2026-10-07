/* ==========================================================================
   Hush — Neumorphism (Soft UI) Login Template
   Vanilla JS: navigation + segmented control, validation, passkey demo,
   strength ring, accent color + dark mode (remembered).
   Replace `fakeRequest` (and the passkey demo) with your real API.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var screens = $$('[data-screen]');
  var toastEl = $('.toast');
  var toastTimer, resendInterval;
  var PREFS_KEY = 'hush-appearance';

  /* ======================= Appearance (accent + dark mode) ======================= */
  var prefs = { mode: null, accent: 'indigo' };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) { /* ignore */ }
  if (!prefs.mode) prefs.mode = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } }
  var modeBtn = $('#mode-toggle');
  function applyPrefs() {
    root.setAttribute('data-mode', prefs.mode);
    root.setAttribute('data-accent', prefs.accent);
    modeBtn.setAttribute('aria-pressed', String(prefs.mode === 'dark'));
    $$('.swatch').forEach(function (s) {
      var on = s.getAttribute('data-accent') === prefs.accent;
      s.setAttribute('aria-checked', String(on));
      s.tabIndex = on ? 0 : -1;
    });
  }
  modeBtn.addEventListener('click', function () { prefs.mode = prefs.mode === 'dark' ? 'light' : 'dark'; applyPrefs(); savePrefs(); });
  var swatches = $$('.swatch');
  swatches.forEach(function (s, i) {
    s.addEventListener('click', function () { prefs.accent = s.getAttribute('data-accent'); applyPrefs(); savePrefs(); });
    s.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = swatches[(i + d + swatches.length) % swatches.length];
      n.focus(); n.click();
    });
  });
  applyPrefs();

  /* ======================= Navigation ======================= */
  var segment = $('.segment');
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    var seg = id === 'login' || id === 'signup' ? id : 'none';
    segment.setAttribute('data-at', seg);
    $$('.segment__btn').forEach(function (b) {
      var on = b.getAttribute('data-seg') === id;
      b.classList.toggle('is-current', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (!opts.silent) { var h = target.querySelector('h1'); if (h) h.focus({ preventScroll: true }); }
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
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3000);
  }

  /* ======================= Password tools ======================= */
  $$('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });
  var pw = $('#signup-password'), ringFill = $('#ring-fill'), ringNum = $('#ring-num'), ringText = $('#ring-text');
  var CIRC = 2 * Math.PI * 18;
  pw.addEventListener('input', function () {
    var v = pw.value, score = 0;
    if (v.length >= 8) score += 25;
    if (v.length >= 12) score += 15;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 20;
    if (/\d/.test(v)) score += 20;
    if (/[^A-Za-z0-9]/.test(v)) score += 20;
    if (!v) score = 0;
    ringFill.style.strokeDashoffset = CIRC * (1 - score / 100);
    ringNum.textContent = score;
    ringText.textContent = 'Strength: ' + (!v ? 'not set' : score < 40 ? 'weak' : score < 70 ? 'okay' : score < 90 ? 'strong' : 'excellent') + (v ? ' (' + score + '/100)' : '');
  });

  /* ======================= Passkey (demo) ======================= */
  var passkey = $('#passkey'), passSub = $('#passkey-sub');
  passkey.addEventListener('click', function () {
    if (passkey.classList.contains('is-scanning')) return;
    passkey.classList.remove('is-done');
    passkey.classList.add('is-scanning');
    passkey.setAttribute('aria-busy', 'true');
    passSub.textContent = 'Waiting for your device…';
    // Real apps call navigator.credentials.get({ publicKey: ... }) here.
    setTimeout(function () {
      passkey.classList.remove('is-scanning');
      passkey.classList.add('is-done');
      passkey.removeAttribute('aria-busy');
      passSub.textContent = 'Verified';
      toast('Signed in with your passkey (demo)');
      setTimeout(function () { passkey.classList.remove('is-done'); passSub.textContent = 'Face, fingerprint or device PIN'; }, 2500);
    }, 1800);
  });

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
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'Please accept the terms.');
    var v = input.value.trim();
    if (!v) return setError(input, 'Please fill this in.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'Enter a valid email address.');
    if (input.minLength > 0 && v.length < input.minLength) return setError(input, 'At least ' + input.minLength + ' characters, please.');
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
  onSubmit('login-form', function () { toast('Signed in. Breathe out. (demo)'); });
  onSubmit('signup-form', function (form) { toast('Welcome to Hush, ' + form.elements.name.value.trim().split(' ')[0] + ' (demo)'); form.reset(); pw.dispatchEvent(new Event('input')); });
  onSubmit('forgot-form', function (form) { $('.sent-email').textContent = form.elements.email.value.trim(); showScreen('sent'); });

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
  resendBtn.addEventListener('click', function () { toast('Another link sent (demo)'); startResendTimer(); });

  /* ======================= Init ======================= */
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    showScreen(el && el.hasAttribute('data-screen') ? id : 'login', { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
