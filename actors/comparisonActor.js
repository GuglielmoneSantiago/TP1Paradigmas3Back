class ComparisonActor {
    compare(model, prices) {
        // Filtrar precios válidos (que tengan originalPrice definido y no sean null o NaN)
        const validPrices = prices.filter(price => price.originalPrice !== null);

        if (validPrices.length === 0) {
            return {
                message: `No hay precios válidos para comparar para el modelo ${model}`
            };
        }

        // Encontrar el precio más bajo
        const lowestPrice = validPrices.reduce((lowest, price) => {
            return price.originalPrice < lowest.originalPrice ? price : lowest;
        }, validPrices[0]);

        // Formatear el precio de manera personalizada
        const formattedPrice = this.formatPrice(lowestPrice.originalPrice);

        // Devolver el modelo, la tienda y el precio más bajo
        return {
            message: `El modelo ${model} es más barato en ${lowestPrice.storeName} con un precio de ${formattedPrice}`
        };
    }

    // Función para formatear el precio sin perder dígitos
    formatPrice(price) {
        // Convertir a string con dos decimales y reemplazar puntos por comas para estilo argentino
        return `$${price.toFixed(3).replace('.', ',')}`;
    }
}

module.exports = ComparisonActor;
