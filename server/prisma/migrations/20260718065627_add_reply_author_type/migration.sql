/*
  Warnings:

  - Added the required column `authorType` to the `TicketReply` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReplyAuthorType" AS ENUM ('AGENT', 'CUSTOMER');

-- DropForeignKey
ALTER TABLE "TicketReply" DROP CONSTRAINT "TicketReply_authorId_fkey";

-- AlterTable
ALTER TABLE "TicketReply" ADD COLUMN     "authorType" "ReplyAuthorType" NOT NULL DEFAULT 'AGENT',
ALTER COLUMN "authorId" DROP NOT NULL;

-- Remove default after backfill (column is now populated)
ALTER TABLE "TicketReply" ALTER COLUMN "authorType" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
