const puppeteer = require('puppeteer');
const EventEmitter = require('events');
const io = require('socket.io-client');

// Conexión con la máquina remota usando su IP
const socket = io('http://IP_DE_LA_MAQUINA_REMOTA:PUERTO');  // Reemplaza con la IP y puerto reales

class ScrapingActor extends EventEmitter {
    async scrape(url, model) {
        let result = { store: '', storeName: '', model: model, originalPrice: '', discountPrice: '', inStock: '' };
        let browser;

        try {
            browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });  // Aumenta a 60 segundos (60000 ms)
            console.log(`Visiting ${url}`);

            const storeName = new URL(url).hostname;
            result.store = storeName || 'Desconocido';  // Asegúrate de que storeName siempre tenga un valor

            if (storeName.includes('hoopshoes')) {
                result.storeName = 'Hoopshoes';
                result = await page.evaluate((model) => {
                    const priceElement = document.querySelector('.price');
                    const thumbnailWrap = document.querySelector('.astra-shop-thumbnail-wrap');
                    const outOfStockElement = thumbnailWrap ? thumbnailWrap.querySelector('span.ast-shop-product-out-of-stock') : null;

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
                // Lógica para SlamDunkArgentina
                result.storeName = 'SlamDunkArgentina';div 
                result = await page.evaluate((model) => {
                    const priceContainer = document.querySelector('.item-price-container.mb-1');
            
                    // Si no hay contenedor de precio, no se encuentra el modelo
                    if (!priceContainer) {
                        return { storeName: 'SlamDunkArgentina', model: model, originalPrice: 'No se vende este modelo', discountPrice: 'No hay descuento', inStock: 'No' };
                    }
            
                    // Extraer el precio actual
                    const currentPriceElement = priceContainer.querySelector('.js-price-display.item-price');
                    const currentPrice = currentPriceElement ? currentPriceElement.innerText : 'No disponible';
            
                    // Extraer el precio original en caso de descuento
                    const originalPriceElement = priceContainer.querySelector('.js-compare-price-display.price-compare');
                    const originalPrice = originalPriceElement ? originalPriceElement.innerText : currentPrice;  // Si no hay descuento, el precio original es el actual
            
                    return {
                        storeName: 'SlamDunkArgentina',
                        model: model,
                        originalPrice: originalPrice,
                        discountPrice: originalPriceElement ? currentPrice : 'No hay descuento',
                        inStock: 'Sí'  // Suposición: si el precio aparece, el producto está en stock
                    };
                }, model);
            }

            console.log('Extracted Data:', result);

            // Enviar los resultados a la máquina remota a través del socket
            socket.emit('priceExtracted', { model, result });

            return result;
        } catch (error) {
            console.error(`Error scraping ${url}: ${error.message}`);
            return null;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}

module.exports = ScrapingActor;