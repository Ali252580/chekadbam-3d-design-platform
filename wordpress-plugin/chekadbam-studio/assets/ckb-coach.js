/**
 * چکادبام استودیو — همراه طراح (v2.11)
 * ─────────────────────────────────────────────────────────────
 * پنل «راهنمای چیدمان بام و تراس»: امتیاز طراحی + راهنماهای زنده.
 *
 * طراحی ماژولار:
 *   - این فایل هیچ وابستگی به Three.js یا بقیه افزونه ندارد؛
 *     فقط «وضعیت» را از طریق getState() می‌خواند و DOM مستقل خودش
 *     را داخل ویوپورت می‌سازد. هیچ منطق موجودی تغییر نمی‌کند.
 *   - استودیو (studio-app.js) فقط در سه نقطه با ماژول تماس می‌گیرد:
 *       CKBCoach.init({...})   بعد از ساخت نوار تب
 *       CKBCoach.refresh()     پس از هر تغییر وضعیت اقلام/پلان
 *       CKBCoach.toggle()      کلیک روی تب «همراه طراح»
 *
 * موتور امتیاز: ۶ معیار طراحی روف‌گاردن — هر معیار وزنی دارد:
 *   سبزینگی ۲۵ | نشیمن ۲۰ | مسیر عبور ۲۰ | سایه‌گیر ۱۵ | کانون ۱۰ | حریم ۱۰
 *
 * Global namespace: window.CKBCoach
 */
