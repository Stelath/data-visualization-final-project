// ParallelCoordinatesPlot.tsx

import React, { useState, useMemo } from 'react';
import { ScaleLinear, ScalePoint } from 'd3-scale';
import { scalePoint, scaleLinear, scaleBand } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useMissingPersonsData } from '@/context/MissingPersonsContext';
import { extent, bin } from 'd3-array';

// Type Definitions
type DimensionKind = 'numerical' | 'categorical';

type Dimension = {
  name: string;
  kind: DimensionKind;
};

type FullPlotDataPoint = {
  index: number;
  age: number;
  yearsMissing: number;
  height: number;
  weight: number;
  eyeColor: string;
  race: string;
  gender: string;
  state: string;
  county: string;
};

const dimensions: Dimension[] = [
  { name: 'age', kind: 'numerical' },
  { name: 'yearsMissing', kind: 'numerical' },
  { name: 'height', kind: 'numerical' },
  { name: 'eyeColor', kind: 'categorical' },
  { name: 'weight', kind: 'numerical' },
  { name: 'race', kind: 'categorical' },
];

type DimensionScale = ScaleLinear<number, number> | ScalePoint<string>;

interface ParallelCoordinatesPlotProps {
  onDimensionClick?: (dimension: Dimension) => void;
  onPersonSelect?: (personData: FullPlotDataPoint) => void;
}

