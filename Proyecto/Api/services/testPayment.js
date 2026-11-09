const TEST_CARDS = Object.freeze({
    '4242424242424242': 'approved',
    '4000000000000002': 'declined'
});

function passesLuhn(number) {
    let sum = 0;
    let double = false;
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = Number(number[i]);
        if (double) { digit *= 2; if (digit > 9) digit -= 9; }
        sum += digit;
        double = !double;
    }
    return sum % 10 === 0;
}

function validateTestPayment(payment, now = new Date(), { isAdmin = false } = {}) {
    const errors = {};
    if (!payment || typeof payment !== 'object' || Array.isArray(payment) ||
        Object.keys(payment).some(key => !['holder', 'card', 'expiry', 'cvc'].includes(key))) {
        return { errors: { payment: 'Los datos de la tarjeta contienen campos no admitidos.' } };
    }
    if (typeof payment.holder !== 'string' || payment.holder.trim().length < 2 || payment.holder.trim().length > 80 ||
        !/^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$/u.test(payment.holder.trim())) {
        errors.holder = 'Ingresa un titular de entre 2 y 80 caracteres, sin números.';
    }
    const card = typeof payment.card === 'string' ? payment.card.replace(/[ -]/g, '') : '';
    if (typeof payment.card !== 'string' || !/^[\d -]+$/.test(payment.card) || !/^\d{16}$/.test(card) || (!isAdmin && !passesLuhn(card))) {
        errors.card = 'Ingresa un número de tarjeta válido de 16 dígitos.';
    } else if (!isAdmin && !Object.hasOwn(TEST_CARDS, card)) {
        errors.card = 'Esta tarjeta no pudo ser aceptada.';
    }
    const expiry = typeof payment.expiry === 'string' && /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(payment.expiry);
    const parts = new Intl.DateTimeFormat('en', {
        year: 'numeric', month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires'
    }).formatToParts(now);
    const currentYear = Number(parts.find(part => part.type === 'year').value);
    const currentMonth = Number(parts.find(part => part.type === 'month').value);
    if (!expiry) errors.expiry = 'Ingresa un vencimiento con formato MM/AA.';
    else if ((2000 + Number(expiry[2])) * 12 + Number(expiry[1]) < currentYear * 12 + currentMonth) {
        errors.expiry = 'La tarjeta está vencida.';
    }
    if (typeof payment.cvc !== 'string' || !/^\d{3}$/.test(payment.cvc)) {
        errors.cvc = 'El CVV debe tener 3 dígitos.';
    } else if (!isAdmin && payment.cvc !== '123') {
        errors.cvc = 'El CVV no coincide con el requerido para esta tarjeta.';
    }
    // Conserva el escenario de rechazo para el ejemplo del administrador.
    return { errors, outcome: Object.keys(errors).length ? undefined : TEST_CARDS[card] || (isAdmin ? 'approved' : undefined) };
}

module.exports = { validateTestPayment };
