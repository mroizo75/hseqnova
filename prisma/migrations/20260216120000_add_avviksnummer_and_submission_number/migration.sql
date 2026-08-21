-- CreateTable
CREATE TABLE `TenantSequence` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `sequenceType` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `lastNumber` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TenantSequence_tenantId_sequenceType_year_key`(`tenantId`, `sequenceType`, `year`),
    INDEX `TenantSequence_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Incident` ADD COLUMN `avviksnummer` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `FormSubmission` ADD COLUMN `submissionNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `FormTemplate` ADD COLUMN `numberPrefix` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Incident_avviksnummer_idx` ON `Incident`(`avviksnummer`);

-- CreateIndex
CREATE INDEX `FormSubmission_submissionNumber_idx` ON `FormSubmission`(`submissionNumber`);

-- AddForeignKey
ALTER TABLE `TenantSequence` ADD CONSTRAINT `TenantSequence_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
