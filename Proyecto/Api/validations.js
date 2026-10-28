const { Validator } = require("sequelize");

function validText(value, max = 255) {
    return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function validEmail(value) {
    return validText(value) && Validator.isEmail(value.trim());
}

function validPassword(value, min = 8) {
    // bcrypt admite un maximo de 72 bytes por contraseña.
    return typeof value === "string" && value.length >= min && Buffer.byteLength(value, "utf8") <= 72;
}

function validAmount(value) {
    return Number.isInteger(value) && value >= 0 && value <= 2147483647;
}

function validToken(value) {
    return typeof value === "string" && value.length === 64 &&
        Validator.isHexadecimal(value) && value === value.toLowerCase();
}

module.exports = { validText, validEmail, validPassword, validAmount, validToken };
