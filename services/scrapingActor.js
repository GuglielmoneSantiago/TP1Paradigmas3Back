// scrapingActor.js
const puppeteer = require('puppeteer');
const EventEmitter = require('events');
const io = require('socket.io-client');
const socket = io('http://<IP_DE_LA_MAQUINA_CON_STORAGE_ACTOR>:3002'); // IP y puerto de la otra máquina

class ScrapingActor extends EventEmitter {
    async scrape(url, model) {
        let price;
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            console.log(`Visiting ${url}`);

            price = await page.evaluate(() => {
                const priceElement = document.querySelector('.price');
                return priceElement ? priceElement.innerText : 'No encontrado';
            });

            console.log('Extracted Price:', price);
            await browser.close();
        } catch (error) {
            console.error(`Error scraping ${url}: ${error.message}`);
            price = 'Error';
        }

        // Envía los precios al StorageActor por el socket
        socket.emit('priceExtracted', { model, prices: [price] });
    }
}

module.exports = ScrapingActor;
