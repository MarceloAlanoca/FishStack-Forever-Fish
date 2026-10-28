require("./config/env");
const express = require("express");
const cors = require("cors");
const path = require("node:path");

const { sequelize } = require("./config/db");

const { sayHello } = require("./controllers/sayHello");
const { getUpdates, getUpdatesByID } = require("./controllers/UpdateController");
const { seedUpdates } = require("./scripts/seedUpdates");
const { seedArticles } = require("./scripts/seedArticles");
const { getArticles } = require("./controllers/articles");
const { getCredits } = require("./controllers/credits");
const { seedCredits } = require("./scripts/seedCredits");
const { seedAdmin } = require("./scripts/seedAdmin");
const { getUsers, getUserById, me, updateProfilePhoto, deleteProfilePhoto, registerUser, login } = require("./controllers/user");
const { uploadProfilePhoto } = require("./middlewares/profilePhoto");
const { isAuth, isAdmin } = require("./middlewares/auth");
const { updateUsername, updatePassword, updateSurname, deactivateAccount } = require("./controllers/profileAccount");
const { requestPasswordReset, resetPassword } = require("./controllers/passwordRecovery");
const { recoveryLimit } = require("./middlewares/recoveryLimit");

const server = express();


server.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
}));

server.use(express.json({ limit: "1mb" }));
// permite acceder por url a las imagenes guardadas dentro de public.
server.use(express.static(path.join(__dirname, "public")));


server.get('/', sayHello);
server.get('/updates', getUpdates);
server.get('/articles', getArticles);
server.get('/credits', getCredits);
server.get('/updates/:id', getUpdatesByID);
server.get('/users/:id', isAuth, isAdmin, getUserById);
server.get('/users', isAuth, isAdmin, getUsers);
server.get('/me', isAuth, me);
server.use("/admin/users", require("./routes/adminUsers"));
server.use("/admin/articles", require("./routes/adminArticles"));
server.use("/admin/updates", require("./routes/adminUpdates"));
server.use("/admin/credits", require("./routes/adminCredits"));
server.get('/admin', isAuth, isAdmin, (req, res) => {
    res.json({ usuario: { ID_Usuario: req.account.ID_Usuario, Usuario: req.account.Usuario, Rol: req.account.Rol, Doblones: req.account.Doblones, Foto_Perfil: req.account.Foto_Perfil } });
});
// primero verifica la sesion, despues recibe el archivo y finalmente guarda su ruta.
server.patch('/me/photo', isAuth, uploadProfilePhoto, updateProfilePhoto);
server.delete('/me/photo', isAuth, deleteProfilePhoto);
server.patch('/me/username', isAuth, updateUsername);
server.patch('/me/surname', isAuth, updateSurname);
server.patch('/me/password', isAuth, updatePassword);
server.delete('/me', isAuth, deactivateAccount);
server.post('/users', registerUser);
server.post('/login', login);
server.post('/forgot-password', recoveryLimit, requestPasswordReset);
server.post('/reset-password', recoveryLimit, resetPassword);


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
                // espera tres segundos antes de reintentar, porque la base puede seguir iniciandose.
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }

        // Borra y recrea las tablas en cada arranque, incluidos los usuarios.
        await sequelize.sync({ force: true });
        await seedAdmin();
        await seedUpdates();
        await seedArticles();
        await seedCredits();

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
