import React, { useState, useMemo } from 'react';
import { ScaleLinear, ScalePoint } from 'd3-scale';
import { scalePoint, scaleLinear, scaleBand } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useMissingPersonsData } from '@/context/MissingPersonsContext';
import { extent, bin } from 'd3-array';

// Define dimension kinds
type DimensionKind = 'numerical' | 'categorical';

// Update Dimension type
type Dimension = {
  name: string;
  kind: DimensionKind;
};

type PlotDataPoint = {
  index: number;
  age: number;
  yearsMissing: number;
  height: number;
  weight: number;
  eyeColor: string;
  race: string;
  gender: string;
  state: string;
  [key: string]: number | string;
};

// Dimension configurations
const dimensions: Dimension[] = [
  { name: 'age', kind: 'numerical' },
  { name: 'yearsMissing', kind: 'numerical' },
  { name: 'height', kind: 'numerical' },
  { name: 'weight', kind: 'numerical' },
  { name: 'eyeColor', kind: 'categorical' },
  { name: 'race', kind: 'categorical' },
];

type DimensionScale = ScaleLinear<number, number> | ScalePoint<string>;
type HistogramScale = {
  x: DimensionScale;
  y: ScaleLinear<number, number>;
};

interface ParallelCoordinatesPlotProps {
  onDimensionClick?: (dimension: Dimension) => void;
}

