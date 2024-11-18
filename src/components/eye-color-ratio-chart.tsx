import React, { useEffect, useState } from 'react';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Grid } from '@visx/grid';
import { Line } from '@visx/shape';
import { Text } from '@visx/text';

interface RatioData {
  name: string;
  ratio: number;
  color: string;
}

const EyeColorRatioChart: React.FC = () => {
  const [data, setData] = useState<RatioData[]>([]);

  useEffect(() => {
    fetch('/data/MissingPersons.json')
      .then((response) => response.json())
      .then((mpData) => {
        const eyeColors: { [key: string]: number } = {};

        mpData.forEach((record: any) => {
          const physDesc = record.physicalDescription;
          if (physDesc) {
            const leftEye = physDesc.leftEyeColor?.localizedName || 'Unknown';
            const rightEye = physDesc.rightEyeColor?.localizedName || 'Unknown';
            eyeColors[leftEye] = (eyeColors[leftEye] || 0) + 1;
            eyeColors[rightEye] = (eyeColors[rightEye] || 0) + 1;
          }
        });

        const total = Object.values(eyeColors).reduce((a, b) => a + b, 0);
        const missingPersonPercentages: { [key: string]: number } = {};

        Object.entries(eyeColors).forEach(([color, count]) => {
          missingPersonPercentages[color] = (count / total) * 100;
        });

        // Population frequencies
        const populationFrequencies: { [key: string]: number } = {
          Brown: 45.0,
          Blue: 27.0,
          Hazel: 18.0,
          Green: 9.0,
          Other: 1.0,
        };

        // Eye color mapping
        const eyeColorMap: { [key: string]: string } = {
          Brown: '#8B4513',
          Blue: '#4169E1',
          Hazel: '#8E7618',
          Green: '#228B22',
          Other: '#808080',
        };

        // Calculate representation ratios
        const ratios = Object.keys(populationFrequencies).map((color) => {
          const observed = missingPersonPercentages[color] || 0;
          const expected = populationFrequencies[color];
          const ratio = observed / expected;
          return { 
            name: color, 
            ratio: parseFloat(ratio.toFixed(2)),
            color: eyeColorMap[color] || '#000000'
          };
        });

        setData(ratios);
      });
  }, []);

  // Define dimensions
  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };

  // Accessors
  const x = (d: RatioData) => d.name;
  const y = (d: RatioData) => d.ratio;

  // Scales
  const xScale = scaleBand<string>({
    domain: data.map(x),
    padding: 0.2,
    range: [margin.left, width - margin.right],
  });

  const yMax = Math.max(...data.map(y), 1);

  const yScale = scaleLinear<number>({
    domain: [0, yMax * 1.1],
    range: [height - margin.bottom, margin.top],
    nice: true,
  });

  const colorScale = scaleOrdinal<string, string>({
    domain: data.map(x),
    range: data.map(d => d.color),
  });

  return (
    <div>
      <h2>Eye Color Representation Ratio</h2>
      <svg width={width} height={height}>
        <Group>
          <Grid
            top={margin.top}
            left={margin.left}
            xScale={xScale}
            yScale={yScale}
            width={width - margin.left - margin.right}
            height={height - margin.top - margin.bottom}
            stroke="#e0e0e0"
            strokeDasharray="2,2"
          />
          {data.map((d) => {
            const barWidth = xScale.bandwidth();
            const barHeight = yScale(0) - yScale(y(d));
            const barX = xScale(x(d));
            const barY = yScale(y(d));

            return (
              <Bar
                key={`bar-${x(d)}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={colorScale(x(d))}
              />
            );
          })}
          {/* Reference line at y=1 */}
          <Line
            from={{ x: margin.left, y: yScale(1) }}
            to={{ x: width - margin.right, y: yScale(1) }}
            stroke="red"
            strokeDasharray="3,3"
          />
          <AxisLeft
            scale={yScale}
            top={0}
            left={margin.left}
            label="Representation Ratio (Observed / Expected)"
            labelProps={{ fontSize: 12, textAnchor: 'middle' }}
            numTicks={5}
          />
          <AxisBottom
            scale={xScale}
            top={height - margin.bottom}
            label="Eye Color"
            labelProps={{ fontSize: 12, textAnchor: 'middle' }}
          />
        </Group>
      </svg>
    </div>
  );
};

export default EyeColorRatioChart;
