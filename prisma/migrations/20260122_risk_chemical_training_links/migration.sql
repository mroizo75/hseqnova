-- Migration: Link Risk to Chemicals and Training Requirements
-- Purpose: Enable ISO 45001/14001 compliant risk assessment for hazardous substances

-- Create RiskChemicalLink table
CREATE TABLE `RiskChemicalLink` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `riskId` VARCHAR(191) NOT NULL,
    `chemicalId` VARCHAR(191) NOT NULL,
    `exposure` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `ppRequired` BOOLEAN NOT NULL DEFAULT false,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RiskChemicalLink_riskId_chemicalId_key`(`riskId`, `chemicalId`),
    INDEX `RiskChemicalLink_tenantId_idx`(`tenantId`),
    INDEX `RiskChemicalLink_chemicalId_idx`(`chemicalId`),
    INDEX `RiskChemicalLink_exposure_idx`(`exposure`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create RiskTrainingRequirement table
CREATE TABLE `RiskTrainingRequirement` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `riskId` VARCHAR(191) NOT NULL,
    `courseKey` VARCHAR(191) NOT NULL,
    `isMandatory` BOOLEAN NOT NULL DEFAULT true,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RiskTrainingRequirement_riskId_courseKey_key`(`riskId`, `courseKey`),
    INDEX `RiskTrainingRequirement_tenantId_idx`(`tenantId`),
    INDEX `RiskTrainingRequirement_courseKey_idx`(`courseKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add Foreign Keys
ALTER TABLE `RiskChemicalLink` ADD CONSTRAINT `RiskChemicalLink_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RiskChemicalLink` ADD CONSTRAINT `RiskChemicalLink_riskId_fkey` FOREIGN KEY (`riskId`) REFERENCES `Risk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RiskChemicalLink` ADD CONSTRAINT `RiskChemicalLink_chemicalId_fkey` FOREIGN KEY (`chemicalId`) REFERENCES `Chemical`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RiskTrainingRequirement` ADD CONSTRAINT `RiskTrainingRequirement_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RiskTrainingRequirement` ADD CONSTRAINT `RiskTrainingRequirement_riskId_fkey` FOREIGN KEY (`riskId`) REFERENCES `Risk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
