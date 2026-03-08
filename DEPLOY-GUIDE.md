# Guía de Despliegue (Deploy a Producción) 🚀

Esta aplicación ya está configurada arquitectónicamente como un monorepo donde el backend de Express (Node.js) sirve el frontend estático. Esto significa que **puedes desplegar todo en un solo servicio** web.

Recomendamos utilizar plataformas como **Railway** o **Render** por su facilidad para conectar un servicio web a una base de datos PostgreSQL en cuestión de minutos.

## Pasos para desplegar (Ejemplo en Railway):

1. **Sube este proyecto a Github**
   - Asegúrate de comitear todos los cambios y subir la carpeta raíz a un repositorio tuyo.

2. **Crea la base de datos PostgreSQL**:
   - Entra en tu dashboard de Railway.
   - Presiona "New Project".
   - Elige "Provision PostgreSQL".
   - Una vez creada, entra a la base de datos, ve a la pestaña "Variables" y copia la URL completa de `DATABASE_URL`.

3. **Despliegue de la API y el Frontend**:
   - En el mismo proyecto de Railway, presiona "New" -> "Github Repo" y elige este repositorio.
   - Ve a la configuración de "Variables" (Environment Variables) del nuevo servicio conectado a tu Github, y agrega:
     - `DATABASE_URL`: Pega la URL que copiaste en el paso anterior.
     - `JWT_SECRET`: Una cadena alfanumérica secreta, larga y aleatoria para firmar las sesiones seguras.
     - `PORT`: (Opcional, a veces Railway lo inyecta solo o podés poner 3001).

4. **¡La magia del `package.json` raíz!**:
   - Railway detectará tu proyecto NodeJS y ejecutará nuestros scripts en orden:
     1. `npm install` (Instala dependencias).
     2. `npm run postinstall` (Entra a `/backend` e instala las de la API).
     3. `npm run build` (Entra a `/backend`, ejecuta `npx prisma generate` y luego `npx prisma db push --accept-data-loss` para sincronizar las tablas de tu base de datos cloud automáticamente).
     4. `npm start` (Prende el servidor productivo de Express con tus archivos y rutas).

¡Eso es todo! Luego de compilar, Railway te dará un link público donde estará funcionando no solo tu API, sino *todo* el CRM completo.
