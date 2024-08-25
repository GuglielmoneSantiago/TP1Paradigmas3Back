const axios = require("axios");
const cheerio = require("cheerio");
const fs =require ("fs");

const url = "https://flybondi.com/ar/search/dates?adults=1&children=0&currency=ARS&fromCityCode=CNQ&infants=0&toCityCode=BUE&utm_origin=search_bar"

const vuelosData= {};
async function getHTML() {
    const{data:html}=await axios.get(url);
    return html;
};

getHTML().then((res)=>{
    const $=cheerio.load(res);
    $('section.jsx-1854179682 .contDay').each((index, element) => {
        const day = $(element).find('jsx-1854179682 pa0').text().trim(); // Obtener el día
        const price = $(element).find('jsx-1854179682 grey-75 fare-day').text().trim(); // Obtener el precio

        vuelosData[day] = price;
    });
    fs.writeFile('vuelosData.json', JSON.stringify(vuelosData), (err) =>{
        if (err) throw err;
        console.log('Archivo salvado dea');
    })
})