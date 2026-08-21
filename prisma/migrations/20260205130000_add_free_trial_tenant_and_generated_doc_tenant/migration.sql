-- AlterTable Tenant: add registrationType (gratis 14-dagers løype vs vanlig)
ALTER TABLE `Tenant` ADD COLUMN `registrationType` ENUM('STANDARD', 'FREE_14_DAY') NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE INDEX `Tenant_registrationType_idx` ON `Tenant`(`registrationType`);

-- AlterTable GeneratedDocument: add tenantId (for import av vannmerkede dokumenter til tenant)
ALTER TABLE `GeneratedDocument` ADD COLUMN `tenantId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `GeneratedDocument_tenantId_idx` ON `GeneratedDocument`(`tenantId`);
