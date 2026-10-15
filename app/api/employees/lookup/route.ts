
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const employeeNumber =
      typeof body.employeeNumber === "string"
        ? body.employeeNumber.trim()
        : "";

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!employeeNumber || !fullName || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your name, employee number, and email.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findFirst({
      where: {
        employeeNumber,
        fullName: {
          equals: fullName,
          mode: "insensitive",
        },
        email: {
          equals: email,
          mode: "insensitive",
        },
        role: "EMPLOYEE",
      },
      select: {
        id: true,
        fullName: true,
        employeeNumber: true,
        email: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employee not found. Please check your details or register an employee account.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Employee lookup failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify employee details.",
      },
      { status: 500 }
    );
  }
}
