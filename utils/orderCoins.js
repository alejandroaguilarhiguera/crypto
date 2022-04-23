module.exports = (a,b) => (
    Number(a.priceChangePercent) > Number(b.priceChangePercent)) ? 1
    : ((Number(b.priceChangePercent) > Number(a.priceChangePercent)) ? -1
    : 0
)

