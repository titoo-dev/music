-- AlterTable
ALTER TABLE "stored_track" ADD COLUMN     "requestedBitrate" INTEGER;

-- CreateTable
CREATE TABLE "persist_lease" (
    "trackId" TEXT NOT NULL,
    "bitrate" INTEGER NOT NULL,
    "holder" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persist_lease_pkey" PRIMARY KEY ("trackId","bitrate")
);

-- CreateIndex
CREATE INDEX "persist_lease_expiresAt_idx" ON "persist_lease"("expiresAt");

-- CreateIndex
CREATE INDEX "stored_track_storagePath_idx" ON "stored_track"("storagePath");
