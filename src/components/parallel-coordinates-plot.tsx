import React, { useEffect, useState, useMemo } from "react";
import { scaleLinear, scalePoint } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { Group } from "@visx/group";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { useMissingPersonsData } from "@/context/MissingPersonsContext";
import { extent, bin } from "d3-array";

const ParallelCoordinatesPlot: React.FC = () => {
  const { missingPersonsData, filteredIndices, setFilteredIndices, loading } =
    useMissingPersonsData();
  const [sampleSize, setSampleSize] = useState(1000);
  const [selectedRanges, setSelectedRanges] = useState<{
    [key: string]: [number, number][];
  }>({});

  const dimensions = ["age", "height", "weight", "yearsMissing"];

  const margin = { top: 20, right: 40, bottom: 200, left: 60 };
  const plotWidth = 1000 - margin.left - margin.right;
  const plotHeight = 600 - margin.top - margin.bottom;
  const mainHeight = 300;
  const histogramHeight = 100;

  // Preprocess data for consistent access
  const fullPlotData = useMemo(() => {
    if (!missingPersonsData) return [];
    return missingPersonsData.map((d, index) => ({
      index,
      age: d.subjectIdentification?.currentMinAge || 0,
      height: d.subjectDescription?.heightFrom || 0,
      weight: d.subjectDescription?.weightFrom || 0,
      yearsMissing:
        (Date.now() - new Date(d.sighting?.date || Date.now()).getTime()) /
        (1000 * 3600 * 24 * 365),
      gender: d.subjectDescription?.sex?.localizedName || "Unknown",
      race: d.subjectDescription?.primaryEthnicity?.localizedName || "Unknown",
      state: d.sighting?.address?.state?.name || "Unknown",
    }));
  }, [missingPersonsData]);

  // Subsample data for performance
  const sampledPlotData = useMemo(() => {
    if (!filteredIndices) return [];
    const step = Math.max(1, Math.floor(filteredIndices.length / sampleSize));
    return filteredIndices
      .filter((_, idx) => idx % step === 0)
      .map((index) => fullPlotData[index])
      .filter((d) => dimensions.every((dim) => d[dim] !== null && d[dim] !== undefined));
  }, [filteredIndices, sampleSize, fullPlotData]);

  const xScale = useMemo(
    () =>
      scalePoint({
        range: [0, plotWidth],
        domain: dimensions,
        padding: 0.5,
      }),
    [plotWidth, dimensions]
  );

  const yScales = useMemo(() => {
    const scales: { [key: string]: any } = {};
    dimensions.forEach((dim) => {
      const values = fullPlotData.map((d) => d[dim]);
      scales[dim] = scaleLinear({
        domain: extent(values) as [number, number],
        range: [mainHeight, 0],
        nice: true,
      });
    });
    return scales;
  }, [fullPlotData, mainHeight, dimensions]);

  const histogramScales = useMemo(() => {
    const scales: { [key: string]: { x: any; y: any } } = {};
    dimensions.forEach((dim) => {
      const values = fullPlotData.map((d) => d[dim]);
      const binGenerator = bin().domain(extent(values) as [number, number]).thresholds(20);
      const bins = binGenerator(values);

      scales[dim] = {
        x: scaleLinear({
          domain: extent(values) as [number, number],
          range: [0, plotWidth / dimensions.length - 20],
          nice: true,
        }),
        y: scaleLinear({
          domain: [0, Math.max(...bins.map((b) => b.length))],
          range: [histogramHeight, 0],
        }),
      };
    });
    return scales;
  }, [fullPlotData, dimensions, plotWidth, histogramHeight]);

  const updateFilters = (dimension: string, range: [number, number]) => {
    const newSelectedRanges = { ...selectedRanges };

    if (!newSelectedRanges[dimension]) {
      newSelectedRanges[dimension] = [range];
    } else {
      const rangeIndex = newSelectedRanges[dimension].findIndex(
        ([min, max]) => min === range[0] && max === range[1]
      );
      if (rangeIndex >= 0) {
        newSelectedRanges[dimension].splice(rangeIndex, 1);
        if (newSelectedRanges[dimension].length === 0) {
          delete newSelectedRanges[dimension];
        }
      } else {
        newSelectedRanges[dimension].push(range);
      }
    }

    setSelectedRanges(newSelectedRanges);

    let newFilteredIndices = fullPlotData.map((_, index) => index);

    Object.entries(newSelectedRanges).forEach(([dim, ranges]) => {
      newFilteredIndices = newFilteredIndices.filter((index) => {
        const value = fullPlotData[index][dim];
        return ranges.some(([min, max]) => value >= min && value <= max);
      });
    });

    setFilteredIndices(newFilteredIndices);
  };

  const clearFilters = () => {
    setSelectedRanges({});
    setFilteredIndices(fullPlotData.map((_, index) => index));
  };

  const isBarSelected = (dimension: string, range: [number, number]) => {
    if (!selectedRanges[dimension]) return false;
    return selectedRanges[dimension].some(
      ([min, max]) => min === range[0] && max === range[1]
    );
  };

  if (loading || !sampledPlotData.length) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Missing Persons Analysis</h2>
        <div>
          <label>
            Sample Size:
            <input
              type="number"
              value={sampleSize}
              onChange={(e) =>
                setSampleSize(Math.max(100, Math.min(5000, parseInt(e.target.value) || 1000)))
              }
              className="ml-2 px-2 py-1 border rounded"
            />
          </label>
          <button
            onClick={clearFilters}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Clear Filters
          </button>
        </div>
      </div>
      <svg
        width={plotWidth + margin.left + margin.right}
        height={plotHeight + margin.top + margin.bottom + histogramHeight}
      >
        <Group top={margin.top} left={margin.left}>
          {/* Parallel Coordinates Plot */}
          {sampledPlotData.map((d, i) => (
            <LinePath
              key={i}
              data={dimensions.map((dim) => ({
                x: xScale(dim) || 0,
                y: yScales[dim](d[dim]),
              }))}
              x={(p) => p.x}
              y={(p) => p.y}
              stroke="steelblue"
              strokeWidth={1}
              strokeOpacity={0.2}
            />
          ))}

          {/* Axes */}
          {dimensions.map((dim) => (
            <Group key={dim} left={xScale(dim)}>
              <AxisLeft scale={yScales[dim]} label={dim} />
            </Group>
          ))}

          {/* Histograms */}
          {dimensions.map((dim, dimIndex) => {
            const binGenerator = bin()
              .domain(yScales[dim].domain() as [number, number])
              .thresholds(20);
            const bins = binGenerator(fullPlotData.map((d) => d[dim]));
            const barWidth = (plotWidth / dimensions.length - 20) / bins.length;

            return (
              <Group
                key={dim}
                top={mainHeight + 50}
                left={dimIndex * (plotWidth / dimensions.length)}
              >
                {bins.map((b, binIndex) => (
                  <rect
                    key={binIndex}
                    x={histogramScales[dim].x(b.x0)}
                    y={histogramScales[dim].y(b.length)}
                    width={barWidth}
                    height={histogramHeight - histogramScales[dim].y(b.length)}
                    fill={isBarSelected(dim, [b.x0, b.x1]) ? "steelblue" : "#ccc"}
                    opacity={isBarSelected(dim, [b.x0, b.x1]) ? 0.8 : 0.5}
                    onClick={() => updateFilters(dim, [b.x0, b.x1])}
                    className="cursor-pointer hover:opacity-75"
                  />
                ))}
                <AxisBottom
                  scale={histogramScales[dim].x}
                  top={histogramHeight}
                  label={dim}
                  tickLabelProps={() => ({
                    fontSize: 10,
                    textAnchor: "middle",
                  })}
                />
              </Group>
            );
          })}
        </Group>
      </svg>
    </div>
  );
};

export default ParallelCoordinatesPlot;
