import fotoDefault from "../assets/Avatar.png";
import usuariosPorDefecto from "../data/users.json";

const URL_API = "http://localhost:3001/users";
let promesaUsuarios = null;

function avisoApi(enLinea) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("api-status", { detail: { isOnline: enLinea } }));
}

function normalizarUsuarios(lista) {
  return lista.map((u) => ({
    id: Number(u.id),
    usuario: String(u.user || u.usuario || "").trim(),
    correo: String(u.email || u.correo || "").trim().toLowerCase(),
    clave: String(u.pass || u.clave || ""),
    foto: u.foto || (u.avatar && u.avatar !== "default" ? u.avatar : fotoDefault),
    esAdmin: Boolean(u.esAdmin || u.isAdmin),
  }));
}

function obtenerUsuariosBase() {
  return normalizarUsuarios(usuariosPorDefecto);
}

function quitarDuplicadosUsuarios(lista) {
  const vistos = new Set();
  const resultado = [];

  for (const u of lista) {
    const clave = `${u.usuario.toLowerCase()}|${u.correo.toLowerCase()}`;
    if (vistos.has(clave)) {
      continue;
    }
    vistos.add(clave);
    resultado.push(u);
  }

  return resultado;
}

async function leerUsuariosApi() {
  const resultado = await fetch(URL_API);
  if (!resultado.ok) {
    throw new Error("No se pudo leer la API de usuarios");
  }

  const lista = await resultado.json();
  avisoApi(true);
  return normalizarUsuarios(Array.isArray(lista) ? lista : []);
}

async function eliminarUsuarioApi(id) {
  const resultado = await fetch(`${URL_API}/${id}`, { method: "DELETE" });
  if (!resultado.ok) {
    throw new Error("No se pudo borrar el usuario");
  }
}

async function crearUsuarioApi(u) {
  const resultado = await fetch(URL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(u),
  });

  if (!resultado.ok) {
    throw new Error("No se pudo guardar el usuario");
  }

  const nuevo = await resultado.json();
  avisoApi(true);
  return nuevo;
}

async function reemplazarUsuariosApi(lista) {
  const existentes = await leerUsuariosApi();

  for (const u of existentes) {
    await eliminarUsuarioApi(u.id);
  }

  const creados = [];
  for (const u of lista) {
    const nuevo = await crearUsuarioApi(u);
    creados.push(nuevo);
  }

  return normalizarUsuarios(creados);
}

async function asegurarUsuarios() {
  if (promesaUsuarios) {
    await promesaUsuarios;
    return leerUsuariosApi();
  }

  promesaUsuarios = (async () => {
    const lista = await leerUsuariosApi();
    if (lista.length === 0) {
      await reemplazarUsuariosApi(obtenerUsuariosBase());
      return;
    }

    const limpio = quitarDuplicadosUsuarios(lista);
    if (limpio.length !== lista.length) {
      await reemplazarUsuariosApi(limpio);
    }
  })();

  try {
    await promesaUsuarios;
  } finally {
    promesaUsuarios = null;
  }

  return leerUsuariosApi();
}

export async function obtenerUsuarios() {
  try {
    return await asegurarUsuarios();
  } catch {
    avisoApi(false);
    return obtenerUsuariosBase();
  }
}

export async function obtenerAdministrador() {
  const usuarios = await obtenerUsuarios();
  return usuarios.find((u) => u.esAdmin) || obtenerUsuariosBase()[0];
}

export async function buscarPorLogin(valor) {
  const usuarios = await obtenerUsuarios();
  const normalizado = String(valor || "").trim().toLowerCase();

  return usuarios.find(
    (u) => u.usuario.toLowerCase() === normalizado || u.correo.toLowerCase() === normalizado
  );
}

export async function buscarPorCredenciales(valor, clave) {
  const u = await buscarPorLogin(valor);
  if (!u || u.clave !== clave) {
    return null;
  }

  return u;
}

export async function registrarUsuario({ usuario, correo, clave, foto, esAdmin = false }) {
  const usuarios = await obtenerUsuarios();
  const nombreNormalizado = String(usuario || "").trim();
  const correoNormalizado = String(correo || "").trim().toLowerCase();

  const existe = usuarios.some(
    (u) =>
      u.usuario.toLowerCase() === nombreNormalizado.toLowerCase() ||
      u.correo.toLowerCase() === correoNormalizado
  );

  if (existe) {
    return { ok: false, error: "Ya existe un usuario con ese nombre o correo" };
  }

  const nuevoUsuario = {
    id: Date.now(),
    usuario: nombreNormalizado,
    correo: correoNormalizado,
    clave: String(clave || ""),
    foto: foto || fotoDefault,
    esAdmin: Boolean(esAdmin),
  };

  try {
    const creado = await crearUsuarioApi(nuevoUsuario);
    window.dispatchEvent(new Event("users-updated"));
    return { ok: true, usuario: normalizarUsuarios([creado])[0] };
  } catch {
    avisoApi(false);
    return { ok: false, error: "No se pudo guardar el usuario, prueba con una foto mas pequena" };
  }
}

