-- AlterTable
ALTER TABLE `UserTenant` ADD COLUMN `invitationSentAt` DATETIME(3) NULL;

-- Backfill: eksisterende medlemmer regnes som allerede invitert
UPDATE `UserTenant` SET `invitationSentAt` = `createdAt` WHERE `invitationSentAt` IS NULL;
