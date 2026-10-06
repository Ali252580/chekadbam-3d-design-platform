import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consultationRequests } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const consultations = await db
      .select()
      .from(consultationRequests)
      .orderBy(desc(consultationRequests.createdAt));
    return NextResponse.json({ success: true, consultations });
  } catch (error: any) {
    console.error("Error fetching consultations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, city, spaceType, estimatedArea, servicesNeeded, message, designId } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: "نام و شماره تماس الزامی است." }, { status: 400 });
    }

    const [newRequest] = await db
      .insert(consultationRequests)
      .values({
        name,
        phone,
        city: city || "تهران",
        spaceType: spaceType || "پشت‌بام مسکونی",
        estimatedArea: Number(estimatedArea) || null,
        servicesNeeded: servicesNeeded || ["طراحی سه‌بعدی", "اجرای مدولار"],
        message: message || "",
        designId: designId ? Number(designId) : null,
        status: "در انتظار بررسی",
      })
      .returning();

    return NextResponse.json({ success: true, consultation: newRequest });
  } catch (error: any) {
    console.error("Error creating consultation:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
