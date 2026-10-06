export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: "residential" | "commercial" | "office" | "cafe_restaurant" | "villa";
  categoryName: string;
  location: string;
  country: "iran" | "oman" | "armenia";
  countryName: string;
  areaM2: number;
  year: string;
  heroImage: string;
  gallery: string[];
  description: string;
  client: string;
  modulesUsed: string[];
  highlights: string[];
  features: { [key: string]: string };
}

export const CHEKADBAM_PROJECTS: Project[] = [
  {
    id: "niavaran-sky-terrace",
    title: "روف‌گاردن پنت‌هاوس نیاوران",
    subtitle: "طراحی و اجرای بام سبز لوکس با سیستم پرتابل و پرگولای هوشمند",
    category: "residential",
    categoryName: "مسکونی لوکس",
    location: "تهران، نیاوران",
    country: "iran",
    countryName: "ایران",
    areaM2: 240,
    year: "۱۴۰۳",
    heroImage: "https://images.pexels.com/photos/7587884/pexels-photo-7587884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    gallery: [
      "https://images.pexels.com/photos/7587884/pexels-photo-7587884.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/7587879/pexels-photo-7587879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/19923727/pexels-photo-19923727.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    description: "در این پروژه روف‌گاردن ۲۴۰ متری پنت‌هاوس نیاوران، از ترکیب سیستم کف‌سازی چوب‌پلاست تیک طبیعی، پرگولای مدرن لووردار، آبنمای پرده‌ای استیل و بیش از ۳۰ فلاورباکس مدولار مجهز به روشنایی خطی مخفی بهره گرفته شده است. اجرای کامل بدون سوراخکاری ایزوگام در مدت ۷ روز کاری تحویل کارفرما گردید.",
    client: "مهندس فرهمند",
    modulesUsed: ["پرگولا ۳×۳ چوب‌پلاست", "فلاورباکس ۱۲۰ و ۱۶۰", "آبنمای خطی مدرن", "آتشدان گازی دایره‌ای", "کف‌سازی تایل WPC"],
    highlights: [
      "مجهز به سنسور خودکار آبیاری و نورپردازی شبانه",
      "ترکیب پوشش گیاهی معطر مدیترانه‌ای و درختچه‌های همیشه‌سبز هرس‌شده",
      "اتاقک آشپزخانه فضای باز و باربیکیو گازی",
    ],
    features: {
      "مساحت کل": "۲۴۰ مترمربع",
      "مدت زمان نصب": "۷ روز کاری",
      "تعداد ماژول‌های کاشت": "۴۲ ماژول",
      "سیستم آبیاری": "هوشمند تحت فشار با سنسور باران",
    },
  },
  {
    id: "muscat-al-mouj-roof",
    title: "روف‌تراس مجتمع الموج مسقط",
    subtitle: "پروژه بین‌المللی روف‌گاردن مقاوم در برابر آب‌وهوای گرمسیری و شرجی خلیج فارس",
    category: "commercial",
    categoryName: "تجاری و بین‌الملل",
    location: "عمان، مسقط (Al Mouj)",
    country: "oman",
    countryName: "عمان",
    areaM2: 520,
    year: "۲۰۲۴",
    heroImage: "https://images.pexels.com/photos/29149077/pexels-photo-29149077.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    gallery: [
      "https://images.pexels.com/photos/29149077/pexels-photo-29149077.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/8134813/pexels-photo-8134813.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    description: "طراحی و صادرات سیستم‌های مدولار چکادبام به کشور عمان با استفاده از پلیمرهای مقاوم در برابر گرمای بالای ۵۰ درجه سانتی‌گراد و بادهای شور ساحلی. دارای سایبان‌های هیدرولیک و مخازن هوشمند ذخیره آب با کنترل اینترنت اشیا (IoT).",
    client: "Al-Mouj Hospitality Group",
    modulesUsed: ["پرگولاهای آلومینیومی دوبل", "فلاورباکس‌های عایق حرارتی GFRC", "دیواره‌های سبز عمودی مقاوم به گرما"],
    highlights: [
      "طراحی منطبق با مقررات سخت‌گیرانه بار سازه‌ای خلیج فارس",
      "استفاده از گونه‌های گیاهی بومی نخل پاکوتاه و کاکتوس‌های زینتی",
      "کاهش دمای طبقه زیرین تا ۵.۵ درجه سانتی‌گراد",
    ],
    features: {
      "مساحت": "۵۲۰ مترمربع",
      "کشور": "سلطنت عمان (دفتر چکادبام مسقط)",
      "پوشش سایبان": "سقف اتوماتیک متحرک با الیاف ضد UV",
    },
  },
  {
    id: "yerevan-cascade-view",
    title: "کافه روف‌گاردن کاسکاد ایروان",
    subtitle: "فضای باز پرانرژی با نیمکت‌های متصل، آبنما و نورپردازی شبانه ویژه فصول بهار و تابستان",
    category: "cafe_restaurant",
    categoryName: "کافه و رستوران",
    location: "ارمنستان، ایروان (Cascade)",
    country: "armenia",
    countryName: "ارمنستان",
    areaM2: 180,
    year: "۲۰۲۳",
    heroImage: "https://images.pexels.com/photos/7722163/pexels-photo-7722163.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    gallery: [
      "https://images.pexels.com/photos/7722163/pexels-photo-7722163.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/9584741/pexels-photo-9584741.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    description: "روف‌گاردن تجاری کافه رستوران در منطقه تاریخی کاسکاد ایروان با چیدمان مدولار منعطف که در فصل زمستان قابلیت جابه‌جایی سریع و جمع‌آوری برای انبارش را داراست.",
    client: "Sky Cascade Bistro",
    modulesUsed: ["مجموعه نیمکت متصل به فلاورباکس", "آتشدان گازی مدرن", "چمن مصنوعی ترکیبی با تایل WPC"],
    highlights: [
      "افزایش ۴۵ درصدی ظرفیت پذیرش مشتریان کافه",
      "سیستم گرمایش تابشی زیر سایبان‌ها برای شب‌های سرد",
      "نورپردازی آرام‌بخش با چیپ‌های ادیسون گرم",
    ],
    features: {
      "ظرفیت هم‌زمان": "۷۵ نفر مهمان",
      "مساحت": "۱۸۰ مترمربع",
      "مدت زمان بازگشت سرمایه": "۴ ماه",
    },
  },
  {
    id: "zaferaniyeh-villa-terrace",
    title: "تراس سبز ویلای زعفرانیه",
    subtitle: "باغچه طبقاتی روی بالکن عریض با گرین‌وال عمودی و نیمکت‌های چوبی ارگونومیک",
    category: "residential",
    categoryName: "مسکونی و تراس",
    location: "تهران، زعفرانیه",
    country: "iran",
    countryName: "ایران",
    areaM2: 95,
    year: "۱۴۰۳",
    heroImage: "https://images.pexels.com/photos/7587879/pexels-photo-7587879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    gallery: [
      "https://images.pexels.com/photos/7587879/pexels-photo-7587879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/8091888/pexels-photo-8091888.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    description: "تبدیل یک تراس بتنی خشک به واحه سبز آرامش‌بخش خانوادگی با دیواره سبز ۱۲ متری و پوشش کف چوب‌پلاست بلوطی روشن.",
    client: "خانواده دکتر معتمدی",
    modulesUsed: ["دیوار سبز مدولار", "نیمکت چوب‌پلاست ۱۲۰", "فلاورباکس کنج", "نورپردازی خطی"],
    highlights: [
      "عایق‌بندی صوتی عالی در برابر سروصدای خیابان",
      "سیستم تزریق کود مایع ارگانیک توکار",
      "اتصال مستقیم به سالن پذیرایی",
    ],
    features: {
      "مساحت": "۹۵ مترمربع",
      "تعداد گونه‌های گیاهی": "۱۴ گونه سازگار",
      "وزن سازه": "کاملاً سبک‌سازی شده بر اساس تاییدیه نظام مهندسی",
    },
  },
  {
    id: "saadat-abad-office-sky",
    title: "فضای استراحت بام اداری سعادت‌آباد",
    subtitle: "طراحی زیست‌گرایانه (Biophilic) برای ارتقای سلامت روان پرسنل شرکت دانش‌بنیان",
    category: "office",
    categoryName: "اداری و سازمانی",
    location: "تهران، سعادت‌آباد",
    country: "iran",
    countryName: "ایران",
    areaM2: 310,
    year: "۱۴۰۲",
    heroImage: "https://images.pexels.com/photos/7280894/pexels-photo-7280894.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    gallery: ["https://images.pexels.com/photos/7280894/pexels-photo-7280894.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"],
    description: "ایجاد زون‌های تفکیک‌شده برای جلسات غیررسمی در هوای آزاد، فضای استراحت انفرادی، و محوطه قهوه‌خوری با بهره‌گیری از پارتیشن‌های لوور WPC.",
    client: "هلدینگ فناوری داتیس",
    modulesUsed: ["ست مبل راحتی ۴ نفره", "میز آتشدان مربعی", "پارتیشن لوور چوبی", "آبنمای خطی"],
    highlights: [
      "فضای جلسات در هوای آزاد مجهز به اینترنت و پریزهای ضدآب",
      "استفاده از گیاهان با خاصیت تصفیه هوا و جذب دی‌اکسید کربن",
      "افزایش رضایت شغلی و بهره‌وری تیم",
    ],
    features: {
      "مساحت": "۳۱۰ مترمربع",
      "تعداد زون‌های کاری": "۴ زون مجزا",
      "ظرفیت هم‌زمان": "۵۰ نفر",
    },
  },
  {
    id: "lavasan-villa-garden",
    title: "روف‌گاردن ویلای مدرن لواسان",
    subtitle: "تلفیق چشم‌انداز سد لتیان با استخر بام، آتشدان و گیاهان کوهستانی مقاوم به سرما",
    category: "villa",
    categoryName: "ویلایی",
    location: "تهران، لواسان",
    country: "iran",
    countryName: "ایران",
    areaM2: 380,
    year: "۱۴۰۳",
    heroImage: "https://images.pexels.com/photos/19923727/pexels-photo-19923727.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    gallery: [
      "https://images.pexels.com/photos/19923727/pexels-photo-19923727.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/36394732/pexels-photo-36394732.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
    description: "بام ویلای مدرن در شیب‌کوه لواسان مجهز به آتشدان بزرگ، نشیمن فرورفته (Sunken Seating) چوب‌پلاست، و بستر کاشت کاج‌های همیشه سبز مقاوم به دمای منفی ۱۵ درجه.",
    client: "مهندس ناصری",
    modulesUsed: ["آتشدان گازی دایره‌ای", "پرگولا مدولار ۳×۳", "فلاورباکس‌های ۱۶۰ مرتفع", "تایل چوب‌پلاست گردویی"],
    highlights: [
      "عایق حرارتی ویژه زمستان‌های کوهستانی لواسان",
      "نورپردازی گرم غروب با سیستم هماهنگ صوتی",
      "ایجاد حریم خصوصی از ویلاهای مجاور",
    ],
    features: {
      "مساحت": "۳۸۰ مترمربع",
      "مقاومت دمایی": "منفی ۲۰ تا مثبت ۴۵ درجه",
      "گارانتی": "۱۰ سال سازه و اتصالات",
    },
  },
];
