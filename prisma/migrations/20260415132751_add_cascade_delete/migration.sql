-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TEXT,
    "finishTime" TEXT,
    "checkIn" TEXT,
    "checkOut" TEXT,
    "comment" TEXT NOT NULL DEFAULT '',
    "location" TEXT,
    "approvalStatus" TEXT,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("approvalStatus", "checkIn", "checkOut", "comment", "date", "finishTime", "id", "location", "startTime", "status", "userId") SELECT "approvalStatus", "checkIn", "checkOut", "comment", "date", "finishTime", "id", "location", "startTime", "status", "userId" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
