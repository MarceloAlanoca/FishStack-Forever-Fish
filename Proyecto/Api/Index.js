const express = require("express");
const cors = require("cors");
const path = require("node:path");

const { sequelize } = require("./config/db");

const { sayHello } = require("./controllers/sayHello");
const { getUsers, getUserById, me, updateProfilePhoto, deleteProfilePhoto, registerUser, login } = require("./controllers/user");
const { uploadProfilePhoto } = require("./middlewares/profilePhoto");
const { migrateProfilePhotos } = require("./models/migrateProfilePhotos");
const { isAuth } = require("./middlewares/auth");
const { updateUsername, updatePassword, updateSurname } = require("./controllers/profileAccount");

const server = express();


server.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
}));

server.use(express.json({ limit: "1mb" }));
server.use(express.static(path.join(__dirname, "public")));


server.get('/', sayHello);
server.get('/users/:id', isAuth, getUserById);
server.get('/users', isAuth, getUsers);
server.get('/me', isAuth, me);
server.patch('/me/photo', isAuth, uploadProfilePhoto, updateProfilePhoto);
server.delete('/me/photo', isAuth, deleteProfilePhoto);
server.patch('/me/username', isAuth, updateUsername);
server.patch('/me/surname', isAuth, updateSurname);
server.patch('/me/password', isAuth, updatePassword);
server.post('/users', registerUser);
server.post('/login', login);


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
        // Agregar solo el nuevo campo sin modificar las cuentas existentes.
        const columns = await sequelize.getQueryInterface().describeTable("usuarios");
        if (!columns.Foto_Perfil) {
            await sequelize.getQueryInterface().addColumn("usuarios", "Foto_Perfil", {
                type: require("sequelize").DataTypes.STRING(255),
                allowNull: true
            });
        }
        await migrateProfilePhotos();

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
