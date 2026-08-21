-- CreateTable
CREATE TABLE `LegalReference` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `paragraphRef` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `industries` JSON NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LegalReference_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
