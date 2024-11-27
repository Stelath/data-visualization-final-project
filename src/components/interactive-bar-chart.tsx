import React, { useEffect, useState, useMemo } from 'react';
import { useMissingPersonsData } from '@/context/MissingPersonsContext';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { bin, extent } from 'd3-array';

type Dimension = 'age' | 'height' | 'weight' | 'yearsMissing';

interface InteractiveBarChartProps {
  selectedDimension: Dimension | null;
}

const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({ selectedDimension }) => {
  const { missingPersonsData, filteredIndices, loading } = useMissingPersonsData();
  const [data, setData] = useState<number[]>([]);
  const [nationalAverage, setNationalAverage] = useState<number>(0);

  useEffect(() => {
    if (!selectedDimension || loading || !filteredIndices || !missingPersonsData) {
      setData([]);
      return;
    }

    const getValue = (person: any): number => {
      switch (selectedDimension) {
        case 'age':
          return person.subjectIdentification?.currentMinAge || 0;
        case 'height':
          return person.subjectDescription?.heightFrom || 0;
        case 'weight':
          return person.subjectDescription?.weightFrom || 0;
        case 'yearsMissing':
          return (
            (Date.now() - new Date(person.sighting?.date || Date.now()).getTime()) /
            (1000 * 3600 * 24 * 365)
          );
        default:
          return 0;
      }
    };

    // Data for the filtered indices
    const values = filteredIndices
      .map((index) => getValue(missingPersonsData[index]))
      .filter((value) => value > 0);

    setData(values);

    // Calculate national average
    const allValues = missingPersonsData
      .map(getValue)
      .filter((value) => value > 0);

    const total = allValues.reduce((sum, val) => sum + val, 0);
    const average = total / allValues.length;
    setNationalAverage(average);
  }, [selectedDimension, missingPersonsData, filteredIndices, loading]);

  if (!selectedDimension || loading) {
    return <div>Please select a dimension by clicking on it in the parallel coordinates plot.</div>;
  }

  if (data.length === 0) {
    return <div>No data available for the selected dimension.</div>;
  }

  // Prepare histogram data
  const binCount = 20;
  const [minValue, maxValue] = extent(data) as [number, number];
  const binGenerator = bin()
    .domain([minValue, maxValue])
    .thresholds(binCount);
  const bins = binGenerator(data);

  // Set up chart dimensions and scales
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };

  const xScale = scaleLinear<number>({
    domain: [bins[0].x0 ?? 0, bins[bins.length - 1].x1 ?? 0],
    range: [margin.left, width - margin.right],
  });

  const yScale = scaleLinear<number>({
    domain: [0, Math.max(...bins.map((bin) => bin.length))],
    nice: true,
    range: [height - margin.bottom, margin.top],
  });

  const averageLineX = xScale(nationalAverage);

  return (
    <div>
      <h2>Distribution of {selectedDimension}</h2>
      <svg width={width} height={height}>
        <Group>
          {bins.map((bin, index) => {
            const barWidth = xScale(bin.x1 ?? 0) - xScale(bin.x0 ?? 0);
            const barHeight = yScale(0) - yScale(bin.length);
            const barX = xScale(bin.x0 ?? 0);
            const barY = yScale(bin.length);

            return (
              <Bar
                key={`bar-${index}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill="steelblue"
              />
            );
          })}
          {/* National average line */}
          <line
            x1={averageLineX}
            x2={averageLineX}
            y1={margin.top}
            y2={height - margin.bottom}
            stroke="red"
            strokeDasharray="5,5"
          />
          <AxisLeft scale={yScale} left={margin.left} />
          <AxisBottom
            scale={xScale}
            top={height - margin.bottom}
            numTicks={10}
            tickFormat={(value) => value.toFixed(1)}
          />
        </Group>
      </svg>
    </div>
  );
};

export default InteractiveBarChart;