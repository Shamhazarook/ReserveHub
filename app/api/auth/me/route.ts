
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmployeeSession } from "@/lib/employee-auth";

export async function GET() {
  try {
    const session = await getEmployeeSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        employeeNumber: true,
        role: true,
      },
    });

    if (!user || user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { success: false, message: "Employee account not found." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Employee profile error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load employee details." },
      { status: 500 }
    );
  }
}
