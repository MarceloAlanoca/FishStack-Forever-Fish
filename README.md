# FishStack: Forever Fish
Esta sera la version Remake de FishStack, programado por el grupo DevPlay Studio

## Ejecutar con Docker

Requisitos: Docker Desktop abierto y con el motor activo.

Desde la carpeta principal del repositorio:

```powershell
docker compose up --build
```

Luego abrir `http://localhost:5173`.

Servicios disponibles:

- Página: `http://localhost:5173`
- API: `http://localhost:3000`
- MySQL: `localhost:3307`

Para detener los servicios:

```powershell
docker compose down
```

Los datos de MySQL permanecen guardados en un volumen de Docker. Para crear una base completamente nueva, se puede ejecutar `docker compose down -v`, teniendo en cuenta que elimina los datos guardados por los contenedores.
