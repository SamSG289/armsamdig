# 👕 Armario Digital

Una app web para armar tu placard digital: subís una foto de cada prenda
(pantalón, zapatillas, collar, gafas, buzo, campera, remera, etc.), la app
la identifica automáticamente (estilo Google Lens), le recorta el fondo
para guardarla como un "modelo" en PNG, y le asignás la talla. Después
podés armar outfits combinando tus prendas: el tamaño de cada una en el
armador se ajusta solo según su talla, y te avisa si combina bien con tu
talla de referencia.

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
- **Modelo en PNG**: al guardar la prenda, la app recorta el fondo de la
  foto (asumiendo un fondo relativamente parejo, como una mesa, percha o
  pared lisa) y exporta un PNG con transparencia, listo para combinarse
  con otras prendas en el armador de outfits.
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

- El recorte de fondo funciona mejor con fotos de fondo uniforme (mesa,
  percha, pared lisa). Con fondos muy texturados el recorte puede ser
  imperfecto; siempre podés volver a sacar la foto con mejor fondo.
- El reconocimiento automático usa un modelo genérico (no entrenado
  específicamente para moda), así que puede confundir categorías
  parecidas (ej. buzo vs. campera). Se puede corregir a mano antes de
  guardar.
- Los datos se guardan solo en el navegador/dispositivo donde los cargás
  (IndexedDB + localStorage). Si limpiás los datos del sitio o cambiás de
  navegador, no vas a ver tu armario anterior.
