/**
 * چکادبام استودیو — گالری الهام (v2.13)
 * ─────────────────────────────────────────────────────────────
 * ویژگی ۲ پروپوزال «همراه طراح»: کارت‌های پروژه‌های اجراشده چکادبام
 * در تب «پلان‌های آماده» مودال نقشه. هر کارت یک چیدمان قابل ویرایش
 * بارگذاری می‌کند — کاربر از یک نمونه واقعی شروع می‌کند، نه از صفر.
 *
 * طراحی ماژولار:
 *   - هیچ وابستگی به Three.js یا بقیه افزونه ندارد؛ فقط DOM مستقل خودش
 *     را داخل تب پلان‌های آماده می‌سازد. هیچ منطق موجودی تغییر نمی‌کند.
 *   - استودیو (studio-app.js) فقط یک نقطه با ماژول تماس می‌گیرد:
 *       CKBInspiration.init({...})   بعد از ساخت مودال نقشه
 *   - دو قابلیت فرعی ماژول (تا منطق اصلی دست‌نخورده بماند):
 *       focus()            برجسته‌کردن گالری — کارت شروع «از پروژه‌های اجراشده»
 *       سفارش نمونه رنگ    دکمه [data-sample-order] در مودال ثبت طرح
 *
 * داده کارت‌ها از سمت سرور می‌آید (cfg.inspiration) و با فیلتر
 * وردپرس ckb_studio_inspiration_projects قابل سفارشی‌سازی است؛
 * هر پروژه با planName یا planId به یک پلان آماده گره خورده است.
 *
 * Global namespace: window.CKBInspiration
 */
