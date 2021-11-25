Ejemplo de implementacion con docker de un monitor de valores aleatorios que se muestran en un front end mediante socket.io
Tenemos 2 contenedores, unopara el codigo y otro para redis, donde cacheamos todos los valores alguna vez generados y asi siempre tenemos
disponible un historico del sistema.

La parte front tiene opciones de alarma, como a cuantos intentos dispararse y si activar o no una alarma sonora.

Las imagenes son, node14, redis-6 y ms-main, maneja 2 volumenes especificados en el docker-compose.yml
