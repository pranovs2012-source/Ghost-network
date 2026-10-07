/* ==========================================================================
   Aurum Private — Dark Luxury Login Template
   Vanilla JS: screen navigation, floating-label validation, two-step code entry,
   password meter, gold dust. Replace `fakeRequest` with your real API calls.
   ========================================================================== */
(function () {
  'use strict';

  var screens = Array.prototype.slice.call(document.querySelectorAll('[data-screen]'));
  var toastEl = document.querySelector('.toast');
  var toastTimer, resendInterval;
  var DEMO_CODE_HINT = 'Demo: any 6 digits work';

  /* ---------- Gold dust particles ---------- */
  var dust = document.getElementById('dust');
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    for (var i = 0; i < 28; i++) {
      var p = document.createElement('span');
      p.style.left = (Math.random() * 100) + '%';
      p.style.animationDuration = (12 + Math.random() * 16) + 's';
      p.style.animationDelay = (-Math.random() * 28) + 's';
      p.style.setProperty('--sway', (Math.random() * 80 - 40) + 'px');
      var size = (1 + Math.random() * 2.5).toFixed(1) + 'px';
      p.style.width = size;
      p.style.height = size;
      dust.appendChild(p);
    }
  }

  /* ---------- Navigation ---------- */
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (!opts.silent) {
      var h = target.querySelector('h1');
      if (h) h.focus({ preventScroll: true });
    }
    if (id === 'sent') startResendTimer();
    if (id === 'verify') resetOtp();
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

  /* ---------- Password meter ---------- */
  var pw = document.getElementById('signup-password');
  var fill = document.getElementById('meter-fill');
  var strengthText = document.getElementById('signup-strength');
  pw.addEventListener('input', function () {
    var v = pw.value, score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    fill.style.width = (score / 5 * 100) + '%';
    strengthText.textContent = !v ? 'At least 8 characters.' : ['Too short', 'Modest', 'Respectable', 'Strong', 'Excellent', 'Impeccable'][score];
  });

  /* ---------- Validation ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function errorEl(input) {
    return document.getElementById((input.id || input.form.id.replace('-form', '') + '-' + input.name) + '-error');
  }
  function setError(input, msg) {
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    var el = errorEl(input);
    if (el) el.textContent = msg || '';
    return !msg;
  }
  function validateField(input) {
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'Please accept the House Rules.');
    var v = input.value.trim();
    if (!v) return setError(input, 'This field is required.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'Please enter a valid email address.');
    if (input.minLength > 0 && v.length < input.minLength) return setError(input, 'Please use at least ' + input.minLength + ' characters.');
    return setError(input, '');
  }
  function validateForm(form) {
    var first = null;
    form.querySelectorAll('input[required]').forEach(function (input) { if (!validateField(input) && !first) first = input; });
    if (first) { first.focus(); shake(form); }
    return !first;
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  document.querySelectorAll('.form input[required]').forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value) validateField(input); });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
    input.addEventListener('change', function () { if (input.type === 'checkbox') validateField(input); });
  });

  /* ---------- One-time code boxes ---------- */
  var otp = document.querySelector('.otp');
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.otp__box'));
  var otpError = document.getElementById('otp-error');
  function resetOtp() {
    boxes.forEach(function (b) { b.value = ''; b.classList.remove('is-filled'); });
    otp.classList.remove('is-invalid');
    otpError.textContent = '';
  }
  boxes.forEach(function (box, i) {
    box.addEventListener('input', function () {
      box.value = box.value.replace(/\D/g, '').slice(-1);
      box.classList.toggle('is-filled', !!box.value);
      if (box.value && boxes[i + 1]) boxes[i + 1].focus();
      if (boxes.every(function (b) { return b.value; })) document.getElementById('verify-form').requestSubmit();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !box.value && boxes[i - 1]) { boxes[i - 1].focus(); boxes[i - 1].value = ''; boxes[i - 1].classList.remove('is-filled'); }
      if (e.key === 'ArrowLeft' && boxes[i - 1]) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && boxes[i + 1]) boxes[i + 1].focus();
    });
    // Paste a whole code into any box
    box.addEventListener('paste', function (e) {
      var digits = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      if (!digits) return;
      e.preventDefault();
      boxes.forEach(function (b, n) { b.value = digits[n] || ''; b.classList.toggle('is-filled', !!b.value); });
      (boxes[digits.length] || boxes[5]).focus();
      if (digits.length === 6) document.getElementById('verify-form').requestSubmit();
    });
  });

  /* ---------- Submits (demo) ---------- */
  function fakeRequest(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function withLoading(form, ms) {
    var btn = form.querySelector('[type="submit"]');
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    return fakeRequest(ms).then(function () { btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); });
  }
  function onSubmit(id, handler) {
    var form = document.getElementById(id);
    form.addEventListener('submit', function (e) { e.preventDefault(); handler(form); });
  }

  onSubmit('login-form', function (form) {
    if (!validateForm(form)) return;
    withLoading(form, 1100).then(function () {
      toast('A verification code is on its way. ' + DEMO_CODE_HINT);
      showScreen('verify');
      boxes[0].focus();
    });
  });

  onSubmit('verify-form', function (form) {
    var code = boxes.map(function (b) { return b.value; }).join('');
    if (code.length < 6) {
      otp.classList.add('is-invalid');
      otpError.textContent = 'Please enter all six digits.';
      shake(otp);
      (boxes.find(function (b) { return !b.value; }) || boxes[0]).focus();
      return;
    }
    otp.classList.remove('is-invalid');
    otpError.textContent = '';
    withLoading(form, 1000).then(function () { toast('Welcome back. Your table is ready. (demo)'); });
  });

  onSubmit('signup-form', function (form) {
    if (!validateForm(form)) return;
    withLoading(form, 1200).then(function () {
      var tier = form.querySelector('input[name="tier"]:checked').value;
      toast('Application received for ' + tier.charAt(0).toUpperCase() + tier.slice(1) + ' membership. (demo)');
      form.reset();
      fill.style.width = '0';
      strengthText.textContent = 'At least 8 characters.';
    });
  });

  onSubmit('forgot-form', function (form) {
    if (!validateForm(form)) return;
    withLoading(form, 1000).then(function () {
      document.querySelector('.sent-email').textContent = form.elements.email.value.trim();
      showScreen('sent');
    });
  });

  /* ---------- Resend countdown ---------- */
  var resendBtn = document.getElementById('resend');
  function startResendTimer() {
    var s = 30;
    clearInterval(resendInterval);
    resendBtn.disabled = true;
    resendBtn.innerHTML = 'Resend in <span id="resend-timer">' + s + '</span> seconds';
    resendInterval = setInterval(function () {
      s--;
      if (s <= 0) { clearInterval(resendInterval); resendBtn.disabled = false; resendBtn.textContent = 'Resend the link'; return; }
      document.getElementById('resend-timer').textContent = s;
    }, 1000);
  }
  resendBtn.addEventListener('click', function () { toast('A fresh link has been sent. (demo)'); startResendTimer(); });

  /* ---------- Initial route ---------- */
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
