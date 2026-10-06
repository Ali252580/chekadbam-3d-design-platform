/**
 * Chekadbam Studio — Natural organic foliage & blooming flower generator (WordPress port).
 *
 * Ported 1:1 from src/lib/foliage.ts of the Chekadbam Next.js studio.
 * Builds realistic botanicals:
 *  - Curved, vein-creased, organic leaf blades in varied shades
 *  - Realistic multi-petal blossoms with golden pistils
 *  - Delicate woody stems and drooping vine tendrils
 *  - Multi-tiered tree canopies, ground covers, and hanging vines
 *
 * Global namespace: window.CKBFoliage
 * Depends on: THREE
 */
(function () {
	'use strict';

	if (typeof THREE === 'undefined') {
		return;
	}

	function makeRng(seed) {
		var t = seed >>> 0;
		return function () {
			t += 0x6d2b79f5;
			var x = t;
			x = Math.imul(x ^ (x >>> 15), x | 1);
			x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
			return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
		};
	}

	var LEAF_GREENS = [
		0x284f23, 0x336329, 0x3f762f, 0x4d8a37, 0x5c9f3f,
		0x6bb349, 0x7dc555, 0x466d30, 0x385c27, 0x528738,
		0x86b847, 0x98ca53,
	];

	var LEAF_ACCENTS = [0x9ec758, 0xaed866, 0xb8884c, 0x8a5b33, 0x704322];

	// Rich natural garden flower colors
	var FLOWER_PALETTES = [
		{ petals: 0xfbf9f5, center: 0xf5c342 }, // White Jasmine
		{ petals: 0xf7cad7, center: 0xeb984e }, // Soft Pink Rose
		{ petals: 0xf4978e, center: 0xfbc531 }, // Coral Blossom
		{ petals: 0xd8b4f8, center: 0xf6e58d }, // Lavender Lilac
		{ petals: 0xffeaa7, center: 0xe67e22 }, // Golden Yellow
	];

	var geometryCache = new Map();
	var materialCache = new Map();

	function getCurvedLeafGeometry(lengthBucket) {
		var key = 'leaf-curved-' + lengthBucket;
		var cached = geometryCache.get(key);
		if (cached) return cached;

		var len = lengthBucket / 100;
		var wid = len * 0.48;

		var geo = new THREE.PlaneGeometry(wid, len, 6, 9);
		var pos = geo.attributes.position;

		for (var i = 0; i < pos.count; i++) {
			var x = pos.getX(i);
			var y = pos.getY(i);
			// 0 at base, 1 at tip — clamped to avoid float epsilon producing NaN in Math.pow
			var t = Math.min(1, Math.max(0, (y + len / 2) / len));

			// Leaf contour profile (egg/spear shaped)
			var profile = Math.sin(Math.PI * Math.pow(t, 0.68));
			var nx = x * profile;

			// V-shaped central midrib crease
			var crease = Math.abs(x) * 0.22;
			// Organic lengthwise tip droop
			var droop = -Math.pow(t, 2.2) * len * 0.35;
			// Subtle natural flutter wave
			var wave = Math.sin(t * Math.PI * 3) * len * 0.035;

			pos.setX(i, nx);
			pos.setZ(i, crease + droop * 0.4 + wave);
			pos.setY(i, y + droop * 0.28);
		}

		pos.needsUpdate = true;
		geo.computeVertexNormals();
		geo.computeBoundingBox();
		geo.computeBoundingSphere();
		geometryCache.set(key, geo);
		return geo;
	}

	function getPetalGeometry(sizeBucket) {
		var key = 'petal-' + sizeBucket;
		var cached = geometryCache.get(key);
		if (cached) return cached;

		var size = sizeBucket / 1000;
		var geo = new THREE.PlaneGeometry(size * 0.85, size * 1.3, 4, 5);
		var pos = geo.attributes.position;

		for (var i = 0; i < pos.count; i++) {
			var x = pos.getX(i);
			var y = pos.getY(i);
			// clamped to avoid float epsilon producing NaN in Math.pow
			var t = Math.min(1, Math.max(0, (y + (size * 1.3) / 2) / (size * 1.3)));

			var profile = Math.sin(Math.PI * Math.pow(t, 0.75));
			var nx = x * profile;
			var cup = -Math.pow(t, 1.8) * size * 0.28 + (1 - Math.pow(x / (size * 0.4 || 1), 2)) * size * 0.12;

			pos.setX(i, nx);
			pos.setZ(i, cup);
			pos.setY(i, y);
		}

		pos.needsUpdate = true;
		geo.computeVertexNormals();
		geo.computeBoundingBox();
		geo.computeBoundingSphere();
		geometryCache.set(key, geo);
		return geo;
	}

	function getStemGeometry(heightBucket) {
		var key = 'stem-' + heightBucket;
		var cached = geometryCache.get(key);
		if (cached) return cached;

		var h = heightBucket / 100;
		var geo = new THREE.CylinderGeometry(h * 0.016, h * 0.03, h, 6, 2);
		geometryCache.set(key, geo);
		return geo;
	}

	function getLeafMaterial(color) {
		var key = 'leaf-mat-' + color;
		var cached = materialCache.get(key);
		if (cached) return cached;

		var mat = new THREE.MeshStandardMaterial({
			color: color,
			roughness: 0.65,
			metalness: 0.02,
			side: THREE.DoubleSide,
			flatShading: false,
		});
		materialCache.set(key, mat);
		return mat;
	}

	function getStemMaterial() {
		var key = 'stem-mat-natural';
		var cached = materialCache.get(key);
		if (cached) return cached;

		var mat = new THREE.MeshStandardMaterial({
			color: 0x435427,
			roughness: 0.88,
			metalness: 0.01,
		});
		materialCache.set(key, mat);
		return mat;
	}

	function getFlowerMaterial(color, isCenter) {
		var key = 'fl-mat-' + color + '-' + (isCenter ? 1 : 0);
		var cached = materialCache.get(key);
		if (cached) return cached;

		var mat = new THREE.MeshStandardMaterial({
			color: color,
			roughness: isCenter ? 0.9 : 0.48,
			metalness: 0.01,
			side: THREE.DoubleSide,
			emissive: new THREE.Color(color).multiplyScalar(isCenter ? 0.2 : 0.08),
		});
		materialCache.set(key, mat);
		return mat;
	}

	/**
	 * Creates a lush, multi-layered natural shrub cluster with realistic
	 * individual curved leaves and detailed blossoms.
	 *
	 * @param {object} options {radius, seed, density, heightScale, withFlowers, withStems, tone, castShadow}
	 */
	function createFoliageCluster(options) {
		options = options || {};
		var radius = options.radius !== undefined ? options.radius : 0.26;
		var seed = options.seed !== undefined ? options.seed : 1;
		var density = options.density !== undefined ? options.density : 1;
		var heightScale = options.heightScale !== undefined ? options.heightScale : 1;
		var withFlowers = !!options.withFlowers;
		var withStems = options.withStems !== undefined ? options.withStems : true;
		var tone = options.tone || 'normal';
		var castShadow = options.castShadow !== undefined ? options.castShadow : true;

		var rng = makeRng(seed * 9176 + Math.round(radius * 1000));
		var group = new THREE.Group();

		var toneOffset = tone === 'light' ? 4 : tone === 'dark' ? 0 : 2;

		// Soft shaded inner core for depth
		var coreGeo = new THREE.IcosahedronGeometry(radius * 0.65, 1);
		var corePos = coreGeo.attributes.position;
		for (var ci = 0; ci < corePos.count; ci++) {
			var lump = 1 + (rng() - 0.5) * 0.26;
			corePos.setXYZ(
				ci,
				corePos.getX(ci) * lump,
				corePos.getY(ci) * lump * heightScale,
				corePos.getZ(ci) * lump
			);
		}
		corePos.needsUpdate = true;
		coreGeo.computeVertexNormals();
		coreGeo.computeBoundingBox();
		coreGeo.computeBoundingSphere();

		var coreMesh = new THREE.Mesh(
			coreGeo,
			getLeafMaterial(LEAF_GREENS[(toneOffset + 1) % LEAF_GREENS.length])
		);
		coreMesh.castShadow = castShadow;
		group.add(coreMesh);

		// Subtle natural branching stems
		if (withStems) {
			var stemCount = Math.max(2, Math.round(3 * density));
			for (var s = 0; s < stemCount; s++) {
				var h = radius * (1.2 + rng() * 0.5);
				var stem = new THREE.Mesh(getStemGeometry(Math.round(h * 100)), getStemMaterial());
				var lean = 0.16 + rng() * 0.28;
				var az = rng() * Math.PI * 2;
				stem.position.set(0, (h / 2) * heightScale - radius * 0.35, 0);
				stem.rotation.z = Math.cos(az) * lean;
				stem.rotation.x = Math.sin(az) * lean;
				stem.castShadow = castShadow;
				group.add(stem);
			}
		}

		// Realistic individual curved leaf blades
		var leafCount = Math.max(12, Math.round(30 * density));
		for (var i = 0; i < leafCount; i++) {
			var u = (i + 0.5) / leafCount;
			var phi = Math.acos(1 - 2 * u);
			var theta = Math.PI * (1 + Math.sqrt(5)) * i + rng() * 0.85;

			var shell = radius * (0.74 + rng() * 0.36);
			var px = Math.sin(phi) * Math.cos(theta) * shell;
			var py = Math.cos(phi) * shell * heightScale;
			var pz = Math.sin(phi) * Math.sin(theta) * shell;

			var leafLen = radius * (0.75 + rng() * 0.55);
			var bucket = Math.max(6, Math.round(leafLen * 100));

			var paletteIndex = Math.floor(rng() * 5) + toneOffset;
			var useAccent = rng() > 0.85;
			var color = useAccent
				? LEAF_ACCENTS[Math.floor(rng() * LEAF_ACCENTS.length)]
				: LEAF_GREENS[paletteIndex % LEAF_GREENS.length];

			var leaf = new THREE.Mesh(getCurvedLeafGeometry(bucket), getLeafMaterial(color));
			leaf.position.set(px, py, pz);

			leaf.lookAt(px * 2.5, py * 2.5 + radius * 0.3, pz * 2.5);
			leaf.rotateX(-Math.PI / 2 + (rng() - 0.5) * 0.65);
			leaf.rotateZ((rng() - 0.5) * Math.PI);
			leaf.rotateY((rng() - 0.5) * 0.55);

			leaf.castShadow = castShadow;
			group.add(leaf);
		}

		// Realistic blossoming flowers with 5 curved petals & stamens
		if (withFlowers) {
			var flowerCount = Math.max(3, Math.round(7 * density));
			var flPalette = FLOWER_PALETTES[Math.floor(rng() * FLOWER_PALETTES.length)];
			var petalBucket = Math.max(12, Math.round(radius * 130));
			var petalGeo = getPetalGeometry(petalBucket);

			for (var f = 0; f < flowerCount; f++) {
				var az2 = rng() * Math.PI * 2;
				var el = (rng() - 0.15) * Math.PI * 0.6;
				var shell2 = radius * (0.88 + rng() * 0.28);

				var fx = Math.cos(el) * Math.cos(az2) * shell2;
				var fy = Math.sin(el) * shell2 * heightScale + radius * 0.16;
				var fz = Math.cos(el) * Math.sin(az2) * shell2;

				var flower = new THREE.Group();
				var pCount = 5;
				var petalDist = radius * 0.06;

				for (var p = 0; p < pCount; p++) {
					var pa = (p / pCount) * Math.PI * 2 + (rng() - 0.5) * 0.15;
					var petal = new THREE.Mesh(petalGeo, getFlowerMaterial(flPalette.petals));
					petal.position.set(Math.cos(pa) * petalDist, Math.sin(pa) * petalDist, 0);
					petal.rotation.z = pa + Math.PI / 2;
					petal.rotation.x = (rng() - 0.5) * 0.2;
					flower.add(petal);
				}

				// Golden center stamen ball
				var centerGeo = new THREE.SphereGeometry(radius * 0.045, 7, 6);
				var centerMesh = new THREE.Mesh(centerGeo, getFlowerMaterial(flPalette.center, true));
				centerMesh.position.set(0, 0, radius * 0.015);
				flower.add(centerMesh);

				flower.position.set(fx, fy, fz);
				flower.lookAt(fx * 2, fy * 2 + 0.1, fz * 2);
				flower.rotateZ(rng() * Math.PI * 2);

				group.add(flower);
			}
		}

		return group;
	}

	/**
	 * Builds a natural multi-tiered tree canopy with organic density.
	 */
	function createTreeCanopy(radius, seed, withFlowers) {
		radius = radius !== undefined ? radius : 0.54;
		seed = seed !== undefined ? seed : 7;

		var rng = makeRng(seed * 3301);
		var canopy = new THREE.Group();

		var lobes = [
			{ r: radius, x: 0, y: 0, z: 0, tone: 'normal' },
			{ r: radius * 0.76, x: radius * 0.54, y: radius * 0.38, z: radius * 0.22, tone: 'light' },
			{ r: radius * 0.7, x: -radius * 0.52, y: radius * 0.24, z: -radius * 0.26, tone: 'dark' },
			{ r: radius * 0.62, x: radius * 0.12, y: radius * 0.64, z: -radius * 0.36, tone: 'light' },
			{ r: radius * 0.58, x: -radius * 0.22, y: -radius * 0.28, z: radius * 0.46, tone: 'normal' },
		];

		lobes.forEach(function (lobe, i) {
			var cluster = createFoliageCluster({
				radius: lobe.r,
				seed: seed * 31 + i * 17,
				density: 1.2,
				heightScale: 0.94,
				withStems: false,
				withFlowers: withFlowers && i % 2 === 0,
				tone: lobe.tone,
			});
			cluster.position.set(
				lobe.x + (rng() - 0.5) * radius * 0.08,
				lobe.y + (rng() - 0.5) * radius * 0.08,
				lobe.z + (rng() - 0.5) * radius * 0.08
			);
			canopy.add(cluster);
		});

		return canopy;
	}

	/**
	 * Trailing hanging vines for vertical green walls with drooping foliage runners.
	 */
	function createVineCluster(radius, seed, trailLength) {
		radius = radius !== undefined ? radius : 0.2;
		seed = seed !== undefined ? seed : 3;
		trailLength = trailLength !== undefined ? trailLength : 0.34;

		var rng = makeRng(seed * 7717);
		var vine = new THREE.Group();

		var main = createFoliageCluster({
			radius: radius,
			seed: seed * 13,
			density: 1.15,
			heightScale: 1.1,
			withStems: false,
			withFlowers: rng() > 0.4,
			tone: rng() > 0.5 ? 'normal' : 'light',
		});
		vine.add(main);

		var runners = 2 + Math.floor(rng() * 2);
		for (var r = 0; r < runners; r++) {
			var runner = new THREE.Group();
			var drop = trailLength * (0.65 + rng() * 0.65);

			var stem = new THREE.Mesh(getStemGeometry(Math.round(drop * 100)), getStemMaterial());
			stem.position.y = -drop / 2;
			stem.rotation.z = (rng() - 0.5) * 0.3;
			runner.add(stem);

			var leavesOnRunner = 3 + Math.floor(rng() * 3);
			for (var l = 0; l < leavesOnRunner; l++) {
				var t = (l + 1) / (leavesOnRunner + 1);
				var leafLen = radius * (0.52 + rng() * 0.35);
				var leaf = new THREE.Mesh(
					getCurvedLeafGeometry(Math.max(6, Math.round(leafLen * 100))),
					getLeafMaterial(LEAF_GREENS[Math.floor(rng() * LEAF_GREENS.length)])
				);
				leaf.position.set((rng() - 0.5) * radius * 0.35, -drop * t, (rng() - 0.5) * radius * 0.35);
				leaf.rotation.set(
					-Math.PI / 2 + (rng() - 0.5) * 0.7,
					rng() * Math.PI * 2,
					(rng() - 0.5) * 0.7
				);
				leaf.castShadow = true;
				runner.add(leaf);
			}

			runner.position.set(
				(rng() - 0.5) * radius * 1.2,
				-radius * 0.3,
				(rng() - 0.5) * radius * 0.6 + radius * 0.2
			);
			vine.add(runner);
		}

		return vine;
	}

	/**
	 * Ground-cover planter filler with fresh green blades and scattered blossoms.
	 */
	function createGroundCover(width, depth, seed, withFlowers) {
		seed = seed !== undefined ? seed : 5;
		if (withFlowers === undefined) withFlowers = true;

		var rng = makeRng(seed * 4421);
		var cover = new THREE.Group();

		var clumps = Math.max(3, Math.round(width / 0.24));
		for (var c = 0; c < clumps; c++) {
			var r = 0.11 + rng() * 0.07;
			var clump = createFoliageCluster({
				radius: r,
				seed: seed * 53 + c * 29,
				density: 0.95,
				heightScale: 0.8,
				withStems: false,
				withFlowers: withFlowers && rng() > 0.4,
				tone: rng() > 0.55 ? 'light' : 'normal',
			});
			clump.position.set(
				-width / 2 + 0.08 + (c * (width - 0.16)) / Math.max(1, clumps - 1) + (rng() - 0.5) * 0.04,
				r * 0.55,
				(rng() - 0.5) * Math.max(0.02, depth - 0.16)
			);
			cover.add(clump);
		}

		return cover;
	}

	/** Deterministic seed from an arbitrary string id (used by model builders). */
	function seedFromId(id) {
		var str = String(id || 'x');
		var h = 0;
		for (var i = 0; i < str.length; i++) {
			h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
		}
		return Math.abs(h % 100000) || 1;
	}

	window.CKBFoliage = {
		createFoliageCluster: createFoliageCluster,
		createTreeCanopy: createTreeCanopy,
		createVineCluster: createVineCluster,
		createGroundCover: createGroundCover,
		seedFromId: seedFromId,
	};
})();
