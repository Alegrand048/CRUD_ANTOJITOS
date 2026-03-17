import productosPorDefecto from "../models/Productos";

const URL_API = "http://localhost:3001/products";
let promesaProductos = null;

function avisoApi(enLinea) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("api-status", { detail: { isOnline: enLinea } }));
}

function normalizarProductos(lista) {
  return lista.map((p) => ({
    id: Number(p.id),
    nombre: String(p.nombre || ""),
    precio: Number(p.precio),
    descripcion: String(p.descripcion || ""),
    img: String(p.img || ""),
  }));
}

function quitarDuplicados(lista) {
  const vistos = new Set();
  const resultado = [];

  for (const p of lista) {
    const clave = Number(p.id);
    if (vistos.has(clave)) {
      continue;
    }
    vistos.add(clave);
    resultado.push(p);
  }

  return resultado;
}

async function leerProductosApi() {
  const resultado = await fetch(URL_API);
  if (!resultado.ok) {
    throw new Error("No se pudo leer la API de productos");
  }

  const lista = await resultado.json();
  avisoApi(true);
  return normalizarProductos(Array.isArray(lista) ? lista : []);
}

async function eliminarProductoApi(id) {
  const resultado = await fetch(`${URL_API}/${id}`, { method: "DELETE" });
  if (!resultado.ok) {
    throw new Error("No se pudo borrar el producto");
  }
}

async function crearProductoApi(p) {
  const resultado = await fetch(URL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });

  if (!resultado.ok) {
    throw new Error("No se pudo guardar el producto");
  }

  const nuevo = await resultado.json();
  avisoApi(true);
  return nuevo;
}

async function reemplazarProductosApi(lista) {
  const existentes = await leerProductosApi();

  for (const p of existentes) {
    await eliminarProductoApi(p.id);
  }

  const creados = [];
  for (const p of normalizarProductos(lista)) {
    const nuevo = await crearProductoApi(p);
    creados.push(nuevo);
  }

  return normalizarProductos(creados);
}

async function asegurarProductos() {
  if (promesaProductos) {
    await promesaProductos;
    return leerProductosApi();
  }

  promesaProductos = (async () => {
    const lista = await leerProductosApi();
    if (lista.length === 0) {
      await reemplazarProductosApi(productosPorDefecto);
      return;
    }

    const limpio = quitarDuplicados(lista);
    if (limpio.length !== lista.length) {
      await reemplazarProductosApi(limpio);
    }
  })();

  try {
    await promesaProductos;
  } finally {
    promesaProductos = null;
  }

  return leerProductosApi();
}

export async function obtenerProductos() {
  try {
    return await asegurarProductos();
  } catch {
    avisoApi(false);
    return productosPorDefecto;
  }
}

export async function guardarProductos(lista) {
  const existentes = await leerProductosApi();
  const nuevos = normalizarProductos(lista);

  const idsNuevos = new Set(nuevos.map((p) => Number(p.id)));
  const idsExistentes = new Set(existentes.map((p) => Number(p.id)));

  for (const p of nuevos) {
    const id = Number(p.id);
    const metodo = idsExistentes.has(id) ? "PUT" : "POST";
    const url = metodo === "PUT" ? `${URL_API}/${id}` : URL_API;

    const resultado = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });

    if (!resultado.ok) {
      throw new Error("No se pudo guardar el producto");
    }

    avisoApi(true);
  }

  for (const p of existentes) {
    const id = Number(p.id);
    if (idsNuevos.has(id)) {
      continue;
    }

    await eliminarProductoApi(id);
  }

  window.dispatchEvent(new Event("products-updated"));
}

export async function reiniciarProductos() {
  await reemplazarProductosApi(productosPorDefecto);
  window.dispatchEvent(new Event("products-updated"));
}
