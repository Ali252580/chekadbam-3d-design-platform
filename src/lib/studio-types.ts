export interface StudioItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  x: number; // in meters (X axis)
  z: number; // in meters (Z axis)
  y: number; // in meters (height offset)
  rotation: number; // in degrees (0, 45, 90, 180, 270)
  width: number; // meters
  depth: number; // meters
  height: number; // meters
  wpcColor?: string;
  metalColor?: string;
  hasLighting?: boolean;
  shapeType: string;
  priceEst: number;
  weightKg: number;
}

export type FloorPlanShape =
  | "rectangular" // پلان مستطیلی استاندارد
  | "l_shaped" // پلان L شکل با دو زون تفکیک‌شده
  | "u_shaped" // پلان U شکل با حیاط میانی
  | "central_shaft" // پلان با باکس پله / آسانسور و داکت تأسیسات مرکزی
  | "narrow_balcony" // تراس طولی کشیده
  | "penthouse_split"; // پنت‌هاوس با دو بالکن شرقی و غربی و دسترسی میانی

export interface SpaceConfig {
  spaceType: "residential_roof" | "terrace" | "courtyard" | "villa_roof" | "cafe_restaurant" | "office" | "healthcare" | "commercial";
  spaceTypeName: string;
  shape: FloorPlanShape;
  shapeName: string;
  width: number; // meters
  length: number; // meters
  parapetHeight: number; // meters
  city: string;
  flooringType: "wpc_wood" | "ceramic" | "stone" | "artificial_turf" | "mixed";
  wpcColor: string;
  metalColor: string;
  // Geometric shape variations
  wingWidth?: number; // For L-Shape or U-Shape
  wingLength?: number;
  cutoutWidth?: number;
  cutoutLength?: number;
  shaftWidth?: number; // For Central Shaft/Stairs
  shaftLength?: number;
}

export interface BillOfMaterials {
  totalAreaM2: number;
  flooringAreaM2: number;
  greenAreaM2: number;
  flowerboxCount: number;
  seatingLengthM: number;
  pergolaCount: number;
  waterFireCount: number;
  lightingFixtureCount: number;
  totalWeightKg: number;
  weightPerM2: number;
  structuralSafety: "safe" | "moderate" | "requires_engineering_check";
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  itemizedSummary: Array<{
    name: string;
    code: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    weightTotal: number;
  }>;
}
