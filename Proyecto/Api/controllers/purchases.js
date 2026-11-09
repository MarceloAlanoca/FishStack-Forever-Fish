const { sequelize } = require("../config/db");
const User = require("../models/userModel");
const { Article } = require("../models/articlesModel");
const { SimulatedPurchase } = require("../models/simulatedPurchaseModel");
const { validateTestPayment } = require('../services/testPayment');

async function simulatePurchase(req, res) {
    const { requestId, articleId, expectedPrice, expectedCoins, payment } = req.body || {};
    if (typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
        !Number.isSafeInteger(articleId) || articleId < 1 ||
        !Number.isInteger(expectedPrice) || !Number.isInteger(expectedCoins)) {
        return res.status(400).json({ message: "Solicitud de compra inválida." });
    }
    // El permiso se obtiene de la cuenta autenticada, nunca del cuerpo de la solicitud.
    if (Object.keys(req.body).some(key => !["requestId", "articleId", "expectedPrice", "expectedCoins", "payment"].includes(key))) {
        return res.status(400).json({ message: "La solicitud de compra contiene campos no admitidos." });
    }
    const isAdmin = req.account.Rol?.toLowerCase() === 'administrador';
    const { errors, outcome } = validateTestPayment(payment, new Date(), { isAdmin });
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Revisa los datos de la tarjeta.', errors });
    try {
        const result = await sequelize.transaction(async transaction => {
            // Serializa las compras por cuenta y evita acreditar dos veces un reintento.
            const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user?.isActive || user.authVersion !== req.account.authVersion) {
                return { code: 401, message: "La cuenta no está disponible. Inicia sesión nuevamente." };
            }
            if (isAdmin && user.Rol?.toLowerCase() !== 'administrador') {
                return { code: 403, message: 'La cuenta ya no tiene permisos de administrador. Actualiza la página.' };
            }
            const previous = await SimulatedPurchase.findByPk(requestId, { transaction });
            if (previous) {
                if (previous.userId !== user.ID_Usuario || previous.articleId !== articleId ||
                    previous.price !== expectedPrice || previous.coins !== expectedCoins || previous.status !== outcome) {
                    return { code: 409, message: "La referencia ya se utilizó para otra compra." };
                }
                return { purchase: previous, balance: user.Doblones };
            }
            const article = await Article.findByPk(articleId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!article) return { code: 404, message: "El paquete ya no está disponible." };
            if (article.Precio !== expectedPrice || article.Doblones !== expectedCoins) {
                return { code: 409, message: "El paquete cambió. Vuelve a la tienda para revisar sus datos." };
            }
            if (article.Doblones <= 0 || !Number.isInteger(article.Precio) || article.Precio < 0) {
                return { code: 400, message: "Este paquete no está disponible para comprar." };
            }
            if (outcome === "approved" && user.Doblones + article.Doblones > 2147483647) {
                return { code: 409, message: "La compra supera el límite de doblones de la cuenta." };
            }
            const purchase = await SimulatedPurchase.create({ id: requestId, userId: user.ID_Usuario,
                articleId, price: article.Precio, coins: article.Doblones, status: outcome }, { transaction });
            if (outcome === "approved") await user.update({ Doblones: user.Doblones + article.Doblones }, { transaction });
            return { purchase, balance: user.Doblones };
        });
        if (result.code) return res.status(result.code).json({ message: result.message });
        res.json({ simulation: true, reference: result.purchase.id, status: result.purchase.status,
            coins: result.purchase.status === "approved" ? result.purchase.coins : 0, balance: result.balance,
            message: result.purchase.status === 'approved' ? 'Compra aprobada.' : 'El pago fue rechazado.' });
    } catch (error) {
        console.error("No se pudo completar la compra simulada", error.name);
        res.status(500).json({ message: "No se pudo completar la compra. Reintenta con la misma referencia." });
    }
}

module.exports = { simulatePurchase };
