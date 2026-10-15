
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: resources.length,
        data: resources,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch resources:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve resources.",
      },
      { status: 500 }
    );
  }
}
