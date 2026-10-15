
import { NextResponse } from "next/server";
import { clearEmployeeSession } from "@/lib/employee-auth";

export async function POST() {
  try {
    await clearEmployeeSession();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Employee logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to log out. Please try again.",
      },
      { status: 500 }
    );
  }
}
