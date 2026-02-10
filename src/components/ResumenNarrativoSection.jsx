// src/components/ResumenNarrativoSection.jsx
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


// Helper for comparisons
function buildComparison(local, national) {
  if (
    typeof local !== "number" ||
    typeof national !== "number" ||
    !isFinite(local) ||
    !isFinite(national)
  ) {
    return null;
  }

  const diffAbs = local - national; // Absolute difference (same unit)
  const diffPct = national !== 0 ? (diffAbs / national) * 100 : null; // % difference relative to national

  let etiqueta = "similar al promedio nacional";
  if (diffPct != null) {
    const absPct = Math.abs(diffPct);
    if (absPct < 5) {
      etiqueta = "muy cercana al promedio nacional";
    } else if (absPct < 15) {
      etiqueta =
        diffPct > 0
          ? "moderadamente por encima del promedio nacional"
          : "moderadamente por debajo del promedio nacional";
    } else {
      etiqueta =
        diffPct > 0
          ? "claramente por encima del promedio nacional"
          : "claramente por debajo del promedio nacional";
    }
  }

  return {
    valor_local: local,
    valor_nacional: national,
    diferencia_absoluta: diffAbs,
    diferencia_porcentual: diffPct,
    interpretacion: etiqueta,
  };
}

export default function ResumenNarrativoSection({
  municipio,
  indicators,
  condVida,
  econ,
  educ,
  tic,
  salud,
  educNivel,
  // Recibir todos los datos nacionales para comparación
  nationalBasic,
  nationalCondVida,
  nationalEcon,
  nationalTic,
  nationalEducNivel,
  nationalEducOferta,
  nationalHogares,
  nationalSalud,
  resumenComparacion, // Added
}) {
  const [resumen, setResumen] = useState("");
  const [loading, setLoading] = useState(false);

  // Reiniciar cuando cambia el municipio/ADM2
  useEffect(() => {
    setResumen("");
    setLoading(false);
  }, [municipio, indicators?.adm2_code]);

  async function handleGenerar() {
    const adm2 =
      indicators?.adm2_code != null
        ? String(indicators.adm2_code).padStart(5, "0")
        : null;

    // ¿Contexto provincial?
    const isProvinceContext = !adm2 && !!indicators?.provincia;

    // Tipo de territorio y nombre para el prompt de IA
    const tipoTerritorio = isProvinceContext ? "provincia" : "municipio";
    const nombreTerritorio =
      municipio ||
      indicators?.municipio ||
      (isProvinceContext && indicators?.provincia
        ? `Provincia de ${indicators.provincia}`
        : "") ||
      "";

    // Solo incluir datos de salud de este municipio (evitar payload demasiado grande)
    const saludEntradaRaw =
      adm2 && salud && salud[adm2] ? salud[adm2] : null;

    let saludResumen = null;
    if (saludEntradaRaw) {
      const centros = Array.isArray(saludEntradaRaw.centros)
        ? saludEntradaRaw.centros
        : [];

      const totalCentros = centros.length;

      const porTipo = centros.reduce((acc, c) => {
        const tipo = c.tipo_centro || "SIN_TIPO";
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {});

      const anios = centros
        .map((c) => c.anio_apertura)
        .filter((a) => typeof a === "number");

      const anioMin = anios.length ? Math.min(...anios) : null;
      const anioMax = anios.length ? Math.max(...anios) : null;

      saludResumen = {
        municipio: saludEntradaRaw.municipio,
        provincia: saludEntradaRaw.provincia,
        total_centros: totalCentros,
        por_tipo: porTipo,
        rango_anio_apertura: {
          minimo: anioMin,
          maximo: anioMax,
        },
      };
    }

    // Comparaciones con promedio nacional
    const comparaciones = {
      // Agua de uso doméstico - acueducto dentro de la vivienda (%)
      agua_domestico_acueducto: buildComparison(
        condVida?.agua_domestico?.categorias
          ?.del_acueducto_dentro_de_la_vivienda?.pct,
        nationalCondVida?.agua_domestico?.categorias
          ?.del_acueducto_dentro_de_la_vivienda?.pct
      ),

      // Agua para beber - botellones (%)
      agua_beber_botellon: buildComparison(
        condVida?.agua_beber?.categorias?.botellones?.pct,
        nationalCondVida?.agua_beber?.categorias?.botellones?.pct
      ),

      // Saneamiento - inodoro (%)
      saneamiento_inodoro: buildComparison(
        condVida?.sanitarios?.categorias?.inodoro?.pct,
        nationalCondVida?.sanitarios?.categorias?.inodoro?.pct
      ),

      // TIC - hogares con internet (%)
      tic_internet: buildComparison(
        tic?.internet?.rate_used != null ? tic.internet.rate_used * 100 : null,
        nationalTic?.internet?.rate_used != null
          ? nationalTic.internet.rate_used * 100
          : null
      ),

      // Nivel de instrucción - "ningún nivel" (%)
      educ_nivel_ninguno: buildComparison(
        // Calculate % locally if not present (ninguno.total / poblacion_3_mas)
        educNivel?.niveles?.ninguno?.total && educNivel?.poblacion_3_mas
          ? (educNivel.niveles.ninguno.total / educNivel.poblacion_3_mas) * 100
          : null,
        nationalEducNivel?.niveles?.ninguno?.porcentaje
      ),

      // Microempresas - proporción de establecimientos micro (%)
      empleo_microempresas: buildComparison(
        // Find micro band in local
        (() => {
          if (!econ?.dee_2024?.employment_size_bands) return null;
          const band = econ.dee_2024.employment_size_bands.find(
            (b) => b.size_band === "micro_1_10"
          );
          const total = econ.dee_2024.total_establishments;
          if (band && total > 0) return (band.establishments / total) * 100;
          return null;
        })(),
        // Find micro band in national
        (() => {
          if (!nationalEcon?.dee_2024?.employment_size_bands) return null;
          const band = nationalEcon.dee_2024.employment_size_bands.find(
            (b) => b.size_band === "micro_1_10"
          );
          const total = nationalEcon.dee_2024.total_establishments;
          if (band && total > 0) return (band.establishments / total) * 100;
          return null;
        })()
      ),
    };

    setLoading(true);

    // Check if running on GitHub Pages
    if (window.location.hostname.includes("github.io")) {
      setResumen(`
**⚠️ Función no disponible en la versión estática (GitHub Pages).**

La generación de narrativa utiliza inteligencia artificial (OpenAI) y requiere un servidor backend (PHP) para funcionar de manera segura.
Esta versión del dashboard es estática y no tiene capacidad de procesamiento de backend.

Para ver esta funcionalidad:
1. Clone el repositorio y ejecute localmente con un servidor PHP/Apache.
2. O despliegue en un servicio que soporte PHP.
      `.trim());
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        "https://prodecare.net/dashboard/api/generateNarrative.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `
Eres experto en planificación municipal en República Dominicana.
A partir de los datos siguientes, redacta un **"Resumen Narrativo de Diagnóstico ${tipoTerritorio === "provincia" ? "Provincial" : "Municipal"
              }: ${nombreTerritorio}"**.

No copies textos de ejemplo anteriores; solo úsalo como referencia de estilo.
Tu redacción debe ser sobria, realista y basada exclusivamente en los datos numéricos y reglas que siguen.

INFORMACIÓN SOBRE EL ÁMBITO DEL ANÁLISIS:
- tipo_territorio: "${tipoTerritorio}" (puede ser "municipio" o "provincia").
- nombre_territorio: "${nombreTerritorio}".

DATOS CUANTITATIVOS DEL MUNICIPIO (NO INVENTAR NÚMEROS):

1) Demografía y hogares
- Indicadores básicos del municipio (población total, variación 2010–2022, viviendas ocupadas y desocupadas):
${JSON.stringify(indicators)}

2) Condición de vida / Servicios básicos
- Agua para uso doméstico, agua para beber, saneamiento, electricidad, combustible, residuos:
${JSON.stringify(condVida)}

3) Economía y empleo
- Estructura productiva (DEE 2024), tamaño de empresas, empleo formal, sectores especializados:
${JSON.stringify(econ)}

