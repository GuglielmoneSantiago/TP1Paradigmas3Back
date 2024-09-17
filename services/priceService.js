const ScrapingActor = require('../actors/scrapingActor');
const ComparisonActor = require('../actors/comparisonActor');
const StorageActor = require('../actors/storageActor');
const fs = require('fs');
const path = require('path');

// Inicializa los actores
const scrapingActor = new ScrapingActor();
const storageActor = new StorageActor();
const comparisonActor = new ComparisonActor();

// Función para limpiar los precios y convertirlos a números, si no es posible convertir, devolver null
function cleanPrice(price) {
    const cleanedPrice = parseFloat(price.replace(/[^\d.-]/g, ''));
    return isNaN(cleanedPrice) ? null : cleanedPrice;
}

exports.getPricesForModel = async (model) => {
    const urls = [
        `https://deliteshop.com.ar/product-category/calzado/zapatillas/?s=${encodeURIComponent(model)}`,
        `https://hoopshoes.net/categoria/calzado/?s=${encodeURIComponent(model)}`
    ];

    // Promesas de scraping
    const scrapingPromises = urls.map(async (url) => {
        try {
            const priceData = await scrapingActor.scrape(url, model);
            if (!priceData) {
                console.log(`No se encontraron datos para la URL: ${url}`);
            }
            return priceData ? priceData : null;  // Devuelve null si no hay datos
        } catch (error) {
            console.error(`Error al hacer scraping en la URL ${url}:`, error.message);
            return null;  // Ignorar las tiendas que fallan
        }
    });

    // Esperar a que todas las promesas se resuelvan
    let prices = await Promise.all(scrapingPromises);
    prices = prices.filter(price => price !== null);  // Filtrar resultados null

    if (prices.length === 0) {
        console.log(`No se encontraron precios para el modelo ${model}`);
        return;
    }

    // Limpiar los precios (eliminar símbolos de moneda y convertirlos a números)
    prices = prices.map(price => {
        return {
            store: price.storeName,
            originalPrice: cleanPrice(price.originalPrice),
            discountPrice: price.discountPrice !== 'No hay descuento' ? cleanPrice(price.discountPrice) : null,
            inStock: price.inStock
        };
    });

    // Comparar los precios obtenidos
    const comparisonResult = comparisonActor.compare(prices);

    // Imprimir en consola los resultados
    console.log(`Resultados de la comparación para el modelo ${model}:`);
    console.log(comparisonResult);

    // Guardar en archivo
    const sanitizedModel = model.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filePath = path.join(__dirname, `${sanitizedModel}_prices.txt`);
    fs.writeFileSync(filePath, JSON.stringify(comparisonResult, null, 2));

    // Guardar en la base de datos
    try {
        await storageActor.store(model, prices);
        console.log(`Datos guardados correctamente para el modelo ${model}`);
    } catch (error) {
        console.error(`Error al guardar datos en la base de datos para el modelo ${model}:`, error.message);
    }
};