const ParallelCoordinatesPlot: React.FC<ParallelCoordinatesPlotProps> = ({
  onDimensionClick,
  onPersonSelect,
}) => {
  const {
    fullPlotData,
    filteredIndices,
    filterState,
    setFilterState,
    clearAllFilters,
    loading,
  } = useMissingPersonsData();
  
  const [sampleSize, setSampleSize] = useState(1000);

  const margin = { top: 20, right: 40, bottom: 200, left: 60 };
  const plotWidth = 900 - margin.left - margin.right;
  const plotHeight = 275 - margin.top - margin.bottom;
  const mainHeight = 200;
  const histogramHeight = 100;

  const sampledPlotData = useMemo(() => {
    if (!fullPlotData) return [];
    const step = Math.max(1, Math.floor(fullPlotData.length / sampleSize));
    return fullPlotData
      .filter((_, idx) => idx % step === 0)
      .map((d) => ({
        ...d,
        isFiltered: filteredIndices?.includes(d.index) || false
      }))
      .filter(
        (d): d is FullPlotDataPoint & { isFiltered: boolean } =>
          dimensions.every((dim) => d[dim.name] !== undefined)
      );
  }, [filteredIndices, sampleSize, fullPlotData]);

  const xScale = useMemo(
    () =>
      scalePoint<string>({
        range: [0, plotWidth],
        domain: dimensions.map((d) => d.name),
        padding: 0.5,
      }),
    [plotWidth]
  );

  const yScales = useMemo(() => {
    if (!fullPlotData) return {}; // Return an empty object if data is not loaded

    const scales: Record<string, DimensionScale> = {};
    dimensions.forEach(({ name, kind }) => {
      if (kind === 'numerical') {
        const values = fullPlotData.map((d) => d[name] as number);
        scales[name] = scaleLinear<number>({
          domain: extent(values) as [number, number],
          range: [mainHeight, 0],
          nice: true,
        });
      } else {
        const values = Array.from(
          new Set(fullPlotData.map((d) => d[name] as string))
        );
        scales[name] = scalePoint<string>({
          domain: values,
          range: [mainHeight, 0],
          padding: 0.5,
        });
      }
    });
    return scales;
  }, [fullPlotData, mainHeight]);

  const updateFilters = (dimension: string, range: [number, number] | [string]) => {
    setFilterState(prevState => {
      const newDimensions = [...prevState.dimensions];
      
      const dimIndex = newDimensions.findIndex(d => d.dimension === dimension);
      
      const dim = dimensions.find(d => d.name === dimension);
      if (!dim) return prevState;
  
      if (dimIndex === -1) {
        newDimensions.push({
          dimension,
          ranges: [range]
        });
      } else {
        const existingFilter = newDimensions[dimIndex];
        const rangeIndex = existingFilter.ranges.findIndex(r => {
          if (dim.kind === 'numerical') {
            const [existingMin, existingMax] = r as [number, number];
            const [newMin, newMax] = range as [number, number];
            return Math.abs(existingMin - newMin) < 0.0001 && 
                   Math.abs(existingMax - newMax) < 0.0001;
          } else {
            return r[0] === range[0];
          }
        });
  
        if (rangeIndex === -1) {
          existingFilter.ranges.push(range);
        } else {
          existingFilter.ranges.splice(rangeIndex, 1);
          if (existingFilter.ranges.length === 0) {
            newDimensions.splice(dimIndex, 1);
          }
        }
      }
  
      return {
        ...prevState,
        dimensions: newDimensions
      };
    });
  };

  const isBarSelected = (dimension: string, range: [number, number] | [string]) => {
    const dimFilter = filterState.dimensions.find(d => d.dimension === dimension);
    if (!dimFilter) return false;
    
    return dimFilter.ranges.some(r => {
      if (typeof r[0] === 'number') {
        return Math.abs(r[0] - (range[0] as number)) < 0.0001 &&
               Math.abs(r[1] - (range[1] as number)) < 0.0001;
      }
      return r[0] === (range[0] as string);
    });
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
                setSampleSize(Math.max(100, Math.min(fullPlotData.length, parseInt(e.target.value) || 1000)))
              }
              className="ml-2 px-2 py-1 border rounded"
            />
          </label>
          <button 
            onClick={clearAllFilters} 
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Clear All Filters
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
            {sampledPlotData.map((d, i) => {
              const isFiltered = d.isFiltered;

              return (
                <LinePath<{ x: number; y: number }>
                  key={i}
                  data={dimensions.map((dim) => {
                    const x = xScale(dim.name) || 0;
                    let y = 0;
                    if (dim.kind === 'numerical') {
                      const scale = yScales[dim.name] as ScaleLinear<number, number>;
                      if (scale) {
                        y = scale(d[dim.name] as number);
                      } else {
                        y = 0;
                      }
                    } else {
                      const scale = yScales[dim.name] as ScalePoint<string>;
                      if (scale) {
                        y = scale(d[dim.name] as string) || 0;
                      } else {
                        y = 0;
                      }
                    }
                    return { x, y };
                  })}
                  x={(p) => p.x}
                  y={(p) => p.y}
                  stroke={isFiltered ? (d.gender.toLowerCase().includes('female') ? '#FF69B4' : '#4169E1') : '#A9A9A9'}
                  strokeWidth={1}
                  strokeOpacity={isFiltered ? 0.6 : 0.1}
                  onClick={() => onPersonSelect && onPersonSelect(d)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}

            {/* Axes */}
            {dimensions.map((dim) => (
              <Group key={dim.name} left={xScale(dim.name) || 0}>
                {yScales[dim.name] ? (
                  <>
                    <AxisLeft
                      scale={yScales[dim.name] as any}
                      numTicks={dim.kind === 'categorical' ? undefined : 5}
                    />
                    <text
                      x={0}
                      y={-10}
                      textAnchor="middle"
                      fontSize={12}
                      fill="black"
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleDimensionClick(dim)}
                    >
                      {dim.name}
                    </text>
                  </>
                ) : null}
              </Group>
            ))}

            {/* Histograms */}
            {dimensions.map((dim, dimIndex) => {
              if (!yScales[dim.name]) return null; // Ensure yScale exists

              const columnWidth = plotWidth / dimensions.length;
              const histogramWidth = columnWidth * 0.8;
              const histogramLeft = (columnWidth - histogramWidth) / 2;

              if (dim.kind === 'numerical') {
                const binGenerator = bin()
                  .domain((yScales[dim.name] as ScaleLinear<number, number>).domain())
                  .thresholds(20);
                const values = fullPlotData.map((d) => d[dim.name] as number);
                const bins = binGenerator(values);
                const barWidth = histogramWidth / bins.length;
                
                return (
                  <Group
                    key={dim.name}
                    top={mainHeight - 15}
                    left={(dimIndex * columnWidth) + histogramLeft}
                  >
                    {bins.map((b, binIndex) => {
                      const x0 = b.x0 ?? 0;
                      const x1 = b.x1 ?? 0;
                      const x = binIndex * barWidth;
                      const binProportion = b.length / fullPlotData.length;
                      const scaledHeight = binProportion * histogramHeight * bins.length * 0.10;
                      const height = Math.min(scaledHeight, histogramHeight);
                      const y = histogramHeight - height;

                      return (
                        <rect
                          key={binIndex}
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          fill={isBarSelected(dim.name, [x0, x1]) ? 'steelblue' : '#ccc'}
                          opacity={isBarSelected(dim.name, [x0, x1]) ? 0.8 : 0.5}
                          onClick={() => updateFilters(dim.name, [x0, x1])}
                          className="cursor-pointer hover:opacity-75"
                        />
                      );
                    })}
                    <AxisBottom
                      scale={scaleLinear({
                        domain: (yScales[dim.name] as ScaleLinear<number, number>).domain(),
                        range: [0, histogramWidth]
                      })}
                      top={histogramHeight}
                      numTicks={5}
                      tickLabelProps={() => ({
                        fontSize: 10,
                        textAnchor: 'middle',
                      })}
                    />
                  </Group>
                );
              } else {
                const categories = Array.from(new Set(fullPlotData.map((d) => d[dim.name] as string)));
                const categoryCounts = fullPlotData.reduce((acc, d) => {
                  const category = d[dim.name] as string;
                  acc[category] = (acc[category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                const barWidth = histogramWidth / categories.length;

                return (
                  <Group
                    key={dim.name}
                    top={mainHeight - 15}
                    left={(dimIndex * columnWidth) + histogramLeft}
                  >
                    {categories.map((category, catIndex) => {
                      const x = catIndex * barWidth;
                      const count = categoryCounts[category] || 0;
                      const height = (count / fullPlotData.length) * histogramHeight;
                      const y = histogramHeight - height;

                      return (
                        <rect
                          key={category}
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          fill={isBarSelected(dim.name, [category]) ? 'steelblue' : '#ccc'}
                          opacity={isBarSelected(dim.name, [category]) ? 0.8 : 0.5}
                          onClick={() => updateFilters(dim.name, [category])}
                          className="cursor-pointer hover:opacity-75"
                        />
                      );
                    })}
                    <AxisBottom
                      scale={scaleBand({
                        domain: categories,
                        range: [0, histogramWidth]
                      })}
                      top={histogramHeight}
                      tickLabelProps={() => ({
                        fontSize: 8,
                        textAnchor: 'end',
                      })}
                      tickComponent={({ x, y, formattedValue }) => (
                        <text
                          x={x}
                          y={y}
                          transform={`rotate(-45, ${x}, ${y})`}
                          dy="-0.3em"
                          dx="-0.3em"
                          fontSize={8}
                          textAnchor="end"
                        >
                          {formattedValue}
                        </text>
                      )}
                    />
                  </Group>
                );
              }
            })}
          </Group>
        </svg>
      </div>
    </div>
  );
};

export default ParallelCoordinatesPlot;