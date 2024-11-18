import React, { useEffect, useState, useMemo, useCallback } from "react";
import { scaleLinear, scalePoint } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { Brush } from "@visx/brush";
import { Group } from "@visx/group";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { useMissingPersonsData } from "@/context/MissingPersonsContext";
import { extent } from "d3-array";

interface MissingPerson {
  age: number;
  height: number;
  weight: number;
  yearsMissing: number;
  gender: string;
  race: string;
  state: string;
}

interface Filters {
  [key: string]: [number | string, number | string];
}

interface BrushState {
  [key: string]: {
    start: number | string;
    end: number | string;
  };
}

const ParallelCoordinatesPlot: React.FC = () => {
  const { missingPersonsData, setFilteredData, loading } = useMissingPersonsData();
  const [data, setData] = useState<MissingPerson[]>([]);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [brushes, setBrushes] = useState<BrushState>({});
  const [sampleSize, setSampleSize] = useState(1000);

  // Move sampling logic to a separate memo to prevent resampling on filter changes
  const sampledData = useMemo(() => {
    if (!data.length) return [];
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }, [data, sampleSize]); // Only resample when data or sampleSize changes

  useEffect(() => {
    if (!missingPersonsData) return;

    const preparedData: MissingPerson[] = missingPersonsData
      .map((d) => {
        const age = d.subjectIdentification?.currentMinAge || null;
        const height = d.subjectDescription?.heightFrom || null;
        const weight = d.subjectDescription?.weightFrom || null;
        const dateMissing = new Date(d.sighting?.date || Date.now());
        const yearsMissing =
          (Date.now() - dateMissing.getTime()) / (1000 * 3600 * 24 * 365);
        const gender = d.subjectDescription?.sex?.localizedName || "Unknown";
        const race =
          d.subjectDescription?.primaryEthnicity?.localizedName || "Unknown";
        const state = d.sighting?.address?.state?.displayName || "Unknown";

        return {
          age,
          height,
          weight,
          yearsMissing,
          gender,
          race,
          state,
        };
      })
      .filter(
        (d) =>
          d.age !== null &&
          d.height !== null &&
          d.weight !== null &&
          d.yearsMissing !== null
      );

    setData(preparedData);
    setDimensions(["age", "height", "weight", "yearsMissing", "gender", "race"]);
  }, [missingPersonsData]);

  // Constants for plot dimensions
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotWidth = 800 - margin.left - margin.right;
  const plotHeight = 450 - margin.top - margin.bottom;
  const axisHeight = plotHeight - 50;

  const yScales: { [key: string]: any } = {};
  const xScale = scalePoint({
    range: [0, plotWidth],
    domain: dimensions,
    padding: 0.5,
  });

  dimensions.forEach((dim) => {
    if (dim === "gender" || dim === "race") {
      const categories = Array.from(new Set(data.map((d) => d[dim])));
      yScales[dim] = scalePoint({
        domain: categories,
        range: [axisHeight, 0],
        padding: 1,
      });
    } else {
      yScales[dim] = scaleLinear({
        domain: extent(data, (d) => d[dim] as number) as [number, number],
        range: [axisHeight, 0],
        nice: true,
      });
    }
  });

  const lineGenerator = (d: MissingPerson) => {
    return dimensions.map((dim) => {
      const x = xScale(dim) as number;
      const y = yScales[dim](d[dim]);
      return [x, y];
    });
  };

  const onBrushChange = useCallback(
    (dim: string, brush: any) => {
      if (!brush) {
        setBrushes((prev) => {
          const newBrushes = { ...prev };
          delete newBrushes[dim];
          return newBrushes;
        });
        setFilters((prev) => {
          const newFilters = { ...prev };
          delete newFilters[dim];
          return newFilters;
        });
        return;
      }

      const { y0, y1 } = brush;
      const scale = yScales[dim];

      let min, max;
      if (dim === "gender" || dim === "race") {
        const valuesInBrush = scale.domain().filter((value: any) => {
          const y = scale(value);
          return y >= y0 && y <= y1;
        });
        min = valuesInBrush[0];
        max = valuesInBrush[valuesInBrush.length - 1];
      } else {
        min = scale.invert(y1);
        max = scale.invert(y0);
      }

      setBrushes((prev) => ({
        ...prev,
        [dim]: { start: min, end: max },
      }));

      setFilters((prev) => ({
        ...prev,
        [dim]: [min, max],
      }));
    },
    [yScales]
  );

  const filteredData = useMemo(() => {
    return sampledData.filter((d) =>
      dimensions.every((dim) => {
        if (filters[dim]) {
          const [min, max] = filters[dim];
          const value = d[dim];
          if (typeof value === "number") {
            return value >= (min as number) && value <= (max as number);
          } else {
            return value === min || value === max;
          }
        }
        return true;
      })
    );
  }, [sampledData, filters, dimensions]);

  useEffect(() => {
    setFilteredData(filteredData);
  }, [filteredData, setFilteredData]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Parallel Coordinates Plot</h2>
      <div className="mb-4">
        <label htmlFor="sampleSize" className="mr-2 font-medium">
          Sample Size:
        </label>
        <input
          id="sampleSize"
          type="number"
          value={sampleSize}
          onChange={(e) =>
            setSampleSize(
              Math.max(100, Math.min(26000, parseInt(e.target.value) || 1000))
            )
          }
          min="100"
          max="26000"
          className="border rounded px-2 py-1 w-24"
        />
      </div>
      <svg width={800} height={450}>
        <Group top={margin.top} left={margin.left}>
          {filteredData.map((d, i) => {
            const pathData = lineGenerator(d);
            return (
              <LinePath
                key={i}
                data={pathData}
                x={(p) => p[0]}
                y={(p) => p[1]}
                stroke="steelblue"
                strokeWidth={1}
                strokeOpacity={0.5}
              />
            );
          })}

          {dimensions.map((dim) => (
            <Group key={dim} left={xScale(dim)}>
              <AxisLeft
                scale={yScales[dim]}
                left={0}
                label={dim.charAt(0).toUpperCase() + dim.slice(1)}
                labelProps={{ fontSize: 12, textAnchor: "middle", dy: -20 }}
                stroke="#1b1a1e"
                tickStroke="#1b1a1e"
                tickLabelProps={() => ({
                  fontSize: 10,
                  textAnchor: "end",
                  dy: "0.33em",
                  dx: "-0.33em",
                })}
              />
              <Brush
                id={`brush-${dim}`}
                xScale={scaleLinear({ range: [0, 20], domain: [0, 1] })}
                yScale={yScales[dim]}
                width={20}
                height={axisHeight}
                handleSize={8}
                resizeTriggerAreas={['left', 'right']}
                brushDirection="vertical"
                initialBrushPosition={brushes[dim] || undefined}
                onChange={(brush) => onBrushChange(dim, brush)}
                renderBrushHandle={(props) => <BrushHandle {...props} />}
                selectedBoxStyle={{
                  fill: "rgba(0, 0, 255, 0.1)",
                  stroke: "none",
                }}
              />
            </Group>
          ))}

          <AxisBottom
            top={axisHeight}
            scale={xScale}
            stroke="#1b1a1e"
            tickStroke="#1b1a1e"
            tickLabelProps={() => ({ fontSize: 12, textAnchor: "middle" })}
          />
        </Group>
      </svg>
    </div>
  );
};

const BrushHandle = ({ x, y, height, isBrushActive }: any) => {
  if (!isBrushActive) return null;
  return (
    <rect
      x={x - 4}
      y={y}
      width={8}
      height={height}
      className="fill-gray-400 stroke-gray-600 cursor-grab active:cursor-grabbing"
      strokeWidth={1}
      rx={4}
      ry={4}
    />
  );
};

export default ParallelCoordinatesPlot;