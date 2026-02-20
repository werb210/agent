-- CreateTable
CREATE TABLE "ConversationLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "transcript" TEXT NOT NULL,
    "extractedRevenue" DOUBLE PRECISION,
    "extractedAmount" DOUBLE PRECISION,
    "extractedIndustry" TEXT,
    "urgencyLevel" TEXT,
    "bookingIntent" BOOLEAN NOT NULL,
    "escalated" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationLog_pkey" PRIMARY KEY ("id")
);
