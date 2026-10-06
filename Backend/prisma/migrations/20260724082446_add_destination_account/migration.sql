/*
  Warnings:

  - Added the required column `updatedAt` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Transfer_userId_key";

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "DestinationAccount" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DestinationAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DestinationAccount_googleId_key" ON "DestinationAccount"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "DestinationAccount_userId_key" ON "DestinationAccount"("userId");

-- AddForeignKey
ALTER TABLE "DestinationAccount" ADD CONSTRAINT "DestinationAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
