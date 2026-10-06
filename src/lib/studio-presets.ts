import { SpaceConfig, StudioItem, BillOfMaterials } from "./studio-types";
import { CHEKADBAM_PRODUCTS } from "./products-data";

export interface PresetDesign {
  id: string;
  name: string;
  description: string;
  spaceConfig: SpaceConfig;
  items: StudioItem[];
  thumbnail: string;
  badge?: string;
}

export const PRESET_DESIGNS: PresetDesign[] = [
  // 1. L-Shaped Penthouse Roof
  {
    id: "l-shaped-penthouse",
    name: "پلان L شکل | روف‌گاردن پنت‌هاوس (۱۲ × ۹ متر | ۸۳.۳ م²)",
    description: "ابعاد کلی: ۱۲ × ۹ متر | متراژ خالص طرح: ۸۳.۳ مترمربع | تفکیک به دو زون مستقل نشیمن با پرگولا و میز آتشدان، و زون مبل راحتی همراه با آبنما.",
    thumbnail: "https://images.pexels.com/photos/7587884/pexels-photo-7587884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    badge: "پلان L شکل (۸۳.۳ م²)",
    spaceConfig: {
      spaceType: "residential_roof",
      spaceTypeName: "پشت‌بام مسکونی پنت‌هاوس",
      shape: "l_shaped",
      shapeName: "پلان L شکل (دو زون مجزا)",
      width: 12,
      length: 9,
      cutoutWidth: 5.5,
      cutoutLength: 4.5,
      parapetHeight: 1.1,
      city: "تهران",
      flooringType: "wpc_wood",
      wpcColor: "walnut",
      metalColor: "black",
    },
    items: [
      {
        id: "item-pg-l",
        productId: "pg-3x3",
        name: "پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر",
        category: "structures",
        x: -3.5,
        z: -2.0,
        y: 0,
        rotation: 0,
        width: 3.0,
        depth: 3.0,
        height: 2.5,
        shapeType: "pergola",
        priceEst: 38500000,
        weightKg: 280,
        wpcColor: "walnut",
        metalColor: "black",
        hasLighting: true,
      },
      {
        id: "item-fpt-l",
        productId: "fp-table-square",
        name: "میز آتشدان مربعی چوب‌پلاست با سبد شعله فلزی",
        category: "water_fire",
        x: -3.5,
        z: -2.0,
        y: 0,
        rotation: 0,
        width: 1.1,
        depth: 1.1,
        height: 0.72,
        shapeType: "firepit_table",
        priceEst: 21500000,
        weightKg: 92,
        hasLighting: true,
      },
      {
        id: "item-ln-l",
        productId: "ln-set",
        name: "ست مبل راحتی ۴ نفره چوب‌پلاست و فلز مشکی (با میز)",
        category: "furniture",
        x: 3.2,
        z: -2.0,
        y: 0,
        rotation: 0,
        width: 2.2,
        depth: 1.5,
        height: 0.78,
        shapeType: "lounge_set",
        priceEst: 26500000,
        weightKg: 64,
      },
      {
        id: "item-wf-l",
        productId: "wf-line",
        name: "آبنمای خطی مدرن استیل و چوب‌پلاست",
        category: "water_fire",
        x: 4.8,
        z: -2.0,
        y: 0,
        rotation: 90,
        width: 1.4,
        depth: 0.45,
        height: 1.2,
        shapeType: "water_feature",
        priceEst: 16800000,
        weightKg: 65,
        hasLighting: true,
      },
      {
        id: "item-fb-l1",
        productId: "fb-160",
        name: "فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض",
        category: "planting",
        x: -5.0,
        z: 1.0,
        y: 0,
        rotation: 90,
        width: 1.6,
        depth: 0.5,
        height: 0.55,
        shapeType: "box",
        priceEst: 7900000,
        weightKg: 58,
      },
      {
        id: "item-fb-l2",
        productId: "fb-160",
        name: "فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض",
        category: "planting",
        x: -5.0,
        z: 2.8,
        y: 0,
        rotation: 90,
        width: 1.6,
        depth: 0.5,
        height: 0.55,
        shapeType: "box",
        priceEst: 7900000,
        weightKg: 58,
      },

      {
        id: "item-fp-l",
        productId: "fp-round",
        name: "آتشدان گازی مدرن روف‌گاردن",
        category: "water_fire",
        x: 3.2,
        z: 0.0,
        y: 0,
        rotation: 0,
        width: 0.9,
        depth: 0.9,
        height: 0.45,
        shapeType: "firepit",
        priceEst: 14200000,
        weightKg: 48,
        hasLighting: true,
      },
      {
        id: "item-umb-l",
        productId: "umb-octa",
        name: "چتر سایبان هیدرولیک پایه‌کنار ۳ متری",
        category: "accessories",
        x: -2.8,
        z: 1.8,
        y: 0,
        rotation: 45,
        width: 3.0,
        depth: 3.0,
        height: 2.65,
        shapeType: "umbrella",
        priceEst: 15400000,
        weightKg: 85,
      },
      {
        id: "item-bn-br-l",
        productId: "bn-backrest",
        name: "نیمکت پشتی‌دار اسلت چوب‌پلاست با شاسی مشکی",
        category: "furniture",
        x: 0.4,
        z: 3.2,
        y: 0,
        rotation: 180,
        width: 1.4,
        depth: 0.62,
        height: 0.88,
        shapeType: "bench_backrest",
        priceEst: 9800000,
        weightKg: 38,
      },
      {
        id: "item-fp-sq-l",
        productId: "fp-table-square",
        name: "میز آتشدان مربعی چوب‌پلاست با سبد شعله فلزی",
        category: "water_fire",
        x: 0.4,
        z: 1.4,
        y: 0,
        rotation: 0,
        width: 1.1,
        depth: 1.1,
        height: 0.72,
        shapeType: "firepit_table",
        priceEst: 21500000,
        weightKg: 92,
        hasLighting: true,
      },
      {
        id: "item-pg-deck-l",
        productId: "pg-deck-320",
        name: "پرگولا مدولار چوب‌پلاست با کف‌سازی دک یکپارچه ۳.۲×۳.۲",
        category: "structures",
        x: 3.4,
        z: 2.4,
        y: 0,
        rotation: 0,
        width: 3.2,
        depth: 3.2,
        height: 2.6,
        shapeType: "pergola_deck",
        priceEst: 52000000,
        weightKg: 410,
        hasLighting: true,
      },
      {
        id: "item-gw-fp-l",
        productId: "gw-frame-planter",
        name: "دیوار سبز مدولار قاب‌دار با تراف کاشت پایه",
        category: "structures",
        x: -5.0,
        z: -2.6,
        y: 0,
        rotation: 90,
        width: 1.2,
        depth: 0.42,
        height: 1.8,
        shapeType: "green_wall_planter",
        priceEst: 11200000,
        weightKg: 68,
        hasLighting: true,
      },
    ],
  },

  // 2. Rooftop with Central Staircase/Elevator Shaft
  {
    id: "central-shaft-roof",
    name: "پلان بام با باکس پله مرکزی (۱۱ × ۱۰ متر | ۹۸.۵ م²)",
    description: "ابعاد کلی: ۱۱ × ۱۰ متر | متراژ خالص طرح: ۹۸.۵ مترمربع | طراحی دسترسی دورگرد پیرامون باکس پله و آسانسور با کف‌سازی چوب‌پلاست تیک، نیمکت‌های متصل، آبنما و دیوار سبز.",
    thumbnail: "https://images.pexels.com/photos/7587879/pexels-photo-7587879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    badge: "پلان باکس پله (۹۸.۵ م²)",
    spaceConfig: {
      spaceType: "residential_roof",
      spaceTypeName: "پشت‌بام مسکونی با باکس پله",
      shape: "central_shaft",
      shapeName: "پلان با باکس پله / آسانسور مرکزی",
      width: 11,
      length: 10,
      shaftWidth: 3.6,
      shaftLength: 3.2,
      parapetHeight: 1.1,
      city: "تهران",
      flooringType: "wpc_wood",
      wpcColor: "teak",
      metalColor: "black",
    },
    items: [
      {
        id: "item-bn-cs1",
        productId: "bn-integrated",
        name: "مجموعه ترکیبی نیمکت متصل به دو فلاورباکس",
        category: "furniture",
        x: 0,
        z: -3.8,
        y: 0,
        rotation: 0,
        width: 2.2,
        depth: 0.5,
        height: 0.6,
        shapeType: "bench_integrated",
        priceEst: 11900000,
        weightKg: 76,
        hasLighting: true,
      },
      {
        id: "item-bn-cs2",
        productId: "bn-integrated",
        name: "مجموعه ترکیبی نیمکت متصل به دو فلاورباکس",
        category: "furniture",
        x: 0,
        z: 3.8,
        y: 0,
        rotation: 180,
        width: 2.2,
        depth: 0.5,
        height: 0.6,
        shapeType: "bench_integrated",
        priceEst: 11900000,
        weightKg: 76,
        hasLighting: true,
      },
      {
        id: "item-gw-cs",
        productId: "gw-120",
        name: "دیواره سبز عمودی مدولار روی دیواره باکس پله",
        category: "structures",
        x: -2.0,
        z: 0,
        y: 0,
        rotation: 90,
        width: 1.2,
        depth: 0.25,
        height: 2.0,
        shapeType: "green_wall",
        priceEst: 12500000,
        weightKg: 85,
        hasLighting: true,
      },
      {
        id: "item-wf-cs",
        productId: "wf-line",
        name: "آبنمای خطی مدرن استیل و چوب‌پلاست",
        category: "water_fire",
        x: 2.0,
        z: 0,
        y: 0,
        rotation: -90,
        width: 1.4,
        depth: 0.45,
        height: 1.2,
        shapeType: "water_feature",
        priceEst: 16800000,
        weightKg: 65,
        hasLighting: true,
      },
      {
        id: "item-fb-cs1",
        productId: "fb-120",
        name: "فلاورباکس مدولار ۱۲۰ سانتی‌متری",
        category: "planting",
        x: -4.5,
        z: -2.5,
        y: 0,
        rotation: 90,
        width: 1.2,
        depth: 0.45,
        height: 0.5,
        shapeType: "box",
        priceEst: 6100000,
        weightKg: 42,
      },
      {
        id: "item-fb-cs2",
        productId: "fb-120",
        name: "فلاورباکس مدولار ۱۲۰ سانتی‌متری",
        category: "planting",
        x: -4.5,
        z: 2.5,
        y: 0,
        rotation: 90,
        width: 1.2,
        depth: 0.45,
        height: 0.5,
        shapeType: "box",
        priceEst: 6100000,
        weightKg: 42,
      },
    ],
  },

  // 3. Narrow Linear Terrace (تراس طولی و بالکن کشیده)
  {
    id: "narrow-linear-balcony",
    name: "پلان تراس طولی کشیده (۱۰ × ۲.۸ متر | ۲۸ م²)",
    description: "ابعاد کلی: ۱۰ × ۲.۸ متر | متراژ خالص طرح: ۲۸ مترمربع | چیدمان خطی ارگونومیک برای تراس‌ها و بالکن‌های کشیده بدون انسداد مسیر عبور و حفظ دید پانوراما.",
    thumbnail: "https://images.pexels.com/photos/8091888/pexels-photo-8091888.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    badge: "تراس طولی (۲۸ م²)",
    spaceConfig: {
      spaceType: "terrace",
      spaceTypeName: "تراس طولی آپارتمان",
      shape: "narrow_balcony",
      shapeName: "پلان تراس طولی کشیده",
      width: 10,
      length: 2.8,
      parapetHeight: 1.1,
      city: "تهران",
      flooringType: "mixed",
      wpcColor: "oak",
      metalColor: "black",
    },
    items: [
      {
        id: "item-bn-nr",
        productId: "bn-120",
        name: "نیمکت مدولار چوب‌پلاست ۱۲۰",
        category: "furniture",
        x: -2.0,
        z: -0.7,
        y: 0,
        rotation: 0,
        width: 1.2,
        depth: 0.45,
        height: 0.45,
        shapeType: "box",
        priceEst: 4800000,
        weightKg: 24,
        hasLighting: true,
      },
      {
        id: "item-fb-nr1",
        productId: "fb-160",
        name: "فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض",
        category: "planting",
        x: 2.5,
        z: -0.8,
        y: 0,
        rotation: 0,
        width: 1.6,
        depth: 0.5,
        height: 0.55,
        shapeType: "box",
        priceEst: 7900000,
        weightKg: 58,
      },
      {
        id: "item-gw-nr",
        productId: "gw-120",
        name: "دیواره سبز عمودی مدولار (Green Wall)",
        category: "structures",
        x: 4.2,
        z: 0.0,
        y: 0,
        rotation: 90,
        width: 1.2,
        depth: 0.25,
        height: 2.0,
        shapeType: "green_wall",
        priceEst: 12500000,
        weightKg: 85,
        hasLighting: true,
      },
    ],
  },

  // 4. U-Shaped Courtyard / Commercial Roof
  {
    id: "u-shaped-courtyard",
    name: "پلان U شکل | روف‌گاردن کافه (۱۴ × ۱۱ متر | ۱۱۸ م²)",
    description: "ابعاد کلی: ۱۴ × ۱۱ متر | متراژ خالص طرح: ۱۱۸ مترمربع | فضای باز ۳ طرفه با حیاط میانی چمن مصنوعی، دو پرگولای قرینه، کانتر باربیکیو و آبنما.",
    thumbnail: "https://images.pexels.com/photos/7722163/pexels-photo-7722163.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    badge: "پلان U شکل (۱۱۸ م²)",
    spaceConfig: {
      spaceType: "cafe_restaurant",
      spaceTypeName: "کافه روف و فضای باز تجاری",
      shape: "u_shaped",
      shapeName: "پلان U شکل ۳ طرفه",
      width: 14,
      length: 11,
      cutoutWidth: 6.0,
      cutoutLength: 6.0,
      parapetHeight: 1.2,
      city: "تهران",
      flooringType: "wpc_wood",
      wpcColor: "charcoal",
      metalColor: "black",
    },
    items: [
      {
        id: "item-pg-u1",
        productId: "pg-3x3",
        name: "پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر",
        category: "structures",
        x: -4.8,
        z: -2.5,
        y: 0,
        rotation: 0,
        width: 3.0,
        depth: 3.0,
        height: 2.5,
        shapeType: "pergola",
        priceEst: 38500000,
        weightKg: 280,
        hasLighting: true,
      },
      {
        id: "item-pg-u2",
        productId: "pg-3x3",
        name: "پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر",
        category: "structures",
        x: 4.8,
        z: -2.5,
        y: 0,
        rotation: 0,
        width: 3.0,
        depth: 3.0,
        height: 2.5,
        shapeType: "pergola",
        priceEst: 38500000,
        weightKg: 280,
        hasLighting: true,
      },
      {
        id: "item-ln-u1",
        productId: "ln-set",
        name: "ست مبل راحتی ۴ نفره چوب‌پلاست و فلز مشکی (با میز)",
        category: "furniture",
        x: -4.8,
        z: -2.5,
        y: 0,
        rotation: 0,
        width: 2.2,
        depth: 1.5,
        height: 0.78,
        shapeType: "lounge_set",
        priceEst: 26500000,
        weightKg: 64,
      },
      {
        id: "item-fpt-u2",
        productId: "fp-table-square",
        name: "میز آتشدان مربعی چوب‌پلاست با سبد شعله فلزی",
        category: "water_fire",
        x: 4.8,
        z: -2.5,
        y: 0,
        rotation: 0,
        width: 1.1,
        depth: 1.1,
        height: 0.72,
        shapeType: "firepit_table",
        priceEst: 21500000,
        weightKg: 92,
        hasLighting: true,
      },
      {
        id: "item-bbq-u",
        productId: "bbq-modular",
        name: "کانتر و باربیکیو ماژولار استیل و چوب‌پلاست",
        category: "accessories",
        x: -4.8,
        z: 3.5,
        y: 0,
        rotation: 0,
        width: 1.8,
        depth: 0.65,
        height: 0.9,
        shapeType: "bbq",
        priceEst: 26500000,
        weightKg: 95,
      },
      {
        id: "item-wf-u",
        productId: "wf-line",
        name: "آبنمای خطی مدرن استیل و چوب‌پلاست",
        category: "water_fire",
        x: 4.8,
        z: 3.5,
        y: 0,
        rotation: 0,
        width: 1.4,
        depth: 0.45,
        height: 1.2,
        shapeType: "water_feature",
        priceEst: 16800000,
        weightKg: 65,
        hasLighting: true,
      },
      {
        id: "item-fp-u",
        productId: "fp-round",
        name: "آتشدان گازی مدرن روف‌گاردن",
        category: "water_fire",
        x: 0,
        z: 3.5,
        y: 0,
        rotation: 0,
        width: 0.9,
        depth: 0.9,
        height: 0.45,
        shapeType: "firepit",
        priceEst: 14200000,
        weightKg: 48,
        hasLighting: true,
      },
    ],
  },

  // 5. Classic Rectangular Luxury Penthouse (مستطیلی لوکس)
  {
    id: "luxury-penthouse-rect",
    name: "پلان مستطیلی | پنت‌هاوس نیاوران (۱۰ × ۸ متر | ۸۰ م²)",
    description: "ابعاد کلی: ۱۰ × ۸ متر | متراژ خالص طرح: ۸۰ مترمربع | چیدمان استاندارد و کامل با پرگولای چوب‌پلاست ۳×۳، نشیمن ال، آبنما، آتشدان و ردیف فلاورباکس‌های محیطی.",
    thumbnail: "https://images.pexels.com/photos/7587884/pexels-photo-7587884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    badge: "پلان مستطیلی (۸۰ م²)",
    spaceConfig: {
      spaceType: "residential_roof",
      spaceTypeName: "پشت‌بام مسکونی",
      shape: "rectangular",
      shapeName: "پلان مستطیلی استاندارد",
      width: 10,
      length: 8,
      parapetHeight: 1.1,
      city: "تهران",
      flooringType: "wpc_wood",
      wpcColor: "walnut",
      metalColor: "black",
    },
    items: [
      {
        id: "item-pg-1",
        productId: "pg-3x3",
        name: "پرگولا مدولار مدرن چوب‌پلاست ۳×۳ متر",
        category: "structures",
        x: -2.5,
        z: -1.8,
        y: 0,
        rotation: 0,
        width: 3.0,
        depth: 3.0,
        height: 2.5,
        shapeType: "pergola",
        priceEst: 38500000,
        weightKg: 280,
        wpcColor: "walnut",
        metalColor: "black",
        hasLighting: true,
      },
      {
        id: "item-ln-1",
        productId: "ln-set",
        name: "ست مبل راحتی ۴ نفره چوب‌پلاست و فلز مشکی (با میز)",
        category: "furniture",
        x: -2.5,
        z: -1.8,
        y: 0,
        rotation: 0,
        width: 2.2,
        depth: 1.5,
        height: 0.78,
        shapeType: "lounge_set",
        priceEst: 26500000,
        weightKg: 64,
      },
      {
        id: "item-wf-1",
        productId: "wf-line",
        name: "آبنمای خطی مدرن استیل و چوب‌پلاست",
        category: "water_fire",
        x: 2.8,
        z: -2.8,
        y: 0,
        rotation: 0,
        width: 1.4,
        depth: 0.45,
        height: 1.2,
        shapeType: "water_feature",
        priceEst: 16800000,
        weightKg: 65,
        hasLighting: true,
      },
      {
        id: "item-fb-1",
        productId: "fb-160",
        name: "فلاورباکس مدولار ۱۶۰ سانتی‌متری عریض",
        category: "planting",
        x: 3.8,
        z: 0.0,
        y: 0,
        rotation: 90,
        width: 1.6,
        depth: 0.5,
        height: 0.55,
        shapeType: "box",
        priceEst: 7900000,
        weightKg: 58,
      },
      {
        id: "item-bn-int",
        productId: "bn-integrated",
        name: "مجموعه ترکیبی نیمکت متصل به دو فلاورباکس",
        category: "furniture",
        x: -0.5,
        z: 2.8,
        y: 0,
        rotation: 0,
        width: 2.2,
        depth: 0.5,
        height: 0.6,
        shapeType: "bench_integrated",
        priceEst: 11900000,
        weightKg: 76,
        hasLighting: true,
      },
      {
        id: "item-fp-1",
        productId: "fp-round",
        name: "آتشدان گازی مدرن روف‌گاردن",
        category: "water_fire",
        x: 1.2,
        z: 0.5,
        y: 0,
        rotation: 0,
        width: 0.9,
        depth: 0.9,
        height: 0.45,
        shapeType: "firepit",
        priceEst: 14200000,
        weightKg: 48,
        hasLighting: true,
      },
    ],
  },
];

