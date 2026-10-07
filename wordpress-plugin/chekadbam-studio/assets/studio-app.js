/**
 * Chekadbam Studio (WordPress) — Studio application engine v2.
 *
 * Full embedded 3D design workflow, ported from the Next.js studio:
 *  - Realistic environment (WPC deck floor, glass parapets, L/U/shaft shapes)
 *  - Realistic 3D models via CKBModels (same as the Next.js studio)
 *  - Plan boundary clamping via CKBBoundary
 *  - BOM calculations via CKBBom
 *  - Day / Sunset / Night lighting with ACES tone mapping
 *  - Orbit + drag with raycast picking, undo/redo, smart snapping, keyboard shortcuts
 *  - Catalog with live 3D thumbnails, plan editor, BOM modal
 *  - AJAX design submission with JPEG screenshot directly into WordPress
 *
 * Exposes: window.CKBStudio.mount(containerId, config)
 */
(function () {
	'use strict';

	function mount(containerId, cfg) {
		var rootEl = document.getElementById(containerId);
		if (!rootEl) return;
		if (typeof THREE === 'undefined' || !window.CKBModels) {
			rootEl.innerHTML =
				'<div style="padding:40px;text-align:center;color:#f87171;direction:rtl;font-weight:bold;">' +
				'کتابخانه Three.js بارگذاری نشده است.' +
				'</div>';
			return;
		}

		var sid = containerId;
		var B = window.CKBBoundary;
		var Models = window.CKBModels;

		/* Mobile/touch devices get the lighter render path: lower pixel ratio,
		   smaller shadow maps, capped frame rate (see MOBILE uses below).
		   v2.8: the PHP side also sniffs the device (wp_is_mobile) and passes it
		   in cfg.isMobile — tablets that report pointer:coarse but have desktop
		   GPUs still get a reasonable pixel ratio that way. */
		var MOBILE = !!(window.matchMedia && (
			window.matchMedia('(max-width: 768px)').matches ||
			window.matchMedia('(pointer: coarse)').matches
		)) || !!cfg.isMobile;

		/* ─────────────── State ─────────────── */
		var products = cfg.products || [];
		var plans = cfg.plans || [];
		var currentPlan = plans[0] || {
			name: 'پلان مستطیلی', shape: 'rectangular', width: 10, length: 8,
			parapetHeight: 1.1, flooringType: 'wpc_wood', wpcColor: 'walnut',
			metalColor: 'black', items: [],
		};

		var space = toSpace(currentPlan);
		var items = [];
		var history = [];
		var historyIndex = -1;
		var selectedId = null;
		var lightingMode = 'day'; /* v2.12.1: پیش‌فرض روز — غروب با دکمه در دسترس است */
		var viewMode = '3d';

		/* ─────────────── Three.js scene ─────────────── */
		var scene = new THREE.Scene();
		var vp = rootEl.querySelector('.ckb-wstudio-viewport');
		/* Mobile v2.8: on phones the editor must fill the real visible viewport
		   (the URL bar problem) — dvh where supported, JS fallback below */
		var initW = vp.clientWidth || 800;
		var initH = vp.clientHeight || 600;

		var camera = new THREE.PerspectiveCamera(45, initW / initH, 0.1, 200);
		var cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 18 };
		var CAM_SENS = MOBILE ? 0.0075 : 0.0055; /* touch orbits need a bit more gain */
		var lookAtTarget = new THREE.Vector3(0, 0, 0);

		var renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false,
			powerPreference: 'high-performance',
			preserveDrawingBuffer: true,
		});
		renderer.setSize(initW, initH);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2));
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.1;
		vp.appendChild(renderer.domElement);

		var lightsGroup = new THREE.Group();
		var envGroup = new THREE.Group();
		var itemsGroup = new THREE.Group();
		scene.add(lightsGroup);
		scene.add(envGroup);
		scene.add(itemsGroup);

		var selectionHelper = null;
		var itemGroups = new Map();   // id -> THREE.Group
		var hitProxies = [];          // invisible picking boxes
		var animatedEffects = [];     // per-frame living effects (water/flames)
		var rooftopWindowsMat = null; // facade glass, lit up at night
		var rooftopFacadeMat = null;  // host-building facade
		var proxyMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

		/* ─────────────── Helpers ─────────────── */
		function toSpace(plan) {
			return {
				shape: plan.shape || 'rectangular',
				width: Number(plan.width) || 10,
				length: Number(plan.length) || 8,
				parapetHeight: plan.parapetHeight || plan.parapet || 1.1,
				flooringType: plan.flooringType || 'wpc_wood',
				wpcColor: plan.wpcColor || 'walnut',
				metalColor: plan.metalColor || 'black',
				cutoutWidth: plan.cutoutWidth || 0,
				cutoutLength: plan.cutoutLength || 0,
				shaftWidth: plan.shaftWidth || 0,
				shaftLength: plan.shaftLength || 0,
			};
		}

		function uid() {
			return 'it-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
		}

		function $(id) {
			return document.getElementById(sid + '-' + id);
		}

		function updateCamera() {
			var t = cameraAngle;
			camera.position.set(
				lookAtTarget.x + t.radius * Math.sin(t.phi) * Math.sin(t.theta),
				lookAtTarget.y + t.radius * Math.cos(t.phi),
				lookAtTarget.z + t.radius * Math.sin(t.phi) * Math.cos(t.theta)
			);
			camera.lookAt(lookAtTarget);
		}

		function resetCamera() {
			var maxDim = Math.max(space.width, space.length);
			cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: Math.max(14, maxDim * 1.6) };
			lookAtTarget.set(0, 0, 0);
			updateCamera();
		}

		function setTopView(isTop) {
			var maxDim = Math.max(space.width, space.length);
			if (isTop) {
				cameraAngle = { theta: 0, phi: 0.05, radius: Math.max(15, maxDim * 1.5) };
			} else {
				resetCamera();
				return;
			}
			updateCamera();
		}

		function clearGroup(grp) {
			if (!grp) return;
			while (grp.children.length > 0) {
				var child = grp.children[0];
				grp.remove(child);
				// Release GPU resources so repeated rebuilds don't leak
				child.traverse(function (obj) {
					if (obj.geometry) obj.geometry.dispose();
					if (obj.material) {
						if (obj.material.map) obj.material.map.dispose();
						if (obj.material.bumpMap) obj.material.bumpMap.dispose();
						obj.material.dispose();
					}
				});
			}
		}

		function fmtPrice(n) {
			try { return Number(n).toLocaleString('fa-IR'); } catch (e) { return String(n); }
		}

		/* ─────────────── Lighting ─────────────── */
		var SHADOW_MAP_SIZE = MOBILE ? 1024 : 2048;

		function updateLighting() {
			clearGroup(lightsGroup);

			// Rooftop facade reacts to the time of day: dark concrete at noon,
			// warm at sunset, and the host building's windows glow at night.
			if (rooftopWindowsMat) {
				rooftopWindowsMat.emissiveIntensity =
					lightingMode === 'night' ? 0.85 : (lightingMode === 'sunset' ? 0.22 : 0.0);
			}
			if (rooftopFacadeMat) {
				rooftopFacadeMat.color.setHex(
					lightingMode === 'night' ? 0x2b3648 : (lightingMode === 'sunset' ? 0xd6c3b0 : 0xcbd5e1));
			}

			if (lightingMode === 'day') {
				scene.background = new THREE.Color(0xdcecf8);
				scene.fog = new THREE.FogExp2(0xdcecf8, 0.01);

				lightsGroup.add(new THREE.HemisphereLight(0xffffff, 0xbfe3b4, 0.9));

				var sun = new THREE.DirectionalLight(0xfffaed, 1.5);
				sun.position.set(22, 32, 16);
				sun.castShadow = true;
				sun.shadow.mapSize.width = SHADOW_MAP_SIZE;
				sun.shadow.mapSize.height = SHADOW_MAP_SIZE;
				sun.shadow.bias = -0.0004;
				var d = 20;
				sun.shadow.camera.left = -d;
				sun.shadow.camera.right = d;
				sun.shadow.camera.top = d;
				sun.shadow.camera.bottom = -d;
				lightsGroup.add(sun);

				var fill = new THREE.DirectionalLight(0xa5d8ff, 0.45);
				fill.position.set(-15, 12, -15);
				lightsGroup.add(fill);
			} else if (lightingMode === 'sunset') {
				scene.background = new THREE.Color(0xfde2c8);
				scene.fog = new THREE.FogExp2(0xfde2c8, 0.012);

				lightsGroup.add(new THREE.HemisphereLight(0xffd1a4, 0x3b2447, 0.7));

				var sun2 = new THREE.DirectionalLight(0xff7a18, 1.7);
				sun2.position.set(25, 9, 12);
				sun2.castShadow = true;
				sun2.shadow.mapSize.width = SHADOW_MAP_SIZE;
				sun2.shadow.mapSize.height = SHADOW_MAP_SIZE;
				lightsGroup.add(sun2);

				var warm = new THREE.DirectionalLight(0xc084fc, 0.5);
				warm.position.set(-15, 10, -10);
				lightsGroup.add(warm);
			} else {
				scene.background = new THREE.Color(0x0a1120);
				scene.fog = new THREE.FogExp2(0x0a1120, 0.015);

				lightsGroup.add(new THREE.HemisphereLight(0x334155, 0x1e293b, 0.6));

				var moon = new THREE.DirectionalLight(0x93c5fd, 0.75);
				moon.position.set(12, 28, 12);
				moon.castShadow = true;
				lightsGroup.add(moon);

				// Soft cool fill from the opposite side keeps the deck readable
				var nightFill = new THREE.DirectionalLight(0x818cf8, 0.3);
				nightFill.position.set(-14, 16, -10);
				lightsGroup.add(nightFill);

				lightsGroup.add(new THREE.AmbientLight(0x2a2a52, 0.7));
			}
		}

		/* ─────────────── Environment (floor + parapets) ─────────────── */

		/** Procedural facade texture: concrete + slab line + lit/unlit windows. */
		function makeFacadeTexture() {
			var c = document.createElement('canvas');
			c.width = 128; c.height = 128;
			var g = c.getContext('2d');

			g.fillStyle = '#93a1b2';
			g.fillRect(0, 0, 128, 128);
			// faint vertical concrete joints
			g.fillStyle = 'rgba(255,255,255,0.06)';
			for (var j = 0; j <= 128; j += 16) g.fillRect(j, 0, 1, 128);
			// slab / floor line
			g.fillStyle = '#6f7d8f';
			g.fillRect(0, 0, 128, 7);

			// 3 × 2 windows; a few of them lit (warm) so night mode reads as a home
			for (var row = 0; row < 2; row++) {
				for (var col = 0; col < 3; col++) {
					var x = 12 + col * 40, y = 20 + row * 56;
					var lit = ((row * 3 + col) % 3 === 0);
					g.fillStyle = lit ? '#ffce8a' : '#2c3648';
					g.fillRect(x, y, 26, 34);
					g.strokeStyle = 'rgba(15,23,42,0.55)';
					g.lineWidth = 2;
					g.strokeRect(x, y, 26, 34);
				}
			}
			var tex = new THREE.CanvasTexture(c);
			tex.wrapS = THREE.RepeatWrapping;
			tex.wrapT = THREE.RepeatWrapping;
			tex.colorSpace = THREE.SRGBColorSpace;
			return tex;
		}

		function buildEnvironment() {
			clearGroup(envGroup);

			var TEX = window.CKBTextures || {};
			var wpcHex = Models.wpcColorHexStr(space.wpcColor);
			var wpcTex = TEX.createWpcPlankTexture ? TEX.createWpcPlankTexture(wpcHex, 0.2, 8) : {};

			var floorMat;
			if (space.flooringType === 'artificial_turf' && TEX.createArtificialTurfTexture) {
				var turf = TEX.createArtificialTurfTexture();
				floorMat = new THREE.MeshStandardMaterial({
					map: turf.map, bumpMap: turf.bumpMap, bumpScale: 0.12, roughness: 0.85, metalness: 0,
				});
			} else {
				floorMat = new THREE.MeshStandardMaterial({
					map: wpcTex.map, bumpMap: wpcTex.bumpMap, bumpScale: 0.08, roughness: 0.6, metalness: 0.05,
				});
			}

			var wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 });
			var glassMat = new THREE.MeshPhysicalMaterial({
				color: 0xbae6fd, transparent: true, opacity: 0.45, roughness: 0.1, transmission: 0.6, ior: 1.5,
			});
			var railMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });

			var width = space.width;
			var length = space.length;
			var pH = space.parapetHeight || 1.1;
			var wallThick = 0.25;

			function addParapetSegment(pW, pD, posX, posZ) {
				var solidH = Math.min(0.4, pH);
				var base = new THREE.Mesh(new THREE.BoxGeometry(pW, solidH, pD), wallMat);
				base.position.set(posX, solidH / 2, posZ);
				base.castShadow = true;
				base.receiveShadow = true;
				envGroup.add(base);

				if (pH > solidH) {
					var glassH = pH - solidH;
					var glass = new THREE.Mesh(
						new THREE.BoxGeometry(pW < pD ? 0.08 : pW - 0.08, glassH - 0.05, pD < pW ? 0.08 : pD - 0.08),
						glassMat
					);
					glass.position.set(posX, solidH + glassH / 2 - 0.025, posZ);
					envGroup.add(glass);

					var rail = new THREE.Mesh(
						new THREE.BoxGeometry(pW < pD ? 0.12 : pW, 0.05, pD < pW ? 0.12 : pD),
						railMat
					);
					rail.position.set(posX, pH, posZ);
					rail.castShadow = true;
					envGroup.add(rail);
				}
			}

			var shape = space.shape;
			/* تراس طولی (v2.11.1): موقعیت واقعی آن طبقه میانی ساختمان است،
			   نه سقف — از همین‌جا برای جان‌پناه و محیط سایت استفاده می‌شود */
			var isTerrace = shape === 'narrow_balcony';

			if (shape === 'l_shaped') {
				var mainW = width - (space.cutoutWidth || 4.5);
				var mainL = length;
				var mainX = -width / 2 + mainW / 2;
				var cutoutWidth = space.cutoutWidth || 4.5;
				var cutoutLength = space.cutoutLength || 4.0;
				var wingL = length - cutoutLength;
				var wingX = width / 2 - cutoutWidth / 2;
				var wingZ = -length / 2 + wingL / 2;

				var f1 = new THREE.Mesh(new THREE.BoxGeometry(mainW, 0.2, mainL), floorMat);
				f1.position.set(mainX, -0.1, 0);
				f1.receiveShadow = true;
				envGroup.add(f1);

				var f2 = new THREE.Mesh(new THREE.BoxGeometry(cutoutWidth, 0.2, wingL), floorMat);
				f2.position.set(wingX, -0.1, wingZ);
				f2.receiveShadow = true;
				envGroup.add(f2);

				addParapetSegment(width + wallThick * 2, wallThick, 0, -length / 2 - wallThick / 2);
				addParapetSegment(wallThick, length, -width / 2 - wallThick / 2, 0);
				addParapetSegment(mainW + wallThick, wallThick, mainX - wallThick / 2, length / 2 + wallThick / 2);
				addParapetSegment(wallThick, cutoutLength, mainX + mainW / 2 + wallThick / 2, length / 2 - cutoutLength / 2);
				addParapetSegment(cutoutWidth, wallThick, wingX, length / 2 - cutoutLength + wallThick / 2);
				addParapetSegment(wallThick, wingL, width / 2 + wallThick / 2, wingZ);
			} else if (shape === 'u_shaped') {
				var cw2 = space.cutoutWidth || 4.5;
				var cl2 = space.cutoutLength || 4.0;
				var wingW = (width - cw2) / 2;
				var backL = length - cl2;

				var u1 = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.2, length), floorMat);
				u1.position.set(-width / 2 + wingW / 2, -0.1, 0);
				u1.receiveShadow = true;
				envGroup.add(u1);

				var u2 = new THREE.Mesh(new THREE.BoxGeometry(wingW, 0.2, length), floorMat);
				u2.position.set(width / 2 - wingW / 2, -0.1, 0);
				u2.receiveShadow = true;
				envGroup.add(u2);

				var u3 = new THREE.Mesh(new THREE.BoxGeometry(cw2, 0.2, backL), floorMat);
				u3.position.set(0, -0.1, -length / 2 + backL / 2);
				u3.receiveShadow = true;
				envGroup.add(u3);

				addParapetSegment(width + wallThick * 2, wallThick, 0, -length / 2 - wallThick / 2);
				addParapetSegment(wallThick, length, -width / 2 - wallThick / 2, 0);
				addParapetSegment(wallThick, length, width / 2 + wallThick / 2, 0);
				addParapetSegment(wingW + wallThick, wallThick, -width / 2 + wingW / 2, length / 2 + wallThick / 2);
				addParapetSegment(wingW + wallThick, wallThick, width / 2 - wingW / 2, length / 2 + wallThick / 2);
				addParapetSegment(wallThick, cl2, -cw2 / 2 - wallThick / 2, length / 2 - cl2 / 2);
				addParapetSegment(wallThick, cl2, cw2 / 2 + wallThick / 2, length / 2 - cl2 / 2);
				addParapetSegment(cw2, wallThick, 0, length / 2 - cl2 + wallThick / 2);
			} else {
				// rectangular, narrow_balcony, central_shaft, penthouse_split → full floor
				var floorMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, length), floorMat);
				floorMesh.position.set(0, -0.1, 0);
				floorMesh.receiveShadow = true;
				envGroup.add(floorMesh);

				/* تراس: ضلع پشتی جان‌پناه ندارد — دیوار ساختمان (بلوک «بالا»
				   در بخش محیط سایت) جای آن را می‌گیرد تا مثل طبقه میانی دیده شود */
				if (!isTerrace) {
					addParapetSegment(width + wallThick * 2, wallThick, 0, -length / 2 - wallThick / 2);
				}
				addParapetSegment(width + wallThick * 2, wallThick, 0, length / 2 + wallThick / 2);
				addParapetSegment(wallThick, length, width / 2 + wallThick / 2, 0);
				addParapetSegment(wallThick, length, -width / 2 - wallThick / 2, 0);

				if (shape === 'central_shaft') {
					var shaftW = space.shaftWidth || 3.2;
					var shaftL = space.shaftLength || 3.0;
					var shaftH = 2.4;
					var shaft = new THREE.Mesh(new THREE.BoxGeometry(shaftW, shaftH, shaftL), wallMat);
					shaft.position.set(0, shaftH / 2, 0);
					shaft.castShadow = true;
					shaft.receiveShadow = true;
					envGroup.add(shaft);

					var door = new THREE.Mesh(
						new THREE.BoxGeometry(1.0, 2.0, 0.05),
						new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
					);
					door.position.set(0, 1.0, shaftL / 2 + 0.02);
					envGroup.add(door);
				}
			}

			// Modular tile grid — 1 m hairlines, 5 m module rhythm, sky origin axes.
			// Whole-metre extent so every cell is exactly 1 m.
			var gridDim = Math.max(width, length);
			var gridExt = Math.ceil(gridDim);
			var gridHalf = gridExt / 2;
			function addGridLayer(step, color, opacity, y) {
				var pts = [];
				for (var p = Math.ceil(-gridHalf / step) * step; p <= gridHalf + 1e-6; p += step) {
					pts.push(-gridHalf, y, p, gridHalf, y, p);
					pts.push(p, y, -gridHalf, p, y, gridHalf);
				}
				var geo = new THREE.BufferGeometry();
				geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
				var mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity, depthWrite: false });
				envGroup.add(new THREE.LineSegments(geo, mat));
			}
			addGridLayer(1, 0x64748b, 0.35, 0.005);
			addGridLayer(5, 0x94a3b8, 0.45, 0.007);
			var axisGeo = new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(-gridHalf, 0.009, 0),
				new THREE.Vector3(gridHalf, 0.009, 0),
				new THREE.Vector3(0, 0.009, -gridHalf),
				new THREE.Vector3(0, 0.009, gridHalf),
			]);
			var axisMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55, depthWrite: false });
			envGroup.add(new THREE.LineSegments(axisGeo, axisMat));

			/* ── Site context (v2.11.1): a roof reads as the TOP of a building;
			   a terrace shows its REAL position — host floors below it AND the
			   building continuing behind/above it (mid-storey, never a rooftop) ── */
			var bldH = isTerrace ? 3.2 : 9; // host-building height below the deck (m)
			var over = 0.7; // facade overhang around the roof slab
			var facadeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.92 });
			var slabMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
			// One tiled canvas texture carries the whole facade (windows + slab lines):
			// looks like a real building and costs a single material instead of ~40 boxes.
			var facadeTex = makeFacadeTexture();
			facadeTex.repeat.set(Math.max(2, Math.round((width + over) / 3)), Math.max(1, Math.round(bldH / 3.2)));
			facadeMat.map = facadeTex;
			facadeMat.emissiveMap = facadeTex;
			facadeMat.emissive = new THREE.Color(0xffca7a);
			facadeMat.emissiveIntensity = 0;
			facadeMat.needsUpdate = true;

			var facade = new THREE.Mesh(
				new THREE.BoxGeometry(width + over, bldH, length + over), facadeMat);
			facade.position.set(0, -bldH / 2 - 0.22, 0);
			envGroup.add(facade);

			// Floor ledges → the 3D edge of every storey
			for (var f = 0; 0.9 + f * 1.05 <= bldH; f++) {
				var slab = new THREE.Mesh(
					new THREE.BoxGeometry(width + over + 0.18, 0.16, length + over + 0.18), slabMat);
				slab.position.set(0, -(0.9 + f * 1.05), 0);
				envGroup.add(slab);
			}

			/* ── تراس (v2.11.1): ساختمان میزبان «پشت و بالای» تراس ادامه دارد ──
			   تراس طبقه میانی است: همان نمای پنجره‌دار از تراس رو به بالا کشیده
			   می‌شود تا هیچ‌وقت شبیه سقف دیده نشود. دیوار پشتی روی ضلع شمالی
			   (-z، همان سمت نیمکت و فلاورباکس پلان آماده) قرار می‌گیرد و به
			   همین دلیل جان‌پناه آن ضلع حذف شده است. */
			if (isTerrace) {
				var aboveH = 3.4; // ارتفاع طبقات بالای تراس
				var backD = 4.0;  // عمق ساختمان پشت تراس (بیرون از پلان)
				var backZ = -(length / 2 + backD / 2 + wallThick);

				var above = new THREE.Mesh(
					new THREE.BoxGeometry(width + over, aboveH, backD), facadeMat);
				above.position.set(0, aboveH / 2, backZ);
				above.castShadow = true;
				above.receiveShadow = true;
				envGroup.add(above);

				/* سقف بتنی تیره روی ساختمان پشتی — وگرنه سطح بالای آن از
				   دوربین بالا با بافت نمای کش‌شده دیده می‌شد */
				var roofCap = new THREE.Mesh(
					new THREE.BoxGeometry(width + over + 0.18, 0.18, backD + 0.18),
					new THREE.MeshStandardMaterial({ color: 0x4b5a70, roughness: 0.95 })
				);
				roofCap.position.set(0, aboveH + 0.09, backZ);
				roofCap.castShadow = true;
				roofCap.receiveShadow = true;
				envGroup.add(roofCap);

				// لبه طبقات بالای تراس — مثل لبه‌های زیر تراس
				for (var g2 = 0; 0.9 + g2 * 1.05 <= aboveH; g2++) {
					var slab2 = new THREE.Mesh(
						new THREE.BoxGeometry(width + over + 0.18, 0.16, backD + 0.18), slabMat);
					slab2.position.set(0, 0.9 + g2 * 1.05, backZ);
					slab2.castShadow = true;
					envGroup.add(slab2);
				}

				// درب ورودی تراس روی دیوار پشتی — امضای «واحد مسکونی پشت تراس»
				var tdoor = new THREE.Mesh(
					new THREE.BoxGeometry(1.0, 2.0, 0.06),
					new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
				);
				tdoor.position.set(0, 1.0, -(length / 2 + wallThick) + 0.04);
				envGroup.add(tdoor);
			}

			// Neighbouring blocks, anchored to the same base as the host building
			var cityMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });
			var citySpec = [[-26, 7, 12, 9, -18], [24, 5, 10, 7, 16], [-20, 9, 8, 11, 20],
			[18, 6, 9, 8, -22], [0, 5, 7, 6, 26], [-6, 4, 6, 5, -27]];
			citySpec.forEach(function (c) {
				var b = new THREE.Mesh(new THREE.BoxGeometry(c[2], c[3], c[2]), cityMat);
				b.position.set(c[0], -bldH - c[3] / 2 + 1.2, c[4]);
				envGroup.add(b);
			});

			// Street level — far below to sell a roof's height, right at the base for a terrace
			var ground = new THREE.Mesh(
				new THREE.PlaneGeometry(180, 180),
				new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 })
			);
			ground.rotation.x = -Math.PI / 2;
			ground.position.set(0, -bldH - 0.22 - (isTerrace ? 0.05 : 8), 0);
			envGroup.add(ground);

			// Store the facade material so night mode can light up the windows
			rooftopWindowsMat = facadeMat;
			rooftopFacadeMat = facadeMat;

			// Update header badge
			var badge = $('badge');
			if (badge) {
				var areaVal = B.calculatePlanArea(space);
				badge.innerText =
					(currentPlan.name || 'پلان') + ' | ' + width + ' × ' + length + ' متر (' + areaVal + ' م²)';
			}
		}

		/* ─────────────── Items management ─────────────── */
		function pushHistory() {
			/* var الزامی است — فایل strict-mode است و بدون var همین‌جا
			   «افزودن قلم» و کل تاریخچه می‌شکست (رجگرسی v2.11) */
			var snapshot = JSON.parse(JSON.stringify(items));
			history = history.slice(0, historyIndex + 1);
			history.push(snapshot);
			if (history.length > 50) history.shift();
			historyIndex = history.length - 1;
			updateUndoButtons();
			coachRefresh(); /* همراه طراح: هر تغییر ثبت‌شده وضعیت (کشیدن، افزودن، حذف) (v2.11) */
		}

		function undo() {
			if (historyIndex > 0) {
				historyIndex--;
				items = JSON.parse(JSON.stringify(history[historyIndex]));
				rebuildItems();
				updateUndoButtons();
			}
		}

		function redo() {
			if (historyIndex < history.length - 1) {
				historyIndex++;
				items = JSON.parse(JSON.stringify(history[historyIndex]));
				rebuildItems();
				updateUndoButtons();
			}
		}

		function updateUndoButtons() {
			var ub = $('btn-undo');
			var rb = $('btn-redo');
			if (ub) ub.disabled = historyIndex <= 0;
			if (rb) rb.disabled = historyIndex >= history.length - 1;
		}

		function addItem(prod) {
			var spawn = B.findSafeSpawnPosition(prod.w, prod.d, space, items, 0);
			var item = {
				id: uid(),
				productId: prod.code || String(prod.id),
				name: prod.name,
				category: prod.category || 'planting',
				x: spawn.x,
				z: spawn.z,
				y: 0,
				rotation: 0,
				width: prod.w,
				depth: prod.d,
				height: prod.h,
				wpcColor: prod.wpcColor || space.wpcColor,
				metalColor: prod.metalColor || space.metalColor,
				shapeType: prod.shape || 'box',
				priceEst: prod.price || 0,
				weightKg: prod.weight || 0,
				hasLighting: !!prod.light,
			};
			items.push(item);
			pushHistory();
			buildItem(item);
			selectItem(item.id);
			updateBomBadge();
			/* The plan is too tight for this product (e.g. a 3.2 m pergola on a
			   2.8 m balcony) — it is centred best-effort; tell the user clearly */
			if (spawn && spawn.fits === false) {
				showToast('⚠ «' + prod.name + '» در این پلان جا نمی‌شود — در وسط پلان قرار گرفت. ابعاد بام را از «نقشه و ابعاد بام» بزرگ‌تر کنید.');
			}
		}

		/* Small top toast for one-off warnings (item doesn't fit, …) */
		var toastTimer = null;
		function showToast(msg) {
			var t = $('toast');
			if (!t) return;
			t.innerText = msg;
			t.classList.add('show');
			if (toastTimer) clearTimeout(toastTimer);
			toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4500);
		}

		function buildItem(item) {
			var effects = [];
			var opts = {
				isNight: lightingMode === 'night' || lightingMode === 'sunset',
				wpcColor: space.wpcColor,
				metalColor: space.metalColor,
				effects: effects,
			};
			var g = Models.buildItemModel(item, opts);
			itemsGroup.add(g);
			itemGroups.set(item.id, g);
			for (var ei = 0; ei < effects.length; ei++) animatedEffects.push(effects[ei]);

			var proxy = new THREE.Mesh(
				new THREE.BoxGeometry(
					Math.max(item.width, 0.4),
					Math.max(item.height, 0.5),
					Math.max(item.depth, 0.4)
				),
				proxyMat
			);
			proxy.position.set(item.x, Math.max(item.height, 0.5) / 2, item.z);
			proxy.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0);
			proxy.userData.itemId = item.id;
			proxy.name = 'hit-proxy-' + item.id;
			itemsGroup.add(proxy);
			hitProxies.push(proxy);
		}

		function rebuildItems() {
			clearGroup(itemsGroup);
			itemGroups.clear();
			hitProxies = [];
			animatedEffects.length = 0;
			items.forEach(buildItem);
			selectItem(selectedId);
			updateBomBadge();
			coachRefresh(); /* همراه طراح: تحلیل تازه چیدمان (v2.11) */
		}

		function selectItem(id) {
			selectedId = id;
			if (selectionHelper) {
				scene.remove(selectionHelper);
				selectionHelper = null;
			}
			var insp = $('insp');
			if (id) {
				var item = items.find(function (it) { return it.id === id; });
				var g = itemGroups.get(id);
				if (item && g) {
					selectionHelper = new THREE.BoxHelper(g, 0x10b981);
					scene.add(selectionHelper);
					var title = $('insp-title');
					if (title) title.innerText = item.name;
					if (insp) insp.style.display = 'flex';
					updateInspectorMeta();
					return;
				}
			}
			if (insp) insp.style.display = 'none';
		}

		/* Live X/Z/rotation readout + active WPC swatch in the inspector bar */
		function trimNum(n) {
			return String(Math.round(n * 10) / 10);
		}

		function updateInspectorMeta() {
			var item = items.find(function (it) { return it.id === selectedId; });
			var pos = $('insp-pos');
			if (pos) {
				pos.innerText = item
					? 'X=' + trimNum(item.x) + ' , Z=' + trimNum(item.z) + ' | ' + Math.round(item.rotation || 0) + '°'
					: '';
			}
			var sw = $('insp-colors');
			if (sw) {
				sw.querySelectorAll('.ckb-insp-swatch').forEach(function (b) {
					b.classList.toggle('on', !!item && b.getAttribute('data-color') === item.wpcColor);
				});
			}
		}

		/* Visual-only reposition (same path as dragging, no model rebuild) */
		function moveItemVisual(item) {
			var g = itemGroups.get(item.id);
			var p = hitProxies.find(function (px) { return px.userData.itemId === item.id; });
			if (g) g.position.set(item.x, 0, item.z);
			if (p) p.position.set(item.x, p.position.y, item.z);
			if (selectionHelper) selectionHelper.update();
		}

		/* Nudge by (dx, dz) metres — arrow buttons + arrow keys, clamped to plan */
		function nudgeSelected(dx, dz) {
			if (!selectedId) return;
			var item = items.find(function (it) { return it.id === selectedId; });
			if (!item) return;
			var clamped = B.clampItemToPlan(item.x + dx, item.z + dz, item.width, item.depth, space, item.rotation);
			if (clamped.x === item.x && clamped.z === item.z) return;
			item.x = clamped.x;
			item.z = clamped.z;
			moveItemVisual(item);
			pushHistory();
			updateInspectorMeta();
		}

		/* Copy the selected item 0.6 m away (clamped), like the Next.js studio */
		function duplicateSelected() {
			if (!selectedId) return;
			var src = items.find(function (it) { return it.id === selectedId; });
			if (!src) return;
			var proposed = B.clampItemToPlan(src.x + 0.6, src.z + 0.6, src.width, src.depth, space, src.rotation);
			var copy = JSON.parse(JSON.stringify(src));
			copy.id = uid();
			copy.x = proposed.x;
			copy.z = proposed.z;
			items.push(copy);
			pushHistory();
			rebuildItems();
			selectItem(copy.id);
		}

		/* Per-item WPC recolor — models read item.wpcColor first */
		function recolorSelected(colorId) {
			if (!selectedId) return;
			var item = items.find(function (it) { return it.id === selectedId; });
			if (!item || item.wpcColor === colorId) return;
			item.wpcColor = colorId;
			pushHistory();
			rebuildItems();
			updateInspectorMeta();
		}

		function clearAllItems() {
			if (!items.length) return;
			if (!window.confirm('آیا از پاک کردن تمامی اقلام صحنه اطمینان دارید؟')) return;
			items = [];
			selectedId = null;
			pushHistory();
			rebuildItems();
		}

		/* Count bubble on the BOM dock button + clear-all enabled state */
		function updateBomBadge() {
			var b = $('bom-count');
			if (b) {
				b.innerText = String(items.length);
				b.hidden = items.length === 0;
			}
			var clearBtn = $('btn-clear');
			if (clearBtn) clearBtn.disabled = items.length === 0;
		}

		function deleteSelected() {
			if (!selectedId) return;
			var id = selectedId;
			items = items.filter(function (it) { return it.id !== id; });
			pushHistory();
			rebuildItems();
		}

		function rotateSelected(deg) {
			if (!selectedId) return;
			var item = items.find(function (it) { return it.id === selectedId; });
			if (!item) return;
			item.rotation = ((item.rotation || 0) + deg) % 360;
			pushHistory();
			rebuildItems();
		}

		/* ─────────────── Load plan ─────────────── */
		function loadPlan(plan) {
			currentPlan = plan;
			space = toSpace(plan);
			items = [];

			(plan.items || []).forEach(function (src) {
				var prod = products.find(function (p) { return p.code === src.productId; });
				items.push({
					id: uid(),
					productId: src.productId || (prod && prod.code) || '',
					name: src.name || (prod && prod.name) || 'قلم',
					category: src.category || (prod && prod.category) || 'planting',
					x: Number(src.x) || 0,
					z: Number(src.z) || 0,
					y: 0,
					rotation: Number(src.rotation) || 0,
					width: Number(src.w || src.width) || (prod && prod.w) || 1,
					depth: Number(src.d || src.depth) || (prod && prod.d) || 0.5,
					height: Number(src.h || src.height) || (prod && prod.h) || 0.5,
					wpcColor: prod ? prod.wpcColor || space.wpcColor : space.wpcColor,
					metalColor: prod ? prod.metalColor || space.metalColor : space.metalColor,
					shapeType: src.shapeType || (prod && prod.shape) || 'box',
					priceEst: src.priceEst || (prod && prod.price) || 0,
					weightKg: src.weightKg || (prod && prod.weight) || 0,
					hasLighting: src.hasLighting || !!(prod && prod.light),
				});
			});

			// Clamp all preset items into the new plan bounds
			items.forEach(function (it) {
				var cl = B.clampItemToPlan(it.x, it.z, it.width, it.depth, space, it.rotation);
				it.x = cl.x;
				it.z = cl.z;
			});

			buildEnvironment();
			history = [JSON.parse(JSON.stringify(items))];
			historyIndex = 0;
			updateUndoButtons();
			rebuildItems();
			resetCamera();
		}

		/* ─────────────── Interaction ─────────────── */
		var canvas = renderer.domElement;
		var dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
		var isOrbiting = false;
		var isDragging = false;
		var clickedId = null;
		var hasMoved = false;
		var downPos = { x: 0, y: 0 };
		var lastMouse = { x: 0, y: 0 };
		var dragOffset = { x: 0, z: 0 };
		var dragLast = null;
		var lastHoverCheck = 0;

		/* Pinch-to-zoom state (mobile): live pointers + start-of-pinch geometry */
		var activePointers = new Map();
		var pinch = null; // { startDist, startRadius } while two fingers are down

		function pinchDist() {
			var pts = Array.from(activePointers.values());
			return Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
		}

		/* ── Mobile v2.8 helpers ──────────────────────────────────────────
		   Double-tap: tap-tap on empty deck zooms in, on an item zooms to it.
		   Haptic feedback: light buzz on pick/select on supporting phones.
		   Touch wake: the 30 fps mobile cap makes slow drags feel laggy, so the
		   first 350 ms of any drag scales the delta like a 60 fps stream. */
		var lastTapTime = 0;
		var lastTapX = 0, lastTapY = 0;
		var DBL_TAP_MS = 320;
		var DBL_TAP_DIST = 30;
		var zoomAnim = null;

		function buzz(ms) {
			try {
				if (navigator.vibrate && MOBILE) navigator.vibrate(ms);
			} catch (err) {}
		}

		function animateRadiusTo(targetRadius) {
			var maxDim = Math.max(space.width, space.length);
			var from = cameraAngle.radius;
			targetRadius = Math.max(4, Math.min(maxDim * 3, targetRadius));
			zoomAnim = { from: from, to: targetRadius, start: performance.now(), dur: 320 };
		}

		function tickZoomAnim(nowMs) {
			if (!zoomAnim) return;
			var k = Math.min(1, (nowMs - zoomAnim.start) / zoomAnim.dur);
			var e = 1 - Math.pow(1 - k, 3); /* easeOutCubic */
			cameraAngle.radius = zoomAnim.from + (zoomAnim.to - zoomAnim.from) * e;
			updateCamera();
			if (k >= 1) zoomAnim = null;
		}

		function handleDoubleTap(x, y) {
			var maxDim = Math.max(space.width, space.length);
			var now = performance.now();
			var isDouble = (now - lastTapTime) < DBL_TAP_MS &&
				Math.hypot(x - lastTapX, y - lastTapY) < DBL_TAP_DIST;
			lastTapTime = isDouble ? 0 : now;
			lastTapX = x; lastTapY = y;
			if (!isDouble) return;

			var hitId = pickItem(x, y);
			if (hitId) {
				var item = items.find(function (it) { return it.id === hitId; });
				if (item) {
					/* Frame the tapped item: pull target to it and zoom close */
					lookAtTarget.x = item.x;
					lookAtTarget.z = item.z;
					var itemSpan = Math.max(item.width, item.depth) || 1;
					animateRadiusTo(Math.min(cameraAngle.radius, itemSpan * 3 + 4));
					selectItem(hitId);
					buzz(20);
					return;
				}
			}
			/* Empty deck: toggle between zoomed-out overview and a closer view */
			var overview = Math.max(14, maxDim * 1.6);
			if (cameraAngle.radius > overview * 1.15) {
				animateRadiusTo(overview);
			} else {
				animateRadiusTo(overview * 0.55);
			}
			buzz(20);
		}

		function pickItem(clientX, clientY) {
			var rect = canvas.getBoundingClientRect();
			var mouse = new THREE.Vector2(
				((clientX - rect.left) / rect.width) * 2 - 1,
				-((clientY - rect.top) / rect.height) * 2 + 1
			);
			var ray = new THREE.Raycaster();
			ray.setFromCamera(mouse, camera);

			// A click whose ground point falls OUTSIDE the floor plan is camera/deselect
			// territory: picking volumes of tall items project past the deck, so grabbing
			// there would move items the user never pointed at.
			var groundPt = new THREE.Vector3();
			var groundHit = ray.ray.intersectPlane(dragPlane, groundPt);
			var groundDist = groundHit ? ray.ray.origin.distanceTo(groundPt) : Infinity;
			var groundInsidePlan = groundHit !== null && B.isInsidePlanBounds(groundPt.x, groundPt.z, 0, 0, space, 0);

			// Precise picking: real item meshes first (so nested items — e.g. a sofa
			// under a pergola — stay selectable), proxies only as an inside-plan fallback.
			var itemMeshes = [];
			itemsGroup.children.forEach(function (c) {
				if (String(c.name || '').indexOf('hit-proxy') !== 0) itemMeshes.push(c);
			});

			if (itemMeshes.length > 0) {
				var rawHits = ray.intersectObjects(itemMeshes, true);
				var hits = [];
				for (var i = 0; i < rawHits.length; i++) {
					// Degenerate geometries can yield NaN distances that poison the sort
					if (isFinite(rawHits[i].distance) && rawHits[i].distance < groundDist) hits.push(rawHits[i]);
				}
				hits.sort(function (a, b) { return a.distance - b.distance; });
				if (hits.length > 0) {
					var obj = hits[0].object;
					while (obj && !(obj.userData && obj.userData.itemId)) obj = obj.parent;
					if (obj && obj.userData.itemId) return obj.userData.itemId;
				}
			}

			if (groundInsidePlan) {
				var proxyHits = ray.intersectObjects(hitProxies, false);
				if (proxyHits.length > 0) return proxyHits[0].object.userData.itemId || null;
			}
			return null;
		}

		function floorPoint(clientX, clientY) {
			var rect = canvas.getBoundingClientRect();
			var mouse = new THREE.Vector2(
				((clientX - rect.left) / rect.width) * 2 - 1,
				-((clientY - rect.top) / rect.height) * 2 + 1
			);
			var ray = new THREE.Raycaster();
			ray.setFromCamera(mouse, camera);
			var pt = new THREE.Vector3();
			if (ray.ray.intersectPlane(dragPlane, pt)) return pt;
			return null;
		}

		canvas.addEventListener('pointerdown', function (e) {
			activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
			if (activePointers.size === 2) {
				/* Second finger: enter pinch mode, cancel any drag/orbit/select intent */
				pinch = { startDist: pinchDist(), startRadius: cameraAngle.radius };
				isOrbiting = false;
				isDragging = false;
				clickedId = null;
				hasMoved = true;
				return;
			}

			downPos = { x: e.clientX, y: e.clientY };
			lastMouse = { x: e.clientX, y: e.clientY };
			hasMoved = false;
			isDragging = false;

			var pressId = pickItem(e.clientX, e.clientY);
			clickedId = pressId;

			if (pressId && pressId === selectedId) {
				isOrbiting = false;
				var pt = floorPoint(e.clientX, e.clientY);
				var item = items.find(function (it) { return it.id === pressId; });
				if (pt && item) {
					dragOffset = { x: item.x - pt.x, z: item.z - pt.z };
				}
			} else {
				isOrbiting = true;
			}

			try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
		});

		canvas.addEventListener('pointermove', function (e) {
			if (activePointers.has(e.pointerId)) {
				activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
			}

			/* Two-finger pinch: drive camera radius from the finger distance ratio */
			if (pinch && activePointers.size >= 2) {
				var dist = pinchDist();
				if (pinch.startDist > 0 && dist > 0) {
					var maxDim = Math.max(space.width, space.length);
					cameraAngle.radius = Math.max(4, Math.min(maxDim * 3, pinch.startRadius * (pinch.startDist / dist)));
					updateCamera();
				}
				return; /* suspend orbit/drag while pinching */
			}

			var dx = e.clientX - lastMouse.x;
			var dy = e.clientY - lastMouse.y;
			lastMouse = { x: e.clientX, y: e.clientY };

			if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) hasMoved = true;

			if (clickedId && clickedId === selectedId && hasMoved) {
				isDragging = true;
				isOrbiting = false;
				/* fade the dock/inspector while dragging — they were covering the deck */
				rootEl.classList.add('ckb-dragging');

				var pt = floorPoint(e.clientX, e.clientY);
				var item = items.find(function (it) { return it.id === selectedId; });
				if (pt && item) {
					var clamped = B.clampItemToPlan(
						pt.x + dragOffset.x, pt.z + dragOffset.z,
						item.width, item.depth, space, item.rotation
					);
					dragLast = clamped;

					var g = itemGroups.get(item.id);
					var p = hitProxies.find(function (px) { return px.userData.itemId === item.id; });
					if (g) g.position.set(clamped.x, 0, clamped.z);
					if (p) p.position.set(clamped.x, p.position.y, clamped.z);
					if (selectionHelper) selectionHelper.update();
				}
				return;
			}

			if (isOrbiting && e.buttons > 0) {
				var sensitivity = CAM_SENS;
				cameraAngle.theta -= dx * sensitivity;
				cameraAngle.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, cameraAngle.phi + dy * sensitivity));
				updateCamera();
				return;
			}

			if (e.buttons === 0) {
				var now = performance.now();
				if (now - lastHoverCheck > 80) {
					lastHoverCheck = now;
					var hovered = pickItem(e.clientX, e.clientY);
					canvas.style.cursor = hovered ? 'pointer' : 'grab';
				}
			}
		});

		/* Mobile v2.8: a cancelled touch (incoming call, browser gesture, palm) must
		   end the drag/orbit cleanly — otherwise the item stuck to the finger and the
		   dock stayed faded until the next tap. */
		canvas.addEventListener('pointercancel', function (e) {
			activePointers.delete(e.pointerId);
			if (activePointers.size < 2) pinch = null;
			if (activePointers.size > 0) return;
			if (isDragging && clickedId && dragLast) {
				var item = items.find(function (it) { return it.id === clickedId; });
				if (item) {
					item.x = dragLast.x;
					item.z = dragLast.z;
					pushHistory();
					updateInspectorMeta();
				}
			}
			isOrbiting = false;
			isDragging = false;
			clickedId = null;
			dragLast = null;
			rootEl.classList.remove('ckb-dragging');
			try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
		});

		canvas.addEventListener('pointerup', function (e) {
			activePointers.delete(e.pointerId);
			if (activePointers.size < 2) pinch = null; /* pinch ends when fewer than two fingers remain */
			if (activePointers.size > 0) return; /* remaining finger keeps orbiting, no click-select */

			if (isDragging) {
				if (clickedId && dragLast) {
					var item = items.find(function (it) { return it.id === clickedId; });
					if (item) {
						item.x = dragLast.x;
						item.z = dragLast.z;
						pushHistory();
						updateInspectorMeta(); /* keep the X/Z readout in sync after a drag */
					}
				}
			} else if (!hasMoved) {
				var picked = pickItem(e.clientX, e.clientY);
				selectItem(picked);
				if (picked) buzz(12); /* light confirmation on mobile taps */
				handleDoubleTap(e.clientX, e.clientY);
			}

			isOrbiting = false;
			isDragging = false;
			clickedId = null;
			dragLast = null;
			rootEl.classList.remove('ckb-dragging');
			try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
		});

		canvas.addEventListener('wheel', function (e) {
			e.preventDefault();
			var maxDim = Math.max(space.width, space.length);
			cameraAngle.radius = Math.max(4, Math.min(maxDim * 3, cameraAngle.radius + e.deltaY * 0.015));
			updateCamera();
		}, { passive: false });

		// Keyboard shortcuts
		document.addEventListener('keydown', function (e) {
			if (!rootEl || !rootEl.isConnected) return;
			var tag = (e.target && e.target.tagName) || '';
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

			if (e.key === 'Delete' || e.key === 'Backspace') {
				if (selectedId) { e.preventDefault(); deleteSelected(); }
			} else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
				e.preventDefault(); undo();
			} else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
				((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
				e.preventDefault(); redo();
			} else if (e.key === 'Escape') {
				if (planTourStep >= 0) { endPlanTour(); } else { selectItem(null); }
			} else if (e.key.toLowerCase() === 'r' && selectedId) {
				rotateSelected(e.shiftKey ? -15 : 15);
			} else if (selectedId && e.key === 'ArrowUp') {
				e.preventDefault(); nudgeSelected(0, -0.5);
			} else if (selectedId && e.key === 'ArrowDown') {
				e.preventDefault(); nudgeSelected(0, 0.5);
			} else if (selectedId && e.key === 'ArrowLeft') {
				e.preventDefault(); nudgeSelected(-0.5, 0);
			} else if (selectedId && e.key === 'ArrowRight') {
				e.preventDefault(); nudgeSelected(0.5, 0);
			}
		});

		/* ─────────────── Resize ─────────────── */
		function resize() {
			var nw = vp.clientWidth || 800;
			var nh = vp.clientHeight || 600;
			camera.aspect = nw / nh;
			camera.updateProjectionMatrix();
			renderer.setSize(nw, nh);
		}
		window.addEventListener('resize', resize);
		window.addEventListener('orientationchange', function () {
			/* iOS fires resize before the layout settles — re-check a few times */
			resize();
			setTimeout(resize, 120);
			setTimeout(resize, 400);
		});
		/* Mobile v2.8: the mobile browser chrome (URL bar) collapsing changes the
		   viewport size without firing a window resize on some phones — watch the
		   container itself so the canvas always fills the visible area. */
		if (typeof ResizeObserver === 'function') {
			var vpRO = new ResizeObserver(function () { resize(); });
			vpRO.observe(vp);
		}
		setTimeout(resize, 60);
		setTimeout(resize, 300);

		/* ─────────────── Render loop ─────────────── */
		var clock = typeof THREE.Clock === 'function' ? new THREE.Clock() : null;

		function updateEffects(t) {
			for (var i = 0; i < animatedEffects.length; i++) {
				var fx = animatedEffects[i];
				if (fx.type === 'scroll' && fx.mat && fx.mat.map) {
					fx.mat.map.offset.y = (t * fx.speed) % 1;
				} else if (fx.type === 'shimmer' && fx.mat && fx.mat.map) {
					fx.mat.map.offset.y = (t * 0.06) % 1;
					fx.mat.map.offset.x = Math.sin(t * 0.4) * 0.05;
				} else if (fx.type === 'splash' && fx.mesh) {
					var pulse = Math.sin(t * 5.2 + fx.phase);
					var s = 1 + 0.18 * pulse;
					fx.mesh.scale.set(s, s, 1);
					if (fx.mesh.material) fx.mesh.material.opacity = fx.base * (0.65 + 0.35 * pulse);
				} else if (fx.type === 'flame') {
					var fs = 1 + 0.13 * Math.sin(t * 11 + fx.phase) + 0.05 * Math.sin(t * 23 + fx.phase * 1.7);
					for (var m = 0; m < fx.meshes.length; m++) {
						fx.meshes[m].scale.set(1 - 0.05 * Math.sin(t * 9 + m * 2.1), fs + m * 0.04, 1);
					}
					if (fx.light) fx.light.intensity = fx.base * (0.82 + 0.18 * Math.sin(t * 15 + fx.phase * 2.1));
				}
			}
		}

		function animate() {
			requestAnimationFrame(animate);
			/* Mobile frame cap (~30 fps) + full pause on hidden tabs:
			   high-refresh phones otherwise burn battery rendering at 120 fps */
			var nowMs = performance.now();
			if (document.hidden) return;
			if (MOBILE && nowMs - lastFrameMs < 33) return;
			lastFrameMs = nowMs;
			tickZoomAnim(nowMs);
			var t = clock ? clock.getElapsedTime() : nowMs / 1000;
			updateEffects(t);
			if (selectionHelper) selectionHelper.update();
			renderer.render(scene, camera);
		}
		var lastFrameMs = 0;

		/* ─────────────── Modals & UI ─────────────── */
		function openModal(name) {
			var m = $('modal-' + name);
			if (m) m.style.display = 'flex';
		}
		function closeModal(name) {
			var m = $('modal-' + name);
			if (m) m.style.display = 'none';
		}

		/* Catalog with live 3D thumbnails + search & category filter (like ProductDrawer) */
		var CATEGORY_LABELS = {
			all: 'همه محصولات', planting: 'سیستم کاشت مدولار', furniture: 'مبلمان فضای باز',
			structures: 'پرگولا و سایبان', water_fire: 'آبنما و آتشدان', lighting: 'روشنایی و برق',
			flooring: 'کف‌سازی و تایل WPC', accessories: 'باربیکیو و اکسسوری',
		};
		var catalogFilter = { cat: 'all', q: '' };

		function buildCatalogTools() {
			var catsEl = $('catalog-cats');
			if (!catsEl) return;
			var present = [];
			products.forEach(function (p) {
				if (p.category && present.indexOf(p.category) === -1) present.push(p.category);
			});
			var ids = ['all'].concat(present);
			catsEl.innerHTML = ids.map(function (id) {
				return '<button type="button" data-cat="' + escapeHtml(id) + '"' +
					(id === catalogFilter.cat ? ' class="on"' : '') + '>' +
					escapeHtml(CATEGORY_LABELS[id] || id) + '</button>';
			}).join('');
			catsEl.querySelectorAll('button').forEach(function (b) {
				b.onclick = function () {
					catalogFilter.cat = b.getAttribute('data-cat') || 'all';
					catsEl.querySelectorAll('button').forEach(function (x) {
						x.classList.toggle('on', x === b);
					});
					renderCatalog();
				};
			});
		}

		function catalogMatches(prod) {
			if (catalogFilter.cat !== 'all' && prod.category !== catalogFilter.cat) return false;
			if (catalogFilter.q) {
				var hay = ((prod.name || '') + ' ' + (prod.code || '') + ' ' +
					prod.w + '×' + prod.d + ' ' + (CATEGORY_LABELS[prod.category] || prod.category || '')).toLowerCase();
				if (hay.indexOf(catalogFilter.q) === -1) return false;
			}
			return true;
		}

		function renderCatalog() {
			var el = $('catalog-list');
			el.innerHTML = '';
			clearThumbs();

			var visible = products.filter(catalogMatches);
			if (!visible.length) {
				el.innerHTML = '<div class="ckb-catalog-empty">قلمی با این جستجو پیدا نشد — عبارت دیگری امتحان کنید.</div>';
				return;
			}

			visible.forEach(function (prod) {
				var idx = products.indexOf(prod);
				var card = document.createElement('div');
				card.className = 'ckb-catalog-card';
				card.innerHTML =
					'<div class="ckb-catalog-3d" data-idx="' + idx + '"></div>' +
					'<div><h5>' + escapeHtml(prod.name) + '</h5>' +
					'<small>' + escapeHtml(prod.code || '') + ' • ' + prod.w + '×' + prod.d + ' m' +
					(prod.price ? ' • ' + fmtPrice(prod.price) + ' ت' : '') + '</small></div>' +
					'<button type="button" class="ckb-catalog-btn">+ افزودن به بام</button>';

				card.querySelector('button').onclick = function () {
					addItem(prod);
					closeModal('catalog');
				};

				el.appendChild(card);
			});

			// Render small 3D thumbnails after insertion
			setTimeout(function () {
				el.querySelectorAll('.ckb-catalog-3d').forEach(function (holder) {
					renderThumbnail(holder, products[Number(holder.getAttribute('data-idx'))]);
				});
			}, 30);
		}

		/* ── Shared thumbnail engine ─────────────────────────────────────────
		   One WebGL context rasterizes the whole grid and blits into 2D canvases.
		   The old per-card WebGLRenderer created ~a dozen live contexts per open
		   (browsers cap ~16) with 20 fps shadowed intervals each — the main
		   "استودیو روی گوشی هنگ می‌کند" culprit. */
		var THUMB_W = 240, THUMB_H = 140;
		var thumbShared = null; // { renderer, timer, cards: [] }

		function getThumbShared() {
			if (thumbShared) return thumbShared;
			/* رندرر مشترک ریزنقش‌ها — تنظیمات کارا و امتحان‌پس‌داده:
			   یک کانتکست برای همه کارت‌ها (به‌جای ~۱۲ کانتکست). پرچم‌های
			   رندرر را دست نزنید — antialias:false روی این بوم کوچک صرفه
			   معناداری ندارد و preserveDrawingBuffer برای انتقال drawImage
			   به بوم دوبعدی لازم است. */
			var r = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
			r.setSize(THUMB_W, THUMB_H);
			r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
			r.shadowMap.enabled = false;
			r.toneMapping = THREE.ACESFilmicToneMapping;
			r.toneMappingExposure = 1.1;
			thumbShared = { renderer: r, timer: null, cards: [] };
			return thumbShared;
		}

		function disposeThumbCard(card) {
			if (card.observer) card.observer.disconnect();
			card.scene.traverse(function (o) {
				if (o.geometry) o.geometry.dispose();
				if (o.material) {
					if (o.material.map) o.material.map.dispose();
					if (o.material.bumpMap) o.material.bumpMap.dispose();
					o.material.dispose();
				}
			});
		}

		function clearThumbs() {
			if (!thumbShared) return;
			thumbShared.cards.forEach(disposeThumbCard);
			thumbShared.cards.length = 0;
		}

		function renderThumbsTick() {
			var sh = thumbShared;
			if (!sh || document.hidden) return;
			var pr = sh.renderer.getPixelRatio ? sh.renderer.getPixelRatio() : 1;
			var bw = Math.round(THUMB_W * pr), bh = Math.round(THUMB_H * pr);
			for (var i = sh.cards.length - 1; i >= 0; i--) {
				var c = sh.cards[i];
				if (!document.body.contains(c.holder)) {
					disposeThumbCard(c);
					sh.cards.splice(i, 1);
					continue;
				}
				if (!c.alive) continue;
				c.angle += 0.014;
				c.model.rotation.y = c.angle;
				sh.renderer.render(c.scene, c.cam);
				c.ctx.drawImage(sh.renderer.domElement, 0, 0, bw, bh, 0, 0, c.canvas.width, c.canvas.height);
			}
		}

		function renderThumbnail(holder, prod) {
			if (!prod || !holder || holder.childElementCount > 0) return;
			var sh = getThumbShared();
			var pr = Math.min(window.devicePixelRatio || 1, 2);

			var out = document.createElement('canvas');
			out.width = Math.round(THUMB_W * pr);
			out.height = Math.round(THUMB_H * pr);
			holder.appendChild(out);
			var ctx = out.getContext('2d');

			var tScene = new THREE.Scene();
			tScene.background = new THREE.Color(0x0f172a);

			var tCam = new THREE.PerspectiveCamera(40, THUMB_W / THUMB_H, 0.1, 50);
			var maxDim = Math.max(prod.w, prod.h, prod.d);
			var dist = maxDim * 2.4 + 1.5;
			tCam.position.set(dist * 0.75, dist * 0.65, dist * 0.9);
			tCam.lookAt(0, prod.h / 2, 0);

			tScene.background = new THREE.Color(0x131e33); /* هم‌راستا با کارت — مدل تیره روی مشکی گم می‌شد */
			tScene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.15));
			var key = new THREE.DirectionalLight(0xfff4e0, 1.7);
			key.position.set(4, 6, 4);
			tScene.add(key);

			var ground = new THREE.Mesh(
				new THREE.CircleGeometry(maxDim * 2.2, 32),
				new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
			);
			ground.rotation.x = -Math.PI / 2;
			tScene.add(ground);

			var model = Models.buildItemModel(
				{
					id: 'thumb-' + prod.code,
					width: prod.w, depth: prod.d, height: prod.h,
					shapeType: prod.shape || 'box',
					category: prod.category,
					wpcColor: prod.wpcColor, metalColor: prod.metalColor,
					hasLighting: false,
					x: 0, z: 0, y: 0, rotation: 0,
				},
				{ isNight: false }
			);
			tScene.add(model);

			var entry = {
				holder: holder, scene: tScene, cam: tCam, model: model,
				ctx: ctx, canvas: out,
				angle: Math.random() * Math.PI * 2, alive: true, observer: null,
			};
			var observer = new IntersectionObserver(function (entries) {
				entries.forEach(function (en) { entry.alive = en.isIntersecting; });
			});
			observer.observe(holder);
			entry.observer = observer;
			sh.cards.push(entry);

			if (!sh.timer) {
				sh.timer = setInterval(renderThumbsTick, 80); /* ~12 fps shared by all cards */
			}
		}

		function escapeHtml(s) {
			return String(s == null ? '' : s)
				.replace(/&/g, '&amp;').replace(/</g, '&lt;')
				.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		/* Plans modal */
		function renderPlansModal() {
			var el = $('plans-list');
			el.innerHTML = '';
			var BP = window.CKBBlueprint || null;
			plans.forEach(function (plan) {
				var card = document.createElement('div');
				card.className = 'ckb-pcard' + (currentPlan.id === plan.id ? ' selected' : '');
				var thumb = BP ? '<div class="ckb-pcard-thumb">' + BP.svg(plan) + '</div>' : '';
				card.innerHTML = thumb +
					'<div class="ckb-pcard-meta"><h5>' + escapeHtml(plan.name || '') + '</h5>' +
					'<p>ابعاد: ' + plan.width + ' × ' + plan.length + ' متر | متراژ: ' +
					B.calculatePlanArea(toSpace(plan)) + ' م²</p></div>' +
					'<span class="ckb-pcard-badge">' + escapeHtml(plan.shapeName || 'پلان') + '</span>';
				card.onclick = function () {
					loadPlan(plan);
					closeModal('plan');
				};
				el.appendChild(card);
			});
		}

		/* Plan editor modal */
		function openPlanEditor() {
			renderPlansModal();
			setPlanTab('presets');
			$('pe-width').value = space.width;
			$('pe-length').value = space.length;
			$('pe-parapet').value = space.parapetHeight;
			$('pe-shape').value = space.shape;
			$('pe-flooring').value = space.flooringType;
			$('pe-wpc').value = space.wpcColor;
			$('pe-metal').value = space.metalColor;
			$('pe-cutw').value = space.cutoutWidth || '';
			$('pe-cutl').value = space.cutoutLength || '';
			$('pe-shaftw').value = space.shaftWidth || '';
			$('pe-shaftl').value = space.shaftLength || '';
			updatePlanEditorArea();
			openModal('plan');
		}

		function setPlanTab(t) {
			rootEl.querySelectorAll('[data-ptab]').forEach(function (b) {
				b.classList.toggle('active', b.getAttribute('data-ptab') === t);
			});
			rootEl.querySelectorAll('[data-ptab-body]').forEach(function (b) {
				b.style.display = b.getAttribute('data-ptab-body') === t ? '' : 'none';
			});
		}
		rootEl.querySelectorAll('[data-ptab]').forEach(function (b) {
			b.addEventListener('click', function () {
				setPlanTab(b.getAttribute('data-ptab'));
			});
		});

		function updatePlanEditorArea() {
			var tmp = {
				shape: $('pe-shape').value,
				width: Number($('pe-width').value) || 10,
				length: Number($('pe-length').value) || 8,
				cutoutWidth: Number($('pe-cutw').value) || 0,
				cutoutLength: Number($('pe-cutl').value) || 0,
				shaftWidth: Number($('pe-shaftw').value) || 0,
				shaftLength: Number($('pe-shaftl').value) || 0,
			};
			var shapeNames = {
				rectangular: 'مستطیلی', l_shaped: 'L شکل', u_shaped: 'U شکل',
				central_shaft: 'باکس پله مرکزی', narrow_balcony: 'تراس طولی', penthouse_split: 'پنت‌هاوس دوبالکه',
			};
			var el = $('pe-area');
			if (el) {
				el.innerText = 'متراژ خالص: ' + B.calculatePlanArea(tmp) + ' م² — فرم: ' + (shapeNames[tmp.shape] || tmp.shape);
			}
			// Live blueprint preview of the edited plan
			var bpEl = $('pe-blueprint');
			if (bpEl && window.CKBBlueprint) {
				try {
					bpEl.innerHTML = window.CKBBlueprint.svg({
						shape: tmp.shape,
						width: tmp.width,
						length: tmp.length,
						cutoutWidth: tmp.cutoutWidth,
						cutoutLength: tmp.cutoutLength,
						shaftWidth: tmp.shaftWidth,
						shaftLength: tmp.shaftLength,
					});
				} catch (err) {}
			}
		}

		function applyPlanEditor() {
			var plan = {
				id: 'custom-' + Date.now(),
				name: 'پلان سفارشی من',
				shape: $('pe-shape').value,
				width: Number($('pe-width').value) || 10,
				length: Number($('pe-length').value) || 8,
				parapetHeight: Number($('pe-parapet').value) || 1.1,
				flooringType: $('pe-flooring').value,
				wpcColor: $('pe-wpc').value,
				metalColor: $('pe-metal').value,
				cutoutWidth: Number($('pe-cutw').value) || 0,
				cutoutLength: Number($('pe-cutl').value) || 0,
				shaftWidth: Number($('pe-shaftw').value) || 0,
				shaftLength: Number($('pe-shaftl').value) || 0,
				shapeName: 'پلان سفارشی',
				items: items.map(function (it) {
					return {
						productId: it.productId, name: it.name, x: it.x, z: it.z,
						rotation: it.rotation, w: it.width, d: it.depth, h: it.height,
					};
				}),
			};
			// keep area consistent for narrow_balcony (no exclusions)
			loadPlan(plan);
			closeModal('plan');
		}

		/* BOM modal */
		function renderBOM() {
			var bom = window.CKBBom.calculateBillOfMaterials(space, items);

			var stats = $('bom-stats');
			var safetyLabel = bom.structuralSafety === 'safe'
				? '<span class="ckb-bom-safe">ایمن ✓</span>'
				: bom.structuralSafety === 'moderate'
					? '<span class="ckb-bom-moderate">نیازمند بررسی</span>'
					: '<span class="ckb-bom-danger">مهندسی ناظر الزامی</span>';

			stats.innerHTML =
				stat(bom.totalAreaM2 + ' م²', 'مساحت کل') +
				stat(bom.greenAreaM2 + ' م²', 'فضای سبز') +
				stat(bom.flooringAreaM2 + ' م²', 'کف‌سازی') +
				stat(bom.itemsMetrajM2 + ' م²', 'متراژ اقلام') +
				stat(bom.seatingLengthM + ' m', 'طول نشیمن') +
				stat(bom.pergolaCount, 'پرگولا') +
				stat(bom.lightingFixtureCount, 'روشنایی') +
				stat(safetyLabel, 'ایمنی سازه');

			var body = $('bom-body');
			var rows = '';
			bom.itemizedSummary.forEach(function (row) {
				rows += '<tr><td>' + escapeHtml(row.name) + '</td>' +
					'<td style="font-family:monospace;color:#94a3b8">' + escapeHtml(row.code || '—') + '</td>' +
					'<td style="text-align:center">' + row.quantity + '</td>' +
					'<td style="text-align:center;color:#34d399;font-weight:bold">' + (row.metrajM2 || 0) + ' م²</td></tr>';
			});
			body.innerHTML = rows || '<tr><td colspan="4" style="text-align:center;color:#64748b;padding:12px">هنوز قلمی در صحنه چیده نشده است.</td></tr>';

			function stat(v, l) {
				return '<div class="ckb-bom-stat"><b>' + v + '</b><span>' + l + '</span></div>';
			}
		}

		/* Save design with screenshot */
		var lastSaveShot = '';

		function captureShot() {
			renderer.render(scene, camera);
			try { return renderer.domElement.toDataURL('image/jpeg', 0.85); } catch (err) { return ''; }
		}

		/* Opening the save modal captures a live preview the user can download */
		function prepareSaveModal() {
			lastSaveShot = captureShot();
			var box = $('save-shot');
			var img = $('save-shot-img');
			if (box && img) {
				if (lastSaveShot) {
					img.src = lastSaveShot;
					box.hidden = false;
				} else {
					box.hidden = true;
				}
			}
			openModal('save');
		}

		function downloadShot() {
			if (!lastSaveShot) return;
			var a = document.createElement('a');
			a.href = lastSaveShot;
			a.download = 'chekadbam-plan-' + new Date().toISOString().slice(0, 10) + '.jpg';
			document.body.appendChild(a);
			a.click();
			a.remove();
		}

		function submitDesign() {
			var name = $('inp-name').value.trim();
			var phone = $('inp-phone').value.trim();
			var email = $('inp-email').value.trim();
			var city = $('inp-city').value.trim();
			var notes = $('inp-notes').value.trim();

			var notice = $('save-notice');
			function showNotice(type, msg) {
				notice.className = 'ckb-notice ' + type;
				notice.innerHTML = msg; /* static UI strings, may embed <br>/<b> */
			}

			if (!name || !phone) {
				showNotice('error', 'لطفاً نام و شماره همراه خود را وارد کنید.');
				return;
			}

			var btn = $('btn-submit');
			btn.disabled = true;
			btn.innerText = 'در حال ارسال...';
			showNotice('', '');

			// Capture screenshot (render once more to be safe)
			var dataUrl = lastSaveShot || captureShot();

			var bom = window.CKBBom.calculateBillOfMaterials(space, items);

			var fd = new FormData();
			fd.append('action', 'ckb_save_design');
			fd.append('nonce', cfg.nonce);
			fd.append('name', name);
			fd.append('phone', phone);
			fd.append('email', email);
			fd.append('city', city);
			fd.append('shape', space.shape);
			fd.append('width', space.width);
			fd.append('length', space.length);
			fd.append('parapet', space.parapetHeight);
			fd.append('flooring', space.flooringType);
			fd.append('wpcColor', space.wpcColor);
			fd.append('metalColor', space.metalColor);
			fd.append('notes', notes);
			fd.append('itemsJson', JSON.stringify(items));
			fd.append('planJson', JSON.stringify(space));
			fd.append('bomJson', JSON.stringify(bom));
			fd.append('snapshot', dataUrl);

			fetch(cfg.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
				.then(function (r) { return r.json(); })
				.then(function (res) {
					btn.disabled = false;
					btn.innerText = 'ارسال طرح و دریافت مشاوره';
					if (res.success) {
						var trackId = res && res.data && res.data.id ? 'کد پیگیری طرح: CK-' + res.data.id : '';
						showNotice('success', '✓ طرح شما با موفقیت ثبت شد و کارشناسان چکادبام به‌زودی با شما تماس می‌گیرند.' + (trackId ? '<br><b dir="ltr">' + trackId + '</b>' : ''));
						setTimeout(function () {
							closeModal('save');
							notice.className = 'ckb-notice';
						}, 6000);
					} else {
						showNotice('error', 'خطا در ثبت طرح: ' + (res.data || 'خطای سرور'));
					}
				})
				.catch(function () {
					btn.disabled = false;
					btn.innerText = 'ارسال طرح و دریافت مشاوره';
					showNotice('error', 'خطای شبکه؛ لطفاً مجدداً تلاش کنید.');
				});
		}

		/* Toolbar buttons */
		function bindClick(id, fn) {
			var el = $(id);
			if (el) el.addEventListener('click', fn);
		}

		/* ── v2.10: bottom tab bar + tools sheet on EVERY viewport ──
		   The 14-button dock becomes a 5-tab bar (افزودن، نقشه، برآورد،
		   ابزارها، ثبت طرح). Everything secondary moves into one floating
		   "tools" sheet. Original buttons are MOVED (not cloned) so every
		   id, click handler, undo/redo disabled state, lighting .active
		   class and the BOM badge keeps working untouched. Desktop gets
		   the same bar as a floating centered pill (studio.css). */
		var moreSheetToggle = null;
		function svgIcon(paths) {
			return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
		}
		var TAB_ICONS = {
			add: svgIcon('<path d="M12 5v14M5 12h14"/>'),
			plan: svgIcon('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v8"/>'),
			bom: svgIcon('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
			coach: svgIcon('<path d="M12 3l1.9 5.4L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.6z"/><circle cx="18.5" cy="18" r="1.4"/>'),
			more: svgIcon('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
			save: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
		};
		function setupTabbar() {
			var vpBar = rootEl.querySelector('.ckb-wstudio-viewport');
			var dockBar = rootEl.querySelector('.ckb-wstudio-dock');
			if (!vpBar || !dockBar) return;

			var bar = document.createElement('nav');
			bar.className = 'ckb-tabbar';
			bar.setAttribute('aria-label', 'منوی اصلی استودیو');

			function buildTab(btn, iconKey, label, extraClass) {
				if (!btn) return;
				var badge = btn.querySelector('.ckb-bom-count');
				btn.className = 'ckb-tab' + (extraClass ? ' ' + extraClass : '');
				btn.innerHTML = TAB_ICONS[iconKey] + '<span class="ckb-tab-label">' + label + '</span>';
				if (badge) btn.appendChild(badge);
				bar.appendChild(btn);
			}
			buildTab($('btn-add'), 'add', 'افزودن');
			buildTab($('btn-plan-editor'), 'plan', 'نقشه بام');
			buildTab($('btn-bom'), 'bom', 'برآورد');

			/* «همراه طراح» (v2.11): تب پنل راهنمای طراحی — پنل را ckb-coach.js
			   می‌سازد؛ اینجا فقط دکمه تب و درخواست باز/بسته. حالت .on و
			   aria-expanded را onChange خود ماژول همگام نگه می‌دارد. */
			var coachBtn = document.createElement('button');
			coachBtn.type = 'button';
			coachBtn.className = 'ckb-tab ckb-tab-coach';
			coachBtn.id = sid + '-btn-coach';
			coachBtn.setAttribute('aria-label', 'همراه طراح — راهنمای چیدمان بام و تراس');
			coachBtn.setAttribute('aria-expanded', 'false');
			coachBtn.innerHTML = TAB_ICONS.coach + '<span class="ckb-tab-label">همراه طراح</span>';
			coachBtn.addEventListener('click', function () {
				if (window.CKBCoach) window.CKBCoach.toggle();
			});
			bar.appendChild(coachBtn);

			/* «ابزارها»: opens the sheet with everything secondary */
			var moreBtn = document.createElement('button');
			moreBtn.type = 'button';
			moreBtn.className = 'ckb-tab ckb-tab-more';
			moreBtn.id = sid + '-btn-more';
			moreBtn.setAttribute('aria-expanded', 'false');
			moreBtn.innerHTML = TAB_ICONS.more + '<span class="ckb-tab-label">ابزارها</span>';
			bar.appendChild(moreBtn);
			buildTab($('btn-save'), 'save', 'ثبت طرح', 'primary');

			/* Tools sheet — original buttons moved in, ids/state intact */
			var backdrop = document.createElement('div');
			backdrop.className = 'ckb-more-backdrop';
			var sheet = document.createElement('div');
			sheet.className = 'ckb-more-sheet';
			sheet.innerHTML = '<div class="ckb-more-head"><span>ابزارهای استودیو</span><button type="button" class="ckb-more-close" aria-label="بستن ابزارها">✕</button></div>';
			function addGroup(caption, ids) {
				var g = document.createElement('div');
				g.className = 'ckb-more-group';
				var cap = document.createElement('span');
				cap.className = 'ckb-more-cap';
				cap.innerText = caption;
				g.appendChild(cap);
				var row = document.createElement('div');
				row.className = 'ckb-more-row';
				ids.forEach(function (id) {
					var b = $(id);
					if (b) row.appendChild(b);
				});
				g.appendChild(row);
				sheet.appendChild(g);
			}
			addGroup('تاریخچه', ['btn-undo', 'btn-redo', 'btn-clear']);
			addGroup('نورپردازی', ['btn-day', 'btn-sunset', 'btn-night']);
			addGroup('نما و راهنما', ['btn-view', 'btn-cam', 'btn-guide']);
			vpBar.appendChild(backdrop);
			vpBar.appendChild(sheet);
			vpBar.appendChild(bar);
			dockBar.style.display = 'none'; /* the old scroll row retires */

			var moreOpen = false;
			moreSheetToggle = function (want) {
				moreOpen = !!want;
				sheet.classList.toggle('open', moreOpen);
				backdrop.classList.toggle('show', moreOpen);
				moreBtn.classList.toggle('on', moreOpen);
				moreBtn.setAttribute('aria-expanded', moreOpen ? 'true' : 'false');
			};
			moreBtn.addEventListener('click', function () { moreSheetToggle(!moreOpen); });
			backdrop.addEventListener('click', function () { moreSheetToggle(false); });
			sheet.querySelector('.ckb-more-close').addEventListener('click', function () { moreSheetToggle(false); });
			/* any tool tap closes the sheet — the effect is visible on the canvas */
			sheet.addEventListener('click', function (e) {
				if (e.target.closest && e.target.closest('.ckb-more-row button')) {
					window.setTimeout(function () { moreSheetToggle(false); }, 180);
				}
			});
		}
		setupTabbar();

		/* ── v2.11 همراه طراح: پنل «راهنمای چیدمان بام و تراس» ──
		   ماژول مستقل ckb-coach.js — فقط وضعیت را می‌خواند و پنل خودش را
		   داخل ویوپورت می‌سازد. sync حالت .on تب هم از همین‌جا انجام
		   می‌شود تا تک‌منبع حقیقت، خودِ ماژول باشد. */
		if (window.CKBCoach) {
			window.CKBCoach.init({
				vp: rootEl.querySelector('.ckb-wstudio-viewport'),
				getState: function () { return { space: space, items: items, B: B }; },
				onChange: function (open) {
					var c = $('btn-coach');
					if (c) {
						c.classList.toggle('on', !!open);
						c.setAttribute('aria-expanded', open ? 'true' : 'false');
					}
				},
			});
		}

		/* تازه‌سازی پنل همراه طراح — در نقاط تغییر وضعیت (بازچینی، تاریخچه)
		   صدا زده می‌شود؛ ماژول خودش بسته/باز بودن پنل را مدیریت می‌کند. */
		function coachRefresh() {
			if (window.CKBCoach) window.CKBCoach.refresh();
		}

		/* Sync the inspector offset with the live bar height
		   (observes the tab bar — mirrors --ckb-dock-h
		   so wrapping/safe-area changes stay aligned) */
		var dockEl = rootEl.querySelector('.ckb-tabbar') || rootEl.querySelector('.ckb-wstudio-dock');
		if (dockEl && typeof ResizeObserver === 'function') {
			var ro = new ResizeObserver(function () {
				rootEl.style.setProperty('--ckb-dock-h', dockEl.offsetHeight + 'px');
			});
			ro.observe(dockEl);
		} else if (dockEl) {
			rootEl.style.setProperty('--ckb-dock-h', dockEl.offsetHeight + 'px');
			window.addEventListener('resize', function () {
				rootEl.style.setProperty('--ckb-dock-h', dockEl.offsetHeight + 'px');
			});
		}

		bindClick('btn-add', function () {
			buildCatalogTools();
			renderCatalog();
			openModal('catalog');
		});
		var searchEl = $('catalog-search');
		if (searchEl) {
			searchEl.addEventListener('input', function () {
				catalogFilter.q = searchEl.value.trim().toLowerCase();
				renderCatalog();
			});
		}
		bindClick('btn-guide', startStudioTour);
		// «شروع طراحی»: first the plans are shown and selected, then the design space — order matters
		bindClick('btn-guide-start', function () {
			closeModal('guide');
			openPlanEditor();
		});
		bindClick('btn-plan-editor', function () { openPlanEditor(); });
		bindClick('btn-pe-help', startStudioTour);
		bindClick('btn-bom', function () { renderBOM(); openModal('bom'); });
		bindClick('btn-undo', undo);
		bindClick('btn-redo', redo);
		bindClick('btn-day', function () { setLighting('day'); });
		bindClick('btn-sunset', function () { setLighting('sunset'); });
		bindClick('btn-night', function () { setLighting('night'); });
		bindClick('btn-view', toggleView);
		bindClick('btn-rot45', function () { rotateSelected(45); });
		bindClick('btn-rot90', function () { rotateSelected(90); });
		bindClick('btn-dup', duplicateSelected);
		bindClick('btn-del', deleteSelected);
		bindClick('btn-desel', function () { selectItem(null); });
		bindClick('btn-nudge-left', function () { nudgeSelected(-0.5, 0); });
		bindClick('btn-nudge-right', function () { nudgeSelected(0.5, 0); });
		bindClick('btn-nudge-up', function () { nudgeSelected(0, -0.5); });
		bindClick('btn-nudge-down', function () { nudgeSelected(0, 0.5); });
		var swatchBar = $('insp-colors');
		if (swatchBar) {
			swatchBar.addEventListener('click', function (e) {
				var b = e.target.closest ? e.target.closest('.ckb-insp-swatch') : null;
				if (b) recolorSelected(b.getAttribute('data-color'));
			});
		}
		bindClick('btn-submit', submitDesign);
		bindClick('btn-cam', resetCamera);
		bindClick('btn-clear', clearAllItems);
		bindClick('btn-print', function () { window.print(); });
		bindClick('btn-download', downloadShot);
		bindClick('btn-save', prepareSaveModal);

		/* Collapsible dock (mobile): «⌄» shrinks it to the primary actions */
		var dockCollapsed = false;
		try { dockCollapsed = window.localStorage.getItem('ckb-dock-collapsed') === '1'; } catch (errDock) {}
		function applyDockState() {
			var dock = rootEl.querySelector('.ckb-wstudio-dock');
			if (dock) dock.classList.toggle('collapsed', dockCollapsed);
			var h = $('btn-dock');
			if (h) {
				h.innerText = dockCollapsed ? '⌃' : '⌄';
				h.title = dockCollapsed ? 'بازکردن منو' : 'جمع‌کردن منو';
				h.setAttribute('aria-expanded', dockCollapsed ? 'false' : 'true');
			}
		}
		bindClick('btn-dock', function () {
			dockCollapsed = !dockCollapsed;
			try { window.localStorage.setItem('ckb-dock-collapsed', dockCollapsed ? '1' : '0'); } catch (errDock2) {}
			applyDockState();
		});
		applyDockState();

		// Modal close buttons
		rootEl.querySelectorAll('[data-close]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				closeModal(btn.getAttribute('data-close'));
			});
		});

		/* Mobile v2.8: bottom-sheet grab handle + tap-on-backdrop close.
		   The handle is injected here so every modal gets it without touching
		   markup; the backdrop tap matches standard mobile sheet behaviour. */
		rootEl.querySelectorAll('.ckb-wstudio-modal').forEach(function (modal) {
			var name = (modal.id || '').replace(sid + '-modal-', '');
			if (!name) return;
			var box = modal.querySelector('.ckb-wstudio-modal-box');
			if (box && !box.querySelector('.ckb-sheet-handle')) {
				var handle = document.createElement('button');
				handle.type = 'button';
				handle.className = 'ckb-sheet-handle';
				handle.setAttribute('aria-label', 'بستن پنجره');
				handle.addEventListener('click', function () { closeModal(name); });
				box.insertBefore(handle, box.firstChild);
			}
			modal.addEventListener('click', function (e) {
				if (e.target === modal) closeModal(name);
			});
		});

		// Plan editor live updates
		['pe-shape', 'pe-width', 'pe-length', 'pe-cutw', 'pe-cutl', 'pe-shaftw', 'pe-shaftl'].forEach(function (id) {
			var el = $(id);
			if (el) el.addEventListener('input', updatePlanEditorArea);
		});
		bindClick('btn-pe-apply', applyPlanEditor);
		bindClick('btn-pe-cancel', function () { closeModal('plan'); });

		function setLighting(mode) {
			lightingMode = mode;
			updateLighting();
			['day', 'sunset', 'night'].forEach(function (m) {
				var btn = $('btn-' + m);
				if (btn) btn.classList.toggle('active', m === mode);
			});
			// Rebuild models so item night lights match mode
			rebuildItems();
		}

		function toggleView() {
			viewMode = viewMode === '3d' ? '2d' : '3d';
			var btn = $('btn-view');
			if (btn) {
				var text = viewMode === '2d' ? 'دید ۳D' : 'پلان ۲D';
				var sm = viewMode === '2d' ? 'دید' : 'پلان';
				var lbl = btn.querySelector('.ckb-btn-label');
				if (lbl) lbl.innerText = text; /* span-aware: the icon stays untouched */
				else btn.innerText = text;
				var smEl = btn.querySelector('.ckb-btn-label-sm');
				if (smEl) smEl.innerText = sm; /* short mobile label under the icon */
			}
			if (viewMode === '2d') {
				setTopView(true);
			} else {
				setTopView(false);
			}
		}

		/* ─────────────── Full-studio visual tour (spotlight) ───────────────
		   Plays once on first visit (in place of the static guide modal):
		   first the plan window, then adding/moving items and every dock tool.
		   «؟ راهنما» and «؟ راهنمای تصویری» replay it on demand. */
		var planTourStep = -1;
		var tourSpot = null;
		var tourCard = null;
		var STUDIO_TOUR = [
			{
				title: 'دو راه برای شروع',
				desc: 'پلان آماده را یک‌جا بارگذاری کنید، یا فرم و ابعاد بام خودتان را دستی بسازید.',
				getEl: function () { return $('plan-tabs'); },
				ptab: null,
				modal: 'plan',
			},
			{
				title: 'پلان‌های آماده',
				desc: 'هر کارت نقشه و چیدمان کامل یک روف‌گاردن است — با یک کلیک روی بوم می‌آید.',
				getEl: function () { return $('plans-list'); },
				ptab: 'presets',
				modal: 'plan',
			},
			{
				title: 'فرم و ابعاد دلخواه',
				desc: 'شکل هندسی بام را انتخاب و ابعاد را به متر بدهید؛ متراژ زنده همین‌جا محاسبه می‌شود.',
				getEl: function () { var el = $('pe-shape'); return el ? el.closest('.ckb-fgroup') : null; },
				ptab: 'custom',
				modal: 'plan',
			},
			{
				title: 'اعمال روی بوم',
				desc: 'با «اعمال پلان جدید»، بوم سه‌بعدی با فرم تازه بازسازی می‌شود و اقلام داخل مرزها می‌مانند.',
				getEl: function () { return $('btn-pe-apply'); },
				ptab: 'custom',
				modal: 'plan',
			},
			{
				title: 'افزودن اقلام به بام',
				desc: 'با «+ افزودن اقلام» کاتالوگ باز می‌شود؛ با جستجو یا فیلتر دسته‌بندی قلم موردنظر را پیدا و اضافه کنید.',
				getEl: function () { return $('btn-add'); },
				modal: null,
			},
			{
				title: 'جابه‌جایی و تنظیم قلم',
				desc: 'قلم انتخاب‌شده را با ماوس یا انگشت بکشید؛ با دکمه‌های جهت‌دار نوار قلم نیم‌متر یک‌جا حرکتش دهید (کلیدهای جهت‌دار هم همین کار را می‌کنند). چرخش ۴۵° و ۹۰°، تکثیر و رنگ چوب‌پلاست هم از همان نوار.',
				getEl: function () { return rootEl.querySelector('.ckb-wstudio-viewport'); },
				modal: null,
			},
			{
				title: 'نورپردازی صحنه',
				desc: 'سه حالت نور روز، غروب و شب — پنجره‌های ساختمان در حالت شب روشن می‌شوند و حس واقعی فضای بام را می‌سازند.',
				getEl: function () { return $('btn-night'); },
				modal: null,
			},
			{
				title: 'دید پلان ۲D و بازنشانی دوربین',
				desc: 'با «👁 پلان ۲D» نمای بالا و دوبعدی بام را ببینید و با «🔄 دید اول» دوربین به نمای اولیه برمی‌گردد.',
				getEl: function () { return $('btn-view'); },
				modal: null,
			},
			{
				title: 'فهرست اقلام و برآورد',
				desc: 'متراژ اقلام، فضای سبز و ایمنی سازه همین‌جا محاسبه می‌شود و با «🖨 چاپ» قابل چاپ است.',
				getEl: function () { return $('btn-bom'); },
				modal: null,
			},
			{
				title: 'ثبت و ارسال طرح',
				desc: 'طرح شما با یک اسکرین‌شات از صحنه ثبت می‌شود؛ تصویر طرح قابل دانلود است و کارشناسان چکادبام با شما تماس می‌گیرند.',
				getEl: function () { return $('btn-save'); },
				modal: null,
			},
		];

		function ensureTourOverlay() {
			if (tourSpot) return;
			tourSpot = document.createElement('div');
			tourSpot.className = 'ckb-tour-spot';
			tourSpot.style.display = 'none';
			rootEl.appendChild(tourSpot);

			tourCard = document.createElement('div');
			tourCard.className = 'ckb-tour-card';
			tourCard.style.display = 'none';
			tourCard.setAttribute('role', 'dialog');
			tourCard.setAttribute('aria-label', 'راهنمای تصویری استودیو');
			tourCard.innerHTML =
				'<div class="ckb-tour-row">' +
					'<div class="ckb-tour-ic">?</div>' +
					'<div class="ckb-tour-body"><h5></h5><p></p></div>' +
				'</div>' +
				'<div class="ckb-tour-foot">' +
					'<button type="button" class="ckb-tour-skip">رد کردن</button>' +
					'<div class="ckb-tour-nav">' +
						'<span class="ckb-tour-dots" aria-hidden="true"></span>' +
						'<button type="button" class="ckb-tour-prev">قبلی</button>' +
						'<button type="button" class="ckb-tour-next ckb-tour-primary">بعدی</button>' +
					'</div>' +
				'</div>';
			rootEl.appendChild(tourCard);

			tourCard.querySelector('.ckb-tour-skip').addEventListener('click', endPlanTour);
			tourCard.querySelector('.ckb-tour-prev').addEventListener('click', function () {
				if (planTourStep > 0) { planTourStep--; showPlanTour(); }
			});
			tourCard.querySelector('.ckb-tour-next').addEventListener('click', function () {
				if (planTourStep >= STUDIO_TOUR.length - 1) { endPlanTour(); return; }
				planTourStep++;
				showPlanTour();
			});
		}

		function showPlanTour() {
			ensureTourOverlay();
			var meta = STUDIO_TOUR[planTourStep];
			/* Move between the plan window and the main canvas as the tour walks on */
			if (meta.modal === 'plan') {
				var pm = $('modal-plan');
				if (pm && getComputedStyle(pm).display === 'none') openModal('plan');
				if (meta.ptab) setPlanTab(meta.ptab);
			} else {
				closeModal('plan');
			}
			requestAnimationFrame(function () {
				requestAnimationFrame(function () {
					drawPlanTour(meta);
				});
			});
		}

		function drawPlanTour(meta) {
			var el = meta.getEl();
			if (!el) { endPlanTour(); return; }
			/* v2.9: a tool highlighted by the tour may live in the mobile sheet */
			if (el && moreSheetToggle) {
				var tourSheet = el.closest ? el.closest('.ckb-more-sheet') : null;
				if (tourSheet && !tourSheet.classList.contains('open')) moreSheetToggle(true);
			}
			if (meta.modal === 'plan') el.scrollIntoView({ block: 'center' });
			var r = el.getBoundingClientRect();
			var pad = 8;
			tourSpot.style.display = 'block';
			tourSpot.style.top = (r.top - pad) + 'px';
			tourSpot.style.left = (r.left - pad) + 'px';
			tourSpot.style.width = (r.width + pad * 2) + 'px';
			tourSpot.style.height = (r.height + pad * 2) + 'px';

			tourCard.querySelector('h5').innerText = meta.title;
			tourCard.querySelector('p').innerText = meta.desc;
			tourCard.querySelector('.ckb-tour-next').innerText =
				planTourStep >= STUDIO_TOUR.length - 1 ? 'فهمیدم' : 'بعدی';
			var dots = '';
			for (var d = 0; d < STUDIO_TOUR.length; d++) {
				dots += '<span class="' + (d === planTourStep ? 'on' : '') + '"></span>';
			}
			tourCard.querySelector('.ckb-tour-dots').innerHTML = dots;
			tourCard.querySelector('.ckb-tour-prev').style.display = planTourStep > 0 ? '' : 'none';

			var cardH = 165;
			var cardW = 330;
			var huge = r.height > window.innerHeight * 0.55; /* e.g. the canvas step */
			var below = !huge && r.bottom + pad + 12 + cardH < window.innerHeight - 12;
			var cardTop = below
				? r.bottom + pad + 12
				: (huge
					? Math.max(12, window.innerHeight - cardH - 120) /* hug the dock, keep the scene visible */
					: Math.max(12, r.top - pad - 12 - cardH));
			var cardLeft = Math.min(Math.max(12, r.left + r.width / 2 - cardW / 2), window.innerWidth - cardW - 12);
			tourCard.style.display = 'block';
			tourCard.style.top = cardTop + 'px';
			tourCard.style.left = cardLeft + 'px';
		}

		function startStudioTour() {
			planTourStep = 0;
			showPlanTour();
		}

		function endPlanTour() {
			planTourStep = -1;
			if (tourSpot) tourSpot.style.display = 'none';
			if (tourCard) tourCard.style.display = 'none';
		}

		/* ─────────────── Boot ─────────────── */
		/* Per-item WPC swatches — same palette as the Next.js inspector */
		var WPC_SWATCHES = [
			{ id: 'walnut', name: 'گردویی شکلاتی', hex: '#4a321f' },
			{ id: 'teak', name: 'تیک طبیعی', hex: '#9b683e' },
			{ id: 'charcoal', name: 'دودی ذغالی', hex: '#2b2a29' },
			{ id: 'oak', name: 'بلوطی روشن', hex: '#c59d6f' },
		];

		function buildInspSwatches() {
			var bar = $('insp-colors');
			if (!bar || bar.childElementCount) return;
			bar.innerHTML = WPC_SWATCHES.map(function (c) {
				return '<button type="button" class="ckb-insp-swatch" data-color="' + c.id +
					'" title="رنگ ' + c.name + '" aria-label="رنگ ' + c.name + '" style="background:' + c.hex + '"></button>';
			}).join('');
		}

		buildInspSwatches();
		updateLighting();
		loadPlan(currentPlan);
		setLighting(lightingMode);
		animate();

		// First visit: the full visual tour (plan → add → move → toolbar) plays
		// in place of the static guide modal, for admin and public alike.
		// Public embeds keep the guide modal on LATER visits (its «شروع طراحی»
		// CTA opens the plan selection directly).
		var tourSeen = false;
		try { tourSeen = !!window.localStorage.getItem('ckb-studio-tour-seen'); } catch (err3) { tourSeen = true; }
		if (!tourSeen) {
			try { window.localStorage.setItem('ckb-studio-tour-seen', '1'); } catch (err4) {}
			setTimeout(startStudioTour, 900);
		} else if (cfg.autoPlans) {
			setTimeout(function () { openModal('guide'); }, 900);
		}

		return {
			resetCamera: resetCamera,
			setLighting: setLighting,
			toggleView: toggleView,
			openCatalog: function () { buildCatalogTools(); renderCatalog(); openModal('catalog'); },
			openPlans: function () { openPlanEditor(); },
			openBOM: function () { renderBOM(); openModal('bom'); },
			openSave: function () { prepareSaveModal(); },
			deleteSelected: deleteSelected,
			duplicateSelected: duplicateSelected,
			nudgeSelected: nudgeSelected,
			clearAllItems: clearAllItems,
			rotateSelected: rotateSelected,
			deselect: function () { selectItem(null); },
			submitDesign: submitDesign,
			takeScreenshot: function () {
				renderer.render(scene, camera);
				try { return renderer.domElement.toDataURL('image/jpeg', 0.9); } catch (e) { return ''; }
			},
		};
	}

	window.CKBStudio = { mount: mount };
})();
