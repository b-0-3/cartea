/* ════════════════════════════════════════════════
   COMMON — lo que comparten TODAS las páginas:
   carta del cliente, cocina, acceso del equipo y panel.
   Una sola conexión a Firebase y unas cuantas utilidades.
════════════════════════════════════════════════ */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const FB_CONFIG = {
  apiKey:            'AIzaSyDhzw8E0kZh_NMrtixCtfpZ2rKQ9w0VpnM',
  authDomain:        'mesaqr-73606.firebaseapp.com',
  projectId:         'mesaqr-73606',
  storageBucket:     'mesaqr-73606.firebasestorage.app',
  messagingSenderId: '717696646582',
  appId:             '1:717696646582:web:25caf894e3597a51401517'
};

export const app  = getApps().length ? getApps()[0] : initializeApp(FB_CONFIG);
export const auth = getAuth(app);
export const db   = getFirestore(app);

/* ── Sesión ──
   Carta, cocina y equipo necesitan "estar dentro" para leer datos.
   Si en este navegador ya hay una sesión (por ejemplo, la del dueño
   con su email), se reutiliza: así abrir la carta para probarla NO
   cierra la sesión del panel. Si no hay ninguna, se entra como anónimo. */
export function ensureAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) { resolve(user); return; }
      signInAnonymously(auth).then(c => resolve(c.user)).catch(reject);
    }, reject);
  });
}

/* ── Texto seguro ──
   Todo lo que escribe un cliente o un trabajador (notas, nombres...)
   pasa por aquí antes de pintarse, para que nadie pueda colar código. */
export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));
}

/* ── Dinero ── 12.5 → "12,50 €" */
export function eur(n) {
  return (Number(n) || 0).toLocaleString('es-ES', { style:'currency', currency:'EUR' });
}

/* ── Jornada ──
   "Hoy" para un restaurante no acaba a medianoche: la jornada
   empieza a las 5:00. Un pedido a la 1:30 cuenta para la noche anterior. */
export const HORA_INICIO_JORNADA = 5;
export function inicioJornada(ref = new Date()) {
  const d = new Date(ref);
  if (d.getHours() < HORA_INICIO_JORNADA) d.setDate(d.getDate() - 1);
  d.setHours(HORA_INICIO_JORNADA, 0, 0, 0);
  return d;
}

/* Suma días "de calendario" (respeta los cambios de hora de marzo y octubre) */
export function jornadaMasDias(inicio, dias) {
  const d = new Date(inicio);
  d.setDate(d.getDate() + dias);
  d.setHours(HORA_INICIO_JORNADA, 0, 0, 0);
  return d;
}
/* Llama a cb() cada vez que empieza una jornada nueva (a las 5:00),
   para las pantallas que se quedan abiertas toda la noche. */
export function alCambiarJornada(cb) {
  const programar = () => {
    const siguiente = jornadaMasDias(inicioJornada(), 1);
    setTimeout(() => { cb(); programar(); }, Math.max(1000, siguiente - Date.now() + 1000));
  };
  programar();
}