(function () {
	'use strict';

	/* ─────────────── ابزارهای کمکی ─────────────── */

	/** تبدیل عدد به رقم فارسی برای نمایش در UI */
	function fa(n) {
		try { return Number(n).toLocaleString('fa-IR', { maximumFractionDigits: 1 }); }
		catch (e) { return String(n); }
	}

	/** ساخت عنصر DOM با کلاس و html داخلی — برای خوانایی کد رندر */
	function el(tag, cls, html) {
		var e = document.createElement(tag);
		if (cls) e.className = cls;
		if (html != null) e.innerHTML = html;
		return e;
	}

	/* ─────────────── پیکربندی معیارها ─────────────── */

	/** آستانه‌ها و وزن هر معیار — متمرکز و قابل تنظیم در یک‌جا */
	var CRITERIA = {
		green:   { weight: 25, label: 'سبزینگی',   target: 0.20 },  // ≥۲۰٪ متراژ زیر کاشت
		seat:    { weight: 20, label: 'نشیمن',     target: 0.25 },  // ≥۰٫۲۵ متر نشیمن بر متر مربع
		circ:    { weight: 20, label: 'مسیر عبور', target: 0.50 },  // اشغال کل ≤۵۰٪ متراژ
		shade:   { weight: 15, label: 'سایه‌گیر',  bonus: 15, min: 4 }, // وجود پرگولا/چتر
		focal:   { weight: 10, label: 'کانون طراحی', bonus: 10, min: 3 }, // آب‌نما/آتشدان
		privacy: { weight: 10, label: 'حریم و پرده', bonus: 10, min: 3 }, // دیوار سبز/پارتیشن
	};

	/** شکل‌هایی که هر معیار را برآورده می‌کنند (هم‌نام shapeType اقلام) */
	var SHAPES = {
		shade:   ['pergola', 'pergola_deck', 'umbrella'],
		focal:   ['water_feature', 'firepit', 'firepit_table'],
		privacy: ['green_wall', 'green_wall_planter', 'partition'],
	};

	/** متن راهنماهای زنده برای هر معیار (عنوان + توضیح + لحن) */
	var TIP_TEXT = {
		greenBad: {
			tone: 'warn', icon: '⚠', title: 'بام شما کم‌سبز است',
			body: 'حداقل ۲۰٪ متراژ را با فلاورباکس و کاشت بپوشانید؛ کاشت گیاهی دمای محیط را پایین می‌آورد.',
		},
		greenWarn: {
			tone: 'warn', icon: '⚠', title: 'سبزینگی می‌تواند بیشتر باشد',
			body: 'با یک یا دو فلاورباکس مدولار، نسبت سبز طرح را به ۲۰٪ برسانید.',
		},
		seatBad: {
			tone: 'warn', icon: '⚠', title: 'جای نشستن کم است',
			body: 'برای هر متر مربع فضا، حدود ۲۵ سانتی‌متر طول نشیمن در نظر بگیرید — نیمکت مدولار یا ست مبلمان.',
		},
		seatWarn: {
			tone: 'warn', icon: '⚠', title: 'نشیمن را کامل‌تر کنید',
			body: 'یک نیمکت پشتی‌دار یا مجموعه نیمکت متصل به فلاورباکس، ظرفیت نشیمن را متعادل می‌کند.',
		},
		circBad: {
			tone: 'bad', icon: '✕', title: 'مسیر عبور تنگ است',
			body: 'حداقل ۹۰ سانتی‌متر فضای آزاد بین اقلام نگه دارید تا حرکت راحت باشد؛ تعداد اقلام را کم کنید.',
		},
		circWarn: {
			tone: 'warn', icon: '⚠', title: 'چیدمان کمی شلوغ است',
			body: 'فاصله اقلام را بیشتر کنید؛ فضا برای گردش و مبلمان باید نفس بکشد.',
		},
		shade: {
			tone: 'warn', icon: '⚠', title: 'سایه‌گیر اضافه کنید',
			body: 'یک پرگولا یا چتر پایه‌کنار، بخش آفتاب‌گیر بام را در گرمای روز قابل استفاده می‌کند.',
		},
		focal: {
			tone: 'warn', icon: '⚠', title: 'کانون طراحی تعریف کنید',
			body: 'آبنما یا میز آتشدان، کانون دید می‌شود و نشیمن‌ها را دور خودش منظّم می‌کند.',
		},
		privacy: {
			tone: 'warn', icon: '⚠', title: 'حریم فضا را بسازید',
			body: 'دیوار سبز مدولار در ضلع همسایه، هم محرمیت می‌دهد هم شدت باد را کم می‌کند.',
		},
		focalOk: {
			tone: 'ok', icon: '✓', title: 'کانون خوب است',
			body: 'نشیمن‌ها را رو به این کانون بچینید تا چشم اول‌به‌آنجا برود.',
		},
		empty: {
			tone: 'ok', icon: '✦', title: 'برای شروع، اولین قلم را بگذارید',
			body: 'از تب «افزودن» یک قلم انتخاب کنید؛ همراه طراح همان لحظه چیدمان شما را تحلیل می‌کند.',
		},
	};

	/** نکته‌های لحظه‌ای عمومی طراحی بام — به‌صورت چرخشی نمایش داده می‌شوند */
	var MOMENT_TIPS = [
		'۲۰٪ از متراژ بام را سبز کنید؛ کاشت گیاهی دمای محیط را تا ۵ درجه پایین می‌آورد.',
		'نیمکت‌ها را رو به کانون (آبنما یا آتشدان) بچینید تا چشم اول‌به‌آنجا برود.',
		'دیوار سبز در ضلع بادخور، هم حریم می‌دهد هم شدت باد را روی بام کم می‌کند.',
		'میز آتشدان حداقل یک متر با مبلمان فاصله داشته باشد؛ ایمنی و راحتی با هم.',
		'برای تراس کشیده، چیدمان خطی در امتداد دیوار بهترین گزینه است.',
		'پرگولا را جایی بگذارید که ظهرگاه سایه‌اش روی نشیمن بیفتد.',
	];

	/* ─────────────── وضعیت ماژول ─────────────── */

	var state = {
		root: null,       // ویوپورت استودیو (والد پنل)
		getState: null,   // تابع خواندن وضعیت زنده از استودیو {space, items, B}
		onChange: null,   // اطلاع باز/بسته شدن به استودیو (برای حالت .on تب)
		panel: null,      // خود پنل
		tipsBox: null,    // ظرف کارت‌های راهنمای زنده
		chipsBox: null,   // ظرف چیپ‌های معیار
		ringArc: null,    // کمان امتیاز (SVG)
		ringVal: null,    // عدد امتیاز
		momentText: null, // متن نکته لحظه‌ای
		momentDots: null, // نشانگرهای چرخش
		momentIdx: 0,     // ایندکس نکته جاری
		momentTimer: null,// تایمر چرخش
		open: false,      // باز بودن پنل
	};

	/* ─────────────── موتور تحلیل ─────────────── */

	/**
	 * تحلیل چیدمان جاری و تولید نتیجه هر ۶ معیار + امتیاز کل.
	 * فقط خواندنی — هیچ چیز از وضعیت استودیو تغییر نمی‌دهد.
	 */
	function analyze(space, items, B) {
		var netArea = (B && B.calculatePlanArea) ? B.calculatePlanArea(space) : (space.width * space.length);
		if (!netArea || netArea <= 0) netArea = 1;

		var planting = 0, seating = 0, total = 0, has = { shade: false, focal: false, privacy: false };

		(items || []).forEach(function (it) {
			var foot = Math.max(0, (it.width || 0) * (it.depth || 0));
			total += foot;
			if (it.category === 'planting') planting += foot;
			if (it.category === 'furniture') seating += Math.max(it.width || 0, it.depth || 0);
			Object.keys(SHAPES).forEach(function (k) {
				if (SHAPES[k].indexOf(it.shapeType) !== -1) has[k] = true;
			});
		});

		var greenRatio = planting / netArea;          // نسبت سبز
		var seatRatio = seating / netArea;            // طول نشیمن به متراژ
		var fillRatio = total / netArea;              // اشغال کل فضا

		/* زیرامتیاز هر معیار (۰ تا ۱) — برش با آستانه‌های بالا */
		var sub = {
			green:   Math.min(1, greenRatio / CRITERIA.green.target),
			seat:    Math.min(1, seatRatio / CRITERIA.seat.target),
			circ:    Math.max(0, 1 - Math.max(0, fillRatio - CRITERIA.circ.target) / 0.4),
			shade:   has.shade ? 1 : (CRITERIA.shade.min / CRITERIA.shade.bonus),
			focal:   has.focal ? 1 : (CRITERIA.focal.min / CRITERIA.focal.bonus),
			privacy: has.privacy ? 1 : (CRITERIA.privacy.min / CRITERIA.privacy.bonus),
		};

		/* امتیاز کل = مجموع وزنی زیرامتیازها */
		var score = 0;
		Object.keys(CRITERIA).forEach(function (k) {
			score += sub[k] * CRITERIA[k].weight;
		});
		score = Math.round(Math.max(0, Math.min(100, score)));

		/* حالت هر معیار برای چیپ‌ها: ok / warn / bad */
		var flags = {
			green:   greenRatio >= CRITERIA.green.target ? 'ok' : (greenRatio >= 0.08 ? 'warn' : 'bad'),
			seat:    seatRatio >= CRITERIA.seat.target ? 'ok' : (seatRatio >= 0.1 ? 'warn' : 'bad'),
			circ:    fillRatio <= CRITERIA.circ.target ? 'ok' : (fillRatio <= 0.7 ? 'warn' : 'bad'),
			shade:   has.shade ? 'ok' : 'warn',
			focal:   has.focal ? 'ok' : 'warn',
			privacy: has.privacy ? 'ok' : 'warn',
		};

		return { netArea: netArea, greenRatio: greenRatio, score: score, flags: flags, has: has, empty: !(items || []).length };
	}

	/** انتخاب راهنماهای زنده بر پایه نتیجه تحلیل — حداکثر ۴ کارت */
	function pickTips(res) {
		if (res.empty) return [TIP_TEXT.empty];

		var tips = [];
		/* نکته مثبت کانون همیشه اول دیده می‌شود تا کاربر فقط هشدار نبیند */
		if (res.flags.focal === 'ok') tips.push(TIP_TEXT.focalOk);

		if (res.flags.circ === 'bad') tips.push(TIP_TEXT.circBad);
		else if (res.flags.circ === 'warn') tips.push(TIP_TEXT.circWarn);

		if (res.flags.green === 'bad') tips.push(TIP_TEXT.greenBad);
		else if (res.flags.green === 'warn') tips.push(TIP_TEXT.greenWarn);

		if (res.flags.seat === 'bad') tips.push(TIP_TEXT.seatBad);
		else if (res.flags.seat === 'warn') tips.push(TIP_TEXT.seatWarn);

		if (res.flags.shade === 'warn') tips.push(TIP_TEXT.shade);
		if (res.flags.focal === 'warn') tips.push(TIP_TEXT.focal);
		if (res.flags.privacy === 'warn') tips.push(TIP_TEXT.privacy);

		return tips.slice(0, 4);
	}

	/* ─────────────── رندر ─────────────── */

	/** ساخت اسکلت پنل یک‌بار در init؛ بخش‌های متغیر در refresh به‌روز می‌شوند */
	function buildPanel() {
		state.panel = el('aside', 'ckb-coach');

		/* سربرگ: آیکن + عنوان + دکمه بستن */
		var head = el('div', 'ckb-coach-head',
			'<div class="ckb-coach-ic">✦</div>' +
			'<div class="ckb-coach-tt"><b>همراه طراح</b><span>راهنمای چیدمان بام و تراس</span></div>' +
			'<button type="button" class="ckb-coach-x" aria-label="بستن همراه طراح">✕</button>');
		head.querySelector('.ckb-coach-x').addEventListener('click', function () { api.toggle(false); });
		state.panel.appendChild(head);

		var body = el('div', 'ckb-coach-body');
		state.panel.appendChild(body);

		/* حلقه امتیاز طراحی */
		var ring =
			'<div class="ckb-coach-score">' +
				'<div class="ckb-coach-ring">' +
					'<svg width="86" height="86" viewBox="0 0 86 86">' +
						'<circle cx="43" cy="43" r="36" fill="none" stroke="#1e293b" stroke-width="8"/>' +
						'<circle class="ckb-coach-arc" cx="43" cy="43" r="36" fill="none" stroke="#10b981" stroke-width="8" ' +
							'stroke-linecap="round" stroke-dasharray="226" stroke-dashoffset="226"/>' +
					'</svg>' +
					'<div class="ckb-coach-ringval"><b class="ckb-coach-scorenum">۰</b><span>از ۱۰۰</span></div>' +
				'</div>' +
				'<div class="ckb-coach-scorelbl"><b>امتیاز طراحی طرح شما</b>' +
					'<small>بر پایه ۶ معیار طراحی روف‌گاردن چکادبام — با هر تغییر، زنده به‌روز می‌شود</small></div>' +
			'</div>';
		body.appendChild(el('div', null, ring));
		state.ringArc = body.querySelector('.ckb-coach-arc');
		state.ringVal = body.querySelector('.ckb-coach-scorenum');

		/* چیپ‌های معیار */
		state.chipsBox = el('div', 'ckb-coach-chips');
		body.appendChild(state.chipsBox);

		/* راهنماهای زنده */
		body.appendChild(el('div', 'ckb-coach-sec', '◆ راهنماهای زنده برای همین طرح'));
		state.tipsBox = el('div', null);
		body.appendChild(state.tipsBox);

		/* نکته لحظه‌ای چرخان */
		var moment = el('div', 'ckb-coach-moment',
			'<b>نکتهٔ طراحی</b><p class="ckb-coach-moment-text"></p><div class="ckb-coach-dots"></div>');
		body.appendChild(moment);
		state.momentText = moment.querySelector('.ckb-coach-moment-text');
		state.momentDots = moment.querySelector('.ckb-coach-dots');

		state.root.appendChild(state.panel);
	}

	/** رندر چیپ‌های شش‌گانه معیار بر پایه نتیجه تحلیل */
	function renderChips(res) {
		var chips = Object.keys(CRITERIA).map(function (k) {
			var flag = res.flags[k];
			var icon = flag === 'ok' ? '✓' : (flag === 'warn' ? '!' : '✕');
			var text = CRITERIA[k].label;
			/* برای معیارهای نسبی، مقدار واقعی هم داخل چیپ می‌آید */
			if (k === 'green') text += ' ٪' + fa(Math.round(res.greenRatio * 100));
			return '<span class="ckb-coach-chip ' + flag + '">' + icon + ' ' + text + '</span>';
		});
		state.chipsBox.innerHTML = chips.join('');
	}

	/** رندر کارت‌های راهنمای زنده */
	function renderTips(tips) {
		state.tipsBox.innerHTML = tips.map(function (t) {
			return '<div class="ckb-coach-tip ' + t.tone + '">' +
				'<span class="ckb-coach-tip-ic">' + t.icon + '</span>' +
				'<div><b>' + t.title + '</b><p>' + t.body + '</p></div></div>';
		}).join('');
	}

	/** به‌روزرسانی حلقه امتیاز با انیمیشن نرم */
	function renderScore(score) {
		var C = 226; // محیط حلقه (r=36)
		state.ringArc.setAttribute('stroke-dashoffset', String(C - (C * score / 100)));
		state.ringVal.textContent = fa(score);
	}

	/** چرخش نکته لحظه‌ای — یک‌بار در init راه می‌افتد */
	function startMoment() {
		function show() {
			state.momentText.textContent = MOMENT_TIPS[state.momentIdx];
			var dots = state.momentDots.querySelectorAll('i');
			dots.forEach(function (d, k) { d.classList.toggle('on', k === state.momentIdx); });
		}
		state.momentDots.innerHTML = MOMENT_TIPS.map(function () { return '<i></i>'; }).join('');
		show();
		if (state.momentTimer) clearInterval(state.momentTimer);
		state.momentTimer = setInterval(function () {
			state.momentIdx = (state.momentIdx + 1) % MOMENT_TIPS.length;
			show();
		}, 6000);
	}

	/* ─────────────── API عمومی ماژول ─────────────── */

	var api = {
		/**
		 * راه‌اندازی — یک‌بار از studio-app بعد از ساخت نوار تب صدا زده می‌شود.
		 * opts: { vp (والد پنل), getState(), onChange(open) }
		 */
		init: function (opts) {
			if (!opts || !opts.vp || state.panel) return; // فقط یک‌بار
			state.root = opts.vp;
			state.getState = opts.getState || null;
			state.onChange = opts.onChange || null;
			buildPanel();
			startMoment();
			this.refresh();
		},

		/**
		 * تازه‌سازی زنده — استودیو بعد از هر تغییر وضعیت صدا می‌زند.
		 * پنل بسته هم تحلیل می‌شود تا با باز شدن، آماده باشد.
		 */
		refresh: function () {
			if (!state.panel || !state.getState) return;
			var s = state.getState();
			var res = analyze(s.space, s.items, s.B);
			renderScore(res.score);
			renderChips(res);
			renderTips(pickTips(res));
		},

		/** باز/بسته کردن پنل — toggle() بسته را باز و باز را بسته می‌کند */
		toggle: function (want) {
			state.open = (want == null) ? !state.open : !!want;
			state.panel.classList.toggle('open', state.open);
			if (state.onChange) state.onChange(state.open);
		},
	};

	window.CKBCoach = api;
})();
