# Cartéa

Carta digital con QR para restaurantes. El cliente escanea el QR de su mesa, ve la carta, pide y llama al camarero desde el móvil. La cocina recibe los pedidos en una pantalla, el equipo trabaja desde su móvil con un PIN y el dueño lo controla todo desde su panel.

Hecho con HTML, CSS y JavaScript "a pelo" (sin frameworks), **Firebase** (Authentication + Firestore) y alojado en **Netlify**.

---

## Qué hay en cada archivo

| Archivo | Quién lo usa | Para qué |
|---|---|---|
| `index.html` | Todo el mundo | Web de presentación + entrar / crear cuenta |
| `menu.html` | Clientes | La carta que se abre al escanear el QR de la mesa |
| `cocina.html` | Cocina | Pantalla de pared con los pedidos en directo |
| `trabajador.html` | Equipo | App del equipo (camarero, barra, encargado, limpieza) con PIN |
| `dashboard.html` | Dueño | Resumen del día |
| `panel-pedidos.html` | Dueño | Pedidos en directo e historial de hoy |
| `panel-avisos.html` | Dueño | Llamadas al camarero y peticiones de cuenta |
| `panel-ventas.html` | Dueño (Pro) | Ventas por hora/día, platos más vendidos, descarga CSV |
| `panel-menu.html` | Dueño | Editar la carta (precios, alérgenos, inglés) |
| `panel-mesas.html` | Dueño | Número de mesas y su estado |
| `panel-qr.html` | Dueño | Códigos QR de cada mesa para imprimir |
| `panel-equipo.html` | Dueño | Trabajadores, PINs, contratos y notas para el equipo |
| `panel-cocina.html` | Dueño | Enlace/QR para abrir la pantalla de cocina |
| `panel-config.html` | Dueño | Datos, categorías, plan, contraseña, exportar datos |
| `js/common.js` | Todas | Conexión a Firebase y utilidades compartidas |
| `js/panel-core.js` | Panel | Login del dueño, menú lateral, contadores |
| `js/accesos.js` | Panel | Mantiene las "huellas" de los PIN del equipo |
| `css/panel.css` | Panel | Estilos del panel |
| `firestore.rules` | Firebase | **Reglas de seguridad** (hay que pegarlas en Firebase) |
| `aviso-legal.html`, `privacidad.html`, `cookies.html`, `terminos.html` | Todo el mundo | Textos legales (plantillas: hay que rellenar tus datos) |
| `netlify.toml`, `404.html` | Netlify | Configuración del alojamiento y página de error |

---

## Puesta en marcha (una sola vez)

### 1. Firebase → Authentication → Sign-in method
Tienen que estar **activados los dos**:
- **Correo electrónico/contraseña** (para los dueños)
- **Anónimo** (para clientes, cocina y equipo, que no tienen cuenta)

### 2. Firebase → Firestore Database → Reglas
Copia **todo** el contenido de `firestore.rules`, pégalo sustituyendo lo que haya y pulsa **Publicar**.

> Hazlo justo después de subir esta versión a Netlify. Las reglas nuevas y el código nuevo van juntos.

### 3. Netlify
Conecta este repositorio de GitHub a tu sitio de Netlify (en la configuración del sitio, en la parte de despliegue / repositorio). No hace falta comando de build: se publica la carpeta tal cual (`netlify.toml` ya lo indica). Cada vez que subas un cambio a la rama `main`, Netlify publica solo.

### 4. Después de publicar
- Entra en tu panel y abre **Resumen** o **Equipo** una vez: así se generan las huellas de los PIN y el equipo puede entrar.
- Si tienes algún trabajador antiguo con rol **Cocina**, edítalo y ponle otro rol (cocina ya no entra por móvil, usa la pantalla de pared).
- Rellena tus datos en las páginas legales: busca `[TU NOMBRE Y APELLIDOS]`, `[TU NIF]`, `[TU DIRECCIÓN COMPLETA]`, `[TU DOMINIO]` y `[TU CIUDAD]`.

---

## Planes: cómo activar Pro a un cliente

Mientras no haya pagos automáticos, Pro se activa a mano:

