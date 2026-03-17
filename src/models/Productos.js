import laBuahhImage from "../assets/Productos/LABUAHH.png";
import platonPatatasImage from "../assets/Productos/PLATONPATATAS.png";
import elTsunamiImage from "../assets/Productos/ELTSUNAMI.png";
import miniGustosImage from "../assets/Productos/MINIGUSTOS.png";
import laAntiCarneImage from "../assets/Productos/LAANTICARNE.png";
import reyPuercosImage from "../assets/Productos/ElReyPuercos.png";
import productsSeed from "../data/products.json";

const productImages = {
  laBuahh: laBuahhImage,
  platonPatatas: platonPatatasImage,
  elTsunami: elTsunamiImage,
  miniGustos: miniGustosImage,
  laAntiCarne: laAntiCarneImage,
  reyPuercos: reyPuercosImage,
};

const productos = productsSeed.map((product) => ({
  id: product.id,
  nombre: product.nombre,
  precio: Number(product.precio),
  descripcion: product.descripcion,
  img: productImages[product.imageKey] || laBuahhImage,
}));

export default productos;