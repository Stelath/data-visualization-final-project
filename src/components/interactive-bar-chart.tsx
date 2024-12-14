import React, { useEffect, useState } from 'react';
import { useMissingPersonsData } from '@/context/MissingPersonsContext';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { bin, extent } from 'd3-array';

interface Dimension {
  name: string;
  kind: 'numerical' | 'categorical';
}

interface InteractiveBarChartProps {
  selectedDimension: Dimension | null;
}

const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({ selectedDimension }) => {
  const { fullPlotData, filteredIndices, loading } = useMissingPersonsData();
  const [data, setData] = useState<number[]>([]);
  const [categoricalData, setCategoricalData] = useState<{ category: string; count: number }[]>([]);
  const [nationalAverage, setNationalAverage] = useState<number>(0);

  useEffect(() => {
    if (!selectedDimension || loading || !filteredIndices || !fullPlotData) {
      setData([]);
      setCategoricalData([]);
      return;
    }

    if (selectedDimension.kind === 'numerical') {
      const values = filteredIndices
        .map((index) => fullPlotData[index][selectedDimension.name] as number)
        .filter((value) => value != null && value > 0);

      setData(values);

      const allValues = fullPlotData
        .map((d) => d[selectedDimension.name] as number)
        .filter((value) => value != null && value > 0);

      const total = allValues.reduce((sum, val) => sum + val, 0);
      const average = total / allValues.length;
      setNationalAverage(average);
    } else {
      const categoryCounts: { [key: string]: number } = {};

      filteredIndices.forEach((index) => {
        const value = fullPlotData[index][selectedDimension.name] as string;
        if (value) {
          categoryCounts[value] = (categoryCounts[value] || 0) + 1;
        }
      });

      const categories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
        }))
        .sort((a, b) => b.count - a.count); // Sort by count in descending order

      setCategoricalData(categories);
    }
  }, [selectedDimension, fullPlotData, filteredIndices, loading]);

  if (!selectedDimension || loading) {
    return <div>Please select a dimension by clicking on it in the parallel coordinates plot.</div>;
  }

  if (selectedDimension.kind === 'numerical') {
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
    const width = 450;
    const height = 400;
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
        <h2>Distribution of {selectedDimension.name}</h2>
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
  } else if (selectedDimension.kind === 'categorical') {
    if (categoricalData.length === 0) {
      return <div>No data available for the selected dimension.</div>;
    }

    // Set up chart dimensions and scales
    const width = 450;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 60 };

    const xScale = scaleBand<string>({
      domain: categoricalData.map((d) => d.category),
      padding: 0.2,
      range: [margin.left, width - margin.right],
    });

    const yMax = Math.max(...categoricalData.map((d) => d.count));

    const yScale = scaleLinear<number>({
      domain: [0, yMax],
      nice: true,
      range: [height - margin.bottom, margin.top],
    });

    return (
      <div>
        <h2>Distribution of {selectedDimension.name}</h2>
        <svg width={width} height={height}>
          <Group>
            {categoricalData.map((d) => {
              const barWidth = xScale.bandwidth();
              const barHeight = yScale(0) - yScale(d.count);
              const barX = xScale(d.category);
              const barY = yScale(d.count);

              return (
                <Bar
                  key={`bar-${d.category}`}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="steelblue"
                />
              );
            })}
            <AxisLeft scale={yScale} left={margin.left} />
            <AxisBottom
              scale={xScale}
              top={height - margin.bottom}
              tickLabelProps={() => ({
                fontSize: 10,
                textAnchor: 'end',
                angle: -45,
                dy: '0.33em',
              })}
            />
          </Group>
        </svg>
      </div>
    );
  } else {
    return <div>Unsupported dimension type.</div>;
  }
};

export default InteractiveBarChart;