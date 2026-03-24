import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Cesta.css";
import {
  cambiarCantidadCesta,
  eliminarDeCesta,
  obtenerCesta,
  vaciarCesta,
} from "../services/cartStorage";

export default function Cesta() {
  const [items, setItems] = useState(() => obtenerCesta());

  useEffect(() => {
    const sincronizar = () => setItems(obtenerCesta());

    window.addEventListener("cart-updated", sincronizar);
    window.addEventListener("storage", sincronizar);

    return () => {
      window.removeEventListener("cart-updated", sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + (Number(item.precio) || 0) * Number(item.cantidad || 1), 0),
    [items]
  );

  const aumentar = (id, cantidadActual) => {
    cambiarCantidadCesta(id, Number(cantidadActual) + 1);
  };

  const reducir = (id, cantidadActual) => {
    cambiarCantidadCesta(id, Number(cantidadActual) - 1);
  };

  const vaciarTodo = () => {
    if (!items.length) {
      return;
    }

    const confirmar = window.confirm("Se vaciara toda la cesta. Continuar?");
    if (!confirmar) {
      return;
    }

    vaciarCesta();
  };

  return (
    <section className="cesta-page">
      <div className="cesta-box">
        <div className="cesta-header">
          <h1>Tu cesta</h1>
          <p>Revisa los productos antes de hacer el pedido</p>
        </div>

        {!items.length ? (
          <div className="cesta-empty">
            <h2>La cesta esta vacia</h2>
            <p>Anade productos desde el catalogo para verlos aqui.</p>
            <Link to="/inicio">Ir al catalogo</Link>
          </div>
        ) : (
          <>
            <div className="cesta-list">
              {items.map((item) => (
                <article className="cesta-item" key={item.id}>
                  <img src={item.img} alt={item.nombre} />
                  <div className="cesta-item-info">
                    <h3>{item.nombre}</h3>
                    <p>{item.precio}€ unidad</p>
                  </div>
                  <div className="cesta-item-actions">
                    <div className="qty-control">
                      <button type="button" onClick={() => reducir(item.id, item.cantidad)}>-</button>
                      <span>{item.cantidad}</span>
                      <button type="button" onClick={() => aumentar(item.id, item.cantidad)}>+</button>
                    </div>
                    <button type="button" className="remove-btn" onClick={() => eliminarDeCesta(item.id)}>
                      Quitar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="cesta-summary">
              <strong>Total: {total.toFixed(2)}€</strong>
              <div className="cesta-summary-actions">
                <button type="button" className="secondary" onClick={vaciarTodo}>Vaciar cesta</button>
                <button type="button" disabled title="Pago no implementado aun">Pagar (proximamente)</button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
