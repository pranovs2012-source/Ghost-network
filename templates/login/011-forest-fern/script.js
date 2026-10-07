/* ==========================================================================
   Fernwood — Nature / Forest Login Template
   Vanilla JS: time-of-day scene, falling leaves / fireflies, navigation,
   validation, trail-name generator, growing-sapling password meter.
   Replace `fakeRequest` with your real API calls.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var body = document.body;
  var screens = $$('[data-screen]');
  var toastEl = $('.toast');
  var toastTimer, resendInterval;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GREETINGS = { dawn: 'Good morning, early riser.', day: 'Good day, wanderer.', dusk: 'Good evening, traveller.', night: 'Quiet night in the woods.' };
  var NAME_PARTS = [
    ['Quiet', 'Mossy', 'Amber', 'Misty', 'Wild', 'Little', 'Silver', 'Sunny', 'Hollow', 'Brave'],
    ['Fern', 'Fox', 'Owl', 'Brook', 'Pine', 'Wren', 'Birch', 'Hare', 'Thistle', 'Acorn']
  ];

  /* ======================= Time of day ======================= */
  function timeFromClock() {
    var h = new Date().getHours();
    return h >= 5 && h < 9 ? 'dawn' : h >= 9 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
  }
  function setTime(t) {
    body.setAttribute('data-time', t);
    $('#greeting').textContent = GREETINGS[t];
    $$('[data-set-time]').forEach(function (b) {
      var on = b.getAttribute('data-set-time') === t;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    ambience(t);
  }
  var timeButtons = $$('[data-set-time]');
  timeButtons.forEach(function (b, i) {
    b.addEventListener('click', function () { setTime(b.getAttribute('data-set-time')); });
    b.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = timeButtons[(i + d + timeButtons.length) % timeButtons.length];
      n.focus(); n.click();
    });
  });

  /* ======================= Leaves by day, fireflies by night ======================= */
  var leafBox = $('#leaves'), flyBox = $('#fireflies'), leafTimer = null;
  var LEAF = '<svg viewBox="0 0 24 24"><path d="M3 21C3 11 10 3 21 3c0 11-8 18-18 18z" fill="currentColor"/><path d="M3 21L15 9" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/></svg>';
  var LEAF_COLORS = ['#7fa56b', '#a5b860', '#d9a441', '#c9733a', '#5d8c55'];
  function dropLeaf() {
    var l = document.createElement('div');
    l.className = 'leaf';
    l.innerHTML = LEAF;
    l.style.left = (Math.random() * 100) + '%';
    l.style.color = LEAF_COLORS[Math.random() * LEAF_COLORS.length | 0];
    l.style.setProperty('--drift', (Math.random() * 300 - 80) + 'px');
    l.style.animationDuration = (9 + Math.random() * 8) + 's';
    var scale = .6 + Math.random() * .8;
    l.style.width = l.style.height = (22 * scale) + 'px';
    leafBox.appendChild(l);
    setTimeout(function () { l.remove(); }, 18000);
  }
  function ambience(t) {
    clearInterval(leafTimer);
    flyBox.innerHTML = '';
    if (reduceMotion) return;
    if (t === 'night' || t === 'dusk') {
      for (var i = 0; i < (t === 'night' ? 26 : 10); i++) {
        var f = document.createElement('span');
        f.className = 'firefly';
        f.style.left = (Math.random() * 100) + '%';
        f.style.top = (45 + Math.random() * 50) + '%';
        f.style.setProperty('--d', (1 + Math.random() * 2) + 's');
        f.style.setProperty('--w', (4 + Math.random() * 6) + 's');
        f.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
        f.style.setProperty('--dy', (Math.random() * 60 - 30) + 'px');
        flyBox.appendChild(f);
      }
    } else {
      dropLeaf();
      leafTimer = setInterval(dropLeaf, 1400);
    }
  }

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
      var top = target.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * .6) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
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
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3000);
  }

  /* ======================= Password tools ======================= */
  $$('[data-toggle-password]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
    });
  });
  var pw = $('#signup-password'), sapling = $('#sapling'), growLabel = $('#grow-label');
  var STAGES = ['Seed — add more to help it grow.', 'Sprout — getting started.', 'Sapling — nearly there.', 'Young tree — strong.', 'Old oak — very strong!'];
  pw.addEventListener('input', function () {
    var v = pw.value, s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) s++;
    if (!v) s = 0;
    sapling.setAttribute('data-stage', String(s));
    growLabel.textContent = STAGES[s];
  });

  /* Trail name generator */
  $('#suggest-name').addEventListener('click', function () {
    var name = NAME_PARTS[0][Math.random() * 10 | 0] + NAME_PARTS[1][Math.random() * 10 | 0];
    var input = $('#signup-trail');
    input.value = name;
    input.dispatchEvent(new Event('input'));
    input.focus();
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
    if (input.type === 'checkbox') return setError(input, input.checked ? '' : 'Please accept the terms to continue.');
    var v = input.value.trim();
    if (!v) return setError(input, 'This field is needed.');
    if (input.type === 'email' && !EMAIL_RE.test(v)) return setError(input, 'That email doesn’t look quite right.');
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
      fakeRequest(1000).then(function () {
        btn.classList.remove('is-loading');
        btn.removeAttribute('aria-busy');
        handler(form);
      });
    });
  }
  onSubmit('login-form', function () { toast('Welcome back to the trail (demo)'); });
  onSubmit('signup-form', function (form) {
    toast('Planted! Welcome, ' + form.elements.trail.value.trim() + ' (demo)');
    form.reset();
    pw.dispatchEvent(new Event('input'));
  });
  onSubmit('forgot-form', function (form) {
    $('.sent-email').textContent = form.elements.email.value.trim();
    showScreen('sent');
  });

  /* ======================= Resend countdown ======================= */
  var resendBtn = $('#resend');
  function startResendTimer() {
    var s = 30;
    clearInterval(resendInterval);
    resendBtn.disabled = true;
    resendBtn.innerHTML = 'Send another in <span id="resend-timer">' + s + '</span>s';
    resendInterval = setInterval(function () {
      s--;
      if (s <= 0) { clearInterval(resendInterval); resendBtn.disabled = false; resendBtn.textContent = 'Send another bird'; return; }
      $('#resend-timer').textContent = s;
    }, 1000);
  }
  resendBtn.addEventListener('click', function () { toast('Another bird has flown (demo)'); startResendTimer(); });

  /* ======================= Init ======================= */
  setTime(timeFromClock());
  function route(silent) {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.hasAttribute('data-screen')) showScreen(id, { fromHash: true, silent: silent });
  }
  window.addEventListener('hashchange', function () { route(false); });
  route(true);
})();
