-- CreateTable
CREATE TABLE "PartnershipPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnershipPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PartnershipPeriodToSchool" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartnershipPeriodToSchool_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnershipPeriod_name_key" ON "PartnershipPeriod"("name");

-- CreateIndex
CREATE INDEX "_PartnershipPeriodToSchool_B_index" ON "_PartnershipPeriodToSchool"("B");

-- AddForeignKey
ALTER TABLE "_PartnershipPeriodToSchool" ADD CONSTRAINT "_PartnershipPeriodToSchool_A_fkey" FOREIGN KEY ("A") REFERENCES "PartnershipPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnershipPeriodToSchool" ADD CONSTRAINT "_PartnershipPeriodToSchool_B_fkey" FOREIGN KEY ("B") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
