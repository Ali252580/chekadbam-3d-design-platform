/**
 * Chekadbam Studio — Bill of Materials calculator (WordPress port).
 *
 * Ported 1:1 from calculateBillOfMaterials() in src/lib/studio-presets.ts
 * of the Chekadbam Next.js studio. Computes total/flooring/green areas,
 * weight & structural safety, and a toman price range for the design.
 *
 * Global namespace: window.CKBBom
 */
(function () {
	'use strict';

	/**
	 * @param {object} space {shape, width, length, flooringType, cutoutWidth, cutoutLength, shaftWidth, shaftLength}
	 * @param {Array} items [{productId, name, code, category, width, depth, weightKg, priceEst, hasLighting}]
	 */
	function calculateBillOfMaterials(space, items) {
		space = space || {};
		items = items || [];

		var totalAreaM2 = space.width * space.length;

		// Subtract cutout area if shape is L or U or central shaft
		if (space.shape === 'l_shaped' && space.cutoutWidth && space.cutoutLength) {
			totalAreaM2 -= space.cutoutWidth * space.cutoutLength;
		} else if (space.shape === 'u_shaped' && space.cutoutWidth && space.cutoutLength) {
			totalAreaM2 -= space.cutoutWidth * space.cutoutLength;
		} else if (space.shape === 'central_shaft' && space.shaftWidth && space.shaftLength) {
			totalAreaM2 -= space.shaftWidth * space.shaftLength;
		}

		totalAreaM2 = Math.max(8, Math.round(totalAreaM2 * 10) / 10);

		// Calculate area footprint of items
		var itemFootprintArea = 0;
		var flowerboxCount = 0;
		var seatingLengthM = 0;
		var pergolaCount = 0;
		var waterFireCount = 0;
		var lightingFixtureCount = 0;
		var itemsWeight = 0;
		var itemsPrice = 0;

		// Track item counts
		var itemCounts = {};

		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			itemFootprintArea += item.width * item.depth;

			var weight = item.weightKg || 30;
			var price = item.priceEst || item.priceEstToman || 5000000;

			itemsWeight += weight;
			itemsPrice += price;

			if (item.category === 'planting') {
				flowerboxCount++;
			} else if (item.category === 'furniture') {
				seatingLengthM += item.width;
			} else if (item.category === 'structures') {
				pergolaCount++;
			} else if (item.category === 'water_fire') {
				waterFireCount++;
			}

			if (item.hasLighting) {
				lightingFixtureCount++;
			}

			var pid = item.productId || item.code || item.name;
			if (!itemCounts[pid]) {
				itemCounts[pid] = { count: 1, sampleItem: item };
			} else {
				itemCounts[pid].count++;
			}
		}

		var flooringType = space.flooringType || 'wpc_wood';

		// Flooring calculation
		var flooringAreaM2 = Math.max(0, Math.round((totalAreaM2 - itemFootprintArea * 0.4) * 10) / 10);
		var greenAreaM2 =
			Math.round(
				(flowerboxCount * 0.7 +
					(flooringType === 'artificial_turf'
						? flooringAreaM2 * 0.5
						: flooringType === 'mixed'
						? flooringAreaM2 * 0.3
						: 0)) *
					10
			) / 10;

		// Flooring cost & weight
		var flooringWeightPerM2 =
			flooringType === 'wpc_wood' ? 18
			: flooringType === 'artificial_turf' ? 4
			: flooringType === 'stone' ? 45
			: flooringType === 'ceramic' ? 28
			: 15;

		var flooringCostPerM2 =
			flooringType === 'wpc_wood' ? 2400000
			: flooringType === 'artificial_turf' ? 1100000
			: flooringType === 'stone' ? 2800000
			: flooringType === 'ceramic' ? 1900000
			: 2100000;

		var totalFlooringWeight = flooringAreaM2 * flooringWeightPerM2;
		var totalFlooringCost = flooringAreaM2 * flooringCostPerM2;

		var totalWeightKg = Math.round(itemsWeight + totalFlooringWeight);
		var weightPerM2 = Math.round((totalWeightKg / totalAreaM2) * 10) / 10;

		var structuralSafety = 'safe';
		if (weightPerM2 > 180) {
			structuralSafety = 'requires_engineering_check';
		} else if (weightPerM2 > 110) {
			structuralSafety = 'moderate';
		}

		var basePrice = itemsPrice + totalFlooringCost;
		var estimatedPriceMin = Math.round(basePrice * 0.95);
		var estimatedPriceMax = Math.round(basePrice * 1.15);

		var flooringLabel =
			flooringType === 'wpc_wood' ? 'چوب‌پلاست WPC شیاردار ضدلغزش'
			: flooringType === 'artificial_turf' ? 'چمن مصنوعی پرتراکم هلندی'
			: flooringType === 'stone' ? 'سنگ و چوب ترکیبی'
			: flooringType === 'ceramic' ? 'سرامیک پرسلان'
			: 'ترکیبی';

		var itemsMetrajM2 = 0;

		var itemizedSummary = [
			{
				name: 'کف‌سازی مدولار (' + flooringLabel + ')',
				code: 'FL-SURFACE',
				quantity: Math.round(flooringAreaM2),
				metrajM2: flooringAreaM2,
			},
		];

		Object.keys(itemCounts).forEach(function (pid2) {
			var data = itemCounts[pid2];
			var sample = data.sampleItem;
			var metraj = Math.round(sample.width * sample.depth * data.count * 10) / 10;
			itemsMetrajM2 = Math.round((itemsMetrajM2 + metraj) * 10) / 10;
			itemizedSummary.push({
				name: sample.name || pid2,
				code: sample.code || String(pid2).toUpperCase(),
				quantity: data.count,
				metrajM2: metraj,
			});
		});

		return {
			totalAreaM2: totalAreaM2,
			flooringAreaM2: flooringAreaM2,
			greenAreaM2: greenAreaM2,
			flowerboxCount: flowerboxCount,
			seatingLengthM: Math.round(seatingLengthM * 10) / 10,
			pergolaCount: pergolaCount,
			waterFireCount: waterFireCount,
			lightingFixtureCount: lightingFixtureCount,
			totalWeightKg: totalWeightKg,
			weightPerM2: weightPerM2,
			structuralSafety: structuralSafety,
			itemsMetrajM2: itemsMetrajM2,
			itemizedSummary: itemizedSummary,
		};
	}

	window.CKBBom = {
		calculateBillOfMaterials: calculateBillOfMaterials,
	};
})();
