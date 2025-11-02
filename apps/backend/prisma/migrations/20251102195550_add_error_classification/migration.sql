-- CreateTable
CREATE TABLE "submission_errors" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "compileOutput" TEXT,
    "stderr" TEXT,
    "signatureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_signatures" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "label" TEXT,
    "confidence" DOUBLE PRECISION,
    "sample" TEXT,
    "embedding" JSONB,
    "clusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "error_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_clusters" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "centroid" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "error_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submission_errors_submissionId_key" ON "submission_errors"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "error_signatures_hash_key" ON "error_signatures"("hash");

-- CreateIndex
CREATE INDEX "error_signatures_hash_idx" ON "error_signatures"("hash");

-- AddForeignKey
ALTER TABLE "submission_errors" ADD CONSTRAINT "submission_errors_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_errors" ADD CONSTRAINT "submission_errors_signatureId_fkey" FOREIGN KEY ("signatureId") REFERENCES "error_signatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_signatures" ADD CONSTRAINT "error_signatures_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "error_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
