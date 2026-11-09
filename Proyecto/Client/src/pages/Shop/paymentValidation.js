export const demoCards = Object.freeze({ approved: '4242424242424242', declined: '4000000000000002' })

export function formatCard(value) {
    return value.replace(/\D/g, '').slice(0, 16).match(/.{1,4}/g)?.join(' ') || ''
}

export function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function passesLuhn(number) {
    let sum = 0
    let double = false
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = Number(number[i])
        if (double) { digit *= 2; if (digit > 9) digit -= 9 }
        sum += digit
        double = !double
    }
    return sum % 10 === 0
}

// Son comprobaciones de datos ficticios, no una verificación con un banco.
export function validatePayment(form, now = new Date(), { isAdmin = false } = {}) {
    const errors = {}
    if (typeof form.holder !== 'string' || form.holder.trim().length < 2 || form.holder.trim().length > 80 ||
        !/^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$/u.test(form.holder.trim())) {
        errors.holder = 'Ingresa un titular de entre 2 y 80 caracteres, sin números.'
    }
    const card = typeof form.card === 'string' ? form.card.replace(/[ -]/g, '') : ''
    if (typeof form.card !== 'string' || !/^[\d -]+$/.test(form.card) || !/^\d{16}$/.test(card) || (!isAdmin && !passesLuhn(card))) {
        errors.card = 'Ingresa un número de tarjeta válido de 16 dígitos.'
    } else if (!isAdmin && !Object.values(demoCards).includes(card)) {
        errors.card = 'Esta tarjeta no pudo ser aceptada.'
    }
    const expiry = typeof form.expiry === 'string' && /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(form.expiry)
    const parts = new Intl.DateTimeFormat('en', {
        year: 'numeric', month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires'
    }).formatToParts(now)
    const currentYear = Number(parts.find(part => part.type === 'year').value)
    const currentMonth = Number(parts.find(part => part.type === 'month').value)
    if (!expiry) errors.expiry = 'Ingresa un vencimiento con formato MM/AA.'
    else if ((2000 + Number(expiry[2])) * 12 + Number(expiry[1]) < currentYear * 12 + currentMonth) {
        errors.expiry = 'La tarjeta está vencida.'
    }
    if (typeof form.cvc !== 'string' || !/^\d{3}$/.test(form.cvc)) {
        errors.cvc = 'El CVV debe tener 3 dígitos.'
    } else if (!isAdmin && form.cvc !== '123') {
        errors.cvc = 'El CVV no coincide con el requerido para esta tarjeta.'
    }
    return errors
}
