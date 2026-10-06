import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { designs } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * دریافت طرح‌های ارسالی از افزونه وردپرس (Panel Sync).
 *
 * افزونه‌ی چکادبام استودیو بلافاصله پس از ثبت هر طرح (استودیو، REST یا فرم مشاوره)
 * آن را به این اندپوینت POST می‌کند. احراز هویت با توکن مشترک:
 *   - هدر X-CKB-Token یا Authorization: Bearer <token>
 *   - متغیر محیطی DESIGN_SYNC_TOKEN در سمت پنل
 *
 * بدنه با نام فیلدهای جدول designs (src/db/schema.ts) ارسال می‌شود.
 */

export async function POST(req: NextRequest) {
  try {
    const expected = process.env.DESIGN_SYNC_TOKEN;
    if (!expected) {
      return NextResponse.json(
        { success: false, error: "DESIGN_SYNC_TOKEN تنظیم نشده است." },
        { status: 503 }
      );
    }

    const provided =
      req.headers.get("x-ckb-token") ||
      (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");

    if (!provided || provided !== expected) {
      return NextResponse.json(
        { success: false, error: "توکن همگام‌سازی نامعتبر است." },
        { status: 401 }
      );
    }

    const body = await req.json();

    // تست اتصال از صفحه تنظیمات افزونه
    if (body && body.test === true) {
      return NextResponse.json({ success: true, message: "اتصال برقرار است" });
    }

    const {
      wpDesignId,
      source,
      title,
      userName,
      userPhone,
      userEmail,
      city,
      spaceType,
      width,
      length,
      parapetHeight,
      flooringType,
      wpcColor,
      metalColor,
      layoutData,
      totalArea,
      greenArea,
      flooringArea,
      itemsCount,
      estimatedWeightKg,
      estimatedPriceMin,
      estimatedPriceMax,
      notes,
      snapshotUrl,
    } = body ?? {};

    if (!userName || !userPhone) {
      return NextResponse.json(
        { success: false, error: "نام و شماره تماس الزامی است." },
        { status: 400 }
      );
    }

    // جلوگیری از ثبت تکراری: هر طرح وردپرس فقط یک‌بار ذخیره می‌شود
    if (wpDesignId) {
      const [existing] = await db
        .select({ id: designs.id })
        .from(designs)
        .where(eq(designs.sourceRef, `wp:${wpDesignId}`));

      if (existing) {
        return NextResponse.json({
          success: true,
          designId: existing.id,
          duplicate: true,
        });
      }
    }

    const [newDesign] = await db
      .insert(designs)
      .values({
        title:
          title ||
          `طرح از وردپرس — ${userName} (${city || "تهران"})`,
        userName: userName || "کاربر مهمان",
        userPhone: userPhone || "",
        userEmail: userEmail || "",
        city: city || "تهران",
        spaceType: spaceType || "residential_roof",
        width: Number(width) || 10,
        length: Number(length) || 8,
        parapetHeight: Number(parapetHeight) || 1.1,
        flooringType: flooringType || "wpc_wood",
        wpcColor: wpcColor || "walnut",
        metalColor: metalColor || "black",
        layoutData: Array.isArray(layoutData) ? layoutData : [],
        totalArea: Number(totalArea) || 0,
        greenArea: Number(greenArea) || 0,
        flooringArea: Number(flooringArea) || 0,
        itemsCount:
          Number(itemsCount) || (Array.isArray(layoutData) ? layoutData.length : 0),
        estimatedWeightKg: Number(estimatedWeightKg) || 0,
        estimatedPriceMin: Number(estimatedPriceMin) || 0,
        estimatedPriceMax: Number(estimatedPriceMax) || 0,
        notes: notes || "",
        status: "درخواست ثبت‌شده",
        snapshotUrl: snapshotUrl || null,
        sourceRef: `wp:${wpDesignId ?? Date.now()}`,
        source: typeof source === "string" ? source : "wordpress",
      })
      .returning();

    return NextResponse.json({
      success: true,
      designId: newDesign.id,
      duplicate: false,
    });
  } catch (error: any) {
    console.error("Error receiving WordPress design:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