export function calculateBillOfMaterials(space: SpaceConfig, items: StudioItem[]): BillOfMaterials {
  let totalAreaM2 = space.width * space.length;

  // Subtract cutout area if shape is L or U or central shaft
  if (space.shape === "l_shaped" && space.cutoutWidth && space.cutoutLength) {
    totalAreaM2 -= space.cutoutWidth * space.cutoutLength;
  } else if (space.shape === "u_shaped" && space.cutoutWidth && space.cutoutLength) {
    totalAreaM2 -= space.cutoutWidth * space.cutoutLength;
  } else if (space.shape === "central_shaft" && space.shaftWidth && space.shaftLength) {
    totalAreaM2 -= space.shaftWidth * space.shaftLength;
  }

  totalAreaM2 = Math.max(8, Math.round(totalAreaM2 * 10) / 10);
  
  // Calculate area footprint of items
  let itemFootprintArea = 0;
  let flowerboxCount = 0;
  let seatingLengthM = 0;
  let pergolaCount = 0;
  let waterFireCount = 0;
  let lightingFixtureCount = 0;
  let itemsWeight = 0;
  let itemsPrice = 0;

  // Track item counts
  const itemCounts: { [key: string]: { count: number; product: any; sampleItem: StudioItem } } = {};

  for (const item of items) {
    const area = item.width * item.depth;
    itemFootprintArea += area;

    const prod = CHEKADBAM_PRODUCTS.find((p) => p.id === item.productId);
    const weight = item.weightKg || prod?.weightKg || 30;
    const price = item.priceEst || prod?.priceEstToman || 5000000;

    itemsWeight += weight;
    itemsPrice += price;

    if (item.category === "planting") {
      flowerboxCount++;
    } else if (item.category === "furniture") {
      seatingLengthM += item.width;
    } else if (item.category === "structures") {
      pergolaCount++;
    } else if (item.category === "water_fire") {
      waterFireCount++;
    }

    if (item.hasLighting || prod?.model3D.hasLighting) {
      lightingFixtureCount++;
    }

    if (!itemCounts[item.productId]) {
      itemCounts[item.productId] = { count: 1, product: prod, sampleItem: item };
    } else {
      itemCounts[item.productId].count++;
    }
  }

  // Flooring calculation
  const flooringAreaM2 = Math.max(0, Math.round((totalAreaM2 - itemFootprintArea * 0.4) * 10) / 10);
  const greenAreaM2 = Math.round((flowerboxCount * 0.7 + (space.flooringType === "artificial_turf" ? flooringAreaM2 * 0.5 : space.flooringType === "mixed" ? flooringAreaM2 * 0.3 : 0)) * 10) / 10;
  
  // Flooring cost & weight
  const flooringWeightPerM2 = space.flooringType === "wpc_wood" ? 18 : space.flooringType === "artificial_turf" ? 4 : space.flooringType === "stone" ? 45 : space.flooringType === "ceramic" ? 28 : 15;
  const flooringCostPerM2 = space.flooringType === "wpc_wood" ? 2400000 : space.flooringType === "artificial_turf" ? 1100000 : space.flooringType === "stone" ? 2800000 : space.flooringType === "ceramic" ? 1900000 : 2100000;

  const totalFlooringWeight = flooringAreaM2 * flooringWeightPerM2;
  const totalFlooringCost = flooringAreaM2 * flooringCostPerM2;

  const totalWeightKg = Math.round(itemsWeight + totalFlooringWeight);
  const weightPerM2 = Math.round((totalWeightKg / totalAreaM2) * 10) / 10;

  let structuralSafety: "safe" | "moderate" | "requires_engineering_check" = "safe";
  if (weightPerM2 > 180) {
    structuralSafety = "requires_engineering_check";
  } else if (weightPerM2 > 110) {
    structuralSafety = "moderate";
  }

  const basePrice = itemsPrice + totalFlooringCost;
  const estimatedPriceMin = Math.round(basePrice * 0.95);
  const estimatedPriceMax = Math.round(basePrice * 1.15);

  const itemizedSummary: BillOfMaterials["itemizedSummary"] = [
    {
      name: `کف‌سازی مدولار (${space.flooringType === "wpc_wood" ? "چوب‌پلاست WPC شیاردار ضدلغزش" : space.flooringType === "artificial_turf" ? "چمن مصنوعی پرتراکم هلندی" : space.flooringType === "stone" ? "سنگ و چوب ترکیبی" : "سرامیک پرسلان"})`,
      code: "FL-SURFACE",
      quantity: Math.round(flooringAreaM2),
      unitPrice: flooringCostPerM2,
      totalPrice: Math.round(totalFlooringCost),
      weightTotal: Math.round(totalFlooringWeight),
    },
  ];

  for (const [prodId, data] of Object.entries(itemCounts)) {
    const p = data.product;
    const unitPrice = data.sampleItem.priceEst || p?.priceEstToman || 5000000;
    const weightEach = data.sampleItem.weightKg || p?.weightKg || 30;
    itemizedSummary.push({
      name: p?.name || data.sampleItem.name,
      code: p?.code || prodId.toUpperCase(),
      quantity: data.count,
      unitPrice,
      totalPrice: unitPrice * data.count,
      weightTotal: weightEach * data.count,
    });
  }

  return {
    totalAreaM2,
    flooringAreaM2,
    greenAreaM2,
    flowerboxCount,
    seatingLengthM: Math.round(seatingLengthM * 10) / 10,
    pergolaCount,
    waterFireCount,
    lightingFixtureCount,
    totalWeightKg,
    weightPerM2,
    structuralSafety,
    estimatedPriceMin,
    estimatedPriceMax,
    itemizedSummary,
  };
}
