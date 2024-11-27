import React, { useState, useMemo } from 'react';
import { ScaleLinear } from 'd3-scale';
import { scalePoint, scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useMissingPersonsData } from '@/context/MissingPersonsContext';
import { extent, bin } from 'd3-array';

// Re order age, next to years missing
// Set age to age gone missing

type Dimension = 'age' | 'height' | 'weight' | 'yearsMissing';
type PlotDataPoint = {
  index: number;
  age: number;
  height: number;
  weight: number;
  yearsMissing: number;
  gender: string;
  race: string;
  state: string;
  [key: string]: number | string;
};

type DimensionScale = ScaleLinear<number, number>;
type HistogramScale = {
  x: DimensionScale;
  y: DimensionScale;
};

interface ParallelCoordinatesPlotProps {
  onDimensionClick?: (dimension: Dimension) => void;
}

const dimensions: Dimension[] = ['age', 'height', 'weight', 'yearsMissing'];

const ParallelCoordinatesPlot: React.FC<ParallelCoordinatesPlotProps> = ({ onDimensionClick }) => {
  const { missingPersonsData, filteredIndices, setFilteredIndices, loading } = useMissingPersonsData();
  const [sampleSize, setSampleSize] = useState(1000);
  const [selectedRanges, setSelectedRanges] = useState<{
    [key in Dimension]?: [number, number][];
  }>({});

  const margin = { top: 20, right: 40, bottom: 200, left: 60 };
  const plotWidth = 600 - margin.left - margin.right;
  const plotHeight = 400 - margin.top - margin.bottom;
  const mainHeight = 200;
  const histogramHeight = 100;

  const fullPlotData = useMemo<PlotDataPoint[]>(() => {
    if (!missingPersonsData) return [];
    return missingPersonsData.map((d, index) => ({
      index,
      age: d.subjectIdentification?.computedMissingMinAge || 0,
      height: d.subjectDescription?.heightFrom || 0,
      weight: d.subjectDescription?.weightFrom || 0,
      yearsMissing:
        (Date.now() - new Date(d.sighting?.date || Date.now()).getTime()) / (1000 * 3600 * 24 * 365),
      gender: d.subjectDescription?.sex?.localizedName || 'Unknown',
      race: d.subjectDescription?.primaryEthnicity?.localizedName || 'Unknown',
      state: d.sighting?.address?.state?.name || 'Unknown',
    }));
  }, [missingPersonsData]);

  const sampledPlotData = useMemo(() => {
    if (!filteredIndices) return [];
    const step = Math.max(1, Math.floor(filteredIndices.length / sampleSize));
    return filteredIndices
      .filter((_, idx) => idx % step === 0)
      .map((index) => fullPlotData[index])
      .filter((d): d is PlotDataPoint => dimensions.every((dim) => typeof d?.[dim] === 'number'));
  }, [filteredIndices, sampleSize, fullPlotData]);

  const xScale = useMemo(
    () =>
      scalePoint<Dimension>({
        range: [0, plotWidth],
        domain: dimensions,
        padding: 0.5,
      }),
    [plotWidth]
  );

  const yScales = useMemo(() => {
    const scales: Record<Dimension, DimensionScale> = {} as Record<Dimension, DimensionScale>;
    dimensions.forEach((dim) => {
      const values = fullPlotData.map((d) => d[dim] as number);
      scales[dim] = scaleLinear<number>({
        domain: extent(values) as [number, number],
        range: [mainHeight, 0],
        nice: true,
      });
    });
    return scales;
  }, [fullPlotData, mainHeight]);

  const histogramScales = useMemo(() => {
    const scales: Record<Dimension, HistogramScale> = {} as Record<Dimension, HistogramScale>;

    dimensions.forEach((dim) => {
      const values = fullPlotData.map((d) => d[dim] as number);
      const binGenerator = bin()
        .domain(extent(values) as [number, number])
        .thresholds(20);
      const bins = binGenerator(values);

      scales[dim] = {
        x: scaleLinear<number>({
          domain: extent(values) as [number, number],
          range: [0, plotWidth / dimensions.length - 20],
          nice: true,
        }),
        y: scaleLinear<number>({
          domain: [0, Math.max(...bins.map((b) => b.length))],
          range: [histogramHeight, 0],
        }),
      };
    });
    return scales;
  }, [fullPlotData, plotWidth, histogramHeight]);

  const updateFilters = (dimension: Dimension, range: [number, number]) => {
    const newSelectedRanges = { ...selectedRanges };

    if (!newSelectedRanges[dimension]) {
      newSelectedRanges[dimension] = [range];
    } else {
      const ranges = newSelectedRanges[dimension];
      if (ranges) {
        const rangeIndex = ranges.findIndex(
          ([min, max]) => min === range[0] && max === range[1]
        );
        if (rangeIndex >= 0) {
          ranges.splice(rangeIndex, 1);
          if (ranges.length === 0) {
            delete newSelectedRanges[dimension];
          }
        } else {
          ranges.push(range);
        }
      }
    }

    setSelectedRanges(newSelectedRanges);

    let newFilteredIndices = fullPlotData.map((_, index) => index);

    Object.entries(newSelectedRanges).forEach(([dim, ranges]) => {
      if (ranges) {
        newFilteredIndices = newFilteredIndices.filter((index) => {
          const value = fullPlotData[index][dim as Dimension] as number;
          return ranges.some(([min, max]) => value >= min && value <= max);
        });
      }
    });

    setFilteredIndices(newFilteredIndices);
  };

  const clearFilters = () => {
    setSelectedRanges({});
    setFilteredIndices(fullPlotData.map((_, index) => index));
  };

  const isBarSelected = (dimension: Dimension, range: [number, number]) => {
    const ranges = selectedRanges[dimension];
    if (!ranges) return false;
    return ranges.some(([min, max]) => min === range[0] && max === range[1]);
  };

  const handleDimensionClick = (dim: Dimension) => {
    if (onDimensionClick) {
      onDimensionClick(dim);
    }
  };

  if (loading || !sampledPlotData.length) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <label>
            Sample Size:
            <input
              type="number"
              value={sampleSize}
              onChange={(e) =>
                setSampleSize(
                  Math.max(100, Math.min(5000, parseInt(e.target.value) || 1000))
                )
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
      <div className="flex justify-center">
        <svg
          width={plotWidth + margin.left + margin.right}
          height={plotHeight + margin.top + margin.bottom + histogramHeight}
        >
          <Group top={margin.top} left={margin.left}>
            {/* Parallel Coordinates Plot */}
            {sampledPlotData.map((d, i) => (
              <LinePath<{ x: number; y: number }>
                key={i}
                data={dimensions.map((dim) => ({
                  x: xScale(dim) || 0,
                  y: yScales[dim](d[dim] as number),
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
              <Group key={dim} left={xScale(dim) || 0}>
                <AxisLeft scale={yScales[dim] as any} />
                {/* Custom label */}
                <text
                  x={0}
                  y={-10}
                  textAnchor="middle"
                  fontSize={12}
                  fill="black"
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => handleDimensionClick(dim)}
                >
                  {dim}
                </text>
              </Group>
            ))}

            {/* Histograms */}
            {dimensions.map((dim, dimIndex) => {
              const binGenerator = bin()
                .domain(yScales[dim].domain() as [number, number])
                .thresholds(20);
              const bins = binGenerator(fullPlotData.map((d) => d[dim] as number));
              const barWidth = (plotWidth / dimensions.length - 20) / bins.length;

              return (
                <Group
                  key={dim}
                  top={mainHeight + 50}
                  left={dimIndex * (plotWidth / dimensions.length)}
                >
                  {bins.map((b, binIndex) => {
                    const x0 = b.x0 ?? 0;
                    const x1 = b.x1 ?? 0;
                    const x = histogramScales[dim].x(x0);
                    const y = histogramScales[dim].y(b.length);
                    const height = histogramHeight - y;

                    return (
                      <rect
                        key={binIndex}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        fill={isBarSelected(dim, [x0, x1]) ? 'steelblue' : '#ccc'}
                        opacity={isBarSelected(dim, [x0, x1]) ? 0.8 : 0.5}
                        onClick={() => updateFilters(dim, [x0, x1])}
                        className="cursor-pointer hover:opacity-75"
                      />
                    );
                  })}
                  <AxisBottom
                    scale={histogramScales[dim].x as any}
                    top={histogramHeight}
                    label={dim}
                    tickLabelProps={() => ({
                      fontSize: 10,
                      textAnchor: 'middle',
                    })}
                  />
                </Group>
              );
            })}
          </Group>
        </svg>
      </div>
    </div>
  );
};

export default ParallelCoordinatesPlot;