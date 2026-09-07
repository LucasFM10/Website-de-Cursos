// Mapa de imagens de exemplo do ateliê. O banco guarda apenas a "chave" da imagem
// (image_key); aqui ela é resolvida para o arquivo empacotado no site.
import heroAtelier from "@/assets/hero-atelier.jpg";
import artesaRetrato from "@/assets/artesa-retrato.jpg";
import cursoBucket from "@/assets/curso-bolsa-bucket.jpg";
import cursoToteBordo from "@/assets/curso-tote-bordo.jpg";
import cursoClutch from "@/assets/curso-clutch-caramelo.jpg";
import bolsaRaffia from "@/assets/bolsa-raffia-redonda.jpg";
import bolsaOliva from "@/assets/bolsa-crossbody-oliva.jpg";
import bolsaPraia from "@/assets/bolsa-tote-praia.jpg";
import bolsaMini from "@/assets/bolsa-mini-bordo.jpg";

export const images = { heroAtelier, artesaRetrato };

export const imageByKey: Record<string, string> = {
  "curso-bolsa-bucket": cursoBucket,
  "curso-tote-bordo": cursoToteBordo,
  "curso-clutch-caramelo": cursoClutch,
  "bolsa-raffia-redonda": bolsaRaffia,
  "bolsa-crossbody-oliva": bolsaOliva,
  "bolsa-tote-praia": bolsaPraia,
  "bolsa-mini-bordo": bolsaMini,
  "hero-atelier": heroAtelier,
  "artesa-retrato": artesaRetrato,
};

export const imageKeys = Object.keys(imageByKey);

export const resolveImage = (key: string | null | undefined) =>
  (key && imageByKey[key]) || heroAtelier;
