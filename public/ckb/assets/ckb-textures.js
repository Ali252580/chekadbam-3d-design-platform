/**
 * Chekadbam Studio — Procedural texture generator (WordPress port).
 *
 * Ported 1:1 from src/lib/materials-textures.ts of the Chekadbam Next.js studio.
 * Provides high-fidelity WPC (Wood-Plastic Composite) grooved deck planks,
 * woven Sunbrella canvas fabric, and artificial turf grass fibers.
 *
 * Global namespace: window.CKBTextures
 * Depends on: THREE (loaded before this file)
 */
(function () {
	'use strict';

	if (typeof THREE === 'undefined') {
		return;
	}

	// Cache textures to avoid rebuilding repeatedly
	var textureCache = {};

	function canvasOf(size) {
		var c = document.createElement('canvas');
		c.width = size;
		c.height = size;
		return c;
	}

	/**
	 * WPC grooved plank texture: color map + bump map + roughness map.
	 * Mirrors createWpcPlankTexture() of the Next.js studio.
	 *
	 * @param {string} baseHex  Base wood color, e.g. "#4a321f"
	 * @param {number} grainDarkness  0..1
	 * @param {number} plankCount  Number of planks across the texture
	 */
	function createWpcPlankTexture(baseHex, grainDarkness, plankCount) {
		grainDarkness = typeof grainDarkness === 'number' ? grainDarkness : 0.22;
		plankCount = plankCount || 8;

		var cacheKey = 'wpc-' + baseHex + '-' + grainDarkness + '-' + plankCount;
		if (textureCache[cacheKey]) {
			return {
				map: textureCache[cacheKey],
				bumpMap: textureCache[cacheKey + '-bump'],
				roughnessMap: textureCache[cacheKey + '-rough'],
			};
		}

		var canvas = canvasOf(1024);
		var ctx = canvas.getContext('2d');

		var bumpCanvas = canvasOf(1024);
		var bCtx = bumpCanvas.getContext('2d');

		var roughCanvas = canvasOf(1024);
		var rCtx = roughCanvas.getContext('2d');

		var baseColor = new THREE.Color(baseHex);
		var r = Math.floor(baseColor.r * 255);
		var g = Math.floor(baseColor.g * 255);
		var b = Math.floor(baseColor.b * 255);

		ctx.fillStyle = 'rgb(' + r + ', ' + g + ', ' + b + ')';
		ctx.fillRect(0, 0, 1024, 1024);

		bCtx.fillStyle = '#808080';
		bCtx.fillRect(0, 0, 1024, 1024);

		rCtx.fillStyle = '#999999';
		rCtx.fillRect(0, 0, 1024, 1024);

		var plankWidth = 1024 / plankCount;

		for (var p = 0; p < plankCount; p++) {
			var startX = p * plankWidth;

			// Plank subtle organic color variation
			var plankVariation = Math.sin(p * 2.3) * 0.15 + (Math.random() - 0.5) * 0.08;
			var pr = Math.min(255, Math.max(0, Math.floor(r * (1 + plankVariation))));
			var pg = Math.min(255, Math.max(0, Math.floor(g * (1 + plankVariation))));
			var pb = Math.min(255, Math.max(0, Math.floor(b * (1 + plankVariation))));

			ctx.fillStyle = 'rgb(' + pr + ', ' + pg + ', ' + pb + ')';
			ctx.fillRect(startX + 2, 0, plankWidth - 4, 1024);

			// Fine extrusion longitudinal micro-grooves (WPC linear anti-slip grooves)
			var grooveCount = 12;
			var grooveStep = (plankWidth - 4) / grooveCount;
			for (var gIdx = 0; gIdx < grooveCount; gIdx++) {
				var gx = startX + 2 + gIdx * grooveStep;

				// Shadow edge of groove
				ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.moveTo(gx, 0);
				ctx.lineTo(gx, 1024);
				ctx.stroke();

				// Highlight edge of groove
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(gx + 1.5, 0);
				ctx.lineTo(gx + 1.5, 1024);
				ctx.stroke();

				// Bump groove
				bCtx.strokeStyle = '#383838';
				bCtx.lineWidth = 2.5;
				bCtx.beginPath();
				bCtx.moveTo(gx, 0);
				bCtx.lineTo(gx, 1024);
				bCtx.stroke();

				// Roughness variation on groove edges
				rCtx.strokeStyle = '#bbbbbb';
				rCtx.lineWidth = 2;
				rCtx.beginPath();
				rCtx.moveTo(gx, 0);
				rCtx.lineTo(gx, 1024);
				rCtx.stroke();
			}

			// Wood polymer fiber noise & organic grain streaks
			for (var f = 0; f < 450; f++) {
				var fx = startX + 2 + Math.random() * (plankWidth - 4);
				var fy = Math.random() * 1024;
				var fLen = 40 + Math.random() * 140;
				var alpha = 0.05 + Math.random() * 0.14;

				ctx.strokeStyle =
					Math.random() > 0.4
						? 'rgba(0, 0, 0, ' + alpha + ')'
						: 'rgba(255, 255, 255, ' + alpha * 0.8 + ')';
				ctx.lineWidth = 0.8 + Math.random() * 1.6;
				ctx.beginPath();
				ctx.moveTo(fx, fy);
				ctx.lineTo(fx + (Math.random() - 0.5) * 4, fy + fLen);
				ctx.stroke();
			}

			// Deep black seam gap between modular WPC planks
			ctx.fillStyle = '#0a0a0a';
			ctx.fillRect(startX, 0, 3, 1024);
			ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
			ctx.fillRect(startX + 3, 0, 1, 1024);

			bCtx.fillStyle = '#000000';
			bCtx.fillRect(startX, 0, 4, 1024);
			bCtx.fillStyle = '#ffffff';
			bCtx.fillRect(startX + 4, 0, 1, 1024);

			rCtx.fillStyle = '#ffffff';
			rCtx.fillRect(startX, 0, 4, 1024);
		}

		// Cross modular fasteners & fixings
		for (var sY = 80; sY < 1024; sY += 240) {
			for (var p2 = 0; p2 < plankCount; p2++) {
				var sX = p2 * plankWidth + plankWidth / 2;

				ctx.fillStyle = 'rgba(30, 30, 30, 0.5)';
				ctx.beginPath();
				ctx.arc(sX, sY, 3.5, 0, Math.PI * 2);
				ctx.fill();

				bCtx.fillStyle = '#151515';
				bCtx.beginPath();
				bCtx.arc(sX, sY, 3.5, 0, Math.PI * 2);
				bCtx.fill();
			}
		}

		var texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(1, 1);

		var bumpTexture = new THREE.CanvasTexture(bumpCanvas);
		bumpTexture.wrapS = THREE.RepeatWrapping;
		bumpTexture.wrapT = THREE.RepeatWrapping;
		bumpTexture.repeat.set(1, 1);

		var roughTexture = new THREE.CanvasTexture(roughCanvas);
		roughTexture.wrapS = THREE.RepeatWrapping;
		roughTexture.wrapT = THREE.RepeatWrapping;
		roughTexture.repeat.set(1, 1);

		textureCache[cacheKey] = texture;
		textureCache[cacheKey + '-bump'] = bumpTexture;
		textureCache[cacheKey + '-rough'] = roughTexture;

		return { map: texture, bumpMap: bumpTexture, roughnessMap: roughTexture };
	}

	/**
	 * Woven Sunbrella canvas fabric texture for umbrella canopy & lounge cushions.
	 * Mirrors createCanvasFabricTexture().
	 */
	function createCanvasFabricTexture(baseHex) {
		baseHex = baseHex || '#f5f2eb';
		var cacheKey = 'canvas-' + baseHex;
		if (textureCache[cacheKey]) {
			return {
				map: textureCache[cacheKey],
				bumpMap: textureCache[cacheKey + '-bump'],
			};
		}

		var canvas = canvasOf(512);
		var ctx = canvas.getContext('2d');

		var bumpCanvas = canvasOf(512);
		var bCtx = bumpCanvas.getContext('2d');

		ctx.fillStyle = baseHex;
		ctx.fillRect(0, 0, 512, 512);

		bCtx.fillStyle = '#808080';
		bCtx.fillRect(0, 0, 512, 512);

		// Micro cross-weave threads
		var step = 4;
		for (var x = 0; x < 512; x += step) {
			for (var y = 0; y < 512; y += step) {
				var isAlt = (x / step + y / step) % 2 === 0;
				ctx.fillStyle = isAlt ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
				ctx.fillRect(x, y, step, step);

				bCtx.fillStyle = isAlt ? '#606060' : '#a0a0a0';
				bCtx.fillRect(x, y, step, step);
			}
		}

		var texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(6, 6);

		var bump = new THREE.CanvasTexture(bumpCanvas);
		bump.wrapS = THREE.RepeatWrapping;
		bump.wrapT = THREE.RepeatWrapping;
		bump.repeat.set(6, 6);

		textureCache[cacheKey] = texture;
		textureCache[cacheKey + '-bump'] = bump;

		return { map: texture, bumpMap: bump };
	}

	/**
	 * Artificial turf grass fiber texture. Mirrors createArtificialTurfTexture().
	 */
	function createArtificialTurfTexture() {
		var cacheKey = 'turf-texture';
		if (textureCache[cacheKey]) {
			return {
				map: textureCache[cacheKey],
				bumpMap: textureCache[cacheKey + '-bump'],
			};
		}

		var canvas = canvasOf(512);
		var ctx = canvas.getContext('2d');

		var bumpCanvas = canvasOf(512);
		var bCtx = bumpCanvas.getContext('2d');

		ctx.fillStyle = '#15803d';
		ctx.fillRect(0, 0, 512, 512);

		bCtx.fillStyle = '#808080';
		bCtx.fillRect(0, 0, 512, 512);

		var gShades = ['#166534', '#15803d', '#22c55e', '#14532d', '#4ade80', '#84cc16'];
		for (var i = 0; i < 18000; i++) {
			var x = Math.random() * 512;
			var y = Math.random() * 512;
			var len = 4 + Math.random() * 8;
			var angle = (Math.random() - 0.5) * 0.8;

			ctx.strokeStyle = gShades[Math.floor(Math.random() * gShades.length)];
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
			ctx.stroke();

			bCtx.strokeStyle = Math.random() > 0.5 ? '#ffffff' : '#404040';
			bCtx.lineWidth = 1;
			bCtx.beginPath();
			bCtx.moveTo(x, y);
			bCtx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
			bCtx.stroke();
		}

		var texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(4, 4);

		var bump = new THREE.CanvasTexture(bumpCanvas);
		bump.wrapS = THREE.RepeatWrapping;
		bump.wrapT = THREE.RepeatWrapping;
		bump.repeat.set(4, 4);

		textureCache[cacheKey] = texture;
		textureCache[cacheKey + '-bump'] = bump;

		return { map: texture, bumpMap: bump };
	}


	/**
	 * Vertical soft streaks for a falling water sheet. Each streak is drawn three
	 * times (offset by the canvas height) so the pattern tiles seamlessly when the
	 * map is scrolled along V every frame.
	 */
	function createFallingWaterTexture() {
		var cnv = document.createElement('canvas');
		cnv.width = 128;
		cnv.height = 256;
		var ctx = cnv.getContext('2d');
		ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
		ctx.fillRect(0, 0, 128, 256);

		for (var i = 0; i < 46; i++) {
			var x = Math.random() * 128;
			var w = 1 + Math.random() * 5;
			var y0 = Math.random() * 256;
			var h = 50 + Math.random() * 170;
			var peak = 0.3 + Math.random() * 0.5;
			for (var dy = -256; dy <= 256; dy += 256) {
				var grad = ctx.createLinearGradient(0, y0 + dy, 0, y0 + dy + h);
				grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
				grad.addColorStop(0.45, 'rgba(240, 249, 255, ' + peak + ')');
				grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
				ctx.fillStyle = grad;
				ctx.fillRect(x, y0 + dy, w, h);
			}
		}

		var texture = new THREE.CanvasTexture(cnv);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		return texture;
	}

	/**
	 * Soft tileable light blotches for a still pool surface — drift the offset
	 * slowly to fake light refraction on the water.
	 */
	function createWaterCausticsTexture() {
		var size = 128;
		var cnv = document.createElement('canvas');
		cnv.width = size;
		cnv.height = size;
		var ctx = cnv.getContext('2d');
		ctx.fillStyle = 'rgb(255, 255, 255)';
		ctx.fillRect(0, 0, size, size);

		for (var i = 0; i < 22; i++) {
			var x = Math.random() * size;
			var y = Math.random() * size;
			var r = 8 + Math.random() * 22;
			for (var dx = -size; dx <= size; dx += size) {
				for (var dy = -size; dy <= size; dy += size) {
					var grad = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
					grad.addColorStop(0, 'rgba(224, 242, 254, 0.55)');
					grad.addColorStop(0.6, 'rgba(186, 230, 253, 0.25)');
					grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
					ctx.fillStyle = grad;
					ctx.beginPath();
					ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}

		var texture = new THREE.CanvasTexture(cnv);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		return texture;
	}

	window.CKBTextures = {
		createWpcPlankTexture: createWpcPlankTexture,
		createCanvasFabricTexture: createCanvasFabricTexture,
		createArtificialTurfTexture: createArtificialTurfTexture,
		createFallingWaterTexture: createFallingWaterTexture,
		createWaterCausticsTexture: createWaterCausticsTexture,
	};

})();
