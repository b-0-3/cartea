# Cartéa

Carta digital con QR para restaurantes. El cliente escanea el QR de su mesa, ve la carta, pide y llama al camarero desde el móvil. La cocina recibe los pedidos en una pantalla, el equipo trabaja desde su móvil con un PIN y el dueño lo controla todo desde su panel.

Hecho con HTML, CSS y JavaScript "a pelo" (sin frameworks) y **Firebase** (Authentication + Firestore).

## Estado actual (octubre 2026)

| | |
|---|---|
| **Web de pruebas** | https://b-0-3.github.io/cartea/ (GitHub Pages) |
| **Carta de demostración** | https://b-0-3.github.io/cartea/menu.html?demo (para enseñar a restaurantes, no necesita cuenta) |
| **Firebase** | Proyecto `mesaqr-73606`. Email/contraseña y Anónimo activados. **Reglas nuevas publicadas** ✅ |
| **Probado con Firebase real** | Panel del dueño, equipo, PIN del camarero, pantalla de cocina ✅ |
| **Falta probar** | Pedido real desde un móvil, avisos al camarero, varios móviles a la vez, recuperar contraseña |
| **Producción** | Todavía no. Se subirá a Netlify o al dominio propio cuando esté todo probado. |

> El repo está en **público** solo para poder usar GitHub Pages gratis mientras se prueba. Cuando pase a producción, volver a ponerlo en privado (Settings → Change visibility).

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
| `netlify.toml`, `404.html` | Netlify | Configuración del alojamiento (para cuando pase a producción) y página de error |

---

## Puesta en marcha (una sola vez)

### 1. Firebase → Authentication → Sign-in method
Tienen que estar **activados los dos**:
- **Correo electrónico/contraseña** (para los dueños)
- **Anónimo** (para clientes, cocina y equipo, que no tienen cuenta)

### 2. Firebase → Firestore Database → Reglas
Copia **todo** el contenido de `firestore.rules`, pégalo sustituyendo lo que haya y pulsa **Publicar**.

> Hazlo justo después de subir esta versión a Netlify. Las reglas nuevas y el código nuevo van juntos.

### 3. Publicar la web
- **Pruebas (ahora):** GitHub Pages → Settings → Pages → *Deploy from a branch* → `main` / `(root)`. Cada cambio en `main` se publica solo en 1-2 minutos.
- **Producción (más adelante):** Netlify o el dominio propio. En Netlify basta con conectar este repo (no hace falta comando de build; `netlify.toml` ya lo indica). Para conectar el repo, GitHub pedirá confirmarlo con GitHub Mobile.

### 4. Después de publicar
- Entra en tu panel y abre **Resumen** o **Equipo** una vez: así se generan las huellas de los PIN y el equipo puede entrar.
- Si tienes algún trabajador antiguo con rol **Cocina**, edítalo y ponle otro rol (cocina ya no entra por móvil, usa la pantalla de pared).
- Rellena tus datos en las páginas legales: busca `[TU NOMBRE Y APELLIDOS]`, `[TU NIF]`, `[TU DIRECCIÓN COMPLETA]`, `[TU DOMINIO]` y `[TU CIUDAD]`.

---

## Para dar de alta a un restaurante (en 10 minutos)

1. Enséñale la **carta de demostración** en tu móvil (`menu.html?demo`): puede pedir, ver el pedido "en cocina" y cambiar a inglés.
2. Créale la cuenta en la web (**Empieza gratis**).
3. **Mi menú → 📥 Pegar carta entera:** un plato por línea con el precio al final, y `# Categoría` para cambiar de sección. Ejemplo:
   ```
   # Entrantes
   Croquetas caseras 8,50
   Gambas al ajillo 11,50 | En cazuela de barro
   # Bebidas
   Caña 2,20
   ```
4. Repasa los **alérgenos** de cada plato (botón ✏️). Es obligatorio por ley.
5. **Mesas** → número de mesas → **Códigos QR** → imprimir.
6. Si tiene equipo: **Equipo** → un PIN para cada uno y que escaneen el QR de acceso.
7. **Pantalla de cocina** → abrirla en una tablet de la cocina.

## La zona de empleados, explicada fácil

Es el "walkie-talkie" del restaurante, pero en el móvil de cada trabajador: cuando un cliente pide o llama desde su mesa, el aviso le salta a quien le toca.

| Rol | Qué ve |
|---|---|
| **Camarero** | Le vibra el móvil (Android) o pita cuando una mesa le llama, pide la cuenta o un plato está listo. Es el más importante. |
| **Barra** | Solo las bebidas que tiene que preparar. |
| **Limpieza** | Qué mesas hay que limpiar. |
| **Encargado** | Todo a la vez, incluidas las ventas del día. |
| **Cocina** | No usa el móvil: usa la **pantalla de pared**. |

Además, cada trabajador tiene su perfil con las notas del jefe y su contrato.

**Cada negocio activa solo lo que tiene:**

| Negocio | Qué usaría |
|---|---|
| Bar pequeño (1-2 personas) | Ningún rol: el dueño mira el panel en su móvil. |
| Cafetería / terraza | 1-2 camareros (el aviso de "la mesa 7 te llama"). |
| Restaurante normal | Camareros + pantalla de cocina. |
| Restaurante grande | Camareros + barra + cocina + encargado + limpieza. |

> Para vender: habla de la carta con QR y los pedidos. Lo del equipo se enseña cuando el cliente diga "mis camareros no se enteran de las mesas".

> **iPhone:** la vibración no funciona en las webs del iPhone (Apple no lo permite). El camarero con iPhone recibe el pitido y el aviso en pantalla.

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
- ⚠️ El acceso del equipo con PIN es una protección básica: no guardes en "Mi contrato" datos muy delicados (DNI, cuenta bancaria). Reforzarlo está en la lista de pendientes.

---

## Probar en tu ordenador

Abre una terminal en la carpeta del proyecto y escribe:

```
py -m http.server 8000
```

(en Mac/Linux: `python3 -m http.server 8000`). Luego abre `http://localhost:8000` en el navegador.

> Usa `localhost`, no la IP del ordenador: el PIN del equipo usa una función del navegador que solo funciona en `https://` o en `localhost`. Para probar desde el móvil, usa la web de pruebas de GitHub Pages.

---

## Pendiente para más adelante (necesita servicios de terceros)

- Mini-servidor para el acceso del equipo y la cocina (Netlify Function + clave de servicio de Firebase), para reforzar la seguridad.
- Rellenar los datos legales (nombre, NIF, dirección) en las 4 páginas legales.
- Volver a poner el repo en privado al pasar a producción.
- Cobro automático del plan Pro (Stripe).
- Nóminas en PDF para el equipo (necesita Firebase Storage → plan Blaze de pago).
- Revisión de los textos legales por un profesional.
