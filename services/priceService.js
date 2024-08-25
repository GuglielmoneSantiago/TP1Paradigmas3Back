const puppeteer = require('puppeteer');
const Sneaker = require('../models/sneakerModel');

exports.getPrices = async (model) => {
  const urls = [
    `https://deliteshop.com.ar/product-category/calzado/zapatillas/?s=${encodeURIComponent(model)}`,
    `https://hoopshoes.net/categoria/calzado/?s=${encodeURIComponent(model)}`,
  ];

  const prices = await Promise.all(urls.map(async (url) => {
    let price;

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      console.log(`Visiting ${url}`);

      // Extrae el precio utilizando la clase actualizada
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

    return price;
  }));

  // Guarda los precios en la base de datos
  await Sneaker.findOneAndUpdate({ model }, { prices }, { upsert: true });

  return prices;
};
