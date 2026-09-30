-- AlterTable
ALTER TABLE "LifeCoachRequest" ADD COLUMN "assignedSalesManagerId" TEXT,
ADD COLUMN "salesManagerNote" TEXT,
ADD COLUMN "lastUpdatedByRole" TEXT,
ADD COLUMN "lastUpdatedByName" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "LifeCoachRequest_assignedSalesManagerId_idx" ON "LifeCoachRequest"("assignedSalesManagerId");

-- CreateIndex
CREATE INDEX "LifeCoachRequest_status_idx" ON "LifeCoachRequest"("status");

-- AddForeignKey
ALTER TABLE "LifeCoachRequest" ADD CONSTRAINT "LifeCoachRequest_assignedSalesManagerId_fkey" FOREIGN KEY ("assignedSalesManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
