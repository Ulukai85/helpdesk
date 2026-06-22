/*
  Warnings:

  - The primary key for the `Ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `customerName` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_pkey",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "customerName" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
