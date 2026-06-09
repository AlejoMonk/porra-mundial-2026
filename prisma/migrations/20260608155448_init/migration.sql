-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
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

-- CreateTable
CREATE TABLE "TournamentResult" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "groupResults" TEXT NOT NULL DEFAULT '{}',
    "matchResults" TEXT NOT NULL DEFAULT '{}',
    "thirdPlaceQualifiers" TEXT NOT NULL DEFAULT '[]',
    "topScorer" TEXT,
    "mvp" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "predictionDeadline" DATETIME,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_key" ON "Prediction"("userId");
