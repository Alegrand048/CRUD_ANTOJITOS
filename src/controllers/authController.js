import { buscarPorCredenciales, buscarPorLogin, registrarUsuario } from "../services/userStorage";

export async function controlLogin({ usuario, clave }) {
  if (!usuario || !clave) {
    return { ok: false, error: "Completa todos los campos" };
  }

  const usuarioEncontrado = await buscarPorLogin(usuario);
  if (!usuarioEncontrado) {
    return { ok: false, error: "Ese usuario no tiene cuenta. Registrate primero" };
  }

  if (usuarioEncontrado.clave !== clave) {
    return { ok: false, error: "La clave es incorrecta" };
  }

  return { ok: true, usuario: usuarioEncontrado };
}

export async function controlRegistro({ usuario, correo, clave, clave2, foto }) {
  if (!usuario || !correo || !clave || !clave2) {
    return { ok: false, error: "Completa todos los campos" };
  }
  if (clave !== clave2) {
    return { ok: false, error: "Las claves no coinciden" };
  }

  const { ok, error, usuario: nuevoUsuario } = await registrarUsuario({ usuario, correo, clave, foto });
  if (!ok) {
    if (error && error.includes("usuario")) {
      return { ok: false, error: "Ese usuario ya tiene cuenta. Inicia sesion" };
    }
    return { ok: false, error };
  }

  return { ok: true, usuario: nuevoUsuario };
}