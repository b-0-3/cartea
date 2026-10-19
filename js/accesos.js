/* ════════════════════════════════════════════════
   ACCESOS DEL EQUIPO (solo lo usa el panel del dueño)

   Cómo funciona el PIN, explicado fácil:
   - Antes, la pantalla del equipo descargaba la lista ENTERA de
     trabajadores (con PINs y sueldos) y comparaba el PIN en el móvil.
     Cualquiera con el enlace podía ver esa lista.
   - Ahora, por cada trabajador se guarda una "huella" del PIN
     (restaurantes/{id}/accesos/{huella} → { wid }). Quien teclea un PIN
     calcula su huella y pregunta "¿existe esta?". Si existe, entra.
     La lista completa solo la puede ver el dueño.

   Esta función deja las huellas al día. Se llama al abrir el
   resumen y la página de equipo, así que se arregla sola.
════════════════════════════════════════════════ */
import { collection, getDocs, writeBatch, doc }
  from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { db, pinHash } from './common.js';

export async function sincronizarAccesos(uid, trabajadores) {
  const accesosRef = collection(db, 'restaurantes', uid, 'accesos');
  let lista = trabajadores;
  if (!lista) {
    const snap = await getDocs(collection(db, 'restaurantes', uid, 'trabajadores'));
    lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  const aSnap = await getDocs(accesosRef);

  const esperado = new Map(); // huella → id del trabajador
  for (const w of lista) {
    if (w.pin && /^\d{4}$/.test(String(w.pin))) esperado.set(await pinHash(uid, String(w.pin)), w.id);
  }
  const actual = new Map();
  aSnap.forEach(d => actual.set(d.id, d.data().wid));

  const batch = writeBatch(db);
  let cambios = 0;
  for (const [h, wid] of esperado) {
    if (actual.get(h) !== wid) { batch.set(doc(accesosRef, h), { wid }); cambios++; }
  }
  for (const h of actual.keys()) {
    if (!esperado.has(h)) { batch.delete(doc(accesosRef, h)); cambios++; }
  }
  if (cambios) await batch.commit();
  return cambios;
}
