/**
 * charts.jsx - Re-export Hub
 *
 * Este archivo re-exporta todos los componentes de gráficos desde sus
 * respectivos módulos para mantener la compatibilidad con los imports existentes.
 *
 * Módulos:
 * - PopulationCharts: Indicadores básicos, pirámides, género, urbano/rural
 * - HouseholdCharts: Hogares totales, personas por hogar, tamaño
 * - EconomyCharts: Economía y empleo (DEE 2024)
 * - SharedCharts: Tarjetas temáticas genéricas
 */

// Population & Demographics
export {
  BasicIndicators,
  PopulationPyramid,
  PopulationPyramid2010,
  GenderRatio,
  UrbanRuralCard,
  BLUE,
  RED,
  COLORS,
} from "./charts/PopulationCharts";

// Households
export {
  HouseholdsTotalCard,
  PersonsPerHouseholdCard,
  HouseholdSizeChart,
} from "./charts/HouseholdCharts";

// Economy & Employment
export { EconomyEmployment } from "./charts/EconomyCharts";

// Shared / Generic
export { ThematicListCard, formatIndicatorName } from "./charts/SharedCharts";