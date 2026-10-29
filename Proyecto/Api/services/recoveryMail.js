function mailConfigured() {
    return ["GMAIL_SENDER", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"]
        .every((key) => Boolean(process.env[key]?.trim()));
}

async function sendRecoveryMail(recipient, link) {
    if (!mailConfigured()) throw new Error("Correo de recuperacion sin configurar");
    const authResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
            grant_type: "refresh_token"
        }),
        signal: AbortSignal.timeout(10000)
    });
    const auth = await authResponse.json();
    if (!authResponse.ok || !auth.access_token) throw new Error("No se pudo autorizar Gmail");

    // MIME en base64url, formato requerido por messages.send de Gmail API.
    const body = `Recibimos una solicitud para cambiar tu contraseña de FishStack: Forever Fish.\n\nAbre este enlace para elegir una nueva contraseña:\n${link}\n\nEl enlace vence en 15 minutos y solo se puede usar una vez.\nSi no solicitaste este cambio, ignora el mensaje. Tu contraseña no ha cambiado.`;
    const message = [
        `From: FishStack <${process.env.GMAIL_SENDER.trim()}>`,
        `To: ${recipient}`,
        "Subject: Recuperar acceso a FishStack",
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(body).toString("base64")
    ].join("\r\n");
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: Buffer.from(message).toString("base64url") }),
        signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error("Gmail no pudo enviar el mensaje");
}

module.exports = { mailConfigured, sendRecoveryMail };
