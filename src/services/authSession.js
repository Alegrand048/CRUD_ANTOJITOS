const CLAVE_SESION = "antojitosSession";
const NOMBRE_ADMIN = "Alejandro";

function normalizarNombre(nombre) {
  return String(nombre || "").trim().toLowerCase();
}

export function esNombreAdmin(nombre) {
  return normalizarNombre(nombre) === normalizarNombre(NOMBRE_ADMIN);
}

export function obtenerSesion() {
  if (typeof window === "undefined") {
    return { estaLogueado: false, usuario: "", esAdmin: false, foto: "", correo: "", idUsuario: null };
  }

  try {
    const datos = window.localStorage.getItem(CLAVE_SESION);
    if (!datos) {
      return { estaLogueado: false, usuario: "", esAdmin: false, foto: "", correo: "", idUsuario: null };
    }

    const guardado = JSON.parse(datos);
    const usuario = guardado?.usuario || "";

    return {
      estaLogueado: Boolean(guardado?.estaLogueado),
      idUsuario: guardado?.idUsuario ?? null,
      usuario,
      correo: guardado?.correo || "",
      foto: guardado?.foto || "",
      esAdmin: guardado?.esAdmin ?? esNombreAdmin(usuario),
    };
  } catch {
    return { estaLogueado: false, usuario: "", esAdmin: false, foto: "", correo: "", idUsuario: null };
  }
}

export function guardarSesion(usuario) {
  if (typeof window === "undefined") {
    return false;
  }

  const nombreUsuario = typeof usuario === "string" ? usuario : usuario?.usuario || usuario?.user || "";
  const sesion = {
    estaLogueado: true,
    usuario: nombreUsuario,
    idUsuario: typeof usuario === "object" ? usuario?.id ?? null : null,
    correo: typeof usuario === "object" ? usuario?.correo || usuario?.email || "" : "",
    foto: typeof usuario === "object" ? usuario?.foto || usuario?.avatar || "" : "",
    esAdmin: typeof usuario === "object" ? Boolean(usuario?.esAdmin || usuario?.isAdmin) : esNombreAdmin(nombreUsuario),
  };

  try {
    window.localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    window.dispatchEvent(new Event("session-updated"));
    return true;
  } catch {
    try {
      const sesionCompacta = { ...sesion, foto: "" };
      window.localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionCompacta));
      window.dispatchEvent(new Event("session-updated"));
      return true;
    } catch {
      return false;
    }
  }
}

export function limpiarSesion() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CLAVE_SESION);
  window.dispatchEvent(new Event("session-updated"));
}
