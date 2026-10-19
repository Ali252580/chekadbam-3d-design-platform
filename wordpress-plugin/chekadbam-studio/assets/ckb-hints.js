/**
 * چکادبام استودیو — راهنمای درون‌پلان (v2.14)
 * ─────────────────────────────────────────────────────────────
 * به‌جای تور اسپات‌لایت بار اول: راهنما روی خود بوم سه‌بعدی می‌نشیند و
 * با انجام واقعی هر حرکت توسط کاربر، خودش به قدم بعد می‌رود.
 *   ۱ چرخش دید  ۲ زوم  ۳ افزودن قلم  ۴ کشیدن قلم  ۵ تنظیم دقیق
 *
 * استودیو فقط این نقاط تماس را دارد:
 *   CKBHints.init({ vp, mobile, anchor(name), onTour })
 *   CKBHints.start(fromStart) / signal(ev) / stop() / pending()
 *   anchor(name) نقطه {x,y} نسبت به ویوپورت یا null برمی‌گرداند.
 *
 * Global namespace: window.CKBHints
 */
(function () {
	'use strict';

	var STORE_KEY = 'ckb-plan-hints';

	var STEPS = [
		{
			ev: 'orbit', gesture: 'swipe', anchor: 'center',
			title: 'چرخاندن دید',
			desk: 'روی فضای خالی بکشید.',
			mob: 'روی فضای خالی بکشید.',
		},
		{
			ev: 'zoom', gesture: 'zoom', anchor: 'center',
			title: 'زوم',
			desk: 'چرخ ماوس را بچرخانید.',
			mob: 'دو انگشت را باز و بسته کنید.',
		},
		{
			ev: 'add', gesture: 'tap', anchor: 'add',
			title: 'افزودن قلم',
			desk: 'روی «+ افزودن» بزنید.',
			mob: 'روی «+ افزودن» بزنید.',
		},
		{
			ev: 'drag', gesture: 'drag', anchor: 'item',
			title: 'جابه‌جایی قلم',
			desk: 'قلم را بگیرید و بکشید.',
			mob: 'قلم را بگیرید و بکشید.',
		},
		{
			ev: 'fine', gesture: 'tap', anchor: 'nudge',
			title: 'تنظیم دقیق',
			desk: 'با فلش‌ها جابه‌جا، با «چرخش» بچرخانید.',
			mob: 'با فلش‌ها جابه‌جا، با «چرخش» بچرخانید.',
		},
	];

	var FA_NUM = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	function fa(n) { return String(n).replace(/\d/g, function (d) { return FA_NUM[+d]; }); }

	var state = { cfg: null, step: -1, card: null, mark: null, timer: null };

	function save(v) { try { window.localStorage.setItem(STORE_KEY, String(v)); } catch (e) {} }
	function load() { try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return 'done'; } }

	function build() {
		if (state.card) return;
		var vp = state.cfg.vp;

		var card = document.createElement('div');
		card.className = 'ckb-hint-card';
		card.setAttribute('role', 'status');
		card.setAttribute('aria-live', 'polite');
		card.innerHTML =
			'<div class="ckb-hint-top">' +
				'<span class="ckb-hint-step"></span>' +
				'<span class="ckb-hint-bar"><i></i></span>' +
				'<button type="button" class="ckb-hint-x" aria-label="بستن راهنما">✕</button>' +
			'</div>' +
			'<div class="ckb-hint-msg"><b class="ckb-hint-title"></b>' +
			'<p class="ckb-hint-desc"></p></div>' +
			'<div class="ckb-hint-foot">' +
				'<button type="button" class="ckb-hint-skip">بعدی ›</button>' +
				'<button type="button" class="ckb-hint-tour">تور ابزارها</button>' +
				'<button type="button" class="ckb-hint-ok">شروع</button>' +
			'</div>';
		vp.appendChild(card);

		var mark = document.createElement('div');
		mark.className = 'ckb-hint-mark';
		mark.setAttribute('aria-hidden', 'true');
		mark.innerHTML = '<span class="ckb-hint-ring"></span><span class="ckb-hint-hand"></span><span class="ckb-hint-hand2"></span>';
		vp.appendChild(mark);

		card.querySelector('.ckb-hint-x').addEventListener('click', function () { finish(); });
		card.querySelector('.ckb-hint-ok').addEventListener('click', function () { finish(); });
		card.querySelector('.ckb-hint-skip').addEventListener('click', function () { go(state.step + 1); });
		card.querySelector('.ckb-hint-tour').addEventListener('click', function () {
			finish();
			if (state.cfg.onTour) state.cfg.onTour();
		});

		state.card = card;
		state.mark = mark;
	}

	function render() {
		var card = state.card, mark = state.mark;
		var done = state.step >= STEPS.length;
		card.classList.toggle('is-done', done);
		card.classList.add('show');

		if (done) {
			card.querySelector('.ckb-hint-step').textContent = 'آماده‌اید!';
			card.querySelector('.ckb-hint-bar i').style.width = '100%';
			card.querySelector('.ckb-hint-title').textContent = 'حالا بچینید!';
			card.querySelector('.ckb-hint-desc').textContent = 'آخر کار «ثبت طرح» را بزنید.';
			mark.className = 'ckb-hint-mark';
			return;
		}

		var s = STEPS[state.step];
		card.querySelector('.ckb-hint-step').textContent = 'قدم ' + fa(state.step + 1) + ' از ' + fa(STEPS.length);
		card.querySelector('.ckb-hint-bar i').style.width = (state.step / STEPS.length * 100) + '%';
		card.querySelector('.ckb-hint-title').textContent = s.title;
		card.querySelector('.ckb-hint-desc').textContent = state.cfg.mobile ? s.mob : s.desk;
		mark.className = 'ckb-hint-mark show g-' + s.gesture + (state.cfg.mobile ? ' is-touch' : '');
		place();
	}

	function place() {
		if (state.step < 0 || state.step >= STEPS.length || !state.mark) return;
		var s = STEPS[state.step];
		var p = state.cfg.anchor(s.anchor) || state.cfg.anchor('center');
		state.mark.classList.toggle('off', !p);
		if (!p) return;
		state.mark.style.left = p.x + 'px';
		state.mark.style.top = p.y + 'px';
	}

	function go(i) {
		state.step = i;
		save(i >= STEPS.length ? 'done' : i);
		render();
	}

	function finish() {
		stop();
		save('done');
	}

	function stop() {
		state.step = -1;
		if (state.timer) { window.clearInterval(state.timer); state.timer = null; }
		if (state.card) state.card.classList.remove('show');
		if (state.mark) state.mark.className = 'ckb-hint-mark';
	}

	window.CKBHints = {
		init: function (cfg) {
			if (!cfg || !cfg.vp || !cfg.anchor) return;
			state.cfg = cfg;
		},
		pending: function () { return load() !== 'done'; },
		start: function (fromStart) {
			if (!state.cfg) return;
			build();
			var saved = parseInt(load(), 10);
			var at = fromStart || isNaN(saved) ? 0 : Math.min(saved, STEPS.length - 1);
			go(at);
			if (!state.timer) state.timer = window.setInterval(place, 200);
		},
		/* اگر کاربر جلوتر از راهنما رفت (مثلاً قبل از زوم قلم افزود)، همان‌جا می‌رسد */
		signal: function (ev) {
			if (state.step < 0 || state.step >= STEPS.length) return;
			for (var i = state.step; i < STEPS.length; i++) {
				if (STEPS[i].ev === ev) { go(i + 1); return; }
			}
		},
		stop: stop,
		active: function () { return state.step >= 0; },
	};
})();
