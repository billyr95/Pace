-- AlterTable
ALTER TABLE "PlaidItem" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "syncCursor" TEXT;

