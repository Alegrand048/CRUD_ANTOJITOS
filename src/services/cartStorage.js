const CLAVE_CESTA = "antojitosCart";

function normalizarCantidad(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) {
    return 1;
  }
  return Math.max(1, Math.floor(n));
}

function normalizarItem(item) {
  return {
    id: Number(item.id),
    nombre: String(item.nombre || ""),
    precio: Number(item.precio) || 0,
    img: String(item.img || ""),
    cantidad: normalizarCantidad(item.cantidad),
  };
}

function notificarCesta() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event("cart-updated"));
}

export function obtenerCesta() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const datos = window.localStorage.getItem(CLAVE_CESTA);
    if (!datos) {
      return [];
    }

    const lista = JSON.parse(datos);
    if (!Array.isArray(lista)) {
      return [];
    }

    return lista
      .map(normalizarItem)
      .filter((item) => Number.isFinite(item.id) && item.id > 0);
  } catch {
    return [];
  }
}

export function guardarCesta(lista) {
  if (typeof window === "undefined") {
    return;
  }

  const limpia = Array.isArray(lista) ? lista.map(normalizarItem) : [];
  window.localStorage.setItem(CLAVE_CESTA, JSON.stringify(limpia));
  notificarCesta();
}

export function contarUnidadesCesta() {
  return obtenerCesta().reduce((acc, item) => acc + normalizarCantidad(item.cantidad), 0);
}

export function anadirACesta(producto, cantidad = 1) {
  const id = Number(producto?.id);
  if (!Number.isFinite(id) || id <= 0) {
    return;
  }

  const cesta = obtenerCesta();
  const incremento = normalizarCantidad(cantidad);
  const index = cesta.findIndex((item) => Number(item.id) === id);

  if (index >= 0) {
    cesta[index] = {
      ...cesta[index],
      cantidad: normalizarCantidad(cesta[index].cantidad + incremento),
    };
  } else {
    cesta.push(normalizarItem({ ...producto, cantidad: incremento }));
  }

  guardarCesta(cesta);
}

export function cambiarCantidadCesta(idProducto, cantidad) {
  const id = Number(idProducto);
  if (!Number.isFinite(id) || id <= 0) {
    return;
  }

  const qty = Number(cantidad);
  if (!Number.isFinite(qty) || qty <= 0) {
    eliminarDeCesta(id);
    return;
  }

  const cesta = obtenerCesta().map((item) => (
    Number(item.id) === id ? { ...item, cantidad: normalizarCantidad(qty) } : item
  ));

  guardarCesta(cesta);
}

export function eliminarDeCesta(idProducto) {
  const id = Number(idProducto);
  if (!Number.isFinite(id) || id <= 0) {
    return;
  }

  const cesta = obtenerCesta().filter((item) => Number(item.id) !== id);
  guardarCesta(cesta);
}

export function vaciarCesta() {
  guardarCesta([]);
}
