-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "courtName" TEXT,
    "caseworkerName" TEXT,
    "caseworkerPhone" TEXT,
    "judgeName" TEXT,
    "attorneyName" TEXT,
    "attorneyPhone" TEXT,
    "removalDate" TIMESTAMP(3),
    "targetReunificationDate" TIMESTAMP(3),
    "caseStatus" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseRequirement" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounselingSession" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "counselorName" TEXT,
    "sessionType" TEXT,
    "duration" INTEGER,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounselingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugTest" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "testType" TEXT,
    "isRandom" BOOLEAN NOT NULL DEFAULT false,
    "result" TEXT,
    "testingFacility" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NAStep" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "sponsorVerified" BOOLEAN NOT NULL DEFAULT false,
    "sponsorName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NAStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NAMeeting" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "meetingName" TEXT,
    "location" TEXT,
    "speaker" TEXT,
    "topic" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NAMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisedVisit" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "supervisorName" TEXT,
    "duration" INTEGER,
    "childBehavior" TEXT,
    "parentBehavior" TEXT,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "visitType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupervisedVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtDate" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hearingType" TEXT,
    "outcome" TEXT,
    "judgeNotes" TEXT,
    "nextSteps" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentingClass" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "className" TEXT,
    "provider" TEXT,
    "topic" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "hasCertificate" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentingClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckIn" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mood" TEXT,
    "drugTestRequired" BOOLEAN NOT NULL DEFAULT false,
    "drugTestCompleted" BOOLEAN NOT NULL DEFAULT false,
    "meetingsAttended" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");

-- AddForeignKey
ALTER TABLE "CaseRequirement" ADD CONSTRAINT "CaseRequirement_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounselingSession" ADD CONSTRAINT "CounselingSession_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugTest" ADD CONSTRAINT "DrugTest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NAStep" ADD CONSTRAINT "NAStep_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NAMeeting" ADD CONSTRAINT "NAMeeting_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisedVisit" ADD CONSTRAINT "SupervisedVisit_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtDate" ADD CONSTRAINT "CourtDate_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentingClass" ADD CONSTRAINT "ParentingClass_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
