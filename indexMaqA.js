require('dotenv').config();
const io = require('socket.io-client');
const ScrapingActor = require('./actors/scrapingActor');
const config = require('./config/config');

// Conexión con la Máquina B
 REMOVED_LINE // Cambia la IP y puerto de la Máquina B

// Inicializar ScrapingActor con el socket
const scrapingActor = new ScrapingActor(socket);

// Función para manejar scraping para un solo modelo en todas las tiendas
async function scrapeModelInStores(model) {
    const scrapePromises = config.stores.map(async (store) => {
        const url = `${store.baseUrl}${encodeURIComponent(model.name)}`;
        return scrapingActor.scrape(url, model.name);
    });

    // Ejecutar todos los scraping en paralelo para las tiendas
    await Promise.all(scrapePromises);
}

// Iniciar scraping para todos los modelos especificados en la configuración
(async () => {
    const scrapeModelPromises = config.models.map(async (model) => {
        return scrapeModelInStores(model);
    });

    // Esperar a que todos los scraping se completen
    await Promise.all(scrapeModelPromises);

    // Enviar un mensaje a la máquina B indicando que se completó todo el scraping
    socket.emit('scrapingCompleted', { message: 'Scraping de todos los modelos completado' });

    console.log('\nTodos los modelos y tiendas han sido procesados. Cerrando conexiones...');

    // Desconectar el socket
    socket.disconnect();

    // Cerrar el proceso
    process.exit(0);
})();
