const ScrapingActor = require('./scrapingActor');
const StorageActor = require('./storageActor');

const scrapingActor = new ScrapingActor();
const storageActor = new StorageActor();

exports.getPrices = async (model) => {
    const urls = [
        `https://deliteshop.com.ar/product-category/calzado/zapatillas/?s=${encodeURIComponent(model)}`,
        `https://hoopshoes.net/categoria/calzado/?s=${encodeURIComponent(model)}`
    ];

    const scrapingPromises = urls.map(url => {
        return new Promise((resolve) => {
            scrapingActor.once('priceExtracted', resolve); // Escuchar el evento priceExtracted por cada URL
            scrapingActor.scrape(url, model);
        });
    });

    const prices = await Promise.all(scrapingPromises);

    // Almacenar los precios en la base de datos
    await storageActor.store(model, prices);

    // Devolver el resultado en formato Tienda: Precio Original: Precio con Descuento
    return prices.map(priceData => {
        return `Tienda: ${priceData.store}, Precio Original: ${priceData.originalPrice}, Precio con Descuento: ${priceData.discountPrice}`;
    });
};
