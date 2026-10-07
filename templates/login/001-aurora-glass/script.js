/* ==========================================================================
   Aurora Glass — Login Template
   Vanilla JS: screen navigation, validation, password tools, demo submits.
   Replace the `fakeRequest` calls with your real API requests.
   ========================================================================== */
(function () {
  'use strict';

  var screens = Array.prototype.slice.call(document.querySelectorAll('[data-screen]'));
  var toastEl = document.querySelector('.toast');
  var toastTimer = null;
  var resendInterval = null;

  /* ---------- Screen navigation ---------- */
  function showScreen(id, opts) {
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) {
      var active = s === target;
      s.hidden = !active;
      s.classList.toggle('is-active', active);
    });
    if (!opts || !opts.fromHash) {
      history.replaceState(null, '', '#' + id);
    }
    // Move focus to the new heading for screen-reader and keyboard users
    var heading = target.querySelector('h1');
    if (heading && (!opts || !opts.silent)) heading.focus({ preventScroll: true });
    if (id === 'sent') startResendTimer();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-goto]');
    if (!trigger) return;
    e.preventDefault();
    showScreen(trigger.getAttribute('data-goto'));
  });

  function routeFromHash(silent) {
    var id = location.hash.replace('#', '');
    if (id && document.getElementById(id) && document.getElementById(id).hasAttribute('data-screen')) {
      showScreen(id, { fromHash: true, silent: silent });
    }
  }

  /* ---------- Toast ---------- */
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3200);
  }

  document.querySelectorAll('[data-demo]').forEach(function (btn) {
    btn.addEventListener('click', function () { toast(btn.getAttribute('data-demo')); });
  });

  /* ---------- Show / hide password ---------- */
  document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  /* ---------- Password strength ---------- */
  var strengthInput = document.getElementById('signup-password');
  var strengthMeter = document.querySelector('.strength');
  var strengthLabel = document.getElementById('strength-label');
  var strengthText = ['Use 8+ characters with a mix of letters, numbers & symbols.', 'Weak password', 'Fair — add numbers or symbols', 'Good password', 'Strong password'];

  function scorePassword(value) {
    if (!value) return 0;
    var score = 0;
    if (value.length >= 8) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value) || value.length >= 14) score++;
    return Math.max(1, score);
  }
  strengthInput.addEventListener('input', function () {
    var level = scorePassword(strengthInput.value);
    strengthMeter.setAttribute('data-level', String(level));
    strengthLabel.textContent = strengthText[level];
  });

  /* ---------- Validation ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, message) {
    var errorEl = document.getElementById(input.id + '-error') ||
      document.getElementById(input.form.id.replace('-form', '') + '-' + input.name + '-error');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) errorEl.textContent = message || '';
    return !message;
  }

  function validateField(input) {
    var v = input.type === 'checkbox' ? input.checked : input.value.trim();
    if (input.type === 'checkbox') return setError(input, v ? '' : 'Please accept the terms to continue.');
    if (!v) return setError(input, 'This field is required.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'Enter a valid email address.');
    if (input.minLength > 0 && v.length < input.minLength) return setError(input, 'Must be at least ' + input.minLength + ' characters.');
    return setError(input, '');
  }

  function validateForm(form) {
    var fields = form.querySelectorAll('input[required]');
    var firstInvalid = null;
    fields.forEach(function (input) {
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      form.classList.remove('shake');
      void form.offsetWidth; // restart animation
      form.classList.add('shake');
    }
    return !firstInvalid;
  }

  // Re-validate a field once the user has interacted with it
  document.querySelectorAll('.form input[required]').forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value || input.getAttribute('aria-invalid')) validateField(input); });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
    input.addEventListener('change', function () { if (input.type === 'checkbox') validateField(input); });
  });

  /* ---------- Submit handling (demo) ---------- */
  function fakeRequest(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function handleSubmit(form, onSuccess) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      var btn = form.querySelector('[type="submit"]');
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      fakeRequest(1200).then(function () {
        btn.classList.remove('is-loading');
        btn.removeAttribute('aria-busy');
        onSuccess(form);
      });
    });
  }

  handleSubmit(document.getElementById('login-form'), function () {
    toast('Signed in successfully (demo)');
  });

  handleSubmit(document.getElementById('signup-form'), function (form) {
    var first = form.elements.name.value.trim().split(' ')[0];
    toast('Welcome aboard, ' + first + '! (demo)');
    form.reset();
    strengthMeter.setAttribute('data-level', '0');
    strengthLabel.textContent = strengthText[0];
  });

  handleSubmit(document.getElementById('forgot-form'), function (form) {
    document.querySelector('.sent-email').textContent = form.elements.email.value.trim();
    showScreen('sent');
  });

  /* ---------- Resend countdown ---------- */
  var resendBtn = document.getElementById('resend');
  function startResendTimer() {
    var seconds = 30;
    clearInterval(resendInterval);
    resendBtn.disabled = true;
    resendBtn.innerHTML = 'Resend in <span id="resend-timer">' + seconds + '</span>s';
    resendInterval = setInterval(function () {
      seconds--;
      if (seconds <= 0) {
        clearInterval(resendInterval);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend link';
        return;
      }
      document.getElementById('resend-timer').textContent = seconds;
    }, 1000);
  }
  resendBtn.addEventListener('click', function () {
    toast('A new reset link is on its way (demo)');
    startResendTimer();
  });

  /* ---------- Initial route (supports links like index.html#signup) ---------- */
  window.addEventListener('hashchange', function () { routeFromHash(false); });
  routeFromHash(true);
})();
