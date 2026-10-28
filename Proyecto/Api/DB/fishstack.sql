-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-08-2026 a las 00:02:55
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `fishstack`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `articulos`
--

CREATE TABLE `articulos` (
  `ID_Pass` int(11) NOT NULL,
  `Nombre` varchar(255) DEFAULT NULL,
  `Descripcion` text DEFAULT NULL,
  `Precio` int(11) DEFAULT NULL,
  `Doblones` int(11) NOT NULL DEFAULT 0,
  `Tipo` varchar(40) NOT NULL DEFAULT 'Doblones'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compra`
--

CREATE TABLE `compra` (
  `ID_Usuario` int(11) DEFAULT NULL,
  `ID_Pass` int(11) DEFAULT NULL,
  `ID_Compra` int(11) NOT NULL,
  `Fecha` date DEFAULT NULL,
  `Cantidad` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `creditos_integrantes`
--

CREATE TABLE `creditos_integrantes` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `orden` int NOT NULL DEFAULT 0,
  `nombre` varchar(100) NOT NULL,
  `rol` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `detalle` text NOT NULL,
  `aporte` text NOT NULL,
  `imagen` varchar(2048) NOT NULL,
  `video` varchar(2048) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `creditos_inspiraciones`
--

CREATE TABLE `creditos_inspiraciones` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `orden` int NOT NULL DEFAULT 0,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `clase` varchar(100) NOT NULL,
  `portada` varchar(2048) NOT NULL,
  `video` varchar(2048) NOT NULL,
  `segundoInicio` int NOT NULL DEFAULT 0,
  `link` varchar(2048) NOT NULL,
  `inspiracion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `ID_Usuario` int(11) NOT NULL,
  `Nombre` varchar(255) DEFAULT NULL,
  `Apellido` varchar(255) DEFAULT NULL,
  `Correo` varchar(255) DEFAULT NULL,
  `Usuario` varchar(255) DEFAULT NULL,
  `Contraseña` varchar(255) DEFAULT NULL,
  `Rol` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`ID_Usuario`, `Nombre`, `Apellido`, `Correo`, `Usuario`, `Contraseña`, `Rol`) VALUES
(1, 'Thiago', 'Loaiza', NULL, 'Test', '$2b$12$Trg6pfE0CjuG/my36FERi.Ot9U5B5XYWX3LggGbmjf3to00hpbxsq', 'Usuario'),
(2, 'Thiago', 'e', NULL, 'Yo', '$2b$12$R5GxUwwSgsmB6jFei7xDnOlTzr7OOWJNzSkeZYJ1KtuktcvlB3SzW', 'Usuario');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `articulos`
--
ALTER TABLE `articulos`
  ADD PRIMARY KEY (`ID_Pass`);

--
-- Indices de la tabla `compra`
--
ALTER TABLE `compra`
  ADD PRIMARY KEY (`ID_Compra`),
  ADD KEY `ID_Usuario` (`ID_Usuario`),
  ADD KEY `ID_Pass` (`ID_Pass`);


--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`ID_Usuario`),
  ADD UNIQUE KEY `uq_usuarios_correo` (`Correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `articulos`
--
ALTER TABLE `articulos`
  MODIFY `ID_Pass` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compra`
--
ALTER TABLE `compra`
  MODIFY `ID_Compra` int(11) NOT NULL AUTO_INCREMENT;


--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `ID_Usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `compra`
--
ALTER TABLE `compra`
  ADD CONSTRAINT `compra_ibfk_1` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuarios` (`ID_Usuario`),
  ADD CONSTRAINT `compra_ibfk_2` FOREIGN KEY (`ID_Pass`) REFERENCES `articulos` (`ID_Pass`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
