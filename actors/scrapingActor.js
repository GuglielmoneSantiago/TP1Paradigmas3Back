const puppeteer = require('puppeteer');
const EventEmitter = require('events');

class ScrapingActor extends EventEmitter {
    async scrape(url, model) {
        let result = { store: '', storeName: '', originalPrice: '', discountPrice: '', inStock: '' };
        let browser;

        try {
            browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            console.log(`Visiting ${url}`);

            const storeName = new URL(url).hostname;
            result.store = storeName || 'Desconocido';  // Asegúrate de que storeName siempre tenga un valor

            if (storeName.includes('hoopshoes')) {
                result.storeName = 'Hoopshoes';
                result = await page.evaluate(() => {
                    const priceElement = document.querySelector('.price');
                    const thumbnailWrap = document.querySelector('.astra-shop-thumbnail-wrap');
                    const outOfStockElement = thumbnailWrap ? thumbnailWrap.querySelector('span.ast-shop-product-out-of-stock') : null;

                    if (!priceElement) {
                        return { storeName: 'Hoopshoes', originalPrice: 'No se vende este modelo', discountPrice: 'No hay descuento', inStock: 'No' };
                    }

                    const originalPriceElement = priceElement.querySelector('del[aria-hidden="true"]');
                    const discountPriceElement = priceElement.querySelector('ins[aria-hidden="true"]');

                    const originalPrice = originalPriceElement ? originalPriceElement.innerText : priceElement.innerText;
                    const discountPrice = discountPriceElement ? discountPriceElement.innerText : 'No hay descuento';
                    const inStock = outOfStockElement ? 'No' : 'Sí';

                    return { storeName: 'Hoopshoes', originalPrice, discountPrice, inStock };
                });
            } else if (storeName.includes('deliteshop')) {
                result.storeName = 'Deliteshop';
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