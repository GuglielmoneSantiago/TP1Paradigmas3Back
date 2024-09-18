const puppeteer = require('puppeteer');
const EventEmitter = require('events');
const io = require('socket.io-client');

// Conexión con la máquina B usando su IP y puerto
const socket = io('http://192.168.0.8:3002');  // Reemplaza con la IP y puerto reales

class ScrapingActor extends EventEmitter {
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

                        const originalPriceElement = priceContainer.querySelector('.js-price-display.item-price');
                        const originalPrice = originalPriceElement ? originalPriceElement.innerText.trim() : 'No disponible';

                        const discountPriceElement = priceContainer.querySelector('.js-compare-price-display.price-compare');
                        const discountPrice = discountPriceElement ? discountPriceElement.innerText.trim() : 'No hay descuento';

                        return {
                            storeName: 'SlamDunkArgentina',
                            model: model,
                            originalPrice: originalPrice,
                            discountPrice: discountPrice !== 'No hay descuento' ? discountPrice : null,
                            inStock: 'Sí'
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
            socket.emit('priceExtracted', { model, result });

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
