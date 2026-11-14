/**
 * Chekadbam Studio (WordPress) — Live 3D preview in the admin product editor.
 *
 * Renders the current item inside the "پیش‌نمایش سه‌بعدی محصول" metabox and
 * rebuilds it live as the editor changes size, shape and material colors —
 * before saving, so adding an object with its own dimensions is visual.
 */
(function () {
	'use strict';

	function readProduct() {
		function val(sel) {
			var el = document.querySelector(sel);
			return el ? String(el.value || '') : '';
		}
		function checked(sel) {
			var el = document.querySelector(sel);
			return !!(el && el.checked);
		}
		function num(sel, dflt) {
			var v = parseFloat(val(sel));
			return isFinite(v) && v > 0 ? v : dflt;
		}
		return {
			code: val('[name=ckb_code]') || 'custom',
			name: val('#title') || 'قلم جدید',
			category: val('[name=ckb_category]') || 'planting',
			w: num('#ckb_width', 1.2),
			d: num('#ckb_depth', 0.5),
			h: num('#ckb_height', 0.5),
			shape: val('[name=ckb_shape_type]') || 'box',
			wpcColor: val('[name=ckb_wpc_color]') || 'walnut',
			metalColor: val('[name=ckb_metal_color]') || 'black',
			light: checked('[name=ckb_has_lighting]'),
		};
	}

	function boot() {
		var holder = document.getElementById('ckb-admin-preview');
		if (!holder || typeof window.CKBViewer === 'undefined') return;

		var initial = null;
		try { initial = JSON.parse(holder.getAttribute('data-product') || 'null'); } catch (e) { initial = null; }

		var handle = window.CKBViewer.mount('ckb-admin-preview', initial || readProduct());
		if (!handle || !handle.update) return;

		var timer = null;
		function schedule() {
			if (timer) clearTimeout(timer);
			timer = setTimeout(function () {
				handle.update(readProduct());
			}, 250);
		}

		var fields = [
			'[name=ckb_code]', '[name=ckb_category]', '[name=ckb_shape_type]',
			'#ckb_width', '#ckb_depth', '#ckb_height',
			'[name=ckb_wpc_color]', '[name=ckb_metal_color]',
			'[name=ckb_has_lighting]', '#title',
		];
		fields.forEach(function (sel) {
			var el = document.querySelector(sel);
			if (!el) return;
			el.addEventListener('input', schedule);
			el.addEventListener('change', schedule);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();
