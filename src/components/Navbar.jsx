import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/NavBar.css";
import { limpiarSesion, obtenerSesion } from "../services/authSession";
import { obtenerPerfil } from "../services/profileStorage";
import { contarUnidadesCesta } from "../services/cartStorage";

export default function Navbar() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const esPaginaAuth = pathname === "/login" || pathname === "/register";
  const [perfil, setPerfil] = useState(() => obtenerPerfil());
  const [sesion, setSesion] = useState(() => obtenerSesion());
  const [apiEnLinea, setApiEnLinea] = useState(true);
  const [unidadesCesta, setUnidadesCesta] = useState(() => contarUnidadesCesta());

  useEffect(() => {
    const sincPerfil = () => setPerfil(obtenerPerfil());
    const sincSesion = () => setSesion(obtenerSesion());
    const sincApi = (event) => setApiEnLinea(Boolean(event?.detail?.isOnline));
    const sincCesta = () => setUnidadesCesta(contarUnidadesCesta());

    window.addEventListener("profile-updated", sincPerfil);
    window.addEventListener("storage", sincPerfil);
    window.addEventListener("session-updated", sincSesion);
    window.addEventListener("storage", sincSesion);
    window.addEventListener("api-status", sincApi);
    window.addEventListener("cart-updated", sincCesta);
    window.addEventListener("storage", sincCesta);

    return () => {
      window.removeEventListener("profile-updated", sincPerfil);
      window.removeEventListener("storage", sincPerfil);
      window.removeEventListener("session-updated", sincSesion);
      window.removeEventListener("storage", sincSesion);
      window.removeEventListener("api-status", sincApi);
      window.removeEventListener("cart-updated", sincCesta);
      window.removeEventListener("storage", sincCesta);
    };
  }, []);

  const cerrar = () => {
    limpiarSesion();
    navegar("/login", { replace: true });
  };

  const nombreMostrar = sesion.estaLogueado ? sesion.usuario : perfil.nombre;
  const fotoMostrar = sesion.estaLogueado ? sesion.foto || perfil.foto : perfil.foto;

  return (
    <nav className={`navbar-figma ${esPaginaAuth ? "navbar-auth" : ""}`}>
      <div className="nav-container main-container">
        <Link to="/inicio" className="logo-brand">
          <span className="icon">🍔</span> ANTOJITOS
        </Link>
        
        <div className="nav-right">
          <ul className="nav-menu">
            <li><Link to="/inicio" className={pathname === "/inicio" ? "active" : ""}>Inicio</Link></li>
            <li><Link to="/acerca" className={pathname === "/acerca" ? "active" : ""}>Acerca de</Link></li>
            {sesion.esAdmin ? (
              <li><Link to="/menu" className={pathname === "/menu" ? "active" : ""}>Productos</Link></li>
            ) : null}
            {sesion.esAdmin ? (
              <li><Link to="/usuarios" className={pathname === "/usuarios" ? "active" : ""}>Usuarios</Link></li>
            ) : null}
            <li><span className="nav-disabled">Ajustes</span></li>
            <li><span className="nav-disabled">Contacto</span></li>
          </ul>
          <button
            type="button"
            className="cart-btn-main"
            title="Ir a la cesta"
            aria-label="Ir a la cesta"
            onClick={() => navegar("/cesta")}
          >
            🛒
            {unidadesCesta > 0 ? <span className="cart-count">{unidadesCesta}</span> : null}
          </button>
          <div className="nav-actions">
            {!apiEnLinea ? <span className="api-status-pill">API desconectada</span> : null}
            <div className="user-profile">
              <span className="user-name">{nombreMostrar}</span>
              <button type="button" className="avatar-btn" aria-label="Perfil de usuario">
                <img src={fotoMostrar} alt="avatar de usuario" className="user-avatar" />
              </button>
              {sesion.estaLogueado ? (
                <button type="button" className="logout-btn" onClick={cerrar}>
                  Cerrar sesion
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}