-- One share link per user and track. Duplicates could only come from two
-- concurrent creates; keep the live one, newest first.
DELETE FROM "shared_track" s
USING (
    SELECT "id",
        ROW_NUMBER() OVER (
            PARTITION BY "userId", "trackId"
            ORDER BY ("expiresAt" IS NULL OR "expiresAt" > NOW()) DESC, "createdAt" DESC
        ) AS rn
    FROM "shared_track"
) d
WHERE s."id" = d."id" AND d.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "shared_track_userId_trackId_key" ON "shared_track"("userId", "trackId");
