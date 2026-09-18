# Bot de reportes de mantenimiento — IPS Municipal de Ipiales

Bot de Telegram para que el personal de los puestos de salud reporte
solicitudes de mantenimiento (infraestructura o equipo biomédico), y para
que tú, como administrador, las gestiones desde el mismo Telegram.

## 1. Crear el bot en Telegram

1. Abre Telegram y busca **@BotFather**.
2. Envía `/newbot`, dale un nombre y un usuario (debe terminar en `bot`).
3. Guarda el **token** que te entrega — lo necesitas más adelante.
4. Envía `/start` a tu bot nuevo para poder chatear con él después.
5. Averigua tu propio ID de Telegram: busca **@userinfobot**, envíale
   `/start` y copia el número que te devuelve. Lo necesitas para marcarte
   como administrador.

## 2. Crear la base de datos (Supabase)

1. Ve a https://supabase.com y crea una cuenta gratis.
2. Crea un **New Project**.
3. Cuando esté listo, ve a **SQL Editor > New query**, pega el contenido
   de `db/schema.sql` y dale **Run**.
4. Ve a **Project Settings > API** y copia:
   - `Project URL` → será `SUPABASE_URL`
   - `service_role` key (no la `anon`) → será `SUPABASE_KEY`

## 3. Subir el proyecto a GitHub

Sube esta carpeta (`bot-mantenimiento`) a un repositorio nuevo en GitHub.
No subas ningún archivo con tu token dentro — las claves se configuran en
el paso 4 como variables de entorno.

## 4. Desplegar en Vercel (gratis)

1. Ve a https://vercel.com y crea una cuenta con tu GitHub.
2. **Add New > Project** y selecciona el repositorio.
3. Antes de darle "Deploy", agrega estas **Environment Variables**:
   - `BOT_TOKEN` → el token de BotFather
   - `SUPABASE_URL` → el de Supabase
   - `SUPABASE_KEY` → la `service_role` key de Supabase
   - `ADMIN_TELEGRAM_IDS` → tu ID de Telegram (el de @userinfobot). Si hay
     más de un administrador, sepáralos con comas: `123,456`
4. Dale **Deploy**. Cuando termine, copia la URL que te da Vercel, algo
   como `https://bot-mantenimiento-ips.vercel.app`

## 5. Conectar Telegram con tu bot desplegado

Reemplaza `<TU_TOKEN>` y `<TU_URL>` y abre esto en el navegador (o con
curl):

```
https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=<TU_URL>/api/bot
```

Debe responder `{"ok":true,"result":true,...}`.

## 6. Regístrate como administrador

1. Abre tu bot en Telegram y envía `/start`.
2. Completa el registro (nombre y puesto de salud).
3. Vuelve a Supabase > **Table Editor > usuarios** y cambia manualmente tu
   fila: columna `rol` de `reportante` a `admin`.
   (Como ya pusiste tu ID en `ADMIN_TELEGRAM_IDS`, los comandos de admin
   ya funcionan; este paso solo también te marca como admin dentro de la
   tabla `usuarios` para futuras funciones del panel.)

## Comandos del bot

| Comando | Quién | Qué hace |
|---|---|---|
| `/start` | todos | Registro inicial |
| `/reportar` | todos | Crea una nueva solicitud |
| `/mis_reportes` | todos | Ver mis últimas solicitudes |
| `/pendientes` | admin | Ver todas las solicitudes pendientes |
| `/estado <id> <en_proceso\|resuelto>` | admin | Cambiar estado y notificar al reportante |

## Siguiente paso

Una vez el bot esté funcionando y recibiendo reportes reales, puedo
construirte un panel web (dashboard) para ver y filtrar todas las
solicitudes visualmente, sin depender solo de comandos de Telegram —
avísame cuando quieras que lo hagamos.
