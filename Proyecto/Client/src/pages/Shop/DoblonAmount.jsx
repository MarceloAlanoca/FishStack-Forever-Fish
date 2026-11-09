export default function DoblonAmount({ amount, large = false }) {
    const number = new Intl.NumberFormat('es-AR').format(amount ?? 0)
    return <span className={`shop-doblons${large ? ' shop-doblons--large' : ''}`} role="img" aria-label={`${number} doblones`}>
        <img className="shop-coin" src="/images/Icons/DoblonIcon.png" alt="" aria-hidden="true" />
        <strong className="shop-doblon-number" aria-hidden="true">{number}</strong>
    </span>
}
