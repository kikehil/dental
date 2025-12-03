-- CreateTable
CREATE TABLE `configuracion_cortes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `horaCorte1` VARCHAR(191) NOT NULL DEFAULT '14:00',
    `horaCorte2` VARCHAR(191) NOT NULL DEFAULT '18:00',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

