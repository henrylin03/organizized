/*
  Warnings:

  - You are about to drop the column `url` on the `File` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[downloadUrl]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `downloadUrl` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "File_url_key";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "url",
ADD COLUMN     "downloadUrl" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_downloadUrl_key" ON "File"("downloadUrl");
