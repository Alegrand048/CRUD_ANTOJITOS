import { buscarPorCredenciales, registrarUsuario } from "../services/userStorage";

export async function controlLogin({ usuario, clave }) {
  if (!usuario || !clave) {
    return { ok: false, error: "Completa todos los campos" };
  }

  const usuarioEncontrado = await buscarPorCredenciales(usuario, clave);
  if (!usuarioEncontrado) {
    return { ok: false, error: "Usuario o clave incorrectos" };
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

  const resultado = await registrarUsuario({ usuario, correo, clave, foto });
  if (!resultado.ok) {
    return { ok: false, error: resultado.error };
  }

  return { ok: true, usuario: resultado.usuario };
}