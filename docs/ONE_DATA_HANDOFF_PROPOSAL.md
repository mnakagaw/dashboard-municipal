# Propuesta de Traspaso y Mantenimiento de Datos (ONE)

Este documento presenta diferentes opciones para transferir la responsabilidad de mantener y generar los datos del dashboard a la Oficina Nacional de Estadística (ONE). Dado que los datos originales provienen mayormente de Excel y CSV, y el dashboard consume archivos JSON ligeros, necesitamos un puente o "pipeline" que sea sostenible para su equipo.

## Contexto Actual
- **Entrada:** Archivos `.xlsx` y `.csv` sueltos en la carpeta (ahora no rastreada) `data_sources/`.
- **Proceso actual:** Scripts de Node.js (`scripts/parse_*.js`) altamente personalizados que leen formatos específicos de Censo y Educación para escupir JSONs consolidados.
- **Salida:** Archivos JSON en `public/data/` listos para ser consumidos por el dashboard.

---

## Opciones de Traspaso (De Menor a Mayor Esfuerzo Tecnológico para ONE)

### Opción 1: Entregar las Plantillas de Excel (Enfoque "Low-Tech / Manual")
En lugar de que ONE use scripts de programación, se crean **plantillas maestras en Excel** con un formato estandarizado.
- **Cómo funciona:**
  1. Se diseñan archivos Excel donde cada pestaña (hoja) representa un dominio (Demografía, Salud, Educación).
  2. Las filas siempre son los 158 municipios, alineados con el código oficial (`adm2_code`).
  3. El equipo de ONE solo actualiza los datos en estas plantillas maestras en Excel usando fórmulas o copiar/pegar desde sus sistemas internos.
  4. Se proporciona una pequeña herramienta (ej. un macro de Excel, un script Python sencillo, o una web estática local) que toma este "Excel Maestro" y exporta automáticamente los 30+ archivos JSON que necesita el dashboard.
- **Ventajas:** Cero curva de aprendizaje de programación para analistas de la ONE. Usan la herramienta que ya dominan (Excel).
- **Desventajas:** Más propenso a errores humanos (si cambian el nombre de una columna, el exportador falla).

### Opción 2: Empaquetar los Scripts Actuales (Enfoque "CLI / Semi-Automático")
Se pulen los scripts de Node.js que ya existen y se les entrega como una herramienta de línea de comandos (CLI) documentada.
- **Cómo funciona:**
  1. Se define una estructura de carpetas estricta: `ingesta/censo/`, `ingesta/salud/`, etc.
  2. ONE deposita los archivos CSV o Excel crudos (con la misma estructura que hoy publican) en esas carpetas.
  3. Ejecutan un comando como `npm run actualizar-datos` o un archivo `.bat` (script de Windows).
  4. El script hace todo el trabajo de limpieza, cruce (join) territorial y generación de los JSON y promedios provinciales/nacionales.
- **Ventajas:** Aprovecha el trabajo de parseo que ya se ha hecho en `scripts/`. Permite automatización.
- **Desventajas:** Si ONE en el futuro cambia el formato de sus Excels del Censo (por ejemplo, añade una fila de título extra), el script se romperá y necesitarán un programador de Node.js para adaptarlo.

### Opción 3: Panel de Administración Web / CMS (Enfoque "High-Tech / UI")
Se desarrolla una aplicación interna (puede ser local o servidor) donde el equipo de ONE pueda subir archivos CSV y mapear las columnas visualmente.
- **Cómo funciona:**
  1. Una interfaz web sencilla: "Subir datos de Educación 2026".
  2. La app lee el archivo, y la UI pregunta: "¿Qué columna representa el código de municipio?".
  3. Al confirmar, la base de datos se actualiza y la app genera y publica los JSON automáticamente.
- **Ventajas:** Muy amigable, a prueba de cambios menores de formato. Independencia total del código fuente.
- **Desventajas:** Requiere inversión adicional para desarrollar este panel administrativo o adaptar un CMS "Headless" (como Strapi o Directus).

### Opción 4: Pipeline Automatizado en SQL Server (Visión "Single Source of Truth" de ONE)
Esta es la visión ideal a largo plazo planteada por la ONE: cuando se actualiza el dato original del Censo en sus bases de datos maestras (DWH), todos los dashboards se actualizan automáticamente sin intervención manual ni despliegues adicionales. 

La arquitectura actual basada en la tabla `dataset_assets` con su columna `json_content` está diseñada **exactamente como el puente perfecto** para lograr esto de manera eficiente.

- **Cómo funciona:**
  1. El equipo de datos de ONE crea un Job o Procedimiento Almacenado (ej. vía SSIS) asociado a su SQL Server maestro.
  2. Cuando el esquema de datos crudos del Censo se actualiza, el procedimiento ejecuta una consulta SQL de agregación para calcular los indicadores requeridos por municipio o provincia.
  3. Utilizando las funciones nativas `FOR JSON AUTO` o `FOR JSON PATH` (disponibles desde SQL Server 2016), el motor convierte el resultado tabular en un string JSON directamente en memoria.
  4. El procedimiento hace un `UPDATE dataset_assets SET json_content = @nuevoJson, version_no = version_no + 1 WHERE asset_key = 'indicadores_basicos';` en la base de datos de producción (ONE).
- **Ventajas:** 
  - **Independencia absoluta del desarrollo Frontend:** El equipo de datos de ONE no necesita tocar React, Node.js ni re-compilar la aplicación. Todo el proceso (ETL) ocurre 100% dentro de SQL Server, utilizando herramientas bajo su control.
  - **Reflejo inmediato:** Dado que la API ASP.NET Core del dashboard simplemente sirve el string JSON alojado en la base de datos, el tablero mostrará los nuevos datos instantáneamente.
- **Requiere:** Que el equipo de DBAs de la ONE orqueste y mantenga estas vistas agregadas y los jobs de sincronización dentro de su infraestructura de datos.

---

## Recomendación Sugerida

Para un ente gubernamental estadístico, la combinación **Opción 1 y Opción 2** suele ser la más exitosa a corto plazo:

1. **Estandarizar el Formato de Entrada:** Proveerles un **Diccionario de Datos y Plantillas CSV/Excel** estándar. En lugar de adaptar nuestros scripts a sus PDFs y Excels complejos con celdas combinadas, pedirles que el *producto final* de su lado sea un CSV tabular limpio por temática (ej. `salud_municipios.csv`).
2. **Script Consolidador (`generador.exe` o `.bat`):** Un único script potente (Python o Node) que toma esos CSV limpios, calcula los promedios provinciales/nacionales, y genera la estructura JSON requerida. Podemos compilar este script en un ejecutable (ej. `.exe`) para que no necesiten instalar Node.js ni programar.
3. **Manual de Operaciones (`SOP`):** Un documento escrito claro: "Paso 1: Exportar Censo a CSV. Paso 2: Poner en carpeta X. Paso 3: Hacer doble clic en ActualizarDatos.bat. Paso 4: Subir carpeta `dist` al servidor".

### Siguientes Pasos
¿Qué nivel de capacidad técnica tiene el equipo de ONE que recibirá el proyecto? (¿Son técnicos IT/Devs, Analistas de Datos con R/Python, o Especialistas que solo usan Excel?). Esto definirá qué camino tomar.
