-- La columna comienza aceptando NULL porque la tabla ya contiene usuarios.
-- Las cuentas nuevas siempre deben enviar un correo desde el backend.
ALTER TABLE `usuarios`
    ADD COLUMN `Correo` VARCHAR(255) NULL AFTER `Apellido`,
    ADD UNIQUE KEY `uq_usuarios_correo` (`Correo`);

-- Opcional: después de asignar un correo a todos los usuarios antiguos,
-- puedes hacer que la columna sea obligatoria también en la base de datos.
-- ALTER TABLE `usuarios`
--     MODIFY COLUMN `Correo` VARCHAR(255) NOT NULL;
