require('dotenv').config();
const io = require('socket.io-client');
const ScrapingActor = require('./actors/scrapingActor');
const config = require('./config/config');

// Conexión con la Máquina B
const socket = io('http://IP_DE_LA_MAQUINA_B:PUERTO');  // Cambia la IP y puerto de la Máquina B

// Inicializar ScrapingActor con el socket
const scrapingActor = new ScrapingActor(socket);

// Iniciar scraping para los modelos especificados en la configuración
config.models.forEach(async (model) => {
    const storeConfig = config.stores[0];  // Usar la primera tienda para hacer el scraping
    const url = `${storeConfig.baseUrl}${encodeURIComponent(model.name)}`;
    console.log(`Iniciando scraping para el modelo: ${model.name}`);

    await scrapingActor.scrape(url, model.name);
});