export function horaDe(ts) {
  if (!ts || !ts.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
}

/* ── Pedidos ── */
export const ESTADOS_ACTIVOS = ['nuevo', 'preparando', 'listo'];
export const AUTO_COMPLETAR_MIN = 30; // un pedido "listo" que nadie marca como servido se da por servido a los 30 min
export const ESTADO_LABEL = {
  nuevo: 'Nuevo', preparando: 'En cocina', listo: 'Listo',
  completado: 'Servido', cancelado: 'Cancelado'
};

/* ── Planes ── */
export const LIMITE_MESAS_BASICO = 5;
export const LIMITE_MESAS_PRO = 200;
export const EMAIL_CONTACTO = 'borjatorresalcala@gmail.com';
/* ── Prueba gratis (la das tú desde admin.html) ──
   plan = 'prueba' + pruebaHasta = 'AAAA-MM-DD' → funciona como Pro hasta ese
   día incluido. Al día siguiente el panel pide pasar por caja. */
export const ADMIN_EMAIL = 'borjatorresalcala@gmail.com';
export function finPrueba(resto) {
  if (!resto || resto.plan !== 'prueba' || !resto.pruebaHasta) return null;
  const d = new Date(resto.pruebaHasta + 'T23:59:59');
  return isNaN(d) ? null : d;
}
export function enPrueba(resto) { const f = finPrueba(resto); return !!f && Date.now() <= f.getTime(); }
export function pruebaCaducada(resto) { const f = finPrueba(resto); return !!f && Date.now() > f.getTime(); }
// Días que quedan DESPUÉS de hoy (0 = hoy es el último día).
export function diasPrueba(resto) {
  const f = finPrueba(resto); if (!f) return 0;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const fin = new Date(f); fin.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((fin - hoy) / 86400000));
}
export function textoDiasPrueba(resto) {
  const d = diasPrueba(resto);
  return d === 0 ? 'último día' : d === 1 ? 'queda 1 día' : 'quedan ' + d + ' días';
}
export function isPro(resto) { return !!resto && (resto.plan === 'pro' || enPrueba(resto)); }
export function nombrePlan(resto) {
  if (!resto) return '';
  if (resto.plan === 'pro') return 'Plan Pro';
  if (enPrueba(resto)) return 'Prueba Pro · ' + textoDiasPrueba(resto);
  if (pruebaCaducada(resto)) return 'Prueba terminada';
  return 'Plan Básico';
}

/* ── Cobros ──
   Un pedido solo cuenta como VENTA cuando el camarero lo marca como cobrado. */
export function cobrado(p) { return !!p && p.pagado === true && p.estado !== 'cancelado'; }
export function porCobrar(p) { return !!p && p.pagado !== true && p.estado !== 'cancelado'; }

/* ── Tipos de aviso que puede mandar el cliente ── */
export const AVISO_LABEL = { camarero: '🔔 Llama al camarero', cuenta: '🧾 Pide la cuenta', carbon: '🔥 Cambio de carbón' };
export function mesasEfectivas(resto) {
  const n = Number(resto?.mesas) || LIMITE_MESAS_BASICO;
  return isPro(resto) ? Math.min(n, LIMITE_MESAS_PRO) : Math.min(n, LIMITE_MESAS_BASICO);
}
export function mailtoPro(resto) {
  const asunto = encodeURIComponent('Quiero pasar a Cartéa Pro');
  const cuerpo = encodeURIComponent(
    'Hola, quiero activar el plan Pro.\n\nRestaurante: ' + (resto?.nombre || '') +
    '\nEmail de la cuenta: ' + (resto?.email || '') + '\nID: ' + (resto?.uid || ''));
  return 'mailto:' + EMAIL_CONTACTO + '?subject=' + asunto + '&body=' + cuerpo;
}

/* ── PIN del equipo ──
   El PIN nunca se guarda "a la vista" para los de fuera: se guarda una
   huella (hash) de restaurante+PIN. Con el PIN correcto se encuentra la
   ficha; sin él, no hay forma de listar las fichas del equipo. */
