
import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Identify the employee from the signed-in session.
    const session = await getEmployeeSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in to continue." },
        { status: 401 }
      );
    }

    // Return only reservations belonging to this employee.
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: session.userId,
      },
      include: {
        resource: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error("My reservations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load reservations.",
      },
      { status: 500 }
    );
  }
}
