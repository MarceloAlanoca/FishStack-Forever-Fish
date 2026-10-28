const attempts = new Map();
const windowMs = 15 * 60 * 1000;

function recoveryLimit(req, res, next) {
    const now = Date.now();
    for (const [key, value] of attempts) {
        if (value.until <= now) attempts.delete(key);
    }
    const key = req.ip;
    const entry = attempts.get(key) || { count: 0, until: now + windowMs };
    if (entry.count >= 10 || (!attempts.has(key) && attempts.size >= 5000)) {
        res.set("Retry-After", String(Math.max(1, Math.ceil((entry.until - now) / 1000))));
        return res.status(429).json({ message: "Demasiados intentos. Espera unos minutos antes de continuar." });
    }
    entry.count++;
    attempts.set(key, entry);
    next();
}

module.exports = { recoveryLimit };
