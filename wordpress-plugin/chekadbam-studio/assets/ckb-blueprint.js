/**
 * Chekadbam Studio — Plan blueprint thumbnails (WordPress port of
 * PlanBlueprintThumbnail.tsx). Architectural mini-plans with dimension
 * chains, hatch decks and a north arrow — drawn as inline SVG.
 *
 * Global namespace: window.CKBBlueprint
 */
(function () {
	'use strict';

	var seq = 0;
	var DIM_LINE = '#7dd3fc';
	var DIM_TEXT = '#f0f9ff';

	function fa(n) {
		try { return Number(n).toLocaleString('fa-IR', { maximumFractionDigits: 1 }); } catch (e) { return String(n); }
	}

	function dimPill(x, y, text) {
		var w = text.length * 7.6 + 18;
		return '<rect x="' + (x - w / 2) + '" y="' + (y - 10) + '" width="' + w + '" height="20" rx="10" fill="#0b1220" stroke="' + DIM_LINE + '" stroke-width="1"/>' +
			'<text x="' + x + '" y="' + (y + 4.5) + '" fill="' + DIM_TEXT + '" font-size="11.5" font-weight="bold" text-anchor="middle" font-family="monospace">' + text + '</text>';
	}

	function dimTick(x, y) {
		return '<line x1="' + (x - 4.5) + '" y1="' + (y + 4.5) + '" x2="' + (x + 4.5) + '" y2="' + (y - 4.5) + '" stroke="' + DIM_LINE + '" stroke-width="1.6" stroke-linecap="round"/>';
	}

	function planDimensions(x1, x2, y1, y2, width, length, netArea) {
		var cx = (x1 + x2) / 2;
		var cy = (y1 + y2) / 2;
		var gap = 4, over = 6;
		var hy = y1 - 16, vx = x2 + 16;
		var s = '';
		s += '<line x1="' + x1 + '" y1="' + (y1 - gap) + '" x2="' + x1 + '" y2="' + (hy - over) + '" stroke="' + DIM_LINE + '" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>';
		s += '<line x1="' + x2 + '" y1="' + (y1 - gap) + '" x2="' + x2 + '" y2="' + (hy - over) + '" stroke="' + DIM_LINE + '" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>';
		s += '<line x1="' + x1 + '" y1="' + hy + '" x2="' + x2 + '" y2="' + hy + '" stroke="' + DIM_LINE + '" stroke-width="1.2"/>';
		s += dimTick(x1, hy) + dimTick(x2, hy);
		s += dimPill(cx, hy, fa(width) + ' m');
		s += '<line x1="' + (x2 + gap) + '" y1="' + y1 + '" x2="' + (vx + over) + '" y2="' + y1 + '" stroke="' + DIM_LINE + '" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>';
		s += '<line x1="' + (x2 + gap) + '" y1="' + y2 + '" x2="' + (vx + over) + '" y2="' + y2 + '" stroke="' + DIM_LINE + '" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.75"/>';
		s += '<line x1="' + vx + '" y1="' + y1 + '" x2="' + vx + '" y2="' + y2 + '" stroke="' + DIM_LINE + '" stroke-width="1.2"/>';
		s += dimTick(vx, y1) + dimTick(vx, y2);
		s += dimPill(vx, cy, fa(length) + ' m');
		s += '<g><rect x="' + (x2 - 136) + '" y="' + (y2 - 30) + '" width="130" height="22" rx="11" fill="#052e1f" stroke="#10b981" stroke-width="1.2"/>' +
			'<text x="' + (x2 - 71) + '" y="' + (y2 - 15) + '" fill="#6ee7b7" font-size="10.5" font-weight="bold" text-anchor="middle">' + 'متراژ خالص: ' + fa(netArea) + ' m²</text></g>';
		return s;
	}

	function northArrow() {
		return '<g transform="translate(26, 224)"><circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>' +
			'<polygon points="0,-11 4,4 0,1 -4,4" fill="#38bdf8"/>' +
			'<text x="0" y="-16" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="middle" font-family="monospace">N</text></g>';
	}

	var DECK_DEFS = '<defs><pattern id="wpc-deck-PAT" width="6" height="6" patternUnits="userSpaceOnUse" pattern-transform="rotate(45)">' +
		'<line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" stroke-width="0.6" stroke-opacity="0.4"/></pattern></defs>';
	var DECK_FILL = 'url(#wpc-deck-PAT)';

	function lShaped(width, length, netArea) {
		return '<path d="M 50 35 L 340 35 L 340 120 L 210 120 L 210 215 L 50 215 Z" fill="#0f1f38" stroke="#e2e8f0" stroke-width="3.5"/>' +
			'<path d="M 54 39 L 336 39 L 336 116 L 206 116 L 206 211 L 54 211 Z" fill="#13233f" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3"/>' +
			'<path d="M 54 39 L 336 39 L 336 116 L 206 116 L 206 211 L 54 211 Z" fill="' + DECK_FILL + '"/>' +
			'<rect x="65" y="48" width="90" height="90" fill="#1e293b" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 2"/>' +
			'<rect x="235" y="48" width="70" height="26" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>' +
			'<text x="270" y="64" fill="#ffffff" font-size="7" font-weight="bold" text-anchor="middle">کاناپه دو نفره</text>' +
			'<rect x="220" y="80" width="28" height="28" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>' +
			'<rect x="292" y="80" width="28" height="28" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>' +
			'<rect x="252" y="82" width="36" height="24" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1"/>' +
			'<rect x="54" y="150" width="16" height="55" fill="#15803d" stroke="#4ade80" stroke-width="1"/>' +
			'<text x="110" y="46" fill="#38bdf8" font-size="9" font-weight="bold" text-anchor="middle">زون ۱: پرگولا و نشیمن</text>' +
			planDimensions(50, 340, 35, 215, width, length, netArea);
	}

	function centralShaft(width, length, netArea) {
		var s = '<rect x="150" y="85" width="90" height="80" fill="#1e293b" stroke="#e2e8f0" stroke-width="2.5"/>';
		for (var y = 92; y <= 158; y += 6) {
			s += '<line x1="152" y1="' + y + '" x2="195" y2="' + y + '" stroke="#64748b" stroke-width="1"/>';
		}
		s += '<rect x="200" y="90" width="35" height="40" fill="#0f172a" stroke="#94a3b8" stroke-width="1"/>' +
			'<text x="195" y="178" fill="#e2e8f0" font-size="8" font-weight="bold" text-anchor="middle">باکس پله و آسانسور</text>' +
			'<rect x="160" y="44" width="70" height="16" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>' +
			'<rect x="160" y="190" width="70" height="16" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>' +
			'<rect x="135" y="90" width="10" height="70" fill="#16a34a" stroke="#86efac" stroke-width="1"/>' +
			'<rect x="245" y="95" width="12" height="60" fill="#06b6d4" stroke="#67e8f9" stroke-width="1"/>' +
			planDimensions(50, 340, 35, 215, width, length, netArea);
		return s;
	}

	function narrowBalcony(width, length, netArea) {
		return '<rect x="40" y="70" width="310" height="110" fill="#0f1f38" stroke="#e2e8f0" stroke-width="3.5"/>' +
			'<rect x="44" y="74" width="302" height="102" fill="#13233f" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3"/>' +
			'<rect x="110" y="80" width="65" height="18" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>' +
			'<text x="142" y="92" fill="#ffffff" font-size="7" font-weight="bold" text-anchor="middle">نیمکت چوب‌پلاست</text>' +
			'<rect x="195" y="78" width="85" height="20" fill="#15803d" stroke="#4ade80" stroke-width="1"/>' +
			'<rect x="325" y="80" width="14" height="90" fill="#16a34a" stroke="#86efac" stroke-width="1"/>' +
			planDimensions(40, 350, 70, 180, width, length, netArea);
	}

	function uShaped(width, length, netArea) {
		return '<path d="M 45 35 L 345 35 L 345 215 L 260 215 L 260 115 L 130 115 L 130 215 L 45 215 Z" fill="#0f1f38" stroke="#e2e8f0" stroke-width="3.5"/>' +
			'<path d="M 49 39 L 341 39 L 341 211 L 256 211 L 256 119 L 134 119 L 134 211 L 49 211 Z" fill="#13233f" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3"/>' +
			'<rect x="135" y="120" width="120" height="90" fill="#15803d" fill-opacity="0.4" stroke="#22c55e" stroke-width="1" stroke-dasharray="3 3"/>' +
			'<text x="195" y="165" fill="#86efac" font-size="9" font-weight="bold" text-anchor="middle">حیاط میانی / چمن</text>' +
			'<rect x="55" y="48" width="70" height="70" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4 2"/>' +
			'<rect x="265" y="48" width="70" height="70" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4 2"/>' +
			planDimensions(45, 345, 35, 215, width, length, netArea);
	}

	function rectangular(width, length, netArea) {
		return '<rect x="45" y="35" width="300" height="180" fill="#0f1f38" stroke="#e2e8f0" stroke-width="3.5"/>' +
			'<rect x="49" y="39" width="292" height="172" fill="#13233f" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3"/>' +
			'<rect x="60" y="48" width="85" height="85" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 2"/>' +
			'<rect x="240" y="48" width="55" height="18" fill="#0891b2" stroke="#22d3ee" stroke-width="1"/>' +
			'<rect x="200" y="95" width="30" height="30" rx="3" fill="#ea580c" stroke="#f97316" stroke-width="1"/>' +
			'<rect x="160" y="185" width="80" height="18" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1"/>' +
			'<rect x="315" y="80" width="18" height="60" fill="#15803d" stroke="#4ade80" stroke-width="1"/>' +
			planDimensions(45, 345, 35, 215, width, length, netArea);
	}

	var VARIANTS = {
		l_shaped: lShaped,
		central_shaft: centralShaft,
		narrow_balcony: narrowBalcony,
		u_shaped: uShaped,
		rectangular: rectangular,
		penthouse_split: rectangular,
	};

	/** Returns the full inline SVG for one plan card. */
	function svg(plan) {
		seq++;
		var pat = 'wpc-deck-' + seq;
		var variant = VARIANTS[plan.shape] || rectangular;
		var netArea = (window.CKBBoundary && window.CKBBoundary.calculatePlanArea)
			? window.CKBBoundary.calculatePlanArea(plan)
			: Math.round(plan.width * plan.length);
		var body = DECK_DEFS.replace('PAT', pat) + variant(plan.width, plan.length, netArea).replace(/wpc-deck-PAT/g, pat);
		return '<svg viewBox="0 0 400 250" class="ckb-bp-svg" xmlns="http://www.w3.org/2000/svg">' +
			'<defs><pattern id="bp-grid-' + seq + '" width="20" height="20" patternUnits="userSpaceOnUse">' +
			'<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" stroke-width="0.5"/></pattern></defs>' +
			'<rect width="400" height="250" fill="url(#bp-grid-' + seq + ')" opacity="0.2"/>' +
			body + northArrow() + '</svg>';
	}

	window.CKBBlueprint = { svg: svg };
})();
