function createMissionLimit({ delay = 3000, now = Date.now } = {}) {
    const attempts = new Map();
    return (req, res, next) => {
        const time = now();
        for (const [id, expires] of attempts) if (expires <= time) attempts.delete(id);
        const expires = attempts.get(req.user.id);
        if (expires > time) {
            res.set("Retry-After", String(Math.ceil((expires - time) / 1000)));
            return res.status(429).json({ message: "Espera unos segundos antes de volver a responder." });
        }
        attempts.set(req.user.id, time + delay);
        next();
    };
}

module.exports = { createMissionLimit };
