
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";



function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getToken(request: Request): string {
  return new URL(request.url).searchParams.get("token") || "";
}

export async function GET(request: Request) {
  try {
    const token = getToken(request);

    if (!token || token.length > 200) {
      return NextResponse.json(
        { success: false, message: "This confirmation link is invalid." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { confirmationTokenHash: hashToken(token) },
      include: {
        resource: {
          select: { name: true, category: true, location: true },
        },
        employee: {
          select: { fullName: true, employeeNumber: true, email: true },
        },
      },
    });

    if (!reservation || reservation.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "This link is invalid, already used, or no longer available.",
        },
        { status: 404 }
      );
    }

    if (
      !reservation.confirmationExpiresAt ||
      reservation.confirmationExpiresAt <= new Date()
    ) {
      await prisma.reservation.updateMany({
        where: {
          id: reservation.id,
          status: "PENDING",
          confirmationTokenHash: hashToken(token),
        },
        data: {
          status: "CANCELLED",
          confirmationTokenHash: null,
          confirmationExpiresAt: null,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "This confirmation link has expired. Please contact the employee who created the booking.",
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: reservation.bookingId,
        bookingFor: reservation.bookingFor,
        status: reservation.status,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        visitorName: reservation.visitorName,
        visitorEmail: reservation.visitorEmail,
        resource: reservation.resource,
        employee: reservation.employee,
      },
    });
  } catch (error) {
    console.error("Read booking confirmation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load the booking details." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const action = body.action;

    if (
      !token ||
      token.length > 200 ||
      (action !== "CONFIRM" && action !== "REJECT")
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid confirmation request." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const now = new Date();

    const reservation = await prisma.reservation.findUnique({
      where: { confirmationTokenHash: tokenHash },
      select: {
        id: true,
        status: true,
        confirmationExpiresAt: true,
      },
    });

    if (!reservation || reservation.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: "This booking request has already been processed or the link is invalid.",
        },
        { status: 404 }
      );
    }

    if (
      !reservation.confirmationExpiresAt ||
      reservation.confirmationExpiresAt <= now
    ) {
      await prisma.reservation.updateMany({
        where: {
          id: reservation.id,
          status: "PENDING",
          confirmationTokenHash: tokenHash,
        },
        data: {
          status: "CANCELLED",
          confirmationTokenHash: null,
          confirmationExpiresAt: null,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "This confirmation link has expired.",
        },
        { status: 410 }
      );
    }

    const updated = await prisma.reservation.updateMany({
      where: {
        id: reservation.id,
        status: "PENDING",
        confirmationTokenHash: tokenHash,
        confirmationExpiresAt: { gt: now },
      },
      data: {
        status: action === "CONFIRM" ? "CONFIRMED" : "REJECTED",
        recipientConfirmedAt: now,
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
      },
    });

    if (updated.count !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "This booking has already been processed or the link has expired.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      status: action === "CONFIRM" ? "CONFIRMED" : "REJECTED",
      message:
        action === "CONFIRM"
          ? "Booking confirmed successfully."
          : "Booking request rejected.",
    });
  } catch (error) {
    console.error("Process booking confirmation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to process your decision." },
      { status: 500 }
    );
  }
}
