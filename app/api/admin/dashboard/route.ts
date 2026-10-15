
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("reservehub_admin")?.value;
    const secret = process.env.AUTH_SECRET;

    if (!token || !secret || secret.length < 32) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (payload.role !== "ADMIN" || typeof payload.sub !== "string") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    const [totalResources, totalReservations, upcomingReservations] =
      await Promise.all([
        prisma.resource.count(),
        prisma.reservation.count({
          where: { status: "CONFIRMED" },
        }),
        prisma.reservation.count({
          where: {
            status: "CONFIRMED",
            startTime: { gte: now },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalResources,
        totalReservations,
        upcomingReservations,
      },
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load dashboard statistics." },
      { status: 500 }
    );
  }
}
