
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const employeeNumber =
      typeof body.employeeNumber === "string"
        ? body.employeeNumber.trim()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!fullName || !email || !employeeNumber || !password) {
      return NextResponse.json(
        { success: false, message: "Please complete all fields." },
        { status: 400 }
      );
    }

    if (fullName.length > 100 || employeeNumber.length > 50) {
      return NextResponse.json(
        { success: false, message: "One or more fields are too long." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be between 8 and 72 characters.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeNumber }],
      },
      select: {
        email: true,
        employeeNumber: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            existingUser.email === email
              ? "This email is already registered."
              : "This employee ID is already registered.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        employeeNumber,
        passwordHash,
        role: "EMPLOYEE",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        employeeNumber: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Employee account created successfully. Please log in.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This email or employee ID is already registered.",
        },
        { status: 409 }
      );
    }

    console.error("Employee registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to register right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
