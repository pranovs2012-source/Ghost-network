/* ==========================================================================
   Puffy — Pastel Bloom Login Template
   Vanilla JS: screen navigation, mascot reactions, 3-step sign-up, validation,
   password flowers, avatar preview, confetti. Replace `fakeRequest` with your API.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var screens = $$('[data-screen]');
  var toastEl = $('.toast');
  var toastTimer, resendInterval;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================= Mascot ======================= */
  var mascot = $('#mascot');
  var eyes = $('.mascot__eyes');
  var bubble = $('#mascot-bubble');
  var LINES = {
    login: 'Hi there!', signup: 'A new friend!', forgot: 'No worries!', sent: 'Whoosh!',
    shy: 'I won’t peek!', error: 'Hmm, check that?', success: 'Yay!', typing: 'Ooh, nice'
  };
  function say(text) {
    if (bubble.textContent === text) return;
    bubble.textContent = text;
    bubble.classList.add('is-new'); void bubble.offsetWidth; bubble.classList.remove('is-new');
  }
  function mood(name) {
    mascot.classList.remove('is-happy', 'is-sad');
    void mascot.offsetWidth;
    if (name) mascot.classList.add(name);
  }
  // Eyes follow the pointer (or the focused field)
  function lookAt(x, y) {
    if (mascot.classList.contains('is-shy')) return;
    var r = mascot.getBoundingClientRect();
    var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * .55);
    var d = Math.max(1, Math.hypot(dx, dy));
    eyes.style.transform = 'translate(' + (dx / d * 4).toFixed(1) + 'px,' + (dy / d * 4).toFixed(1) + 'px)';
  }
  document.addEventListener('pointermove', function (e) { lookAt(e.clientX, e.clientY); });
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el.matches('[data-shy]') && el.type === 'password') {
      mascot.classList.add('is-shy'); say(LINES.shy);
    } else {
      mascot.classList.remove('is-shy');
      if (el.matches('input')) { var r = el.getBoundingClientRect(); lookAt(r.left + 30, r.top + r.height / 2); }
    }
  });
  document.addEventListener('focusout', function (e) {
    if (e.target.matches('[data-shy]')) { mascot.classList.remove('is-shy'); say(LINES[current] || LINES.login); }
  });
  // When the password is revealed, the mascot covers its eyes for good measure
  // Random blinking
  (function blink() {
    setTimeout(function () {
      mascot.classList.add('is-blink');
      setTimeout(function () { mascot.classList.remove('is-blink'); blink(); }, 140);
    }, 2500 + Math.random() * 3000);
  })();

  /* ======================= Navigation ======================= */
  var current = 'login';
  function showScreen(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || !target.hasAttribute('data-screen')) return;
    screens.forEach(function (s) { var on = s === target; s.hidden = !on; s.classList.toggle('is-active', on); });
    current = id;
    say(LINES[id] || LINES.login);
    if (!opts.fromHash) history.replaceState(null, '', '#' + id);
    if (!opts.silent) { var h = target.querySelector('h1'); if (h) h.focus({ preventScroll: true }); }
    if (id === 'signup') goStep(1, true);
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
  $$('[data-demo]').forEach(function (b) { b.addEventListener('click', function () { toast(b.getAttribute('data-demo')); mood('is-happy'); say(LINES.success); }); });

  /* ======================= Password peek ======================= */
  $$('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      mascot.classList.toggle('is-shy', show);
      if (show) say('Eyes closed!');
    });
  });

  /* ======================= Strength flowers ======================= */
  var pw = $('#signup-password');
  var flowers = $$('.flowers span');
  var hint = $('#signup-hint');
  pw.addEventListener('input', function () {
    var v = pw.value;
    var score = [v.length >= 8, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length;
    flowers.forEach(function (f, i) { f.classList.toggle('is-on', i < score); });
    hint.textContent = ['Grow all four flowers for a super-strong password.', 'One flower! Keep going.', 'Two flowers — getting there.', 'Three flowers, so close!', 'Full garden! Super strong.'][score];
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
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'Please accept to continue.');
    var v = input.value.trim();
    if (!v) return setError(input, 'Oops, this one is needed.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'That email looks a little off.');
    if (input.minLength > 0 && v.length < input.minLength) return setError(input, 'Needs at least ' + input.minLength + ' characters.');
    return setError(input, '');
  }
  function validate(scope, form) {
    var first = null;
    $$('input[required]', scope).forEach(function (input) { if (!validateField(input) && !first) first = input; });
    if (first) {
      first.focus();
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      mood('is-sad'); say(LINES.error);
    }
    return !first;
  }
  $$('.form input[required]').forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value) validateField(input); });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
    input.addEventListener('change', function () { if (input.type === 'checkbox') validateField(input); });
  });

  /* ======================= Requests (demo) ======================= */
  function fakeRequest(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function loading(btn, on) { btn.classList.toggle('is-loading', on); if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy'); }

  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget, btn = form.querySelector('[type="submit"]');
    if (!validate(form, form)) return;
    loading(btn, true);
    fakeRequest(1100).then(function () {
      loading(btn, false);
      toast('Logged in! Welcome back (demo)');
      mood('is-happy'); say(LINES.success);
      confetti();
    });
  });

  $('#forgot-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget, btn = form.querySelector('[type="submit"]');
    if (!validate(form, form)) return;
    loading(btn, true);
    fakeRequest(1000).then(function () {
      loading(btn, false);
      $('.sent-email').textContent = form.elements.email.value.trim();
      showScreen('sent');
    });
  });

  /* ======================= 3-step sign-up ======================= */
  var signup = $('#signup-form');
  var steps = $$('.step', signup);
  var stepDots = $$('.stepper__step');
  var backBtn = $('#step-back');
  var nextBtn = $('#step-next');
  var step = 1;
  function goStep(n, silent) {
    step = n;
    steps.forEach(function (s) { var on = Number(s.getAttribute('data-step')) === n; s.hidden = !on; s.classList.toggle('is-active', on); });
    stepDots.forEach(function (d, i) {
      d.classList.toggle('is-current', i + 1 === n);
      d.classList.toggle('is-done', i + 1 < n);
      if (i + 1 === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    $('.stepper').style.setProperty('--progress', (n - 1) / 2);
    backBtn.hidden = n === 1;
    nextBtn.querySelector('.btn__label').textContent = n === 3 ? 'Create account' : 'Next';
    if (!silent) { var first = steps[n - 1].querySelector('input'); if (first) first.focus(); }
  }
  backBtn.addEventListener('click', function () { goStep(step - 1); });
  signup.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(steps[step - 1], signup)) return;
    if (step < 3) { goStep(step + 1); say(step === 2 ? 'Tell me about you!' : 'Almost there!'); return; }
    loading(nextBtn, true);
    fakeRequest(1200).then(function () {
      loading(nextBtn, false);
      toast('Welcome to Puffy, ' + (signup.elements.name.value.trim() || 'friend') + '! (demo)');
      mood('is-happy'); say(LINES.success);
      confetti();
      signup.reset();
      flowers.forEach(function (f) { f.classList.remove('is-on'); });
      paintAvatar();
      goStep(1, true);
    });
  });

  // Avatar preview
  var avatar = $('#avatar'), avatarName = $('#avatar-name');
  function paintAvatar() {
    var name = signup.elements.name.value.trim();
    avatar.textContent = (name[0] || 'P').toUpperCase();
    avatarName.textContent = name || 'Your name';
    var c = signup.querySelector('input[name="color"]:checked');
    avatar.style.setProperty('--avatar', c ? c.value : '#ffb3c7');
  }
  signup.addEventListener('input', paintAvatar);
  signup.addEventListener('change', paintAvatar);

  /* ======================= Confetti ======================= */
  var COLORS = ['#ff8fb3', '#ffb36b', '#7fd1ff', '#8fe3a5', '#c9a8ff', '#ffe680'];
  function confetti() {
    if (reduceMotion) return;
    var box = $('#confetti');
    for (var i = 0; i < 70; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = COLORS[i % COLORS.length];
      p.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
      p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
      p.style.animationDelay = (Math.random() * .3) + 's';
      if (i % 3 === 0) p.style.borderRadius = '50%';
      box.appendChild(p);
    }
    setTimeout(function () { box.innerHTML = ''; }, 4000);
  }

  /* ======================= Resend countdown ======================= */
  var resendBtn = $('#resend');
  function startResendTimer() {
    var s = 30;
    clearInterval(resendInterval);
    resendBtn.disabled = true;
    resendBtn.innerHTML = 'Resend in <span id="resend-timer">' + s + '</span>s';
    resendInterval = setInterval(function () {
      s--;
      if (s <= 0) { clearInterval(resendInterval); resendBtn.disabled = false; resendBtn.textContent = 'Send it again'; return; }
      $('#resend-timer').textContent = s;
    }, 1000);
  }
  resendBtn.addEventListener('click', function () { toast('Sent another one! (demo)'); startResendTimer(); });

  /* ======================= Init ======================= */
  goStep(1, true);
  paintAvatar();
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
