/* ==========================================================================
   Raster — Swiss Minimal Login Template
   Vanilla JS: screen navigation, poster headline, validation, password rules,
   light/dark theme, clock. Replace `fakeRequest` with your real API calls.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var screens = Array.prototype.slice.call(document.querySelectorAll('[data-screen]'));
  var headline = document.getElementById('headline');
  var toastEl = document.querySelector('.toast');
  var toastTimer, resendInterval;

  /* Poster headline per screen (two lines each) */
  var HEADLINES = {
    login: ['Sign', 'in.'],
    signup: ['Join', 'us.'],
    forgot: ['Re', 'set.'],
    sent: ['Sent', '✓']
  };

  /* ---------- Navigation ---------- */
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) {
      var on = s === target;
      s.hidden = !on;
      s.classList.toggle('is-active', on);
    });
    document.body.setAttribute('data-screen-current', id);
    document.querySelectorAll('.step').forEach(function (step) {
      var on = step.getAttribute('data-step') === id;
      step.classList.toggle('is-current', on);
      if (on) step.setAttribute('aria-current', 'page'); else step.removeAttribute('aria-current');
    });
    var words = HEADLINES[id] || HEADLINES.login;
    headline.innerHTML = '<span>' + words[0] + '</span><span>' + words[1] + '</span>';
    headline.classList.remove('is-changing');
    void headline.offsetWidth;
    headline.classList.add('is-changing');
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (!opts.silent) {
      var h = target.querySelector('h1');
      if (h) h.focus({ preventScroll: true });
      // On stacked (mobile) layouts, bring the new screen into view if it starts off-screen
      var top = target.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * .6) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    if (id === 'sent') startResendTimer();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-goto]');
    if (!t) return;
    e.preventDefault();
    showScreen(t.getAttribute('data-goto'));
  });

  /* ---------- Toast ---------- */
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3000);
  }

  /* ---------- Theme toggle (remembers choice, defaults to system preference) ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
    themeBtn.querySelector('.theme-toggle__label').textContent = theme === 'dark' ? 'Light' : 'Dark';
    themeBtn.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme');
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('raster-theme'); } catch (e) { /* storage blocked */ }
  setTheme(savedTheme || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('raster-theme', next); } catch (e) { /* ignore */ }
  });

  /* ---------- Clock ---------- */
  var clock = document.getElementById('clock');
  function tick() {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    clock.textContent = hh + ':' + mm;
    clock.setAttribute('datetime', hh + ':' + mm);
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Show / hide password ---------- */
  document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
    });
  });

  /* ---------- Password rules checklist ---------- */
  var RULES = {
    length: function (v) { return v.length >= 8; },
    case: function (v) { return /[a-z]/.test(v) && /[A-Z]/.test(v); },
    number: function (v) { return /\d/.test(v); },
    symbol: function (v) { return /[^A-Za-z0-9]/.test(v); }
  };
  var pw = document.getElementById('signup-password');
  function paintRules() {
    document.querySelectorAll('#rules li').forEach(function (li) {
      li.classList.toggle('is-met', RULES[li.getAttribute('data-rule')](pw.value));
    });
  }
  pw.addEventListener('input', paintRules);

  /* ---------- Validation ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function errorElFor(input) {
    return document.getElementById((input.id || input.form.id.replace('-form', '') + '-' + input.name) + '-error');
  }
  function setError(input, msg) {
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    var el = errorElFor(input);
    if (el) el.textContent = msg || '';
    return !msg;
  }
  function validateField(input) {
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'Please accept the terms.');
    var v = input.value.trim();
    if (!v) return setError(input, 'Required.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'That email looks incomplete.');
    if (input.minLength > 0 && v.length < input.minLength) return setError(input, 'Use at least ' + input.minLength + ' characters.');
    return setError(input, '');
  }
  function validateForm(form) {
    var first = null;
    form.querySelectorAll('input[required]').forEach(function (input) {
      if (!validateField(input) && !first) first = input;
    });
    if (first) {
      first.focus();
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    }
    return !first;
  }
  document.querySelectorAll('.form input[required]').forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value) validateField(input); });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
    input.addEventListener('change', function () { if (input.type === 'checkbox') validateField(input); });
  });

  /* ---------- Submits (demo) ---------- */
  function fakeRequest(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function handleSubmit(form, onSuccess) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      var btn = form.querySelector('[type="submit"]');
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      fakeRequest(1100).then(function () {
        btn.classList.remove('is-loading');
        btn.removeAttribute('aria-busy');
        onSuccess(form);
      });
    });
  }
  handleSubmit(document.getElementById('login-form'), function () { toast('Signed in. Welcome back. (demo)'); });
  handleSubmit(document.getElementById('signup-form'), function (form) {
    toast('Account created for ' + form.elements.first.value.trim() + '. (demo)');
    form.reset();
    paintRules();
  });
  handleSubmit(document.getElementById('forgot-form'), function (form) {
    document.querySelector('.sent-email').textContent = form.elements.email.value.trim();
    showScreen('sent');
  });

  /* ---------- Resend countdown ---------- */
  var resendBtn = document.getElementById('resend');
  function startResendTimer() {
    var s = 30;
    clearInterval(resendInterval);
    resendBtn.disabled = true;
    resendBtn.innerHTML = 'Resend available in <span id="resend-timer">' + s + '</span>s';
    var bar = document.querySelector('.countdown__bar');
    bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    resendInterval = setInterval(function () {
      s--;
      if (s <= 0) {
        clearInterval(resendInterval);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend the link';
        return;
      }
      document.getElementById('resend-timer').textContent = s;
    }, 1000);
  }
  resendBtn.addEventListener('click', function () { toast('New link sent. (demo)'); startResendTimer(); });

  /* ---------- Initial route ---------- */
  function routeFromHash(silent) {
    var id = location.hash.slice(1);
    var el = id && document.getElementById(id);
    showScreen(el && el.hasAttribute('data-screen') ? id : 'login', { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { routeFromHash(false); });
  routeFromHash(true);
})();
