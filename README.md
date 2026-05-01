# Read Rapide

Web app de lectura RSVP (Rapid Serial Visual Presentation) para mostrar texto palabra por palabra con efecto de pulso y dos modos de velocidad:

- Fixed: velocidad constante en WPM.
- Auto ramp: aceleracion progresiva de WPM en el tiempo.
- Curvas de rampa: lineal, suave al inicio, suave al final.
- ORP opcional: resaltado del punto de enfoque de cada palabra.
- Carga de archivos .txt.
- Persistencia de preferencias (modo, idioma, velocidades y ORP) en localStorage.
- Tema claro/oscuro con selector en la interfaz.
- Controles compactos en una sola linea horizontal.
- Botones de reproduccion por simbolos: play/pause y reset.
- Ventana emergente de lectura en gran formato para pantalla completa sin distracciones.

La interfaz es bilingue (espanol/ingles) y funciona en desktop y movil.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abrir la URL local que muestra Vite (por defecto http://localhost:5173).

## Build de produccion

```bash
npm run build
```

## Ejecutar pruebas

```bash
npm run test
```

## Uso rapido

1. Pega texto en el area de entrada.
2. Ajusta controles en la franja horizontal: idioma de interfaz, tema, modo, ORP, carga .txt y sliders.
3. Presiona el simbolo ▶ para reproducir o ⏸ para pausar.
4. Usa ↺ para reiniciar.
5. Usa ⛶ para abrir la ventana grande de lectura y ✕ para cerrarla.

Atajo de teclado:

- Barra espaciadora para play/pause (cuando no estas escribiendo en un input).

## Como funciona el timing

- El motor calcula el intervalo base por palabra con la formula: 60000 / WPM.
- Se aplican pausas extra en puntuacion (, ; : . ! ?).
- Las palabras largas reciben una pequeña penalizacion de tiempo para mejorar legibilidad.

## Estructura principal

- src/App.tsx: UI, estados y reproduccion.
- src/lib/tokenize.ts: normalizacion y tokenizacion de texto.
- src/lib/timing.ts: calculo de WPM activo e intervalo por token.
- src/i18n.ts: diccionario bilingue ES/EN.
