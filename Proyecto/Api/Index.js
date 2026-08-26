const express = require("express");
const cors = require("cors");

const { sequelize } = require("./config/db");

const authRoutes = require("./routes/user");

const server = express();


server.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
}));

server.use(express.json());


server.use("/api/auth", authRoutes);


const iniciarServidor = async () => {
    try {
        const intentosMaximos = 20;

        for (let intento = 1; intento <= intentosMaximos; intento += 1) {
            try {
                await sequelize.authenticate();
                break;
            } catch (error) {
                if (intento === intentosMaximos) throw error;

                console.log(`Esperando la base de datos (${intento}/${intentosMaximos})...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }

        await sequelize.sync();

        const puerto = Number(process.env.PORT) || 3000;

        server.listen(puerto, "0.0.0.0", () => {
            console.log(`Servidor funcionando en puerto ${puerto}`);
        });
    } catch (error) {
        console.log("Error al conectar con la base de datos");
        console.log(error);
        process.exit(1);
    }
};

iniciarServidor();
