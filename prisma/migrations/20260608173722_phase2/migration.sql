-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "phase2Deadline" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isPhase2Locked" BOOLEAN NOT NULL DEFAULT false,
    "phase2SubmittedAt" DATETIME,
    "groupPredictions" TEXT NOT NULL DEFAULT '{}',
    "thirdPlacePicks" TEXT NOT NULL DEFAULT '[]',
    "knockoutPicks" TEXT NOT NULL DEFAULT '{}',
    "topScorerTeam" TEXT,
    "mvpTeam" TEXT,
    "groupPoints" INTEGER NOT NULL DEFAULT 0,
    "thirdPlacePoints" INTEGER NOT NULL DEFAULT 0,
    "knockoutPoints" INTEGER NOT NULL DEFAULT 0,
    "specialPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Prediction" ("groupPoints", "groupPredictions", "id", "isLocked", "knockoutPicks", "knockoutPoints", "mvpTeam", "specialPoints", "submittedAt", "thirdPlacePicks", "thirdPlacePoints", "topScorerTeam", "totalPoints", "userId") SELECT "groupPoints", "groupPredictions", "id", "isLocked", "knockoutPicks", "knockoutPoints", "mvpTeam", "specialPoints", "submittedAt", "thirdPlacePicks", "thirdPlacePoints", "topScorerTeam", "totalPoints", "userId" FROM "Prediction";
DROP TABLE "Prediction";
ALTER TABLE "new_Prediction" RENAME TO "Prediction";
CREATE UNIQUE INDEX "Prediction_userId_key" ON "Prediction"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
