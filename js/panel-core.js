/* ════════════════════════════════════════════════
   PANEL CORE — compartido por TODAS las páginas del panel.
   Se encarga solo del "armazón": login, menú lateral, logout,
   contadores en vivo y el aviso flotante (toast). La lógica de
   cada sección vive en su propio HTML.
════════════════════════════════════════════════ */
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc, updateDoc, deleteField, collection, onSnapshot, query, where }
  from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { auth, db, isPro, enPrueba, pruebaCaducada, finPrueba, diasPrueba, textoDiasPrueba, nombrePlan, ADMIN_EMAIL, EMAIL_CONTACTO, ESTADOS_ACTIVOS } from './common.js';

export { auth, db };
export const baseUrl = location.origin + location.pathname.replace(/[^/]+$/, '');

/* ── Toast (disponible en toda página que use este módulo) ── */
window.showToast = function(msg, type){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.className = 'toast ' + (type||'');
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
};

/* ── Menú lateral ──
   Antes cada página tenía su propia copia del menú; ahora se pinta
   desde aquí, así un cambio se aplica en todas a la vez. */
const NAV = [
  { section: 'Operaciones' },
  { href: 'dashboard.html',     icon: '🏠', label: 'Resumen' },
  { href: 'panel-pedidos.html', icon: '⚡', label: 'Pedidos en vivo', badge: 'pedidosBadge' },
  { href: 'panel-avisos.html',  icon: '🔔', label: 'Avisos', badge: 'avisoBadge' },
  { href: 'panel-ventas.html',  icon: '📈', label: 'Ventas', pro: true },
  { section: 'Gestión' },
  { href: 'panel-menu.html',    icon: '📋', label: 'Mi menú' },
  { href: 'panel-mesas.html',   icon: '🪑', label: 'Mesas' },
  { href: 'panel-qr.html',      icon: '⬛', label: 'Códigos QR' },
  { section: 'Equipo' },
  { href: 'panel-equipo.html',  icon: '👥', label: 'Equipo' },
  { href: 'panel-cocina.html',  icon: '🍳', label: 'Pantalla de cocina' },
  { section: 'Cuenta' },
  { href: 'panel-config.html',  icon: '⚙️', label: 'Configuración' },
];

function renderNav(resto) {
  const nav = document.getElementById('sbNav');
  if (!nav) return;
  const current = (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
  const pro = isPro(resto);
  nav.innerHTML = NAV.map(it => {
    if (it.section) return `<div class="sb-section">${it.section}</div>`;
    const active = current === it.href ? ' active' : '';
    const badge = it.badge ? `<span class="sb-badge" id="${it.badge}" style="display:none">0</span>` : '';
    const proTag = it.pro && resto && !pro ? '<span class="sb-pro">PRO</span>' : '';
    const label = it.href === 'panel-cocina.html' && resto && resto.pantalla === 'barra' ? 'Pantalla de barra' : it.label;
    return `<a class="sb-item${active}" href="${it.href}"><span class="sb-icon">${it.icon}</span>${label}${badge}${proTag}</a>`;
  }).join('');
}
renderNav(null); // se pinta ya, sin esperar a Firebase

/* ── Hamburguesa / overlay / logout ── */
function wireSidebarChrome() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const overlay = document.getElementById('overlay');
  const sidebar = document.getElementById('sidebar');
  if (hamburgerBtn && overlay && sidebar) {
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      location.href = 'index.html';
    });
  }
}

/* ── Contadores en vivo (pedidos nuevos + avisos), en toda página ── */
function wireBadges(uid) {
  let nNuevo = 0, nAvisos = 0;
  const paint = () => {
    const pb = document.getElementById('pedidosBadge');
    if (pb) { pb.textContent = nNuevo; pb.style.display = nNuevo > 0 ? 'inline' : 'none'; }
    const ab = document.getElementById('avisoBadge');
    if (ab) { ab.textContent = nAvisos; ab.style.display = nAvisos > 0 ? 'inline' : 'none'; }
    const mb = document.getElementById('mobileBadge');
    if (mb) { const t = nNuevo + nAvisos; mb.textContent = t; mb.style.display = t > 0 ? 'inline' : 'none'; }
  };
  const avisoConexion = () => { window.showToast && window.showToast('⚠️ Conexión inestable', 'error'); };
  onSnapshot(query(collection(db, 'restaurantes', uid, 'pedidos'), where('estado', 'in', ESTADOS_ACTIVOS)), snap => {
    nNuevo = 0;
    snap.forEach(d => { if (d.data().estado === 'nuevo') nNuevo++; });
    paint();
  }, avisoConexion);
  onSnapshot(collection(db, 'restaurantes', uid, 'avisos'), snap => {
    nAvisos = snap.size;
    paint();
  }, avisoConexion);
}

function lockScreen(html) {
  const l = document.getElementById('appLoading');
  if (!l) return;
  l.innerHTML =
    '<img src="./img/cartea.png" alt="Cartéa" style="height:52px;display:block;">' +
    '<div style="color:var(--muted);font-size:.9rem;margin-top:1rem;text-align:center;max-width:320px;line-height:1.6;">' + html + '</div>' +
    '<button id="logoutFromLock" style="margin-top:1.2rem;background:var(--green);color:#fff;border:none;padding:.6rem 1.4rem;border-radius:4px;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:.85rem;font-weight:600;">Cerrar sesión</button>';
  const lb = document.getElementById('logoutFromLock');
  if (lb) lb.addEventListener('click', async () => { await signOut(auth); location.href = 'index.html'; });
}

