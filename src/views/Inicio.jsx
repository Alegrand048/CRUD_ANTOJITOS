import { useEffect, useState } from "react";
import "../styles/Inicio.css";
import { Link } from "react-router-dom";
import { obtenerSesion } from "../services/authSession";
import { obtenerProductos } from "../services/productStorage";

export default function Inicio() {
  const [termino, setTermino] = useState("");
  const [productos, setProductos] = useState([]);
  const [sesion, setSesion] = useState(() => obtenerSesion());
  const textoOferta = "OFERTA DE APERTURA 20% DE DESCUENTO EN TODO";

  useEffect(() => {
    const cargarProductos = async () => {
      const lista = await obtenerProductos();
      setProductos(lista);
    };
    const sincSesion = () => setSesion(obtenerSesion());

    cargarProductos();

    window.addEventListener("products-updated", cargarProductos);
    window.addEventListener("storage", cargarProductos);
    window.addEventListener("session-updated", sincSesion);
    window.addEventListener("storage", sincSesion);

    return () => {
      window.removeEventListener("products-updated", cargarProductos);
      window.removeEventListener("storage", cargarProductos);
      window.removeEventListener("session-updated", sincSesion);
      window.removeEventListener("storage", sincSesion);
    };
  }, []);

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(termino.toLowerCase())
  );

  const ciclos = [];
  for (let i = 0; i < filtrados.length; i += 6) {
    const grupo = filtrados.slice(i, i + 6);
    ciclos.push({
      pequeños: grupo.slice(0, 5),
      destacado: grupo[5] || null,
    });
  }

  const tarjetaProducto = (producto) => (
    <Link className="card-producto" key={producto.id} to={`/producto/${producto.id}`}>
      <div className="img-container">
        <img src={producto.img} alt={producto.nombre} />
      </div>
      <div className="info-producto">
        <h3>{producto.nombre}</h3>
        <p className="precio">{producto.precio}€</p>
      </div>
    </Link>
  );

  return (
    <div className="inicio-page">
      <div className="top-search-strip" aria-label="oferta-apertura">
        <span className="oferta-item oferta-item-left">{textoOferta}</span>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
          />
        </div>

        <span className="oferta-item oferta-item-right">{textoOferta}</span>
      </div>

      {sesion.esAdmin ? (
        <div className="admin-access-bar">
          <span>Sesion admin activa: {sesion.usuario}</span>
          <Link to="/menu">Gestionar productos</Link>
        </div>
      ) : null}

      {ciclos.map((ciclo, index) => (
        <section className="product-cycle" key={`cycle-${index}`}>
          {ciclo.pequeños.length ? (
            <div className="grid-productos">
              {ciclo.pequeños.map(tarjetaProducto)}
            </div>
          ) : null}

          {ciclo.destacado ? (
            <div className="featured-product-wrapper">
              <Link className="card-producto card-producto-featured" to={`/producto/${ciclo.destacado.id}`}>
                <div className="img-container">
                  <img src={ciclo.destacado.img} alt={ciclo.destacado.nombre} />
                </div>
                <div className="info-producto">
                  <h3>{ciclo.destacado.nombre}</h3>
                  <p className="precio">{ciclo.destacado.precio}€</p>
                </div>
              </Link>
            </div>
          ) : null}
        </section>
      ))}

      <div className="paginacion-figma">
        <span>← Anterior</span>
        <button className="active">1</button>
        <button>2</button>
        <button>3</button>
        <span>Siguiente →</span>
      </div>
    </div>
  );
}