import { useEffect, useRef, useState } from "react";
import "../styles/Menu.css";
import { obtenerSesion } from "../services/authSession";
import { obtenerProductos, reiniciarProductos, guardarProductos } from "../services/productStorage";

const formVacio = {
  nombre: "",
  precio: "",
  descripcion: "",
  img: "",
};

const MAX_LADO = 960;
const MAX_BYTES = 220 * 1024;

function bytesDataUrl(dataUrl) {
  const b64 = String(dataUrl).split(",")[1] || "";
  return Math.ceil((b64.length * 3) / 4);
}

function esImagenBase64(valor) {
  return typeof valor === "string" && valor.startsWith("data:image/");
}

function sacarDataUrl(canvas, objetivo, calidades) {
  let salida = canvas.toDataURL("image/webp", calidades[0]);
  for (const q of calidades) {
    const intento = canvas.toDataURL("image/webp", q);
    salida = intento;
    if (bytesDataUrl(intento) <= objetivo) {
      break;
    }
  }
  if (!salida.startsWith("data:image/webp")) {
    salida = canvas.toDataURL("image/jpeg", 0.72);
  }
  return salida;
}

function comprimirDataUrl(dataUrl, config = {}) {
  const {
    maxLado = MAX_LADO,
    maxBytes = MAX_BYTES,
    calidades = [0.82, 0.72, 0.62, 0.52, 0.42],
  } = config;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const escala = Math.min(1, maxLado / Math.max(w, h));
      const w2 = Math.max(1, Math.round(w * escala));
      const h2 = Math.max(1, Math.round(h * escala));
      const canvas = document.createElement("canvas");
      canvas.width = w2;
      canvas.height = h2;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }

      ctx.drawImage(img, 0, 0, w2, h2);
      resolve(sacarDataUrl(canvas, maxBytes, calidades));
    };

    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = dataUrl;
  });
}

async function recomprimirLista(lista, config) {
  return Promise.all(
    lista.map(async (p) => {
      if (!esImagenBase64(p.img)) {
        return p;
      }
      try {
        const nuevaImg = await comprimirDataUrl(p.img, config);
        return { ...p, img: nuevaImg };
      } catch {
        return p;
      }
    })
  );
}

function limpiarImagenes(lista, idProtegido, imgDefault) {
  let protegido = false;
  return lista.map((p) => {
    if (!esImagenBase64(p.img)) {
      return p;
    }
    if (p.id === idProtegido && !protegido) {
      protegido = true;
      return p;
    }
    return { ...p, img: imgDefault };
  });
}

async function guardarConRescate(productos, idProtegido, imgDefault) {
  try {
    await guardarProductos(productos);
    return { nivel: 0 };
  } catch (e) {
    if (e?.name !== "QuotaExceededError") {
      throw e;
    }
  }

  const planes = [
    { maxLado: 640, maxBytes: 90 * 1024, calidades: [0.64, 0.56, 0.48, 0.4] },
    { maxLado: 420, maxBytes: 40 * 1024, calidades: [0.5, 0.42, 0.34, 0.28] },
  ];

  let candidato = productos;
  for (let i = 0; i < planes.length; i += 1) {
    candidato = await recomprimirLista(candidato, planes[i]);
    try {
      await guardarProductos(candidato);
      return { nivel: i + 1 };
    } catch (e) {
      if (e?.name !== "QuotaExceededError") {
        throw e;
      }
    }
  }

  const limpio = limpiarImagenes(candidato, idProtegido, imgDefault);
  await guardarProductos(limpio);
  return { nivel: 3 };
}

function comprimirArchivo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const escala = Math.min(1, MAX_LADO / Math.max(w, h));
      const w2 = Math.max(1, Math.round(w * escala));
      const h2 = Math.max(1, Math.round(h * escala));

      const canvas = document.createElement("canvas");
      canvas.width = w2;
      canvas.height = h2;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }

      ctx.drawImage(img, 0, 0, w2, h2);
      const data = sacarDataUrl(canvas, MAX_BYTES, [0.82, 0.72, 0.62, 0.52, 0.42]);
      URL.revokeObjectURL(url);
      resolve(data);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = url;
  });
}