4) Educación
- Oferta educativa y eficiencia (inicial, primaria, secundaria), infraestructura escolar:
${JSON.stringify(educ)}
- Niveles de instrucción (censo):
${JSON.stringify(educNivel)}
  Si en estos datos aparecen porcentajes de nivel de instrucción
  como "Ninguno", "Primaria/Básica", etc., **DEBES**
  describir explícitamente estos niveles en la sección **5. Educación**
  y **NO puedes decir** que "no hay información educativa" ni que
  "los datos son limitados".
  Procura utilizar al menos 3 comparaciones numéricas a lo largo del texto (en secciones 4, 5, 6) basadas en los datos comparativos proporcionados.

5) TIC
- Uso de internet, celular y computadora en el municipio:
${JSON.stringify(tic)}

6) Salud
- Resumen de establecimientos de salud en el municipio (ya agregado en formato compacto):
${JSON.stringify(saludResumen)}

PROMEDIOS / CONTEXTO NACIONAL (USAR SOLO COMO REFERENCIA PARA COMPARAR CON EL MUNICIPIO):

A) Indicadores básicos nacionales (población, hogares, personas por hogar):
${JSON.stringify(nationalBasic)}

B) Hogares y tamaño de hogar a nivel nacional:
${JSON.stringify(nationalHogares)}

