const puppeteer = require('puppeteer');
const EventEmitter = require('events');
const io = require('socket.io-client');
const socket = io('http://192.168.0.24:3002'); // IP y puerto de la otra máquina

class ScrapingActor extends EventEmitter {
    async scrape(url, model) {
        let result = { store: '', storeName: '', originalPrice: '', discountPrice: '', inStock: '' };  // Añadimos storeName
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            console.log(`Visiting ${url}`);

            const storeName = new URL(url).hostname;
            result.store = storeName;

            // Asignar nombres amigables según el dominio de la tienda
            if (storeName.includes('hoopshoes')) {
                result.storeName = 'Hoopshoes';
                // Evaluar en Hoopshoes
                result = await page.evaluate(() => {
                    const priceElement = document.querySelector('.price');
                    const thumbnailWrap = document.querySelector('.astra-shop-thumbnail-wrap');
                    const outOfStockElement = thumbnailWrap ? thumbnailWrap.querySelector('span.ast-shop-product-out-of-stock') : null;

                    // Si no se encuentra el precio, significa que no se encontró el producto
                    if (!priceElement) {
                        return { storeName: 'Hoopshoes', originalPrice: 'No se vende este modelo', discountPrice: 'No hay descuento', inStock: 'No' };
                    }

                    const originalPriceElement = priceElement.querySelector('del[aria-hidden="true"]');
                    const discountPriceElement = priceElement.querySelector('ins[aria-hidden="true"]');

                    const originalPrice = originalPriceElement ? originalPriceElement.innerText : priceElement.innerText;
                    const discountPrice = discountPriceElement ? discountPriceElement.innerText : 'No hay descuento';

                    // Determinar si está en stock
                    const inStock = outOfStockElement ? 'No' : 'Sí';

                    return { storeName: 'Hoopshoes', originalPrice, discountPrice, inStock };
                });
            } else if (storeName.includes('deliteshop')) {
                result.storeName = 'Deliteshop';
                // Evaluar en Deliteshop
                result = await page.evaluate(() => {
                    const priceElement = document.querySelector('.price');
                    if (!priceElement) {
                        return { storeName: 'Deliteshop', originalPrice: 'No se vende este modelo', discountPrice: 'No hay descuento', inStock: 'No' };
                    }

                    const originalPriceElement = priceElement.querySelector('del[aria-hidden="true"]');
                    const discountPriceElement = priceElement.querySelector('ins[aria-hidden="true"]');

                    const originalPrice = originalPriceElement ? originalPriceElement.innerText : priceElement.innerText;
                    const discountPrice = discountPriceElement ? discountPriceElement.innerText : 'No hay descuento';

                    return { storeName: 'Deliteshop', originalPrice, discountPrice, inStock: 'Sí' };
                });
            }

            console.log('Extracted Data:', result);
            await browser.close();
        } catch (error) {
            console.error(`Error scraping ${url}: ${error.message}`);
            result = { store: 'Error', storeName: 'Error', originalPrice: 'Error', discountPrice: 'Error', inStock: 'Error' };
        }

        // Envía los resultados al StorageActor por el socket
        socket.emit('priceExtracted', { model, prices: [result] });
    }
}

module.exports = ScrapingActor;
