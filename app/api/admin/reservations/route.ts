
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const allowedStatuses = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
] as const;

type ReservationStatus = (typeof allowedStatuses)[number];

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get("reservehub_admin")?.value;
    const secret = process.env.AUTH_SECRET;

    if (!token || !secret || secret.length < 32) {
      return false;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (payload.role !== "ADMIN" || typeof payload.sub !== "string") {
      return false;
    }

    const admin = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true },
    });

    return admin?.role === "ADMIN";
  } catch {
    return false;
  }
}

// GET: Load all reservations for the administrator.
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please log in as admin.",
        },
        { status: 401 }
      );
    }

    const records = await prisma.reservation.findMany({
      include: {
        employee: {
          select: {
            fullName: true,
            email: true,
            employeeNumber: true,
          },
        },
        resource: {
          select: {
            name: true,
            category: true,
            location: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    const reservations = records.map((record) => ({
      id: record.id,
      startTime: record.startTime,
      endTime: record.endTime,
      status: record.status,
      employee: {
        fullName:
          record.employee?.fullName ??
          record.visitorName ??
          "Visitor",
        email:
          record.employee?.email ??
          record.visitorEmail ??
          "—",
        employeeNumber: record.employee?.employeeNumber ?? null,
      },
      resource: record.resource,
    }));

    return NextResponse.json({
      success: true,
      reservations,
    });
  } catch (error) {
    console.error("Admin reservations GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load reservations. Check the server logs.",
      },
      { status: 500 }
    );
  }
}

// PATCH: Update a reservation's status.
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please log in as admin.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = body.id;
    const status = body.status;

    if (
      typeof id !== "string" ||
      !id.trim() ||
      typeof status !== "string" ||
      !allowedStatuses.includes(status as ReservationStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide a valid reservation ID and status.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.reservation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Reservation not found.",
        },
        { status: 404 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: status as ReservationStatus },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reservation status updated to ${reservation.status}.`,
      reservation,
    });
  } catch (error) {
    console.error("Admin reservation PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update reservation status.",
      },
      { status: 500 }
    );
  }
}
