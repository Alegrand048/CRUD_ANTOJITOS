import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Inicio from "./views/Inicio";
import Login from "./views/Login";
import Register from "./views/Register";
import Acerca from "./views/Acerca";
import Menu from "./views/Menu";
import ProductoDetalle from "./views/ProductoDetalle";
import Usuarios from "./views/Usuarios";
import Cesta from "./views/Cesta";
import Navbar from "./components/Navbar";
import { obtenerSesion } from "./services/authSession";

function Redireccion() {
  const sesion = obtenerSesion();
  return <Navigate to={sesion.estaLogueado ? "/inicio" : "/login"} replace />;
}

function RutaProtegida({ children }) {
  const sesion = obtenerSesion();

  if (!sesion.estaLogueado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RutaAdmin({ children }) {
  const sesion = obtenerSesion();

  if (!sesion.estaLogueado) {
    return <Navigate to="/login" replace />;
  }

  if (!sesion.esAdmin) {
    return <Navigate to="/inicio" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Redireccion />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/inicio"
            element={(
              <RutaProtegida>
                <Inicio />
              </RutaProtegida>
            )}
          />
          <Route
            path="/acerca"
            element={(
              <RutaProtegida>
                <Acerca />
              </RutaProtegida>
            )}
          />
          <Route
            path="/producto/:id"
            element={(
              <RutaProtegida>
                <ProductoDetalle />
              </RutaProtegida>
            )}
          />
          <Route
            path="/cesta"
            element={(
              <RutaProtegida>
                <Cesta />
              </RutaProtegida>
            )}
          />
          <Route
            path="/menu"
            element={(
              <RutaAdmin>
                <Menu />
              </RutaAdmin>
            )}
          />
          <Route
            path="/usuarios"
            element={(
              <RutaAdmin>
                <Usuarios />
              </RutaAdmin>
            )}
          />
          <Route path="*" element={<Redireccion />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;