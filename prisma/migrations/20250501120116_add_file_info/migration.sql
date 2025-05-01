/*
  Warnings:

  - Added the required column `name` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "uploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
