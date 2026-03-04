/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,displayName,folderId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayName` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "File_userId_name_folderId_key";

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "displayName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_name_key" ON "File"("name");

-- CreateIndex
CREATE UNIQUE INDEX "File_userId_displayName_folderId_key" ON "File"("userId", "displayName", "folderId");
