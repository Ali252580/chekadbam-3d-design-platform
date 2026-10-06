/**
 * Chekadbam Studio — Realistic 3D model builders (WordPress port).
 *
 * Ported 1:1 from createItemMeshGroup() in src/components/studio/Chekadbam3DCanvas.tsx
 * of the Chekadbam Next.js studio. Builds the same detailed modular products:
 * tree, bench_integrated, bench_backrest, lounge_set, firepit_table, pergola,
 * pergola_deck, green_wall_planter, green_wall, water_feature, firepit, umbrella,
 * bbq, louver, box (planter) + generic fallback.
 *
 * Global namespace: window.CKBModels
 * Depends on: THREE, CKBTextures, CKBFoliage
 */
(function () {
	'use strict';

	if (typeof THREE === 'undefined') {
		return;
	}

	var TEX = window.CKBTextures || {};
	var FOL = window.CKBFoliage || { seedFromId: function () { return 1; } };

	function wpcColorHexStr(colorId) {
		switch (colorId) {
			case 'teak': return '#9b683e';
			case 'charcoal': return '#2b2a29';
			case 'oak': return '#c59d6f';
			case 'walnut':
			default: return '#4a321f';
		}
	}

	function metalColorHex(colorId) {
		switch (colorId) {
			case 'charcoal': return 0x374151;
			case 'cream': return 0xd6cebe;
			case 'black':
			default: return 0x18181b;
		}
	}

	/**
	 * Builds a complete THREE.Group for one studio item.
	 *
	 * @param {object} item {id, width, depth, height, shapeType, wpcColor, metalColor, category, hasLighting}
	 * @param {object} opts  {isNight:boolean, wpcColor:string, metalColor:string}
	 */
	function buildItemModel(item, opts) {
		opts = opts || {};
		var itemGroup = new THREE.Group();
		itemGroup.name = 'item-' + (item.id || 'new');
		itemGroup.userData = { itemId: item.id || '' };

		var wpcHex = wpcColorHexStr(item.wpcColor || opts.wpcColor);
		var metalColorHexVal = metalColorHex(item.metalColor || opts.metalColor);

		var wpcTex = TEX.createWpcPlankTexture ? TEX.createWpcPlankTexture(wpcHex, 0.25, 6) : {};
		var wpcMaterial = new THREE.MeshStandardMaterial({
			map: wpcTex.map,
			bumpMap: wpcTex.bumpMap,
			bumpScale: 0.06,
			roughness: 0.55,
			metalness: 0.05,
		});

		var metalMaterial = new THREE.MeshStandardMaterial({
			color: metalColorHexVal,
			roughness: 0.35,
			metalness: 0.85,
		});

		var soilMaterial = new THREE.MeshStandardMaterial({
			color: 0x271c14,
			roughness: 0.95,
		});

		var isNight = !!opts.isNight;
		var seedOf = FOL.seedFromId;
		// Per-frame living effects (falling water, ripples, flames) — the host
		// render loop iterates this list; rebuilt together with the model.
		var FX = opts.effects || null;
		function fxPhase() { return (seedOf(item.id) % 100) / 16; }

		switch (item.shapeType) {
			case 'tree': {
				// Planter Pot (Cylinder with metal bands)
				var potGeo = new THREE.CylinderGeometry(0.35, 0.28, 0.55, 24);
				var potMesh = new THREE.Mesh(potGeo, metalMaterial);
				potMesh.position.y = 0.275;
				potMesh.castShadow = true;
				potMesh.receiveShadow = true;
				itemGroup.add(potMesh);

				// Soil
				var soilGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.05, 24);
				var soilMesh = new THREE.Mesh(soilGeo, soilMaterial);
				soilMesh.position.y = 0.53;
				itemGroup.add(soilMesh);

				// Trunk
				var trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.1, 12);
				var trunkMat = new THREE.MeshStandardMaterial({ color: 0x452f1e, roughness: 0.9 });
				var trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
				trunkMesh.position.y = 1.0;
				trunkMesh.castShadow = true;
				itemGroup.add(trunkMesh);

				// Natural layered canopy of individual leaves
				if (FOL.createTreeCanopy) {
					var canopy = FOL.createTreeCanopy(0.56, seedOf(item.id), true);
					canopy.position.set(0, 1.62, 0);
					itemGroup.add(canopy);
				}

				// A few small ground-cover plants at the base of the trunk
				if (FOL.createGroundCover) {
					var potCover = FOL.createGroundCover(0.5, 0.5, seedOf(item.id) + 4, true);
					potCover.position.set(0, 0.55, 0);
					itemGroup.add(potCover);
				}

				if (isNight) {
					var spot = new THREE.PointLight(0xfef08a, 2.0, 4.5);
					spot.position.set(0, 0.6, 0);
					itemGroup.add(spot);
				}
				break;
			}

			case 'bench_integrated': {
				// Left & Right WPC Planters
				var boxGeo = new THREE.BoxGeometry(0.5, item.height, 0.5);
				var leftBox = new THREE.Mesh(boxGeo, wpcMaterial);
				leftBox.position.set(-item.width / 2 + 0.25, item.height / 2, 0);
				leftBox.castShadow = true;
				leftBox.receiveShadow = true;
				itemGroup.add(leftBox);

				var rightBox = new THREE.Mesh(boxGeo, wpcMaterial);
				rightBox.position.set(item.width / 2 - 0.25, item.height / 2, 0);
				rightBox.castShadow = true;
				rightBox.receiveShadow = true;
				itemGroup.add(rightBox);

				// Metal rims
				var rimGeo = new THREE.BoxGeometry(0.52, 0.04, 0.52);
				var rimL = new THREE.Mesh(rimGeo, metalMaterial);
				rimL.position.set(-item.width / 2 + 0.25, item.height, 0);
				itemGroup.add(rimL);

				var rimR = new THREE.Mesh(rimGeo, metalMaterial);
				rimR.position.set(item.width / 2 - 0.25, item.height, 0);
				itemGroup.add(rimR);

				// Center WPC Slatted Bench Seat
				var seatW = item.width - 1.0;
				var seatGeo = new THREE.BoxGeometry(seatW, 0.08, 0.45);
				var seatMesh = new THREE.Mesh(seatGeo, wpcMaterial);
				seatMesh.position.set(0, 0.42, 0);
				seatMesh.castShadow = true;
				itemGroup.add(seatMesh);

				// Metal support legs
				var legGeo = new THREE.BoxGeometry(0.06, 0.38, 0.42);
				var legMesh = new THREE.Mesh(legGeo, metalMaterial);
				legMesh.position.set(0, 0.19, 0);
				legMesh.castShadow = true;
				itemGroup.add(legMesh);

				// Natural flowering plants in both side boxes
				if (FOL.createFoliageCluster) {
					var bushL = FOL.createFoliageCluster({
						radius: 0.26,
						seed: seedOf(item.id) + 11,
						density: 1.1,
						heightScale: 1.05,
						withFlowers: true,
						tone: 'normal',
					});
					bushL.position.set(-item.width / 2 + 0.25, item.height + 0.18, 0);
					itemGroup.add(bushL);

					var bushR = FOL.createFoliageCluster({
						radius: 0.26,
						seed: seedOf(item.id) + 47,
						density: 1.1,
						heightScale: 1.05,
						withFlowers: true,
						tone: 'light',
					});
					bushR.position.set(item.width / 2 - 0.25, item.height + 0.18, 0);
					itemGroup.add(bushR);
				}

				if (isNight) {
					var led = new THREE.PointLight(0xffe699, 2.4, 4);
					led.position.set(0, 0.2, 0);
					itemGroup.add(led);
				}
				break;
			}

			case 'bench_backrest': {
				// Slatted WPC bench with angled backrest on black steel sled frame
				var bW = item.width || 1.4;
				var bD = item.depth || 0.62;
				var seatH = 0.45;
				var seatD = bD * 0.72;
				var frameThk = 0.05;

				// --- Black steel sled legs (two sides) ---
				[-1, 1].forEach(function (side) {
					var legX = side * (bW / 2 - 0.16);

					// Bottom floor runner (sled foot)
					var footGeo = new THREE.BoxGeometry(0.07, 0.045, seatD + 0.06);
					var footMesh = new THREE.Mesh(footGeo, metalMaterial);
					footMesh.position.set(legX, 0.022, 0);
					footMesh.castShadow = true;
					footMesh.receiveShadow = true;
					itemGroup.add(footMesh);

					// Two vertical posts (front & back of the sled)
					[-1, 1].forEach(function (zSide) {
						var postGeo = new THREE.BoxGeometry(0.055, seatH, frameThk);
						var postMesh = new THREE.Mesh(postGeo, metalMaterial);
						postMesh.position.set(legX, seatH / 2, zSide * (seatD / 2 - 0.03));
						postMesh.castShadow = true;
						itemGroup.add(postMesh);
					});

					// Horizontal cross stretcher between the two posts
					var braceGeo = new THREE.BoxGeometry(0.05, 0.05, seatD - 0.04);
					var braceMesh = new THREE.Mesh(braceGeo, metalMaterial);
					braceMesh.position.set(legX, seatH * 0.42, 0);
					braceMesh.castShadow = true;
					itemGroup.add(braceMesh);
				});

				// Long stretcher bar connecting both legs
				var longBraceGeo = new THREE.BoxGeometry(bW - 0.3, 0.045, 0.045);
				var longBraceMesh = new THREE.Mesh(longBraceGeo, metalMaterial);
				longBraceMesh.position.set(0, seatH * 0.42, 0);
				longBraceMesh.castShadow = true;
				itemGroup.add(longBraceMesh);

				// Seat perimeter steel rails
				[-1, 1].forEach(function (zSide) {
					var railGeo = new THREE.BoxGeometry(bW, 0.05, 0.045);
					var railMesh = new THREE.Mesh(railGeo, metalMaterial);
					railMesh.position.set(0, seatH - 0.03, zSide * (seatD / 2));
					railMesh.castShadow = true;
					itemGroup.add(railMesh);
				});

				// --- WPC horizontal seat slats with visible gaps ---
				var seatSlatCount = 5;
				var seatSlatDepth = (seatD - 0.05) / seatSlatCount - 0.012;
				for (var s = 0; s < seatSlatCount; s++) {
					var slatGeo = new THREE.BoxGeometry(bW + 0.03, 0.035, seatSlatDepth);
					var slatMesh = new THREE.Mesh(slatGeo, wpcMaterial);
					var sz = -seatD / 2 + 0.03 + s * (seatSlatDepth + 0.012) + seatSlatDepth / 2;
					slatMesh.position.set(0, seatH, sz);
					slatMesh.castShadow = true;
					slatMesh.receiveShadow = true;
					itemGroup.add(slatMesh);
				}

				// --- Angled backrest ---
				var backTilt = -0.22;
				var backH = 0.42;
				var backZ = -seatD / 2 + 0.02;

				// Backrest support brackets (black steel)
				[-1, 1].forEach(function (side) {
					var brkGeo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
					var brkMesh = new THREE.Mesh(brkGeo, metalMaterial);
					brkMesh.position.set(side * (bW / 2 - 0.16), seatH + 0.08, backZ + 0.02);
					brkMesh.castShadow = true;
					itemGroup.add(brkMesh);
				});

				// Backrest frame group (tilted)
				var backGroup = new THREE.Group();
				backGroup.position.set(0, seatH + 0.18, backZ);
				backGroup.rotation.x = backTilt;

				// Side frame rails of the backrest
				[-1, 1].forEach(function (side) {
					var sideGeo = new THREE.BoxGeometry(0.05, backH, 0.04);
					var sideMesh = new THREE.Mesh(sideGeo, metalMaterial);
					sideMesh.position.set(side * (bW / 2 - 0.03), backH / 2, 0);
					sideMesh.castShadow = true;
					backGroup.add(sideMesh);
				});

				// Backrest WPC slats with gaps
				var backSlatCount = 4;
				var backSlatH = (backH - 0.04) / backSlatCount - 0.022;
				for (var sb = 0; sb < backSlatCount; sb++) {
					var bSlatGeo = new THREE.BoxGeometry(bW - 0.02, backSlatH, 0.035);
					var bSlatMesh = new THREE.Mesh(bSlatGeo, wpcMaterial);
					var by = 0.04 + sb * (backSlatH + 0.022) + backSlatH / 2;
					bSlatMesh.position.set(0, by, 0.015);
					bSlatMesh.castShadow = true;
					bSlatMesh.receiveShadow = true;
					backGroup.add(bSlatMesh);
				}

				itemGroup.add(backGroup);

				if (item.hasLighting && isNight) {
					var benchLight = new THREE.PointLight(0xffe699, 1.8, 3.2);
					benchLight.position.set(0, 0.2, 0);
					itemGroup.add(benchLight);
				}
				break;
			}

			case 'lounge_set': {
				// Modern 4-Piece Outdoor Conversation Lounge Set
				var cushionTex = TEX.createCanvasFabricTexture ? TEX.createCanvasFabricTexture('#e8e2d5') : {};
				var cushionMat = new THREE.MeshStandardMaterial({
					map: cushionTex.map,
					bumpMap: cushionTex.bumpMap,
					bumpScale: 0.04,
					roughness: 0.82,
					metalness: 0.01,
					color: 0xede8de,
				});

				var armTubeSize = 0.045;
				var seatElevation = 0.38;
				var cushionThickness = 0.11;

				// Helper to build a lounge seating unit (Loveseat or Armchair)
				var buildLoungeUnit = function (unitW, unitD, unitH, posX, posZ, rotY) {
					var uGroup = new THREE.Group();
					uGroup.position.set(posX, 0, posZ);
					uGroup.rotation.y = rotY;

					var armH = 0.62;
					var armD = unitD * 0.95;
					var halfInnerW = unitW / 2;

					// Two side black steel rectangular loop armrests
					[-1, 1].forEach(function (side) {
						var lx = side * (halfInnerW + armTubeSize / 2);

						var bottomRunner = new THREE.Mesh(
							new THREE.BoxGeometry(armTubeSize, armTubeSize, armD),
							metalMaterial
						);
						bottomRunner.position.set(lx, armTubeSize / 2, 0);
						bottomRunner.castShadow = true;
						bottomRunner.receiveShadow = true;
						uGroup.add(bottomRunner);

						var topArm = new THREE.Mesh(
							new THREE.BoxGeometry(armTubeSize, armTubeSize, armD),
							metalMaterial
						);
						topArm.position.set(lx, armH - armTubeSize / 2, 0);
						topArm.castShadow = true;
						uGroup.add(topArm);

						var frontPost = new THREE.Mesh(
							new THREE.BoxGeometry(armTubeSize, armH, armTubeSize),
							metalMaterial
						);
						frontPost.position.set(lx, armH / 2, armD / 2 - armTubeSize / 2);
						frontPost.castShadow = true;
						uGroup.add(frontPost);

						var rearPost = new THREE.Mesh(
							new THREE.BoxGeometry(armTubeSize, armH, armTubeSize),
							metalMaterial
						);
						rearPost.position.set(lx, armH / 2, -armD / 2 + armTubeSize / 2);
						rearPost.castShadow = true;
						uGroup.add(rearPost);
					});

					// Seat support horizontal steel frame
					var seatFrameFront = new THREE.Mesh(
						new THREE.BoxGeometry(unitW, armTubeSize, armTubeSize),
						metalMaterial
					);
					seatFrameFront.position.set(0, seatElevation - armTubeSize / 2, armD / 2 - armTubeSize / 2);
					seatFrameFront.castShadow = true;
					uGroup.add(seatFrameFront);

					var seatFrameRear = new THREE.Mesh(
						new THREE.BoxGeometry(unitW, armTubeSize, armTubeSize),
						metalMaterial
					);
					seatFrameRear.position.set(0, seatElevation - armTubeSize / 2, -armD / 2 + armTubeSize / 2);
					seatFrameRear.castShadow = true;
					uGroup.add(seatFrameRear);

					// Horizontal WPC wood slats under the seat cushion
					var slatCount = Math.max(4, Math.round(unitD / 0.14));
					var slatDepth = (armD - 0.08) / slatCount - 0.012;
					for (var s2 = 0; s2 < slatCount; s2++) {
						var sMesh = new THREE.Mesh(
							new THREE.BoxGeometry(unitW - 0.02, 0.028, slatDepth),
							wpcMaterial
						);
						var sz2 = -armD / 2 + 0.04 + s2 * (slatDepth + 0.012) + slatDepth / 2;
						sMesh.position.set(0, seatElevation + 0.014, sz2);
						sMesh.castShadow = true;
						sMesh.receiveShadow = true;
						uGroup.add(sMesh);
					}

					// Plush thick seat cushion (cream Sunbrella fabric)
					var seatCushion = new THREE.Mesh(
						new THREE.BoxGeometry(unitW - 0.03, cushionThickness, armD - 0.06),
						cushionMat
					);
					seatCushion.position.set(0, seatElevation + 0.028 + cushionThickness / 2, 0);
					seatCushion.castShadow = true;
					seatCushion.receiveShadow = true;
					uGroup.add(seatCushion);

					// Backrest tilted support frame
					var backTiltL = -0.16;
					var backHL = 0.44;
					var backZL = -armD / 2 + 0.08;

					var backGroupL = new THREE.Group();
					backGroupL.position.set(0, seatElevation + 0.04, backZL);
					backGroupL.rotation.x = backTiltL;

					// Backrest outer steel frame uprights
					[-1, 1].forEach(function (side) {
						var backUpright = new THREE.Mesh(
							new THREE.BoxGeometry(armTubeSize * 0.9, backHL, armTubeSize * 0.9),
							metalMaterial
						);
						backUpright.position.set(side * (halfInnerW - armTubeSize / 2), backHL / 2, 0);
						backUpright.castShadow = true;
						backGroupL.add(backUpright);
					});

					// Vertical WPC wood slats behind the back cushion
					var backSlatCountL = Math.max(3, Math.round(unitW / 0.18));
					var backSlatWL = (unitW - armTubeSize * 2 - 0.04) / backSlatCountL - 0.015;
					for (var bs = 0; bs < backSlatCountL; bs++) {
						var bsMesh = new THREE.Mesh(
							new THREE.BoxGeometry(backSlatWL, backHL - 0.04, 0.022),
							wpcMaterial
						);
						var bsx = -(unitW - armTubeSize * 2 - 0.04) / 2 + bs * (backSlatWL + 0.015) + backSlatWL / 2;
						bsMesh.position.set(bsx, backHL / 2, -0.01);
						bsMesh.castShadow = true;
						bsMesh.receiveShadow = true;
						backGroupL.add(bsMesh);
					}

					// Plush backrest cushion
					var backCushion = new THREE.Mesh(
						new THREE.BoxGeometry(unitW - 0.04, backHL * 0.94, cushionThickness),
						cushionMat
					);
					backCushion.position.set(0, backHL / 2, 0.055);
					backCushion.castShadow = true;
					backCushion.receiveShadow = true;
					backGroupL.add(backCushion);

					uGroup.add(backGroupL);
					return uGroup;
				};

				// 1. Two-Seater Loveseat Sofa (Rear Center)
				itemGroup.add(buildLoungeUnit(1.28, 0.74, 0.76, 0, -0.42, 0));

				// 2. Left Single Armchair
				itemGroup.add(buildLoungeUnit(0.66, 0.72, 0.76, -0.88, 0.22, Math.PI / 12));

				// 3. Right Single Armchair
				itemGroup.add(buildLoungeUnit(0.66, 0.72, 0.76, 0.88, 0.22, -Math.PI / 12));

				// 4. Center Coffee Table with Black Steel Sled Loop Frame and WPC Slatted Top
				var tableW = 0.92;
				var tableD = 0.54;
				var tableH = 0.38;
				var tableGroup = new THREE.Group();
				tableGroup.position.set(0, 0, 0.16);

				[-1, 1].forEach(function (side) {
					var tx = side * (tableW / 2 - armTubeSize / 2);

					var runner = new THREE.Mesh(
						new THREE.BoxGeometry(armTubeSize, armTubeSize, tableD),
						metalMaterial
					);
					runner.position.set(tx, armTubeSize / 2, 0);
					runner.castShadow = true;
					runner.receiveShadow = true;
					tableGroup.add(runner);

					var topBar = new THREE.Mesh(
						new THREE.BoxGeometry(armTubeSize, armTubeSize, tableD),
						metalMaterial
					);
					topBar.position.set(tx, tableH - armTubeSize / 2, 0);
					topBar.castShadow = true;
					tableGroup.add(topBar);

					[-1, 1].forEach(function (zs) {
						var post = new THREE.Mesh(
							new THREE.BoxGeometry(armTubeSize, tableH, armTubeSize),
							metalMaterial
						);
						post.position.set(tx, tableH / 2, zs * (tableD / 2 - armTubeSize / 2));
						post.castShadow = true;
						tableGroup.add(post);
					});
				});

				// Long perimeter apron frame
				[-1, 1].forEach(function (zs) {
					var apron = new THREE.Mesh(
						new THREE.BoxGeometry(tableW - armTubeSize * 2, armTubeSize, armTubeSize),
						metalMaterial
					);
					apron.position.set(0, tableH - armTubeSize / 2, zs * (tableD / 2 - armTubeSize / 2));
					apron.castShadow = true;
					tableGroup.add(apron);
				});

				// Inset Horizontal WPC wood slats with fine grooves
				var tSlatCount = 6;
				var tSlatD = (tableD - armTubeSize * 2 - 0.02) / tSlatCount - 0.008;
				for (var ts = 0; ts < tSlatCount; ts++) {
					var tsMesh = new THREE.Mesh(
						new THREE.BoxGeometry(tableW - armTubeSize * 2 - 0.02, 0.024, tSlatD),
						wpcMaterial
					);
					var tsz = -(tableD - armTubeSize * 2 - 0.02) / 2 + ts * (tSlatD + 0.008) + tSlatD / 2;
					tsMesh.position.set(0, tableH + 0.012, tsz);
					tsMesh.castShadow = true;
					tsMesh.receiveShadow = true;
					tableGroup.add(tsMesh);
				}

				itemGroup.add(tableGroup);
				break;
			}

			case 'firepit_table':
			case 'firepit': {
				// Square WPC firepit table with black steel flame basket
				var tW = item.width || 1.1;
				var tD = item.depth || 1.1;
				var tH = item.height || 0.72;
				if (item.shapeType === 'firepit') {
					// Round firepit: reduce footprint to a compact square pedestal
					tH = Math.min(tH, 0.55);
				}
				var topThk = 0.09;
				var baseW = tW * 0.6;
				var baseD = tD * 0.6;
				var baseH = tH - topThk - 0.05;

				// --- Pedestal base clad in horizontal WPC planks ---
				var planksY = 5;
				var plankH = baseH / planksY;
				for (var p = 0; p < planksY; p++) {
					var plankGeo = new THREE.BoxGeometry(baseW, plankH * 0.9, baseD);
					var plankMesh = new THREE.Mesh(plankGeo, wpcMaterial);
					plankMesh.position.set(0, 0.05 + p * plankH + plankH / 2, 0);
					plankMesh.castShadow = true;
					plankMesh.receiveShadow = true;
					itemGroup.add(plankMesh);
				}

				// Small black metal feet under the pedestal
				[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (f) {
					var footGeo = new THREE.BoxGeometry(0.055, 0.05, 0.055);
					var footMesh = new THREE.Mesh(footGeo, metalMaterial);
					footMesh.position.set(f[0] * (baseW / 2 - 0.05), 0.025, f[1] * (baseD / 2 - 0.05));
					footMesh.castShadow = true;
					itemGroup.add(footMesh);
				});

				// --- Tabletop: narrow WPC slats with fine grooves ---
				var topY = tH - topThk / 2;

				var bandGeo = new THREE.BoxGeometry(tW, topThk, tD);
				var bandMesh = new THREE.Mesh(bandGeo, wpcMaterial);
				bandMesh.position.set(0, topY, 0);
				bandMesh.castShadow = true;
				bandMesh.receiveShadow = true;
				itemGroup.add(bandMesh);

				var slatCount2 = 16;
				var innerW = tW - 0.08;
				var slatW = innerW / slatCount2 - 0.008;
				for (var s3 = 0; s3 < slatCount2; s3++) {
					var sGeo = new THREE.BoxGeometry(slatW, 0.012, tD - 0.08);
					var sMesh2 = new THREE.Mesh(sGeo, wpcMaterial);
					var sx = -innerW / 2 + s3 * (slatW + 0.008) + slatW / 2;
					sMesh2.position.set(sx, topY + topThk / 2 + 0.006, 0);
					sMesh2.castShadow = true;
					sMesh2.receiveShadow = true;
					itemGroup.add(sMesh2);
				}

				// --- Black steel flame basket with curved vertical bars ---
				var basketW = tW * 0.42;
				var basketD = tD * 0.32;
				var basketH = 0.17;
				var basketY = tH + basketH / 2;

				[basketY + basketH / 2, basketY - basketH / 2].forEach(function (ry) {
					var rimGeoX = new THREE.BoxGeometry(basketW, 0.022, 0.022);
					[-1, 1].forEach(function (zs) {
						var rim = new THREE.Mesh(rimGeoX, metalMaterial);
						rim.position.set(0, ry, zs * (basketD / 2));
						rim.castShadow = true;
						itemGroup.add(rim);
					});

					var rimGeoZ = new THREE.BoxGeometry(0.022, 0.022, basketD);
					[-1, 1].forEach(function (xs) {
						var rimZ = new THREE.Mesh(rimGeoZ, metalMaterial);
						rimZ.position.set(xs * (basketW / 2), ry, 0);
						rimZ.castShadow = true;
						itemGroup.add(rimZ);
					});
				});

				// Curved vertical bars along the long sides
				var barsPerSide = 9;
				for (var b = 0; b < barsPerSide; b++) {
					var bx = -basketW / 2 + 0.02 + (b * (basketW - 0.04)) / (barsPerSide - 1);
					[-1, 1].forEach(function (zs) {
						var barGeo = new THREE.TorusGeometry(basketH * 0.55, 0.009, 6, 10, Math.PI * 0.6);
						var barMesh = new THREE.Mesh(barGeo, metalMaterial);
						barMesh.position.set(bx, basketY, zs * (basketD / 2));
						barMesh.rotation.z = Math.PI / 2 + (zs > 0 ? 0.35 : -0.35);
						barMesh.rotation.y = Math.PI / 2;
						barMesh.castShadow = true;
						itemGroup.add(barMesh);
					});
				}

				// Lava rock bed inside the basket
				var lavaMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2a, roughness: 1 });
				for (var l = 0; l < 10; l++) {
					var rockGeo = new THREE.DodecahedronGeometry(0.026, 0);
					var rockMesh = new THREE.Mesh(rockGeo, lavaMat);
					rockMesh.position.set(
						-basketW / 2 + 0.05 + Math.random() * (basketW - 0.1),
						basketY - basketH * 0.28,
						-basketD / 2 + 0.04 + Math.random() * (basketD - 0.08)
					);
					itemGroup.add(rockMesh);
				}

				// Flames — flicker animated by the host render loop
				var flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
				var flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
				var flameMeshes = [];
				[-0.09, 0, 0.09].forEach(function (fx, fi) {
					var flameGeo = new THREE.ConeGeometry(0.038, 0.17 + fi * 0.02, 7);
					var flameMesh = new THREE.Mesh(flameGeo, fi === 1 ? flameCoreMat : flameMat);
					flameMesh.position.set(fx, basketY + 0.07, 0);
					itemGroup.add(flameMesh);
					flameMeshes.push(flameMesh);
				});

				var fireLight = new THREE.PointLight(0xf97316, isNight ? 3.2 : 1.4, 5.5);
				fireLight.position.set(0, basketY + 0.2, 0);
				fireLight.castShadow = true;
				itemGroup.add(fireLight);
				if (FX) FX.push({ type: 'flame', meshes: flameMeshes, light: fireLight, base: isNight ? 3.2 : 1.4, phase: fxPhase() });
				break;
			}

			case 'pergola': {
				var pW = item.width;
				var pD = item.depth;
				var pH = item.height;
				var postSize = 0.14;

				// 4 Corner Metal Posts
				var postGeo2 = new THREE.BoxGeometry(postSize, pH, postSize);
				var corners = [
					[-pW / 2 + postSize / 2, pH / 2, -pD / 2 + postSize / 2],
					[pW / 2 - postSize / 2, pH / 2, -pD / 2 + postSize / 2],
					[-pW / 2 + postSize / 2, pH / 2, pD / 2 - postSize / 2],
					[pW / 2 - postSize / 2, pH / 2, pD / 2 - postSize / 2],
				];

				corners.forEach(function (c) {
					var post = new THREE.Mesh(postGeo2, metalMaterial);
					post.position.set(c[0], c[1], c[2]);
					post.castShadow = true;
					post.receiveShadow = true;
					itemGroup.add(post);
				});

				// Main Beams
				var beamGeoX = new THREE.BoxGeometry(pW + 0.2, 0.16, 0.12);
				var beamFront = new THREE.Mesh(beamGeoX, metalMaterial);
				beamFront.position.set(0, pH - 0.08, pD / 2 - postSize / 2);
				beamFront.castShadow = true;
				itemGroup.add(beamFront);

				var beamBack = new THREE.Mesh(beamGeoX, metalMaterial);
				beamBack.position.set(0, pH - 0.08, -pD / 2 + postSize / 2);
				beamBack.castShadow = true;
				itemGroup.add(beamBack);

				// Cross WPC Louver Slats
				var louverCount = 9;
				var louverGeo = new THREE.BoxGeometry(0.08, 0.12, pD + 0.2);
				for (var i = 0; i < louverCount; i++) {
					var lx = -pW / 2 + (pW / (louverCount - 1)) * i;
					var louver = new THREE.Mesh(louverGeo, wpcMaterial);
					louver.position.set(lx, pH + 0.06, 0);
					louver.castShadow = true;
					itemGroup.add(louver);
				}

				if (isNight) {
					var centerLight = new THREE.PointLight(0xffe699, 2.8, 6.5);
					centerLight.position.set(0, pH - 0.2, 0);
					centerLight.castShadow = true;
					itemGroup.add(centerLight);
				}
				break;
			}

			case 'pergola_deck': {
				// Full pergola module with integrated WPC deck platform
				var gW = item.width || 3.2;
				var gD = item.depth || 3.2;
				var gH = item.height || 2.6;
				var deckH = 0.1;
				var postSz = 0.075;
				var postInset = 0.42;
				var overhang = 0.3;

				// ---- Deck platform ----
				var edgeThk = 0.09;
				[
					[gW, edgeThk, 0, -gD / 2 + edgeThk / 2],
					[gW, edgeThk, 0, gD / 2 - edgeThk / 2],
				].forEach(function (e) {
					var eg = new THREE.Mesh(new THREE.BoxGeometry(e[0], deckH, e[1]), wpcMaterial);
					eg.position.set(e[2], deckH / 2, e[3]);
					eg.castShadow = true;
					eg.receiveShadow = true;
					itemGroup.add(eg);
				});
				[-1, 1].forEach(function (xs) {
					var eg2 = new THREE.Mesh(new THREE.BoxGeometry(edgeThk, deckH, gD), wpcMaterial);
					eg2.position.set(xs * (gW / 2 - edgeThk / 2), deckH / 2, 0);
					eg2.castShadow = true;
					eg2.receiveShadow = true;
					itemGroup.add(eg2);
				});

				// Inner slatted deck surface
				var innerW2 = gW - edgeThk * 2 - 0.02;
				var innerD = gD - edgeThk * 2 - 0.02;
				var deckSlats = 22;
				var dSlatW = innerW2 / deckSlats - 0.006;
				for (var ds = 0; ds < deckSlats; ds++) {
					var dSl = new THREE.Mesh(new THREE.BoxGeometry(dSlatW, deckH * 0.85, innerD), wpcMaterial);
					dSl.position.set(-innerW2 / 2 + ds * (dSlatW + 0.006) + dSlatW / 2, deckH * 0.425, 0);
					dSl.receiveShadow = true;
					itemGroup.add(dSl);
				}

				// ---- Four twin-profile black steel posts ----
				var postH = gH - 0.34;
				var postPositions = [
					[-(gW / 2 - postInset), -(gD / 2 - postInset)],
					[gW / 2 - postInset, -(gD / 2 - postInset)],
					[-(gW / 2 - postInset), gD / 2 - postInset],
					[gW / 2 - postInset, gD / 2 - postInset],
				];

				postPositions.forEach(function (pp) {
					[-1, 1].forEach(function (off) {
						var post = new THREE.Mesh(
							new THREE.BoxGeometry(postSz, postH, postSz),
							metalMaterial
						);
						post.position.set(pp[0] + off * 0.055, deckH + postH / 2, pp[1]);
						post.castShadow = true;
						post.receiveShadow = true;
						itemGroup.add(post);
					});
					var plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.12), metalMaterial);
					plate.position.set(pp[0], deckH + 0.01, pp[1]);
					itemGroup.add(plate);
				});

				// ---- Black steel header beams (running along X, over posts) ----
				var headerY = deckH + postH + 0.05;
				[-1, 1].forEach(function (zs) {
					var hb = new THREE.Mesh(
						new THREE.BoxGeometry(gW - postInset * 2 + overhang * 2, 0.1, 0.05),
						metalMaterial
					);
					hb.position.set(0, headerY, zs * (gD / 2 - postInset));
					hb.castShadow = true;
					itemGroup.add(hb);
				});

				// ---- Twin WPC main beams flanking the steel header ----
				var mainBeamLen = gW - postInset * 2 + overhang * 2;
				[-1, 1].forEach(function (zs) {
					[-1, 1].forEach(function (off) {
						var mb = new THREE.Mesh(
							new THREE.BoxGeometry(mainBeamLen, 0.13, 0.055),
							wpcMaterial
						);
						mb.position.set(0, headerY, zs * (gD / 2 - postInset) + off * 0.058);
						mb.castShadow = true;
						mb.receiveShadow = true;
						itemGroup.add(mb);

						// stepped end caps (protruding detail)
						[-1, 1].forEach(function (xs) {
							var cap = new THREE.Mesh(
								new THREE.BoxGeometry(0.11, 0.06, 0.055),
								wpcMaterial
							);
							cap.position.set(
								xs * (mainBeamLen / 2 - 0.055),
								headerY - 0.095,
								zs * (gD / 2 - postInset) + off * 0.058
							);
							cap.castShadow = true;
							itemGroup.add(cap);
						});
					});
				});

				// ---- Cross rafters (running along Z, on top of main beams) ----
				var rafterY = headerY + 0.12;
				var rafterLen = gD - postInset * 2 + overhang * 2;
				var rafterCount = 6;
				var rafterSpan = gW - postInset * 2;
				for (var r = 0; r < rafterCount; r++) {
					var rx = -rafterSpan / 2 + (r * rafterSpan) / (rafterCount - 1);
					var rafter = new THREE.Mesh(
						new THREE.BoxGeometry(0.085, 0.12, rafterLen),
						wpcMaterial
					);
					rafter.position.set(rx, rafterY, 0);
					rafter.castShadow = true;
					rafter.receiveShadow = true;
					itemGroup.add(rafter);

					// stepped rafter end caps
					[-1, 1].forEach(function (zs) {
						var cap2 = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.055, 0.1), wpcMaterial);
						cap2.position.set(rx, rafterY - 0.088, zs * (rafterLen / 2 - 0.05));
						cap2.castShadow = true;
						itemGroup.add(cap2);
					});
				}

				// ---- Thin top slats (perpendicular, forming checkered shade) ----
				var topSlatY = rafterY + 0.085;
				var topSlatCount = 7;
				var topSpan = gD - postInset * 2;
				for (var t = 0; t < topSlatCount; t++) {
					var tz = -topSpan / 2 + (t * topSpan) / (topSlatCount - 1);
					var tSlat = new THREE.Mesh(
						new THREE.BoxGeometry(rafterSpan + 0.1, 0.035, 0.075),
						wpcMaterial
					);
					tSlat.position.set(0, topSlatY, tz);
					tSlat.castShadow = true;
					itemGroup.add(tSlat);
				}

				if (isNight) {
					var pgLight = new THREE.PointLight(0xffe699, 2.8, 6.5);
					pgLight.position.set(0, headerY - 0.25, 0);
					pgLight.castShadow = true;
					itemGroup.add(pgLight);
				}
				break;
			}

			case 'green_wall_planter': {
				// Free-standing WPC framed green wall with base planter trough
				var wW = item.width || 1.2;
				var wD = item.depth || 0.42;
				var wH = item.height || 1.8;
				var troughH = 0.3;
				var frameThk2 = 0.07;

				// ---- Base planter trough (black steel shell) ----
				var shell = new THREE.Mesh(
					new THREE.BoxGeometry(wW - 0.04, troughH, wD),
					metalMaterial
				);
				shell.position.set(0, troughH / 2 + 0.03, 0);
				shell.castShadow = true;
				shell.receiveShadow = true;
				itemGroup.add(shell);

				// Small black feet
				[-1, 1].forEach(function (xs) {
					var foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, wD * 0.8), metalMaterial);
					foot.position.set(xs * (wW / 2 - 0.14), 0.015, 0);
					itemGroup.add(foot);
				});

				// WPC cladding boards on trough front & back
				[-1, 1].forEach(function (zs) {
					for (var b2 = 0; b2 < 2; b2++) {
						var board = new THREE.Mesh(
							new THREE.BoxGeometry(wW - 0.02, troughH / 2 - 0.012, 0.028),
							wpcMaterial
						);
						board.position.set(
							0,
							0.05 + b2 * (troughH / 2) + troughH / 4 - 0.005,
							zs * (wD / 2 + 0.012)
						);
						board.castShadow = true;
						itemGroup.add(board);
					}
				});

				// WPC cladding on trough sides
				[-1, 1].forEach(function (xs) {
					var sideBoard = new THREE.Mesh(
						new THREE.BoxGeometry(0.028, troughH - 0.03, wD + 0.02),
						wpcMaterial
					);
					sideBoard.position.set(xs * (wW / 2 - 0.006), troughH / 2 + 0.035, 0);
					sideBoard.castShadow = true;
					itemGroup.add(sideBoard);
				});

				// Soil surface
				var soilTop = new THREE.Mesh(
					new THREE.BoxGeometry(wW - 0.14, 0.03, wD - 0.12),
					soilMaterial
				);
				soilTop.position.set(0, troughH + 0.02, 0);
				itemGroup.add(soilTop);

				// ---- Vertical WPC frame ----
				var frameBaseY = troughH + 0.03;
				var frameH = wH - frameBaseY;
				var frameZ = -wD / 2 + 0.06;

				// Left & right frame posts
				[-1, 1].forEach(function (xs) {
					var postMesh = new THREE.Mesh(
						new THREE.BoxGeometry(frameThk2, frameH, frameThk2),
						wpcMaterial
					);
					postMesh.position.set(xs * (wW / 2 - frameThk2 / 2), frameBaseY + frameH / 2, frameZ);
					postMesh.castShadow = true;
					postMesh.receiveShadow = true;
					itemGroup.add(postMesh);
				});

				// Top horizontal frame beam
				var topBeam = new THREE.Mesh(
					new THREE.BoxGeometry(wW, frameThk2, frameThk2),
					wpcMaterial
				);
				topBeam.position.set(0, wH - frameThk2 / 2, frameZ);
				topBeam.castShadow = true;
				itemGroup.add(topBeam);

				// Secondary inner top rail
				var innerBeam = new THREE.Mesh(
					new THREE.BoxGeometry(wW - frameThk2 * 2, frameThk2 * 0.8, frameThk2 * 0.8),
					wpcMaterial
				);
				innerBeam.position.set(0, wH - frameThk2 * 1.7, frameZ + 0.055);
				innerBeam.castShadow = true;
				itemGroup.add(innerBeam);

				// ---- Dark back trellis panel ----
				var panelMat = new THREE.MeshStandardMaterial({
					color: 0x1c1c1f,
					roughness: 0.85,
					metalness: 0.3,
				});
				var panel = new THREE.Mesh(
					new THREE.BoxGeometry(wW - frameThk2 * 2, frameH - 0.12, 0.022),
					panelMat
				);
				panel.position.set(0, frameBaseY + frameH / 2 - 0.04, frameZ + 0.005);
				panel.receiveShadow = true;
				itemGroup.add(panel);

				// ---- Real climbing vine growing up and over the frame ----
				if (FOL.createVineCluster && FOL.createGroundCover) {
					var climbRows = 6;
					var clustersPerRow = 4;
					for (var r2 = 0; r2 < climbRows; r2++) {
						var fy = frameBaseY + 0.1 + (r2 * (frameH - 0.24)) / (climbRows - 1);
						for (var c = 0; c < clustersPerRow; c++) {
							var fx2 = -wW / 2 + 0.18 + (c * (wW - 0.36)) / (clustersPerRow - 1);
							var cluster = FOL.createVineCluster(
								0.16,
								seedOf(item.id) + r2 * 41 + c * 13,
								0.24
							);
							cluster.position.set(fx2, fy, frameZ + 0.12);
							itemGroup.add(cluster);
						}
					}

					var troughPlanting = FOL.createGroundCover(wW - 0.2, wD - 0.1, seedOf(item.id) + 3, true);
					troughPlanting.position.set(0, troughH + 0.06, 0);
					itemGroup.add(troughPlanting);
				}

				if (isNight) {
					var gwpLight = new THREE.PointLight(0xfef08a, 1.6, 3.2);
					gwpLight.position.set(0, troughH + 0.2, wD / 2);
					itemGroup.add(gwpLight);
				}
				break;
			}

			case 'green_wall': {
				var frameGeo = new THREE.BoxGeometry(item.width, item.height, item.depth);
				var frameMesh = new THREE.Mesh(frameGeo, metalMaterial);
				frameMesh.position.set(0, item.height / 2, 0);
				frameMesh.castShadow = true;
				frameMesh.receiveShadow = true;
				itemGroup.add(frameMesh);

				// Dense living green wall built from real leaf clusters
				if (FOL.createVineCluster) {
					var gwRows = 7;
					var gwCols = Math.max(2, Math.round(item.width / 0.34));
					for (var gr = 0; gr < gwRows; gr++) {
						var ly = 0.26 + (gr * (item.height - 0.42)) / (gwRows - 1);
						for (var gc = 0; gc < gwCols; gc++) {
							var lx2 =
								-item.width / 2 + 0.16 + (gc * (item.width - 0.32)) / Math.max(1, gwCols - 1);
							var clump = FOL.createVineCluster(
								0.17,
								seedOf(item.id) + gr * 31 + gc * 7,
								0.2
							);
							clump.position.set(lx2, ly, item.depth / 2 + 0.03);
							itemGroup.add(clump);
						}
					}
				}

				if (isNight) {
					var gwLight = new THREE.PointLight(0xfef08a, 1.6, 3.5);
					gwLight.position.set(0, item.height - 0.1, 0.25);
					itemGroup.add(gwLight);
				}
				break;
			}

			case 'water_feature': {
				// Dual Staggered WPC Frame Waterfall with Square Pool Basin
				var wwW = item.width || 1.3;
				var wwD = item.depth || 1.1;
				var basinH = 0.32;
				var basinThk = 0.08;

				// --- 1. Base Basin with Horizontal WPC Cladding ---
				var wfPlanksY = 4;
				var wfPlankH = (basinH - 0.04) / wfPlanksY;

				[-1, 1].forEach(function (zs) {
					for (var p2 = 0; p2 < wfPlanksY; p2++) {
						var plank = new THREE.Mesh(
							new THREE.BoxGeometry(wwW, wfPlankH * 0.92, 0.032),
							wpcMaterial
						);
						plank.position.set(0, 0.02 + p2 * wfPlankH + wfPlankH / 2, zs * (wwD / 2 - 0.016));
						plank.castShadow = true;
						itemGroup.add(plank);
					}
				});

				[-1, 1].forEach(function (xs) {
					for (var p3 = 0; p3 < wfPlanksY; p3++) {
						var plankZ = new THREE.Mesh(
							new THREE.BoxGeometry(0.032, wfPlankH * 0.92, wwD - 0.06),
							wpcMaterial
						);
						plankZ.position.set(xs * (wwW / 2 - 0.016), 0.02 + p3 * wfPlankH + wfPlankH / 2, 0);
						plankZ.castShadow = true;
						itemGroup.add(plankZ);
					}
				});

				// Top 45-degree Mitered Basin Border Rim
				var topRimGeoX = new THREE.BoxGeometry(wwW + 0.02, 0.04, basinThk);
				[-1, 1].forEach(function (zs) {
					var rimX = new THREE.Mesh(topRimGeoX, wpcMaterial);
					rimX.position.set(0, basinH - 0.01, zs * (wwD / 2 - basinThk / 2));
					rimX.castShadow = true;
					itemGroup.add(rimX);
				});

				var topRimGeoZ = new THREE.BoxGeometry(basinThk, 0.04, wwD - basinThk * 2);
				[-1, 1].forEach(function (xs) {
					var rimZ2 = new THREE.Mesh(topRimGeoZ, wpcMaterial);
					rimZ2.position.set(xs * (wwW / 2 - basinThk / 2), basinH - 0.01, 0);
					rimZ2.castShadow = true;
					itemGroup.add(rimZ2);
				});

				// Waterproof Metal Basin Lining Shell
				var linerMesh = new THREE.Mesh(
					new THREE.BoxGeometry(wwW - basinThk * 2, basinH - 0.05, wwD - basinThk * 2),
					metalMaterial
				);
				linerMesh.position.set(0, basinH / 2 - 0.02, 0);
				itemGroup.add(linerMesh);

				// Shimmering Pool Water Surface in the Basin
				var poolWaterMat = new THREE.MeshPhysicalMaterial({
					color: 0x38bdf8,
					transmission: 0.85,
					opacity: 0.9,
					transparent: true,
					roughness: 0.08,
					ior: 1.333,
					reflectivity: 0.9,
				});
				var poolWater = new THREE.Mesh(
					new THREE.PlaneGeometry(wwW - basinThk * 2 - 0.04, wwD - basinThk * 2 - 0.04),
					poolWaterMat
				);
				if (TEX.createWaterCausticsTexture) {
					var poolCaustics = TEX.createWaterCausticsTexture();
					poolCaustics.repeat.set(2, 2);
					poolWaterMat.map = poolCaustics;
					poolWaterMat.needsUpdate = true;
					if (FX) FX.push({ type: 'shimmer', mat: poolWaterMat });
				}
				poolWater.rotation.x = -Math.PI / 2;
				poolWater.position.set(0, basinH - 0.07, 0);
				itemGroup.add(poolWater);

				// --- 2. Two Staggered Vertical WPC Water Cascade Frames ---
				var wfFrameThk = 0.075;

				var waterCurtainMat = new THREE.MeshPhysicalMaterial({
					color: 0xbae6fd,
					transmission: 0.92,
					transparent: true,
					opacity: 0.82,
					roughness: 0.12,
					ior: 1.333,
					side: THREE.DoubleSide,
				});
				// Streak texture scrolled every frame — reads as a falling sheet
				if (TEX.createFallingWaterTexture) {
					var fallTex = TEX.createFallingWaterTexture();
					fallTex.repeat.set(2, 2);
					waterCurtainMat.map = fallTex;
					waterCurtainMat.needsUpdate = true;
					if (FX) FX.push({ type: 'scroll', mat: waterCurtainMat, speed: 0.85 });
				}

				var buildCascadeFrame = function (fWidth, fHeight, posZ) {
					var fGroup = new THREE.Group();
					var fBottomY = basinH - 0.02;

					var postL = new THREE.Mesh(
						new THREE.BoxGeometry(wfFrameThk, fHeight, wfFrameThk),
						wpcMaterial
					);
					postL.position.set(-fWidth / 2 + wfFrameThk / 2, fBottomY + fHeight / 2, posZ);
					postL.castShadow = true;
					fGroup.add(postL);

					var postR = new THREE.Mesh(
						new THREE.BoxGeometry(wfFrameThk, fHeight, wfFrameThk),
						wpcMaterial
					);
					postR.position.set(fWidth / 2 - wfFrameThk / 2, fBottomY + fHeight / 2, posZ);
					postR.castShadow = true;
					fGroup.add(postR);

					var topBeam2 = new THREE.Mesh(
						new THREE.BoxGeometry(fWidth, wfFrameThk, wfFrameThk),
						wpcMaterial
					);
					topBeam2.position.set(0, fBottomY + fHeight - wfFrameThk / 2, posZ);
					topBeam2.castShadow = true;
					fGroup.add(topBeam2);

					// Stepped Profile Inner Moldings
					var moldTop = new THREE.Mesh(
						new THREE.BoxGeometry(fWidth - wfFrameThk * 2, wfFrameThk * 0.4, wfFrameThk * 0.5),
						wpcMaterial
					);
					moldTop.position.set(0, fBottomY + fHeight - wfFrameThk * 1.1, posZ);
					fGroup.add(moldTop);

					// Stainless Steel Waterfall Spillway Blade Nozzle
					var bladeMesh = new THREE.Mesh(
						new THREE.BoxGeometry(fWidth - wfFrameThk * 2, 0.02, 0.04),
						metalMaterial
					);
					bladeMesh.position.set(0, fBottomY + fHeight - wfFrameThk * 1.25, posZ);
					fGroup.add(bladeMesh);

					// Vertical Waterfall Rain Sheet Pouring into Basin
					var sheetH = fHeight - wfFrameThk * 1.25;
					var sheetW = fWidth - wfFrameThk * 2.2;
					var sheetMesh = new THREE.Mesh(
						new THREE.PlaneGeometry(sheetW, sheetH),
						waterCurtainMat
					);
					sheetMesh.position.set(0, fBottomY + sheetH / 2, posZ);
					fGroup.add(sheetMesh);

					// Secondary water stream strands for realistic texture
					var strandCount = 12;
					for (var st = 0; st < strandCount; st++) {
						var sx2 = -sheetW / 2 + 0.02 + (st * (sheetW - 0.04)) / (strandCount - 1);
						var strandGeo = new THREE.CylinderGeometry(0.004, 0.006, sheetH, 4);
						var strandMesh = new THREE.Mesh(strandGeo, waterCurtainMat);
						strandMesh.position.set(sx2, fBottomY + sheetH / 2, posZ + (st % 2 === 0 ? 0.008 : -0.008));
						fGroup.add(strandMesh);
					}

					// Pulsing splash ring where the falling blade lands in the basin
					var splashMat = new THREE.MeshBasicMaterial({
						color: 0xe0f2fe, transparent: true, opacity: 0.3, depthWrite: false,
					});
					var splash = new THREE.Mesh(new THREE.CircleGeometry(sheetW * 0.3, 24), splashMat);
					splash.rotation.x = -Math.PI / 2;
					splash.position.set(0, basinH - 0.055, posZ);
					fGroup.add(splash);
					if (FX) FX.push({ type: 'splash', mesh: splash, base: 0.3, phase: posZ * 3 });

					return fGroup;
				};

				// Rear Frame (Taller)
				itemGroup.add(buildCascadeFrame(wwW * 0.76, 1.45, -wwD * 0.22));

				// Front Frame (Slightly Lower & Stepped Forward)
				itemGroup.add(buildCascadeFrame(wwW * 0.65, 1.08, wwD * 0.12));

				// Underwater LED Illumination
				if (isNight) {
					var waterGlow = new THREE.PointLight(0x38bdf8, 3.0, 4.5);
					waterGlow.position.set(0, basinH + 0.15, 0);
					itemGroup.add(waterGlow);

					var frameUplight = new THREE.PointLight(0xffedd5, 1.8, 3.5);
					frameUplight.position.set(0, basinH + 0.5, -wwD * 0.05);
					itemGroup.add(frameUplight);
				}
				break;
			}

			case 'umbrella': {
				// High-precision 3-meter Cantilever Hydraulic Offset Umbrella
				var uW = item.width || 3.0;
				var uH = item.height || 2.65;
				var offsetDist = uW * 0.42;

				var canvasTex = TEX.createCanvasFabricTexture ? TEX.createCanvasFabricTexture('#f5f2eb') : {};
				var canopyFabricMat = new THREE.MeshStandardMaterial({
					map: canvasTex.map,
					bumpMap: canvasTex.bumpMap,
					bumpScale: 0.05,
					roughness: 0.75,
					metalness: 0.05,
					side: THREE.DoubleSide,
				});

				var brushedAluMat = new THREE.MeshStandardMaterial({
					color: 0x18181b,
					roughness: 0.25,
					metalness: 0.85,
				});

				var chromePistonMat = new THREE.MeshStandardMaterial({
					color: 0xd4d4d8,
					roughness: 0.15,
					metalness: 0.95,
				});

				// 1. Heavy Wheeled Base Box
				var baseGeo = new THREE.BoxGeometry(0.85, 0.18, 0.85);
				var baseMesh = new THREE.Mesh(baseGeo, brushedAluMat);
				baseMesh.position.set(-offsetDist, 0.09, 0);
				baseMesh.castShadow = true;
				baseMesh.receiveShadow = true;
				itemGroup.add(baseMesh);

				// 4 Base Casters / Wheels
				var wheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12);
				[[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(function (w) {
					var wheel = new THREE.Mesh(wheelGeo, brushedAluMat);
					wheel.rotation.z = Math.PI / 2;
					wheel.position.set(-offsetDist + w[0], 0.04, w[1]);
					itemGroup.add(wheel);
				});

				// 2. Foot Pedal 360-degree rotation turret hub
				var turretGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.12, 16);
				var turretMesh = new THREE.Mesh(turretGeo, brushedAluMat);
				turretMesh.position.set(-offsetDist, 0.24, 0);
				itemGroup.add(turretMesh);

				var pedalGeo = new THREE.BoxGeometry(0.15, 0.04, 0.06);
				var pedalMesh = new THREE.Mesh(pedalGeo, chromePistonMat);
				pedalMesh.position.set(-offsetDist + 0.12, 0.22, 0);
				itemGroup.add(pedalMesh);

				// 3. Main Vertical Mast Column
				var mastH = uH * 0.88;
				var mastGeo = new THREE.BoxGeometry(0.09, mastH, 0.09);
				var mastMesh = new THREE.Mesh(mastGeo, brushedAluMat);
				mastMesh.position.set(-offsetDist, 0.24 + mastH / 2, 0);
				mastMesh.castShadow = true;
				itemGroup.add(mastMesh);

				// Winch Crank Handle Box
				var winchGeo = new THREE.BoxGeometry(0.12, 0.16, 0.1);
				var winchMesh = new THREE.Mesh(winchGeo, brushedAluMat);
				winchMesh.position.set(-offsetDist, 1.2, 0.08);
				itemGroup.add(winchMesh);

				var crankGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
				var crankMesh = new THREE.Mesh(crankGeo, chromePistonMat);
				crankMesh.rotation.x = Math.PI / 2;
				crankMesh.position.set(-offsetDist, 1.2, 0.14);
				itemGroup.add(crankMesh);

				// 4. Cantilever Overhead Boom Arm & Diagonal Hydraulic Gas Cylinder
				var boomLength = offsetDist * 1.05;
				var boomGeo = new THREE.BoxGeometry(boomLength, 0.07, 0.07);
				var boomMesh = new THREE.Mesh(boomGeo, brushedAluMat);
				boomMesh.position.set(-offsetDist + boomLength / 2, uH - 0.05, 0);
				boomMesh.castShadow = true;
				itemGroup.add(boomMesh);

				var strutGeo = new THREE.CylinderGeometry(0.025, 0.025, offsetDist * 0.85, 12);
				var strutMesh = new THREE.Mesh(strutGeo, chromePistonMat);
				strutMesh.position.set(-offsetDist + offsetDist * 0.35, uH * 0.72, 0);
				strutMesh.rotation.z = -Math.PI / 4.2;
				strutMesh.castShadow = true;
				itemGroup.add(strutMesh);

				// 5. Central Canopy Suspension Hub
				var hubGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.15, 16);
				var hubMesh = new THREE.Mesh(hubGeo, brushedAluMat);
				hubMesh.position.set(0, uH - 0.08, 0);
				itemGroup.add(hubMesh);

				// 6. 8 Aluminum Radial Folding Ribs
				var ribCount = 8;
				var ribLen = uW / 2;
				for (var r3 = 0; r3 < ribCount; r3++) {
					var rAngle = (r3 * Math.PI * 2) / ribCount;
					var ribGeo = new THREE.BoxGeometry(ribLen, 0.025, 0.025);
					var ribMesh = new THREE.Mesh(ribGeo, brushedAluMat);
					ribMesh.position.set((Math.cos(rAngle) * ribLen) / 2, uH - 0.18, (Math.sin(rAngle) * ribLen) / 2);
					ribMesh.rotation.y = -rAngle;
					ribMesh.rotation.z = 0.12;
					ribMesh.castShadow = true;
					itemGroup.add(ribMesh);
				}

				// 7. Main Octagonal Sunbrella Fabric Canopy (Stitched Membrane)
				var canopyGeo = new THREE.ConeGeometry(uW / 2, 0.45, 8, 1, false);
				var canopyMesh = new THREE.Mesh(canopyGeo, canopyFabricMat);
				canopyMesh.position.set(0, uH - 0.22, 0);
				canopyMesh.castShadow = true;
				canopyMesh.receiveShadow = true;
				itemGroup.add(canopyMesh);

				// Top Wind Escape Air Vent Cap
				var ventGeo = new THREE.ConeGeometry(uW * 0.22, 0.18, 8);
				var ventMesh = new THREE.Mesh(ventGeo, canopyFabricMat);
				ventMesh.position.set(0, uH - 0.05, 0);
				ventMesh.castShadow = true;
				itemGroup.add(ventMesh);

				// Top finial cap
				var finialGeo = new THREE.SphereGeometry(0.05, 12, 12);
				var finialMesh = new THREE.Mesh(finialGeo, chromePistonMat);
				finialMesh.position.set(0, uH + 0.06, 0);
				itemGroup.add(finialMesh);

				if (isNight) {
					var underUmbrellaLight = new THREE.PointLight(0xffe699, 2.2, 5.0);
					underUmbrellaLight.position.set(0, uH - 0.35, 0);
					itemGroup.add(underUmbrellaLight);
				}
				break;
			}

			case 'bbq': {
				// Modular Outdoor Kitchen Counter
				var bodyGeo = new THREE.BoxGeometry(item.width, item.height - 0.1, item.depth);
				var bodyMesh = new THREE.Mesh(bodyGeo, wpcMaterial);
				bodyMesh.position.set(0, (item.height - 0.1) / 2, 0);
				bodyMesh.castShadow = true;
				itemGroup.add(bodyMesh);

				// Stainless Steel Countertop
				var topGeo = new THREE.BoxGeometry(item.width + 0.04, 0.05, item.depth + 0.04);
				var topMesh = new THREE.Mesh(topGeo, metalMaterial);
				topMesh.position.set(0, item.height - 0.075, 0);
				itemGroup.add(topMesh);

				// 4-burner Grill with dome hood
				var grillGeo = new THREE.BoxGeometry(item.width * 0.55, 0.32, item.depth * 0.82);
				var grillMesh = new THREE.Mesh(grillGeo, metalMaterial);
				grillMesh.position.set(-item.width * 0.18, item.height + 0.08, 0);
				grillMesh.castShadow = true;
				itemGroup.add(grillMesh);

				// Stainless Sink & Faucet
				var sinkGeo = new THREE.BoxGeometry(item.width * 0.28, 0.12, item.depth * 0.65);
				var sinkMesh = new THREE.Mesh(sinkGeo, metalMaterial);
				sinkMesh.position.set(item.width * 0.28, item.height - 0.02, 0);
				itemGroup.add(sinkMesh);
				break;
			}

			case 'louver': {
				// Vertical Louver Screen
				var louverFrameGeo = new THREE.BoxGeometry(item.width, item.height, 0.08);
				var louverFrameMesh = new THREE.Mesh(louverFrameGeo, metalMaterial);
				louverFrameMesh.position.set(0, item.height / 2, 0);
				itemGroup.add(louverFrameMesh);

				var numSlat = 10;
				for (var li = 0; li < numSlat; li++) {
					var lSlatGeo = new THREE.BoxGeometry(item.width - 0.1, 0.09, 0.03);
					var lSlatMesh = new THREE.Mesh(lSlatGeo, wpcMaterial);
					lSlatMesh.position.set(0, 0.15 + (li * (item.height - 0.3)) / (numSlat - 1), 0);
					lSlatMesh.rotation.x = Math.PI / 6;
					lSlatMesh.castShadow = true;
					itemGroup.add(lSlatMesh);
				}
				break;
			}

			case 'box':
			default: {
				var boxGeo2 = new THREE.BoxGeometry(item.width, item.height, item.depth);
				var boxMesh = new THREE.Mesh(boxGeo2, wpcMaterial);
				boxMesh.position.set(0, item.height / 2, 0);
				boxMesh.castShadow = true;
				boxMesh.receiveShadow = true;
				itemGroup.add(boxMesh);

				// Metal Rim Top
				var rimGeo2 = new THREE.BoxGeometry(item.width + 0.02, 0.04, item.depth + 0.02);
				var rimMesh = new THREE.Mesh(rimGeo2, metalMaterial);
				rimMesh.position.set(0, item.height, 0);
				itemGroup.add(rimMesh);

				if (item.category === 'planting' && FOL.createGroundCover && FOL.createFoliageCluster) {
					var soilGeo2 = new THREE.BoxGeometry(item.width - 0.06, 0.05, item.depth - 0.06);
					var soilMesh2 = new THREE.Mesh(soilGeo2, soilMaterial);
					soilMesh2.position.set(0, item.height - 0.02, 0);
					itemGroup.add(soilMesh2);

					// Layered natural planting: low flowering cover + taller shrubs
					var cover = FOL.createGroundCover(
						Math.max(0.2, item.width - 0.08),
						Math.max(0.2, item.depth),
						seedOf(item.id),
						true
					);
					cover.position.set(0, item.height + 0.04, 0);
					itemGroup.add(cover);

					var numShrubs = Math.max(1, Math.round(item.width / 0.55));
					for (var sh = 0; sh < numShrubs; sh++) {
						var sx3 =
							-item.width / 2 + 0.26 + (sh * (item.width - 0.52)) / Math.max(1, numShrubs - 1);
						var shrub = FOL.createFoliageCluster({
							radius: 0.21 + (sh % 3) * 0.025,
							seed: seedOf(item.id) + sh * 67,
							density: 1,
							heightScale: 1.15,
							withFlowers: sh % 2 === 0,
							tone: sh % 3 === 0 ? 'light' : sh % 3 === 1 ? 'normal' : 'dark',
						});
						shrub.position.set(sx3, item.height + 0.2, (sh % 2 === 0 ? 1 : -1) * item.depth * 0.1);
						itemGroup.add(shrub);
					}
				}

				if (item.hasLighting && isNight) {
					var boxLight = new THREE.PointLight(0xffe699, 2.0, 3.2);
					boxLight.position.set(0, 0.15, 0);
					itemGroup.add(boxLight);
				}
				break;
			}
		}

		itemGroup.position.set(item.x || 0, item.y || 0, item.z || 0);
		itemGroup.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0);

		return itemGroup;
	}

	window.CKBModels = {
		buildItemModel: buildItemModel,
		wpcColorHexStr: wpcColorHexStr,
		metalColorHex: metalColorHex,
	};
})();
