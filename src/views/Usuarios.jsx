import { useEffect, useState } from "react";
import "../styles/Usuarios.css";
import { obtenerSesion } from "../services/authSession";
import {
  crearUsuarioAdmin,
  eliminarUsuarioAdmin,
  obtenerUsuarios,
  reiniciarUsuarios,
  actualizarUsuarioAdmin,
} from "../services/userStorage";
import { reiniciarProductos } from "../services/productStorage";

function cargarImagen(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = dataUrl;
  });
}

async function comprimirFoto(dataUrl) {
  const img = await cargarImagen(dataUrl);
  const maxLado = 400;
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
    throw new Error("No se pudo procesar la imagen");
  }

  ctx.drawImage(img, 0, 0, w2, h2);
  return canvas.toDataURL("image/jpeg", 0.72);
}

const formVacio = {
  usuario: "",
  correo: "",
  clave: "",
  foto: "",
  esAdmin: false,
};

export default function Usuarios() {
  const [sesion, setSesion] = useState(() => obtenerSesion());
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [idEditando, setIdEditando] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const lista = await obtenerUsuarios();
        setUsuarios(lista);
      } catch {
        setError("No se pudo leer la API de usuarios");
      }
    };
    const sincSesion = () => setSesion(obtenerSesion());

    cargar();
    window.addEventListener("users-updated", cargar);
    window.addEventListener("storage", cargar);
    window.addEventListener("session-updated", sincSesion);
    window.addEventListener("storage", sincSesion);

    return () => {
      window.removeEventListener("users-updated", cargar);
      window.removeEventListener("storage", cargar);
      window.removeEventListener("session-updated", sincSesion);
      window.removeEventListener("storage", sincSesion);
    };
  }, []);

  const resetForm = () => {
    setForm(formVacio);
    setIdEditando(null);
  };

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setError("");
    setOk("");
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const cambiarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const raw = String(reader.result || "");
      try {
        const comprimida = await comprimirFoto(raw);
        setForm((prev) => ({ ...prev, foto: comprimida }));
      } catch {
        setForm((prev) => ({ ...prev, foto: raw }));
      }
    };
    reader.readAsDataURL(file);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    const carga = {
      usuario: form.usuario.trim(),
      correo: form.correo.trim(),
      clave: form.clave,
      foto: form.foto,
      esAdmin: form.esAdmin,
    };

    const resultado = idEditando === null
      ? await crearUsuarioAdmin(carga)
      : await actualizarUsuarioAdmin(idEditando, carga);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setUsuarios(await obtenerUsuarios());
    setOk(idEditando === null ? "Usuario creado" : "Usuario actualizado");
    resetForm();
  };

  const editar = (u) => {
    setError("");
    setOk("");
    setIdEditando(u.id);
    setForm({
      usuario: u.usuario,
      correo: u.correo,
      clave: "",
      foto: u.foto,
      esAdmin: Boolean(u.esAdmin),
    });
  };

  const borrar = async (u) => {
    if (Number(u.id) === Number(sesion.idUsuario)) {
      setError("No puedes borrar la cuenta con la que has iniciado sesion");
      return;
    }

    const confirmar = window.confirm(`Seguro que quieres borrar a ${u.usuario}`);
    if (!confirmar) {
      return;
    }

    setError("");
    setOk("");
    const resultado = await eliminarUsuarioAdmin(u.id);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setUsuarios(await obtenerUsuarios());
    setOk("Usuario borrado");

    if (idEditando === u.id) {
      resetForm();
    }
  };

  const restaurarBase = async () => {
    const confirmar = window.confirm("Esto restaura usuarios y productos base, continuar");
    if (!confirmar) {
      return;
    }

    setError("");
    setOk("");

    const [rUsuarios, rProductos] = await Promise.all([
      reiniciarUsuarios(),
      reiniciarProductos().then(() => ({ ok: true })).catch(() => ({ ok: false })),
    ]);

    if (!rUsuarios.ok || !rProductos.ok) {
      setError("No se pudo restaurar la base completa");
      return;
    }

    setUsuarios(await obtenerUsuarios());
    resetForm();
    setOk("Base restaurada");
  };

  if (!sesion.esAdmin) {
    return (
      <section className="usuarios-page">
        <div className="usuarios-box">
          <h2>Gestion de usuarios</h2>
          <p className="usuarios-error">Solo el admin puede acceder a esta seccion</p>
        </div>
      </section>
    );
  }

  return (
    <section className="usuarios-page">
      <div className="usuarios-box">
        <h2>Gestion de usuarios</h2>
        <p className="usuarios-subtitle">Crea, edita o elimina cuentas</p>

        <div className="usuarios-tools">
          <button type="button" className="usuarios-reset-btn" onClick={restaurarBase}>
            Restaurar base completa
          </button>
        </div>

        <form className="usuarios-form" onSubmit={guardar}>
          {idEditando !== null ? <p className="usuarios-editing">Editando a: {form.usuario || "usuario"}</p> : null}
          <input type="text" name="usuario" placeholder="Usuario" value={form.usuario} onChange={cambiar} />
          <input type="email" name="correo" placeholder="Correo" value={form.correo} onChange={cambiar} />
          <input
            type="password"
            name="clave"
            placeholder={idEditando === null ? "Clave" : "Nueva clave (opcional)"}
            value={form.clave}
            onChange={cambiar}
          />

          <label className="usuarios-admin-check">
            <input type="checkbox" name="esAdmin" checked={form.esAdmin} onChange={cambiar} />
            Es administrador
          </label>

          <label className="usuarios-avatar-picker">
            Avatar (opcional)
            <input type="file" accept="image/*" onChange={cambiarFoto} />
          </label>

          {error ? <p className="usuarios-error">{error}</p> : null}
          {ok ? <p className="usuarios-success">{ok}</p> : null}

          <div className="usuarios-actions">
            <button type="submit">{idEditando === null ? "Crear usuario" : "Guardar cambios"}</button>
            {idEditando !== null ? (
              <button type="button" className="ghost" onClick={resetForm}>Cancelar</button>
            ) : null}
          </div>
        </form>

        <div className="usuarios-list">
          {usuarios.map((u) => (
            <article key={u.id} className="usuarios-card">
              <img src={u.foto} alt={`avatar ${u.usuario}`} />
              <div className="usuarios-info">
                <strong>{u.usuario}</strong>
                <span>{u.correo}</span>
                <small>{u.esAdmin ? "Admin" : "Usuario"}</small>
              </div>
              <div className="usuarios-card-actions">
                <button type="button" onClick={() => editar(u)}>Editar</button>
                <button type="button" className="danger" onClick={() => borrar(u)}>Borrar</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
