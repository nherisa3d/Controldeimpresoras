# 🖨️ NHERISA 3D — Print Farm Command Hub

> **Centro de mando, telemetría y vigilancia óptica para granjas de impresión 3D.**
> Desarrollado para **NHERISA 3D**. Compatible con **Bambu Lab**, **Creality**, **Snapmaker** y **Flashforge**.

---

## 🚀 Características Principales

- **Vista Cockpit de Granja**: Grid en tiempo real con avance porcentual, tiempo restante (ETA), capas impresas y archivo activo.
- **Telemetría Térmica en Vivo**: Indicadores dinámicos con rampa de calor para Nozzle / Extrusor, Cama caliente y Cabina/Chamber.
- **Muro de Cámaras CCTV**: Vigilancia óptica simultánea en cuadrículas (1x1, 2x2, 3x3), capturas instantáneas de alta definición (Snapshots) y vista en pantalla completa.
- **Soporte de Cámaras Flexibles**:
  - Webcams USB conectadas a la PC del taller (vía WebRTC / `getUserMedia`).
  - Streams de red IP / MJPEG (OctoPrint `/webcam/?action=stream`, Moonraker, ESP32-CAM, DroidCam).
  - Feed animado y simulado con herramienta en movimiento para pruebas offline.
- **Terminal G-Code & Jog Pad**: Control directo con Autohome XYZ (G28), precalentamientos rápidos (PLA, PETG, ABS/ASA, Enfriar), control de ventilador de capa y **Parada de Emergencia (M112)**.
- **Gestión de Filamentos & Carretes**: Monitoreo de stock de bobinas asignadas a cada máquina, colores, pesos restantes y temperaturas óptimas.
- **Modo Dual (Simulación / Red Real)**: Permite evaluar la plataforma inmediatamente sin hardware encendido, o conectarse a las IPs de tu red local.
- **Alertas de Audio Sintetizadas**: Chimes sonoros de aviso generados mediante Web Audio API al completar trabajos o por emergencias (sin archivos de audio externos).
- **100% Client-Side**: No requiere Node.js, Python ni instalación de servidores adicionales. Funciona directamente en el navegador y está listo para **GitHub Pages**.

---

## 🌐 Cómo publicar en GitHub Pages (Paso a Paso)

1. **Crear repositorio en GitHub**:
   - Crea un nuevo repositorio en tu cuenta de GitHub (ejemplo: `nherisa-print-hub`).
2. **Subir los archivos de esta carpeta**:
   - Sube `index.html`, `style.css`, `app.js`, `assets/` y este `README.md`.
3. **Activar GitHub Pages**:
   - En tu repositorio de GitHub, entra en **Settings** > **Pages**.
   - En **Source**, selecciona `Deploy from a branch`.
   - Elige la rama `main` (o `master`) y la carpeta `/(root)`.
   - Haz clic en **Save**.
4. ¡Listo! Tu hub estará accesible en:  
   `https://<tu-usuario>.github.io/nherisa-print-hub/` desde cualquier PC, tablet o celular en tu taller.

---

## 🔌 Guía de Conexión por Fabricante

### 1. Bambu Lab (X1-Carbon, P1S, P1P, A1)
- **Modo de Conexión**: Bambu LAN Mode / MQTT & RTSP
- **Puerto de Telemetría**: `8883` (MQTT) / `6000` (Stream de Cámara)
- **Configuración en la impresora**:
  1. En la pantalla táctil de la Bambu, ve a **Settings** > **WLAN** > activa **LAN Only Mode**.
  2. Anota la **Dirección IP** y el **Código de Acceso (Access Code)**.
  3. En este Hub, haz clic en **+ Nueva Impresora**, selecciona **Bambu Lab**, escribe la IP y el Access Code.

### 2. Creality (K1, K1 Max, Ender con Sonic Pad / Nebula / Klipper)
- **Modo de Conexión**: Klipper / Moonraker
- **Puerto predeterminado**: `7125`
- **Cámara**: `http://<IP-CREALITY>:8080/?action=stream` o `http://<IP-CREALITY>:7125/webcam/?action=stream`
- **Configuración**:
  - Ingresa la IP de tu K1 o Sonic Pad en el Hub.

### 3. Snapmaker (Artisan, Snapmaker 2.0, J1/J1s)
- **Modo de Conexión**: Snapmaker REST API
- **Puerto predeterminado**: `8080`
- **Cámara**: `http://<IP-SNAPMAKER>:8080/camera` o Snapshot JPEG periódico.

### 4. Flashforge (Adventurer 3/4, Creator, Guider)
- **Modo de Conexión**: Flashforge Network Protocol
- **Puerto predeterminado**: `8899`
- **Cámara**: Snapshot IP en `http://<IP-FLASHFORGE>:8080/?action=snapshot`

### 5. Conexión Directa USB (Web Serial API)
- Conecta cualquier impresora con cable USB a la PC.
- En el Hub, selecciona tipo de conexión: **Conexión Directa USB**.
- Podrás enviar y recibir comandos G-Code directos a 115200 / 250000 baudios sin instalar drivers extra.

---

## 💾 Respaldo y Portabilidad

Tus impresoras y filamentos se guardan automáticamente en el almacenamiento local de tu navegador (`localStorage`).  
Para transferir tu configuración entre la PC del taller y tu laptop o celular:
1. Haz clic en el ícono de **⚙️ Configuración** en la esquina superior derecha.
2. Haz clic en **Exportar Configuración (.json)**.
3. En el otro dispositivo, abre la web y haz clic en **Importar Configuración**.

---

*Desarrollado con pasión para NHERISA 3D.*
