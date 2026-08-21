-- AlterTable
ALTER TABLE `GeneratedDocument` ADD COLUMN `isFreeTrialPackage` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `GeneratedDocument_isFreeTrialPackage_idx` ON `GeneratedDocument`(`isFreeTrialPackage`);
