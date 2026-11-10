class AccountError extends Error {
    constructor(status, code, message, details = {}) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

function sendAccountError(res, error) {
    if (error instanceof AccountError) return res.status(error.status).json({ code: error.code, message: error.message, ...error.details });
    console.error('Error de cuenta del juego:', error.name);
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'No se pudo completar la operación. Reintenta con la misma referencia.' });
}

const validRequestId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
module.exports = { AccountError, sendAccountError, validRequestId };
