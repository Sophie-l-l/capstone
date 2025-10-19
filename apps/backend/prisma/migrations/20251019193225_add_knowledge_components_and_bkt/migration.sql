/*
  Warnings:

  - You are about to drop the `knowledge_components` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."knowledge_components";

-- CreateTable
CREATE TABLE "KnowledgeComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BKTState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kcId" TEXT NOT NULL,
    "pKnown" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "corrects" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BKTState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeComponent_name_key" ON "KnowledgeComponent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BKTState_userId_kcId_key" ON "BKTState"("userId", "kcId");

-- AddForeignKey
ALTER TABLE "BKTState" ADD CONSTRAINT "BKTState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BKTState" ADD CONSTRAINT "BKTState_kcId_fkey" FOREIGN KEY ("kcId") REFERENCES "KnowledgeComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
