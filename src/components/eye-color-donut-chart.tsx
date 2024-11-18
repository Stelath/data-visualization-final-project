import React, { useEffect, useState } from 'react';
import { Pie } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { Text } from '@visx/text';
import { useMissingPersonsData } from '@/context/MissingPersonsContext';

interface EyeColorData {
  name: string;
  value: number;
}

const COLORS: { [key: string]: string } = {
  Blue: '#4B9CD3',
  Brown: '#654321',
  Green: '#228B22',
  Gray: '#808080',
  Hazel: '#8E7618',
  Other: '#A9A9A9',
  Black: '#000000',
  Unknown: '#D3D3D3',
};

const EyeColorDonutChart: React.FC = () => {
  const { missingPersonsData, loading } = useMissingPersonsData();
  const [data, setData] = useState<EyeColorData[]>([]);

  useEffect(() => {
    if (loading || !missingPersonsData) return;

    const eyeColors: { [key: string]: number } = {};

    missingPersonsData.forEach((record: any) => {
      const physDesc = record.physicalDescription;
      if (physDesc) {
        const leftEye = physDesc.leftEyeColor?.localizedName || 'Unknown';
        const rightEye = physDesc.rightEyeColor?.localizedName || 'Unknown';
        eyeColors[leftEye] = (eyeColors[leftEye] || 0) + 1;
        eyeColors[rightEye] = (eyeColors[rightEye] || 0) + 1;
      }
    });

    // Combine rare colors into 'Other'
    const total = Object.values(eyeColors).reduce((a, b) => a + b, 0);
    const threshold = total * 0.01; // 1%
    let otherTotal = 0;

    const filteredEyeColors = Object.entries(eyeColors)
      .filter(([color, count]) => {
        if (count < threshold || !COLORS[color]) {
          otherTotal += count;
          return false;
        }
        return true;
      })
      .map(([name, value]) => ({ name, value }));

    if (otherTotal > 0) {
      filteredEyeColors.push({ name: 'Other', value: otherTotal });
    }

    setData(filteredEyeColors);
  }, [missingPersonsData, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2 - 40;

  const colorScale = scaleOrdinal<string, string>({
    domain: data.map((d) => d.name),
    range: data.map((d) => COLORS[d.name] || COLORS['Other']),
  });

  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div>
      <h2>Eye Color Distribution of Missing Persons</h2>
      <svg width={width} height={height}>
        <Group top={height / 2} left={width / 2}>
          <Pie
            data={data}
            pieValue={(d) => d.value}
            outerRadius={radius}
            innerRadius={radius - 50}
            padAngle={0.01}
          >
            {(pie) =>
              pie.arcs.map((arc, index) => {
                const [centroidX, centroidY] = pie.path.centroid(arc);
                const arcPath = pie.path(arc) as string;
                const color = colorScale(arc.data.name);
                return (
                  <g key={`arc-${arc.data.name}-${index}`}>
                    <path d={arcPath} fill={color} />
                    <Text
                      x={centroidX}
                      y={centroidY}
                      dy=".33em"
                      fill="white"
                      fontSize={12}
                      textAnchor="middle"
                    >
                      {`${((arc.data.value / total) * 100).toFixed(1)}%`}
                    </Text>
                  </g>
                );
              })
            }
          </Pie>
        </Group>
      </svg>
      {/* Add legend here if needed */}
    </div>
  );
};

export default EyeColorDonutChart;