export async function crearUsuarioAdmin({ usuario, correo, clave, foto, esAdmin = false }) {
  const nombreNormalizado = String(usuario || "").trim();
  const correoNormalizado = String(correo || "").trim().toLowerCase();
  const claveNormalizada = String(clave || "");

  if (!nombreNormalizado || !correoNormalizado || !claveNormalizada) {
    return { ok: false, error: "Nombre, correo y clave son obligatorios" };
  }

  return registrarUsuario({
    usuario: nombreNormalizado,
    correo: correoNormalizado,
    clave: claveNormalizada,
    foto,
    esAdmin: Boolean(esAdmin),
  });
}

export async function actualizarUsuarioAdmin(idUsuario, valores) {
  const usuarios = await obtenerUsuarios();
  const idTarget = Number(idUsuario);
  const actual = usuarios.find((u) => Number(u.id) === idTarget);

  if (!actual) {
    return { ok: false, error: "Usuario no encontrado" };
  }

  const nombreNormalizado = String(valores?.usuario ?? actual.usuario).trim();
  const correoNormalizado = String(valores?.correo ?? actual.correo).trim().toLowerCase();
  const claveNormalizada = String(valores?.clave ?? "");
  const esAdminNuevo = Boolean(valores?.esAdmin ?? actual.esAdmin);
  const fotoNueva = valores?.foto || actual.foto || fotoDefault;

  if (!nombreNormalizado || !correoNormalizado) {
    return { ok: false, error: "Nombre y correo son obligatorios" };
  }

  const existe = usuarios.some(
    (u) =>
      Number(u.id) !== idTarget &&
      (u.usuario.toLowerCase() === nombreNormalizado.toLowerCase() ||
        u.correo.toLowerCase() === correoNormalizado)
  );

  if (existe) {
    return { ok: false, error: "Ya existe otro usuario con ese nombre o correo" };
  }

  if (actual.esAdmin && !esAdminNuevo) {
    const admins = usuarios.filter((u) => u.esAdmin);
    if (admins.length <= 1) {
      return { ok: false, error: "Debe existir al menos una cuenta admin" };
    }
  }

  const actualizado = {
    ...actual,
    usuario: nombreNormalizado,
    correo: correoNormalizado,
    clave: claveNormalizada ? claveNormalizada : actual.clave,
    foto: fotoNueva,
    esAdmin: esAdminNuevo,
  };

  try {
    const resultado = await fetch(`${URL_API}/${idTarget}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actualizado),
    });

    if (!resultado.ok) {
      return { ok: false, error: "No se pudieron guardar los cambios" };
    }

    const usuarioGuardado = await resultado.json();
    avisoApi(true);
    window.dispatchEvent(new Event("users-updated"));
    return { ok: true, usuario: normalizarUsuarios([usuarioGuardado])[0] };
  } catch {
    avisoApi(false);
    return { ok: false, error: "No se pudieron guardar los cambios" };
  }
}

export async function eliminarUsuarioAdmin(idUsuario) {
  const usuarios = await obtenerUsuarios();
  const idTarget = Number(idUsuario);
  const target = usuarios.find((u) => Number(u.id) === idTarget);

  if (!target) {
    return { ok: false, error: "Usuario no encontrado" };
  }

  if (target.esAdmin) {
    const admins = usuarios.filter((u) => u.esAdmin);
    if (admins.length <= 1) {
      return { ok: false, error: "No puedes borrar el ultimo admin" };
    }
  }

  try {
    await eliminarUsuarioApi(idTarget);

    avisoApi(true);
    window.dispatchEvent(new Event("users-updated"));
    return { ok: true };
  } catch {
    avisoApi(false);
    return { ok: false, error: "No se pudo borrar el usuario" };
  }
}

export async function reiniciarUsuarios() {
  try {
    await reemplazarUsuariosApi(obtenerUsuariosBase());
    window.dispatchEvent(new Event("users-updated"));
    avisoApi(true);
    return { ok: true };
  } catch {
    avisoApi(false);
    return { ok: false, error: "No se pudo restaurar la base de usuarios" };
  }
}

export async function resetUsers() {
  return reiniciarUsuarios();
}
