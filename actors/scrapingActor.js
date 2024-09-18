const puppeteer = require('puppeteer');
const EventEmitter = require('events');

class ScrapingActor extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;  // Asignamos el socket recibido
    }

    async scrape(url, model, paginated = false) {
        let result = { store: '', storeName: '', model: model, originalPrice: '', discountPrice: '', inStock: '' };
        let browser;

        try {
            browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            console.log(`Visitando ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            const storeName = new URL(url).hostname;
            result.store = storeName || 'Desconocido';

            if (storeName.includes('hoopshoes')) {
                // Scraping for Hoopshoes logic (unchanged)
                result.storeName = 'Hoopshoes';
                result = await page.evaluate((model) => {
                    const priceElement = document.querySelector('.price');
                    const outOfStockElement = document.querySelector('.out-of-stock');

                    if (!priceElement) {
                        return { storeName: 'Hoopshoes', model: model, originalPrice: 'No se vende este modelo', discountPrice: '-', inStock: '-' };
                    }

                    const originalPriceElement = priceElement.querySelector('del[aria-hidden="true"]');
                    const discountPriceElement = priceElement.querySelector('ins[aria-hidden="true"]');

                    const originalPrice = originalPriceElement ? originalPriceElement.innerText : priceElement.innerText;
                    const discountPrice = discountPriceElement ? discountPriceElement.innerText : 'No hay descuento';
                    const inStock = outOfStockElement ? 'No' : 'Sí';

                    return { storeName: 'Hoopshoes', model: model, originalPrice, discountPrice, inStock };
                }, model);
            } else if (storeName.includes('deliteshop')) {
                // Scraping for Deliteshop logic (unchanged)
                result.storeName = 'Deliteshop';
                result = await page.evaluate((model) => {
                    const priceElement = document.querySelector('.price');

                    if (!priceElement) {
                        return { storeName: 'Deliteshop', model: model, originalPrice: 'No se vende este modelo', discountPrice: '-', inStock: '-' };
                    }

                    const originalPriceElement = priceElement.querySelector('del[aria-hidden="true"]');
                    const discountPriceElement = priceElement.querySelector('ins[aria-hidden="true"]');

                    const originalPrice = originalPriceElement ? originalPriceElement.innerText : priceElement.innerText;
                    const discountPrice = discountPriceElement ? discountPriceElement.innerText : 'No hay descuento';

                    return { storeName: 'Deliteshop', model: model, originalPrice, discountPrice, inStock: 'Sí' };
                }, model);
            } else if (storeName.includes('slamdunkargentina')) {
                result.storeName = 'SlamDunkArgentina';
                let foundProduct = null;
                let pageNumber = 1;

                while (!foundProduct && pageNumber <= 10) {
                    const paginatedUrl = `${url}&mpage=${pageNumber}`;
                    await page.goto(paginatedUrl, { waitUntil: 'networkidle2', timeout: 60000 });

                    foundProduct = await page.evaluate((model) => {
                        const productContainers = document.querySelectorAll('div.js-product-container.js-quickshop-container');
                        if (!productContainers) return null;

                        let matchingProduct = null;

                        productContainers.forEach((product) => {
                            const titleElement = product.querySelector('a.item-link[title]');
                            const title = titleElement ? titleElement.getAttribute('title') : null;

                            if (title && title.toLowerCase().includes(model.toLowerCase())) {
                                matchingProduct = product;
                            }
                        });

                        if (!matchingProduct) return null;

                        const priceContainer = matchingProduct.querySelector('.item-price-container.mb-1');
                        if (!priceContainer) return null;

                        const originalPriceElement = priceContainer.querySelector('.js-compare-price-display.price-compare');  // Precio original o $0
                        const discountPriceElement = priceContainer.querySelector('.js-price-display.item-price');  // Precio con descuento o precio original

                        let originalPrice = originalPriceElement ? originalPriceElement.innerText.trim() : null;
                        let discountPrice = discountPriceElement ? discountPriceElement.innerText.trim() : null;

                        // Si el precio original es $0, significa que no hay descuento y el precio original está en item-price
                        if (parseFloat(originalPrice.replace(/[^\d.-]/g, '')) === 0) {
                            originalPrice = discountPrice;
                            discountPrice = 'No hay descuento';
                        }

                        // Verificar si el producto está sin stock
                        const stockElement = matchingProduct.querySelector('.label.label-default');
                        const inStock = stockElement ? 'No' : 'Sí';  // Si existe el div con la clase "label label-default", el producto está sin stock

                        return {
                            storeName: 'SlamDunkArgentina',
                            model: model,
                            originalPrice: originalPrice || 'No disponible',
                            discountPrice: discountPrice || 'No hay descuento',
                            inStock: inStock
                        };
                    }, model);

                    if (!foundProduct) {
                        pageNumber++;
                    }
                }

                if (!foundProduct) {
                    result = { storeName: 'SlamDunkArgentina', model: model, originalPrice: 'No se vende este modelo', discountPrice: '-', inStock: '-' };
                } else {
                    result = foundProduct;
                }
            }

            console.log('Datos extraídos:', result);

            // Enviar los resultados a la máquina B a través del socket
            this.socket.emit('priceExtracted', { model: model, result: result });

            return result;
        } catch (error) {
            console.error(`Error haciendo scraping en ${url}: ${error.message}`);
            return null;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}

module.exports = ScrapingActor;
