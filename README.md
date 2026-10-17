# FishStack: Forever Fish
Esta sera la version Remake de FishStack, programado por el grupo DevPlay Studio

Las fotos de perfil se envían con `FormData` al endpoint `PATCH /me/photo`,
en el campo `Foto_Perfil`. Multer recibe el archivo en `req.file` y lo guarda en
`Proyecto/Api/public/images/users/`. La base de datos guarda únicamente la ruta
`/images/users/<nombre>.png` (también se admiten JPG y WebP, hasta 5 MB).
La API sirve esa carpeta públicamente; `DELETE /me/photo` quita la foto.

Después de actualizar, ejecutar `npm install` dentro de `Proyecto/Api` para instalar
Multer y reiniciar la API. Con Docker Compose, ejecutar desde la raíz
`docker compose run --rm --no-deps api npm install` para actualizar también el volumen
de dependencias, y luego `docker compose up -d --build api`.
Al iniciar, la API convierte las fotos
Base64 existentes en archivos y actualiza sus rutas sin perder las imágenes.
La carpeta de fotos debe conservarse junto con la base de datos al hacer copias
de seguridad; en Docker Compose queda en la carpeta local gracias al volumen `/app`.
