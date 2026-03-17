import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { controlRegistro } from "../controllers/authController";
import "../styles/Register.css";
import { obtenerPerfil, guardarPerfil } from "../services/profileStorage";
import { guardarSesion } from "../services/authSession";

function cargarImagen(dataUrl) {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error("No se pudo leer la imagen"));
    imagen.src = dataUrl;
  });
}

async function comprimirFoto(dataUrl) {
  const imagen = await cargarImagen(dataUrl);
  const maxLado = 400;
  const ancho = imagen.naturalWidth || imagen.width;
  const alto = imagen.naturalHeight || imagen.height;
  const escala = Math.min(1, maxLado / Math.max(ancho, alto));
  const anchoFinal = Math.max(1, Math.round(ancho * escala));
  const altoFinal = Math.max(1, Math.round(alto * escala));
  const canvas = document.createElement("canvas");
  canvas.width = anchoFinal;
  canvas.height = altoFinal;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No se pudo procesar la imagen");
  }

  ctx.drawImage(imagen, 0, 0, anchoFinal, altoFinal);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function Register() {
  const navegar = useNavigate();
  const perfil = obtenerPerfil();
  const [formulario, setFormulario] = useState({
    usuario: "",
    correo: "",
    clave: "",
    clave2: "",
  });
  const [foto, setFoto] = useState("");
  const [error, setError] = useState("");

  const cambiar = (e) => {
    setError("");
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const cambiarFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) {
      setFoto("");
      return;
    }

    const lector = new FileReader();
    lector.onloadend = async () => {
      const raw = String(lector.result || "");
      try {
        const comprimida = await comprimirFoto(raw);
        setFoto(comprimida);
      } catch {
        setFoto(raw);
      }
    };
    lector.readAsDataURL(archivo);
  };

  const enviar = async (e) => {
    e.preventDefault();

    if (!foto) {
      setError("Debes subir una foto para registrarte");
      return;
    }

    const resultado = await controlRegistro({ ...formulario, foto });
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    guardarPerfil({
      nombre: resultado.usuario.usuario,
      foto: resultado.usuario.foto,
    });

    const guardado = guardarSesion(resultado.usuario);
    if (!guardado) {
      setError("Cuenta creada, pero no se pudo iniciar sesion automaticamente");
      return;
    }

    navegar(resultado.usuario.esAdmin ? "/menu" : "/inicio", { replace: true });
  };

  return (
    <div className="register-fondo">
      <div className="register-box">
        <form className="register-form" onSubmit={enviar}>
          <label className="register-avatar-picker" htmlFor="register-avatar">
            {foto ? (
              <img src={foto} alt="avatar seleccionado" className="register-avatar-preview" />
            ) : (
              <div className="register-avatar-placeholder">👤</div>
            )}
            <span className="register-avatar-badge">+</span>
          </label>

          <input
            id="register-avatar"
            className="register-avatar-input"
            type="file"
            accept="image/*"
            onChange={cambiarFoto}
          />

          {error ? <p className="register-error">{error}</p> : null}

          <input
            type="text"
            name="usuario"
            placeholder={perfil.nombre}
            value={formulario.usuario}
            onChange={cambiar}
          />
          <input
            type="email"
            name="correo"
            placeholder="Correo electronico"
            value={formulario.correo}
            onChange={cambiar}
          />
          <input
            type="password"
            name="clave"
            placeholder="Clave"
            value={formulario.clave}
            onChange={cambiar}
          />
          <input
            type="password"
            name="clave2"
            placeholder="Confirmar clave"
            value={formulario.clave2}
            onChange={cambiar}
          />

          <button type="submit">Registrar</button>
          <Link to="/login" className="register-login-link">Ya soy usuario</Link>
        </form>
      </div>
    </div>
  );
}