export default function Menu() {
  const [productos, setProductos] = useState([]);
  const [sesion, setSesion] = useState(() => obtenerSesion());
  const [form, setForm] = useState(formVacio);
  const [idEditando, setIdEditando] = useState(null);
  const [cargandoImagen, setCargandoImagen] = useState(false);
  const [msg, setMsg] = useState({ tipo: "", texto: "" });
  const fileRef = useRef(null);

  useEffect(() => {
    const cargar = async () => {
      const lista = await obtenerProductos();
      setProductos(lista);
    };
    const sincSesion = () => setSesion(obtenerSesion());

    cargar();
    window.addEventListener("products-updated", cargar);
    window.addEventListener("storage", cargar);
    window.addEventListener("session-updated", sincSesion);
    window.addEventListener("storage", sincSesion);

    return () => {
      window.removeEventListener("products-updated", cargar);
      window.removeEventListener("storage", cargar);
      window.removeEventListener("session-updated", sincSesion);
      window.removeEventListener("storage", sincSesion);
    };
  }, []);

  const limpiarInputFile = () => {
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const resetearForm = () => {
    setForm(formVacio);
    setIdEditando(null);
    setCargandoImagen(false);
    limpiarInputFile();
  };

  const cambiar = (e) => {
    setMsg({ tipo: "", texto: "" });
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clickFile = (e) => {
    e.currentTarget.value = "";
  };

  const cambiarImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setCargandoImagen(true);
    setMsg({ tipo: "", texto: "" });

    try {
      const img = await comprimirArchivo(file);
      setForm((prev) => ({ ...prev, img }));
    } catch {
      setMsg({ tipo: "error", texto: "No se pudo procesar la imagen" });
    } finally {
      setCargandoImagen(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setMsg({ tipo: "", texto: "" });

    if (!sesion.esAdmin) {
      return;
    }

    if (cargandoImagen) {
      setMsg({ tipo: "error", texto: "La imagen todavia se esta cargando" });
      return;
    }

    if (!form.nombre.trim() || !form.precio || !form.img) {
      setMsg({ tipo: "error", texto: "Completa nombre, precio e imagen" });
      return;
    }

    const precioNum = Number(form.precio);
    if (!Number.isFinite(precioNum) || precioNum <= 0) {
      setMsg({ tipo: "error", texto: "Precio invalido" });
      return;
    }

    const prod = {
      id: idEditando ?? Date.now(),
      nombre: form.nombre.trim(),
      precio: precioNum,
      descripcion: form.descripcion.trim(),
      img: form.img,
    };

    const actuales = await obtenerProductos();
    const lista = idEditando
      ? actuales.map((p) => (p.id === idEditando ? prod : p))
      : [...actuales, prod];

    const imgDefault = actuales.find((p) => !esImagenBase64(p.img))?.img || "";

    try {
      const { nivel } = await guardarConRescate(lista, prod.id, imgDefault);
      resetearForm();

      if (nivel === 3) {
        setMsg({ tipo: "success", texto: "Guardado y se limpiaron imagenes antiguas" });
      } else {
        setMsg({ tipo: "success", texto: idEditando ? "Producto actualizado" : "Producto creado" });
      }
    } catch {
      setMsg({ tipo: "error", texto: "No se pudo guardar el producto" });
    }
  };

  const editar = (p) => {
    setMsg({ tipo: "", texto: "" });
    setIdEditando(p.id);
    setForm({
      nombre: p.nombre,
      precio: String(p.precio),
      descripcion: p.descripcion || "",
      img: p.img,
    });
    limpiarInputFile();
  };

  const borrar = async (id) => {
    if (!sesion.esAdmin) {
      return;
    }

    const actuales = await obtenerProductos();
    const lista = actuales.filter((p) => p.id !== id);

    try {
      await guardarProductos(lista);
      setMsg({ tipo: "success", texto: "Producto eliminado" });
    } catch {
      setMsg({ tipo: "error", texto: "No se pudo eliminar" });
      return;
    }

    if (idEditando === id) {
      resetearForm();
    }
  };

  const restaurarBase = async () => {
    await reiniciarProductos();
    resetearForm();
    setMsg({ tipo: "success", texto: "Productos restaurados" });
  };

  return (
    <div className="menu-page">
      <div className="menu-header">
        <h1>Menu de productos</h1>
        <p>Catalogo actual de Antojitos</p>
      </div>

      {sesion.esAdmin ? (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Panel admin</h2>
              <p>Sesion activa: {sesion.usuario}</p>
              {idEditando ? <p className="editing-indicator">Editando producto: {form.nombre || "sin nombre"}</p> : null}
            </div>
            <button type="button" className="secondary-btn" onClick={restaurarBase}>
              Restaurar productos base
            </button>
          </div>

          {msg.texto ? (
            <p className={`menu-feedback ${msg.tipo === "error" ? "menu-feedback-error" : "menu-feedback-success"}`}>
              {msg.texto}
            </p>
          ) : null}

          <form className="product-form" onSubmit={guardar}>
            <input type="text" name="nombre" placeholder="Nombre" value={form.nombre} onChange={cambiar} />
            <input type="number" min="0" step="0.01" name="precio" placeholder="Precio" value={form.precio} onChange={cambiar} />
            <input type="text" name="descripcion" placeholder="Descripcion" value={form.descripcion} onChange={cambiar} />
            <input ref={fileRef} type="file" accept="image/*" onClick={clickFile} onChange={cambiarImagen} />

            <div className="product-form-actions">
              <button type="submit" disabled={cargandoImagen}>
                {cargandoImagen ? "Cargando imagen" : idEditando ? "Guardar cambios" : "Anadir producto"}
              </button>
              {idEditando ? (
                <button type="button" className="secondary-btn" onClick={resetearForm}>Cancelar edicion</button>
              ) : null}
            </div>
          </form>
        </section>
      ) : (
        <section className="menu-info-card">
          <p>Inicia sesion como admin para gestionar productos</p>
        </section>
      )}

      <div className="menu-grid">
        {productos.map((p) => (
          <article className="menu-card" key={p.id}>
            <div className="menu-card-image"><img src={p.img} alt={p.nombre} /></div>
            <div className="menu-card-body"><h3>{p.nombre}</h3><p>{p.precio}€</p></div>
            {sesion.esAdmin ? (
              <div className="menu-card-actions">
                <button type="button" onClick={() => editar(p)}>Editar</button>
                <button type="button" className="danger-btn" onClick={() => borrar(p.id)}>Eliminar</button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
