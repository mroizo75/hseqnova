-- AlterTable
ALTER TABLE `FormTemplate` ADD COLUMN `allowAnonymousResponses` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable (nullable for anonyme psykososiale svar)
ALTER TABLE `FormSubmission` MODIFY `submittedById` VARCHAR(191) NULL;
