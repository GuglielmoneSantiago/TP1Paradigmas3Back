import pykka
import requests
from bs4 import BeautifulSoup

# Definición del actor que hereda de `pykka.ThreadingActor`
class ContadorActor(pykka.ThreadingActor):
    def __init__(self):
        super().__init__()
        self.contador = 0  # Estado inicial del contador

    # Método para manejar los mensajes recibidos por el actor
    def on_receive(self, message):
        comando = message.get('comando')

        if comando == 'incrementar':
            self.contador += 1
            return f"Contador incrementado a {self.contador}"
        elif comando == 'decrementar':
            self.contador -= 1
            return f"Contador decrementado a {self.contador}"
        elif comando == 'obtener':
            return f"El valor del contador es {self.contador}"
        elif comando == 'recopilar_info':
            url = message.get('url')
            if url:
                return self.recopilar_informacion(url)
            else:
                return "URL no proporcionada"
        else:
            return "Comando no reconocido"

    # Método para recopilar información de una página web
    def recopilar_informacion(self, url):
        try:
            response = requests.get(url)
            response.raise_for_status()  # Verifica si la solicitud fue exitosa
            soup = BeautifulSoup(response.text, 'html.parser')
            precio = soup.find_all(class_='andes-money-amount__fraction')
            # Ejemplo: Obtener el título de la página
            
            if(len(precio)>=2):
                precioFinal=precio[1]
            else:precioFinal=precio[0]
            
            return f"Precio de la página: {precioFinal.string}"
        except requests.RequestException as e:
            return f"Error al acceder a la página: {e}"

if __name__ == '__main__':
    # Crear una instancia del actor
    contador_actor = ContadorActor.start()

    # Enviar mensajes al actor
    

    # Ejemplo: Recopilar información de una página web
    url1 = 'https://articulo.mercadolibre.com.ar/MLA-1699501718-calzado-para-hombre-nike-air-zoom-pegasus-39-negro-_JM#polycard_client=homes-korribanSearchTodayPromotions&position=36&search_layout=grid&type=item&tracking_id=1fbe8958-41b9-4a34-aebb-5c4dfbbf3784&c_id=/home/today-promotions-recommendations/element&c_uid=82821e11-f9a9-462e-803b-76dedbba2971'
    print(contador_actor.ask({'comando': 'recopilar_info', 'url': url1}))
    

    # Detener al actor cuando termines
    contador_actor.stop()