C) Condición de vida nacional (agua, saneamiento, basura, electricidad, combustible):
${JSON.stringify(nationalCondVida)}

D) Economía y empleo nacional (DEE 2024, estructura por tamaño de empresa y sectores):
${JSON.stringify(nationalEcon)}

E) TIC nacionales (uso de internet, celular, computadora):
${JSON.stringify(nationalTic)}

F) Educación nacional:
- Niveles de instrucción:
${JSON.stringify(nationalEducNivel)}
- Oferta educativa / eficiencia:
${JSON.stringify(nationalEducOferta)}

G) Salud nacional:
- Establecimientos de salud por tipo y por regional:
${JSON.stringify(nationalSalud)}

TABLA RESUMEN DE COMPARACIÓN (NO MODIFICAR LOS NÚMEROS):

- A continuación tienes una tabla pre-calculada llamada \`resumenComparacion\`.
- Cada fila incluye:
  • "categoria": eje temático (Demografía, Servicios básicos, etc.),
  • "indicador": nombre del indicador,
  • "unidad": por ejemplo "porcentaje", "personas/hogar", "empleos/1000", etc.,
  • "municipio": valor del territorio analizado,
  • "provincia": valor promedio de la provincia,
  • "nacional": valor promedio nacional (si es null o "s/i", significa que no se dispone de ese dato).

- Usa esta tabla como principal referencia para tus comparaciones numéricas
  entre el municipio, su provincia y el país. No inventes otros valores.

${JSON.stringify(resumenComparacion)}

- Cuando haya diferencias entre los números de la tabla
  "RESUMEN DE COMPARACIÓN" y los bloques de datos detallados,
  LA TABLA ES LA REFERENCIA PRINCIPAL. No corrijas la tabla;
  describe la situación usando esos valores.

- Siempre que sea posible, para cada tema clave
  (demografía/hogares, servicios básicos, educación, TIC,
   economía/empleo y salud), intenta incluir al menos una frase que
  compare explícitamente:
    • el valor del municipio,
    • el de su provincia,
    • y el promedio nacional, si está disponible.

COMPARACIONES NUMÉRICAS PRECALCULADAS ENTRE EL TERRITORIO Y EL PROMEDIO NACIONAL:

- En este bloque encontrarás varias comparaciones ya calculadas entre
  el territorio (municipio o provincia) y el promedio nacional para
  temas como agua, saneamiento, TIC, educación y estructura económica.

- Cada comparación contiene:
  - valor_local: valor del municipio/provincia,
  - valor_nacional: valor de referencia del país,
  - diferencia_absoluta: diferencia en puntos (valor_local - valor_nacional),
  - diferencia_porcentual: diferencia relativa,
  - interpretacion: texto corto que sugiere cómo leer esa diferencia.

- NO recalcules tú estas diferencias; utiliza directamente estos valores
  cuando describas la situación del territorio.
- Si una comparación es null, simplemente ignórala.

${JSON.stringify(comparaciones)}


REGLAS DE INTERPRETACIÓN (MUY IMPORTANTES):

- El ámbito analizado puede ser un municipio o una provincia:
  - Si tipo_territorio = "provincia", **no uses expresiones** como
    "este municipio" o "el municipio". En su lugar, di siempre
    "esta provincia", "la provincia" o "el territorio".
  - Si tipo_territorio = "municipio", puedes usar "este municipio"
    o "el municipio" con normalidad.

- Evita adjetivos muy fuertes como "muy alto", "muy bajo",
  "crítico", "significativo" o "significativamente inferior/superior"
  salvo que la diferencia sea realmente grande.

- Cuando la diferencia entre el municipio y la provincia o el país
  sea pequeña (por ejemplo, menos de 5 puntos porcentuales),
  utiliza expresiones suaves como:
    • "similar al promedio nacional",
    • "ligeramente por encima",
    • "ligeramente por debajo".

- Solo usa expresiones algo más marcadas ("claramente por encima",
  "claramente por debajo") cuando la diferencia sea grande
  (por ejemplo, más de 10 puntos porcentuales o más del doble).

- No te centres solo en la comparación municipio vs país:
  siempre que haya datos provinciales en la tabla, menciona
  explícitamente si el municipio está por encima, por debajo
  o en línea con el promedio de su provincia.

- Cuando la tabla de RESUMEN DE COMPARACIÓN incluya datos del
  municipio, de su provincia y del país para un mismo indicador,
  intenta mencionar explícitamente las tres dimensiones al menos
  en algunas frases clave. Por ejemplo:

  "En este municipio, el X% ..., frente al Y% en su provincia
   y al Z% a nivel nacional."

- Si solo hay datos municipales y provinciales, describe la relación
  entre ambos (por encima, por debajo, similar) sin inventar un valor
  nacional.

- **NO uses estándares globales o ideales internacionales**.
  No menciones frases como "según estándares internacionales" o
  "la OMS recomienda…". Las comparaciones deben hacerse **solo contra
  los promedios nacionales** proporcionados arriba.
- No hagas comparaciones con "otros municipios del país" si el prompt
  no te da datos explícitos para eso.
  No escribas frases como:
  - "es relativamente alto en comparación con otros municipios del país"
  - "está por debajo de la mayoría de los municipios".
  Limítate a describir el valor del municipio y, cuando corresponda,
  compararlo solo con los promedios nacionales proporcionados.  

- Para la **población**, no tiene sentido comparar el tamaño absoluto
  del municipio con la población total del país. En su lugar:
  - Comenta la variación 2010–2022 (crecimiento o disminución).
  - Si no tienes un dato claro de variación nacional en los datos
    del prompt, **no digas** que el crecimiento "supera el promedio
    nacional" ni expresiones equivalentes.
  - En esos casos, describe simplemente el crecimiento del municipio
    (por ejemplo: "ha crecido de forma sostenida en el período
    2010–2022") sin hacer comparaciones numéricas con el país.
  - Nunca compares la población total del territorio (municipio o provincia)
    con la población total del país ni digas que "está por encima" o
    "por debajo del promedio nacional" en términos de tamaño poblacional.
    Solo describe la evolución interna (crecimiento o disminución) del
    territorio y, si no tienes un valor nacional explícito comparable, no
    inventes frases sobre "promedio nacional" en este tema.

- No afirmes que un valor es "significativo en comparación con el
  promedio nacional" si en los datos no aparece explícitamente
  un valor nacional para ese indicador.

- En particular, para el crecimiento de la población (2010–2022),
  si no se proporciona una tasa de crecimiento nacional en los datos,
  describe el crecimiento del municipio sin compararlo con el país.
  Por ejemplo: "ha crecido de forma sostenida", "presenta un aumento
  relevante en el período", etc., pero sin decir que es mayor o menor
  que el promedio nacional.

- Evita calificar un indicador como "crítico" o "muy crítico"
  salvo que los datos muestren una brecha extremadamente grande.
  En la mayoría de los casos, prefiere expresiones como
  "es un aspecto que requiere atención" o "plantea retos importantes".

- Para la mayoría de los indicadores de servicios básicos
  (agua, saneamiento, residuos, electricidad), utiliza
  expresiones moderadas:
    • "por debajo del promedio nacional",
    • "claramente por debajo" solo si la diferencia es muy grande
      (por ejemplo, más de 20 puntos porcentuales).

- Para **hogares y tamaño de hogar**:
  - Solo menciona el promedio de personas por hogar del territorio si
    aparece explícitamente en los datos del municipio o de la provincia.
  - Si solo dispones del promedio nacional y no tienes un dato local,
    debes decir algo como:
    "no se dispone de un dato específico para el territorio, por lo que
     no es posible describir con precisión este aspecto".
  - **No escribas frases** como:
    - "es razonable suponer que el tamaño del hogar no difiere mucho del
       promedio nacional",
    - "es posible que el patrón de los hogares se asemeje al nacional",
    - "probablemente los hogares tienen una estructura similar a la del
       promedio nacional",
    ni otras expresiones que supongan o adivinen valores locales.
  - Si falta el dato local, limita tu comentario a reconocer esa ausencia
    de manera neutra, sin dramatizarla ni extrapolar a partir del promedio
    nacional.

- Para el **agua**, diferencia claramente:
  - Agua de uso doméstico (agua_domestico): acueducto dentro o cerca
    de la vivienda, pozos, etc.
  - Agua para beber (agua_beber): acueducto, botellones, camión, etc.
  Es **normal** en República Dominicana que la mayor parte del agua para
  beber provenga de "botellones", incluso en municipios con buen acceso
  al acueducto.
  - Si el patrón del municipio es parecido al nacional, dilo así:
    "sigue un patrón similar al nacional".
  - **No uses expresiones** como "dependencia excesiva de botellones"
    ni presentes ese patrón como un problema grave por sí mismo,
    salvo que los datos muestren una situación claramente mucho peor
    que el promedio nacional.
  - Recuerda que es normal en República Dominicana que una gran parte
    del agua para beber provenga de "botellones".
  - Si el patrón del municipio es parecido al nacional, di algo como
    "sigue un patrón similar al nacional" o "se asemeja a la situación
    del país en su conjunto".
  - No uses expresiones como "dependencia notable" o "dependencia
    excesiva de botellones" a menos que los datos muestren claramente
    una situación mucho más extrema que el promedio nacional.

- En general, **no describas al municipio como si “no tuviera nada”**
  si sus valores son similares al promedio nacional. Evita frases como:
  "carece de infraestructura", "la situación es muy deficitaria",
  "enfrenta graves carencias"
  cuando los datos no muestran una brecha clara respecto al promedio.
  En su lugar, usa formulaciones como:
  - "los indicadores son similares al promedio nacional",
  - "ligeramente por encima",
  - "ligeramente por debajo",
  - "presenta algunos retos puntuales en…".

  - Cuando existan datos en la tabla de resumen comparativo para un tema
    (por ejemplo, % de hogares con Internet, % de población urbana,
    % de microempresas, % de abandono en secundaria, etc.), utiliza esos
    valores para escribir frases comparativas claras del tipo:

    "En este municipio, el X% ..., frente al Y% en su provincia
     y al Z% a nivel nacional."

  - A lo largo del texto (especialmente en las secciones 4, 5 y 6),
    incluye al menos 5 frases que comparen explícitamente:
      • el valor del municipio,
      • el valor de la provincia,
      • y el valor nacional cuando esté disponible.

  - Si el valor provincial o nacional es null o "s/i", simplemente compáralo
    con la dimensión disponible (por ejemplo, municipio vs país), o bien
    describe solo el valor local sin inventar datos faltantes.

  - No inventes porcentajes ni totales: usa únicamente los números que
    aparecen en la tabla y en los bloques de datos cuantitativos anteriores.

  - Cuando existan datos nacionales y datos del territorio (municipio o
    provincia) sobre un mismo tema (nivel educativo, TIC, empleo, acceso
    a agua o saneamiento, TIC, tamaño de empresa, etc.), utiliza cuando
    sea posible las comparaciones numéricas ya calculadas en el bloque
    "COMPARACIONES NUMÉRICAS PRECALCULADAS".

  - A lo largo del texto, debes incorporar al menos **5 frases
    explícitamente comparativas** basadas en estas comparaciones,
    distribuidas entre varios temas (por ejemplo, agua/saneamiento,
    educación, TIC, economía y empleo).

  - Para cada comparación que no sea null y que decidas usar, escribe
    una frase que mencione:
    • el valor_local,
    • el valor_nacional,
    • y, si la diferencia_absoluta es distinta de cero, la diferencia
      aproximada en puntos porcentuales.

  - Ejemplo de redacción:
    "En este municipio, el 33.4% de las viviendas recibe agua del
    acueducto dentro de la vivienda, frente al 40.0% a nivel nacional,
    es decir, unos 6.6 puntos porcentuales por debajo del promedio del país."

  - No inventes nuevos números: utiliza exactamente valor_local,
    valor_nacional y diferencia_absoluta tal como aparecen en el JSON.

  - No exageres diferencias pequeñas y no uses calificativos extremos
    ("muy bajo", "muy crítico") si la brecha no es claramente grande.

- Cuando falte un dato específico del municipio (por ejemplo, el tamaño
  promedio del hogar), puedes mencionarlo, pero de forma neutra:
  - "no se dispone de un dato específico para el municipio, por lo que
     no es posible describir con precisión este aspecto".
  Evita frases que exageren la falta de información, como:
  - "esto limita seriamente la capacidad de análisis"
  - "impide evaluar de manera adecuada la realidad local".

- El tono debe ser profesional, realista y equilibrado:
  reconoce las brechas, pero también los puntos fuertes y la base de
  servicios ya existente en el municipio dentro del contexto dominicano.



FORMATO DEL TEXTO:

- Escribe **8 secciones numeradas** y usa títulos en negrita EXACTAMENTE así:
  **1. Panorama general**
  **2. Población y estructura demográfica**
  **3. Hogares y patrón urbano–rural**
  **4. Servicios básicos y condición de vida**
  **5. Educación**
  **6. Economía y empleo**
  **7. Salud**
  **8. Implicaciones estratégicas para el Plan Municipal de Desarrollo**

- Después de cada título en negrita, escribe **1–3 párrafos cortos**.
- Cuando sea útil, usa viñetas con "•".
- Usa un tono profesional, claro y narrativo, similar a un informe técnico,
  como en un diagnóstico usado para un Plan Municipal de Desarrollo.


SECCIÓN 8 — IMPACTO ESTRATÉGICO (MUY IMPORTANTE):

- En la sección **8. Implicaciones estratégicas para el Plan Municipal de Desarrollo**:
  - Resume de forma sintética las principales brechas y oportunidades detectadas
    en las secciones anteriores.
  - **Incluye dentro de esta misma sección entre 4 y 7 viñetas** con
    propuestas estratégicas concretas para el municipio, centradas en:
      • servicios básicos (agua, saneamiento, residuos, electricidad, TIC),
      • educación,
      • empleo y economía local,
      • salud y fortalecimiento de la red de establecimientos.
  - No crees una sección separada llamada "Propuestas Estratégicas";
    las propuestas deben estar integradas dentro de la sección 8.
  - En la sección 8, no añadas un subtítulo separado como
  "Propuestas estratégicas:". Después de describir las brechas y
  oportunidades en 1–2 párrafos, introduce directamente las viñetas
  con propuestas dentro de la misma sección.


EXTENSIÓN:

- Longitud total aproximada: entre **1000 y 1,500 palabras**.
`,

          }),
        }
      );

      const json = await res.json();
      const full = json.choices?.[0]?.message?.content ?? "";
      setResumen(full.trim());
    } catch (err) {
      console.error("GPT resumen error:", err);
      setResumen("Error al generar resumen.");
    }

    setLoading(false);
  }

  return (
    <div className="card p-4 my-6">
      <h2 className="text-lg font-bold mb-2">
        📝 Resumen de Diagnóstico Automático (GPT)
      </h2>

      <button
        onClick={handleGenerar}
        disabled={loading}
        className="hide-on-print bg-blue-600 text-white font-semibold px-4 py-2 rounded"
      >
        {loading ? "Generando..." : "Crear Diagnóstico Narrativo"}
      </button>

      <h3 className="text-md mt-4 font-bold">Resumen Narrativo</h3>
      <div className="mt-2 text-sm leading-relaxed prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
        >
          {resumen || "_Aún no se ha generado el resumen._"}
        </ReactMarkdown>
      </div>
    </div>
  );
}
