const ScrapingActor = require('../actors/scrapingActor');
const ComparisonActor = require('../actors/comparisonActor');
const StorageActor = require('../actors/storageActor');
const config = require('../config/config');

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
    const modelData = config.models.find(m => m.name === model);

    if (!modelData) {
        console.log(`El modelo ${model} no se encuentra en la configuración`);
        return;
    }

    // Iterar sobre las tiendas definidas en la configuración
    const scrapingPromises = config.stores.map(async (store) => {
        const url = `${store.baseUrl}${encodeURIComponent(model)}`;
        try {
            const priceData = await scrapingActor.scrape(url, model);
            return priceData ? priceData : null;
        } catch (error) {
            console.error(`Error al hacer scraping en la URL ${url}:`, error.message);
            return null;
        }
    });
    // Esperar a que todas las promesas se resuelvan
    let prices = await Promise.all(scrapingPromises);
    prices = prices.filter(price => price !== null);

    if (prices.length === 0) {
        console.log(`No se encontraron precios para el modelo ${model}`);
        return;
    }

    // Limpiar los precios antes de almacenarlos
    prices = prices.map(price => ({
        storeName: price.storeName,
        originalPrice: cleanPrice(price.originalPrice),
        discountPrice: price.discountPrice !== 'No hay descuento' ? cleanPrice(price.discountPrice) : null,
        inStock: price.inStock
    }));

    // Comparar los precios obtenidos
    const comparisonResult = comparisonActor.compare(model, prices);

    // Imprimir solo el mensaje de la comparación
    console.log(comparisonResult.message);

    // Guardar en la base de datos
    try {
        await storageActor.store(model, prices);
        console.log(`Datos guardados correctamente para el modelo ${model}`);
    } catch (error) {
        console.error(`Error al guardar datos en la base de datos para el modelo ${model}:`, error.message);
    }
};