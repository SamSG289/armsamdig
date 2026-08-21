# 👕 Armario Digital

Una app web para armar tu placard digital: subís una foto de cada prenda
(pantalón, zapatillas, collar, gafas, buzo, campera, remera, etc.), la app
la identifica automáticamente (estilo Google Lens), le recorta el fondo
para guardarla como un "modelo" en PNG, y le asignás la talla. Después
podés armar outfits sobre un **maniquí 2D**, combinando tus prendas: el
tamaño de cada una en el armador se ajusta solo según su talla, y te avisa
si combina bien con tu talla de referencia.

Todo corre **en tu navegador**: las fotos, el reconocimiento y el armario
se guardan localmente en tu dispositivo (IndexedDB). No hay backend ni se
sube ninguna imagen a un servidor.

## Cómo se resuelve cada parte

- **Identificar la prenda**: usa [MobileNet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet)
  vía TensorFlow.js, corriendo 100% en el navegador. Reconoce ~1000
  categorías de objetos (parte del dataset ImageNet) y la app traduce las
  que corresponden a ropa/accesorios (remera, buzo, campera, pantalón,
  falda, vestido, zapatillas, gorra, gafas, collar, cinturón, bufanda,
  bolso) a categorías del armario. Es un reconocimiento "best effort": si
  no identifica bien la prenda (o si no hay conexión a internet para bajar
  el modelo la primera vez), siempre podés elegir la categoría a mano.
- **Modelo en PNG (recorte con IA)**: al guardar la prenda, la app le
  recorta el fondo con un modelo de segmentación de imágenes (isnet) que
  también corre 100% en el navegador vía
  [`@imgly/background-removal`](https://github.com/imgly/background-removal-js)
  (WASM/ONNX, sin servidor propio, sin costo, sin API key). Da un recorte
  mucho más prolijo que separar por color de fondo, incluso con fondos
  poco uniformes. Si por algún motivo no se puede usar (sin conexión para
  bajar el modelo la primera vez, navegador no compatible), la app cae
  automáticamente a un recorte más simple por color de borde, para que
  nunca se rompa el flujo de guardado. El resultado siempre es un PNG con
  transparencia.
- **Maniquí 2D a tu medida**: el armador de outfits dibuja un maniquí
  (silueta humana de frente, en SVG) y cada prenda se ubica sobre la zona
  del cuerpo que le corresponde (cabeza, ojos, cuello, torso, piernas,
  pies), en vez de quedar suelta en el aire. En "Mi perfil" configurás
  género (masculino/femenino/neutro), altura y peso: el maniquí cambia de
  forma (contextura, hombros/cintura/cadera) y las prendas se estiran o
  angostan junto con él, para que el outfit se vea parecido a como te
  queda a vos. Esto se combina con el ajuste por talla de cada prenda
  (una L se ve más grande que una S dentro del mismo cuerpo).
- **Tallas y outfits**: cada categoría usa un sistema de tallas (ropa:
  XS–XXXL, calzado: numeración EU, o "medida"/libre para accesorios). En
  "Mi perfil" definís tu talla de referencia (parte superior, parte
  inferior, calzado). El armario y el armador de outfits comparan la talla
  de cada prenda contra tu perfil y marcan si **coincide**, es **cercana**
  o **no coincide**. En el armador, cada prenda se dibuja sobre el maniquí
  con un tamaño proporcional a su talla, para que todo el outfit quede
  visualmente a escala.

## Cómo correr el proyecto

Requiere Node.js 20+.

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto `http://localhost:5173`).

Para generar una build de producción:

```bash
npm run build
npm run preview
```

## Limitaciones conocidas

- El recorte con IA descarga su modelo (unos MB) la primera vez que se
  usa, así que esa primera prenda puede tardar un poco más en guardarse;
  las siguientes son más rápidas porque queda cacheado en el navegador. Si
  no hay red disponible para esa descarga, se usa el recorte de respaldo
  por color, que funciona mejor con fotos de fondo uniforme (mesa, percha,
  pared lisa).
- El reconocimiento automático usa un modelo genérico (no entrenado
  específicamente para moda), así que puede confundir categorías
  parecidas (ej. buzo vs. campera). Se puede corregir a mano antes de
  guardar.
- El maniquí es una silueta 2D estilizada, no un modelo 3D ni una
  reconstrucción real de tu cuerpo: la altura/peso solo se usan para
  calcular un factor de escala aproximado (proporción y contextura), no
  para simular medidas anatómicas exactas.
- Los datos se guardan solo en el navegador/dispositivo donde los cargás
  (IndexedDB + localStorage). Si limpiás los datos del sitio o cambiás de
  navegador, no vas a ver tu armario anterior.
- El recorte con IA usa un modelo de segmentación (isnet) especializado en
  separar objeto/fondo, no un modelo generativo tipo Gemini "nano banana".
  Es gratis y no necesita backend ni API key, pero no "genera" ni retoca
  la foto de catálogo, solo la recorta bien. Si en algún momento se quiere
  ese nivel de calidad (foto de catálogo prolija, con sombra e
  iluminación parejas), se puede sumar como paso opcional, pero requiere
  un backend chico (para no exponer la API key en el navegador) y tiene
  costo por imagen procesada.
