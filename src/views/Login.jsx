import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { obtenerPerfil, reiniciarPerfil } from "../services/profileStorage";
import { limpiarSesion, guardarSesion } from "../services/authSession";
import { controlLogin } from "../controllers/authController";
import { obtenerAdministrador } from "../services/userStorage";

export default function Login() {
  const navegar = useNavigate();
  const [formulario, setFormulario] = useState({ usuario: "", clave: "" });
  const [error, setError] = useState("");
  const [perfil, setPerfil] = useState(() => obtenerPerfil());

  useEffect(() => {
    const sincPerfil = () => setPerfil(obtenerPerfil());

    window.addEventListener("profile-updated", sincPerfil);
    window.addEventListener("storage", sincPerfil);

    return () => {
      window.removeEventListener("profile-updated", sincPerfil);
      window.removeEventListener("storage", sincPerfil);
    };
  }, []);

  const cambiar = (e) => {
    setError("");
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const enviar = async (e) => {
    e.preventDefault();
    const valorLogin = formulario.usuario.trim() || perfil.nombre;
    const resultado = await controlLogin({ usuario: valorLogin, clave: formulario.clave });

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setError("");
    const guardado = guardarSesion(resultado.usuario);
    if (!guardado) {
      setError("No se pudo iniciar sesion por falta de espacio, borra algunos datos e intentalo otra vez");
      return;
    }

    navegar(resultado.usuario.esAdmin ? "/menu" : "/inicio", { replace: true });
  };

  const restaurarDefecto = async () => {
    const admin = await obtenerAdministrador();
    limpiarSesion();
    reiniciarPerfil();
    setFormulario({ usuario: admin.usuario, clave: admin.clave });
  };

  return (
    <div className="login-fondo">
      <div className="login-box">
        <img src={perfil.foto} alt="avatar" className="login-avatar" />

        <form className="login-form" onSubmit={enviar}>
          <input
            type="text"
            name="usuario"
            placeholder={perfil.nombre}
            value={formulario.usuario}
            onChange={cambiar}
          />

          <input
            type="password"
            name="clave"
            placeholder="**************"
            value={formulario.clave}
            onChange={cambiar}
          />

          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit">Entrar</button>
        </form>

        <button type="button" className="login-demo-btn" onClick={restaurarDefecto}>
          Volver a cuenta Alejandro
        </button>

        <Link to="/register" className="login-enlace">Aun no soy usuario</Link>
      </div>
    </div>
  );
}