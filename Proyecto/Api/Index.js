const express = require("express");
const cors = require("cors");

const { sequelize } = require("./config/db");

const authRoutes = require("./routes/user");

const server = express();


server.use(cors());

server.use(express.json());


server.use("/api/auth", authRoutes);


sequelize.authenticate()
    .then(() => {
        console.log("Base de datos conectada");
    })
    .catch((error) => {
        console.log("Error al conectar con la base de datos");
        console.log(error);
    });


server.listen(3000, () => {
    console.log("Servidor funcionando en puerto 3000");
});