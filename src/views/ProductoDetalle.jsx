import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/ProductoDetalle.css";
import { obtenerProductos } from "../services/productStorage";
import { anadirACesta } from "../services/cartStorage";

export default function ProductoDetalle() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      const lista = await obtenerProductos();
      const encontrado = lista.find((item) => String(item.id) === String(id)) || null;
      if (activo) {
        setProducto(encontrado);
      }
    };

    cargar();
    return () => {
      activo = false;
    };
  }, [id]);

  if (!producto) {
    return (
      <section className="product-detail-page">
        <div className="product-detail-card product-detail-empty">
          <h1>Producto no encontrado</h1>
          <p>El producto que buscas no existe o ha sido eliminado</p>
          <Link to="/inicio" className="product-detail-back">Volver al catalogo</Link>
        </div>
      </section>
    );
  }

  const anadir = () => {
    anadirACesta(producto, 1);
    setMsg("Producto anadido a la cesta");
  };

  return (
    <section className="product-detail-page">
      <article className="product-detail-card">
        <div className="product-detail-image">
          <img src={producto.img} alt={producto.nombre} />
        </div>
        <div className="product-detail-content">
          <span className="product-detail-tag">ANTOJITOS</span>
          <h1>{producto.nombre}</h1>
          <p className="product-detail-price">{producto.precio}€</p>
          <p className="product-detail-description">
            {producto.descripcion || "Producto disponible en nuestro catalogo"}
          </p>
          {msg ? <p className="product-detail-msg">{msg}</p> : null}
          <div className="product-detail-actions">
            <button type="button" className="product-detail-add" onClick={anadir}>Anadir a la cesta</button>
            <Link to="/cesta" className="product-detail-basket-link">Ver cesta</Link>
          </div>
          <Link to="/inicio" className="product-detail-back">Volver al catalogo</Link>
        </div>
      </article>
    </section>
  );
}
