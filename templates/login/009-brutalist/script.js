/* ==========================================================================
   SYSTEM/LOGIN — Brutalist Login Template
   Vanilla JS: screen navigation, validation, caps lock warning, username
   availability check, password rules, attempt counter, invert mode.
   Replace `fakeRequest` / `TAKEN_USERNAMES` with your real API.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var screens = $$('[data-screen]');
  var toastEl = $('.toast');
  var toastTimer, resendInterval;

  var BIG_WORDS = { login: 'LOG<br>IN.', signup: 'JOIN<br>NOW.', forgot: 'RE<br>SET.', sent: 'DONE<br>✓' };
  var TAKEN_USERNAMES = ['admin', 'root', 'system', 'user', 'test', 'login'];
  var MAX_ATTEMPTS = 5;

  /* ---------- Navigation ---------- */
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    var big = $('#big-word');
    big.innerHTML = BIG_WORDS[id] || BIG_WORDS.login;
    big.classList.remove('is-swap'); void big.offsetWidth; big.classList.add('is-swap');
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (!opts.silent) { var h = target.querySelector('h1'); if (h) h.focus({ preventScroll: true });
      // On stacked (mobile) layouts, bring the new screen into view if it starts off-screen
      var top = target.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * .6) target.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
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

  /* ---------- Invert mode (remembered) ---------- */
  var invertBtn = $('#invert');
  function setMode(mode) {
    root.setAttribute('data-mode', mode);
    invertBtn.setAttribute('aria-pressed', String(mode === 'inverted'));
  }
  try { setMode(localStorage.getItem('system-login-mode') || 'normal'); } catch (e) { setMode('normal'); }
  invertBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-mode') === 'inverted' ? 'normal' : 'inverted';
    setMode(next);
    try { localStorage.setItem('system-login-mode', next); } catch (e) { /* ignore */ }
  });

  /* ---------- Show / hide password ---------- */
  $$('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
    });
  });

  /* ---------- Caps Lock warning ---------- */
  $$('[data-caps]').forEach(function (input) {
    var out = document.getElementById(input.getAttribute('data-caps'));
    function check(e) {
      if (!e.getModifierState) return;
      out.textContent = e.getModifierState('CapsLock') ? 'CAPS LOCK IS ON' : '';
    }
    input.addEventListener('keydown', check);
    input.addEventListener('keyup', check);
    input.addEventListener('blur', function () { out.textContent = ''; });
  });

  /* ---------- Username availability (debounced) ---------- */
  var username = $('#signup-username');
  var status = $('#signup-username-status');
  var usernameOk = false, checkTimer;
  username.addEventListener('input', function () {
    username.value = username.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    var v = username.value;
    clearTimeout(checkTimer);
    status.className = 'status mono';
    usernameOk = false;
    if (v.length < 3) { status.textContent = 'Lowercase letters, numbers, underscores. 3+ chars.'; return; }
    status.textContent = 'CHECKING ' + v.toUpperCase() + ' ...';
    checkTimer = setTimeout(function () {
      usernameOk = TAKEN_USERNAMES.indexOf(v) === -1;
      status.textContent = usernameOk ? '✓ ' + v.toUpperCase() + ' IS AVAILABLE' : '✗ ' + v.toUpperCase() + ' IS TAKEN';
      status.classList.add(usernameOk ? 'is-ok' : 'is-bad');
    }, 450);
  });

  /* ---------- Password rules ---------- */
  var RULES = {
    length: function (v) { return v.length >= 8; },
    number: function (v) { return /\d/.test(v); },
    mixed: function (v) { return /[a-z]/.test(v) && /[A-Z]/.test(v); }
  };
  var pw = $('#signup-password');
  pw.addEventListener('input', function () {
    $$('#signup-rules li').forEach(function (li) {
      var met = RULES[li.getAttribute('data-rule')](pw.value);
      li.classList.toggle('is-met', met);
      li.querySelector('.mark').textContent = met ? '[✓]' : '[ ]';
    });
  });

  /* ---------- Validation ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function errorEl(input) { return document.getElementById((input.id || input.form.id.replace('-form', '') + '-' + input.name) + '-error'); }
  function setError(input, msg) {
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    var el = errorEl(input);
    if (el) el.textContent = msg || '';
    return !msg;
  }
  function validateField(input) {
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'Tick the box.');
    var v = input.value.trim();
    if (!v) return setError(input, 'Required.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'Not an email.');
    if (input.minLength > 0 && v.length < input.minLength) return setError(input, 'Min ' + input.minLength + ' characters.');
    if (input === username && TAKEN_USERNAMES.indexOf(v) !== -1) return setError(input, 'Username taken.');
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

  /* ---------- Submits (demo) ---------- */
  function fakeRequest(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function onSubmit(id, handler) {
    var form = document.getElementById(id);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) { if (id === 'login-form') countAttempt(); return; }
      var btn = form.querySelector('[type="submit"]');
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      fakeRequest(900).then(function () {
        btn.classList.remove('is-loading');
        btn.removeAttribute('aria-busy');
        handler(form);
      });
    });
  }

  var attempts = 0;
  function countAttempt() {
    attempts = Math.min(MAX_ATTEMPTS, attempts + 1);
    $('#attempts').textContent = 'ATTEMPT ' + attempts + '/' + MAX_ATTEMPTS;
  }

  onSubmit('login-form', function () {
    countAttempt();
    toast('Signed in. Welcome back. (demo)');
    attempts = 0;
  });
  onSubmit('signup-form', function (form) {
    toast('Account @' + form.elements.username.value + ' created. (demo)');
    form.reset();
    status.className = 'status mono';
    status.textContent = 'Lowercase letters, numbers, underscores.';
    pw.dispatchEvent(new Event('input'));
  });
  onSubmit('forgot-form', function (form) {
    $('.sent-email').textContent = form.elements.email.value.trim();
    showScreen('sent');
  });

  /* ---------- Resend countdown ---------- */
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
  resendBtn.addEventListener('click', function () { toast('Sent again. (demo)'); startResendTimer(); });

  /* ---------- Initial route ---------- */
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
