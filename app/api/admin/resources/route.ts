
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

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

// GET: List all resources for the admin, including inactive ones.
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in as admin." },
        { status: 401 }
      );
    }

    const resources = await prisma.resource.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error("Admin resources GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load resources." },
      { status: 500 }
    );
  }
}

// POST: Add a resource.
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in as admin." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!name || !category || !location) {
      return NextResponse.json(
        {
          success: false,
          message: "Resource name, category, and location are required.",
        },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        category,
        location,
        description: description || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      { success: true, message: "Resource added successfully.", resource },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin resources POST error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to add resource." },
      { status: 500 }
    );
  }
}

// PATCH: Edit a resource.
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in as admin." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = typeof body.id === "string" ? body.id.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";
    const status = body.status;

    if (
      !id ||
      !name ||
      !category ||
      !location ||
      (status !== undefined && status !== "ACTIVE" && status !== "INACTIVE")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Provide a valid resource ID, name, category, and location.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.resource.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Resource not found." },
        { status: 404 }
      );
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        name,
        category,
        location,
        description: description || null,
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Resource updated successfully.",
      resource,
    });
  } catch (error) {
    console.error("Admin resources PATCH error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update resource." },
      { status: 500 }
    );
  }
}

// DELETE: Permanently delete unused resources; deactivate resources
// that have reservation history to preserve existing bookings.
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in as admin." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Resource ID is required." },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reservations: true },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, message: "Resource not found." },
        { status: 404 }
      );
    }

    if (resource._count.reservations > 0) {
      await prisma.resource.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      return NextResponse.json({
        success: true,
        action: "deactivated",
        message:
          "Resource has reservation history, so it was deactivated instead of permanently deleted.",
      });
    }

    await prisma.resource.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      action: "deleted",
      message: "Resource deleted successfully.",
    });
  } catch (error) {
    console.error("Admin resources DELETE error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete resource." },
      { status: 500 }
    );
  }
}