(function () {
	'use strict';

	/** وضعیت ماژول — cfg همان پیکانه‌ای است که studio-app.js به init می‌دهد */
	var state = {
		cfg: null,
		row: null,   /* ردیف گالری بعد از ساخت */
	};

	/* ─────────────── ابزارهای کمکی ─────────────── */

	/** تبدیل عدد به رقم فارسی برای نمایش متراژ */
	function fa(n) {
		try { return Number(n).toLocaleString('fa-IR', { maximumFractionDigits: 1 }); }
		catch (e) { return String(n); }
	}

	/** گریز امن HTML برای متن‌های سرور-ساید */
	function esc(s) {
		return String(s == null ? '' : s)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;')
			.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	/** پیدا کردن پلان متناظر با پروژه — اول با شناسه، بعد با نام، آخر با فرم پلان */
	function findPlan(project) {
		var plans = (state.cfg && state.cfg.getPlans()) || [];
		var i, p;
		if (project.planId !== undefined && project.planId !== null && project.planId !== '') {
			for (i = 0; i < plans.length; i++) {
				if (String(plans[i].id) === String(project.planId)) return plans[i];
			}
		}
		if (project.planName) {
			for (i = 0; i < plans.length; i++) {
				if (plans[i].name === project.planName) return plans[i];
			}
		}
		if (project.planShape) {
			for (i = 0; i < plans.length; i++) {
				if (plans[i].shape === project.planShape) return plans[i];
			}
		}
		return null;
	}

	/* ─────────────── رندر گالری ─────────────── */

	/** ساخت یک کارت پروژه */
	function buildCard(project) {
		var plan = findPlan(project);
		var card = document.createElement('div');
		card.className = 'ckb-insp-card';

		/* جلد: تصویر واقعی اگر بود، وگرنه گرادیان برند همان پروژه */
		var cover = document.createElement('div');
		cover.className = 'ckb-insp-cover';
		if (project.gradient) cover.style.background = project.gradient;
		if (project.image) {
			var img = document.createElement('img');
			img.src = project.image;
			img.alt = project.title || '';
			img.loading = 'lazy';
			cover.appendChild(img);
		}
		/* نشان متراژ — از خود پلان گره‌خورده محاسبه می‌شود تا همیشه درست باشد */
		if (plan && state.cfg.planArea) {
			var badge = document.createElement('span');
			badge.className = 'ckb-insp-badge';
			try { badge.textContent = fa(state.cfg.planArea(plan)) + ' م²'; }
			catch (e) { badge.textContent = ''; }
			cover.appendChild(badge);
		}
		card.appendChild(cover);

		/* متن و دکمه بارگذاری */
		var meta = document.createElement('div');
		meta.className = 'ckb-insp-meta';
		meta.innerHTML =
			'<b>' + esc(project.title) + '</b>' +
			'<span>' + esc(project.desc) + '</span>';
		if (plan) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'ckb-catalog-btn ckb-insp-load';
			btn.textContent = 'بارگذاری این چیدمان';
			btn.setAttribute('aria-label', 'بارگذاری چیدمان ' + (project.title || ''));
			btn.onclick = function () { state.cfg.loadPlan(plan); };
			meta.appendChild(btn);
		}
		card.appendChild(meta);
		return card;
	}

	/** ساخت و تزریق ردیف گالری در تب «پلان‌های آماده» */
	function render() {
		var projects = (state.cfg && state.cfg.projects) || [];
		if (!projects.length || state.row) return;

		var tab = state.cfg.root.querySelector('[data-ptab-body="presets"]');
		if (!tab) return;

		var row = document.createElement('div');
		row.className = 'ckb-insp-row';
		row.innerHTML =
			'<div class="ckb-insp-head"><b>گالری الهام</b>' +
			'<span>شروع از پروژه‌های اجراشده چکادبام</span></div>' +
			'<div class="ckb-insp-grid"></div>';

		var grid = row.querySelector('.ckb-insp-grid');
		projects.forEach(function (prj) {
			grid.appendChild(buildCard(prj));
		});

		/* گالری بالای پلان‌های آماده می‌نشیند — همان‌جا که چشم اول می‌رود */
		var anchor = tab.querySelector('.ckb-ptab-hint');
		if (anchor && anchor.parentNode === tab) {
			tab.insertBefore(row, anchor.nextSibling);
		} else {
			tab.insertBefore(row, tab.firstChild);
		}
		state.row = row;
	}

	/* ─────────────── قابلیت‌های فرعی ─────────────── */

	/** برجسته‌کردن گالری — از کارت شروع «از پروژه‌های اجراشده» صدا زده می‌شود */
	function focus() {
		if (!state.row) return;
		state.row.classList.remove('flash');
		/* اجبار reflow تا انیمیشن فلش دوباره اجرا شود */
		void state.row.offsetWidth;
		state.row.classList.add('flash');
		try { state.row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* مرورگر قدیمی */ }
		window.setTimeout(function () { if (state.row) state.row.classList.remove('flash'); }, 1800);
	}

	/** دکمه «سفارش نمونه» — همان فرم ثبت طرح را با متن آماده پر می‌کند */
	function wireSampleOrder() {
		var btn = state.cfg.root.querySelector('[data-sample-order]');
		if (!btn) return;
		btn.addEventListener('click', function () {
			var notes = state.cfg.root.querySelector('[id$="-inp-notes"]');
			var name = state.cfg.root.querySelector('[id$="-inp-name"]');
			if (notes && !notes.value) {
				notes.value = 'درخواست ارسال نمونه رایگان رنگ چوب‌پلاست (درب منزل).';
			}
			try { (name || notes).scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { /* مرورگر قدیمی */ }
			if (name) name.focus();
			else if (notes) notes.focus();
		});
	}

	/* ─────────────── API عمومی ─────────────── */

	window.CKBInspiration = {
		/**
		 * راه‌اندازی ماژول — از studio-app.js بعد از ساخت مودال نقشه صدا زده می‌شود.
		 * cfg = {
		 *   root:      عنصر ریشه استودیو (اسکوپ جستجوی DOM)
		 *   projects:  آرایه پروژه‌ها از سرور (cfg.inspiration)
		 *   getPlans:  () => آرایه پلان‌های آماده
		 *   loadPlan:  (plan) => بارگذاری پلان + بستن مودال
		 *   planArea:  (plan) => متراژ پلان به متر مربع
		 * }
		 */
		init: function (cfg) {
			if (!cfg || !cfg.root) return;
			state.cfg = cfg;
			render();
			wireSampleOrder();
		},
		focus: focus,
	};
})();
