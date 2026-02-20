-- CreateTable
CREATE TABLE "Lender" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "preferredIndustry" TEXT NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepPerformance" (
    "id" TEXT NOT NULL,
    "repName" TEXT NOT NULL,
    "assigned" INTEGER NOT NULL,
    "funded" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepPerformance_pkey" PRIMARY KEY ("id")
);
