/* Chekadbam Studio Manager - plan items repeater */
(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var root = document.getElementById('ckb-plan-items');
		if (!root || typeof CKB_ADMIN === 'undefined') {
			return;
		}

		var tbody = document.getElementById('ckb-items-rows');
		var hidden = document.getElementById('ckb-plan-items-input');
		var addBtn = document.getElementById('ckb-add-item');
		var products = CKB_ADMIN.products || [];
		var strings = CKB_ADMIN.strings || {};

		var items = [];
		try {
			items = JSON.parse(root.getAttribute('data-items') || '[]') || [];
		} catch (e) {
			items = [];
		}
		if (!Array.isArray(items)) {
			items = [];
		}

		function productOptions(selectedId) {
			var html = '<option value="">—</option>';
			products.forEach(function (p) {
				var val = p.code || String(p.id);
				html += '<option value="' + val + '"' +
					(val === selectedId ? ' selected' : '') +
					' data-w="' + p.w + '" data-d="' + p.d + '" data-h="' + p.h + '" data-shape="' + p.shape + '"' +
					'>' + escapeHtml(p.title) + ' (' + escapeHtml(p.code || '') + ')</option>';
			});
			return html;
		}

		function escapeHtml(s) {
			return String(s == null ? '' : s)
				.replace(/&/g, '&amp;').replace(/</g, '&lt;')
				.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		function dimsText(w, d, h) {
			var parts = [w, d];
			if (h) { parts.push(h); }
			var txt = parts.map(function (n) { return Number(n || 0).toString(); }).join(' × ');
			return txt + ' m';
		}

		function buildRow(item) {
			item = item || { productId: '', name: '', x: 0, z: 0, rotation: 0, w: 0, d: 0, h: 0 };
			var tr = document.createElement('tr');
			tr.innerHTML =
				'<td><select class="ckb-item-product">' + productOptions(item.productId) + '</select></td>' +
				'<td class="ckb-item-dims" dir="ltr" style="color:#646970;font-size:12px;">' + escapeHtml(dimsText(item.w, item.d, item.h)) + '</td>' +
				'<td><input type="number" step="0.1" class="ckb-item-x" value="' + (item.x || 0) + '"></td>' +
				'<td><input type="number" step="0.1" class="ckb-item-z" value="' + (item.z || 0) + '"></td>' +
				'<td><select class="ckb-item-rot">' +
					[0, 45, 90, 135, 180, 225, 270, 315].map(function (a) {
						return '<option value="' + a + '"' + (Number(item.rotation) === a ? ' selected' : '') + '>' + a + '°</option>';
					}).join('') +
				'</select></td>' +
				'<td><button type="button" class="ckb-row-remove" title="' + escapeHtml(strings.remove || 'حذف') + '">✕</button></td>';

			function refreshDims(opt) {
				item.w = parseFloat(opt.getAttribute('data-w')) || 0;
				item.d = parseFloat(opt.getAttribute('data-d')) || 0;
				item.h = parseFloat(opt.getAttribute('data-h')) || 0;
				tr.querySelector('.ckb-item-dims').textContent = dimsText(item.w, item.d, item.h);
			}

			tr.querySelector('.ckb-item-product').addEventListener('change', function () {
				var opt = this.options[this.selectedIndex];
				item.name = opt.textContent.replace(/\s*\([^)]*\)$/, '');
				item.productId = this.value;
				refreshDims(opt);
				serialize();
			});

			tr.querySelector('.ckb-item-x').addEventListener('input', function () { item.x = parseFloat(this.value) || 0; serialize(); });
			tr.querySelector('.ckb-item-z').addEventListener('input', function () { item.z = parseFloat(this.value) || 0; serialize(); });
			tr.querySelector('.ckb-item-rot').addEventListener('change', function () { item.rotation = parseFloat(this.value) || 0; serialize(); });
			tr.querySelector('.ckb-row-remove').addEventListener('click', function () {
				var idx = items.indexOf(item);
				if (idx > -1) { items.splice(idx, 1); }
				tr.remove();
				serialize();
			});

			// keep name/productId in sync initially
			if (!item.name) {
				var sel = tr.querySelector('.ckb-item-product');
				if (sel.value) {
					var o = sel.options[sel.selectedIndex];
					item.name = o.textContent.replace(/\s*\([^)]*\)$/, '');
					item.w = parseFloat(o.getAttribute('data-w')) || item.w || 0;
					item.d = parseFloat(o.getAttribute('data-d')) || item.d || 0;
				}
			}
			return tr;
		}

		function serialize() {
			hidden.value = JSON.stringify(items);
		}

		items.forEach(function (it) {
			tbody.appendChild(buildRow(it));
		});

		addBtn.addEventListener('click', function () {
			var it = { productId: '', name: '', x: 0, z: 0, rotation: 0, w: 0, d: 0, h: 0 };
			items.push(it);
			tbody.appendChild(buildRow(it));
			serialize();
		});

		// Safety: always serialize right before the post form submits.
		var form = document.getElementById('post');
		if (form) {
			form.addEventListener('submit', serialize);
		}
	});
})();
