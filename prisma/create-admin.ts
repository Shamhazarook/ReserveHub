
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const fullName = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const employeeNumber =
    process.env.ADMIN_EMPLOYEE_NUMBER?.trim() || null;
  const password = process.env.ADMIN_PASSWORD;

  if (!fullName || !email || !password || password.length < 8) {
    throw new Error(
      "Provide an admin name, email, and password of at least 8 characters."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      employeeNumber,
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      fullName,
      email,
      employeeNumber,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log("Admin account created or updated successfully.");
  console.log(`Admin email: ${email}`);
}

main()
  .catch((error) => {
    console.error("Could not create admin account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
