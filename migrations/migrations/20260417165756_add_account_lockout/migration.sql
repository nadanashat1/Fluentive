-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lockUntil" TIMESTAMP(3),
ADD COLUMN     "loginAttemptCount" INTEGER NOT NULL DEFAULT 0;
