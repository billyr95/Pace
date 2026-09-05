-- CreateTable
CREATE TABLE "IncomeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "variable" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncomeProfile_userId_key" ON "IncomeProfile"("userId");

-- AddForeignKey
ALTER TABLE "IncomeProfile" ADD CONSTRAINT "IncomeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

