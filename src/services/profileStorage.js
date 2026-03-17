import defaultAvatar from "../assets/Avatar.png";

const CLAVE_PERFIL = "antojitosProfile";

const perfilDefault = {
  nombre: "Alejandro",
  foto: defaultAvatar,
};

export function obtenerPerfil() {
  if (typeof window === "undefined") {
    return perfilDefault;
  }

  try {
    const datos = window.localStorage.getItem(CLAVE_PERFIL);
    if (!datos) {
      return perfilDefault;
    }

    const guardado = JSON.parse(datos);
    return {
      nombre: guardado?.nombre || guardado?.name || perfilDefault.nombre,
      foto: guardado?.foto || guardado?.avatar || perfilDefault.foto,
    };
  } catch {
    return perfilDefault;
  }
}

export function guardarPerfil({ nombre, foto }) {
  if (typeof window === "undefined") {
    return;
  }

  const nuevoPerfil = {
    nombre: nombre || perfilDefault.nombre,
    foto: foto || perfilDefault.foto,
  };

  window.localStorage.setItem(CLAVE_PERFIL, JSON.stringify(nuevoPerfil));
  window.dispatchEvent(new Event("profile-updated"));
}

export function reiniciarPerfil() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CLAVE_PERFIL);
  window.dispatchEvent(new Event("profile-updated"));
}
