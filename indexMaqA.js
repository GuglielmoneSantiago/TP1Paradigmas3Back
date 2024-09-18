require('dotenv').config();
const io = require('socket.io-client');
const ScrapingActor = require('./actors/scrapingActor');
const config = require('./config/config');

// Conexión con la Máquina B
const socket = io('http://192.168.0.42:3002');  // Cambia la IP y puerto de la Máquina B

// Inicializar ScrapingActor con el socket
const scrapingActor = new ScrapingActor(socket);

// Iniciar scraping para los modelos especificados en la configuración
config.models.forEach(async (model) => {
    console.log(`Iniciando scraping para el modelo: ${model.name}`);

    // Iterar sobre cada tienda para realizar el scraping
    for (let store of config.stores) {
        const url = `${store.baseUrl}${encodeURIComponent(model.name)}`;
        console.log(`Visitando tienda ${store.name} para el modelo ${model.name}`);
        await scrapingActor.scrape(url, model.name);
    }
});
