const nodemailer = require("nodemailer");
const { validEmail } = require("../validations");

function credentials() {
    return {
        user: process.env.GMAIL_SENDER?.trim() || "",
        pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "") || ""
    };
}

function mailConfigured() {
    const { user, pass } = credentials();
    return validEmail(user) && pass.length === 16;
}

async function sendRecoveryMail(recipient, link) {
    if (!mailConfigured()) throw new Error("Correo de recuperacion sin configurar");
    const auth = credentials();
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000
    });

    const body = `Recibimos una solicitud para cambiar tu contraseña de FishStack: Forever Fish.\n\nAbre este enlace para elegir una nueva contraseña:\n${link}\n\nEl enlace vence en 15 minutos y solo se puede usar una vez.\nSi no solicitaste este cambio, ignora el mensaje. Tu contraseña no ha cambiado.`;
    await transporter.sendMail({
        from: { name: "FishStack", address: auth.user },
        to: recipient,
        subject: "Recuperar acceso a FishStack",
        text: body
    });
}

module.exports = { mailConfigured, sendRecoveryMail };
