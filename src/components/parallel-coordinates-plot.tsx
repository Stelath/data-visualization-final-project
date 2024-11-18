import React, { useEffect, useState, useMemo } from 'react';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { useMissingPersonsData } from '@/context/MissingPersonsContext';
import { extent, bin } from 'd3-array';

const ParallelCoordinatesPlot: React.FC = () => {
  const { missingPersonsData, setFilteredData } = useMissingPersonsData();
  const [sampleSize, setSampleSize] = useState(1000);
  const [data, setData] = useState([]);
  const [sampledData, setSampledData] = useState([]);
  const [selectedRanges, setSelectedRanges] = useState({});
  const [filteredData, setLocalFilteredData] = useState([]);

  const dimensions = ["age", "height", "weight", "yearsMissing"];
  
  const margin = { top: 20, right: 40, bottom: 200, left: 60 };
  const plotWidth = 1000 - margin.left - margin.right;
  const plotHeight = 600 - margin.top - margin.bottom;
  const mainHeight = 300;
  const histogramHeight = 100;

  // Consistent subsampling function
  const subsampleData = (fullData, size) => {
    if (fullData.length <= size) return fullData;
    const step = Math.floor(fullData.length / size);
    return fullData.filter((_, index) => index % step === 0).slice(0, size);
  };
  
  useEffect(() => {
    if (!missingPersonsData) return;
    console.log(missingPersonsData[0])

    const preparedData = missingPersonsData
      .map((d) => ({
        age: d.subjectIdentification?.currentMinAge || null,
        height: d.subjectDescription?.heightFrom || null,
        weight: d.subjectDescription?.weightFrom || null,
        yearsMissing: (Date.now() - new Date(d.sighting?.date || Date.now()).getTime()) / 
          (1000 * 3600 * 24 * 365),
        gender: d.subjectDescription?.sex?.localizedName || "Unknown",
        race: d.subjectDescription?.primaryEthnicity?.localizedName || "Unknown",
        state: d.sighting?.address?.state?.name || "Unknown"
      }))
      .filter(d => 
        d.age !== null && 
        d.height !== null && 
        d.weight !== null && 
        d.yearsMissing !== null
      )
      .sort((a, b) => a.age - b.age); // Sort for consistent sampling

    setData(preparedData);
    const sampled = subsampleData(preparedData, sampleSize);
    setSampledData(sampled);
    setLocalFilteredData(sampled);
  }, [missingPersonsData, sampleSize]);

  const xScale = useMemo(() => scalePoint({
    range: [0, plotWidth],
    domain: dimensions,
    padding: 0.5,
  }), [plotWidth]);

  const yScales = useMemo(() => {
    const scales = {};
    dimensions.forEach((dim) => {
      scales[dim] = scaleLinear({
        domain: extent(data, (d) => d[dim]),
        range: [mainHeight, 0],
        nice: true,
      });
    });
    return scales;
  }, [data, mainHeight]);

  const histogramScales = useMemo(() => {
    const scales = {};
    dimensions.forEach((dim) => {
      const values = data.map(d => d[dim]);
      const binGenerator = bin().domain(extent(values)).thresholds(20);
      const bins = binGenerator(values);
      
      scales[dim] = {
        x: scaleLinear({
          domain: extent(values),
          range: [0, plotWidth / dimensions.length - 40],
          nice: true,
        }),
        y: scaleLinear({
          domain: [0, Math.max(...bins.map(b => b.length))],
          range: [histogramHeight, 0],
        }),
      };
    });
    return scales;
  }, [data, plotWidth, dimensions]);

  const updateFilters = (dimension, range) => {
    const newSelectedRanges = { ...selectedRanges };
    
    // If dimension doesn't exist in selectedRanges, initialize it
    if (!newSelectedRanges[dimension]) {
      newSelectedRanges[dimension] = [range];
    } else {
      // Check if the range is already selected
      const rangeIndex = newSelectedRanges[dimension].findIndex(
        ([min, max]) => min === range[0] && max === range[1]
      );
      
      if (rangeIndex >= 0) {
        // Remove the range if it's already selected
        newSelectedRanges[dimension] = [
          ...newSelectedRanges[dimension].slice(0, rangeIndex),
          ...newSelectedRanges[dimension].slice(rangeIndex + 1)
        ];
        // Remove the dimension if no ranges are selected
        if (newSelectedRanges[dimension].length === 0) {
          delete newSelectedRanges[dimension];
        }
      } else {
        // Add the new range
        newSelectedRanges[dimension] = [...newSelectedRanges[dimension], range];
      }
    }

    setSelectedRanges(newSelectedRanges);

    // Filter data based on all active ranges
    const newFilteredData = sampledData.filter(d => 
      Object.entries(newSelectedRanges).every(([dim, ranges]) => {
        if (!ranges || ranges.length === 0) return true;
        const value = d[dim];
        return ranges.some(([min, max]) => value >= min && value <= max);
      })
    );

    setLocalFilteredData(newFilteredData);
    setFilteredData(newFilteredData);
  };

  const isBarSelected = (dimension, range) => {
    if (!selectedRanges[dimension]) return false;
    return selectedRanges[dimension].some(([min, max]) => 
      min === range[0] && max === range[1]
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Missing Persons Analysis</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm">
            Sample Size:
            <input
              type="number"
              value={sampleSize}
              onChange={(e) => setSampleSize(Math.max(100, Math.min(5000, parseInt(e.target.value) || 1000)))}
              className="ml-2 w-24 px-2 py-1 border rounded"
            />
          </label>
          <p className="text-sm text-gray-600">
            Showing {filteredData.length} of {sampledData.length} sampled records
          </p>
        </div>
      </div>

      <div className="relative">
        <svg width={plotWidth + margin.left + margin.right} height={plotHeight + margin.top + margin.bottom}>
          <Group top={margin.top} left={margin.left}>
            {filteredData.map((d, i) => (
              <LinePath
                key={i}
                data={dimensions.map(dim => ({
                  x: xScale(dim) || 0,
                  y: yScales[dim](d[dim]),
                }))}
                x={d => d.x}
                y={d => d.y}
                stroke="steelblue"
                strokeWidth={1}
                strokeOpacity={0.2}
              />
            ))}

            {dimensions.map((dim) => (
              <Group key={dim} left={xScale(dim)}>
                <AxisLeft
                  scale={yScales[dim]}
                  label={dim}
                  labelProps={{
                    fontSize: 12,
                    textAnchor: "middle",
                    dy: -20,
                  }}
                  stroke="#1b1a1e"
                  tickStroke="#1b1a1e"
                  tickLabelProps={() => ({
                    fontSize: 10,
                    textAnchor: "end",
                    dx: -5,
                  })}
                />
              </Group>
            ))}

            {dimensions.map((dim, i) => {
              const binGenerator = bin()
                .domain(histogramScales[dim].x.domain())
                .thresholds(20);
              const bins = binGenerator(data.map(d => d[dim]));
              const barWidth = (plotWidth / dimensions.length - 40) / bins.length;

              return (
                <Group 
                  key={dim} 
                  left={xScale(dim) - (plotWidth / dimensions.length - 40) / 2}
                  top={mainHeight + 50}
                >
                  {bins.map((b, j) => (
                    <rect
                      key={j}
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
      
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Click histogram bars to select/deselect ranges.
          Selected ranges: {
            Object.entries(selectedRanges)
              .filter(([_, ranges]) => ranges && ranges.length > 0)
              .map(([dim, ranges]) => 
                `${dim}: ${ranges.map(([min, max]) => 
                  `${min.toFixed(1)}-${max.toFixed(1)}`
                ).join(' or ')}`
              ).join(', ')
          }
        </p>
        {Object.keys(selectedRanges).length > 0 && (
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setSelectedRanges({});
              setLocalFilteredData(sampledData);
              setFilteredData(sampledData);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ParallelCoordinatesPlot;