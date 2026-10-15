
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEmployeeSession } from "@/lib/employee-auth";

type BookingType = "SELF" | "EMPLOYEE" | "VISITOR";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function makeBookingId(yearMonth: string, number: number) {
  return `RS${yearMonth}${String(number).padStart(4, "0")}`;
}

function formatDate(date: Date) {
  return date.toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

function cleanText(value: string) {
  return value.replace(/[<>&"]/g, "");
}

export async function GET() {
  try {
    const session = await getEmployeeSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { createdById: session.userId },
          { userId: session.userId },
        ],
      },
      include: {
        resource: true,
        employee: {
          select: {
            fullName: true,
            employeeNumber: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error("Get reservations error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load reservations." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getEmployeeSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in before booking." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const resourceId =
      typeof body.resourceId === "string" ? body.resourceId.trim() : "";

    const startTimeText =
      typeof body.startTime === "string" ? body.startTime : "";

    const endTimeText =
      typeof body.endTime === "string" ? body.endTime : "";

    if (!resourceId || !startTimeText || !endTimeText) {
      return NextResponse.json(
        {
          success: false,
          message: "Resource, start time, and end time are required.",
        },
        { status: 400 }
      );
    }

    const startTime = new Date(startTimeText);
    const endTime = new Date(endTimeText);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      startTime <= new Date() ||
      endTime <= startTime
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid future booking times.",
        },
        { status: 400 }
      );
    }

    if (endTime.getTime() - startTime.getTime() > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, message: "A booking cannot exceed 24 hours." },
        { status: 400 }
      );
    }

    const bookingFor: BookingType | null =
      body.bookingFor === "SELF" ||
      body.bookingFor === "EMPLOYEE" ||
      body.bookingFor === "VISITOR"
        ? body.bookingFor
        : null;

    if (!bookingFor) {
      return NextResponse.json(
        { success: false, message: "Select a valid booking type." },
        { status: 400 }
      );
    }

    const creator = await prisma.user.findFirst({
      where: {
        id: session.userId,
        role: "EMPLOYEE",
      },
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, message: "Employee account not found." },
        { status: 401 }
      );
    }

    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        status: "ACTIVE",
      },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, message: "This resource is unavailable." },
        { status: 400 }
      );
    }

    let recipient: {
      id: string;
      fullName: string;
      email: string;
      employeeNumber: string | null;
    } | null = null;

    let visitorName: string | null = null;
    let visitorEmail: string | null = null;
    let recipientWhatsApp = "";

    // Booking for the logged-in employee
    if (bookingFor === "SELF") {
      recipient = {
        id: creator.id,
        fullName: creator.fullName,
        email: creator.email,
        employeeNumber: creator.employeeNumber,
      };
    }

    // Booking for another registered employee
    if (bookingFor === "EMPLOYEE") {
      const employeeNumber =
        typeof body.employeeNumber === "string"
          ? body.employeeNumber.trim()
          : "";

      if (!employeeNumber) {
        return NextResponse.json(
          {
            success: false,
            message: "Recipient employee number is required.",
          },
          { status: 400 }
        );
      }

      recipient = await prisma.user.findFirst({
        where: {
          employeeNumber,
          role: "EMPLOYEE",
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          employeeNumber: true,
        },
      });

      if (!recipient) {
        return NextResponse.json(
          {
            success: false,
            message: "No registered employee was found with that number.",
          },
          { status: 404 }
        );
      }
    }

    // Visitor details; email is optional for WhatsApp
    if (bookingFor === "VISITOR") {
      const nameInput: unknown = body.visitorName;
      const emailInput: unknown = body.visitorEmail;

      visitorName =
        typeof nameInput === "string" ? nameInput.trim() : "";

      const email =
        typeof emailInput === "string"
          ? emailInput.trim().toLowerCase()
          : "";

      if (
        !visitorName ||
        visitorName.length > 100 ||
        (email !== "" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Enter a visitor name and a valid email address if provided.",
          },
          { status: 400 }
        );
      }

      visitorEmail = email || null;
    }

    // Collect the recipient's WhatsApp number for bookings for others
    if (bookingFor !== "SELF") {
      const phoneInput: unknown = body.recipientWhatsApp;

      const rawPhone =
        typeof phoneInput === "string" ? phoneInput.trim() : "";

      recipientWhatsApp = rawPhone.replace(/\D/g, "");

      if (!/^[1-9]\d{7,14}$/.test(recipientWhatsApp)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Enter a valid WhatsApp number with country code, without + or spaces. Example: 94771234567.",
          },
          { status: 400 }
        );
      }
    }

    const requiresConfirmation = bookingFor !== "SELF";

    const rawToken = requiresConfirmation
      ? randomBytes(32).toString("hex")
      : null;

    const confirmationTokenHash = rawToken
      ? hashToken(rawToken)
      : null;

    const confirmationExpiresAt = rawToken
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : null;

    const now = new Date();

    const yearMonth =
      `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    // Create the reservation and prevent overlapping bookings
    const reservation = await prisma.$transaction(
      async (tx) => {
        const overlap = await tx.reservation.findFirst({
          where: {
            resourceId,
            status: { in: ["PENDING", "CONFIRMED"] },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        });

        if (overlap) {
          throw new Error("BOOKING_OVERLAP");
        }

        const sequence = await tx.bookingSequence.upsert({
          where: { yearMonth },
          create: { yearMonth, lastNumber: 1 },
          update: { lastNumber: { increment: 1 } },
        });

        return tx.reservation.create({
          data: {
            bookingId: makeBookingId(yearMonth, sequence.lastNumber),
            resourceId,
            userId: recipient?.id ?? null,
            createdById: creator.id,
            bookingFor,
            startTime,
            endTime,
            status: requiresConfirmation ? "PENDING" : "CONFIRMED",
            visitorName,
            visitorEmail,
            confirmationTokenHash,
            confirmationExpiresAt,
          },
          include: {
            resource: true,
            employee: {
              select: {
                fullName: true,
                employeeNumber: true,
                email: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    // Prepare a WhatsApp message; this does not send it automatically.
    let whatsappUrl: string | null = null;

    if (requiresConfirmation && rawToken) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

      const confirmationUrl =
        `${baseUrl}/booking/confirm?token=${encodeURIComponent(rawToken)}`;

      const recipientName =
        bookingFor === "VISITOR"
          ? visitorName!
          : recipient!.fullName;

      const message = [
        `Hello ${recipientName},`,
        "",
        "You have a resource reservation request in ReserveHub.",
        `Booking ID: ${reservation.bookingId}`,
        `Resource: ${resource.name}`,
        `Start: ${formatDate(startTime)}`,
        `End: ${formatDate(endTime)}`,
        "",
        "Please open this secure link to confirm or reject the request:",
        confirmationUrl,
        "",
        "This link expires in 24 hours.",
      ].join("\n");

      whatsappUrl =
        `https://wa.me/${recipientWhatsApp}?text=${encodeURIComponent(message)}`;
    }

    return NextResponse.json({
      success: true,
      message: requiresConfirmation
        ? "Booking request created. Open WhatsApp and send the invitation to the recipient."
        : "Your booking has been confirmed.",
      data: reservation,
      whatsappUrl,
      notificationMethod: requiresConfirmation
        ? "WHATSAPP_CLICK_TO_CHAT"
        : "NONE",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_OVERLAP") {
      return NextResponse.json(
        {
          success: false,
          message: "This resource is already booked for that time.",
        },
        { status: 409 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another booking was processed at the same time. Please try again.",
        },
        { status: 409 }
      );
    }

    console.error("Create reservation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create the reservation." },
      { status: 500 }
    );
  }
}