1. El cliente te escribe (botón **Pasar a Pro** del panel → email a `hola@mesaqr.com` con su ID).
2. Cobras (Bizum, transferencia…).
3. Firebase Console → Firestore → colección `restaurantes` → documento con su ID → añade o cambia el campo **`plan`** (tipo *string*) a **`pro`**.
4. El cliente recarga su panel y ya tiene Pro.

Para volver a Básico: cambia `plan` a `basico`.
Para **bloquear una cuenta** (por ejemplo, impago): añade el campo **`activo`** (tipo *boolean*) = `false`. Su panel y su carta dejan de funcionar hasta que lo vuelvas a poner en `true`.

> El dueño de un restaurante **no puede** cambiarse él mismo `plan` ni `activo`: las reglas de seguridad lo impiden.

| | Básico (gratis) | Pro (29 €/mes) |
|---|---|---|
| Mesas | hasta 5 | hasta 200 |
| Carta, QR, pedidos, cocina, equipo, alérgenos | ✓ | ✓ |
| Página de Ventas + descarga CSV | – | ✓ |
| Carta en inglés | – | ✓ |

---

## Cómo funciona por dentro (resumen)

- **Jornada:** "hoy" va de las 5:00 a las 5:00 del día siguiente, para que las cenas que acaban de madrugada cuenten en su noche.
- **Pedidos:** `nuevo` → `preparando` (la cocina lo coge sola) → `listo` → `completado` (el camarero lo sirve). También `cancelado`. **Ya no se borran**: se guardan para las ventas. Un pedido "listo" que nadie marca como servido se da por servido a los 30 minutos.
- **Barra:** si en Equipo hay alguien **activo con rol Barra**, las bebidas (categorías que contienen "bebida", "vino", "cerveza", "cóctel", "café", "refresco"…) las prepara la barra: la cocina deja de ver los pedidos que son solo bebidas, y el camarero recibe por separado "platos listos" y "bebidas listas". Si no hay nadie en barra, todo va a cocina como siempre. Se decide solo (campo `hayBarra` del restaurante).
- **PIN del equipo:** no se guarda "a la vista" para los de fuera. Se guarda una huella (hash) en `restaurantes/{id}/accesos/`. Con el PIN correcto se encuentra la ficha; sin él no hay forma de ver la lista del equipo.
- **Alérgenos:** los 14 de declaración obligatoria (Reglamento UE 1169/2011).

### Seguridad: lo que está cubierto y lo que no

- ✅ Nadie de fuera puede ver la lista de restaurantes, ni la lista del equipo, ni cambiar la carta, ni cambiarse el plan.
- ✅ Todo lo que escribe un cliente (notas, nombres) se muestra como texto: no se puede colar código en tu panel.
- ✅ Los pedidos solo se crean con una forma válida y, si la cuenta está desactivada, no entran.
- ⚠️ **El PIN de 4 cifras es una protección básica.** Alguien con conocimientos podría escribir un programa que pruebe las 10.000 combinaciones y ver las fichas del equipo (incluido lo que pongas en "Mi contrato"). Por eso: no guardes ahí datos muy delicados (DNI, cuenta bancaria). El arreglo completo es un mini-servidor (Netlify Function) que compruebe el PIN y bloquee tras varios fallos: está en la lista de pendientes.
- ⚠️ Cualquiera con el enlace de un restaurante puede leer sus pedidos de hoy y marcar avisos como atendidos (la cocina y el equipo entran sin cuenta). Se arregla con lo mismo del punto anterior.

---

## Probar en tu ordenador

Abre una terminal en la carpeta del proyecto y escribe:

```
py -m http.server 8000
```

(en Mac/Linux: `python3 -m http.server 8000`). Luego abre `http://localhost:8000` en el navegador.

> Usa `localhost`, no la IP del ordenador: el PIN del equipo usa una función del navegador que solo funciona en `https://` o en `localhost`.

---

## Pendiente para más adelante (necesita servicios de terceros)

- Mini-servidor para el PIN del equipo y la cocina (Netlify Function + clave de servicio de Firebase): bloqueo tras varios intentos y que cada dispositivo solo vea su restaurante.
- Cobro automático del plan Pro (Stripe).
- Nóminas en PDF para el equipo (necesita Firebase Storage → plan Blaze de pago).
- Revisión de los textos legales por un profesional.
