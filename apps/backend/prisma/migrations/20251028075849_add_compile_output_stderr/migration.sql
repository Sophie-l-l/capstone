-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "compileOutput" TEXT,
ADD COLUMN     "judgeStatusId" INTEGER,
ADD COLUMN     "stderr" TEXT;