const ParallelCoordinatesPlot: React.FC<ParallelCoordinatesPlotProps> = ({
  onDimensionClick,
}) => {
  const {
    missingPersonsData,
    filteredIndices,
    setFilteredIndices,
    loading,
  } = useMissingPersonsData();
  const [sampleSize, setSampleSize] = useState(1000);
  const [selectedRanges, setSelectedRanges] = useState<{
    [key: string]: ([number, number] | [string])[];
  }>({});

  const margin = { top: 20, right: 40, bottom: 200, left: 60 };
  const plotWidth = 900 - margin.left - margin.right;
  const plotHeight = 275 - margin.top - margin.bottom;
  const mainHeight = 200;
  const histogramHeight = 100;

  const fullPlotData = useMemo<PlotDataPoint[]>(() => {
    if (!missingPersonsData) return [];
    return missingPersonsData.map((d, index) => ({
      index,
      age: d.subjectIdentification?.computedMissingMinAge || 0,
      yearsMissing:
        (Date.now() - new Date(d.sighting?.date || Date.now()).getTime()) /
        (1000 * 3600 * 24 * 365),
      height: d.subjectDescription?.heightFrom || 0,
      weight: d.subjectDescription?.weightFrom || 0,
      eyeColor: d.physicalDescription?.leftEyeColor?.localizedName || 'Unknown',
      race: d.subjectDescription?.primaryEthnicity?.localizedName === 'Hawaiian / Pacific Islander'
      ? 'Hawaiian / PI'
      : d.subjectDescription?.primaryEthnicity?.localizedName === 'Black / African American'
      ? 'African American' 
      : d.subjectDescription?.primaryEthnicity?.localizedName === 'American Indian / Alaska Native'
      ? 'Native Amer'
      : d.subjectDescription?.primaryEthnicity?.localizedName === 'Hispanic / Latino'
      ? 'Hispanic'
      : d.subjectDescription?.primaryEthnicity?.localizedName === 'White / Caucasian'
      ? 'Caucasian'
      : d.subjectDescription?.primaryEthnicity?.localizedName || 'Unknown',
      gender: d.subjectDescription?.sex?.localizedName || 'Unknown',
      state: d.sighting?.address?.state?.name || 'Unknown',
    }));
  }, [missingPersonsData]);

  const sampledPlotData = useMemo(() => {
    const step = Math.max(1, Math.floor(fullPlotData.length / sampleSize));
    return fullPlotData
      .map((d, index) => ({
        ...d,
        isFiltered: filteredIndices?.includes(index) || false
      }))
      .filter((_, idx) => idx % step === 0)
      .filter(
        (d): d is PlotDataPoint & { isFiltered: boolean } =>
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

  const updateFilters = (
    dimension: string, 
    range: [number, number] | [string]
  ) => {
    const newSelectedRanges = { ...selectedRanges };
    const dim = dimensions.find(d => d.name === dimension);
    
    if (!dim) return;
  
    if (!newSelectedRanges[dimension]) {
      newSelectedRanges[dimension] = [range];
    } else {
      const ranges = newSelectedRanges[dimension];
      if (ranges) {
        if (dim.kind === 'numerical') {
          const rangeIndex = ranges.findIndex(
            ([min, max]) => min === range[0] && max === range[1]
          );
          if (rangeIndex >= 0) {
            ranges.splice(rangeIndex, 1);
            if (ranges.length === 0) {
              delete newSelectedRanges[dimension];
            }
          } else {
            ranges.push(range as [number, number]);
          }
        } else {
          // Handle categorical values
          const valueIndex = ranges.findIndex(([val]) => val === range[0]);
          if (valueIndex >= 0) {
            ranges.splice(valueIndex, 1);
            if (ranges.length === 0) {
              delete newSelectedRanges[dimension];
            }
          } else {
            ranges.push(range as [string]);
          }
        }
      }
    }
  
    setSelectedRanges(newSelectedRanges);
  
    let newFilteredIndices = fullPlotData.map((_, index) => index);
  
    Object.entries(newSelectedRanges).forEach(([dim, ranges]) => {
      if (ranges) {
        const dimension = dimensions.find(d => d.name === dim);
        if (!dimension) return;
  
        newFilteredIndices = newFilteredIndices.filter((index) => {
          const value = fullPlotData[index][dim];
          if (dimension.kind === 'numerical') {
            return ranges.some(
              ([min, max]) => 
                (value as number) >= (min as number) && 
                (value as number) <= (max as number)
            );
          } else {
            // Handle categorical values
            return ranges.some(([category]) => value === category);
          }
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
                setSampleSize(Math.max(100, Math.min(fullPlotData.length, parseInt(e.target.value) || 1000)))
              }
              className="ml-2 px-2 py-1 border rounded"
            />
          </label>
          <button onClick={clearFilters} className="ml-4 px-4 py-2 bg-blue-500 text-white rounded">
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
            {sampledPlotData.map((d, i) => {
              // Check if the point's index is in filteredIndices
              const isFiltered = filteredIndices.includes(d.index);

              return (
                <LinePath<{ x: number; y: number }>
                  key={i}
                  data={dimensions.map((dim) => {
                    const x = xScale(dim.name) || 0;
                    let y;
                    if (dim.kind === 'numerical') {
                      y = (yScales[dim.name] as ScaleLinear<number, number>)(d[dim.name] as number);
                    } else {
                      y = (yScales[dim.name] as ScalePoint<string>)(d[dim.name] as string) || 0;
                    }
                    return { x, y };
                  })}
                  x={(p) => p.x}
                  y={(p) => p.y}
                  stroke={d.gender.toLowerCase().includes('female') ? '#FF69B4' : '#4169E1'}
                  strokeWidth={1}
                  strokeOpacity={isFiltered ? 0.2 : 0.01} // Lower opacity for filtered out lines
                />
              );
            })}

  
            {/* Axes */}
            {dimensions.map((dim) => (
              <Group key={dim.name} left={xScale(dim.name) || 0}>
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
              </Group>
            ))}
  
            {/* Histograms */}
            {dimensions.map((dim, dimIndex) => {
              const columnWidth = plotWidth / dimensions.length;
              const histogramWidth = columnWidth * 0.8; // Make histogram 50% of column width 
              const histogramLeft = (columnWidth - histogramWidth) / 2; // Center histogram in column

              if (dim.kind === 'numerical') {
                const binGenerator = bin()
                  .domain((yScales[dim.name] as ScaleLinear<number, number>).domain())
                  .thresholds(20);
                const bins = binGenerator(fullPlotData.map((d) => d[dim.name] as number));
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
                      const y = histogramHeight * (1 - b.length / fullPlotData.length);
                      const height = histogramHeight - y;

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
                      numTicks={5} // Reduced number of ticks for numerical data
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
                      const y = histogramHeight * (1 - categoryCounts[category] / fullPlotData.length);
                      const height = histogramHeight - y;

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