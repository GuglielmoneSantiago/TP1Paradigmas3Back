class ComparisonActor {
    compare(prices) {
        // Filtrar precios válidos (que tengan originalPrice definido y no sean null o NaN)
        const validPrices = prices.filter(price => price.originalPrice !== null);

        if (validPrices.length === 0) {
            return {
                lowestPrice: null,
                allPrices: prices,
                message: 'No hay precios válidos para comparar'
            };
        }

        const lowestPrice = validPrices.reduce((lowest, price) => {
            return price.originalPrice < lowest.originalPrice ? price : lowest;
        }, validPrices[0]);

        return {
            lowestPrice,
            allPrices: prices
        };
    }
}

module.exports = ComparisonActor;
