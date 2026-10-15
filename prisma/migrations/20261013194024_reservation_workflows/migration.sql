/*
  Warnings:

  - A unique constraint covering the columns `[bookingId]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[confirmationTokenHash]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('SELF', 'EMPLOYEE', 'VISITOR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReservationStatus" ADD VALUE 'PENDING';
ALTER TYPE "ReservationStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_userId_fkey";

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "bookingFor" "ReservationType" NOT NULL DEFAULT 'SELF',
ADD COLUMN     "bookingId" TEXT,
ADD COLUMN     "confirmationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "confirmationTokenHash" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "recipientConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "visitorEmail" TEXT,
ADD COLUMN     "visitorName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BookingSequence" (
    "yearMonth" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSequence_pkey" PRIMARY KEY ("yearMonth")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_bookingId_key" ON "Reservation"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_confirmationTokenHash_key" ON "Reservation"("confirmationTokenHash");

-- CreateIndex
CREATE INDEX "Reservation_createdById_idx" ON "Reservation"("createdById");

-- CreateIndex
CREATE INDEX "Reservation_status_startTime_idx" ON "Reservation"("status", "startTime");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
