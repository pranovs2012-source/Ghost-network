/* ==========================================================================
   FOLD — Paper & Origami Login Template
   Vanilla JS: unfolding navigation, validation, fold-the-crane password meter,
   paper color picker (remembered) and a paper plane on sign in.
   Replace `fakeRequest` with your real API.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Content you can edit ---------- */
  // One label per crane piece folded by the password meter (5 pieces).
  var FOLD_STEPS = ['first crease', 'body folded', 'neck folded', 'tail folded', 'wings out — a perfect crane!'];

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var screens = $$('[data-screen]');
  var sheet = $('#sheet');
  var toastEl = $('.toast');
  var toastTimer, resendInterval;
  var PREFS_KEY = 'fold-paper';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================= Paper color ======================= */
  var papers = $$('input[name="paper"]');
  function setPaper(name) {
    root.setAttribute('data-paper', name);
    papers.forEach(function (p) { p.checked = p.value === name; });
    try { localStorage.setItem(PREFS_KEY, name); } catch (e) { /* ignore */ }
  }
  papers.forEach(function (p) { p.addEventListener('change', function () { setPaper(p.value); }); });
  try {
    var saved = localStorage.getItem(PREFS_KEY);
    if (saved && papers.some(function (p) { return p.value === saved; })) setPaper(saved);
  } catch (e) { /* ignore */ }

  /* ======================= Navigation ======================= */
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (!opts.silent) {
      var h = target.querySelector('h1');
      if (h) h.focus({ preventScroll: true });
      var top = sheet.getBoundingClientRect().top;
      if (top < 0) sheet.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
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
      btn.textContent = show ? 'Hide' : 'Show';
    });
  });
  var pw = $('#signup-password'), pieces = $$('#fold-crane polygon'), foldCrane = $('#fold-crane'), meterText = $('#signup-strength');
  function updateMeter() {
    var v = pw.value, score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (v && !score) score = 1;
    var folded = v ? Math.max(1, score) : 0;
    pieces.forEach(function (p, i) { p.classList.toggle('is-folded', i < folded); });
    foldCrane.classList.toggle('has-folds', folded > 0);
    meterText.textContent = 'Strength: ' + (folded ? folded + ' of 5 folds, ' + FOLD_STEPS[folded - 1] : 'not folded yet');
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
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'Please accept the terms to continue.');
    var v = input.value.trim();
    if (!v) return setError(input, 'This field is required.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'Please enter a valid email address.');
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

  /* ======================= Paper plane ======================= */
  var plane = $('#plane-fly');
  function launchPlane(fromEl) {
    if (reduceMotion) return;
    var r = fromEl.getBoundingClientRect();
    plane.style.setProperty('--x0', (r.left + r.width / 2 - 23) + 'px');
    plane.style.setProperty('--y0', (r.top + r.height / 2 - 23) + 'px');
    plane.classList.remove('is-flying'); void plane.getBoundingClientRect(); plane.classList.add('is-flying');
  }

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
      fakeRequest(1000).then(function () { btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); handler(form, btn); });
    });
  }
  onSubmit('login-form', function (form, btn) { launchPlane(btn); toast('Signed in — your desk is ready. (demo)'); });
  onSubmit('signup-form', function (form) {
    toast('Welcome, ' + form.elements.name.value.trim().split(' ')[0] + '! Your fresh sheet is ready. (demo)');
    form.reset();
    updateMeter();
  });
  onSubmit('forgot-form', function (form, btn) { launchPlane(btn); $('.sent-email').textContent = form.elements.email.value.trim(); showScreen('sent'); });
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
  resendBtn.addEventListener('click', function () { launchPlane(resendBtn); toast('Another plane is on its way. (demo)'); startResendTimer(); });

  /* ======================= Init ======================= */
  updateMeter();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    showScreen(el && el.hasAttribute('data-screen') ? id : 'login', { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