export async function sha256Hex(texto) {
  const data = new TextEncoder().encode(texto);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function pinHash(restId, pin) { return sha256Hex(restId + ':' + pin); }

/* ── Alérgenos ── los 14 que obliga a informar la normativa europea */
export const ALERGENOS = [
  { id:'gluten',         icon:'🌾', es:'Gluten',            en:'Gluten' },
  { id:'crustaceos',     icon:'🦐', es:'Crustáceos',        en:'Crustaceans' },
  { id:'huevos',         icon:'🥚', es:'Huevos',            en:'Eggs' },
  { id:'pescado',        icon:'🐟', es:'Pescado',           en:'Fish' },
  { id:'cacahuetes',     icon:'🥜', es:'Cacahuetes',        en:'Peanuts' },
  { id:'soja',           icon:'🌱', es:'Soja',              en:'Soy' },
  { id:'lacteos',        icon:'🥛', es:'Lácteos',           en:'Milk' },
  { id:'frutos_cascara', icon:'🌰', es:'Frutos de cáscara', en:'Tree nuts' },
  { id:'apio',           icon:'🥬', es:'Apio',              en:'Celery' },
  { id:'mostaza',        icon:'🟡', es:'Mostaza',           en:'Mustard' },
  { id:'sesamo',         icon:'⚪', es:'Sésamo',            en:'Sesame' },
  { id:'sulfitos',       icon:'🍷', es:'Sulfitos',          en:'Sulphites' },
  { id:'altramuces',     icon:'🌼', es:'Altramuces',        en:'Lupin' },
  { id:'moluscos',       icon:'🦪', es:'Moluscos',          en:'Molluscs' },
];

/* ── Categorías ── */
export const CATS_POR_DEFECTO = ['Entrantes','Principales','Pizzas','Pastas','Carnes','Pescados','Postres','Bebidas'];
export const CAT_EN = {
  'Entrantes':'Starters', 'Principales':'Mains', 'Pizzas':'Pizzas', 'Pastas':'Pasta',
  'Carnes':'Meat', 'Pescados':'Fish', 'Postres':'Desserts', 'Bebidas':'Drinks',
  'Arroces':'Rice dishes', 'Ensaladas':'Salads', 'Tapas':'Tapas', 'Raciones':'Sharing plates',
  'Bocadillos':'Sandwiches', 'Hamburguesas':'Burgers', 'Vinos':'Wines', 'Cervezas':'Beers',
  'Cócteles':'Cocktails', 'Cafés':'Coffee', 'Menú del día':'Set menu', 'Sopas':'Soups'
};
/* Categorías que prepara la barra (no la cocina) */
export const CATS_BARRA = ['bebida','barra','cóctel','coctel','vino','cerveza','café','cafe','refresco','licor','combinado','copa','shisha','cachimba'];
/* ¿Este restaurante tiene a alguien en barra? Lo mantiene al día el panel
   (Equipo/Resumen). Si no hay barra, las bebidas las saca la cocina como siempre. */
export function usaBarra(resto) { return !!resto && resto.hayBarra === true; }
export function esDeBarra(categoria) {
  const c = String(categoria || '').toLowerCase();
  return CATS_BARRA.some(k => c.includes(k));
}

/* ── Pantalla de pedidos: se llama "Cocina" o "Barra" según el local ── */
export function nombrePantalla(resto) { return resto && resto.pantalla === 'barra' ? 'Barra' : 'Cocina'; }

/* ── Opciones de un producto (el cliente elige una: sabor, tipo...) ── */
export function opcionesDe(item) {
  const o = item && item.opciones;
  return o && Array.isArray(o.valores) && o.valores.length ? { titulo: String(o.titulo || 'Elige'), valores: o.valores.map(String) } : null;
}

/* ── Pegar carta entera ──
   "Croquetas 8,50" · "Bravas ....... 6 €" · "Gambas 11,50 | descripción" · "# Categoría"
   "> Sabor: Menta, Uva, Melón" → el cliente elige uno al pedir el producto de la línea anterior */
const EMOJI_CAT = [
  [/shisha|cachimba/i, '💨'], [/c[oó]ctel|mojito|daiquiri|colada/i, '🍹'], [/combinado|ron |ginebra|vodka|whisk|licor|chupito/i, '🥃'],
  [/batido/i, '🥤'], [/bebida|refresco|agua|zumo/i, '🥤'], [/vino|tinto/i, '🍷'], [/cerveza/i, '🍺'], [/copa/i, '🍸'], [/caf[eé]|infusi|colacao/i, '☕'],
  [/gofre|volcano|postre|dulce/i, '🍰'], [/snack|patata|fingers|croqueta/i, '🍟'], [/ensalada/i, '🥗'], [/pizza/i, '🍕'], [/panini|bocadillo|sandwich/i, '🥪'],
  [/pasta/i, '🍝'], [/arroz|paella/i, '🥘'], [/carne/i, '🥩'], [/pescado|marisco/i, '🐟'], [/hamburguesa/i, '🍔'], [/tapa|picar|entrante|raci/i, '🍤'],
];
export function emojiPara(texto) { return (EMOJI_CAT.find(([re]) => re.test(texto)) || [null, '🍽️'])[1]; }

export function parsearCarta(texto, catsActuales = []) {
  let cat = catsActuales[0] || 'Principales';
  const platos = [], fallos = [], catsNuevas = [], catsVistas = [], meta = {};
  String(texto || '').split(/\r?\n/).forEach(linea => {
    const l = linea.trim();
    if (!l) return;
    const mm = l.match(/^@([a-z]+)\s*:\s*(.*)$/i);  // "@nombre: Horizonte Lounge" → datos del local (para la demo)
    if (mm) { meta[mm[1].toLowerCase()] = mm[2].trim().slice(0, 80); return; }
    if (l.startsWith('>')) {                       // opciones del plato anterior
      const ultimo = platos[platos.length - 1];
      const cuerpo = l.slice(1).trim();
      const i = cuerpo.indexOf(':');
      const titulo = (i > 0 ? cuerpo.slice(0, i) : 'Elige').trim().slice(0, 40) || 'Elige';
      const valores = [...new Set((i > 0 ? cuerpo.slice(i + 1) : cuerpo).split(/[,;]/).map(v => v.trim().slice(0, 60)).filter(Boolean))].slice(0, 60);
      if (!ultimo || !valores.length) { fallos.push(l); return; }
      ultimo.opciones = { titulo, valores };
      return;
    }
    if (l.startsWith('#') || (/:$/.test(l) && !/\d/.test(l))) {
      cat = l.replace(/^#+/, '').replace(/:$/, '').trim() || cat;
      if (!catsVistas.includes(cat)) catsVistas.push(cat);
      if (!catsActuales.includes(cat) && !catsNuevas.includes(cat)) catsNuevas.push(cat);
      return;
    }
    const [principal, ...resto] = l.split('|');
    const desc = resto.join('|').trim();
    const m = principal.trim().match(/^(.+?)[\s.…·:;\-–—]*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|eur|euros)?$/i);
    if (!m) { fallos.push(l); return; }
    const nombre = m[1].trim().replace(/[\s.…·:;\-–—]+$/, '');
    const precio = Math.round(parseFloat(m[2].replace(',', '.')) * 100) / 100;
    if (!nombre || isNaN(precio)) { fallos.push(l); return; }
    if (!catsVistas.includes(cat)) catsVistas.push(cat);
    platos.push({ nombre: nombre.slice(0, 80), precio, desc: desc.slice(0, 200), categoria: cat, emoji: emojiPara(cat + ' ' + nombre), activo: true, alergenos: [], orden: platos.length });
  });
  return { platos, fallos, catsNuevas, catsVistas, meta };
}

/* ── Demo sin cuenta: carta preparada (cartas/<nombre>.txt) ── */
export const nombreCartaValido = (n) => /^[a-z0-9-]{1,30}$/.test(String(n || ''));
export async function cargarCartaDemo(nombre) {
  if (!nombreCartaValido(nombre)) throw new Error('carta no válida');
  const r = await fetch('cartas/' + nombre + '.txt', { cache: 'no-store' });
  if (!r.ok) throw new Error('carta no encontrada');
  const { platos, catsVistas, meta } = parsearCarta(await r.text(), []);
  return {
    resto: { nombre: meta.nombre || nombre, plan: 'pro', cats: catsVistas, avisoCarbon: /^s[ií]/i.test(meta.carbon || ''), pantalla: meta.pantalla === 'barra' ? 'barra' : 'cocina' },
    menu: platos.map((p, i) => ({ id: 'p' + i, ...p })),
  };
}
export const salaValida = (s) => /^[a-z0-9]{4,20}$/.test(String(s || ''));
