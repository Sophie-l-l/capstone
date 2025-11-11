-- AlterTable
ALTER TABLE "error_signatures" ADD COLUMN     "bloomLevel" TEXT,
ADD COLUMN     "cognitiveCause" TEXT,
ADD COLUMN     "compilerExcerpt" TEXT,
ADD COLUMN     "reasoning" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "specificError" TEXT,
ADD COLUMN     "surfaceError" TEXT;

-- CreateIndex
CREATE INDEX "error_signatures_surfaceError_idx" ON "error_signatures"("surfaceError");

-- CreateIndex
CREATE INDEX "error_signatures_cognitiveCause_idx" ON "error_signatures"("cognitiveCause");

-- CreateIndex
CREATE INDEX "error_signatures_bloomLevel_idx" ON "error_signatures"("bloomLevel");
