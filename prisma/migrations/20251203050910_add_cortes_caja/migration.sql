-- CreateTable
CREATE TABLE `cortes_caja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hora` VARCHAR(191) NOT NULL,
    `saldoInicial` DECIMAL(10, 2) NOT NULL,
    `ventasEfectivo` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `ventasTarjeta` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `ventasTransferencia` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalVentas` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `saldoFinal` DECIMAL(10, 2) NOT NULL,
    `diferencia` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `observaciones` TEXT NULL,
    `usuarioId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cortes_caja` ADD CONSTRAINT `cortes_caja_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
