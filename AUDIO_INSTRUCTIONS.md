# 🎵 Instrucciones para Archivos de Audio - Animación de Tarjetas

## Estado Actual

La funcionalidad de animación de tarjetas de crédito ya está completamente implementada y funciona con **Web Audio API**, por lo que **NO necesitas archivos de audio externos** para que funcione.

Los sonidos se generan programáticamente:
- **Sonido de mezcla**: Se genera cuando las tarjetas se mezclan
- **Redoble de tambores**: Suena durante la vibración de la tarjeta gris
- **Fanfarria de victoria**: Se reproduce cuando se revela el ganador

## Opcional: Agregar Archivos de Audio Personalizados

Si deseas usar archivos de audio personalizados en lugar de los generados, sigue estos pasos:

### 1. Crear la carpeta de sonidos
```bash
mkdir -p public/sounds
```

### 2. Agregar los archivos de audio

Coloca los siguientes archivos en `public/sounds/`:
- `shuffle.mp3` - Sonido de cartas mezclándose (1-2 segundos)
- `drum-roll.mp3` - Redoble de tambores (debe ser loop, 5+ segundos)
- `victory.mp3` - Fanfarria de victoria (2-3 segundos)

### 3. Generador de Sonidos Incluido

Hemos incluido un generador de sonidos en HTML que puedes usar:

1. Abre el archivo `public/sounds/audio-generator.html` en tu navegador
2. Haz clic en "Generar y Descargar" para cada sonido
3. Los archivos se descargarán como `.wav`
4. Convierte los archivos a `.mp3` usando un convertidor online como:
   - https://cloudconvert.com/wav-to-mp3
   - https://convertio.co/es/wav-mp3/
   - https://online-audio-converter.com/es/

### 4. Recursos de Sonidos Gratuitos

Si prefieres usar sonidos profesionales, aquí hay recursos gratuitos:

#### Sonido de Mezcla de Cartas:
- https://freesound.org/search/?q=card+shuffle
- https://mixkit.co/free-sound-effects/game/

#### Redoble de Tambores:
- https://freesound.org/search/?q=drum+roll
- https://www.zapsplat.com/sound-effect-category/drums/

#### Música de Victoria:
- https://freesound.org/search/?q=victory+fanfare
- https://mixkit.co/free-sound-effects/win/

### 5. Formato Recomendado

- **Formato**: MP3
- **Bitrate**: 128-192 kbps
- **Frecuencia**: 44.1 kHz
- **Canales**: Stereo o Mono

## Notas Importantes

- Los archivos de audio HTML (`<audio>`) intentarán cargar primero
- Si fallan, el sistema usará Web Audio API como respaldo automático
- Los sonidos generados por Web Audio API son de buena calidad y funcionan sin archivos externos
- El sistema es completamente funcional sin archivos de audio externos