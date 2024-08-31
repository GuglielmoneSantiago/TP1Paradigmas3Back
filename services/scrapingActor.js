const puppeteer = require('puppeteer');
const EventEmitter = require('events');

class ScrapingActor extends EventEmitter {
    async scrape(url) {
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

        this.emit('priceExtracted', price);
    }
}

module.exports = ScrapingActor;