/**
 * Arranca una página del panel: comprueba sesión, carga datos del
 * restaurante, rellena el nombre/avatar del menú lateral y activa
 * hamburguesa/logout/contadores. Cada página llama a esto y recibe
 * {uid, restoData} para pintar SU propio contenido.
 */
export function initPanel() {
  return new Promise((resolve) => {
    const authTimeout = setTimeout(() => {
      const l = document.getElementById('appLoading');
      if (l) l.innerHTML =
        '<img src="./img/carteablanco.png" alt="Cartéa" style="height:52px;display:block;">' +
        '<div style="color:var(--muted);font-size:.85rem;margin-top:.8rem">Error de conexión — <a href="index.html" style="color:var(--green)">volver al inicio</a></div>';
    }, 12000);

    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      clearTimeout(authTimeout);
      // Sin sesión, o sesión anónima (de haber abierto la carta/cocina): al inicio.
      if (!user || user.isAnonymous) { location.href = 'index.html'; return; }
      const uid = user.uid;

      let snap = null;
      try {
        // Justo después de registrarse el documento puede tardar un poco.
        for (let i = 0; i < 10; i++) {
          snap = await getDoc(doc(db, 'restaurantes', uid));
          if (snap.exists()) break;
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (e) {
        console.error('Firestore:', e);
      }
      if (!snap || !snap.exists()) {
        lockScreen('No encontramos los datos de tu restaurante.<br>Si acabas de registrarte, recarga la página.');
        return;
      }

      const restoData = { uid, ...snap.data() };
      // El email del dueño ya no se guarda en el documento del restaurante
      // (ese documento lo pueden leer los clientes). Se toma de la sesión.
      if ('email' in restoData) updateDoc(doc(db, 'restaurantes', uid), { email: deleteField() }).catch(()=>{});
      restoData.email = user.email || '';

      // Cuenta desactivada (p. ej. pago pendiente): bloquea el acceso al panel.
      if (restoData.activo === false) {
        lockScreen('Tu cuenta está desactivada temporalmente.<br>Escríbenos a <a href="mailto:borjatorresalcala@gmail.com" style="color:var(--green)">borjatorresalcala@gmail.com</a> para reactivarla.');
        return;
      }

      // Mes de prueba terminado: hay que pasar por caja para seguir usando el panel.
      // (La carta de los clientes sigue funcionando para no dejarles tirados en pleno servicio.)
      if (pruebaCaducada(restoData)) {
        const fin = finPrueba(restoData).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        const asunto = encodeURIComponent('Quiero seguir con Cartéa – ' + (restoData.nombre || ''));
        lockScreen('Tu mes de prueba de Cartéa terminó el <b>' + fin + '</b>.<br>¡Gracias por probarlo! Para seguir usándolo, escríbenos y te lo activamos en el día.' +
          '<br><a href="mailto:' + EMAIL_CONTACTO + '?subject=' + asunto + '" style="display:inline-block;margin-top:1rem;background:var(--gold);color:#0f0e0b;padding:.6rem 1.2rem;border-radius:4px;font-weight:700;text-decoration:none">Quiero seguir →</a>');
        return;
      }

      const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setText('sidebarNombre', restoData.nombre);
      setText('sbPersona', restoData.persona || restoData.nombre);
      const initials = (restoData.persona || restoData.nombre || 'X').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
      setText('sbAvatar', initials);
      const roleEl = document.querySelector('.sb-user-role');
      if (roleEl) roleEl.innerHTML = 'Administrador · ' + (isPro(restoData) ? '<b style="color:var(--gold-l)">' + nombrePlan(restoData) + '</b>' : nombrePlan(restoData));
      // Aviso fino arriba durante la prueba
      if (enPrueba(restoData)) {
        const main = document.querySelector('.main .page');
        if (main && !document.getElementById('bannerPrueba')) {
          const b = document.createElement('div');
          b.id = 'bannerPrueba';
          b.style.cssText = 'background:var(--gold-bg);border:1px solid rgba(200,150,62,.35);border-radius:6px;padding:.6rem .9rem;margin-bottom:1rem;font-size:.8rem;line-height:1.5';
          b.innerHTML = '⭐ Estás probando <b>Cartéa Pro gratis</b>: <b>' + (diasPrueba(restoData) === 0 ? 'hoy es el último día' : 'te ' + textoDiasPrueba(restoData)) + '</b> (hasta el ' + finPrueba(restoData).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) + ').';
          main.prepend(b);
        }
      }

      const pageName = document.title.split('–').pop().trim();
      document.title = 'Cartéa – ' + (pageName && pageName !== 'Cartéa' ? pageName : restoData.nombre);

      renderNav(restoData);
      // Enlace al panel de administración solo para ti
      if (user.email === ADMIN_EMAIL) {
        const nav = document.getElementById('sbNav');
        if (nav && !document.getElementById('navAdmin')) nav.insertAdjacentHTML('beforeend', '<div class="sb-section">Cartéa</div><a class="sb-item" id="navAdmin" href="admin.html"><span class="sb-icon">🛠️</span>Clientes (admin)</a>');
      }

      const loader = document.getElementById('appLoading');
      if (loader) { loader.classList.add('hide'); setTimeout(() => loader.remove(), 400); }

      wireSidebarChrome();
      wireBadges(uid);

      resolve({ uid, restoData, db, auth, baseUrl });
    });
  });
}
