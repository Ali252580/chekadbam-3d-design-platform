import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Vazirmatn } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-vazir",
  display: "swap",
});

const title = "چکادبام | روف‌گاردن مدولار بدون سوراخکاری ایزوگام";
const description =
  "طراحی، تولید کارخانه و اجرای روف‌گاردن پرتابل در حدود ۷ روز کاری. بازدید رایگان، ضمانت کتبی ۵ تا ۱۰ ساله، بیش از ۲۵۰۰ پروژه در ایران، عمان و ارمنستان.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.site),
  title,
  description,
  keywords: [
    "چکادبام",
    "روف گاردن مدولار",
    "روف گاردن پرتابل",
    "بام سبز بدون تخریب ایزوگام",
    "طراحی سه بعدی بام من",
    "فلاورباکس مدولار",
    "پرگولا روف گاردن",
    "چوب پلاست WPC",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: SITE.site,
    siteName: SITE.name,
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.site}/#organization`,
      name: SITE.name,
      alternateName: SITE.nameEn,
      url: SITE.site,
      email: SITE.email,
      telephone: ["+98-21-44484801", "+98-912-1306522"],
      sameAs: [SITE.instagram],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE.site}/#localbusiness`,
      name: SITE.name,
      image: `${SITE.site}/`,
      url: SITE.site,
      telephone: "+98-21-44484801",
      email: SITE.email,
      address: {
        "@type": "PostalAddress",
        addressCountry: "IR",
        addressLocality: "تهران",
        streetAddress: SITE.address,
      },
      areaServed: ["IR", "OM", "AM"],
      parentOrganization: { "@id": `${SITE.site}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans selection:bg-emerald-500 selection:text-slate-950">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
