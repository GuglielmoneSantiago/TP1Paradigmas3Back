const ScrapingActor = require('./scrapingActor');
const StorageActor = require('./storageActor');

const scrapingActor = new ScrapingActor();
const storageActor = new StorageActor();

exports.getPrices = async (model) => {
    const urls = [
        `https://deliteshop.com.ar/product-category/calzado/zapatillas/?s=${encodeURIComponent(model)}`,
        `https://hoopshoes.net/categoria/calzado/?s=${encodeURIComponent(model)}`
    ];

    const prices = [];

    // Escucha el evento priceExtracted del actor de scraping
    scrapingActor.on('priceExtracted', (price) => {
        prices.push(price);
        if (prices.length === urls.length) {
            // Una vez que todos los precios están extraídos, almacena los precios
            storageActor.store(model, prices);
        }
    });

    // Inicia el scraping para cada URL
    urls.forEach(url => scrapingActor.scrape(url));

    return new Promise((resolve) => {
        scrapingActor.on('priceExtracted', () => {
            if (prices.length === urls.length) {
                resolve(prices);
            }
        });
    });
};
