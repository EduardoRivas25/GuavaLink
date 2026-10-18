# GuavaLink — Brief para diseño web y UI

## ¿Qué es GuavaLink?

GuavaLink es un sistema para digitalizar la operación de un **empaque de guayaba de exportación**. Hoy en día el control de productores, recepción de fruta, embarques y pagos se lleva en Excel y en papel, lo que genera errores, información duplicada y falta de trazabilidad.

GuavaLink reemplaza eso con **dos aplicaciones conectadas entre sí**:

- Una **aplicación web** para el personal administrativo del empaque.
- Una **aplicación móvil** para el personal de recepción y para los productores.

Ambas comparten la misma base de datos en tiempo real: lo que se registra en el celular en el patio de recepción aparece al instante en la computadora de la oficina, y viceversa.

---

## ¿Quién lo usa?

| Usuario | Dónde lo usa | Qué hace |
|---|---|---|
| **Administrador** | App web | Gestiona productores, huertas, embarques, precios, pagos, reportes y usuarios. |
| **Personal de recepción** | App móvil | Escanea el QR del productor, registra cajas/kilos e incidencias, asigna la entrega a un embarque. |
| **Productor** | App móvil | Consulta su QR, su historial de entregas, sus pagos y recibe notificaciones. |

---

## App Web (administración)

Pensada para escritorio/oficina, uso constante durante la jornada laboral.

**Pantallas / módulos principales:**
1. **Login** — acceso por rol.
2. **Dashboard** — indicadores generales: kilos recibidos, embarques activos, pagos pendientes.
3. **Productores** — alta, baja, edición y consulta; carga masiva desde Excel.
4. **Huertas** — registro de huertas asociadas a cada productor, con datos de registro sanitario.
5. **Embarques** — creación y administración, asignación de recepciones a cada embarque.
6. **Pagos** — cálculo y control de pagos a productores según lo recibido.
7. **Reportes** — exportables en PDF y Excel (producción, recepción, embarques, pagos).
8. **Usuarios y roles** — administración de accesos.

**Prioridad para el primer prototipo:** Login → Dashboard → Productores → Embarques → Pagos.

---

## App Móvil (campo)

Pensada para usarse de pie, con una mano, muchas veces al día, a veces con sol directo o guantes — la prioridad es que sea **rápida y con pocos toques**.

**Pantallas / funciones principales:**
1. **Login** — según rol (recepción o productor).
2. **Código QR del productor** — el productor lo muestra; recepción lo escanea.
3. **Escaneo de recepción** — cámara para leer el QR, seguido de un formulario corto (cajas, kilos, incidencias).
4. **Historial del productor** — entregas, pagos, embarques.
5. **Notificaciones** — avisos push sobre estatus de entrega o pago.

**Prioridad para el primer prototipo:** Login → Ver QR → Escanear QR → Registrar recepción.

---

## Cómo se conectan ambas apps

No son dos productos separados: comparten una **API REST** y una **base de datos centralizada**. En términos de diseño, esto significa que:

- Los mismos datos (productor, embarque, pago) deben verse consistentes en ambas plataformas, aunque el layout sea distinto (escritorio vs. móvil).
- El estado se actualiza casi al instante — vale la pena diseñar pequeños indicadores de "sincronizado" / "actualizado ahora" para dar confianza al usuario.

---

## Lineamientos de diseño sugeridos

- **Identidad visual:** paleta en tonos verdes (referencia a la guayaba/campo), limpia y profesional — nada infantil.
- **App web:** layout de panel administrativo clásico (menú lateral + contenido), tablas y formularios claros, buen soporte para pantallas medianas/grandes.
- **App móvil:** botones grandes, tipografía legible a distancia, poco texto por pantalla, feedback visual inmediato al escanear (éxito/error).
- **Responsivo:** la app web debe verse bien también en tablet, ya que a veces se usa en el patio de recepción.
- **Accesibilidad de campo:** contraste alto en la app móvil pensando en uso bajo luz solar directa.

---

## Contexto técnico (por si es útil)

- Web: React Native
- Móvil: React Native
- Backend: Insforge
- Base de datos: PostgreSQL
- Notificaciones: Por definir

*Este documento resume el proyecto solo para fines de diseño de interfaz; el detalle técnico y funcional completo está en la propuesta de proyecto.*
