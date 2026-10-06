import "dotenv/config";
import { db } from "./index";
import { designs, consultationRequests } from "./schema";
import { PRESET_DESIGNS } from "../lib/studio-presets";

async function seed() {
  try {
    console.log("Seeding initial data...");

    // Insert sample designs
    const preset1 = PRESET_DESIGNS[0];
    const preset2 = PRESET_DESIGNS[1];

    await db.insert(designs).values([
      {
        title: "طرح روف‌گاردن پنت‌هاوس نیاوران",
        userName: "مهندس فرهمند",
        userPhone: "09121112233",
        userEmail: "farahmand@example.com",
        city: "تهران",
        spaceType: "residential_roof",
        width: 10,
        length: 8,
        parapetHeight: 1.1,
        flooringType: "wpc_wood",
        wpcColor: "walnut",
        metalColor: "black",
        layoutData: preset1.items,
        totalArea: 80,
        greenArea: 24,
        flooringArea: 56,
        itemsCount: preset1.items.length,
        estimatedWeightKg: 4200,
        estimatedPriceMin: 145000000,
        estimatedPriceMax: 180000000,
        notes: "تمایل به نصب پرگولای چوب‌پلاست به همراه نور خطی زیر نیمکت‌ها.",
        status: "در حال طراحی",
        expertNotes: "بازدید اولیه انجام شد. بارگذاری سازه تایید گردید. پیش‌فاکتور ارسال شد.",
        assignedExpert: "مهندس علوی",
        snapshotUrl: "https://images.pexels.com/photos/7587884/pexels-photo-7587884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      },
      {
        title: "طرح تراس سبز دنج زعفرانیه",
        userName: "خانم دکتر معتمدی",
        userPhone: "09123334455",
        userEmail: "motamedi@example.com",
        city: "تهران",
        spaceType: "terrace",
        width: 6,
        length: 4,
        parapetHeight: 1.1,
        flooringType: "mixed",
        wpcColor: "teak",
        metalColor: "black",
        layoutData: preset2.items,
        totalArea: 24,
        greenArea: 8,
        flooringArea: 16,
        itemsCount: preset2.items.length,
        estimatedWeightKg: 980,
        estimatedPriceMin: 48000000,
        estimatedPriceMax: 62000000,
        notes: "تراس نیازمند دیوار سبز عمودی برای حفظ محرمیت از ساختمان روبرو است.",
        status: "در انتظار تماس",
        expertNotes: "جهت بررسی ابعاد دقیق تماس گرفته شود.",
        assignedExpert: "مهندس حسینی",
        snapshotUrl: "https://images.pexels.com/photos/7587879/pexels-photo-7587879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      },
    ]);

    // Insert sample consultation requests
    await db.insert(consultationRequests).values([
      {
        name: "مهندس کامیار",
        phone: "09127778899",
        city: "اصفهان",
        spaceType: "روف‌گاردن کافه و رستوران",
        estimatedArea: 150,
        servicesNeeded: ["طراحی سه‌بعدی", "پرگولا لووردار", "کف‌پوش WPC"],
        message: "برای کافه روف نیاز به برآورد قیمت و نقشه اجرایی داریم.",
        status: "در انتظار بررسی",
        expertNotes: "در نوبت هماهنگی با تیم مهندسی اصفهان",
      },
      {
        name: "مهندس شریفی",
        phone: "09124445566",
        city: "تهران",
        spaceType: "ویلایی لواسان",
        estimatedArea: 220,
        servicesNeeded: ["آبنما و آتشدان", "سیستم کاشت مدولار"],
        message: "ویلا نوساز در لواسان، نیاز به بررسی بارگذاری سقف استخر بام.",
        status: "نیازمند بازدید",
        expertNotes: "هماهنگی جهت بازدید روز پنج‌شنبه",
      },
    ]);

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

seed();
