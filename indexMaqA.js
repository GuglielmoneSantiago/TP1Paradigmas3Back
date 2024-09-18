require('dotenv').config();
const io = require('socket.io-client');
const ScrapingActor = require('./actors/scrapingActor');
const config = require('./config/config');

const scrapingActor = new ScrapingActor();

// Conexión con la Máquina B
const socket = io('http://IP_DE_LA_MAQUINA_B:PUERTO');  // Cambia la IP y puerto de la Máquina B

// Escuchar la confirmación de que los datos fueron almacenados en la Máquina B
socket.on('dataStored', (message) => {
    console.log(`Confirmación de la Máquina B: ${message}`);
});

// Función para realizar scraping y enviar los resultados a la Máquina B
async function executeScraping(model) {
    const storeConfig = config.stores[0];  // Usar la primera tienda para hacer el scraping
    const url = `${storeConfig.baseUrl}${encodeURIComponent(model)}`;
    
    try {
        const priceData = await scrapingActor.scrape(url, model);
        console.log(`Datos del scraping para el modelo ${model}:`, priceData);

        // Enviar los datos a la Máquina B para almacenarlos
        socket.emit('priceExtracted', { model, priceData });
    } catch (error) {
        console.error(`Error al realizar scraping en la Máquina A: ${error.message}`);
    }
}

// Iniciar scraping para los modelos especificados en la configuración
config.models.forEach(model => {
    console.log(`Iniciando búsqueda para el modelo: ${model.name}`);
    executeScraping(model.name);
});
