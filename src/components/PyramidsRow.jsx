import React from "react";
import {
  GenderRatio,
  PopulationPyramid,
  PopulationPyramid2010,
} from "./charts";

export default function PyramidsRow({
  indicadores,
  nationalBasic,
  pyramid,
  pyramid2010,
}) {
  return (
    <div className="pyramids-row print-pyramid-small">
      <div className="
        grid gap-4 
        md:grid-cols-1 lg:grid-cols-3
        print-3-cols no-break
      ">
        <GenderRatio indicators={indicadores} national={nationalBasic} />
        <PopulationPyramid pyramid={pyramid} />
        <PopulationPyramid2010 pyramid={pyramid2010} />
      </div>
    </div>
  );
}
